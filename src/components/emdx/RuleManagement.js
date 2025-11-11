import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  listFovAlertRules,
  listTripwireAlertRules,
  listRoiAlertRules,
  deleteFovAlertRule,
  deleteTripwireAlertRule,
  deleteRoiAlertRule,
} from "../../services/emdx/api_emdx";
import { getSensors } from "../../services/vst/api_vst";

const RuleManagement = ({
  baseUrl,
  authToken,
  vstBaseUrl,
  vstAuthToken,
  onError,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sensor state
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [loadingSensors, setLoadingSensors] = useState(false);

  // Rules state
  const [fovRules, setFovRules] = useState([]);
  const [tripwireRules, setTripwireRules] = useState([]);
  const [roiRules, setRoiRules] = useState([]);

  // Fetch sensors on mount
  useEffect(() => {
    const fetchSensors = async () => {
      if (!vstBaseUrl) return;

      setLoadingSensors(true);
      try {
        const response = await getSensors(vstBaseUrl, vstAuthToken);
        const sensorList = response?.sensors || response || [];
        setSensors(sensorList);

        // Auto-select first sensor (ensure it's a string, not undefined)
        if (sensorList.length > 0 && !selectedSensor) {
          const firstSensorId = sensorList[0].id || "";
          setSelectedSensor(firstSensorId);
        }
      } catch (err) {
        console.error("Failed to fetch sensors:", err);
        setError("Failed to load sensors. Please check VST connection.");
      } finally {
        setLoadingSensors(false);
      }
    };

    fetchSensors();
  }, [vstBaseUrl, vstAuthToken, selectedSensor]);

  // Fetch rules when sensor or tab changes
  useEffect(() => {
    if (selectedSensor) {
      fetchRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken, tabValue, selectedSensor]);

  const fetchRules = async () => {
    if (!selectedSensor) {
      setError("Please select a sensor to view rules");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (tabValue === 0) {
        // Fetch FOV rules
        const data = await listFovAlertRules(
          baseUrl,
          authToken,
          selectedSensor
        );
        setFovRules(Array.isArray(data) ? data : data.rules || []);
      } else if (tabValue === 1) {
        // Fetch Tripwire rules
        const data = await listTripwireAlertRules(
          baseUrl,
          authToken,
          selectedSensor
        );
        setTripwireRules(Array.isArray(data) ? data : data.rules || []);
      } else if (tabValue === 2) {
        // Fetch ROI rules
        const data = await listRoiAlertRules(
          baseUrl,
          authToken,
          selectedSensor
        );
        setRoiRules(Array.isArray(data) ? data : data.rules || []);
      }
    } catch (err) {
      // Handle 422 errors gracefully (no rules configured)
      if (err.message?.includes("422")) {
        // Set empty array - this is normal when no rules exist
        if (tabValue === 0) setFovRules([]);
        else if (tabValue === 1) setTripwireRules([]);
        else if (tabValue === 2) setRoiRules([]);
      } else {
        const errorMsg = `Failed to fetch rules: ${err.message}`;
        setError(errorMsg);
        if (onError) onError(err);
        console.error("Error fetching rules:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId, ruleType) => {
    if (!window.confirm(`Delete this ${ruleType} rule?`)) return;

    try {
      if (ruleType === "FOV") {
        await deleteFovAlertRule(baseUrl, authToken, ruleId);
      } else if (ruleType === "Tripwire") {
        await deleteTripwireAlertRule(baseUrl, authToken, ruleId);
      } else if (ruleType === "ROI") {
        await deleteRoiAlertRule(baseUrl, authToken, ruleId);
      }

      alert(`${ruleType} rule deleted successfully`);
      fetchRules(); // Refresh the list
    } catch (err) {
      alert(`Failed to delete rule: ${err.message}`);
      if (onError) onError(err);
    }
  };

  const renderRulesTable = (rules, ruleType) => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (rules.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No {ruleType} rules configured. Click "Add Rule" to create one.
        </Alert>
      );
    }

    return (
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Rule ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Sensor</TableCell>
            <TableCell>Enabled</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.rule_id || rule.id}>
              <TableCell>{rule.rule_id || rule.id}</TableCell>
              <TableCell>{rule.name || "Unnamed"}</TableCell>
              <TableCell>{rule.sensor_id || "N/A"}</TableCell>
              <TableCell>{rule.enabled ? "Yes" : "No"}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  color="error"
                  onClick={() =>
                    handleDeleteRule(rule.rule_id || rule.id, ruleType)
                  }
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Alert Rules Management
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Configure analytics rules for FOV (Field of View), Tripwires, and ROI
          (Region of Interest)
        </Typography>

        {/* Sensor Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Select Sensor/Camera</InputLabel>
            <Select
              value={selectedSensor || ""}
              onChange={(e) => setSelectedSensor(e.target.value || "")}
              label="Select Sensor/Camera"
              disabled={loadingSensors || sensors.length === 0}
            >
              {sensors.map((sensor) => (
                <MenuItem key={sensor.id} value={sensor.id || ""}>
                  {sensor.name || sensor.id || "Unknown Sensor"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {sensors.length === 0 && !loadingSensors && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: "block" }}
            >
              No sensors available. Please configure sensors in VST first.
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ mb: 2 }}
        >
          <Tab label="FOV Rules" />
          <Tab label="Tripwire Rules" />
          <Tab label="ROI Rules" />
        </Tabs>

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => alert("Add rule dialog - coming soon!")}
            disabled={!selectedSensor}
          >
            Add Rule
          </Button>
          <Button
            variant="outlined"
            onClick={fetchRules}
            sx={{ ml: 1 }}
            disabled={!selectedSensor}
          >
            Refresh
          </Button>
        </Box>

        {tabValue === 0 && renderRulesTable(fovRules, "FOV")}
        {tabValue === 1 && renderRulesTable(tripwireRules, "Tripwire")}
        {tabValue === 2 && renderRulesTable(roiRules, "ROI")}
      </CardContent>
    </Card>
  );
};

export default RuleManagement;
