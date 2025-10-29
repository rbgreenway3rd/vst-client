import React, { useRef, useEffect, useState, useCallback } from "react";
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
import {
  getSensors,
  getSensorStatus,
  startLiveStream,
  stopLiveStream,
  getLiveStreamConfiguration,
  getLiveStreamVersion,
} from "../utils/api";

const LiveStream = ({ baseUrl, authToken }) => {
  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const streamIdRef = useRef(null); // This will store the mediaSessionId from VST
  const peerIdRef = useRef(null); // Store the peerId for ICE candidate exchange
  const iceCandidateCheckIntervalRef = useRef(null);

  const [selectedSensor, setSelectedSensor] = useState("");
  const [sensors, setSensors] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("");

  // Fetch sensors on mount
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await getSensors(baseUrl, authToken);
        setSensors(Array.isArray(data) ? data : data.sensors || []);
      } catch (error) {
        console.error("Failed to fetch sensors:", error);
        setError("Failed to fetch sensors: " + error.message);
      }
    };
    fetchSensors();
  }, [baseUrl, authToken]);

  // Cleanup WebRTC connection on unmount or when sensor changes
  const cleanupConnection = useCallback(async () => {
    console.log("Cleaning up WebRTC connection...");

    // Stop checking for ICE candidates
    if (iceCandidateCheckIntervalRef.current) {
      clearInterval(iceCandidateCheckIntervalRef.current);
      iceCandidateCheckIntervalRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop stream on backend
    if (streamIdRef.current) {
      try {
        await stopLiveStream(baseUrl, authToken, streamIdRef.current);
        console.log("Stream stopped on backend");
      } catch (err) {
        console.warn("Failed to stop stream on backend:", err);
      }
      streamIdRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsConnected(false);
    setConnectionState("");
  }, [baseUrl, authToken]);

  // Start WebRTC connection
  const startWebRTCStream = useCallback(async () => {
    setError("");
    setIsConnecting(true);

    // Queue to store ICE candidates until stream is ready
    const pendingIceCandidates = [];
    let streamReady = false;

    try {
      // 1. Check sensor status first
      console.log("Checking sensor status for:", selectedSensor);
      try {
        const sensorStatus = await getSensorStatus(
          baseUrl,
          authToken,
          selectedSensor
        );
        console.log("Sensor status:", sensorStatus);
        if (sensorStatus && sensorStatus.state !== "online") {
          throw new Error(
            `Sensor is not online. Current state: ${
              sensorStatus.state || "unknown"
            }. The sensor must be online and streaming for WebRTC to work.`
          );
        }
      } catch (statusErr) {
        console.warn("Could not verify sensor status:", statusErr);
        // Continue anyway, as the API might not support this endpoint
      }

      // 2. Generate a unique peer ID (like VST's UI)
      const peerId = `${crypto.randomUUID()}`;
      peerIdRef.current = peerId; // Store for ICE candidate exchange
      console.log("Starting stream for sensor:", selectedSensor);
      console.log("Generated peer ID:", peerId);

      // 3. Create RTCPeerConnection
      const config = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      };

      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      // 3. Set up event handlers
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          console.log("Local ICE candidate:", event.candidate);

          const candidateData = {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          };

          // Send ICE candidates to VST after stream is established
          if (!streamReady) {
            console.log("Queueing ICE candidate until stream is ready");
            pendingIceCandidates.push(candidateData);
          }
          // Skip sending to VST - the /v1/live/iceCandidate endpoint returns 501
          // VST's SDP should contain all ICE candidates (but currently contains 0)
        }
      };

      pc.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setIsConnected(true);
          setIsConnecting(false);
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("Connection state:", pc.connectionState);
        setConnectionState(pc.connectionState);
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          setError("WebRTC connection failed or disconnected");
          setIsConnected(false);
        }
        if (pc.connectionState === "connected") {
          console.log("✅ WebRTC connection established!");
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.error("❌ ICE connection failed - check network/firewall");
          setError(
            "ICE connection failed. Check that:\n" +
              "1. VST server can reach your browser (firewall/NAT)\n" +
              "2. STUN servers are accessible\n" +
              "3. UDP ports are not blocked"
          );
        }
        if (pc.iceConnectionState === "connected") {
          console.log("✅ ICE connection established!");
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log("ICE gathering state:", pc.iceGatheringState);
        if (pc.iceGatheringState === "complete") {
          console.log("✅ ICE candidate gathering complete");
        }
      };

      // 4. Add transceivers for receiving video and audio with H.264 preference
      const videoTransceiver = pc.addTransceiver("video", {
        direction: "recvonly",
      });
      pc.addTransceiver("audio", {
        direction: "recvonly",
      });

      // Try to set H.264 as preferred codec (VST config shows h264 support)
      try {
        const videoCodecs = RTCRtpReceiver.getCapabilities("video").codecs;
        const h264Codecs = videoCodecs.filter(
          (codec) => codec.mimeType.toLowerCase() === "video/h264"
        );
        if (h264Codecs.length > 0 && videoTransceiver.setCodecPreferences) {
          // Prefer H.264, then allow others
          videoTransceiver.setCodecPreferences([...h264Codecs, ...videoCodecs]);
          console.log("Set H.264 as preferred video codec");
        }
      } catch (err) {
        console.warn("Could not set codec preferences:", err);
      }

      // 5. Create SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("Created SDP offer:", offer.sdp);

      // 6. Send offer to VST backend and get answer (using VST's official format)
      console.log("Sending SDP offer to backend...");
      const response = await startLiveStream(
        baseUrl,
        authToken,
        peerId, // Use peerId instead of streamId
        offer.sdp,
        selectedSensor // This is the streamId in VST's format
      );

      console.log("Backend response:", response);

      if (!response || !response.sdp) {
        throw new Error("No SDP answer received from backend");
      }

      // Check if SDP contains ICE candidates
      const iceCandidateCount = (response.sdp.match(/a=candidate:/g) || [])
        .length;
      console.log(
        `SDP answer contains ${iceCandidateCount} ICE candidates`,
        iceCandidateCount === 0 ? "⚠️ WARNING: No ICE candidates in SDP!" : "✅"
      );

      // Store the mediaSessionId for ICE candidate exchange and cleanup
      if (response.mediaSessionId) {
        streamIdRef.current = response.mediaSessionId;
        console.log("Media Session ID:", response.mediaSessionId);
      } else {
        console.warn(
          "No mediaSessionId in response - ICE candidates may not work"
        );
      }

      // 7. Set remote description (SDP answer) - VST returns flat object with sdp/type/mediaSessionId
      const answer = {
        type: response.type || "answer",
        sdp: response.sdp,
      };
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("Set remote SDP answer");

      // 8. Mark stream as ready and send pending ICE candidates
      streamReady = true;
      console.log("WebRTC negotiation complete - waiting for ICE connection");

      // Send any pending ICE candidates to VST
      // NOTE: VST returns 501 "Failed to add Ice Candidate" - the endpoint exists but doesn't work
      // This is likely because VST's SDP contains 0 ICE candidates (VST network config issue)
      // Skip sending candidates to avoid errors, but log what we have
      if (pendingIceCandidates.length > 0) {
        console.log(
          `⚠️ Generated ${pendingIceCandidates.length} local ICE candidates, but NOT sending to VST (endpoint returns 501)`
        );
        console.log("Local ICE candidates:", pendingIceCandidates);
        console.log(
          "VST SDP contains 0 remote ICE candidates - ICE connection will likely fail"
        );
        console.log(
          "Possible causes:\n" +
            "1. VST server behind NAT without proper network configuration\n" +
            "2. VST webrtcBindIp not configured correctly\n" +
            "3. VST can't detect its own external IP address\n" +
            "4. Firewall blocking VST from generating STUN candidates"
        );
      }

      console.log(
        "ICE connection process started - check ICE state logs above"
      );

      setIsConnecting(false);
    } catch (err) {
      console.error("WebRTC connection error:", err);
      let errorMessage = "Failed to start WebRTC stream:\n\n";

      if (err.message.includes("ERR_EMPTY_RESPONSE")) {
        errorMessage +=
          "❌ ERR_EMPTY_RESPONSE - The VST Live Stream microservice crashed when processing the request.\n\n" +
          "Common causes:\n" +
          "• **Sensor is not streaming** - VST cannot relay a stream that doesn't exist\n" +
          "• Sensor is offline or disconnected\n" +
          "• RTSP URL for the sensor is invalid or not reachable by VST\n" +
          "• VST cannot connect to the sensor's RTSP stream\n\n" +
          "Solutions:\n" +
          "1. Verify sensor is online in the Sensor Management tab\n" +
          "2. Check sensor RTSP URL is correct and accessible\n" +
          "3. Test RTSP stream directly: VLC → Open Network Stream → rtsp://sensor-ip/stream\n" +
          "4. Check VST logs: docker logs <vst-container> | tail -50\n" +
          "5. Verify firewall allows VST (10.0.0.144) to reach sensor RTSP port\n" +
          "6. Try with a different sensor that you know is streaming";
      } else if (err.message.includes("Sensor is not online")) {
        errorMessage +=
          "❌ ERR_CONNECTION_RESET - VST backend forcibly closed the connection.\n\n" +
          "This typically indicates the VST Live Stream service crashed.\n" +
          "Check VST service logs for crash details.";
      } else if (err.message.includes("400")) {
        errorMessage +=
          "❌ 400 Bad Request - The request format was rejected.\n\n" +
          "Possible issues:\n" +
          "• Invalid sensor_id (sensor might not exist or be offline)\n" +
          "• Incorrect payload field names (streamId vs stream_id)\n" +
          "• Stream ID already in use\n\n" +
          "Try: Select a different sensor or refresh the page.";
      } else if (err.message.includes("No SDP answer")) {
        errorMessage +=
          "❌ No SDP answer received from VST.\n\n" +
          "WebRTC negotiation failed. The VST server may not support WebRTC,\n" +
          "or the Live Stream microservice is not properly configured.";
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setIsConnecting(false);
      await cleanupConnection();
    }
  }, [selectedSensor, baseUrl, authToken, cleanupConnection]);

  // Handle sensor selection change
  useEffect(() => {
    return () => {
      cleanupConnection();
    };
  }, [cleanupConnection]);

  const handleSensorChange = async (e) => {
    await cleanupConnection();
    setSelectedSensor(e.target.value);
  };

  const handleConnect = () => {
    if (!selectedSensor) {
      setError("Please select a sensor first");
      return;
    }
    startWebRTCStream();
  };

  const handleDisconnect = () => {
    cleanupConnection();
  };

  const handleCheckConfig = async () => {
    try {
      console.log("Checking VST Live Stream Configuration...");
      const config = await getLiveStreamConfiguration(baseUrl, authToken);
      console.log("VST Live Stream Configuration:", config);

      const version = await getLiveStreamVersion(baseUrl, authToken);
      console.log("VST Live Stream Version:", version);

      alert(
        `VST Config:\n${JSON.stringify(
          config,
          null,
          2
        )}\n\nVersion:\n${JSON.stringify(version, null, 2)}`
      );
    } catch (err) {
      console.error("Failed to get VST configuration:", err);
      setError(
        "Failed to get VST configuration: " +
          err.message +
          "\n\nThis might indicate WebRTC is not enabled or the Live Stream service is not running."
      );
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Live Stream via WebRTC
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Sensor</InputLabel>
          <Select
            value={selectedSensor}
            onChange={handleSensorChange}
            disabled={isConnecting || isConnected}
          >
            {sensors.map((s) => (
              <MenuItem key={s.sensorId || s.id} value={s.sensorId || s.id}>
                {s.name} ({s.sensorId || s.id})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
          {!isConnected ? (
            <>
              <Button
                variant="contained"
                onClick={handleConnect}
                disabled={!selectedSensor || isConnecting}
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCheckConfig}
                disabled={isConnecting}
              >
                Check VST Config
              </Button>
            </>
          ) : (
            <Button variant="outlined" color="error" onClick={handleDisconnect}>
              Disconnect
            </Button>
          )}

          {isConnecting && <CircularProgress size={24} />}

          {connectionState && (
            <Typography variant="body2" color="textSecondary">
              State: {connectionState}
            </Typography>
          )}
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

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          controls
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

export default LiveStream;
