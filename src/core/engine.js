/**
 * Core CAD Engine - Handles drawing, selection, and entity management
 */

import { getEntityBoundingBox, boundingBoxContainsPoint, distance } from './geometry.js';

// ============================================
// Unique ID Generator
// ============================================

export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// Default Styles and Settings
// ============================================

/** @type {{ strokeColor: string, strokeWidth: number, opacity: number, lineType: string }} */
export const DEFAULT_STYLE = {
  strokeColor: '#000000',
  strokeWidth: 1,
  opacity: 1,
  lineType: 'continuous',
};

/** @type {{ visible: boolean, spacing: number, majorLineEvery: number, color: string, majorColor: string, opacity: number }} */
export const DEFAULT_GRID = {
  visible: true,
  spacing: 10,
  majorLineEvery: 10,
  color: '#e0e0e0',
  majorColor: '#c0c0c0',
  opacity: 0.5,
};

/** @type {Object} */
export const DEFAULT_SNAP = {
  enabled: true,
  gridSnap: true,
  endpointSnap: true,
  midpointSnap: true,
  centerSnap: true,
  intersectionSnap: true,
  perpendicularSnap: true,
  tangentSnap: false,
  nearestSnap: false,
  snapDistance: 10,
};

/** @type {{ lengthUnit: string, areaUnit: string, angleUnit: string, precision: number }} */
export const DEFAULT_UNITS = {
  lengthUnit: 'm',
  areaUnit: 'sqm',
  angleUnit: 'degrees',
  precision: 3,
};

// ============================================
// Layer Management
// ============================================

/**
 * Create a new layer
 * @param {string} name - Layer name
 * @param {string} color - Layer color (default: '#000000')
 * @returns {Object} Layer object
 */
export function createLayer(name, color = '#000000') {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    color,
    lineType: 'continuous',
    lineWeight: 1,
    order: 0,
  };
}

export const DEFAULT_LAYERS = [
  { id: 'layer-0', name: '0', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 0 },
  { id: 'layer-construction', name: 'Construction', visible: true, locked: false, color: '#808080', lineType: 'dashed', lineWeight: 0.5, order: 1 },
  { id: 'layer-dimensions', name: 'Dimensions', visible: true, locked: false, color: '#0000FF', lineType: 'continuous', lineWeight: 0.5, order: 2 },
  { id: 'layer-text', name: 'Text', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 3 },
  { id: 'layer-structural', name: 'Structural', visible: true, locked: false, color: '#FF0000', lineType: 'continuous', lineWeight: 2, order: 4 },
  { id: 'layer-foundation', name: 'Foundation', visible: true, locked: false, color: '#8B4513', lineType: 'continuous', lineWeight: 2, order: 5 },
  { id: 'layer-drainage', name: 'Drainage', visible: true, locked: false, color: '#00BFFF', lineType: 'continuous', lineWeight: 1.5, order: 6 },
  { id: 'layer-electrical', name: 'Electrical', visible: true, locked: false, color: '#FFD700', lineType: 'continuous', lineWeight: 1, order: 7 },
  { id: 'layer-plumbing', name: 'Plumbing', visible: true, locked: false, color: '#00FF00', lineType: 'continuous', lineWeight: 1, order: 8 },
  { id: 'layer-site', name: 'Site', visible: true, locked: false, color: '#228B22', lineType: 'continuous', lineWeight: 1, order: 9 },
];

// ============================================
// Entity Creation
// ============================================

/**
 * Create a new entity
 * @param {string} type - Entity type
 * @param {Object} properties - Entity properties
 * @param {string} layerId - Layer ID (default: 'layer-0')
 * @param {Object} style - Entity style
 * @returns {Object} Entity object
 */
export function createEntity(type, properties, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
    ...properties,
  };
}

/**
 * Create an arc entity
 * @param {Object} center - Center point { x, y }
 * @param {number} radius - Arc radius
 * @param {number} startAngle - Start angle in degrees
 * @param {number} endAngle - End angle in degrees
 * @param {string} layerId - Layer ID
 * @param {Object} style - Entity style
 */
export function createArc(center, radius, startAngle, endAngle, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type: 'arc',
    center,
    radius,
    startAngle: (startAngle * Math.PI) / 180,
    endAngle: (endAngle * Math.PI) / 180,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
  };
}

/**
 * Create an arc from 3 points
 * @param {Object} p1 - Start point
 * @param {Object} p2 - Point on arc
 * @param {Object} p3 - End point
 */
