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

  useEffect(() => {
    fetchSensors();
    return () => {
      if (player) player.dispose();
    };
  }, [baseUrl, authToken]);

  const fetchSensors = async () => {
    setLoading(true);
    try {
      const data = await getSensors(baseUrl, authToken);
      setSensors(data.sensors || []);
    } catch (error) {
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const createProxy = async () => {
    if (!selectedSensor) {
      onError("Please select a sensor");
      return;
    }
    setLoading(true);
    try {
      const sensor = sensors.find((s) => s.id === selectedSensor);
      if (!sensor?.uri) {
        onError("Selected sensor has no valid RTSP URI");
        return;
      }
      const data = await createRTSPProxy(baseUrl, authToken, sensor.uri);
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
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Sensor</InputLabel>
            <Select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              disabled={sensors.length === 0}
            >
              {sensors.length === 0 ? (
                <MenuItem value="" disabled>
                  No sensors available
                </MenuItem>
              ) : (
                sensors.map((sensor) => (
                  <MenuItem key={sensor.id} value={sensor.id}>
                    {sensor.name} ({sensor.uri})
                  </MenuItem>
                ))
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
