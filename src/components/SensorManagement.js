import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  getSensors,
  addSensor as apiAddSensor,
  removeSensor as apiRemoveSensor,
  getSensorSettings,
} from "../utils/api";

const SensorManagement = ({ baseUrl, authToken }) => {
  const [sensors, setSensors] = useState([]);
  const [newSensor, setNewSensor] = useState({ name: "", uri: "" });
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const handleShowSettings = async (sensorId) => {
    setSettingsDialogOpen(true);
    setSettingsLoading(true);
    setSettingsData(null);
    console.log("Calling getSensorSettings with sensorId:", sensorId);
    try {
      const data = await getSensorSettings(baseUrl, authToken, sensorId);
      console.log("getSensorSettings result:", data, "for sensorId:", sensorId);
      setSettingsData(data);
    } catch (error) {
      console.error(
        "getSensorSettings error:",
        error,
        "for sensorId:",
        sensorId
      );
      setSettingsData({ error: error.message });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleGetSensors = useCallback(async () => {
    try {
      const data = await getSensors(baseUrl, authToken);
      setSensors(Array.isArray(data) ? data : data.sensors || []);
      console.log("Fetched sensors:", data);
    } catch (error) {
      console.error("Failed to fetch sensors:", error);
    }
  }, [baseUrl, authToken]);

  useEffect(() => {
    handleGetSensors();
  }, [handleGetSensors]);

  const addSensor = async () => {
    try {
      await apiAddSensor(baseUrl, authToken, newSensor);
      handleGetSensors();
      setNewSensor({ name: "", uri: "" });
    } catch (error) {
      console.error("Failed to add sensor:", error);
    }
  };

  const removeSensor = async (id) => {
    try {
      await apiRemoveSensor(baseUrl, authToken, id);
      handleGetSensors();
    } catch (error) {
      console.error("Failed to remove sensor:", error);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6">Add/Remove/Configure Cameras</Typography>
      <div style={{ marginBottom: 20 }}>
        <TextField
          label="Sensor Name"
          value={newSensor.name}
          onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
          size="small"
          sx={{ mr: 2 }}
        />
        <TextField
          label="RTSP URI (e.g., rtsp://ip:port/stream)"
          value={newSensor.uri}
          onChange={(e) => setNewSensor({ ...newSensor, uri: e.target.value })}
          size="small"
          sx={{ mr: 2 }}
        />
        <Button variant="contained" onClick={addSensor}>
          Add Sensor
        </Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>IP/URI</TableCell>
            <TableCell>Manufacturer</TableCell>
            <TableCell>Hardware</TableCell>
            <TableCell>Firmware</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Remote Device ID</TableCell>
            <TableCell>Actions</TableCell>
            <TableCell>Settings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensors.map((sensor) => (
            <TableRow key={sensor.sensorId || sensor.id}>
              <TableCell>{sensor.sensorId || sensor.id}</TableCell>
              <TableCell>{sensor.name}</TableCell>
              <TableCell>{sensor.sensorIp || sensor.uri}</TableCell>
              <TableCell>{sensor.manufacturer}</TableCell>
              <TableCell>{sensor.hardware}</TableCell>
              <TableCell>{sensor.firmwareVersion}</TableCell>
              <TableCell>{sensor.state}</TableCell>
              <TableCell>{sensor.remoteDeviceId}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() => removeSensor(sensor.sensorId || sensor.id)}
                  color="error"
                >
                  Remove
                </Button>
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    handleShowSettings(sensor.sensorId || sensor.id)
                  }
                >
                  Settings
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Settings Dialog */}
      {settingsDialogOpen && (
        <Paper
          sx={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, 0)",
            zIndex: 1300,
            p: 3,
            minWidth: 400,
          }}
          elevation={6}
        >
          <Typography variant="h6" gutterBottom>
            Sensor Settings
          </Typography>
          <pre
            style={{
              maxHeight: 300,
              overflow: "auto",
              background: "#f5f5f5",
              padding: 10,
            }}
          >
            {settingsLoading
              ? "Loading..."
              : settingsData && settingsData.error
              ? `Error: ${settingsData.error}`
              : settingsData
              ? JSON.stringify(settingsData, null, 2)
              : "No data."}
          </pre>
          <Button
            variant="contained"
            onClick={() => setSettingsDialogOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Paper>
      )}
    </Paper>
  );
};

export default SensorManagement;
