import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  createTripwireAlertRule,
  listTripwireAlertRules,
  deleteTripwireAlertRule,
} from "../../../services/emdx/api_emdx";

/**
 * Alerts tab component for managing alert rules
 */
const AlertsTab = ({
  selectedSensor,
  pendingRuleForTripwire,
  onClearPendingRule,
  baseUrl,
  authToken,
}) => {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState("flowrate"); // flowrate or increment
  const [ruleName, setRuleName] = useState("");
  const [timeInterval, setTimeInterval] = useState("60");
  const [countThreshold, setCountThreshold] = useState("");
  const [direction, setDirection] = useState("entry");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [existingRules, setExistingRules] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  // Auto-open dialog when pendingRuleForTripwire is set
  useEffect(() => {
    if (pendingRuleForTripwire) {
      handleOpenDialog();
    }
  }, [pendingRuleForTripwire]);

  // Fetch existing rules when sensor is selected
  const fetchExistingRules = useCallback(async () => {
    if (!selectedSensor) return;

    setIsLoadingRules(true);
    try {
      const response = await listTripwireAlertRules(
        baseUrl,
        authToken,
        selectedSensor
      );
      console.log("Fetched existing rules:", response);

      // Extract rules array - handle different response formats
      let allRules = [];
      if (Array.isArray(response)) {
        allRules = response;
      } else if (response?.rules) {
        allRules = response.rules;
      }

      // Filter rules for the selected sensor (if not already filtered by API)
      const sensorRules = allRules.filter(
        (rule) =>
          !rule.sensorId ||
          rule.sensorId === selectedSensor ||
          rule.sensor_id === selectedSensor
      );

      setExistingRules(sensorRules);
    } catch (error) {
      console.error("Failed to fetch existing rules:", error);
      // Treat 422 (no rules exist yet) as empty array, not an error
      if (error.message && error.message.includes("422")) {
        setExistingRules([]);
      }
    } finally {
      setIsLoadingRules(false);
    }
  }, [baseUrl, authToken, selectedSensor]);

  useEffect(() => {
    if (selectedSensor && baseUrl) {
      fetchExistingRules();
    }
  }, [selectedSensor, baseUrl, fetchExistingRules]);

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this alert rule?")) {
      return;
    }

    try {
      await deleteTripwireAlertRule(baseUrl, authToken, ruleId);
      setSuccess("Alert rule deleted successfully");
      fetchExistingRules(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete rule:", error);
      setError(error.message || "Failed to delete alert rule");
    }
  };

  const handleOpenDialog = () => {
    setRuleDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setRuleDialogOpen(false);
    setRuleName("");
    setTimeInterval("60");
    setCountThreshold("");
    setDirection("entry");
    setRuleType("flowrate");
    if (onClearPendingRule) {
      onClearPendingRule();
    }
  };

  const handleCreateRule = async () => {
    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      // Generate a unique rule ID
      const ruleId = crypto.randomUUID();

      // Construct the rule payload according to NVIDIA EMDX API v2 spec
      const rulePayload = {
        sensorId: selectedSensor,
        rules: [
          {
            id: pendingRuleForTripwire?.id, // tripwire ID
            ruleId: ruleId,
            name: ruleName,
            type: "tripwire", // Always "tripwire" for tripwire rules
            ruleType: ruleType, // "flowrate" or "increment"
            timeInterval: parseInt(timeInterval),
            countThreshold: parseInt(countThreshold),
            direction: direction, // "entry" or "exit"
            parameters: [], // Optional additional parameters (currently unused)
          },
        ],
      };

      console.log("Creating rule with payload:", rulePayload);

      // Call the API
      const response = await createTripwireAlertRule(
        baseUrl,
        authToken,
        rulePayload
      );

      console.log("Rule created successfully:", response);
      setSuccess(
        `Alert rule "${ruleName}" created successfully for tripwire "${pendingRuleForTripwire?.name}"`
      );

      // Refresh the rules list
      fetchExistingRules();

      // Close dialog after a brief delay to show success message
      setTimeout(() => {
        handleCloseDialog();
      }, 2000);
    } catch (err) {
      console.error("Failed to create rule:", err);
      setError(err.message || "Failed to create alert rule");
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <Box sx={{ p: 2 }}>
      {pendingRuleForTripwire && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Ready to create an alert rule for tripwire:{" "}
          <strong>{pendingRuleForTripwire.name}</strong>
        </Alert>
      )}

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">🔔 Alert Rules & History</Typography>
        <Box>
          <IconButton
            onClick={fetchExistingRules}
            disabled={isLoadingRules}
            title="Refresh rules"
          >
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
          >
            ➕ Create Alert Rule
          </Button>
        </Box>
      </Box>

      <Typography color="textSecondary" sx={{ mb: 2 }}>
        Configure alert rules and view alert history
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Active Alert Rules ({existingRules.length})</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {isLoadingRules ? (
            <Typography color="textSecondary">Loading rules...</Typography>
          ) : existingRules.length === 0 ? (
            <Typography color="textSecondary">
              No alert rules configured yet. Click "Create Alert Rule" to get
              started.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Rule Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Threshold</TableCell>
                  <TableCell>Time Interval</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Tripwire ID</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingRules.map((rule) => (
                  <TableRow key={rule.ruleId || rule.rule_id}>
                    <TableCell>{rule.name || "Unnamed"}</TableCell>
                    <TableCell>
                      <Chip
                        label={rule.ruleType || rule.rule_type}
                        size="small"
                        color={
                          rule.ruleType === "flowrate" ? "primary" : "secondary"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {rule.countThreshold || rule.count_threshold}
                    </TableCell>
                    <TableCell>
                      {rule.timeInterval || rule.time_interval}s
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rule.direction}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{rule.id}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          handleDeleteRule(rule.ruleId || rule.rule_id)
                        }
                        title="Delete rule"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Recent Alerts (Last 24h)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="textSecondary">
            Alert history will be displayed here
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Alert Rule Creation Dialog */}
      <Dialog
        open={ruleDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Alert Rule</DialogTitle>
        <DialogContent>
          {pendingRuleForTripwire && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Creating alert for tripwire:{" "}
              <strong>{pendingRuleForTripwire.name}</strong>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            autoFocus
            margin="dense"
            label="Rule Name"
            fullWidth
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g., Main Door Entry Alert"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Alert Type</InputLabel>
            <Select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              label="Alert Type"
            >
              <MenuItem value="flowrate">
                Flow Rate - Alert when threshold crossings occur within time
                interval
              </MenuItem>
              <MenuItem value="increment">
                Increment - Alert when count increases by threshold within time
                interval
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Time Interval (seconds)"
            fullWidth
            type="number"
            value={timeInterval}
            onChange={(e) => setTimeInterval(e.target.value)}
            placeholder="e.g., 60"
            helperText="Time window in seconds for evaluating the threshold"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label="Count Threshold"
            fullWidth
            type="number"
            value={countThreshold}
            onChange={(e) => setCountThreshold(e.target.value)}
            placeholder="e.g., 10"
            helperText={
              ruleType === "flowrate"
                ? "Number of crossings within time interval to trigger alert"
                : "Count increase within time interval to trigger alert"
            }
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Direction</InputLabel>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              label="Direction"
            >
              <MenuItem value="entry">
                Entry - Objects crossing toward entry side
              </MenuItem>
              <MenuItem value="exit">
                Exit - Objects crossing toward exit side
              </MenuItem>
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Note:</strong> Alert rules are active immediately upon
            creation.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="error"
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateRule}
            color="primary"
            variant="contained"
            disabled={!ruleName.trim() || !countThreshold || isCreating}
          >
            {isCreating ? "Creating..." : "Create Rule"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsTab;
