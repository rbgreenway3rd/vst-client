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
} from "@mui/material";
import {
  listFovAlertRules,
  listTripwireAlertRules,
  listRoiAlertRules,
  deleteFovAlertRule,
  deleteTripwireAlertRule,
  deleteRoiAlertRule,
} from "../../services/emdx/api_emdx";

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

  // Rules state
  const [fovRules, setFovRules] = useState([]);
  const [tripwireRules, setTripwireRules] = useState([]);
  const [roiRules, setRoiRules] = useState([]);

  // Fetch rules on mount and when tab changes
  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken, tabValue]);

  const fetchRules = async () => {
    setLoading(true);
    setError("");

    try {
      if (tabValue === 0) {
        // Fetch FOV rules
        const data = await listFovAlertRules(baseUrl, authToken);
        setFovRules(Array.isArray(data) ? data : data.rules || []);
      } else if (tabValue === 1) {
        // Fetch Tripwire rules
        const data = await listTripwireAlertRules(baseUrl, authToken);
        setTripwireRules(Array.isArray(data) ? data : data.rules || []);
      } else if (tabValue === 2) {
        // Fetch ROI rules
        const data = await listRoiAlertRules(baseUrl, authToken);
        setRoiRules(Array.isArray(data) ? data : data.rules || []);
      }
    } catch (err) {
      const errorMsg = `Failed to fetch rules: ${err.message}`;
      setError(errorMsg);
      if (onError) onError(err);
      console.error("Error fetching rules:", err);
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
          >
            Add Rule
          </Button>
          <Button variant="outlined" onClick={fetchRules} sx={{ ml: 1 }}>
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
