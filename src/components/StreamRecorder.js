import React, { useState } from "react";
import { Button, Switch, FormControlLabel, Typography } from "@mui/material";
import { apiCall } from "../utils/api";

const StreamRecorder = ({ baseUrl, authToken }) => {
  const [recording, setRecording] = useState(false);
  const [selectedStreams, setSelectedStreams] = useState([]); // Multi-select from sensors

  const toggleRecording = async () => {
    const endpoint = recording ? "/recordings/stop" : "/recordings/start";
    const body = recording
      ? { stream_ids: selectedStreams }
      : { stream_ids: selectedStreams, policy: "continuous" };
    try {
      await apiCall(baseUrl, endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        authToken,
      });
      setRecording(!recording);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  return (
    <div>
      <Typography variant="h6">Stream Recorder</Typography>
      <FormControlLabel
        control={<Switch checked={recording} onChange={toggleRecording} />}
        label={recording ? "Stop Recording" : "Start Recording"}
      />
      {/* Add stream selector */}
    </div>
  );
};

export default StreamRecorder;
