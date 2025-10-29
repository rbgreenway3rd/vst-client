import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
} from "@mui/material";
// import videojs from "video.js";
import "video.js/dist/video-js.css";
import { getSensors, createRTSPProxy } from "../utils/api";

const RTSPProxyStream = ({ baseUrl, authToken, onError }) => {
  const videoRef = useRef(null);
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [proxiedUrl, setProxiedUrl] = useState("");
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const data = await getSensors(baseUrl, authToken);
      console.log("Fetched sensors for RTSP Proxy:", data);
      setSensors(Array.isArray(data) ? data : data.sensors || []);
    } catch (error) {
      console.error("Failed to fetch sensors for RTSP Proxy:", error);
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSensors();
    return () => {
      if (player) player.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken]);

  const createProxy = async () => {
    if (!selectedSensor) {
      onError("Please select a sensor");
      return;
    }
    setLoading(true);
    try {
      const sensor = sensors.find(
        (s) => (s.id || s.sensorId) === selectedSensor
      );
      if (!sensor) {
        onError("Selected sensor not found");
        return;
      }

      // Construct RTSP URL using VST's RTSP proxy pattern
      // Format: rtsp://<vst-host>:8554/live/<sensor-id>
      const vstHost = new URL(baseUrl).hostname;
      const sensorId = sensor.id || sensor.sensorId;
      const rtspUrl = `rtsp://${vstHost}:8554/live/${sensorId}`;

      console.log("Creating proxy for RTSP URL:", rtspUrl);
      const data = await createRTSPProxy(baseUrl, authToken, rtspUrl);
      const url = data.proxy_url;
      setProxiedUrl(url);
      if (videoRef.current && url) {
        const videojs = (await import("video.js")).default;
        const newPlayer = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          fluid: true,
          sources: [{ src: url, type: "application/x-mpegURL" }],
        });
        setPlayer(newPlayer);
      }
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        RTSP Proxy Stream
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            {sensors.length} sensor(s) available
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Sensor</InputLabel>
            <Select
              value={selectedSensor}
              onChange={(e) => {
                console.log("Selected sensor:", e.target.value);
                setSelectedSensor(e.target.value);
              }}
              disabled={sensors.length === 0}
            >
              {sensors.length === 0 ? (
                <MenuItem value="" disabled>
                  No sensors available
                </MenuItem>
              ) : (
                sensors.map((sensor) => {
                  const vstHost = new URL(baseUrl).hostname;
                  const sensorId = sensor.id || sensor.sensorId;
                  const rtspUrl = `rtsp://${vstHost}:8554/live/${sensorId}`;
                  return (
                    <MenuItem
                      key={sensor.id || sensor.sensorId}
                      value={sensor.id || sensor.sensorId}
                    >
                      {sensor.name} ({rtspUrl})
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={createProxy}
            disabled={!selectedSensor}
          >
            Create Proxy
          </Button>
          <Box sx={{ mt: 2 }}>
            {proxiedUrl ? (
              <video
                ref={videoRef}
                className="video-js vjs-big-play-centered"
                style={{ width: "100%", height: "400px" }}
              />
            ) : (
              <Typography>No proxy stream active</Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default RTSPProxyStream;
