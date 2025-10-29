import React, { useState, lazy, Suspense } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AppBar, Tabs, Tab, Box, Toolbar, Typography } from "@mui/material";
import "./App.css"; // Optional for custom styles

// Lazy load tab components to improve perf
const SensorManagement = lazy(() => import("./components/SensorManagement"));
const LiveStream2 = lazy(() => import("./components/LiveStream2"));
const ReplayStream = lazy(() => import("./components/ReplayStream"));
const StreamRecorder = lazy(() => import("./components/StreamRecorder"));
const FileManagement = lazy(() => import("./components/FileManagement"));
const RTSPProxyStream = lazy(() => import("./components/RTSPProxyStream"));

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" }, // NVIDIA blue-ish
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [vstBaseUrl, setVstBaseUrl] = useState("http://192.168.1.26:30000/api"); // Use the IP that works with VST's web UI
  // const [vstBaseUrl, setVstBaseUrl] = useState("http://10.0.0.144:30000/api"); // Direct IP had network routing issues
  const [authToken, setAuthToken] = useState(""); // For Basic Auth: 'Basic ' + btoa('user:pass')

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const tabComponents = [
    { label: "Sensor Management", component: SensorManagement },
    { label: "Live Stream", component: LiveStream2 },
    { label: "Replay Stream", component: ReplayStream },
    { label: "Stream Recorder", component: StreamRecorder },
    { label: "File Management", component: FileManagement },
    { label: "RTSP Proxy Stream", component: RTSPProxyStream },
  ];

  // Provide a default error handler
  const handleError = (err) => {
    // You can customize this to show a toast, alert, or log
    // For now, just log to console
    // eslint-disable-next-line no-console
    console.error("ERROR", err);
    alert(err && err.message ? err.message : String(err));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              VST Client
            </Typography>
            <input
              type="text"
              placeholder="VST Base URL"
              value={vstBaseUrl}
              onChange={(e) => setVstBaseUrl(e.target.value)}
              style={{ marginRight: 10, padding: 8 }}
            />
            <input
              type="password"
              placeholder="Auth Token (optional)"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              style={{ padding: 8 }}
            />
          </Toolbar>
        </AppBar>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          variant="fullWidth"
        >
          {tabComponents.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
        <Box sx={{ p: 3 }}>
          <Suspense fallback={<div>Loading tab...</div>}>
            {React.createElement(tabComponents[tabValue].component, {
              baseUrl: vstBaseUrl,
              authToken,
              onUpdateAuth: setAuthToken, // For login if needed
              onError: handleError,
            })}
          </Suspense>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