export function createArcFrom3Points(p1, p2, p3, layerId = 'layer-0', style = {}) {
  // Calculate center and radius from 3 points
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;

  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 0.0001) {
    // Points are collinear, return a line instead
    return createEntity('line', { startPoint: p1, endPoint: p3 }, layerId, style);
  }

  const centerX = ((ax * ax + ay * ay) * (by - cy) +
    (bx * bx + by * by) * (cy - ay) +
    (cx * cx + cy * cy) * (ay - by)) / d;
  const centerY = ((ax * ax + ay * ay) * (cx - bx) +
    (bx * bx + by * by) * (ax - cx) +
    (cx * cx + cy * cy) * (bx - ax)) / d;

  const center = { x: centerX, y: centerY };
  const radius = Math.sqrt((ax - centerX) ** 2 + (ay - centerY) ** 2);

  const startAngle = Math.atan2(ay - centerY, ax - centerX);
  const endAngle = Math.atan2(cy - centerY, cx - centerX);

  return {
    id: generateId(),
    type: 'arc',
    center,
    radius,
    startAngle,
    endAngle,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
  };
}

/**
 * Create an ellipse entity
 * @param {Object} center - Center point
 * @param {number} radiusX - Horizontal radius (semi-major axis)
 * @param {number} radiusY - Vertical radius (semi-minor axis)
 * @param {number} rotation - Rotation angle in degrees
 */
export function createEllipse(center, radiusX, radiusY, rotation = 0, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type: 'ellipse',
    center,
    radiusX,
    radiusY,
    rotation: (rotation * Math.PI) / 180,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
  };
}

/**
 * Create a point/marker entity
 * @param {Object} position - Point position
 * @param {string} markerType - 'dot', 'cross', 'x', 'circle'
 * @param {number} size - Marker size
 */
export function createPoint(position, markerType = 'cross', size = 1, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type: 'point',
    position,
    markerType,
    size,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
  };
}

/**
 * Create a spline (smooth curve) from control points
 * @param {Array} controlPoints - Array of control points
 * @param {boolean} closed - Whether spline is closed
 * @param {number} tension - Spline tension (0-1, default 0.5)
 */
export function createSpline(controlPoints, closed = false, tension = 0.5, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type: 'spline',
    controlPoints,
    closed,
    tension,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
  };
}

/**
 * Get interpolated points along a spline (for rendering)
 * Uses Catmull-Rom spline interpolation
 */
export function interpolateSpline(spline, segments = 20) {
  const points = spline.controlPoints;
  if (points.length < 2) return points;

  const result = [];
  const n = points.length;
  const tension = spline.tension || 0.5;

  for (let i = 0; i < n - (spline.closed ? 0 : 1); i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    for (let t = 0; t < segments; t++) {
      const s = t / segments;
      const s2 = s * s;
      const s3 = s2 * s;

      const x = catmullRom(p0.x, p1.x, p2.x, p3.x, s, s2, s3, tension);
      const y = catmullRom(p0.y, p1.y, p2.y, p3.y, s, s2, s3, tension);
      result.push({ x, y });
    }
  }

  if (!spline.closed) {
    result.push(points[n - 1]);
  }

  return result;
}

function catmullRom(p0, p1, p2, p3, t, t2, t3, tension) {
  const t0 = tension * (p2 - p0);
  const t1 = tension * (p3 - p1);
  return (2 * t3 - 3 * t2 + 1) * p1 +
    (t3 - 2 * t2 + t) * t0 +
    (-2 * t3 + 3 * t2) * p2 +
    (t3 - t2) * t1;
}

// ============================================
// Entity Selection
// ============================================

/**
 * Check if a point is near an entity
 * @param {{ x: number, y: number }} point
 * @param {Object} entity
 * @param {number} tolerance
 * @returns {boolean}
 */
