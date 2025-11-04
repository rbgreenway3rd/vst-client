/**
 * Canvas drawing helper functions for tripwires and ROIs
 */

/**
 * Draw a point on the canvas
 */
export const drawPoint = (ctx, point, color, size) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(point.x, point.y, size, 0, 2 * Math.PI);
  ctx.fill();
};

/**
 * Draw a polygon/polyline on the canvas
 */
export const drawPolygon = (ctx, points, color, isCurrent) => {
  if (points.length < 2) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }

  // Don't close the polygon - keep it as an open polyline
  ctx.stroke();

  // Draw points
  points.forEach((point, index) => {
    drawPoint(ctx, point, color, 6);

    // Draw point labels
    ctx.fillStyle = color;
    ctx.font = "12px Arial";
    ctx.fillText(`${index}`, point.x + 10, point.y - 10);
  });
};

/**
 * Draw a direction arrow from entry point (p1) to exit point (p2)
 */
export const drawDirectionArrow = (ctx, p1, p2) => {
  // Draw arrow line
  ctx.strokeStyle = "#ff00ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();

  // Calculate angle for arrowhead
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  const arrowLength = 25;
  const arrowWidth = Math.PI / 6;

  // Draw arrowhead at p2 (exit point)
  ctx.fillStyle = "#ff00ff";
  ctx.beginPath();
  ctx.moveTo(p2.x, p2.y);
  ctx.lineTo(
    p2.x - arrowLength * Math.cos(angle - arrowWidth),
    p2.y - arrowLength * Math.sin(angle - arrowWidth)
  );
  ctx.lineTo(
    p2.x - arrowLength * Math.cos(angle + arrowWidth),
    p2.y - arrowLength * Math.sin(angle + arrowWidth)
  );
  ctx.closePath();
  ctx.fill();

  // Draw circle at entry point (p1) for clarity
  ctx.fillStyle = "#ff0000";
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Add label "ENTRY"
  ctx.fillStyle = "#ff0000";
  ctx.font = "bold 14px Arial";
  ctx.fillText("ENTRY", p1.x + 15, p1.y - 10);

  // Draw arrow circle at exit point (p2)
  ctx.fillStyle = "#ff00ff";
  ctx.beginPath();
  ctx.arc(p2.x, p2.y, 8, 0, 2 * Math.PI);
  ctx.fill();

  // Add label "EXIT"
  ctx.fillStyle = "#ff00ff";
  ctx.font = "bold 14px Arial";
  ctx.fillText("EXIT", p2.x + 15, p2.y - 10);
};

/**
 * Get canvas coordinates from mouse event
 */
export const getCanvasCoordinates = (event, canvas) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.round((event.clientX - rect.left) * scaleX);
  const y = Math.round((event.clientY - rect.top) * scaleY);

  return { x, y };
};
