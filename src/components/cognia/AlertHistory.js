import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import {
  getAlertHistory,
  getAlertById,
} from "../../services/cognia/api_cognia";

/**
 * AlertHistory component for viewing and filtering alert history from Cognia API
 */
const AlertHistory = ({ baseUrl, authToken, sensors = [] }) => {
  // State for alert data
  const [alerts, setAlerts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Filter state
  const [sensorFilter, setSensorFilter] = useState("");
  const [alertTypeFilter, setAlertTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [fromTimestamp, setFromTimestamp] = useState(() => {
    // Default to last 24 hours
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [toTimestamp, setToTimestamp] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });

  // Detail dialog state
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    if (!baseUrl || !authToken) return;

    setLoading(true);
    setError("");

    try {
      const params = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
      };

      // Add filters if set
      if (sensorFilter) params.sensor_id = sensorFilter;
      if (alertTypeFilter) params.alert_type = alertTypeFilter;
      if (severityFilter) params.severity = severityFilter;
      if (fromTimestamp) {
        params.from_timestamp = Math.floor(
          new Date(fromTimestamp).getTime() / 1000
        );
      }
      if (toTimestamp) {
        params.to_timestamp = Math.floor(
          new Date(toTimestamp).getTime() / 1000
        );
      }

      const response = await getAlertHistory(baseUrl, authToken, params);

      setAlerts(response.alerts || []);
      setTotalCount(response.total_count || 0);
    } catch (err) {
      console.error("Failed to fetch alert history:", err);
      setError(err.message || "Failed to fetch alert history");
      setAlerts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    baseUrl,
    authToken,
    page,
    rowsPerPage,
    sensorFilter,
    alertTypeFilter,
    severityFilter,
    fromTimestamp,
    toTimestamp,
  ]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setSensorFilter("");
    setAlertTypeFilter("");
    setSeverityFilter("");
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    setFromTimestamp(yesterday.toISOString().slice(0, 16));
    setToTimestamp(now.toISOString().slice(0, 16));
    setPage(0);
  };

  // Handle view alert detail
  const handleViewDetail = async (alertId) => {
    setLoadingDetail(true);
    setDetailDialogOpen(true);

    try {
      const alertDetail = await getAlertById(baseUrl, authToken, alertId);
      setSelectedAlert(alertDetail);
    } catch (err) {
      console.error("Failed to fetch alert detail:", err);
      setError(err.message || "Failed to fetch alert details");
      setDetailDialogOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle close detail dialog
  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedAlert(null);
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  // Get alert type color
  const getAlertTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case "fov":
        return "primary";
      case "tripwire":
        return "secondary";
      case "roi":
        return "success";
      default:
        return "default";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Alert History</Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchAlerts}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button startIcon={<FilterIcon />} onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Sensor</InputLabel>
              <Select
                value={sensorFilter}
                onChange={(e) => {
                  setSensorFilter(e.target.value);
                  setPage(0);
                }}
                label="Sensor"
              >
                <MenuItem value="">All Sensors</MenuItem>
                {sensors.map((sensor) => (
                  <MenuItem key={sensor.id} value={sensor.id}>
                    {sensor.name || sensor.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Alert Type</InputLabel>
              <Select
                value={alertTypeFilter}
                onChange={(e) => {
                  setAlertTypeFilter(e.target.value);
                  setPage(0);
                }}
                label="Alert Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="fov">FOV</MenuItem>
                <MenuItem value="tripwire">Tripwire</MenuItem>
                <MenuItem value="roi">ROI</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setPage(0);
                }}
                label="Severity"
              >
                <MenuItem value="">All Severities</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="From"
              type="datetime-local"
              value={fromTimestamp}
              onChange={(e) => {
                setFromTimestamp(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              size="small"
              label="To"
              type="datetime-local"
              value={toTimestamp}
              onChange={(e) => {
                setToTimestamp(e.target.value);
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Sensor</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Message</TableCell>
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
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No alerts found for the selected filters
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id} hover>
                  <TableCell>{formatTimestamp(alert.timestamp)}</TableCell>
                  <TableCell>{alert.sensor_id}</TableCell>
                  <TableCell>
                    <Chip
                      label={alert.alert_type?.toUpperCase()}
                      color={getAlertTypeColor(alert.alert_type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={alert.severity?.toUpperCase()}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {alert.message || alert.rule_name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetail(alert.id)}
                      color="primary"
                    >
                      <ViewIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </TableContainer>

      {/* Alert Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {loadingDetail ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : selectedAlert ? (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Alert ID
                  </Typography>
                  <Typography variant="body1">{selectedAlert.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Timestamp
                  </Typography>
                  <Typography variant="body1">
                    {formatTimestamp(selectedAlert.timestamp)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Sensor ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedAlert.sensor_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Alert Type
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={selectedAlert.alert_type?.toUpperCase()}
                      color={getAlertTypeColor(selectedAlert.alert_type)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Severity
                  </Typography>
                  <Typography variant="body1">
                    <Chip
                      label={selectedAlert.severity?.toUpperCase()}
                      color={getSeverityColor(selectedAlert.severity)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="textSecondary">
                    Rule Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedAlert.rule_name || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="textSecondary">
                    Message
                  </Typography>
                  <Typography variant="body1">
                    {selectedAlert.message || "N/A"}
                  </Typography>
                </Grid>
                {selectedAlert.metadata && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                      Metadata
                    </Typography>
                    <Paper sx={{ p: 1, bgcolor: "grey.100" }}>
                      <pre style={{ margin: 0, fontSize: "0.875rem" }}>
                        {JSON.stringify(selectedAlert.metadata, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Typography>No alert details available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AlertHistory;