export function isPointNearEntity(point, entity, tolerance = 5) {
  const bbox = getEntityBoundingBox(entity);
  const expandedBbox = {
    minX: bbox.minX - tolerance,
    minY: bbox.minY - tolerance,
    maxX: bbox.maxX + tolerance,
    maxY: bbox.maxY + tolerance,
  };

  if (!boundingBoxContainsPoint(expandedBbox, point)) {
    return false;
  }

  switch (entity.type) {
    case 'line':
      return distanceToLineSegment(point, entity.startPoint, entity.endPoint) <= tolerance;

    case 'polyline':
      for (let i = 0; i < entity.points.length - 1; i++) {
        if (distanceToLineSegment(point, entity.points[i], entity.points[i + 1]) <= tolerance) {
          return true;
        }
      }
      if (entity.closed && entity.points.length > 2) {
        return distanceToLineSegment(
          point,
          entity.points[entity.points.length - 1],
          entity.points[0]
        ) <= tolerance;
      }
      return false;

    case 'circle':
      const distToCenter = distance(point, entity.center);
      return Math.abs(distToCenter - entity.radius) <= tolerance;

    case 'rectangle':
      return isPointNearRectangle(point, entity.topLeft, entity.width, entity.height, tolerance);

    case 'text':
    case 'dimension':
    case 'hatch':
    case 'block':
      return boundingBoxContainsPoint(bbox, point);

    default:
      return false;
  }
}

function distanceToLineSegment(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  return distance(point, { x: xx, y: yy });
}

function isPointNearRectangle(point, topLeft, width, height, tolerance) {
  const corners = [
    topLeft,
    { x: topLeft.x + width, y: topLeft.y },
    { x: topLeft.x + width, y: topLeft.y + height },
    { x: topLeft.x, y: topLeft.y + height },
  ];

  for (let i = 0; i < 4; i++) {
    if (distanceToLineSegment(point, corners[i], corners[(i + 1) % 4]) <= tolerance) {
      return true;
    }
  }

  return false;
}

/**
 * Select entities within a bounding box
 * @param {Array} entities
 * @param {Object} box
 * @returns {Array}
 */
export function selectEntitiesInBox(entities, box) {
  return entities.filter(entity => {
    const entityBox = getEntityBoundingBox(entity);
    return entityBox.minX >= box.minX &&
      entityBox.maxX <= box.maxX &&
      entityBox.minY >= box.minY &&
      entityBox.maxY <= box.maxY;
  });
}

/**
 * Get snap points from entities
 * @param {Array} entities
 * @param {Object} settings
 * @returns {Array<{ point: { x: number, y: number }, type: string }>}
 */
