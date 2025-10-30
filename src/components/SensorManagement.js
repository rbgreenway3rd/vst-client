// import React, { useState, useEffect, useCallback } from "react";
// import {
//   Button,
//   Typography,
//   TextField,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   Paper,
// } from "@mui/material";
// import {
//   getSensors,
//   addSensor as apiAddSensor,
//   removeSensor as apiRemoveSensor,
//   getSensorSettings,
//   getSensorQOS,
// } from "../utils/api";

// const SensorManagement = ({ baseUrl, authToken, onError }) => {
//   const [sensors, setSensors] = useState([]);
//   const [newSensor, setNewSensor] = useState({ name: "", url: "" });
//   const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
//   const [settingsData, setSettingsData] = useState(null);
//   const [settingsLoading, setSettingsLoading] = useState(false);
//   const [addingError, setAddingError] = useState("");
//   const [isAdding, setIsAdding] = useState(false);
//   const handleShowSettings = async (sensorId) => {
//     setSettingsDialogOpen(true);
//     setSettingsLoading(true);
//     setSettingsData(null);
//     console.log("Calling getSensorSettings with sensorId:", sensorId);

//     // First, show the full sensor object from the list
//     const sensor = sensors.find((s) => (s.sensorId || s.id) === sensorId);
//     console.log("Full sensor object from list:", sensor);

//     try {
//       const data = await getSensorSettings(baseUrl, authToken, sensorId);
//       console.log("getSensorSettings result:", data, "for sensorId:", sensorId);
//       // If settings API returns null, show the sensor object instead
//       setSettingsData(
//         data || {
//           note: "Settings API returned null. Showing sensor info from list instead:",
//           ...sensor,
//         }
//       );
//     } catch (error) {
//       console.error(
//         "getSensorSettings error:",
//         error,
//         "for sensorId:",
//         sensorId
//       );
//       setSettingsData({ error: error.message });
//     } finally {
//       setSettingsLoading(false);
//     }
//   };

//   const handleGetSensors = useCallback(async () => {
//     try {
//       const data = await getSensors(baseUrl, authToken);
//       setSensors(Array.isArray(data) ? data : data.sensors || []);
//       console.log("Fetched sensors:", data);
//     } catch (error) {
//       console.error("Failed to fetch sensors:", error);
//     }
//   }, [baseUrl, authToken]);

//   useEffect(() => {
//     handleGetSensors();
//   }, [handleGetSensors]);

//   const addSensor = async () => {
//     // Clear any previous errors
//     setAddingError("");

//     // Validate inputs
//     if (!newSensor.name || !newSensor.name.trim()) {
//       const errorMsg = "Sensor name is required";
//       setAddingError(errorMsg);
//       if (onError) onError(new Error(errorMsg));
//       alert(errorMsg);
//       return;
//     }

//     if (!newSensor.url || !newSensor.url.trim()) {
//       const errorMsg = "RTSP URL is required";
//       setAddingError(errorMsg);
//       if (onError) onError(new Error(errorMsg));
//       alert(errorMsg);
//       return;
//     }

//     // Validate RTSP URL format
//     if (!newSensor.url.toLowerCase().startsWith("rtsp://")) {
//       const errorMsg = "URL must start with rtsp://";
//       setAddingError(errorMsg);
//       if (onError) onError(new Error(errorMsg));
//       alert(errorMsg);
//       return;
//     }

//     console.log("Adding sensor with data:", newSensor);
//     console.log("Base URL:", baseUrl);
//     console.log("Auth Token:", authToken ? "Present" : "Not provided");

//     setIsAdding(true);
//     try {
//       // Log the exact payload being sent
//       console.log(
//         "Exact payload being sent to VST:",
//         JSON.stringify(newSensor, null, 2)
//       );

//       const result = await apiAddSensor(baseUrl, authToken, newSensor);
//       console.log("Add sensor result:", result);

//       // Refresh the sensor list
//       await handleGetSensors();

//       // Clear the form
//       setNewSensor({ name: "", url: "" });

