import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Grid,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { getSensors } from "../../../services/vst/api_vst";
import {
  createTripwireConfig,
  createRoiConfig,
  deleteTripwireConfig,
  deleteRoiConfig,
  getTripwiresConfig,
  getRoisConfig,
} from "../../../services/emdx/api_emdx";
import { useSnapshot } from "./hooks/useSnapshot";
import { useZoneDrawing } from "./hooks/useZoneDrawing";
import ZoneCanvas from "./ZoneCanvas";
import ZonesSidebar from "./ZonesSidebar";
import RulesSidebar from "./RulesSidebar";
import ZoneItemDialog from "./ZoneItemDialog";
import AlertsTab from "./AlertsTab";

/**
 * Main ZoneConfig component - container that manages state and coordinates sub-components
 */
const ZoneConfig = ({
  vstBaseUrl,
  vstAuthToken,
  baseUrl,
  authToken,
  gatewayUrl = "http://192.168.1.26:30010",
  streamIdPrefix = "camera-",
  title = "Tripwire & ROI Configuration",
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Sensor state
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");

  // Message state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedZoneForRule, setSelectedZoneForRule] = useState(null);

  // Custom hooks
  const {
    snapshotUrl,
    isLoadingSnapshot,
    imageDimensions,
    captureSnapshot,
    handleImageLoad: handleSnapshotImageLoad,
  } = useSnapshot(gatewayUrl, streamIdPrefix);

  const {
    tripwires,
    rois,
    currentItem,
    isDrawing,
    drawingMode,
    directionP1,
    directionP2,
    isSettingDirection,
    handleCanvasClick,
    handleCanvasRightClick,
    handleCanvasMouseMove,
    startDrawing,
    finishDrawing,
    startSettingDirection,
    saveItem,
    cancelDrawing,
    clearAllZones,
    deleteZone,
    loadExistingZones,
  } = useZoneDrawing(canvasRef, imageRef);

  // Fetch VST sensors on mount (SDR automatically syncs them with EMDX)
  const fetchSensors = async () => {
    try {
      const data = await getSensors(vstBaseUrl, vstAuthToken);
      const allSensors = Array.isArray(data) ? data : data.sensors || [];
      const activeSensors = allSensors.filter(
        (s) => s.state !== "removed" && s.state !== "REMOVED"
      );
      setSensors(activeSensors);
    } catch (error) {
      console.error("Failed to fetch VST sensors:", error);
      setError("Failed to fetch sensors: " + error.message);
    }
  };

  useEffect(() => {
    fetchSensors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vstBaseUrl, vstAuthToken]);

  // Fetch existing tripwires and ROIs when sensor is selected
  useEffect(() => {
    const fetchExistingConfigurations = async () => {
      if (!selectedSensor || !snapshotUrl) return; // Only fetch if sensor selected and snapshot captured

      let sensorTripwires = [];
      let sensorRois = [];

      // Fetch tripwires (handle 422 as "no data")
      try {
        const tripwiresData = await getTripwiresConfig(
          baseUrl,
          authToken,
          selectedSensor
        );
        console.log("Fetched tripwires config:", tripwiresData);

        // Extract tripwires array - handle both possible formats
        if (Array.isArray(tripwiresData)) {
          sensorTripwires = tripwiresData;
        } else if (tripwiresData?.tripwires) {
          sensorTripwires = tripwiresData.tripwires;
        } else if (tripwiresData?.data) {
          sensorTripwires = tripwiresData.data;
        }
      } catch (error) {
        // 422 means no tripwires configured yet - that's OK
        if (!error.message?.includes("422")) {
          console.error("Failed to fetch tripwires:", error);
        }
      }

      // Fetch ROIs (handle 422 as "no data")
      try {
        const roisData = await getRoisConfig(
          baseUrl,
          authToken,
          selectedSensor
        );
        console.log("Fetched ROIs config:", roisData);

        // Extract ROIs array - handle both possible formats
        if (Array.isArray(roisData)) {
          sensorRois = roisData;
        } else if (roisData?.rois) {
          sensorRois = roisData.rois;
        } else if (roisData?.data) {
          sensorRois = roisData.data;
        }
      } catch (error) {
        // 422 means no ROIs configured yet - that's OK
        if (!error.message?.includes("422")) {
          console.error("Failed to fetch ROIs:", error);
        }
      }

      console.log("Loaded tripwires for sensor:", sensorTripwires);
      console.log("Loaded ROIs for sensor:", sensorRois);

      // Load them into the drawing state
      if (sensorTripwires.length > 0 || sensorRois.length > 0) {
        loadExistingZones(sensorTripwires, sensorRois);
        setSuccess(
          `Loaded ${sensorTripwires.length} tripwire(s) and ${sensorRois.length} ROI(s)`
        );
      } else {
        // Clear zones if nothing configured
        loadExistingZones([], []);
      }
    };

    fetchExistingConfigurations();
  }, [selectedSensor, snapshotUrl, baseUrl, authToken, loadExistingZones]);

  // Handle snapshot capture
  const handleCaptureSnapshot = async () => {
    setError("");
    setSuccess("");

    try {
      await captureSnapshot(selectedSensor);
      // Don't clear zones automatically - they'll be reloaded by the useEffect
      setSuccess(
        "Snapshot captured successfully! Loading existing configurations..."
      );
    } catch (err) {
      console.error("Failed to capture snapshot:", err);
      setError("Failed to capture snapshot: " + err.message);
    }
  };

  // Handle image load
  const handleImageLoad = () => {
    handleSnapshotImageLoad(imageRef, canvasRef);
  };

  // Handle start drawing
  const handleStartDrawing = (mode) => {
    startDrawing(mode);
    setError("");
    setSuccess("");
  };

  // Handle finish drawing
  const handleFinishDrawing = () => {
    const result = finishDrawing();

    if (!result.success) {
      setError(
        `${
          drawingMode === "tripwire" ? "Tripwire" : "ROI"
        } must have at least ${result.minPoints} points`
      );
      return;
    }

    if (result.needsDirection) {
      setSuccess("Click the ENTRY point on the image");
    } else {
      setItemDialogOpen(true);
    }
  };

  // Handle canvas right click
  const handleCanvasRightClickWrapper = (e) => {
    const shouldFinish = handleCanvasRightClick(e);
    if (shouldFinish) {
      handleFinishDrawing();
    }
  };

  // Handle set direction
  const handleSetDirection = () => {
    setItemDialogOpen(false);
    startSettingDirection();
    setError("");
    setSuccess("Click the ENTRY point on the image");
  };

  // Watch for direction completion
  useEffect(() => {
    if (directionP1 && !directionP2) {
      setSuccess(
        "Entry point set! Move your mouse to aim the arrow, then click to set EXIT."
      );
    } else if (directionP1 && directionP2 && drawingMode === "tripwire") {
      setSuccess("Direction arrow set! You can now save the tripwire.");
      setItemDialogOpen(true);
    }
  }, [directionP1, directionP2, drawingMode]);

  // Handle save item
  const handleSaveItem = (itemData) => {
    saveItem(itemData);
    setItemDialogOpen(false);

    const successMsg = `${drawingMode === "tripwire" ? "Tripwire" : "ROI"} "${
      itemData.name
    }" (ID: ${itemData.id}) added successfully!`;

    setSuccess(successMsg);

    // If user wants to add an alert rule for this tripwire
    if (itemData.addAlertRule && drawingMode === "tripwire") {
      setSelectedZoneForRule({
        id: itemData.id,
        name: itemData.name,
        entryName: itemData.entryName,
        exitName: itemData.exitName,
        type: "tripwire",
      });

      // Open rule dialog after a short delay
      setTimeout(() => {
        setRuleDialogOpen(true);
        setSuccess(
          `${successMsg} Now configure the alert rule for "${itemData.name}".`
        );
      }, 500);
    }
  };

  // Handle cancel
  // Handle cancel drawing
  const handleCancelDrawing = () => {
    cancelDrawing();
    setItemDialogOpen(false);
  };

  // Handle delete zone with API persistence
  const handleDeleteZone = async (id, type) => {
    if (!selectedSensor) {
      setError("No sensor selected");
      return;
    }

    // Delete from local state first
    deleteZone(id, type);

    // Then persist to EMDX API using DELETE endpoint
    try {
      if (type === "tripwire") {
        await deleteTripwireConfig(
          baseUrl,
          authToken,
          selectedSensor,
          id, // specific tripwireId to delete
          true // deleteIfPresent
        );
      } else if (type === "roi") {
        await deleteRoiConfig(
          baseUrl,
          authToken,
          selectedSensor,
          id, // specific roiId to delete
          true // deleteIfPresent
        );
      }

      setSuccess(
        `✅ ${type === "tripwire" ? "Tripwire" : "ROI"} deleted successfully`
      );
    } catch (err) {
      console.error(`Failed to delete ${type}:`, err);
      setError(`Failed to delete ${type}: ${err.message}`);
      // Note: Local state is already updated, but server sync failed
      // You might want to reload from server here
    }
  };

  // Handle clear all zones with API persistence
  const handleClearAllZones = async () => {
    if (!selectedSensor) {
      setError("No sensor selected");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to clear all tripwires and ROIs? This cannot be undone."
      )
    ) {
      return;
    }

    // Clear local state first
    clearAllZones();

    // Then persist to EMDX API using POST with empty arrays
    try {
      // Clear all tripwires for this sensor
      const emptyTripwirePayload = {
        deleteIfPresent: true,
        tripwires: [],
        sensorId: selectedSensor,
      };

      await createTripwireConfig(
        baseUrl,
        authToken,
        selectedSensor,
        emptyTripwirePayload
      );

      setSuccess("✅ All tripwires cleared successfully");
    } catch (err) {
      console.error("Failed to clear zones:", err);
      setError(`Failed to clear zones: ${err.message}`);
    }
  };

  // Handle submit to EMDX
  const handleSubmitToEMDX = async () => {
    if (tripwires.length === 0 && rois.length === 0) {
      setError("No tripwires or ROIs to submit. Draw at least one first.");
      return;
    }

    if (!selectedSensor) {
      setError("No sensor selected");
      return;
    }

    setError("");
    setSuccess("");

    try {
      let successMessages = [];

      // Submit tripwires if any exist
      if (tripwires.length > 0) {
        const tripwirePayload = {
          deleteIfPresent: true,
          tripwires: tripwires,
          sensorId: selectedSensor,
        };

        console.log("Submitting tripwire config to EMDX:", tripwirePayload);
        await createTripwireConfig(
          baseUrl,
          authToken,
          selectedSensor,
          tripwirePayload
        );
        successMessages.push(`${tripwires.length} tripwire(s)`);
      }

      // Submit ROIs if any exist
      if (rois.length > 0) {
        const roiPayload = {
          deleteIfPresent: true,
          rois: rois.map((roi) => ({
            id: roi.id,
            name: roi.name,
            polygon: roi.wire,
          })),
          sensorId: selectedSensor,
        };

        console.log("Submitting ROI config to EMDX:", roiPayload);
        await createRoiConfig(baseUrl, authToken, selectedSensor, roiPayload);
        successMessages.push(`${rois.length} ROI(s)`);
      }

      setSuccess(
        `✅ Successfully submitted ${successMessages.join(
          " and "
        )} for sensor ${selectedSensor}!`
      );
    } catch (err) {
      console.error("Failed to submit configuration:", err);
      setError(`Failed to submit configuration: ` + err.message);
    }
  };

  // Handle add rule button click
  const handleAddRule = (zone, zoneType) => {
    setSelectedZoneForRule({ ...zone, type: zoneType });
    setRuleDialogOpen(true);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* Sensor Selection & Snapshot Capture Bar */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <FormControl sx={{ minWidth: 250, flexGrow: 1 }}>
            <InputLabel>Select Sensor</InputLabel>
            <Select
              value={selectedSensor || ""}
              onChange={(e) => setSelectedSensor(e.target.value || "")}
              label="Select Sensor"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {sensors.map((sensor) => (
                <MenuItem
                  key={sensor.sensorId || sensor.id}
                  value={sensor.sensorId || sensor.id || ""}
                >
                  {sensor.name || sensor.sensorId || sensor.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<CameraAltIcon />}
            onClick={handleCaptureSnapshot}
            disabled={!selectedSensor || isLoadingSnapshot}
          >
            {isLoadingSnapshot ? "Capturing..." : "Capture Snapshot"}
          </Button>
        </Box>

        {/* Status Messages */}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Main Content: Side-by-Side Layout */}
        <Grid container spacing={2}>
          {/* Left Panel: Canvas */}
          <Grid size={{ xs: 12, md: 7, lg: 8 }}>
            <ZoneCanvas
              snapshotUrl={snapshotUrl}
              isLoadingSnapshot={isLoadingSnapshot}
              imageDimensions={imageDimensions}
              isDrawing={isDrawing}
              drawingMode={drawingMode}
              currentItem={currentItem}
              isSettingDirection={isSettingDirection}
              canvasRef={canvasRef}
              imageRef={imageRef}
              onImageLoad={handleImageLoad}
              onCanvasClick={handleCanvasClick}
              onCanvasRightClick={handleCanvasRightClickWrapper}
              onCanvasMouseMove={handleCanvasMouseMove}
              onStartDrawing={handleStartDrawing}
              onCancelDrawing={handleCancelDrawing}
            />
          </Grid>

          {/* Right Panel: Zones & Rules Sidebars */}
          <Grid size={{ xs: 12, md: 5, lg: 4 }}>
            <ZonesSidebar
              tripwires={tripwires}
              rois={rois}
              onDelete={handleDeleteZone}
              onClearAll={handleClearAllZones}
              onSubmit={handleSubmitToEMDX}
              onAddRule={handleAddRule}
            />

            <RulesSidebar
              selectedSensor={selectedSensor}
              baseUrl={baseUrl}
              authToken={authToken}
              onRuleChange={() => {
                // Optional: could trigger a refresh or notification
              }}
            />
          </Grid>
        </Grid>

        {/* Dialogs */}
        <ZoneItemDialog
          open={itemDialogOpen}
          onClose={handleCancelDrawing}
          onSave={handleSaveItem}
          drawingMode={drawingMode}
          directionP1={directionP1}
          directionP2={directionP2}
          onSetDirection={handleSetDirection}
        />

        {/* Rule Creation Dialog (opens when "Add Rule" clicked) */}
        {ruleDialogOpen && selectedZoneForRule && (
          <AlertsTab
            selectedSensor={selectedSensor}
            pendingRuleForTripwire={selectedZoneForRule}
            onClearPendingRule={() => {
              setRuleDialogOpen(false);
              setSelectedZoneForRule(null);
            }}
            baseUrl={baseUrl}
            authToken={authToken}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default ZoneConfig;