export function getSnapPoints(entities, settings) {
  const snapPoints = [];

  for (const entity of entities) {
    if (!entity.visible) continue;

    switch (entity.type) {
      case 'line':
        if (settings.endpointSnap) {
          snapPoints.push({ point: entity.startPoint, type: 'endpoint' });
          snapPoints.push({ point: entity.endPoint, type: 'endpoint' });
        }
        if (settings.midpointSnap) {
          snapPoints.push({
            point: {
              x: (entity.startPoint.x + entity.endPoint.x) / 2,
              y: (entity.startPoint.y + entity.endPoint.y) / 2,
            },
            type: 'midpoint',
          });
        }
        break;

      case 'polyline':
        if (settings.endpointSnap) {
          entity.points.forEach(p => snapPoints.push({ point: p, type: 'endpoint' }));
        }
        if (settings.midpointSnap) {
          for (let i = 0; i < entity.points.length - 1; i++) {
            snapPoints.push({
              point: {
                x: (entity.points[i].x + entity.points[i + 1].x) / 2,
                y: (entity.points[i].y + entity.points[i + 1].y) / 2,
              },
              type: 'midpoint',
            });
          }
        }
        break;

      case 'circle':
        if (settings.centerSnap) {
          snapPoints.push({ point: entity.center, type: 'center' });
        }
        // Quadrant points (0°, 90°, 180°, 270°)
        if (settings.endpointSnap) {
          snapPoints.push({ point: { x: entity.center.x + entity.radius, y: entity.center.y }, type: 'quadrant' });
          snapPoints.push({ point: { x: entity.center.x - entity.radius, y: entity.center.y }, type: 'quadrant' });
          snapPoints.push({ point: { x: entity.center.x, y: entity.center.y + entity.radius }, type: 'quadrant' });
          snapPoints.push({ point: { x: entity.center.x, y: entity.center.y - entity.radius }, type: 'quadrant' });
        }
        break;

      case 'arc':
        if (settings.centerSnap) {
          snapPoints.push({ point: entity.center, type: 'center' });
        }
        if (settings.endpointSnap) {
          // Arc endpoints
          const startRad = (entity.startAngle * Math.PI) / 180;
          const endRad = (entity.endAngle * Math.PI) / 180;
          snapPoints.push({
            point: {
              x: entity.center.x + entity.radius * Math.cos(startRad),
              y: entity.center.y + entity.radius * Math.sin(startRad),
            },
            type: 'endpoint',
          });
          snapPoints.push({
            point: {
              x: entity.center.x + entity.radius * Math.cos(endRad),
              y: entity.center.y + entity.radius * Math.sin(endRad),
            },
            type: 'endpoint',
          });
        }
        break;

      case 'rectangle':
        if (settings.endpointSnap) {
          snapPoints.push({ point: entity.topLeft, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
        }
        if (settings.midpointSnap) {
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
        }
        if (settings.centerSnap) {
          snapPoints.push({
            point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height / 2 },
            type: 'center',
          });
        }
        break;
    }
  }

  return snapPoints;
}

/**
 * Get intersection snap points between entities
 * @param {Array} entities - All entities to check
 * @param {Object} cursorPoint - Current cursor position
 * @param {number} maxDistance - Maximum distance to search
 * @returns {Array<{ point: { x: number, y: number }, type: string }>}
 */
export function getIntersectionSnapPoints(entities, cursorPoint, maxDistance) {
  const intersections = [];
  const lines = [];
  const circles = [];

  // Collect line segments
  for (const entity of entities) {
    if (!entity.visible) continue;

    if (entity.type === 'line') {
      lines.push({ start: entity.startPoint, end: entity.endPoint });
    } else if (entity.type === 'polyline') {
      for (let i = 0; i < entity.points.length - 1; i++) {
        lines.push({ start: entity.points[i], end: entity.points[i + 1] });
      }
      if (entity.closed && entity.points.length > 2) {
        lines.push({ start: entity.points[entity.points.length - 1], end: entity.points[0] });
      }
    } else if (entity.type === 'rectangle') {
      const corners = [
        entity.topLeft,
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y },
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height },
        { x: entity.topLeft.x, y: entity.topLeft.y + entity.height },
      ];
      for (let i = 0; i < 4; i++) {
        lines.push({ start: corners[i], end: corners[(i + 1) % 4] });
      }
    } else if (entity.type === 'circle') {
      circles.push({ center: entity.center, radius: entity.radius });
    }
  }

  // Find line-line intersections
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const int = lineSegmentIntersection(lines[i].start, lines[i].end, lines[j].start, lines[j].end);
      if (int && distance(int, cursorPoint) <= maxDistance) {
        intersections.push({ point: int, type: 'intersection' });
      }
    }
  }

  // Find line-circle intersections
  for (const line of lines) {
    for (const circle of circles) {
      const ints = lineCircleIntersection(line.start, line.end, circle.center, circle.radius);
      for (const int of ints) {
        if (distance(int, cursorPoint) <= maxDistance) {
          intersections.push({ point: int, type: 'intersection' });
        }
      }
    }
  }

  return intersections;
}

/**
 * Get perpendicular snap point from cursor to an entity
 * @param {Object} entity - Entity to snap perpendicular to
 * @param {Object} cursorPoint - Current cursor position
 * @returns {Object|null} Perpendicular snap point or null
 */
export function getPerpendicularSnapPoint(entity, cursorPoint) {
  if (entity.type === 'line') {
    const foot = perpendicularFootOnLine(cursorPoint, entity.startPoint, entity.endPoint);
    if (foot) {
      return { point: foot, type: 'perpendicular' };
    }
  } else if (entity.type === 'polyline') {
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < entity.points.length - 1; i++) {
      const foot = perpendicularFootOnLine(cursorPoint, entity.points[i], entity.points[i + 1]);
      if (foot) {
        const d = distance(foot, cursorPoint);
        if (d < minDist) {
          minDist = d;
          nearest = foot;
        }
      }
    }
    if (nearest) {
      return { point: nearest, type: 'perpendicular' };
    }
  }
  return null;
}

/**
 * Get tangent snap points from a point to a circle
 * @param {Object} circle - Circle entity
 * @param {Object} fromPoint - Point to draw tangent from
 * @returns {Array<{ point: { x: number, y: number }, type: string }>}
 */
export function getTangentSnapPoints(circle, fromPoint) {
  const dx = fromPoint.x - circle.center.x;
  const dy = fromPoint.y - circle.center.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d <= circle.radius) {
    return []; // Point inside circle, no tangent
  }

  const a = Math.acos(circle.radius / d);
  const b = Math.atan2(dy, dx);

  const tangents = [];

  // Two tangent points
  tangents.push({
    point: {
      x: circle.center.x + circle.radius * Math.cos(b + a),
      y: circle.center.y + circle.radius * Math.sin(b + a),
    },
    type: 'tangent',
  });
  tangents.push({
    point: {
      x: circle.center.x + circle.radius * Math.cos(b - a),
      y: circle.center.y + circle.radius * Math.sin(b - a),
    },
    type: 'tangent',
  });

  return tangents;
}

