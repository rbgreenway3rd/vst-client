import React, { useState, useEffect } from "react";
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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**
 * Alerts tab component for managing alert rules
 */
const AlertsTab = ({
  selectedSensor,
  pendingRuleForTripwire,
  onClearPendingRule,
}) => {
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleType, setRuleType] = useState("flowrate"); // flowrate or increment
  const [ruleName, setRuleName] = useState("");
  const [timeInterval, setTimeInterval] = useState("60");
  const [countThreshold, setCountThreshold] = useState("");
  const [direction, setDirection] = useState("entry");
  const [enabled, setEnabled] = useState(true);

  // Auto-open dialog when pendingRuleForTripwire is set
  useEffect(() => {
    if (pendingRuleForTripwire) {
      setRuleName(`${pendingRuleForTripwire.name} - Flow Alert`);
      setRuleDialogOpen(true);
    }
  }, [pendingRuleForTripwire]);

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
    setEnabled(true);
    if (onClearPendingRule) {
      onClearPendingRule();
    }
  };

  const handleCreateRule = () => {
    // TODO: Implement rule creation API call
    console.log("Creating rule:", {
      tripwireId: pendingRuleForTripwire?.id,
      name: ruleName,
      type: ruleType,
      timeInterval: parseInt(timeInterval),
      countThreshold: parseInt(countThreshold),
      direction: direction,
      enabled: enabled,
      sensorId: selectedSensor,
    });

    alert("Rule creation coming soon! Rule configuration logged to console.");
    handleCloseDialog();
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
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          ➕ Create Alert Rule
        </Button>
      </Box>

      <Typography color="textSecondary" sx={{ mb: 2 }}>
        Configure alert rules and view alert history
      </Typography>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Active Alert Rules (0)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography color="textSecondary">
            No alert rules configured yet. Click "Create Alert Rule" to get
            started.
          </Typography>
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
                Flow Rate - Alert on crossing rate per minute
              </MenuItem>
              <MenuItem value="increment">
                Increment - Alert when count increases
              </MenuItem>
              <MenuItem value="decrement">
                Decrement - Alert when count decreases
              </MenuItem>
            </Select>
          </FormControl>

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

          <FormControlLabel
            control={
              <Checkbox
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="Enable this rule immediately"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">
            Cancel
          </Button>
          <Button
            onClick={handleCreateRule}
            color="primary"
            variant="contained"
            disabled={!ruleName.trim() || !countThreshold}
          >
            Create Rule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertsTab;
