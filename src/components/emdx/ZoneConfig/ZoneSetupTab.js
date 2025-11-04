import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material";
import ZoneList from "./ZoneList";

/**
 * Zone Setup tab component with camera selection, snapshot capture, and drawing interface
 */
const ZoneSetupTab = ({
  sensors,
  selectedSensor,
  onSensorChange,
  snapshotUrl,
  isLoadingSnapshot,
  imageDimensions,
  success,
  error,
  onCaptureSnapshot,
  isDrawing,
  drawingMode,
  currentItem,
  isSettingDirection,
  tripwires,
  rois,
  onStartDrawing,
  onFinishDrawing,
  onCancelDrawing,
  onDeleteZone,
  onClearAll,
  onSubmit,
  canvasRef,
  imageRef,
  onImageLoad,
  onCanvasClick,
  onCanvasRightClick,
  onCanvasMouseMove,
}) => {
  return (
    <>
      {/* Camera Selection */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Camera</InputLabel>
        <Select
          value={selectedSensor}
          onChange={(e) => onSensorChange(e.target.value)}
          disabled={isDrawing}
        >
          {sensors.map((s) => {
            const isOffline = s.state === "offline" || s.state === "OFFLINE";
            const sensorId = s.sensorId || s.id;
            return (
              <MenuItem key={sensorId} value={sensorId} disabled={isOffline}>
                {s.name} ({sensorId}) {isOffline && "- OFFLINE"}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {/* Success/Error Messages */}
      {success && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#e8f5e9",
            borderRadius: 1,
            border: "1px solid #4caf50",
          }}
        >
          <Typography color="success.main">{success}</Typography>
        </Box>
      )}

      {error && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            backgroundColor: "#ffebee",
            borderRadius: 1,
            border: "1px solid #ef5350",
          }}
        >
          <Typography color="error" sx={{ whiteSpace: "pre-wrap" }}>
            {error}
          </Typography>
        </Box>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          onClick={onCaptureSnapshot}
          disabled={!selectedSensor || isLoadingSnapshot || isDrawing}
        >
          {isLoadingSnapshot ? "Capturing..." : "📷 Capture Snapshot"}
        </Button>

        {snapshotUrl && !isDrawing && (
          <>
            <Button
              variant="contained"
              color="primary"
              onClick={() => onStartDrawing("tripwire")}
            >
              ✏️ Draw Tripwire
            </Button>

            <Button
              variant="contained"
              color="secondary"
              onClick={() => onStartDrawing("roi")}
            >
              🔷 Draw ROI
            </Button>
          </>
        )}

        {isDrawing && (
          <>
            <Button
              variant="contained"
              color="success"
              onClick={onFinishDrawing}
              disabled={
                !currentItem ||
                currentItem.length < (drawingMode === "tripwire" ? 2 : 3)
              }
            >
              ✓ Finish {drawingMode === "tripwire" ? "Tripwire" : "ROI"}
            </Button>
            <Button
              variant="outlined"
              color="warning"
              onClick={onCancelDrawing}
            >
              ✗ Cancel
            </Button>
          </>
        )}

        {isLoadingSnapshot && <CircularProgress size={24} />}
      </Box>

      {/* Configured Zones List */}
      <ZoneList
        tripwires={tripwires}
        rois={rois}
        onDelete={onDeleteZone}
        onClearAll={onClearAll}
        onSubmit={onSubmit}
      />

      {/* Canvas with Snapshot */}
      {snapshotUrl && (
        <Box sx={{ position: "relative", mb: 2 }}>
          <Box
            sx={{ mb: 1, p: 1, backgroundColor: "#e3f2fd", borderRadius: 1 }}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: "bold", whiteSpace: "pre-line" }}
            >
              {isDrawing
                ? drawingMode === "tripwire"
                  ? `🖱️ Left click on the image to add points to the tripwire polygon (min 2 points)\n🖱️ Right click on the image to finish drawing tripwire\n⌨️ Press Backspace to undo last point`
                  : `🖱️ Left click on the image to add points to the ROI polygon (min 3 points)\n🖱️ Right click on the image to finish drawing ROI`
                : isSettingDirection
                ? "🎯 Click TWO points: 1️⃣ Entry side (red), then 2️⃣ Exit side (blue)"
                : `📊 Camera: ${selectedSensor} | Image: ${imageDimensions.width}x${imageDimensions.height} | Tripwires: ${tripwires.length} | ROIs: ${rois.length}`}
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: "1200px",
              height: "675px",
              backgroundColor: "#000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto",
            }}
          >
            <img
              ref={imageRef}
              src={snapshotUrl}
              alt="Camera snapshot"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                display: "block",
                border: "2px solid #ccc",
                objectFit: "contain",
              }}
              onLoad={onImageLoad}
            />
            <canvas
              ref={canvasRef}
              onClick={onCanvasClick}
              onContextMenu={onCanvasRightClick}
              onMouseMove={onCanvasMouseMove}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                cursor:
                  isDrawing || isSettingDirection ? "crosshair" : "default",
              }}
            />
          </Box>
        </Box>
      )}

      {/* Empty State */}
      {!snapshotUrl && !isLoadingSnapshot && (
        <Box
          sx={{
            width: "100%",
            height: 300,
            backgroundColor: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 1,
          }}
        >
          <Typography color="textSecondary">
            Select a camera and capture a snapshot to begin
          </Typography>
        </Box>
      )}
    </>
  );
};

export default ZoneSetupTab;
