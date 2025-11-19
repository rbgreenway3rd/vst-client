import React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SquareIcon from "@mui/icons-material/Square";
import CancelIcon from "@mui/icons-material/Cancel";

/**
 * Canvas component for drawing tripwires and ROIs
 */
const ZoneCanvas = ({
  snapshotUrl,
  isLoadingSnapshot,
  imageDimensions,
  isDrawing,
  drawingMode,
  currentItem,
  isSettingDirection,
  canvasRef,
  imageRef,
  onImageLoad,
  onCanvasClick,
  onCanvasRightClick,
  onCanvasMouseMove,
  onStartDrawing,
  onCancelDrawing,
}) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        🎨 Drawing Canvas
      </Typography>

      {/* Canvas Container */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          backgroundColor: "#f5f5f5",
          borderRadius: 1,
          overflow: "hidden",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isLoadingSnapshot && <CircularProgress />}

        {snapshotUrl && (
          <>
            <img
              ref={imageRef}
              src={snapshotUrl}
              alt="Camera snapshot"
              onLoad={onImageLoad}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "auto",
                display: "block",
              }}
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
                height: "auto",
                cursor: isDrawing ? "crosshair" : "default",
              }}
            />
          </>
        )}

        {!snapshotUrl && !isLoadingSnapshot && (
          <Typography color="textSecondary">
            Select a sensor and capture a snapshot to begin drawing
          </Typography>
        )}
      </Box>

      {/* Drawing Controls */}
      {snapshotUrl && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant={drawingMode === "tripwire" ? "contained" : "outlined"}
            color="success"
            startIcon={<EditIcon />}
            onClick={() => onStartDrawing("tripwire")}
            disabled={isDrawing}
          >
            Draw Tripwire
          </Button>

          <Button
            variant={drawingMode === "roi" ? "contained" : "outlined"}
            color="info"
            startIcon={<SquareIcon />}
            onClick={() => onStartDrawing("roi")}
            disabled={isDrawing}
          >
            Draw ROI
          </Button>

          {isDrawing && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={onCancelDrawing}
            >
              Cancel
            </Button>
          )}
        </Box>
      )}

      {/* Instructions */}
      <Box sx={{ mt: 2 }}>
        {isDrawing && (
          <Typography variant="body2" color="primary">
            {isSettingDirection
              ? "🎯 Click two points to set direction arrow (Entry → Exit)"
              : `📍 Click to add points. Right-click or press Enter to finish. (${
                  currentItem?.wire?.length || 0
                } points)`}
          </Typography>
        )}

        {!isDrawing && snapshotUrl && (
          <Typography variant="body2" color="textSecondary">
            💡 Click "Draw Tripwire" or "Draw ROI" to start drawing zones on the
            camera image
          </Typography>
        )}

        {imageDimensions.width > 0 && (
          <Typography variant="caption" color="textSecondary" display="block">
            📊 Image: {imageDimensions.width} × {imageDimensions.height} px
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default ZoneCanvas;
