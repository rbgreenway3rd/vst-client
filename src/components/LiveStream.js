import React, { useRef, useEffect, useState } from "react";
import { VideoPlayer as Video } from "@mui/icons-material"; // Placeholder icon
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { getSensors, startLiveStream } from "../utils/api";

const LiveStream = ({ baseUrl, authToken }) => {
  const videoRef = useRef(null);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [sensors, setSensors] = useState([]);
  const [streamUrl, setStreamUrl] = useState("");
  const [streamError, setStreamError] = useState("");

  useEffect(() => {
    // Fetch sensors on mount or when baseUrl/authToken changes
    const fetchSensors = async () => {
      try {
        const data = await getSensors(baseUrl, authToken);
        setSensors(Array.isArray(data) ? data : data.sensors || []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch sensors:", error);
      }
    };
    fetchSensors();
  }, [baseUrl, authToken]);

  useEffect(() => {
    // When a sensor is selected, fetch its live stream info
    const fetchLiveStream = async () => {
      setStreamUrl("");
      setStreamError("");
      if (!selectedSensor) return;
      try {
        // Use startLiveStream from api.js
        const data = await startLiveStream(baseUrl, authToken, selectedSensor);
        // Debug: log the full backend response
        // eslint-disable-next-line no-console
        console.log("LiveStream backend response:", data);
        let url = "";
        let rtspUrl = "";
        if (data && Array.isArray(data.streams)) {
          // Look for HLS or MP4
          const hls = data.streams.find(
            (s) => s.url && s.url.endsWith(".m3u8")
          );
          const mp4 = data.streams.find((s) => s.url && s.url.endsWith(".mp4"));
          url = hls?.url || mp4?.url || "";
          // Fallback: look for RTSP
          if (!url) {
            const rtsp = data.streams.find(
              (s) => s.url && s.url.startsWith("rtsp://")
            );
            rtspUrl = rtsp?.url || "";
          }
        } else if (data && data.url) {
          url = data.url;
          if (!url && data.url.startsWith && data.url.startsWith("rtsp://")) {
            rtspUrl = data.url;
          }
        }
        if (url) {
          setStreamUrl(url);
        } else if (rtspUrl) {
          setStreamError(
            `No browser-playable stream URL returned. RTSP stream available: ` +
              rtspUrl
          );
        } else {
          setStreamError(
            "No playable stream URL returned. WebRTC/SDP not supported with this stream."
          );
        }
      } catch (err) {
        setStreamError("Failed to fetch live stream: " + (err?.message || err));
      }
    };
    fetchLiveStream();
  }, [selectedSensor, baseUrl, authToken]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6">Live Stream via WebRTC</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Sensor</InputLabel>
          <Select
            value={selectedSensor}
            onChange={(e) => setSelectedSensor(e.target.value)}
          >
            {sensors.map((s) => (
              <MenuItem key={s.sensorId || s.id} value={s.sensorId || s.id}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {streamUrl ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            width="100%"
            controls
            style={{ maxHeight: 400 }}
            src={streamUrl}
          />
        ) : streamError && streamError.includes("rtsp://") ? (
          <>
            <Typography color="error">
              No browser-playable stream URL returned.
              <br />
              <strong>RTSP stream available:</strong>
              <br />
              <a
                href={streamError.match(/(rtsp:\/\/[^\s]+)/)?.[1] || "#"}
                target="_blank"
                rel="noopener noreferrer"
              >
                {streamError.match(/(rtsp:\/\/[^\s]+)/)?.[1] || "RTSP Link"}
              </a>
              <br />
              <span style={{ fontSize: "0.9em" }}>
                Copy and open this RTSP link in VLC or another compatible
                player.
              </span>
            </Typography>
          </>
        ) : streamError ? (
          <Typography color="error">{streamError}</Typography>
        ) : (
          <Typography>Select a camera to view its live stream.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveStream;