/**
 * Get nearest point on entity
 * @param {Object} entity - Entity to find nearest point on
 * @param {Object} cursorPoint - Current cursor position
 * @returns {Object|null} Nearest snap point or null
 */
export function getNearestSnapPoint(entity, cursorPoint) {
  if (entity.type === 'line') {
    const nearest = nearestPointOnLineSegment(cursorPoint, entity.startPoint, entity.endPoint);
    return { point: nearest, type: 'nearest' };
  } else if (entity.type === 'circle') {
    const angle = Math.atan2(cursorPoint.y - entity.center.y, cursorPoint.x - entity.center.x);
    return {
      point: {
        x: entity.center.x + entity.radius * Math.cos(angle),
        y: entity.center.y + entity.radius * Math.sin(angle),
      },
      type: 'nearest',
    };
  } else if (entity.type === 'polyline') {
    let nearest = null;
    let minDist = Infinity;
    for (let i = 0; i < entity.points.length - 1; i++) {
      const pt = nearestPointOnLineSegment(cursorPoint, entity.points[i], entity.points[i + 1]);
      const d = distance(pt, cursorPoint);
      if (d < minDist) {
        minDist = d;
        nearest = pt;
      }
    }
    if (nearest) {
      return { point: nearest, type: 'nearest' };
    }
  }
  return null;
}

// Helper: Line segment intersection
function lineSegmentIntersection(p1, p2, p3, p4) {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 0.0001) return null;

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  }
  return null;
}

// Helper: Line-circle intersection
function lineCircleIntersection(p1, p2, center, radius) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const fx = p1.x - center.x;
  const fy = p1.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) return [];

  const results = [];
  const sqrtD = Math.sqrt(discriminant);

  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    results.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
  }
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 0.0001) {
    results.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
  }

  return results;
}

