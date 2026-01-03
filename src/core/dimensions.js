/**
 * CAD Dimensions and Measurements
 * Linear, angular, radial, and area dimensions
 */

import { distance, angleBetweenPoints, midpoint, polygonArea, polygonPerimeter } from './geometry.js';
import { generateId, DEFAULT_STYLE } from './engine.js';

// ============================================
// Dimension Styles
// ============================================

export const DEFAULT_DIMENSION_STYLE = {
  textHeight: 2.5,
  arrowSize: 2,
  extensionLineOffset: 1,
  extensionLineExtension: 1.5,
  dimensionLineGap: 0.5,
  textColor: '#000000',
  lineColor: '#000000',
  precision: 2,
  units: 'm',
  showUnits: true,
  textPosition: 'above', // 'above', 'center', 'manual'
  arrowType: 'closed', // 'closed', 'open', 'dot', 'tick'
};

// ============================================
// Dimension Creation Functions
// ============================================

/**
 * Create a linear dimension between two points
 */
export function createLinearDimension(startPoint, endPoint, offset = 10, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };
  const measuredDistance = distance(startPoint, endPoint);
  const angle = angleBetweenPoints(startPoint, endPoint);

  // Calculate dimension line position (perpendicular offset)
  const perpAngle = angle + Math.PI / 2;
  const offsetX = Math.cos(perpAngle) * offset;
  const offsetY = Math.sin(perpAngle) * offset;

  const dimStart = { x: startPoint.x + offsetX, y: startPoint.y + offsetY };
  const dimEnd = { x: endPoint.x + offsetX, y: endPoint.y + offsetY };
  const textPosition = midpoint(dimStart, dimEnd);

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'linear',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    // Measured points
    startPoint,
    endPoint,
    // Dimension line
    dimLineStart: dimStart,
    dimLineEnd: dimEnd,
    // Extension lines
    extLine1Start: startPoint,
    extLine1End: dimStart,
    extLine2Start: endPoint,
    extLine2End: dimEnd,
    // Text
    textPosition,
    textRotation: angle,
    measuredValue: measuredDistance,
    displayText: formatDimension(measuredDistance, style),
    // Style
    dimensionStyle: style,
  };
}

/**
 * Create an aligned dimension (follows the angle of the line)
 */
export function createAlignedDimension(startPoint, endPoint, offset = 10, options = {}) {
  return createLinearDimension(startPoint, endPoint, offset, options);
}

/**
 * Create a horizontal dimension
 */
export function createHorizontalDimension(startPoint, endPoint, yOffset = 10, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };
  const horizontalDistance = Math.abs(endPoint.x - startPoint.x);

  const dimY = Math.min(startPoint.y, endPoint.y) - Math.abs(yOffset);
  const dimStart = { x: startPoint.x, y: dimY };
  const dimEnd = { x: endPoint.x, y: dimY };
  const textPosition = midpoint(dimStart, dimEnd);

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'horizontal',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    startPoint,
    endPoint,
    dimLineStart: dimStart,
    dimLineEnd: dimEnd,
    extLine1Start: startPoint,
    extLine1End: dimStart,
    extLine2Start: endPoint,
    extLine2End: dimEnd,
    textPosition,
    textRotation: 0,
    measuredValue: horizontalDistance,
    displayText: formatDimension(horizontalDistance, style),
    dimensionStyle: style,
  };
}

/**
 * Create a vertical dimension
 */
export function createVerticalDimension(startPoint, endPoint, xOffset = 10, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };
  const verticalDistance = Math.abs(endPoint.y - startPoint.y);

  const dimX = Math.min(startPoint.x, endPoint.x) - Math.abs(xOffset);
  const dimStart = { x: dimX, y: startPoint.y };
  const dimEnd = { x: dimX, y: endPoint.y };
  const textPosition = midpoint(dimStart, dimEnd);

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'vertical',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    startPoint,
    endPoint,
    dimLineStart: dimStart,
    dimLineEnd: dimEnd,
    extLine1Start: startPoint,
    extLine1End: dimStart,
    extLine2Start: endPoint,
    extLine2End: dimEnd,
    textPosition,
    textRotation: -Math.PI / 2,
    measuredValue: verticalDistance,
    displayText: formatDimension(verticalDistance, style),
    dimensionStyle: style,
  };
}

/**
 * Create a radius dimension
 */
export function createRadiusDimension(center, radius, angle = 0, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };

  const endPoint = {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };

  const textPosition = {
    x: center.x + (radius * 0.6) * Math.cos(angle),
    y: center.y + (radius * 0.6) * Math.sin(angle),
  };

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'radius',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    center,
    radius,
    angle,
    startPoint: center,
    endPoint,
    textPosition,
    textRotation: angle,
    measuredValue: radius,
    displayText: 'R' + formatDimension(radius, style),
    dimensionStyle: style,
  };
}

/**
 * Create a diameter dimension
 */
export function createDiameterDimension(center, radius, angle = 0, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };
  const diameter = radius * 2;

  const startPoint = {
    x: center.x - radius * Math.cos(angle),
    y: center.y - radius * Math.sin(angle),
  };
  const endPoint = {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'diameter',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    center,
    radius,
    angle,
    startPoint,
    endPoint,
    textPosition: center,
    textRotation: angle,
    measuredValue: diameter,
    displayText: '⌀' + formatDimension(diameter, style),
    dimensionStyle: style,
  };
}

