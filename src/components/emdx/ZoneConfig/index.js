import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, Typography, Tabs, Tab, Box } from "@mui/material";
import { getSensors } from "../../../services/vst/api_vst";
import {
  createTripwireConfig,
  updateRoisConfig,
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

  // Handle snapshot capture
  const handleCaptureSnapshot = async () => {
    setError("");
    setSuccess("");

    try {
      await captureSnapshot(selectedSensor);
      clearAllZones();
      setSuccess("Snapshot captured successfully!");
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
  const handleCancelDrawing = () => {
    cancelDrawing();
    setItemDialogOpen(false);
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
        await updateRoisConfig(baseUrl, authToken, roiPayload);
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
            onDeleteZone={deleteZone}
            onClearAll={clearAllZones}
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