//       alert(`Sensor "${newSensor.name}" added successfully!`);
//     } catch (error) {
//       console.error("Failed to add sensor:", error);
//       const errorMsg = error.message || "Failed to add sensor";
//       setAddingError(errorMsg);
//       if (onError) onError(error);
//       alert(`Error adding sensor: ${errorMsg}`);
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   const removeSensor = async (id) => {
//     try {
//       await apiRemoveSensor(baseUrl, authToken, id);
//       handleGetSensors();
//     } catch (error) {
//       console.error("Failed to remove sensor:", error);
//     }
//   };

//   const reAddSensor = async (sensor) => {
//     try {
//       // Log all available information about the sensor
//       console.log("All sensor info for re-add:", sensor);
//       // Fetch RTSP URL from getSensorQOS
//       let url = sensor.url || sensor.uri || sensor.sensorIp || "";
//       let qosMatch = null;
//       try {
//         const qos = await getSensorQOS(baseUrl, authToken);
//         if (qos && qos.stats && Array.isArray(qos.stats)) {
//           // Try to match by name
//           qosMatch = qos.stats.find((stat) => stat.name === sensor.name);
//           if (qosMatch && qosMatch.rtspUrl) {
//             url = qosMatch.rtspUrl;
//           }
//         }
//       } catch (qosErr) {
//         console.warn("QoS fetch failed:", qosErr);
//       }
//       if (!url) {
//         alert("Cannot re-add sensor: missing RTSP URL or IP address.");
//         return;
//       }
//       // Prepare payload: include all original properties except id/state/uri
//       const { state, id, sensorId, uri, ...rest } = sensor;
//       const payload = {
//         ...rest,
//         name: sensor.name,
//         url,
//       };
//       console.log(
//         "Re-adding sensor with payload:",
//         payload,
//         "QoS match:",
//         qosMatch
//       );
//       try {
//         const result = await apiAddSensor(baseUrl, authToken, payload);
//         console.log("addSensor result:", result);
//       } catch (addErr) {
//         console.error("addSensor error:", addErr, "Payload:", payload);
//         throw addErr;
//       }
//       handleGetSensors();
//     } catch (error) {
//       console.error("Failed to re-add sensor:", error);
//     }
//   };

//   return (
//     <Paper sx={{ p: 2 }}>
//       <Typography variant="h6">Add/Remove/Configure Cameras</Typography>
//       <div style={{ marginBottom: 20 }}>
//         <TextField
//           label="Sensor Name"
//           value={newSensor.name}
//           onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
//           size="small"
//           sx={{ mr: 2 }}
//           disabled={isAdding}
//           error={addingError && !newSensor.name}
//         />
//         <TextField
//           label="RTSP URL (e.g., rtsp://ip:port/stream)"
//           value={newSensor.url}
//           onChange={(e) => setNewSensor({ ...newSensor, url: e.target.value })}
//           size="small"
//           sx={{ mr: 2 }}
//           disabled={isAdding}
//           error={addingError && !newSensor.url}
//         />
//         <Button variant="contained" onClick={addSensor} disabled={isAdding}>
//           {isAdding ? "Adding..." : "Add Sensor"}
//         </Button>
//       </div>
//       {addingError && (
//         <div
//           style={{
//             marginBottom: 20,
//             padding: 10,
//             backgroundColor: "#ffebee",
//             borderRadius: 4,
//             border: "1px solid #ef5350",
//           }}
//         >
//           <Typography color="error" variant="body2">
//             {addingError}
//           </Typography>
//         </div>
//       )}
//       <Table>
//         <TableHead>
//           <TableRow>
//             <TableCell>ID</TableCell>
//             <TableCell>Name</TableCell>
//             <TableCell>IP/URI</TableCell>
//             <TableCell>Manufacturer</TableCell>
//             <TableCell>Hardware</TableCell>
//             <TableCell>Firmware</TableCell>
//             <TableCell>State</TableCell>
//             <TableCell>Remote Device ID</TableCell>
//             <TableCell>Actions</TableCell>
//             <TableCell>Settings</TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {sensors.map((sensor) => (
//             <TableRow key={sensor.sensorId || sensor.id}>
//               <TableCell>{sensor.sensorId || sensor.id}</TableCell>
//               <TableCell>{sensor.name}</TableCell>
//               <TableCell>{sensor.sensorIp || sensor.uri}</TableCell>
//               <TableCell>{sensor.manufacturer}</TableCell>
//               <TableCell>{sensor.hardware}</TableCell>
//               <TableCell>{sensor.firmwareVersion}</TableCell>
//               <TableCell>{sensor.state}</TableCell>
//               <TableCell>{sensor.remoteDeviceId}</TableCell>
//               <TableCell>
//                 {sensor.state === "removed" ? (
//                   <Button
//                     size="small"
//                     onClick={() => reAddSensor(sensor)}
//                     color="primary"
//                   >
//                     Re-add
//                   </Button>
//                 ) : (
//                   <Button
//                     size="small"
//                     onClick={() => removeSensor(sensor.sensorId || sensor.id)}
//                     color="error"
//                   >
//                     Remove
//                   </Button>
//                 )}
//               </TableCell>
//               <TableCell>
//                 <Button
//                   size="small"
//                   variant="outlined"
//                   onClick={() =>
//                     handleShowSettings(sensor.sensorId || sensor.id)
//                   }
//                 >
//                   Settings
//                 </Button>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//       {/* Settings Dialog */}
//       {settingsDialogOpen && (
//         <Paper
//           sx={{
//             position: "fixed",
//             top: "20%",
//             left: "50%",
//             transform: "translate(-50%, 0)",
//             zIndex: 1300,
//             p: 3,
//             minWidth: 400,
//           }}
//           elevation={6}
//         >
//           <Typography variant="h6" gutterBottom>
//             Sensor Settings
//           </Typography>
//           <pre
//             style={{
//               maxHeight: 300,
//               overflow: "auto",
//               background: "#f5f5f5",
//               padding: 10,
//             }}
//           >
//             {settingsLoading
//               ? "Loading..."
//               : settingsData && settingsData.error
//               ? `Error: ${settingsData.error}`
//               : settingsData
//               ? JSON.stringify(settingsData, null, 2)
//               : "No data."}
//           </pre>
//           <Button
//             variant="contained"
//             onClick={() => setSettingsDialogOpen(false)}
//             sx={{ mt: 2 }}
//           >
//             Close
//           </Button>
//         </Paper>
//       )}
//     </Paper>
//   );
// };

// export default SensorManagement;

// SensorManagement.js
import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Box,
} from "@mui/material";
import {
  getSensors,
  addSensor as apiAddSensor,
  removeSensor as apiRemoveSensor,
  getSensorSettings,
  getSensorQOS,
  getSensorInfo,
} from "../utils/api";