/**
 * Create an angular dimension
 */
export function createAngularDimension(center, startAngle, endAngle, radius = 20, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };

  let angle = endAngle - startAngle;
  if (angle < 0) angle += 2 * Math.PI;
  const angleDegrees = (angle * 180) / Math.PI;

  const midAngle = startAngle + angle / 2;
  const textPosition = {
    x: center.x + radius * 1.2 * Math.cos(midAngle),
    y: center.y + radius * 1.2 * Math.sin(midAngle),
  };

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'angular',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    center,
    radius,
    startAngle,
    endAngle,
    textPosition,
    textRotation: midAngle,
    measuredValue: angleDegrees,
    displayText: angleDegrees.toFixed(style.precision) + '°',
    dimensionStyle: style,
  };
}

/**
 * Create an arc length dimension
 */
export function createArcLengthDimension(center, radius, startAngle, endAngle, offset = 5, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };

  let angle = endAngle - startAngle;
  if (angle < 0) angle += 2 * Math.PI;
  const arcLen = radius * angle;

  const midAngle = startAngle + angle / 2;
  const dimRadius = radius + offset;
  const textPosition = {
    x: center.x + dimRadius * Math.cos(midAngle),
    y: center.y + dimRadius * Math.sin(midAngle),
  };

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'arcLength',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    center,
    radius: dimRadius,
    startAngle,
    endAngle,
    textPosition,
    textRotation: midAngle + Math.PI / 2,
    measuredValue: arcLen,
    displayText: '⌒' + formatDimension(arcLen, style),
    dimensionStyle: style,
  };
}

/**
 * Create an area annotation
 */
export function createAreaDimension(points, options = {}) {
  const style = { ...DEFAULT_DIMENSION_STYLE, ...options };
  const area = polygonArea(points);

  // Calculate centroid for text position
  let cx = 0, cy = 0;
  points.forEach(p => { cx += p.x; cy += p.y; });
  cx /= points.length;
  cy /= points.length;

  return {
    id: generateId(),
    type: 'dimension',
    dimensionType: 'area',
    layerId: 'layer-dimensions',
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, strokeColor: style.lineColor },
    points,
    textPosition: { x: cx, y: cy },
    textRotation: 0,
    measuredValue: area,
    displayText: formatArea(area, style),
    dimensionStyle: style,
  };
}

// ============================================
// Measurement Functions (non-entity)
// ============================================

/**
 * Measure distance between two points
 */
export function measureDistance(p1, p2) {
  const dist = distance(p1, p2);
  const angle = angleBetweenPoints(p1, p2);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  return {
    distance: dist,
    deltaX: dx,
    deltaY: dy,
    angle: angle,
    angleDegrees: (angle * 180) / Math.PI,
  };
}

/**
 * Measure angle between three points (vertex at p2)
 */
export function measureAngle(p1, p2, p3) {
  const angle1 = angleBetweenPoints(p2, p1);
  const angle2 = angleBetweenPoints(p2, p3);
  let angle = angle2 - angle1;
  if (angle < 0) angle += 2 * Math.PI;

  return {
    radians: angle,
    degrees: (angle * 180) / Math.PI,
  };
}

/**
 * Measure polygon properties
 */
export function measurePolygon(points) {
  const area = polygonArea(points);
  const perimeter = polygonPerimeter(points);

  // Calculate centroid
  let cx = 0, cy = 0;
  points.forEach(p => { cx += p.x; cy += p.y; });
  cx /= points.length;
  cy /= points.length;

  return {
    area,
    perimeter,
    centroid: { x: cx, y: cy },
    vertexCount: points.length,
  };
}

/**
 * Measure circle properties
 */
export function measureCircle(radius) {
  return {
    radius,
    diameter: radius * 2,
    circumference: 2 * Math.PI * radius,
    area: Math.PI * radius * radius,
  };
}

/**
 * Measure arc properties
 */
export function measureArc(radius, startAngle, endAngle) {
  let angle = endAngle - startAngle;
  if (angle < 0) angle += 2 * Math.PI;

  return {
    radius,
    angle: angle,
    angleDegrees: (angle * 180) / Math.PI,
    arcLength: radius * angle,
    chordLength: 2 * radius * Math.sin(angle / 2),
  };
}

/**
 * Measure rectangle properties
 */
export function measureRectangle(width, height) {
  return {
    width,
    height,
    area: width * height,
    perimeter: 2 * (width + height),
    diagonal: Math.sqrt(width * width + height * height),
  };
}

// ============================================
// Formatting Functions
// ============================================

/**
 * Format a dimension value with units
 */
export function formatDimension(value, style = DEFAULT_DIMENSION_STYLE) {
  const formatted = value.toFixed(style.precision);
  if (style.showUnits) {
    return formatted + ' ' + style.units;
  }
  return formatted;
}

/**
 * Format an area value with units
 */
export function formatArea(value, style = DEFAULT_DIMENSION_STYLE) {
  const formatted = value.toFixed(style.precision);
  if (style.showUnits) {
    return formatted + ' ' + style.units + '²';
  }
  return formatted;
}

/**
 * Format coordinates
 */
export function formatCoordinates(point, precision = 2) {
  return `(${point.x.toFixed(precision)}, ${point.y.toFixed(precision)})`;
}