// Helper: Perpendicular foot on line segment
function perpendicularFootOnLine(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return null;

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
  if (t < 0 || t > 1) return null;

  return { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
}

// Helper: Nearest point on line segment
function nearestPointOnLineSegment(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return lineStart;

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
  return { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
}

/**
 * Find nearest snap point
 * @param {{ x: number, y: number }} point
 * @param {Array} snapPoints
 * @param {number} maxDistance
 * @returns {Object|null}
 */
export function findNearestSnapPoint(point, snapPoints, maxDistance) {
  let nearest = null;
  let minDist = maxDistance;

  for (const sp of snapPoints) {
    const dist = distance(point, sp.point);
    if (dist < minDist) {
      minDist = dist;
      nearest = sp;
    }
  }

  return nearest;
}

// ============================================
// Entity Editing Operations
// ============================================

/**
 * Trim an entity to a cutting boundary
 * @param {Object} entity - Entity to trim
 * @param {Object} cuttingEdge - Line or polyline to cut with
 * @param {Object} pickPoint - Point indicating which side to keep
 * @returns {Object|null} Trimmed entity or null if no intersection
 */
export function trimEntity(entity, cuttingEdge, pickPoint) {
  if (entity.type !== 'line') {
    return null; // Currently only supports lines
  }

  // Find intersection point
  const intersection = lineLineIntersection(
    entity.startPoint, entity.endPoint,
    cuttingEdge.startPoint || cuttingEdge.points?.[0],
    cuttingEdge.endPoint || cuttingEdge.points?.[1]
  );

  if (!intersection) return null;

  // Determine which side of intersection to keep based on pickPoint
  const distToStart = distance(pickPoint, entity.startPoint);
  const distToEnd = distance(pickPoint, entity.endPoint);

  if (distToStart < distToEnd) {
    // Keep the start portion
    return {
      ...entity,
      endPoint: intersection,
    };
  } else {
    // Keep the end portion
    return {
      ...entity,
      startPoint: intersection,
    };
  }
}

/**
 * Extend an entity to meet a boundary
 * @param {Object} entity - Entity to extend
 * @param {Object} boundaryEdge - Line or polyline to extend to
 * @param {Object} pickPoint - Point indicating which end to extend
 * @returns {Object|null} Extended entity or null if no intersection possible
 */
export function extendEntity(entity, boundaryEdge, pickPoint) {
  if (entity.type !== 'line') {
    return null; // Currently only supports lines
  }

  // Project the line infinitely to find intersection
  const dx = entity.endPoint.x - entity.startPoint.x;
  const dy = entity.endPoint.y - entity.startPoint.y;

  // Extend line far beyond current endpoints
  const extendedStart = {
    x: entity.startPoint.x - dx * 1000,
    y: entity.startPoint.y - dy * 1000,
  };
  const extendedEnd = {
    x: entity.endPoint.x + dx * 1000,
    y: entity.endPoint.y + dy * 1000,
  };

  const intersection = lineLineIntersection(
    extendedStart, extendedEnd,
    boundaryEdge.startPoint || boundaryEdge.points?.[0],
    boundaryEdge.endPoint || boundaryEdge.points?.[1]
  );

  if (!intersection) return null;

  // Determine which end to extend based on pickPoint
  const distToStart = distance(pickPoint, entity.startPoint);
  const distToEnd = distance(pickPoint, entity.endPoint);

  if (distToStart < distToEnd) {
    // Extend from start
    return {
      ...entity,
      startPoint: intersection,
    };
  } else {
    // Extend from end
    return {
      ...entity,
      endPoint: intersection,
    };
  }
}

/**
 * Create an offset copy of an entity at a given distance
 * @param {Object} entity - Entity to offset
 * @param {number} offsetDistance - Distance to offset (positive = right/outward)
 * @returns {Object|null} Offset entity or null if not supported
 */
export function offsetEntity(entity, offsetDistance) {
  switch (entity.type) {
    case 'line': {
      const dx = entity.endPoint.x - entity.startPoint.x;
      const dy = entity.endPoint.y - entity.startPoint.y;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len === 0) return null;

      // Perpendicular unit vector (rotated 90 degrees)
      const perpX = -dy / len;
      const perpY = dx / len;

      return {
        ...entity,
        id: generateId(),
        startPoint: {
          x: entity.startPoint.x + perpX * offsetDistance,
          y: entity.startPoint.y + perpY * offsetDistance,
        },
        endPoint: {
          x: entity.endPoint.x + perpX * offsetDistance,
          y: entity.endPoint.y + perpY * offsetDistance,
        },
      };
    }

    case 'circle': {
      const newRadius = entity.radius + offsetDistance;
      if (newRadius <= 0) return null;

      return {
        ...entity,
        id: generateId(),
        radius: newRadius,
      };
    }

    case 'polyline': {
      const offsetPoints = offsetPolyline(entity.points, offsetDistance, entity.closed);
      return {
        ...entity,
        id: generateId(),
        points: offsetPoints,
      };
    }

    case 'rectangle': {
      return {
        ...entity,
        id: generateId(),
        topLeft: {
          x: entity.topLeft.x - offsetDistance,
          y: entity.topLeft.y - offsetDistance,
        },
        width: entity.width + 2 * offsetDistance,
        height: entity.height + 2 * offsetDistance,
      };
    }

    default:
      return null;
  }
}

/**
 * Offset a polyline by a distance
 */
function offsetPolyline(points, dist, closed) {
  const result = [];
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    if (!closed && i === 0) {
      // First point of open polyline
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        result.push({
          x: curr.x + (-dy / len) * dist,
          y: curr.y + (dx / len) * dist,
        });
      }
    } else if (!closed && i === n - 1) {
      // Last point of open polyline
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        result.push({
          x: curr.x + (-dy / len) * dist,
          y: curr.y + (dx / len) * dist,
        });
      }
    } else {
      // Interior point or closed polyline
      const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
      const v2 = { x: next.x - curr.x, y: next.y - curr.y };
      const len1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const len2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

      if (len1 > 0 && len2 > 0) {
        const n1 = { x: -v1.y / len1, y: v1.x / len1 };
        const n2 = { x: -v2.y / len2, y: v2.x / len2 };
        const avgNormal = {
          x: (n1.x + n2.x) / 2,
          y: (n1.y + n2.y) / 2,
        };
        const avgLen = Math.sqrt(avgNormal.x * avgNormal.x + avgNormal.y * avgNormal.y);
        if (avgLen > 0) {
          result.push({
            x: curr.x + (avgNormal.x / avgLen) * dist,
            y: curr.y + (avgNormal.y / avgLen) * dist,
          });
        }
      }
    }
  }

  return result;
}

/**
 * Mirror entities across a line
 * @param {Array} entities - Entities to mirror
 * @param {Object} mirrorLine - Line to mirror across { start, end }
 * @returns {Array} Mirrored entities (new copies)
 */
