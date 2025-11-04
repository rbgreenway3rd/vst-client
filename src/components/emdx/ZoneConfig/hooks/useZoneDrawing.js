import { useState, useEffect } from "react";
import {
  drawPolygon,
  drawDirectionArrow,
  drawPoint,
  getCanvasCoordinates,
} from "../utils/canvasHelpers";

/**
 * Hook for managing zone drawing on canvas (tripwires and ROIs)
 */
export const useZoneDrawing = (canvasRef, imageRef) => {
  const [tripwires, setTripwires] = useState([]);
  const [rois, setRois] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState(null); // 'tripwire' or 'roi'
  const [mousePosition, setMousePosition] = useState(null);

  // Direction arrow state
  const [directionP1, setDirectionP1] = useState(null);
  const [directionP2, setDirectionP2] = useState(null);
  const [isSettingDirection, setIsSettingDirection] = useState(false);

  // Redraw canvas when items or image changes
  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripwires, rois, currentItem, directionP1, directionP2, mousePosition]);

  // Keyboard event listener for undo functionality
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === "Backspace" &&
        isDrawing &&
        currentItem &&
        currentItem.length > 0
      ) {
        e.preventDefault();
        const newPoints = [...currentItem];
        newPoints.pop();
        setCurrentItem(newPoints);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawing, currentItem]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const img = imageRef.current;
    if (!img) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw completed tripwires (green with direction arrows)
    tripwires.forEach((tripwire) => {
      drawPolygon(ctx, tripwire.wire, "#00ff00", false);

      // Draw direction arrow
      if (tripwire.direction) {
        drawDirectionArrow(ctx, tripwire.direction.p1, tripwire.direction.p2);
      }
    });

    // Draw completed ROIs (blue, no direction)
    rois.forEach((roi) => {
      drawPolygon(ctx, roi.wire, "#0088ff", false);
    });

    // Draw current item being drawn
    if (currentItem && currentItem.length > 0) {
      const color = drawingMode === "tripwire" ? "#ffff00" : "#00ffff";
      drawPolygon(ctx, currentItem, color, true);

      // Draw rubberband line for tripwire when mouse is moving
      if (drawingMode === "tripwire" && mousePosition && isDrawing) {
        const lastPoint = currentItem[currentItem.length - 1];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(mousePosition.x, mousePosition.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw direction arrow
    if (directionP1 && directionP2) {
      drawDirectionArrow(ctx, directionP1, directionP2);
    } else if (directionP1 && mousePosition && isSettingDirection) {
      drawDirectionArrow(ctx, directionP1, mousePosition);
    } else if (directionP1) {
      drawPoint(ctx, directionP1, "#ff0000", 10);
      ctx.fillStyle = "#ff0000";
      ctx.font = "bold 14px Arial";
      ctx.fillText("ENTRY", directionP1.x + 15, directionP1.y - 10);
    }
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(e, canvas);

    // If setting direction points
    if (isSettingDirection) {
      if (!directionP1) {
        setDirectionP1({ x, y });
      } else if (!directionP2) {
        setDirectionP2({ x, y });
        setIsSettingDirection(false);
        setMousePosition(null);
      }
      return;
    }

    // If drawing
    if (isDrawing) {
      const newPoint = { x, y };
      setCurrentItem([...(currentItem || []), newPoint]);
    }
  };

  const handleCanvasRightClick = (e) => {
    e.preventDefault();

    // Finish drawing when right-clicking during tripwire drawing
    if (
      isDrawing &&
      drawingMode === "tripwire" &&
      currentItem &&
      currentItem.length >= 2
    ) {
      return true; // Signal to finish
    }
    return false;
  };

  const handleCanvasMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(e, canvas);

    // Track mouse when setting direction and entry point is set
    if (isSettingDirection && directionP1 && !directionP2) {
      setMousePosition({ x, y });
    }

    // Track mouse when drawing tripwire (for rubberband line)
    if (
      isDrawing &&
      drawingMode === "tripwire" &&
      currentItem &&
      currentItem.length > 0
    ) {
      setMousePosition({ x, y });
    }
  };

  const startDrawing = (mode) => {
    setDrawingMode(mode);
    setIsDrawing(true);
    setCurrentItem([]);
    setDirectionP1(null);
    setDirectionP2(null);
  };

  const finishDrawing = () => {
    const minPoints = drawingMode === "tripwire" ? 2 : 3;
    if (!currentItem || currentItem.length < minPoints) {
      return { success: false, minPoints };
    }

    setIsDrawing(false);

    // For tripwires, automatically start direction arrow setting
    if (drawingMode === "tripwire") {
      setIsSettingDirection(true);
      setDirectionP1(null);
      setDirectionP2(null);
      setMousePosition(null);
      return { success: true, needsDirection: true };
    }

    return { success: true, needsDirection: false };
  };

  const startSettingDirection = () => {
    setIsSettingDirection(true);
    setDirectionP1(null);
    setDirectionP2(null);
    setMousePosition(null);
  };

  const saveItem = (itemData) => {
    const newItem = {
      id: itemData.id,
      name: itemData.name,
      wire: currentItem,
    };

    // Add direction only for tripwires
    if (drawingMode === "tripwire") {
      newItem.direction = {
        entry: { name: itemData.entryName || "entry" },
        exit: { name: itemData.exitName || "exit" },
        p1: directionP1,
        p2: directionP2,
      };
    }

    // Add to appropriate list
    if (drawingMode === "tripwire") {
      setTripwires([...tripwires, newItem]);
    } else {
      setRois([...rois, newItem]);
    }

    resetDrawing();
  };

  const cancelDrawing = () => {
    resetDrawing();
  };

  const resetDrawing = () => {
    setCurrentItem(null);
    setIsDrawing(false);
    setDirectionP1(null);
    setDirectionP2(null);
    setMousePosition(null);
    setIsSettingDirection(false);
    setDrawingMode(null);
  };

  const clearAllZones = () => {
    setTripwires([]);
    setRois([]);
    resetDrawing();
  };

  const deleteZone = (id, type) => {
    if (type === "tripwire") {
      setTripwires(tripwires.filter((t) => t.id !== id));
    } else {
      setRois(rois.filter((r) => r.id !== id));
    }
  };

  return {
    // State
    tripwires,
    rois,
    currentItem,
    isDrawing,
    drawingMode,
    directionP1,
    directionP2,
    isSettingDirection,

    // Handlers
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
  };
};