/* -------------------------------------------------------------
   Helper: Extract IP from RTSP URL (e.g., rtsp://user:pass@10.0.0.38:554/...)
   ------------------------------------------------------------- */
function extractIpFromUrl(url) {
  try {
    const match = url.match(/rtsp:\/\/[^@]*@([^\s:/]+)(:\d+)?/);
    return match ? match[1] : null;
  } catch (e) {
    return null;
  }
}

/* -------------------------------------------------------------
   Component
   ------------------------------------------------------------- */
const SensorManagement = ({ baseUrl, authToken, onError }) => {
  const [sensors, setSensors] = useState([]);
  const [newSensor, setNewSensor] = useState({
    name: "",
    url: "", // Full RTSP URL (used to extract IP)
    username: "",
    password: "",
    manufacturer: "Generic",
    hardware: "RTSP Stream",
    location: "Unknown",
  });

  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsData, setSettingsData] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [addingError, setAddingError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showRemoved, setShowRemoved] = useState(false);

  /* --------------------- FETCH SENSORS --------------------- */
  const handleGetSensors = useCallback(async () => {
    try {
      const data = await getSensors(baseUrl, authToken);
      const allSensors = Array.isArray(data) ? data : data.sensors || [];
      // Filter out soft-deleted sensors unless user wants to see them
      const filteredSensors = showRemoved
        ? allSensors
        : allSensors.filter((s) => s.state !== "removed");
      setSensors(filteredSensors);
    } catch (err) {
      console.error("Failed to fetch sensors:", err);
      if (onError) onError(err);
    }
  }, [baseUrl, authToken, onError, showRemoved]);

  useEffect(() => {
    handleGetSensors();
  }, [handleGetSensors]);

  /* --------------------- SETTINGS DIALOG --------------------- */
  const handleShowSettings = async (sensorId) => {
    setSettingsDialogOpen(true);
    setSettingsLoading(true);
    setSettingsData(null);

    const sensor = sensors.find((s) => (s.sensorId || s.id) === sensorId);
    try {
      const data = await getSensorSettings(baseUrl, authToken, sensorId);
      setSettingsData(
        data || {
          note: "Settings API returned null – showing sensor list entry",
          ...sensor,
        }
      );
    } catch (err) {
      setSettingsData({ error: err.message });
    } finally {
      setSettingsLoading(false);
    }
  };

  /* --------------------- ADD SENSOR --------------------- */
  const addSensor = async () => {
    setAddingError("");

    if (!newSensor.name?.trim())
      return setAddingError("Sensor name is required");
    if (!newSensor.url?.trim()) return setAddingError("RTSP URL is required");
    if (!newSensor.url.toLowerCase().startsWith("rtsp://"))
      return setAddingError("URL must start with rtsp://");

    setIsAdding(true);

    try {
      // Extract IP, credentials, and channel info from RTSP URL
      // Format: rtsp://username:password@ip:port/path?channel=X
      const urlMatch = newSensor.url.match(/rtsp:\/\/([^:]+):([^@]+)@([^:/]+)/);
      const channelMatch = newSensor.url.match(/[?&]channel=(\d+)/);

      if (!urlMatch) {
        throw new Error(
          "Invalid RTSP URL format. Expected: rtsp://user:pass@ip:port/path"
        );
      }

      const username = urlMatch[1];
      const password = urlMatch[2];
      const sensorIp = urlMatch[3];
      const channel = channelMatch ? channelMatch[1] : "1";

      // VST only accepts sensorIp, not full URL
      // For multi-channel systems, we encode the channel in the tags field
      const payload = {
        name: newSensor.name.trim(),
        sensorIp: sensorIp,
        username: username,
        password: password,
        tags: `channel=${channel}`, // Store channel info in tags to differentiate
        manufacturer: newSensor.manufacturer || "Generic",
        hardware: newSensor.hardware || "RTSP Stream",
        location: newSensor.location || "Unknown",
      };

      console.log(
        "Payload sent to /v1/sensor/add →",
        JSON.stringify(payload, null, 2)
      );

      const result = await apiAddSensor(baseUrl, authToken, payload);
      console.log("Add sensor success →", result);

      await handleGetSensors();
      setNewSensor({
        name: "",
        url: "",
        username: "",
        password: "",
        manufacturer: "Generic",
        hardware: "RTSP Stream",
        location: "Unknown",
      });
      alert(`Sensor "${payload.name}" added successfully!`);
    } catch (err) {
      const msg = err.message || "Failed to add sensor";
      console.error("Add sensor error:", err);
      setAddingError(msg);
      if (onError) onError(err);
      alert(`Error adding sensor: ${msg}`);
    } finally {
      setIsAdding(false);
    }
  };

  /* --------------------- REMOVE SENSOR --------------------- */
  const removeSensor = async (id) => {
    if (
      !window.confirm(
        `Remove sensor ${id}? It will be soft-deleted (marked as "removed").`
      )
    )
      return;

    try {
      await apiRemoveSensor(baseUrl, authToken, id);
      console.log(`Sensor ${id} soft-deleted successfully`);

      // Refresh the sensor list (will filter out removed sensors by default)
      await handleGetSensors();

      alert(`Sensor ${id} has been removed. Use "Show Removed" to see it.`);
    } catch (err) {
      console.error("Failed to remove sensor:", err);

      // If sensor is already removed, just refresh the list
      if (
        err.message.includes("CameraNotFoundError") ||
        err.message.includes("Camera not found")
      ) {
        console.log("Sensor already removed in VST, refreshing list...");
        await handleGetSensors();
        alert(`Sensor ${id} was already removed. List refreshed.`);
      } else {
        alert(`Remove failed: ${err.message}`);
        if (onError) onError(err);
      }
    }
  };

  /* --------------------- RE-ADD SENSOR --------------------- */
  const reAddSensor = async (sensor) => {
    console.log("🔄 Re-adding sensor - Sensor from list:", sensor);

    try {
      // Fetch full sensor details since the list only returns name/id/state for removed sensors
      console.log(`Fetching full sensor info for ID: ${sensor.sensorId}`);
      const fullSensorInfo = await getSensorInfo(
        baseUrl,
        authToken,
        sensor.sensorId
      );
      console.log("Full sensor info from API:", fullSensorInfo);

      // Extract IP and credentials from the full sensor info
      let sensorIp =
        fullSensorInfo?.sensorIp ||
        fullSensorInfo?.uri ||
        sensor.sensorIp ||
        sensor.uri ||
        "";
      let username = fullSensorInfo?.username || sensor.username || "";
      let password = fullSensorInfo?.password || sensor.password || "";

      console.log("Extracted values:", { sensorIp, username, password });

      // If still no IP, try to extract from URL field
      if (!sensorIp && (fullSensorInfo?.url || sensor.url)) {
        const url = fullSensorInfo?.url || sensor.url;
        sensorIp = extractIpFromUrl(url) || "";
        console.log("Extracted IP from URL:", sensorIp);
      }

      // If no IP found, VST doesn't preserve the data - prompt user to enter manually
      if (!sensorIp) {
        console.warn(
          "⚠️ VST returned null for sensor info - data not preserved after removal"
        );

        const rtspUrl = prompt(
          `VST doesn't preserve sensor data after removal.\n\n` +
            `To re-add "${sensor.name}", please enter the RTSP URL:\n` +
            `(e.g., rtsp://username:password@192.168.1.100:554/stream)`
        );

        if (!rtspUrl) {
          return; // User cancelled
        }

        // Validate RTSP URL
        if (!rtspUrl.toLowerCase().startsWith("rtsp://")) {
          return alert("Invalid URL. Must start with rtsp://");
        }

        // Extract IP from the provided URL
        sensorIp = extractIpFromUrl(rtspUrl) || "";

        // Try to extract credentials from URL
        try {
          const urlObj = new URL(rtspUrl);
          if (urlObj.username) username = urlObj.username;
          if (urlObj.password) password = urlObj.password;
        } catch (e) {
          console.warn("Could not parse credentials from URL:", e);
        }

        if (!sensorIp) {
          return alert("Could not extract IP address from the URL provided.");
        }

        console.log("User provided RTSP URL. Extracted:", {
          sensorIp,
          username,
          password,
        });
      }

      const payload = {
        name: fullSensorInfo?.name || sensor.name,
        sensorIp,
        username,
        password,
        manufacturer:
          fullSensorInfo?.manufacturer || sensor.manufacturer || "Generic",
        hardware: fullSensorInfo?.hardware || sensor.hardware || "RTSP Stream",
        location: fullSensorInfo?.location || sensor.location || "Unknown",
      };

      console.log("Re-add payload:", payload);

      await apiAddSensor(baseUrl, authToken, payload);
      await handleGetSensors();
      alert(`Re-added "${sensor.name}" successfully!`);
    } catch (err) {
      console.error("Re-add error:", err);
      alert(`Re-add failed: ${err.message}`);
      if (onError) onError(err);
    }
  };

  /* ------------------------------------------------------------- */
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Add / Remove / Configure Cameras
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        <strong>Multi-channel systems (Lorex, etc.):</strong> Include the full
        RTSP URL with channel parameter (e.g.,
        rtsp://user:pass@10.0.0.38:554/cam/realmonitor?channel=1&subtype=1).
        Each channel will be treated as a separate sensor.
      </Typography>

      {/* ---------- Add Form ---------- */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <TextField
          label="Sensor Name *"
          value={newSensor.name}
          onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
          size="small"
          disabled={isAdding}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label="RTSP URL * (to extract IP)"
          placeholder="rtsp://admin:pass@10.0.0.38:554/..."
          value={newSensor.url}
          onChange={(e) => setNewSensor({ ...newSensor, url: e.target.value })}
          size="small"
          disabled={isAdding}
          sx={{ minWidth: 360 }}
        />
        <TextField
          label="Username"
          value={newSensor.username}
          onChange={(e) =>
            setNewSensor({ ...newSensor, username: e.target.value })
          }
          size="small"
          disabled={isAdding}
          sx={{ minWidth: 120 }}
        />
        <TextField
          label="Password"
          type="password"
          value={newSensor.password}
          onChange={(e) =>
            setNewSensor({ ...newSensor, password: e.target.value })
          }
          size="small"
          disabled={isAdding}
          sx={{ minWidth: 120 }}
        />
        <Button variant="contained" onClick={addSensor} disabled={isAdding}>
          {isAdding ? "Adding…" : "Add Sensor"}
        </Button>
      </div>

      {/* ---------- Add Error ---------- */}
      {addingError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {addingError}
        </Alert>
      )}

      {/* ---------- Show/Hide Removed Toggle ---------- */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          Registered Sensors
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setShowRemoved(!showRemoved)}
        >
          {showRemoved ? "Hide Removed" : "Show Removed"}
        </Button>
      </Box>

      {/* ---------- Sensors Table ---------- */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>IP/URI</TableCell>
            <TableCell>Manufacturer</TableCell>
            <TableCell>Hardware</TableCell>
            <TableCell>Firmware</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Remote ID</TableCell>
            <TableCell>Actions</TableCell>
            <TableCell>Settings</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sensors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} align="center">
                <Typography color="textSecondary">No sensors</Typography>
              </TableCell>
            </TableRow>
          ) : (
            sensors.map((s) => (
              <TableRow key={s.sensorId || s.id}>
                <TableCell>{s.sensorId || s.id}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.sensorIp || s.uri || s.url || "-"}</TableCell>
                <TableCell>{s.manufacturer || "-"}</TableCell>
                <TableCell>{s.hardware || "-"}</TableCell>
                <TableCell>{s.firmwareVersion || "-"}</TableCell>
                <TableCell>
                  <span
                    style={{
                      color:
                        s.state === "active"
                          ? "green"
                          : s.state === "removed"
                          ? "orange"
                          : "red",
                      fontWeight: "bold",
                    }}
                  >
                    {s.state || "unknown"}
                  </span>
                </TableCell>
                <TableCell>{s.remoteDeviceId || "-"}</TableCell>
                <TableCell>
                  {s.state === "removed" ? (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => reAddSensor(s)}
                    >
                      Re-add
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeSensor(s.sensorId || s.id)}
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleShowSettings(s.sensorId || s.id)}
                  >
                    Settings
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* ---------- Settings Dialog ---------- */}
      {settingsDialogOpen && (
        <Paper
          sx={{
            position: "fixed",
            top: "15%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1300,
            p: 3,
            minWidth: 560,
            maxHeight: "70vh",
            overflow: "auto",
          }}
          elevation={8}
        >
          <Typography variant="h6" gutterBottom>
            Sensor Settings
          </Typography>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 12,
              borderRadius: 4,
              fontSize: "0.85rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {settingsLoading
              ? "Loading…"
              : settingsData?.error
              ? `Error: ${settingsData.error}`
              : JSON.stringify(settingsData, null, 2) || "No data"}
          </pre>
          <Button
            variant="contained"
            onClick={() => setSettingsDialogOpen(false)}
            sx={{ mt: 2 }}
          >
            Close
          </Button>
        </Paper>
      )}
    </Paper>
  );
};

export default SensorManagement;
