import React, { useState, lazy, Suspense } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AppBar, Tabs, Tab, Box, Toolbar, Typography } from "@mui/material";
import "./App.css"; // Optional for custom styles

// Lazy load VST components
const SensorManagement = lazy(() =>
  import("./components/vst/SensorManagement")
);
const LiveStream = lazy(() => import("./components/vst/LiveStream"));
const LiveStreamGateway = lazy(() =>
  import("./components/vst/LiveStreamGateway")
);
const ReplayStream = lazy(() => import("./components/vst/ReplayStream"));
const StreamRecorder = lazy(() => import("./components/vst/StreamRecorder"));
const FileManagement = lazy(() => import("./components/vst/FileManagement"));
const RTSPProxyStream = lazy(() => import("./components/vst/RTSPProxyStream"));

// Lazy load EMDX components
const RuleManagement = lazy(() => import("./components/emdx/RuleManagement"));
const AnalyticsDashboard = lazy(() =>
  import("./components/emdx/AnalyticsDashboard")
);
const ZoneConfig = lazy(() => import("./components/emdx/ZoneConfig"));

// Lazy load shared components
const FullApp = lazy(() => import("./components/shared/FullApp"));

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" }, // NVIDIA blue-ish
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);

  // VST Configuration
  const [vstBaseUrl, setVstBaseUrl] = useState("http://192.168.1.26:30000/api"); // Use the IP that works with VST's web UI
  // const [vstBaseUrl, setVstBaseUrl] = useState("http://10.0.0.144:30000/api"); // Direct IP had network routing issues
  const [vstAuthToken, setVstAuthToken] = useState(""); // For Basic Auth: 'Basic ' + btoa('user:pass')

  // EMDX Configuration (for future analytics features)
  const [emdxBaseUrl, setEmdxBaseUrl] = useState("http://192.168.1.26:5000");
  const [emdxAuthToken, setEmdxAuthToken] = useState("");

  // Cognia Configuration
  const [cogniaBaseUrl, setCogniaBaseUrl] = useState(
    "http://192.168.1.26:8000"
  );
  const [cogniaAuthToken, setCogniaAuthToken] = useState("");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const tabComponents = [
    { label: "🚀 FullApp", component: FullApp, api: "both" },
    { label: "Sensor Management", component: SensorManagement, api: "vst" },
    { label: "Live Stream (VST)", component: LiveStream, api: "vst" },
    {
      label: "Live Stream (Gateway)",
      component: LiveStreamGateway,
      api: "vst",
    },
    { label: "Replay Stream", component: ReplayStream, api: "vst" },
    { label: "Stream Recorder", component: StreamRecorder, api: "vst" },
    { label: "File Management", component: FileManagement, api: "vst" },
    { label: "RTSP Proxy Stream", component: RTSPProxyStream, api: "vst" },
    // EMDX Analytics components
    {
      label: "Analytics Dashboard",
      component: AnalyticsDashboard,
      api: "emdx",
    },
    { label: "Rules", component: RuleManagement, api: "emdx" },
    { label: "Zone & Rule Config", component: ZoneConfig, api: "emdx" },
  ];

  // Provide a default error handler
  const handleError = (err) => {
    // You can customize this to show a toast, alert, or log
    // For now, just log to console
    // eslint-disable-next-line no-console
    console.error("ERROR", err);
    alert(err && err.message ? err.message : String(err));
  };

  // Get props for the current tab based on which API it uses
  const currentTab = tabComponents[tabValue];
  const componentProps =
    currentTab?.api === "vst"
      ? {
          baseUrl: vstBaseUrl,
          authToken: vstAuthToken,
          onUpdateAuth: setVstAuthToken,
          onError: handleError,
        }
      : currentTab?.api === "emdx"
      ? {
          baseUrl: emdxBaseUrl,
          authToken: emdxAuthToken,
          onUpdateAuth: setEmdxAuthToken,
          onError: handleError,
          // Pass VST credentials so EMDX components can fetch VST sensors
          vstBaseUrl: vstBaseUrl,
          vstAuthToken: vstAuthToken,
        }
      : currentTab?.api === "both"
      ? {
          // FullApp needs VST, EMDX, and Cognia credentials
          vstBaseUrl: vstBaseUrl,
          vstAuthToken: vstAuthToken,
          emdxBaseUrl: emdxBaseUrl,
          emdxAuthToken: emdxAuthToken,
          cogniaBaseUrl: cogniaBaseUrl,
          cogniaAuthToken: cogniaAuthToken,
          onError: handleError,
        }
      : { onError: handleError };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Surveillance Platform
            </Typography>

            {/* VST Server Configuration */}
            <Box sx={{ display: "flex", flexDirection: "column", mr: 2 }}>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}
              >
                VST Server
              </Typography>
              <input
                type="text"
                placeholder="VST Base URL"
                value={vstBaseUrl}
                onChange={(e) => setVstBaseUrl(e.target.value)}
                style={{ padding: 4, fontSize: 12, width: 200 }}
              />
            </Box>

            {/* EMDX Analytics Configuration (for future use) */}
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              <Typography
                variant="caption"
                sx={{ color: "rgba(255,255,255,0.7)", fontSize: 10 }}
              >
                EMDX Analytics
              </Typography>
              <input
                type="text"
                placeholder="EMDX Base URL"
                value={emdxBaseUrl}
                onChange={(e) => setEmdxBaseUrl(e.target.value)}
                style={{ padding: 4, fontSize: 12, width: 200 }}
              />
            </Box>
          </Toolbar>
        </AppBar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabComponents.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          <Suspense fallback={<div>Loading tab...</div>}>
            {React.createElement(
              tabComponents[tabValue].component,
              componentProps
            )}
          </Suspense>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