export function mirrorEntities(entities, mirrorLine) {
  return entities.map(entity => mirrorEntity(entity, mirrorLine));
}

function mirrorEntity(entity, mirrorLine) {
  const { start, end } = mirrorLine;

  const mirrorPoint = (pt) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return pt;

    const t = ((pt.x - start.x) * dx + (pt.y - start.y) * dy) / lenSq;
    const projX = start.x + t * dx;
    const projY = start.y + t * dy;

    return {
      x: 2 * projX - pt.x,
      y: 2 * projY - pt.y,
    };
  };

  switch (entity.type) {
    case 'line':
      return {
        ...entity,
        id: generateId(),
        startPoint: mirrorPoint(entity.startPoint),
        endPoint: mirrorPoint(entity.endPoint),
      };

    case 'circle':
      return {
        ...entity,
        id: generateId(),
        center: mirrorPoint(entity.center),
      };

    case 'polyline':
      return {
        ...entity,
        id: generateId(),
        points: entity.points.map(mirrorPoint),
      };

    case 'rectangle':
      return {
        ...entity,
        id: generateId(),
        topLeft: mirrorPoint(entity.topLeft),
      };

    case 'text':
      return {
        ...entity,
        id: generateId(),
        position: mirrorPoint(entity.position),
      };

    default:
      return { ...entity, id: generateId() };
  }
}

/**
 * Scale entities from a base point
 * @param {Array} entities - Entities to scale
 * @param {Object} basePoint - Point to scale from
 * @param {number} scaleFactor - Scale factor (1 = no change, 2 = double size)
 * @returns {Array} Scaled entities (new copies)
 */
export function scaleEntities(entities, basePoint, scaleFactor) {
  return entities.map(entity => scaleEntity(entity, basePoint, scaleFactor));
}

function scaleEntity(entity, basePoint, factor) {
  const scalePoint = (pt) => ({
    x: basePoint.x + (pt.x - basePoint.x) * factor,
    y: basePoint.y + (pt.y - basePoint.y) * factor,
  });

  switch (entity.type) {
    case 'line':
      return {
        ...entity,
        id: generateId(),
        startPoint: scalePoint(entity.startPoint),
        endPoint: scalePoint(entity.endPoint),
      };

    case 'circle':
      return {
        ...entity,
        id: generateId(),
        center: scalePoint(entity.center),
        radius: entity.radius * factor,
      };

    case 'polyline':
      return {
        ...entity,
        id: generateId(),
        points: entity.points.map(scalePoint),
      };

    case 'rectangle':
      return {
        ...entity,
        id: generateId(),
        topLeft: scalePoint(entity.topLeft),
        width: entity.width * factor,
        height: entity.height * factor,
      };

    case 'text':
      return {
        ...entity,
        id: generateId(),
        position: scalePoint(entity.position),
        fontSize: (entity.fontSize || 12) * factor,
      };

    default:
      return { ...entity, id: generateId() };
  }
}

/**
 * Rotate entities around a base point
 * @param {Array} entities - Entities to rotate
 * @param {Object} basePoint - Point to rotate around
 * @param {number} angleDegrees - Rotation angle in degrees (positive = counterclockwise)
 * @returns {Array} Rotated entities (new copies)
 */
export function rotateEntities(entities, basePoint, angleDegrees) {
  const angleRad = (angleDegrees * Math.PI) / 180;
  return entities.map(entity => rotateEntity(entity, basePoint, angleRad));
}

function rotateEntity(entity, basePoint, angleRad) {
  const rotatePoint = (pt) => {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = pt.x - basePoint.x;
    const dy = pt.y - basePoint.y;
    return {
      x: basePoint.x + dx * cos - dy * sin,
      y: basePoint.y + dx * sin + dy * cos,
    };
  };

  switch (entity.type) {
    case 'line':
      return {
        ...entity,
        id: generateId(),
        startPoint: rotatePoint(entity.startPoint),
        endPoint: rotatePoint(entity.endPoint),
      };

    case 'circle':
      return {
        ...entity,
        id: generateId(),
        center: rotatePoint(entity.center),
      };

    case 'polyline':
      return {
        ...entity,
        id: generateId(),
        points: entity.points.map(rotatePoint),
      };

    case 'rectangle':
      // Note: Rotating a rectangle converts it to a polyline for accuracy
      const corners = [
        entity.topLeft,
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y },
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height },
        { x: entity.topLeft.x, y: entity.topLeft.y + entity.height },
      ];
      return {
        ...entity,
        type: 'polyline',
        id: generateId(),
        points: corners.map(rotatePoint),
        closed: true,
      };

    case 'text':
      return {
        ...entity,
        id: generateId(),
        position: rotatePoint(entity.position),
        rotation: ((entity.rotation || 0) + (angleRad * 180 / Math.PI)) % 360,
      };

    default:
      return { ...entity, id: generateId() };
  }
}

