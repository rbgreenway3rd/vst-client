import React, { useRef, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  CircularProgress,
} from "@mui/material";
import { getSensors } from "../../services/vst/api_vst";

class VSTWebRTCClient {
  constructor(vstServerUrl) {
    this.vstUrl = vstServerUrl; // e.g., 'http://192.168.1.26:30000/api'
    this.peerId = this.generateUUID();
    this.mediaSessionId = null;
    this.streamId = null; // Store for stats endpoint header
    this.peerConnection = null;
    this.iceCandidateInterval = null;
    this.videoElement = null;
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  async getIceServers() {
    try {
      const response = await fetch(
        `${this.vstUrl}/v1/live/iceServers?peerId=${this.peerId}`
      );
      const data = await response.json();
      console.log("ICE servers from VST:", data);
      return data.iceServers || [];
    } catch (error) {
      console.warn("Could not fetch ICE servers from VST:", error);
      // Fallback to public STUN servers
      return [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ];
    }
  }

  async startStream(streamId, videoElement) {
    this.videoElement = videoElement;
    this.streamId = streamId; // Store streamId for stats endpoint

    try {
      console.log("Starting VST WebRTC stream...");
      console.log("Peer ID:", this.peerId);
      console.log("Stream ID:", streamId);

      // Get ICE servers (STUN/TURN)
      const iceServers = await this.getIceServers();

      // Create RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers,
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      // Handle incoming media track
      this.peerConnection.ontrack = (event) => {
        console.log("✅ Received remote track:", event.track.kind);
        if (this.videoElement && event.streams[0]) {
          this.videoElement.srcObject = event.streams[0];
          console.log("✅ Video element source set");
        }
      };

      // Handle ICE candidates (send to server)
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Local ICE candidate generated:", event.candidate.type);
          this.sendIceCandidate(event.candidate);
        }
      };

      // Handle ICE gathering state
      this.peerConnection.onicegatheringstatechange = () => {
        console.log(
          "ICE gathering state:",
          this.peerConnection.iceGatheringState
        );
      };

      // Handle ICE connection state
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          this.peerConnection.iceConnectionState
        );
        if (this.peerConnection.iceConnectionState === "connected") {
          console.log("✅ ICE connection established!");
        } else if (this.peerConnection.iceConnectionState === "failed") {
          console.error("❌ ICE connection failed");
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", this.peerConnection.connectionState);
        if (this.peerConnection.connectionState === "connected") {
          console.log("✅ WebRTC connection established!");
        }
      };

      // Add transceivers to receive video and audio
      const videoTransceiver = this.peerConnection.addTransceiver("video", {
        direction: "recvonly",
      });
      this.peerConnection.addTransceiver("audio", {
        direction: "recvonly",
      });

      // Set H.264 preference
      try {
        const videoCodecs = RTCRtpReceiver.getCapabilities("video").codecs;
        const h264Codecs = videoCodecs.filter(
          (codec) => codec.mimeType.toLowerCase() === "video/h264"
        );
        if (h264Codecs.length > 0 && videoTransceiver.setCodecPreferences) {
          videoTransceiver.setCodecPreferences([...h264Codecs, ...videoCodecs]);
          console.log("Set H.264 as preferred codec");
        }
      } catch (err) {
        console.warn("Could not set codec preferences:", err);
      }

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      console.log("Created SDP offer");

