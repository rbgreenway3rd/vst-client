import React, { useState, useEffect, Suspense, lazy } from "react";
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Divider,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VideocamIcon from "@mui/icons-material/Videocam";
import SettingsIcon from "@mui/icons-material/Settings";
import FolderIcon from "@mui/icons-material/Folder";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";

// Import API functions
import { getSensors } from "../../services/vst/api_vst";
import { getHealth as getEmdxHealth } from "../../services/emdx/api_emdx";
import { getHealth as getCogniaHealth } from "../../services/cognia/api_cognia";

// Lazy load sub-components to improve performance
const LiveStream = lazy(() => import("../vst/LiveStream"));
const ZoneConfig = lazy(() => import("../emdx/ZoneConfig"));
const AnalyticsDashboard = lazy(() => import("../emdx/AnalyticsDashboard"));
const RuleManagement = lazy(() => import("../emdx/RuleManagement"));
const SensorManagement = lazy(() => import("../vst/SensorManagement"));
const FileManagement = lazy(() => import("../vst/FileManagement"));

// Lazy load Cognia components
const AlertHistory = lazy(() => import("../cognia/AlertHistory"));
const SubscriptionManager = lazy(() => import("../cognia/SubscriptionManager"));

/**
 * FullApp - Unified interface combining all VST, EMDX, and Cognia functionality
 *
 * This component provides a single-page experience with collapsible sections
 * for all major features: sensor management, streaming, analytics, and configuration.
 */