/**
 * Line-line intersection calculation
 */
function lineLineIntersection(p1, p2, p3, p4) {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 0.0001) return null; // Parallel lines

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }

  return null;
}

// ============================================
// Grid Snap
// ============================================

/**
 * Snap point to grid
 * @param {{ x: number, y: number }} point
 * @param {number} gridSpacing
 * @returns {{ x: number, y: number }}
 */
export function snapToGrid(point, gridSpacing) {
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing,
  };
}

// ============================================
// Command History (Undo/Redo)
// ============================================

export class CommandHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 100;
  }

  execute(command) {
    command.redo();
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    return false;
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    return false;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ============================================
// Entity Commands
// ============================================

export function createAddEntityCommand(entities, newEntity, setEntities) {
  return {
    id: generateId(),
    type: 'add-entity',
    timestamp: new Date(),
    data: newEntity,
    undo: () => setEntities(entities.filter(e => e.id !== newEntity.id)),
    redo: () => setEntities([...entities.filter(e => e.id !== newEntity.id), newEntity]),
  };
}

export function createDeleteEntityCommand(entities, entityId, setEntities) {
  const entity = entities.find(e => e.id === entityId);
  if (!entity) throw new Error(`Entity ${entityId} not found`);

  return {
    id: generateId(),
    type: 'delete-entity',
    timestamp: new Date(),
    data: entity,
    undo: () => setEntities([...entities.filter(e => e.id !== entityId), entity]),
    redo: () => setEntities(entities.filter(e => e.id !== entityId)),
  };
}

export function createModifyEntityCommand(entities, entityId, newProperties, setEntities) {
  const entityIndex = entities.findIndex(e => e.id === entityId);
  if (entityIndex === -1) throw new Error(`Entity ${entityId} not found`);

  const oldEntity = { ...entities[entityIndex] };
  const newEntity = { ...oldEntity, ...newProperties };

  return {
    id: generateId(),
    type: 'modify-entity',
    timestamp: new Date(),
    data: { old: oldEntity, new: newEntity },
    undo: () => {
      const updated = [...entities];
      updated[entityIndex] = oldEntity;
      setEntities(updated);
    },
    redo: () => {
      const updated = [...entities];
      updated[entityIndex] = newEntity;
      setEntities(updated);
    },
  };
}

// ============================================
// Viewport Management
// ============================================

export function createViewport(name) {
  return {
    id: generateId(),
    name,
    bounds: { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 },
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    isActive: false,
  };
}

export function screenToWorld(screenPoint, viewport, canvasSize) {
  return {
    x: (screenPoint.x - canvasSize.width / 2 - viewport.pan.x) / viewport.zoom,
    y: (screenPoint.y - canvasSize.height / 2 - viewport.pan.y) / viewport.zoom,
  };
}

export function worldToScreen(worldPoint, viewport, canvasSize) {
  return {
    x: worldPoint.x * viewport.zoom + canvasSize.width / 2 + viewport.pan.x,
    y: worldPoint.y * viewport.zoom + canvasSize.height / 2 + viewport.pan.y,
  };
}

// ============================================
// Project Management
// ============================================

export function createNewProject(name) {
  return {
    id: generateId(),
    name,
    description: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    author: '',
    location: {
      province: 'National Capital District',
      terrainType: 'coastal-lowland',
    },
    projectType: 'general',
    units: DEFAULT_UNITS,
    layers: [...DEFAULT_LAYERS],
    entities: [],
    blocks: [],
    viewports: [{ ...createViewport('Main'), isActive: true }],
    metadata: {
      standards: ['PNG Building Board Standards'],
    },
  };
}

// ============================================
// Engine State
// ============================================

export function createInitialState(projectName = 'Untitled') {
  return {
    project: createNewProject(projectName),
    activeTool: 'select',
    selectedEntityIds: [],
    activeLayerId: 'layer-0',
    gridSettings: DEFAULT_GRID,
    snapSettings: DEFAULT_SNAP,
    commandHistory: new CommandHistory(),
  };
}
