import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, Typography, Tabs, Tab, Box } from "@mui/material";
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
import ZoneSetupTab from "./ZoneSetupTab";
import AnalyticsTab from "./AnalyticsTab";
import AlertsTab from "./AlertsTab";
import ZoneItemDialog from "./ZoneItemDialog";

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

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Sensor state
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");

  // Message state
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [pendingRuleForTripwire, setPendingRuleForTripwire] = useState(null);

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

  // Fetch sensors on mount
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const data = await getSensors(vstBaseUrl, vstAuthToken);
        const allSensors = Array.isArray(data) ? data : data.sensors || [];
        const activeSensors = allSensors.filter((s) => s.state !== "removed");
        setSensors(activeSensors);
      } catch (error) {
        console.error("Failed to fetch sensors:", error);
        setError("Failed to fetch sensors: " + error.message);
      }
    };
    fetchSensors();
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
      setPendingRuleForTripwire({
        id: itemData.id,
        name: itemData.name,
        entryName: itemData.entryName,
        exitName: itemData.exitName,
      });

      // Switch to Alerts tab after a short delay
      setTimeout(() => {
        setActiveTab(2);
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

      setSuccess(`✅ ${type === "tripwire" ? "Tripwire" : "ROI"} deleted successfully`);
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

    if (!window.confirm("Are you sure you want to clear all tripwires and ROIs? This cannot be undone.")) {
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>

        {/* Tab Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            aria-label="Zone configuration tabs"
          >
            <Tab label="📍 Zone Setup" />
            <Tab label="📊 Analytics" disabled={!selectedSensor} />
            <Tab label="🔔 Alerts" disabled={!selectedSensor} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {activeTab === 0 && (
          <ZoneSetupTab
            sensors={sensors}
            selectedSensor={selectedSensor}
            onSensorChange={setSelectedSensor}
            snapshotUrl={snapshotUrl}
            isLoadingSnapshot={isLoadingSnapshot}
            imageDimensions={imageDimensions}
            success={success}
            error={error}
            onCaptureSnapshot={handleCaptureSnapshot}
            isDrawing={isDrawing}
            drawingMode={drawingMode}
            currentItem={currentItem}
            isSettingDirection={isSettingDirection}
            tripwires={tripwires}
            rois={rois}
            onStartDrawing={handleStartDrawing}
            onFinishDrawing={handleFinishDrawing}
            onCancelDrawing={handleCancelDrawing}
            onDeleteZone={handleDeleteZone}
            onClearAll={handleClearAllZones}
            onSubmit={handleSubmitToEMDX}
            canvasRef={canvasRef}
            imageRef={imageRef}
            onImageLoad={handleImageLoad}
            onCanvasClick={handleCanvasClick}
            onCanvasRightClick={handleCanvasRightClickWrapper}
            onCanvasMouseMove={handleCanvasMouseMove}
          />
        )}
        {activeTab === 1 && <AnalyticsTab selectedSensor={selectedSensor} />}
        {activeTab === 2 && (
          <AlertsTab
            selectedSensor={selectedSensor}
            pendingRuleForTripwire={pendingRuleForTripwire}
            onClearPendingRule={() => setPendingRuleForTripwire(null)}
            baseUrl={baseUrl}
            authToken={authToken}
          />
        )}

        {/* Item Details Dialog */}
        <ZoneItemDialog
          open={itemDialogOpen}
          onClose={handleCancelDrawing}
          onSave={handleSaveItem}
          drawingMode={drawingMode}
          directionP1={directionP1}
          directionP2={directionP2}
          onSetDirection={handleSetDirection}
        />
      </CardContent>
    </Card>
  );
};

export default ZoneConfig;
