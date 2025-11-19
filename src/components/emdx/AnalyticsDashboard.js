import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  getAlerts,
  getAlertsCount,
  getMetrics,
  getFovOccupancyCount,
  getHealth,
} from "../../services/emdx/api_emdx";

const AnalyticsDashboard = ({
  baseUrl,
  authToken,
  vstBaseUrl,
  vstAuthToken,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [health, setHealth] = useState(null);
  const [alertsCount, setAlertsCount] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [occupancyCount, setOccupancyCount] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl, authToken]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch all dashboard data in parallel
      const [healthData, countData, alertsData, metricsData, occupancyData] =
        await Promise.allSettled([
          getHealth(baseUrl, authToken),
          getAlertsCount(baseUrl, authToken),
          getAlerts(baseUrl, authToken, { limit: 10 }), // Get last 10 alerts
          getMetrics(baseUrl, authToken),
          getFovOccupancyCount(baseUrl, authToken),
        ]);

      if (healthData.status === "fulfilled") setHealth(healthData.value);
      if (countData.status === "fulfilled") setAlertsCount(countData.value);
      if (alertsData.status === "fulfilled")
        setRecentAlerts(
          Array.isArray(alertsData.value)
            ? alertsData.value
            : alertsData.value.alerts || []
        );
      if (metricsData.status === "fulfilled") setMetrics(metricsData.value);
      if (occupancyData.status === "fulfilled")
        setOccupancyCount(occupancyData.value);

      // Log any failures
      [healthData, countData, alertsData, metricsData, occupancyData].forEach(
        (result, idx) => {
          if (result.status === "rejected") {
            console.warn(`Dashboard data fetch ${idx} failed:`, result.reason);
          }
        }
      );
    } catch (err) {
      const errorMsg = `Failed to fetch dashboard data: ${err.message}`;
      setError(errorMsg);
      if (onError) onError(err);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle }) => (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Typography variant="overline" color="textSecondary">
        {title}
      </Typography>
      <Typography variant="h4" sx={{ my: 1 }}>
        {value !== null && value !== undefined ? value : "N/A"}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Analytics Dashboard</Typography>
          <Button
            variant="outlined"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Refresh"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Service Status */}
        {health && (
          <Alert
            severity={health.status === "healthy" ? "success" : "warning"}
            sx={{ mb: 2 }}
          >
            EMDX Service Status:{" "}
            {health.status || health.message || JSON.stringify(health)}
          </Alert>
        )}

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Total Alerts"
              value={alertsCount?.total_count || alertsCount?.count || 0}
              subtitle="All time"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Recent Alerts"
              value={recentAlerts.length}
              subtitle="Last 10"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Occupancy Count"
              value={occupancyCount?.count}
              subtitle="Current"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard
              title="Metrics"
              value={metrics ? Object.keys(metrics).length : 0}
              subtitle="Available"
            />
          </Grid>
        </Grid>

        {/* Recent Alerts */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
            Recent Alerts
          </Typography>
          {recentAlerts.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflow: "auto" }}>
              {recentAlerts.map((alert, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1,
                    mb: 1,
                    backgroundColor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2">
                    <strong>Type:</strong> {alert.alert_type || "Unknown"} |{" "}
                    <strong>Sensor:</strong> {alert.sensor_id || "N/A"} |{" "}
                    <strong>Time:</strong>{" "}
                    {alert.timestamp || alert.time || "N/A"}
                  </Typography>
                  {alert.message && (
                    <Typography variant="caption" color="textSecondary">
                      {alert.message}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No recent alerts
            </Typography>
          )}
        </Paper>

        {/* Metrics Data */}
        {metrics && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
              Metrics Data
            </Typography>
            <pre
              style={{
                maxHeight: 300,
                overflow: "auto",
                background: "#f5f5f5",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </Paper>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;
