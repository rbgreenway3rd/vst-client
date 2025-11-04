import React, { useState, useEffect, useRef } from "react";
import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  TextField,
  Button,
} from "@mui/material";
import { getSensors, getReplayStream } from "../../services/vst/api_vst";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const ReplayStream = ({ baseUrl, authToken, onError }) => {
  const videoRef = useRef(null);
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
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

  const startReplay = async () => {
    if (!selectedSensor || !startTime || !endTime) {
      onError("Select sensor and time range");
      return;
    }
    setLoading(true);
    try {
      const data = await getReplayStream(baseUrl, authToken, {
        stream_id: selectedSensor,
        start_time: startTime, // e.g., '2023-01-01T00:00:00Z'
        end_time: endTime,
      });
      if (videoRef.current && data.url) {
        // Assume response has { url: 'hls-url.m3u8' }
        const newPlayer = videojs(videoRef.current, {
          controls: true,
          autoplay: true,
          fluid: true,
          sources: [{ src: data.url, type: "application/x-mpegURL" }],
        });
        setPlayer(newPlayer);
      } else {
        onError("No replay URL returned");
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
        Replay Stream
      </Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Sensor/Stream</InputLabel>
            <Select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
            >
              {sensors.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Start Time (YYYY-MM-DDTHH:MM:SSZ)"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="End Time (YYYY-MM-DDTHH:MM:SSZ)"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              size="small"
              fullWidth
            />
          </Box>
          <Button
            variant="contained"
            onClick={startReplay}
            disabled={!selectedSensor || !startTime || !endTime}
          >
            Start Replay
          </Button>
          <Box sx={{ mt: 2 }}>
            <video
              ref={videoRef}
              className="video-js vjs-big-play-centered"
              style={{ width: "100%", height: "400px" }}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ReplayStream;
