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
  Chip,
} from "@mui/material";
import { getSensors } from "../../services/vst/api_vst";
import StreamingGatewayClient from "../../services/streaming-gateway/client";

const LiveStreamGateway = ({ baseUrl, authToken }) => {
  const videoRef = useRef(null);
  const clientRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const [selectedSensor, setSelectedSensor] = useState("");
  const [sensors, setSensors] = useState([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [connectionState, setConnectionState] = useState("new");
  const [gatewayUrl] = useState("http://192.168.1.26:30010"); // Streaming gateway URL
  const [gatewayStreams, setGatewayStreams] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

    // Also check gateway streams
    checkGatewayStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken]);

  const checkGatewayStreams = async () => {
    try {
      const client = new StreamingGatewayClient(gatewayUrl);
      const streams = await client.getStreams();
      setGatewayStreams(streams.streams || []);
      console.log("Gateway streams:", streams);
    } catch (err) {
      console.warn("Could not fetch gateway streams:", err);
    }
  };

  const handleRefreshGateway = async () => {
    setIsRefreshing(true);
    setError("");
    setSuccess("");

    try {
      const client = new StreamingGatewayClient(gatewayUrl);
      console.log("Refreshing gateway streams...");

      await client.refreshStreams();

      // Wait a moment for the sync to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fetch updated streams
      const streams = await client.getStreams();
      const streamArray = streams.streams || [];
      setGatewayStreams(streamArray);

      setSuccess(`Gateway refreshed! Found ${streamArray.length} streams.`);
      console.log("✅ Gateway refresh complete");
    } catch (err) {
      console.error("Failed to refresh gateway:", err);
      setError("Failed to refresh gateway: " + err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    if (!selectedSensor) {
      setError("Please select a sensor first");
      return;
    }

    setError("");
    setIsConnecting(true);

    try {
      // Force cleanup any existing connection first
      handleDisconnect();

      // Create streaming gateway client
      clientRef.current = new StreamingGatewayClient(gatewayUrl);

      // Gateway uses "camera-" prefix for sensor IDs
      const gatewayStreamId = `camera-${selectedSensor}`;
      console.log(
        "Starting WebRTC stream via gateway for sensor:",
        selectedSensor
      );
      console.log("Gateway stream ID:", gatewayStreamId);

      // Check if stream exists and is ready
      const streamInfo = await clientRef.current.getStream(gatewayStreamId);
      console.log("Stream info:", streamInfo);

      if (!streamInfo.ready) {
        console.warn(
          "Stream not ready yet, it may take a moment to connect..."
        );
        setError(
          "Stream is initializing, please wait a moment and try again.\n\n" +
            "The camera needs to connect to MediaMTX first.\n" +
            "Check that the camera is streaming and try again in a few seconds."
        );
        setIsConnecting(false);
        return;
      }

      // Start WebRTC stream
      const pc = await clientRef.current.startWebRTCStream(
        gatewayStreamId,
        videoRef.current,
        {
          onConnectionStateChange: (state) => {
            console.log("Connection state:", state);
            setConnectionState(state);

            // Handle connection failures
            if (state === "failed" || state === "disconnected") {
              setError(`Connection ${state}. Try reconnecting.`);
              setIsConnected(false);
            }
          },
          audio: true, // Enable audio if available
        }
      );

      peerConnectionRef.current = pc;
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionState("connected");

      console.log("✅ WebRTC stream started successfully");
    } catch (err) {
      console.error("Connection failed:", err);

      let errorMsg = "Failed to start stream: " + err.message;

      // Provide helpful error messages
      if (err.message.includes("404") || err.message.includes("not found")) {
        errorMsg +=
          "\n\n💡 Camera not found in streaming gateway.\n" +
          "• Make sure the streaming gateway is running\n" +
          "• Check if the camera is active in VST\n" +
          "• Try refreshing the gateway: curl -X POST http://192.168.1.26:30010/api/streams/refresh";
      } else if (
        err.message.includes("timeout") ||
        err.message.includes("fetch failed")
      ) {
        errorMsg +=
          "\n\n💡 Cannot reach streaming gateway.\n" +
          "• Check if gateway is running at " +
          gatewayUrl +
          "\n" +
          "• Verify network connectivity";
      }

      setError(errorMsg);
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnecting stream...");

    if (clientRef.current && selectedSensor) {
      // Gateway uses "camera-" prefix for sensor IDs
      const gatewayStreamId = `camera-${selectedSensor}`;
      clientRef.current.stopWebRTCStream(gatewayStreamId);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsConnected(false);
    setConnectionState("closed");
  };

  const handleSensorChange = (e) => {
    if (isConnected) {
      handleDisconnect();
    }
    setSelectedSensor(e.target.value);
  };

  const handleTakeSnapshot = async () => {
    if (!clientRef.current || !selectedSensor) {
      setError("No active stream to capture");
      return;
    }

    try {
      // Gateway uses "camera-" prefix for sensor IDs
      const gatewayStreamId = `camera-${selectedSensor}`;
      console.log("Capturing snapshot for sensor:", selectedSensor);
      console.log("Gateway stream ID:", gatewayStreamId);

      await clientRef.current.downloadSnapshot(gatewayStreamId, {
        filename: `snapshot-${selectedSensor}-${Date.now()}.jpg`,
      });
      console.log("✅ Snapshot downloaded");
    } catch (err) {
      console.error("Failed to take snapshot:", err);
      setError("Failed to capture snapshot: " + err.message);
    }
  };

  const getConnectionStateColor = () => {
    switch (connectionState) {
      case "connected":
        return "success";
      case "connecting":
        return "warning";
      case "failed":
      case "disconnected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">
            Live Stream via WebRTC (Streaming Gateway)
          </Typography>
          {isConnected && (
            <Chip
              label={connectionState}
              color={getConnectionStateColor()}
              size="small"
            />
          )}
        </Box>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Using simplified streaming gateway at {gatewayUrl}
          {gatewayStreams.length > 0 && (
            <> • {gatewayStreams.length} streams available in gateway</>
          )}
        </Typography>

        {success && (
          <Box
            sx={{
              mb: 2,
              p: 1,
              backgroundColor: "#e8f5e9",
              borderRadius: 1,
              border: "1px solid #4caf50",
            }}
          >
            <Typography color="success.main" variant="body2">
              {success}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefreshGateway}
            disabled={isRefreshing || isConnecting || isConnected}
          >
            {isRefreshing ? "Syncing..." : "Sync Gateway with VST"}
          </Button>
          {isRefreshing && <CircularProgress size={20} />}
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Sensor</InputLabel>
          <Select
            value={selectedSensor}
            onChange={handleSensorChange}
            disabled={isConnecting || isConnected}
          >
            {sensors.map((s) => {
              const isOffline = s.state === "offline" || s.state === "OFFLINE";
              const sensorId = s.sensorId || s.id;
              // Gateway uses "camera-" prefix for sensor IDs
              const gatewayStreamId = `camera-${sensorId}`;
              const inGateway = gatewayStreams.some(
                (stream) => stream.id === gatewayStreamId
              );

              const displayName = isOffline
                ? `${s.name} (${sensorId}) - OFFLINE`
                : inGateway
                ? `${s.name} (${sensorId}) ✓`
                : `${s.name} (${sensorId}) ⚠️ Not in gateway`;

              return (
                <MenuItem
                  key={sensorId}
                  value={sensorId}
                  sx={
                    isOffline || !inGateway
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
            borderRadius: 4,
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
              borderRadius: 1,
            }}
          >
            <Typography color="textSecondary">
              Select a sensor and click Connect to start streaming
            </Typography>
          </Box>
        )}

        {isConnected && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="textSecondary">
              💡 Using WHEP protocol via MediaMTX for simplified WebRTC
              streaming
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStreamGateway;
