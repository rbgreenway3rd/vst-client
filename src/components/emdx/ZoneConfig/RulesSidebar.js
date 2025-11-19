import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  listTripwireAlertRules,
  listRoiAlertRules,
  deleteTripwireAlertRule,
  deleteRoiAlertRule,
} from "../../../services/emdx/api_emdx";

/**
 * Sidebar component displaying active alert rules for the selected sensor
 */
const RulesSidebar = ({ selectedSensor, baseUrl, authToken, onRuleChange }) => {
  const [tripwireRules, setTripwireRules] = useState([]);
  const [roiRules, setRoiRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch rules for selected sensor
  const fetchRules = useCallback(async () => {
    if (!selectedSensor) {
      setTripwireRules([]);
      setRoiRules([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch tripwire rules
      const tripwireResponse = await listTripwireAlertRules(
        baseUrl,
        authToken,
        selectedSensor
      );
      setTripwireRules(tripwireResponse?.rules || []);

      // Fetch ROI rules
      const roiResponse = await listRoiAlertRules(
        baseUrl,
        authToken,
        selectedSensor
      );
      setRoiRules(roiResponse?.rules || []);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
      setError(err.message || "Failed to load rules");
      setTripwireRules([]);
      setRoiRules([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authToken, selectedSensor]);

  // Fetch rules when sensor changes
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  // Delete a rule
  const handleDeleteRule = async (ruleId, ruleType) => {
    try {
      if (ruleType === "tripwire") {
        await deleteTripwireAlertRule(baseUrl, authToken, ruleId);
        setTripwireRules((prev) => prev.filter((r) => r.id !== ruleId));
      } else if (ruleType === "roi") {
        await deleteRoiAlertRule(baseUrl, authToken, ruleId);
        setRoiRules((prev) => prev.filter((r) => r.id !== ruleId));
      }

      // Notify parent component
      if (onRuleChange) {
        onRuleChange();
      }
    } catch (err) {
      console.error("Failed to delete rule:", err);
      setError(`Failed to delete rule: ${err.message}`);
    }
  };

  const totalRules = tripwireRules.length + roiRules.length;

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6">⚠️ Active Alert Rules</Typography>
        <IconButton
          size="small"
          onClick={fetchRules}
          disabled={loading || !selectedSensor}
          title="Refresh Rules"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {error && (
        <Typography color="error" variant="body2" sx={{ my: 1 }}>
          {error}
        </Typography>
      )}

      {!loading && !selectedSensor && (
        <Typography color="textSecondary" variant="body2" sx={{ my: 2 }}>
          Select a sensor to view alert rules
        </Typography>
      )}

      {!loading && selectedSensor && totalRules === 0 && (
        <Typography color="textSecondary" variant="body2" sx={{ my: 2 }}>
          No alert rules configured for this sensor. Click "Add Rule" next to a
          zone to create one.
        </Typography>
      )}

      {/* Tripwire Rules */}
      {!loading && tripwireRules.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              Tripwire Rules ({tripwireRules.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {tripwireRules.map((rule) => (
                <ListItem
                  key={rule.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRule(rule.id, "tripwire")}
                      title="Delete Rule"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{ pl: 0 }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2">{rule.name}</Typography>
                        <Chip
                          label={rule.rule_type || "unknown"}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      rule.rule_type === "flowrate"
                        ? `>${rule.count_threshold || 0} in ${
                            rule.time_interval || 0
                          }s`
                        : `+${rule.count_threshold || 0} increment`
                    }
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* ROI Rules */}
      {!loading && roiRules.length > 0 && (
        <Accordion defaultExpanded sx={{ mt: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">
              ROI Rules ({roiRules.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense disablePadding>
              {roiRules.map((rule) => (
                <ListItem
                  key={rule.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRule(rule.id, "roi")}
                      title="Delete Rule"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                  sx={{ pl: 0 }}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="body2">{rule.name}</Typography>
                        <Chip
                          label={rule.rule_type || "occupancy"}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={`Threshold: ${rule.count_threshold || 0}`}
                    primaryTypographyProps={{ variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}
    </Paper>
  );
};

export default RulesSidebar;
