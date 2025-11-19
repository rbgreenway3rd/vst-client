import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  getTripwireHistogram,
  getTripwireCount,
  getTripwireAlertsV2,
  getTripwiresConfig,
} from "../../../services/emdx/api_emdx";

/**
 * Analytics tab component for viewing real tripwire metrics and analytics
 *
 * Displays:
 * - Tripwire crossing counts (histogram and totals)
 * - Time range selection for metrics
 * - Direction breakdown (IN/OUT)
 * - Object type filtering (Person, Vehicle, etc.)
 * - Triggered alerts history
 */
const AnalyticsTab = ({ selectedSensor, baseUrl, authToken }) => {
  // Tripwire selection state
  const [tripwires, setTripwires] = useState([]);
  const [selectedTripwire, setSelectedTripwire] = useState("");
  const [loadingTripwires, setLoadingTripwires] = useState(false);

  // Time range state - default to last hour
  const [fromTimestamp, setFromTimestamp] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 1); // 1 hour ago
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  });
  const [toTimestamp, setToTimestamp] = useState(() => {
    return new Date().toISOString().slice(0, 16); // Now
  });

  // Metrics state
  const [histogramData, setHistogramData] = useState(null);
  const [totalCounts, setTotalCounts] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Loading and error states
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Object type filter state
  const [objectTypeFilter, setObjectTypeFilter] = useState(""); // "", "*", or "Person,Vehicle"

  // Bucket size for histogram (in seconds)
  const [bucketSize, setBucketSize] = useState("60"); // Default 1 minute

  /**
   * Fetch available tripwires for the selected sensor
   */
  const fetchTripwires = useCallback(async () => {
    if (!selectedSensor || !baseUrl || !authToken) return;

    setLoadingTripwires(true);
    setError("");

    try {
      const response = await getTripwiresConfig(
        baseUrl,
        authToken,
        selectedSensor
      );
      console.log("Fetched tripwires for analytics:", response);

      // Extract tripwire list from response
      const tripwireList = response?.rules || [];
      setTripwires(tripwireList);

      // Auto-select first tripwire if available
      if (tripwireList.length > 0 && !selectedTripwire) {
        setSelectedTripwire(tripwireList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch tripwires:", err);
      setError(`Failed to load tripwires: ${err.message}`);
      setTripwires([]);
    } finally {
      setLoadingTripwires(false);
    }
  }, [selectedSensor, baseUrl, authToken, selectedTripwire]);

  // Fetch tripwires when sensor changes
  useEffect(() => {
    fetchTripwires();
  }, [fetchTripwires]);

  /**
   * Fetch histogram data showing time-bucketed crossing counts
   */
  const fetchHistogram = async () => {
    if (!selectedSensor || !selectedTripwire) {
      setError("Please select a sensor and tripwire");
      return;
    }

    setLoadingMetrics(true);
    setError("");

    try {
      // Convert datetime-local format to ISO 8601 with .000Z suffix
      const fromISO = new Date(fromTimestamp).toISOString();
      const toISO = new Date(toTimestamp).toISOString();

      const params = {
        sensorId: selectedSensor,
        tripwireId: selectedTripwire,
        fromTimestamp: fromISO,
        toTimestamp: toISO,
        bucketSizeInSec: parseInt(bucketSize),
      };

      // Add object type filter if specified
      if (objectTypeFilter) {
        params.objectType = objectTypeFilter;
      }

      console.log("Fetching histogram with params:", params);
      const response = await getTripwireHistogram(baseUrl, authToken, params);
      console.log("Histogram response:", response);

      setHistogramData(response);
      setSuccess("Histogram data loaded successfully");
    } catch (err) {
      console.error("Failed to fetch histogram:", err);
      setError(`Failed to load histogram: ${err.message}`);
      setHistogramData(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  /**
   * Fetch total counts for the selected time range
   */
  const fetchTotalCounts = async () => {
    if (!selectedSensor || !selectedTripwire) {
      setError("Please select a sensor and tripwire");
      return;
    }

    setLoadingMetrics(true);
    setError("");

    try {
      const fromISO = new Date(fromTimestamp).toISOString();
      const toISO = new Date(toTimestamp).toISOString();

      const params = {
        sensorId: selectedSensor,
        tripwireId: selectedTripwire,
        fromTimestamp: fromISO,
        toTimestamp: toISO,
      };

      // Add object type filter if specified
      if (objectTypeFilter) {
        params.objectType = objectTypeFilter;
      }

      console.log("Fetching total counts with params:", params);
      const response = await getTripwireCount(baseUrl, authToken, params);
      console.log("Total counts response:", response);

      setTotalCounts(response);
      setSuccess("Total counts loaded successfully");
    } catch (err) {
      console.error("Failed to fetch total counts:", err);
      setError(`Failed to load total counts: ${err.message}`);
      setTotalCounts(null);
    } finally {
      setLoadingMetrics(false);
    }
  };

  /**
   * Fetch triggered alerts for the selected time range
   */
  const fetchAlerts = async () => {
    if (!selectedSensor) {
      setError("Please select a sensor");
      return;
    }

    setLoadingAlerts(true);
    setError("");

    try {
      const fromISO = new Date(fromTimestamp).toISOString();
      const toISO = new Date(toTimestamp).toISOString();

      const params = {
        sensorId: selectedSensor,
        fromTimestamp: fromISO,
        toTimestamp: toISO,
        limit: 50, // Get last 50 alerts
      };

      console.log("Fetching alerts with params:", params);
      const response = await getTripwireAlertsV2(baseUrl, authToken, params);
      console.log("Alerts response:", response);

      setAlerts(response?.alerts || []);
      setSuccess(`Loaded ${response?.alerts?.length || 0} alerts`);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      setError(`Failed to load alerts: ${err.message}`);
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  };

  /**
   * Fetch all metrics data
   */
  const handleFetchAll = () => {
    setSuccess("");
    setError("");
    fetchHistogram();
    fetchTotalCounts();
    fetchAlerts();
  };

  /**
   * Render total counts summary cards
   */
  const renderTotalCounts = () => {
    if (
      !totalCounts ||
      !totalCounts.tripwireKpis ||
      totalCounts.tripwireKpis.length === 0
    ) {
      return (
        <Alert severity="info">
          No count data available for the selected time range
        </Alert>
      );
    }

    const tripwireKpi = totalCounts.tripwireKpis[0];
    const inEvent = tripwireKpi.events?.find((e) => e.type === "IN");
    const outEvent = tripwireKpi.events?.find((e) => e.type === "OUT");

    // Calculate totals across all object types
    const inCount =
      inEvent?.objects?.reduce((sum, obj) => sum + obj.count, 0) || 0;
    const outCount =
      outEvent?.objects?.reduce((sum, obj) => sum + obj.count, 0) || 0;
    const netCount = inCount - outCount;

    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total IN
              </Typography>
              <Typography variant="h4" color="success.main">
                {inCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Objects entered
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total OUT
              </Typography>
              <Typography variant="h4" color="error.main">
                {outCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Objects exited
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Count
              </Typography>
              <Typography
                variant="h4"
                color={netCount >= 0 ? "success.main" : "error.main"}
              >
                {netCount >= 0 ? "+" : ""}
                {netCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                IN - OUT
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Activity
              </Typography>
              <Typography variant="h4" color="primary.main">
                {inCount + outCount}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                All crossings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Object type breakdown if available */}
        {(inEvent?.objects?.length > 1 || outEvent?.objects?.length > 1) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Breakdown by Object Type
              </Typography>
              <Grid container spacing={2}>
                {/* IN breakdown */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Entering (IN):
                  </Typography>
                  {inEvent?.objects?.map((obj, idx) => (
                    <Chip
                      key={idx}
                      label={`${obj.type}: ${obj.count}`}
                      color="success"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Grid>

                {/* OUT breakdown */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Exiting (OUT):
                  </Typography>
                  {outEvent?.objects?.map((obj, idx) => (
                    <Chip
                      key={idx}
                      label={`${obj.type}: ${obj.count}`}
                      color="error"
                      variant="outlined"
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };

  /**
   * Render histogram data table
   */
  const renderHistogram = () => {
    if (
      !histogramData ||
      !histogramData.tripwires ||
      histogramData.tripwires.length === 0
    ) {
      return (
        <Alert severity="info">
          No histogram data available for the selected time range
        </Alert>
      );
    }

    const tripwire = histogramData.tripwires[0];
    const histogram = tripwire.histogram || [];

    if (histogram.length === 0) {
      return (
        <Alert severity="info">
          No activity recorded during this time period
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Bucket Size: {histogramData.bucketSizeInSec} seconds | Total Buckets:{" "}
          {histogram.length}
        </Typography>
        <Paper sx={{ maxHeight: 400, overflow: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Time Period</TableCell>
                <TableCell align="center">IN Count</TableCell>
                <TableCell align="center">OUT Count</TableCell>
                <TableCell align="center">Net</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {histogram.map((bucket, idx) => {
                const inEvent = bucket.events?.find((e) => e.type === "IN");
                const outEvent = bucket.events?.find((e) => e.type === "OUT");

                const inCount =
                  inEvent?.objects?.reduce((sum, obj) => sum + obj.count, 0) ||
                  0;
                const outCount =
                  outEvent?.objects?.reduce((sum, obj) => sum + obj.count, 0) ||
                  0;
                const net = inCount - outCount;

                return (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(bucket.start).toLocaleTimeString()} -{" "}
                        {new Date(bucket.end).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={inCount} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={outCount} color="error" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={net >= 0 ? `+${net}` : net}
                        color={net >= 0 ? "success" : "error"}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    );
  };

  /**
   * Render alerts table
   */
  const renderAlerts = () => {
    if (alerts.length === 0) {
      return (
        <Alert severity="info">
          No alerts triggered during the selected time range
        </Alert>
      );
    }

    return (
      <Paper sx={{ maxHeight: 400, overflow: "auto", mt: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Tripwire</TableCell>
              <TableCell>Rule Type</TableCell>
              <TableCell>Direction</TableCell>
              <TableCell>Count</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert, idx) => (
              <TableRow key={idx} hover>
                <TableCell>
                  <Typography variant="caption">
                    {new Date(alert.startTimestamp).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {alert.attributes?.find((a) => a.name === "tripwireName")
                    ?.value ||
                    alert.attributes?.find((a) => a.name === "tripwireId")
                      ?.value ||
                    "N/A"}
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.ruleType}
                    size="small"
                    color={
                      alert.ruleType === "flowrate" ? "primary" : "secondary"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.direction}
                    size="small"
                    color={alert.direction === "entry" ? "success" : "error"}
                  />
                </TableCell>
                <TableCell>
                  <strong>{alert.count}</strong>
                </TableCell>
                <TableCell>
                  <Typography variant="caption">{alert.description}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        📊 Tripwire Analytics Dashboard
      </Typography>
      <Typography color="textSecondary" sx={{ mb: 2 }}>
        View real-time and historical analytics for your configured tripwires
      </Typography>

      {/* Configuration Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Configuration
        </Typography>

        {!selectedSensor && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please select a sensor from the Zone Setup tab first
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Tripwire Selection */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Select Tripwire</InputLabel>
              <Select
                value={selectedTripwire}
                onChange={(e) => setSelectedTripwire(e.target.value)}
                label="Select Tripwire"
                disabled={loadingTripwires || !selectedSensor}
              >
                {tripwires.map((tripwire) => (
                  <MenuItem key={tripwire.id} value={tripwire.id}>
                    {tripwire.name || tripwire.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {loadingTripwires && (
              <Typography variant="caption" color="textSecondary">
                Loading tripwires...
              </Typography>
            )}
          </Grid>

          {/* Object Type Filter */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Object Type Filter</InputLabel>
              <Select
                value={objectTypeFilter}
                onChange={(e) => setObjectTypeFilter(e.target.value)}
                label="Object Type Filter"
              >
                <MenuItem value="">All (Cumulative)</MenuItem>
                <MenuItem value="*">All (Breakdown)</MenuItem>
                <MenuItem value="Person">Person Only</MenuItem>
                <MenuItem value="Vehicle">Vehicle Only</MenuItem>
                <MenuItem value="Person,Vehicle">Person & Vehicle</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* From Timestamp */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="From Time"
              type="datetime-local"
              value={fromTimestamp}
              onChange={(e) => setFromTimestamp(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* To Timestamp */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="To Time"
              type="datetime-local"
              value={toTimestamp}
              onChange={(e) => setToTimestamp(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Bucket Size */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Histogram Bucket Size</InputLabel>
              <Select
                value={bucketSize}
                onChange={(e) => setBucketSize(e.target.value)}
                label="Histogram Bucket Size"
              >
                <MenuItem value="1">1 second</MenuItem>
                <MenuItem value="5">5 seconds</MenuItem>
                <MenuItem value="10">10 seconds</MenuItem>
                <MenuItem value="30">30 seconds</MenuItem>
                <MenuItem value="60">1 minute</MenuItem>
                <MenuItem value="300">5 minutes</MenuItem>
                <MenuItem value="600">10 minutes</MenuItem>
                <MenuItem value="3600">1 hour</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Fetch Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleFetchAll}
              disabled={
                !selectedSensor ||
                !selectedTripwire ||
                loadingMetrics ||
                loadingAlerts
              }
              startIcon={
                loadingMetrics || loadingAlerts ? (
                  <CircularProgress size={20} />
                ) : (
                  <RefreshIcon />
                )
              }
              fullWidth
            >
              {loadingMetrics || loadingAlerts
                ? "Loading..."
                : "Fetch Analytics Data"}
            </Button>
          </Grid>
        </Grid>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mt: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}
      </Paper>

      {/* Total Counts Section */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">📈 Total Crossing Counts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loadingMetrics ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            renderTotalCounts()
          )}
        </AccordionDetails>
      </Accordion>

      {/* Histogram Section */}
      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">
            📊 Histogram (Time-Bucketed Counts)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loadingMetrics ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            renderHistogram()
          )}
        </AccordionDetails>
      </Accordion>

      {/* Alerts Section */}
      <Accordion sx={{ mt: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">🔔 Triggered Alerts</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {loadingAlerts ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            renderAlerts()
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default AnalyticsTab;
