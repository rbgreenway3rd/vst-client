import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  getRoisConfig,
  getTripwiresConfig,
  getSensorsConfig,
  updateSensorsConfig,
} from "../../services/emdx/api_emdx";
import { getSensors } from "../../services/vst/api_vst";

const ROIConfiguration = ({
  baseUrl,
  authToken,
  vstBaseUrl,
  vstAuthToken,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [roisConfig, setRoisConfig] = useState(null);
  const [tripwiresConfig, setTripwiresConfig] = useState(null);
  const [sensorsConfig, setSensorsConfig] = useState(null);
  const [vstSensors, setVstSensors] = useState([]);
  const [addingSensorId, setAddingSensorId] = useState(null);

  useEffect(() => {
    fetchConfigurations();
    if (vstBaseUrl) {
      fetchVstSensors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken, vstBaseUrl, vstAuthToken]);

  const fetchVstSensors = async () => {
    if (!vstBaseUrl) return;

    try {
      const data = await getSensors(vstBaseUrl, vstAuthToken);
      const sensors = Array.isArray(data) ? data : data.sensors || [];
      // Filter out removed/offline sensors
      const activeSensors = sensors.filter(
        (s) => s.state !== "removed" && s.state !== "REMOVED"
      );
      setVstSensors(activeSensors);
      console.log("Fetched VST sensors:", activeSensors);
    } catch (err) {
      console.error("Failed to fetch VST sensors:", err);
      // Don't show error alert for VST fetch failure - it's optional
    }
  };

  const fetchConfigurations = async () => {
    setLoading(true);
    setError("");

    try {
      const [rois, tripwires, sensors] = await Promise.all([
        getRoisConfig(baseUrl, authToken),
        getTripwiresConfig(baseUrl, authToken),
        getSensorsConfig(baseUrl, authToken),
      ]);

      setRoisConfig(rois);
      setTripwiresConfig(tripwires);
      setSensorsConfig(sensors);
    } catch (err) {
      const errorMsg = `Failed to fetch configurations: ${err.message}`;
      setError(errorMsg);
      if (onError) onError(err);
      console.error("Error fetching configurations:", err);
    } finally {
      setLoading(false);
    }
  };

  const addSensorToEmdx = async (vstSensor) => {
    setAddingSensorId(vstSensor.sensorId || vstSensor.id);
    setError("");
    setSuccess("");

    try {
      // Get current EMDX sensors config
      const currentConfig = sensorsConfig || { sensors: [] };
      const existingSensors = currentConfig.sensors || [];

      // Check if sensor already exists in EMDX
      const existingSensor = existingSensors.find(
        (s) => s.sensor_id === (vstSensor.sensorId || vstSensor.id)
      );

      if (existingSensor) {
        setError(`Sensor "${vstSensor.name}" is already configured in EMDX`);
        setAddingSensorId(null);
        return;
      }

      // Extract RTSP URL from VST sensor
      // VST stores it as 'url' or 'uri' or construct from 'sensorIp'
      let rtspUrl = vstSensor.url || vstSensor.uri;

      if (!rtspUrl && vstSensor.sensorIp) {
        // Try to construct RTSP URL from IP
        rtspUrl = `rtsp://${vstSensor.sensorIp}:554/stream1`;
      }

      if (!rtspUrl) {
        setError(`Cannot add sensor: missing RTSP URL for "${vstSensor.name}"`);
        setAddingSensorId(null);
        return;
      }

      // Create EMDX sensor configuration
      const newSensor = {
        sensor_id: vstSensor.sensorId || vstSensor.id,
        name: vstSensor.name,
        rtsp_url: rtspUrl,
        enabled: true,
        location: vstSensor.location || "Unknown",
        manufacturer: vstSensor.manufacturer || "Generic",
        hardware: vstSensor.hardware || "IP Camera",
      };

      // Update EMDX sensors config
      const updatedConfig = {
        sensors: [...existingSensors, newSensor],
      };

      console.log("Adding sensor to EMDX:", newSensor);
      await updateSensorsConfig(baseUrl, authToken, updatedConfig);

      setSuccess(`Sensor "${vstSensor.name}" added to EMDX successfully!`);

      // Refresh configurations
      await fetchConfigurations();
    } catch (err) {
      const errorMsg = `Failed to add sensor to EMDX: ${err.message}`;
      setError(errorMsg);
      if (onError) onError(err);
      console.error("Error adding sensor to EMDX:", err);
    } finally {
      setAddingSensorId(null);
    }
  };

  const isConfiguredInEmdx = (vstSensorId) => {
    if (!sensorsConfig || !sensorsConfig.sensors) return false;
    return sensorsConfig.sensors.some((s) => s.sensor_id === vstSensorId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ROI & Tripwire Configuration
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Configure Regions of Interest (ROI) and Tripwires for analytics on
          camera feeds
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={fetchConfigurations}>
            Refresh EMDX Config
          </Button>
          {vstBaseUrl && (
            <Button variant="outlined" onClick={fetchVstSensors}>
              Refresh VST Sensors
            </Button>
          )}
        </Box>

        {/* VST Sensors - Available to Link */}
        {vstBaseUrl && vstSensors.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Available VST Cameras
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              These cameras are managed in VST. Click "Add to EMDX" to enable
              analytics on them.
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>IP/URL</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vstSensors.map((sensor) => {
                  const sensorId = sensor.sensorId || sensor.id;
                  const isConfigured = isConfiguredInEmdx(sensorId);
                  const isAdding = addingSensorId === sensorId;

                  return (
                    <TableRow key={sensorId}>
                      <TableCell>{sensor.name}</TableCell>
                      <TableCell>{sensorId}</TableCell>
                      <TableCell>
                        {sensor.url || sensor.uri || sensor.sensorIp || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={sensor.state}
                          size="small"
                          color={
                            sensor.state === "active" ||
                            sensor.state === "ACTIVE"
                              ? "success"
                              : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {isConfigured ? (
                          <Chip label="In EMDX" size="small" color="primary" />
                        ) : (
                          <Chip label="Not in EMDX" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        {isConfigured ? (
                          <Typography variant="caption" color="textSecondary">
                            Already added
                          </Typography>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => addSensorToEmdx(sensor)}
                            disabled={isAdding}
                          >
                            {isAdding ? "Adding..." : "Add to EMDX"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* EMDX Configured Sensors */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            EMDX Configured Sensors
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Sensors configured in EMDX for analytics processing
          </Typography>
          {sensorsConfig &&
          sensorsConfig.sensors &&
          sensorsConfig.sensors.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Sensor ID</TableCell>
                  <TableCell>RTSP URL</TableCell>
                  <TableCell>Enabled</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sensorsConfig.sensors.map((sensor) => (
                  <TableRow key={sensor.sensor_id}>
                    <TableCell>{sensor.name}</TableCell>
                    <TableCell>{sensor.sensor_id}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {sensor.rtsp_url || "N/A"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sensor.enabled ? "Yes" : "No"}
                        size="small"
                        color={sensor.enabled ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell>{sensor.location || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                No sensors configured in EMDX yet.
              </Typography>
              {vstSensors.length > 0 && (
                <Alert severity="info">
                  Add cameras from the "Available VST Cameras" section above to
                  enable EMDX analytics.
                </Alert>
              )}
            </Box>
          )}
        </Paper>

        {/* ROIs Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            ROIs (Regions of Interest)
          </Typography>
          {roisConfig ? (
            <pre
              style={{
                maxHeight: 200,
                overflow: "auto",
                background: "#f5f5f5",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(roisConfig, null, 2)}
            </pre>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No ROI configuration found
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => alert("ROI editor - coming soon!")}
          >
            Add ROI
          </Button>
        </Paper>

        {/* Tripwires Section */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            Tripwires
          </Typography>
          {tripwiresConfig ? (
            <pre
              style={{
                maxHeight: 200,
                overflow: "auto",
                background: "#f5f5f5",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(tripwiresConfig, null, 2)}
            </pre>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No tripwire configuration found
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => alert("Tripwire editor - coming soon!")}
          >
            Add Tripwire
          </Button>
        </Paper>
      </CardContent>
    </Card>
  );
};

export default ROIConfiguration;
