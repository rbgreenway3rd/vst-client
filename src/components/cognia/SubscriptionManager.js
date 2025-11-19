import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  toggleSubscription,
} from "../../services/cognia/api_cognia";

/**
 * SubscriptionManager component for managing alert subscriptions
 */
const SubscriptionManager = ({ baseUrl, authToken, sensors = [] }) => {
  // State for subscriptions
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  // Form state
  const [sensorId, setSensorId] = useState("");
  const [alertTypes, setAlertTypes] = useState([]);
  const [notificationMethod, setNotificationMethod] = useState("ntfy");
  const [severityFilter, setSeverityFilter] = useState("info");
  const [ntfyTopic, setNtfyTopic] = useState("");
  const [ntfyServer, setNtfyServer] = useState("https://ntfy.sh");
  const [emailAddress, setEmailAddress] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [active, setActive] = useState(true);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    if (!baseUrl || !authToken) return;

    setLoading(true);
    setError("");

    try {
      const subs = await getSubscriptions(baseUrl, authToken);
      setSubscriptions(subs || []);
    } catch (err) {
      console.error("Failed to fetch subscriptions:", err);
      setError(err.message || "Failed to fetch subscriptions");
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl, authToken]);

  // Fetch on mount
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Open create dialog
  const handleOpenCreateDialog = () => {
    resetForm();
    setEditMode(false);
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (subscription) => {
    setCurrentSubscription(subscription);
    setSensorId(subscription.sensor_id);
    setAlertTypes(subscription.alert_types || []);
    setNotificationMethod(subscription.notification_method);
    setSeverityFilter(subscription.severity_filter || "info");
    setActive(subscription.active !== false);

    // Set method-specific config
    if (subscription.notification_method === "ntfy") {
      setNtfyTopic(subscription.notification_config?.topic || "");
      setNtfyServer(
        subscription.notification_config?.server || "https://ntfy.sh"
      );
    } else if (subscription.notification_method === "email") {
      setEmailAddress(subscription.notification_config?.email || "");
    } else if (subscription.notification_method === "webhook") {
      setWebhookUrl(subscription.notification_config?.url || "");
    }

    setEditMode(true);
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentSubscription(null);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setSensorId("");
    setAlertTypes([]);
    setNotificationMethod("ntfy");
    setSeverityFilter("info");
    setNtfyTopic("");
    setNtfyServer("https://ntfy.sh");
    setEmailAddress("");
    setWebhookUrl("");
    setActive(true);
  };

  // Handle create subscription
  const handleCreateSubscription = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!sensorId) {
      setError("Please select a sensor");
      return;
    }
    if (alertTypes.length === 0) {
      setError("Please select at least one alert type");
      return;
    }

    // Build notification config
    let notificationConfig = {};
    if (notificationMethod === "ntfy") {
      if (!ntfyTopic) {
        setError("Please enter ntfy topic");
        return;
      }
      notificationConfig = { topic: ntfyTopic, server: ntfyServer };
    } else if (notificationMethod === "email") {
      if (!emailAddress) {
        setError("Please enter email address");
        return;
      }
      notificationConfig = { email: emailAddress };
    } else if (notificationMethod === "webhook") {
      if (!webhookUrl) {
        setError("Please enter webhook URL");
        return;
      }
      notificationConfig = { url: webhookUrl };
    }

    const subscriptionData = {
      sensor_id: sensorId,
      alert_types: alertTypes,
      notification_method: notificationMethod,
      notification_config: notificationConfig,
      severity_filter: severityFilter,
      active,
    };

    try {
      setLoading(true);
      await createSubscription(baseUrl, authToken, subscriptionData);
      setSuccess("Subscription created successfully");
      handleCloseDialog();
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to create subscription:", err);
      setError(err.message || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  // Handle update subscription
  const handleUpdateSubscription = async () => {
    if (!currentSubscription) return;

    setError("");
    setSuccess("");

    // Build notification config
    let notificationConfig = {};
    if (notificationMethod === "ntfy") {
      if (!ntfyTopic) {
        setError("Please enter ntfy topic");
        return;
      }
      notificationConfig = { topic: ntfyTopic, server: ntfyServer };
    } else if (notificationMethod === "email") {
      if (!emailAddress) {
        setError("Please enter email address");
        return;
      }
      notificationConfig = { email: emailAddress };
    } else if (notificationMethod === "webhook") {
      if (!webhookUrl) {
        setError("Please enter webhook URL");
        return;
      }
      notificationConfig = { url: webhookUrl };
    }

    const updateData = {
      alert_types: alertTypes,
      notification_method: notificationMethod,
      notification_config: notificationConfig,
      severity_filter: severityFilter,
      active,
    };

    try {
      setLoading(true);
      await updateSubscription(
        baseUrl,
        authToken,
        currentSubscription.id,
        updateData
      );
      setSuccess("Subscription updated successfully");
      handleCloseDialog();
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to update subscription:", err);
      setError(err.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete subscription
  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm("Are you sure you want to delete this subscription?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      setLoading(true);
      await deleteSubscription(baseUrl, authToken, subscriptionId);
      setSuccess("Subscription deleted successfully");
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to delete subscription:", err);
      setError(err.message || "Failed to delete subscription");
    } finally {
      setLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (subscriptionId, currentActive) => {
    setError("");

    try {
      await toggleSubscription(
        baseUrl,
        authToken,
        subscriptionId,
        !currentActive
      );
      fetchSubscriptions();
    } catch (err) {
      console.error("Failed to toggle subscription:", err);
      setError(err.message || "Failed to toggle subscription");
    }
  };

  // Get sensor name
  const getSensorName = (sensorId) => {
    const sensor = sensors.find((s) => s.id === sensorId);
    return sensor?.name || sensorId;
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Alert Subscriptions</Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchSubscriptions}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              New Subscription
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Subscriptions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sensor</TableCell>
              <TableCell>Alert Types</TableCell>
              <TableCell>Method</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No subscriptions found. Create one to start receiving
                    alerts.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>{getSensorName(sub.sensor_id)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                      {sub.alert_types?.map((type) => (
                        <Chip
                          key={type}
                          label={type.toUpperCase()}
                          size="small"
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.notification_method}
                      size="small"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={sub.severity_filter?.toUpperCase()}
                      size="small"
                      color={
                        sub.severity_filter === "critical"
                          ? "error"
                          : sub.severity_filter === "warning"
                          ? "warning"
                          : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sub.active !== false}
                      onChange={() =>
                        handleToggleActive(sub.id, sub.active !== false)
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenEditDialog(sub)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSubscription(sub.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? "Edit Subscription" : "Create New Subscription"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Sensor Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth disabled={editMode}>
                  <InputLabel>Sensor *</InputLabel>
                  <Select
                    value={sensorId}
                    onChange={(e) => setSensorId(e.target.value)}
                    label="Sensor *"
                  >
                    {sensors.map((sensor) => (
                      <MenuItem key={sensor.id} value={sensor.id}>
                        {sensor.name || sensor.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Alert Types */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Alert Types *</InputLabel>
                  <Select
                    multiple
                    value={alertTypes}
                    onChange={(e) => setAlertTypes(e.target.value)}
                    label="Alert Types *"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={value.toUpperCase()}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="fov">FOV</MenuItem>
                    <MenuItem value="tripwire">Tripwire</MenuItem>
                    <MenuItem value="roi">ROI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Notification Method */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Notification Method</InputLabel>
                  <Select
                    value={notificationMethod}
                    onChange={(e) => setNotificationMethod(e.target.value)}
                    label="Notification Method"
                  >
                    <MenuItem value="ntfy">ntfy.sh</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="webhook">Webhook</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Notification Config - ntfy */}
              {notificationMethod === "ntfy" && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ntfy Topic *"
                      value={ntfyTopic}
                      onChange={(e) => setNtfyTopic(e.target.value)}
                      placeholder="my-alerts"
                      helperText="Topic to publish alerts to"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="ntfy Server"
                      value={ntfyServer}
                      onChange={(e) => setNtfyServer(e.target.value)}
                      placeholder="https://ntfy.sh"
                    />
                  </Grid>
                </>
              )}

              {/* Notification Config - Email */}
              {notificationMethod === "email" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address *"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="user@example.com"
                  />
                </Grid>
              )}

              {/* Notification Config - Webhook */}
              {notificationMethod === "webhook" && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Webhook URL *"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Severity Filter */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Minimum Severity</InputLabel>
                  <Select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    label="Minimum Severity"
                  >
                    <MenuItem value="info">Info (All alerts)</MenuItem>
                    <MenuItem value="warning">Warning and above</MenuItem>
                    <MenuItem value="critical">Critical only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Active Toggle */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={
              editMode ? handleUpdateSubscription : handleCreateSubscription
            }
            disabled={loading}
          >
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionManager;