const FullApp = ({
  vstBaseUrl,
  vstAuthToken,
  emdxBaseUrl,
  emdxAuthToken,
  cogniaBaseUrl,
  cogniaAuthToken,
}) => {
  // Global sensor state
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");

  // System health state
  const [vstHealthy, setVstHealthy] = useState(null);
  const [emdxHealthy, setEmdxHealthy] = useState(null);
  const [cogniaHealthy, setCogniaHealthy] = useState(null);

  // UI state
  const [expandedSections, setExpandedSections] = useState({
    sensors: false,
    stream: false,
    zones: false,
    rules: false,
    analytics: false,
    files: false,
    alertHistory: false,
    subscriptions: false,
  });

  // Fetch sensors on mount
  useEffect(() => {
    fetchSensors();
    checkSystemHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vstBaseUrl, vstAuthToken]);

  const fetchSensors = async () => {
    try {
      const response = await getSensors(vstBaseUrl, vstAuthToken);
      const sensorList = response?.sensors || [];
      setSensors(sensorList);

      // Auto-select first sensor if none selected
      if (!selectedSensor && sensorList.length > 0) {
        setSelectedSensor(sensorList[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch sensors:", error);
    }
  };

  const checkSystemHealth = async () => {
    // Check VST health (simple connectivity test)
    try {
      await getSensors(vstBaseUrl, vstAuthToken);
      setVstHealthy(true);
    } catch (error) {
      setVstHealthy(false);
    }

    // Check EMDX health
    try {
      await getEmdxHealth(emdxBaseUrl, emdxAuthToken);
      setEmdxHealthy(true);
    } catch (error) {
      setEmdxHealthy(false);
    }

    // Check Cognia health
    if (cogniaBaseUrl) {
      try {
        await getCogniaHealth(cogniaBaseUrl, cogniaAuthToken);
        setCogniaHealthy(true);
      } catch (error) {
        console.error("Cognia health check failed:", error);
        setCogniaHealthy(false);
      }
    }
  };

  const handleSectionToggle = (section) => (event, isExpanded) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: isExpanded,
    }));
  };

  const handleError = (error) => {
    console.error("FullApp Error:", error);
    // Could add toast notification here in the future
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with global controls */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h5" gutterBottom>
              🚀 Full Application Control Center
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Unified interface for VST sensors, EMDX analytics, and Cognia
              alerts
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              flexWrap="wrap"
            >
              <Chip
                label={`VST: ${
                  vstHealthy === null
                    ? "..."
                    : vstHealthy
                    ? "Online"
                    : "Offline"
                }`}
                color={
                  vstHealthy
                    ? "success"
                    : vstHealthy === false
                    ? "error"
                    : "default"
                }
                size="small"
              />
              <Chip
                label={`EMDX: ${
                  emdxHealthy === null
                    ? "..."
                    : emdxHealthy
                    ? "Online"
                    : "Offline"
                }`}
                color={
                  emdxHealthy
                    ? "success"
                    : emdxHealthy === false
                    ? "error"
                    : "default"
                }
                size="small"
              />
              {cogniaBaseUrl && (
                <Chip
                  label={`Cognia: ${
                    cogniaHealthy === null
                      ? "..."
                      : cogniaHealthy
                      ? "Online"
                      : "Offline"
                  }`}
                  color={
                    cogniaHealthy
                      ? "success"
                      : cogniaHealthy === false
                      ? "error"
                      : "default"
                  }
                  size="small"
                />
              )}
              <Chip
                label={`${sensors.length} Sensors`}
                color="primary"
                size="small"
              />
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Info about component-specific sensor selection */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Note:</strong> Each section (Live Stream, Zone Config, etc.)
          has its own sensor selector. Use the dropdown within each section to
          choose the camera you want to work with.
        </Alert>
      </Paper>

      {/* VST Operations Section */}
      <Paper sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ p: 2, bgcolor: "primary.main", color: "white" }}
        >
          📹 VST Operations
        </Typography>

        {/* Sensor Management */}
        <Accordion
          expanded={expandedSections.sensors}
          onChange={handleSectionToggle("sensors")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <SettingsIcon sx={{ mr: 1 }} />
            <Typography>Sensor Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <SensorManagement
                baseUrl={vstBaseUrl}
                authToken={vstAuthToken}
                onError={handleError}
              />
            </Suspense>
          </AccordionDetails>
        </Accordion>

        {/* Live Streaming */}
        <Accordion
          expanded={expandedSections.stream}
          onChange={handleSectionToggle("stream")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <VideocamIcon sx={{ mr: 1 }} />
            <Typography>Live Stream</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <LiveStream baseUrl={vstBaseUrl} authToken={vstAuthToken} />
            </Suspense>
          </AccordionDetails>
        </Accordion>

        {/* File Management */}
        <Accordion
          expanded={expandedSections.files}
          onChange={handleSectionToggle("files")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <FolderIcon sx={{ mr: 1 }} />
            <Typography>File Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <FileManagement
                baseUrl={vstBaseUrl}
                authToken={vstAuthToken}
                onError={handleError}
              />
            </Suspense>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* EMDX Analytics Section */}
      <Paper sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{ p: 2, bgcolor: "success.main", color: "white" }}
        >
          🎯 EMDX Analytics & Configuration
        </Typography>

        {/* Analytics Dashboard */}
        <Accordion
          expanded={expandedSections.analytics}
          onChange={handleSectionToggle("analytics")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <DashboardIcon sx={{ mr: 1 }} />
            <Typography>Analytics Dashboard</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <AnalyticsDashboard
                baseUrl={emdxBaseUrl}
                authToken={emdxAuthToken}
                vstBaseUrl={vstBaseUrl}
                vstAuthToken={vstAuthToken}
                onError={handleError}
              />
            </Suspense>
          </AccordionDetails>
        </Accordion>

        {/* Zone Configuration */}
        <Accordion
          expanded={expandedSections.zones}
          onChange={handleSectionToggle("zones")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <MapIcon sx={{ mr: 1 }} />
            <Typography>Zone Configuration (Tripwires & ROIs)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <ZoneConfig
                vstBaseUrl={vstBaseUrl}
                vstAuthToken={vstAuthToken}
                baseUrl={emdxBaseUrl}
                authToken={emdxAuthToken}
              />
            </Suspense>
          </AccordionDetails>
        </Accordion>

        {/* Alert Rules */}
        <Accordion
          expanded={expandedSections.rules}
          onChange={handleSectionToggle("rules")}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <NotificationsIcon sx={{ mr: 1 }} />
            <Typography>Alert Rules Management</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Suspense fallback={<CircularProgress />}>
              <RuleManagement
                baseUrl={emdxBaseUrl}
                authToken={emdxAuthToken}
                vstBaseUrl={vstBaseUrl}
                vstAuthToken={vstAuthToken}
                onError={handleError}
              />
            </Suspense>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Cognia Alert Management Section */}
      {cogniaBaseUrl && (
        <Paper sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{ p: 2, bgcolor: "warning.main", color: "white" }}
          >
            🔔 Cognia Alert Management
          </Typography>

          {/* Alert History */}
          <Accordion
            expanded={expandedSections.alertHistory}
            onChange={handleSectionToggle("alertHistory")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography>Alert History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Suspense fallback={<CircularProgress />}>
                <AlertHistory
                  baseUrl={cogniaBaseUrl}
                  authToken={cogniaAuthToken}
                  sensors={sensors}
                />
              </Suspense>
            </AccordionDetails>
          </Accordion>

          {/* Subscription Manager */}
          <Accordion
            expanded={expandedSections.subscriptions}
            onChange={handleSectionToggle("subscriptions")}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography>Alert Subscriptions</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Suspense fallback={<CircularProgress />}>
                <SubscriptionManager
                  baseUrl={cogniaBaseUrl}
                  authToken={cogniaAuthToken}
                  sensors={sensors}
                />
              </Suspense>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          ⚡ Quick Actions
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Button
            variant="contained"
            onClick={() => handleSectionToggle("stream")(null, true)}
          >
            Open Live Stream
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => handleSectionToggle("zones")(null, true)}
          >
            Configure Zones
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={() => handleSectionToggle("analytics")(null, true)}
          >
            View Analytics
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleSectionToggle("sensors")(null, true)}
          >
            Manage Sensors
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default FullApp;