      // Send offer to VST
      console.log("Sending offer to VST...");
      const startResponse = await fetch(`${this.vstUrl}/v1/live/stream/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientIpAddr: window.location.hostname,
          peerId: this.peerId,
          streamId: streamId,
          options: {
            quality: "auto",
            rtptransport: "udp",
            timeout: 60,
            overlay: {
              objectId: [],
              color: "red",
              thickness: 6,
              debug: false,
              needBbox: false,
              needTripwire: false,
              needRoi: false,
              opacity: 255,
            },
          },
          sessionDescription: {
            type: offer.type,
            sdp: offer.sdp,
          },
        }),
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(
          `VST stream start failed: ${startResponse.status} - ${errorText}`
        );
      }

      const startData = await startResponse.json();
      console.log("VST response:", startData);

      // Extract session description and mediaSessionId
      let answerSdp, answerType;
      if (startData.sessionDescription) {
        // Response format: { sessionDescription: { type, sdp }, mediaSessionId }
        answerType = startData.sessionDescription.type;
        answerSdp = startData.sessionDescription.sdp;
        this.mediaSessionId = startData.mediaSessionId;
      } else if (startData.sdp) {
        // Alternative format: { type, sdp, mediaSessionId }
        answerType = startData.type;
        answerSdp = startData.sdp;
        this.mediaSessionId = startData.mediaSessionId;
      } else {
        throw new Error("No SDP answer in VST response");
      }

      console.log("Media Session ID:", this.mediaSessionId);

      // Check ICE candidates in SDP
      const candidateCount = (answerSdp.match(/a=candidate:/g) || []).length;
      console.log(
        `SDP answer contains ${candidateCount} ICE candidates`,
        candidateCount === 0 ? "⚠️" : "✅"
      );

      // Set remote description (answer from server)
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: answerType,
          sdp: answerSdp,
        })
      );
      console.log("Set remote SDP answer");

      // Start polling for ICE candidates from server
      this.startIceCandidatePolling();

      console.log("✅ Stream started successfully");
      return true;
    } catch (error) {
      console.error("❌ Error starting stream:", error);
      this.cleanup();
      throw error;
    }
  }

  async sendIceCandidate(candidate) {
    try {
      const response = await fetch(`${this.vstUrl}/v1/live/iceCandidate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peerId: this.peerId,
          candidate: {
            candidate: candidate.candidate,
            sdpMid: candidate.sdpMid,
            sdpMLineIndex: candidate.sdpMLineIndex,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          `Failed to send ICE candidate: ${response.status} - ${errorText}`
        );
      } else {
        console.log("✅ Sent ICE candidate to VST");
      }
    } catch (error) {
      console.warn("Error sending ICE candidate:", error);
    }
  }

  startIceCandidatePolling() {
    // Poll for ICE candidates from server every 500ms
    console.log("Starting ICE candidate polling...");
    this.iceCandidateInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${this.vstUrl}/v1/live/iceCandidate?peerId=${this.peerId}`
        );

        if (!response.ok) {
          // 501 means endpoint not implemented - stop polling
          if (response.status === 501) {
            console.log("ICE candidate polling not supported by VST (501)");
            clearInterval(this.iceCandidateInterval);
            this.iceCandidateInterval = null;
            return;
          }
          return;
        }

        const candidates = await response.json();

        if (Array.isArray(candidates) && candidates.length > 0) {
          console.log(`Received ${candidates.length} remote ICE candidates`);
          for (const candidate of candidates) {
            if (candidate && candidate.candidate) {
              await this.peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
              console.log("Added remote ICE candidate");
            }
          }
        }
      } catch (error) {
        console.warn("Error polling ICE candidates:", error);
      }
    }, 500);
  }

  async stopStream() {
    console.log("Stopping stream...");
    this.cleanup();

    // Stop stream on server
    if (this.mediaSessionId) {
      try {
        await fetch(`${this.vstUrl}/v1/live/stream/stop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stream_id: this.mediaSessionId,
          }),
        });
        console.log("Stream stopped on server");
      } catch (error) {
        console.error("Error stopping stream on server:", error);
      }
    }
  }

  async getStreamStats() {
    if (!this.mediaSessionId || !this.peerId) return null;
    try {
      // API requires peerId and mediaSessionId as query params, streamId as header
      const url = new URL(`${this.vstUrl}/v1/live/stream/stats`);
      url.searchParams.append("peerId", this.peerId);
      url.searchParams.append("mediaSessionId", this.mediaSessionId);

      const response = await fetch(url.toString(), {
        headers: {
          streamId: this.streamId || "",
        },
      });

      if (response.ok) {
        return await response.json();
      }
      // Don't log 400 errors as they're expected when stats endpoint is not available
      if (response.status !== 400) {
        console.warn(
          `Stream stats request failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.warn("Error getting stream stats:", error);
    }
    return null;
  }

  async getStreamStatus() {
    if (!this.mediaSessionId || !this.peerId) return null;
    try {
      // API likely requires peerId and mediaSessionId as query params, streamId as header
      const url = new URL(`${this.vstUrl}/v1/live/stream/status`);
      url.searchParams.append("peerId", this.peerId);
      url.searchParams.append("mediaSessionId", this.mediaSessionId);

      const response = await fetch(url.toString(), {
        headers: {
          streamId: this.streamId || "",
        },
      });

      if (response.ok) {
        return await response.json();
      }
      // Don't log 400 errors as they're expected when status endpoint is not available
      if (response.status !== 400) {
        console.warn(
          `Stream status request failed with status ${response.status}`
        );
      }
    } catch (error) {
      console.warn("Error getting stream status:", error);
    }
    return null;
  }

  async pauseStream() {
    if (!this.mediaSessionId) return false;
    try {
      console.log("Pausing stream...");
      const response = await fetch(`${this.vstUrl}/v1/live/stream/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream_id: this.mediaSessionId,
        }),
      });
      if (response.ok) {
        console.log("✅ Stream paused on server");
        return true;
      } else {
        console.warn("Failed to pause stream:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error pausing stream:", error);
      return false;
    }
  }

  async resumeStream() {
    if (!this.mediaSessionId) return false;
    try {
      console.log("Resuming stream...");
      const response = await fetch(`${this.vstUrl}/v1/live/stream/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream_id: this.mediaSessionId,
        }),
      });
      if (response.ok) {
        console.log("✅ Stream resumed on server");
        // Force video element to play
        if (this.videoElement) {
          this.videoElement
            .play()
            .catch((e) => console.warn("Video play error:", e));
        }
        return true;
      } else {
        console.warn("Failed to resume stream:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Error resuming stream:", error);
      return false;
    }
  }

  async captureSnapshot(streamId) {
    try {
      const response = await fetch(
        `${this.vstUrl}/v1/live/stream/${streamId}/picture`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (error) {
      console.error("Error capturing snapshot:", error);
    }
    return null;
  }

  cleanup() {
    // Stop ICE candidate polling
    if (this.iceCandidateInterval) {
      clearInterval(this.iceCandidateInterval);
      this.iceCandidateInterval = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear video element
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }

    this.mediaSessionId = null;
  }
}

// React Component
const LiveStream2 = ({ baseUrl, authToken }) => {
  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const statsIntervalRef = useRef(null);

  const [selectedSensor, setSelectedSensor] = useState("");
  const [sensors, setSensors] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [streamStatus, setStreamStatus] = useState(null);

  // Fetch sensors on mount
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await getSensors(baseUrl, authToken);
        const allSensors = Array.isArray(data) ? data : data.sensors || [];
        // Filter out removed sensors (only show active/offline sensors)
        const activeSensors = allSensors.filter((s) => s.state !== "removed");
        setSensors(activeSensors);
      } catch (error) {
        console.error("Failed to fetch sensors:", error);
        setError("Failed to fetch sensors: " + error.message);
      }
    };
    fetchSensors();
  }, [baseUrl, authToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stopStream();
      }
    };
  }, []);

  const handleConnect = async () => {
    if (!selectedSensor) {
      setError("Please select a sensor first");
      return;
    }

    setError("");
    setIsConnecting(true);

    try {
      // Force cleanup any existing client first
      if (clientRef.current) {
        console.log("Cleaning up previous connection...");
        await clientRef.current.stopStream();
        clientRef.current = null;
      }

      // Create new client instance
      clientRef.current = new VSTWebRTCClient(baseUrl);

      // Start stream
      await clientRef.current.startStream(selectedSensor, videoRef.current);

      setIsConnected(true);
      setIsConnecting(false);

      // Start polling for stats and status
      statsIntervalRef.current = setInterval(async () => {
        try {
          const streamStats = await clientRef.current.getStreamStats();
          const status = await clientRef.current.getStreamStatus();
          setStats(streamStats);
          setStreamStatus(status);
        } catch (err) {
          console.error("Failed to fetch stats/status:", err);
        }
      }, 1000);
    } catch (err) {
      console.error("Connection failed:", err);

      // Provide helpful error message
      let errorMsg = "Failed to start stream: " + err.message;
      if (err.message.includes("connections limit reached")) {
        errorMsg +=
          "\n\n💡 VST can only handle 1 connection at a time.\n" +
          "• Close VST's official web UI if open\n" +
          "• Close other browser tabs with this client\n" +
          "• Or increase max_webrtc_out_connections in vst_config.json";
      }

      setError(errorMsg);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    if (clientRef.current) {
      await clientRef.current.stopStream();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsPaused(false);
    setStats(null);
    setStreamStatus(null);
  };

  const handlePauseResume = async () => {
    if (!clientRef.current) return;

    try {
      if (isPaused) {
        // Resume
        const success = await clientRef.current.resumeStream();
        if (success) {
          setIsPaused(false);
        } else {
          setError("Failed to resume stream");
        }
      } else {
        // Pause
        const success = await clientRef.current.pauseStream();
        if (success) {
          setIsPaused(true);
        } else {
          setError("Failed to pause stream");
        }
      }
    } catch (err) {
      console.error("Error toggling pause/resume:", err);
      setError(
        `Failed to ${isPaused ? "resume" : "pause"} stream: ${err.message}`
      );
    }
  };

  const handleSensorChange = async (e) => {
    if (isConnected) {
      await handleDisconnect();
    }
    setSelectedSensor(e.target.value);
  };

  const handleTakeSnapshot = async () => {
    if (!clientRef.current) return;

    try {
      const blob = await clientRef.current.takeSnapshot();
      const url = URL.createObjectURL(blob);

      // Create a download link
      const a = document.createElement("a");
      a.href = url;
      a.download = `snapshot-${selectedSensor}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to take snapshot:", err);
      setError("Failed to capture snapshot: " + err.message);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Live Stream via WebRTC (VST Protocol)
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Sensor</InputLabel>
          <Select
            value={selectedSensor}
            onChange={handleSensorChange}
            disabled={isConnecting || isConnected}
          >
            {sensors.map((s) => {
              const isOffline = s.state === "offline" || s.state === "OFFLINE";
              const displayName = isOffline
                ? `${s.name} (${s.sensorId || s.id}) - OFFLINE`
                : `${s.name} (${s.sensorId || s.id})`;

              return (
                <MenuItem
                  key={s.sensorId || s.id}
                  value={s.sensorId || s.id}
                  sx={
                    isOffline
                      ? { color: "text.secondary", fontStyle: "italic" }
                      : {}
                  }
                >
                  {displayName}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
          {!isConnected ? (
            <Button
              variant="contained"
              onClick={handleConnect}
              disabled={!selectedSensor || isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
              <Button
                variant="outlined"
                color={isPaused ? "success" : "warning"}
                onClick={handlePauseResume}
              >
                {isPaused ? "▶ Resume" : "⏸ Pause"}
              </Button>
              <Button variant="outlined" onClick={handleTakeSnapshot}>
                📷 Snapshot
              </Button>
            </>
          )}

          {isConnecting && <CircularProgress size={24} />}
        </Box>

        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#ffebee",
              borderRadius: 1,
              border: "1px solid #ef5350",
            }}
          >
            <Typography
              color="error"
              sx={{
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </Typography>
          </Box>
        )}

        {isConnected && (stats || streamStatus) && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              backgroundColor: "#e3f2fd",
              borderRadius: 1,
              border: "1px solid #2196f3",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
              Stream Info
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {streamStatus && (
                <Typography variant="body2">
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color:
                        streamStatus.status === "PLAYING"
                          ? "green"
                          : streamStatus.status === "PAUSED"
                          ? "orange"
                          : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {streamStatus.status}
                  </span>
                </Typography>
              )}
              {stats && (
                <>
                  <Typography variant="body2">
                    <strong>FPS:</strong> {stats.framerate?.toFixed(1) || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Bitrate:</strong>{" "}
                    {stats.bitrate
                      ? `${(stats.bitrate / 1000000).toFixed(2)} Mbps`
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Encoded Frames:</strong>{" "}
                    {stats.totalEncodedFrames || 0}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Decoded Frames:</strong>{" "}
                    {stats.totalDecodedFrames || 0}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width="100%"
          style={{
            maxHeight: 500,
            backgroundColor: "#000",
            display: isConnected ? "block" : "none",
          }}
        />

        {!isConnected && !isConnecting && !error && (
          <Box
            sx={{
              width: "100%",
              height: 300,
              backgroundColor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography color="textSecondary">
              Select a sensor and click Connect to start streaming
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStream2;
