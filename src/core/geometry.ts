/**
 * Geometry utilities for CAD calculations
 */

import type { Point2D, Point3D, BoundingBox, Entity, LineEntity, CircleEntity, ArcEntity } from './types';

// ============================================
// Point Operations
// ============================================

export function createPoint(x: number, y: number): Point2D {
  return { x, y };
}

export function createPoint3D(x: number, y: number, z: number): Point3D {
  return { x, y, z };
}

export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function distance3D(p1: Point3D, p2: Point3D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function midpoint(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function addPoints(p1: Point2D, p2: Point2D): Point2D {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function subtractPoints(p1: Point2D, p2: Point2D): Point2D {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function scalePoint(p: Point2D, factor: number): Point2D {
  return { x: p.x * factor, y: p.y * factor };
}

export function rotatePoint(p: Point2D, center: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 2 * Math.PI;
  while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
  return angle;
}

export function angleBetweenPoints(p1: Point2D, p2: Point2D): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

export function polarToCartesian(center: Point2D, radius: number, angle: number): Point2D {
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

// ============================================
// Line Operations
// ============================================

export function lineLength(line: LineEntity): number {
  return distance(line.startPoint, line.endPoint);
}

export function pointOnLine(start: Point2D, end: Point2D, t: number): Point2D {
  return {
    x: start.x + t * (end.x - start.x),
    y: start.y + t * (end.y - start.y),
  };
}

export function distanceToLine(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
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

  let xx: number, yy: number;

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

export function lineIntersection(
  l1Start: Point2D, l1End: Point2D,
  l2Start: Point2D, l2End: Point2D
): Point2D | null {
  const d1x = l1End.x - l1Start.x;
  const d1y = l1End.y - l1Start.y;
  const d2x = l2End.x - l2Start.x;
  const d2y = l2End.y - l2Start.y;

  const cross = d1x * d2y - d1y * d2x;

  if (Math.abs(cross) < 1e-10) {
    return null; // Lines are parallel
  }

  const dx = l2Start.x - l1Start.x;
  const dy = l2Start.y - l1Start.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    return {
      x: l1Start.x + t1 * d1x,
      y: l1Start.y + t1 * d1y,
    };
  }

  return null;
}

export function perpendicularPoint(lineStart: Point2D, lineEnd: Point2D, point: Point2D): Point2D {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return lineStart;

  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

// ============================================
// Circle Operations
// ============================================

export function circleArea(radius: number): number {
  return Math.PI * radius * radius;
}

export function circleCircumference(radius: number): number {
  return 2 * Math.PI * radius;
}

export function pointOnCircle(center: Point2D, radius: number, angle: number): Point2D {
  return polarToCartesian(center, radius, angle);
}

export function circleLineIntersection(
  center: Point2D,
  radius: number,
  lineStart: Point2D,
  lineEnd: Point2D
): Point2D[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;

  let discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return [];
  }

  discriminant = Math.sqrt(discriminant);
  const points: Point2D[] = [];

  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);

  if (t1 >= 0 && t1 <= 1) {
    points.push({ x: lineStart.x + t1 * dx, y: lineStart.y + t1 * dy });
  }

  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
    points.push({ x: lineStart.x + t2 * dx, y: lineStart.y + t2 * dy });
  }

  return points;
}

export function circleCircleIntersection(
  c1: Point2D, r1: number,
  c2: Point2D, r2: number
): Point2D[] {
  const d = distance(c1, c2);

  if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) {
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const px = c1.x + (a * (c2.x - c1.x)) / d;
  const py = c1.y + (a * (c2.y - c1.y)) / d;

  return [
    {
      x: px + (h * (c2.y - c1.y)) / d,
      y: py - (h * (c2.x - c1.x)) / d,
    },
    {
      x: px - (h * (c2.y - c1.y)) / d,
      y: py + (h * (c2.x - c1.x)) / d,
    },
  ];
}

// ============================================
// Arc Operations
// ============================================

export function arcLength(radius: number, startAngle: number, endAngle: number): number {
  let angle = endAngle - startAngle;
  if (angle < 0) angle += 2 * Math.PI;
  return radius * angle;
}

export function arcMidpoint(arc: ArcEntity): Point2D {
  let midAngle = (arc.startAngle + arc.endAngle) / 2;
  if (arc.endAngle < arc.startAngle) {
    midAngle += Math.PI;
  }
  return polarToCartesian(arc.center, arc.radius, midAngle);
}

// ============================================
// Polygon Operations
// ============================================

export function polygonArea(points: Point2D[]): number {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

export function polygonPerimeter(points: Point2D[]): number {
  let perimeter = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += distance(points[i], points[j]);
  }

  return perimeter;
}

export function polygonCentroid(points: Point2D[]): Point2D {
  let cx = 0, cy = 0;
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    area += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }

  area /= 2;
  cx /= (6 * area);
  cy /= (6 * area);

  return { x: cx, y: cy };
}

export function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }

  return inside;
}

export function regularPolygonVertices(center: Point2D, radius: number, sides: number, rotation: number = 0): Point2D[] {
  const vertices: Point2D[] = [];
  const angleStep = (2 * Math.PI) / sides;

  for (let i = 0; i < sides; i++) {
    const angle = rotation + i * angleStep - Math.PI / 2;
    vertices.push(polarToCartesian(center, radius, angle));
  }

  return vertices;
}

// ============================================
// Bounding Box Operations
// ============================================

export function createBoundingBox(points: Point2D[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return { minX, minY, maxX, maxY };
}

export function expandBoundingBox(box: BoundingBox, margin: number): BoundingBox {
  return {
    minX: box.minX - margin,
    minY: box.minY - margin,
    maxX: box.maxX + margin,
    maxY: box.maxY + margin,
  };
}

export function mergeBoundingBoxes(boxes: BoundingBox[]): BoundingBox {
  if (boxes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  return {
    minX: Math.min(...boxes.map(b => b.minX)),
    minY: Math.min(...boxes.map(b => b.minY)),
    maxX: Math.max(...boxes.map(b => b.maxX)),
    maxY: Math.max(...boxes.map(b => b.maxY)),
  };
}

export function boundingBoxContainsPoint(box: BoundingBox, point: Point2D): boolean {
  return point.x >= box.minX && point.x <= box.maxX &&
         point.y >= box.minY && point.y <= box.maxY;
}

export function boundingBoxesOverlap(box1: BoundingBox, box2: BoundingBox): boolean {
  return box1.minX <= box2.maxX && box1.maxX >= box2.minX &&
         box1.minY <= box2.maxY && box1.maxY >= box2.minY;
}

export function boundingBoxCenter(box: BoundingBox): Point2D {
  return {
    x: (box.minX + box.maxX) / 2,
    y: (box.minY + box.maxY) / 2,
  };
}

export function boundingBoxDimensions(box: BoundingBox): { width: number; height: number } {
  return {
    width: box.maxX - box.minX,
    height: box.maxY - box.minY,
  };
}

// ============================================
// Entity Bounding Box
// ============================================

export function getEntityBoundingBox(entity: Entity): BoundingBox {
  switch (entity.type) {
    case 'line':
      return createBoundingBox([entity.startPoint, entity.endPoint]);

    case 'polyline':
      return createBoundingBox(entity.points);

    case 'circle':
      return {
        minX: entity.center.x - entity.radius,
        minY: entity.center.y - entity.radius,
        maxX: entity.center.x + entity.radius,
        maxY: entity.center.y + entity.radius,
      };

    case 'arc': {
      const points = [
        polarToCartesian(entity.center, entity.radius, entity.startAngle),
        polarToCartesian(entity.center, entity.radius, entity.endAngle),
      ];
      // Check cardinal points
      for (const angle of [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]) {
        if (isAngleInArc(angle, entity.startAngle, entity.endAngle)) {
          points.push(polarToCartesian(entity.center, entity.radius, angle));
        }
      }
      return createBoundingBox(points);
    }

    case 'rectangle':
      return {
        minX: entity.topLeft.x,
        minY: entity.topLeft.y,
        maxX: entity.topLeft.x + entity.width,
        maxY: entity.topLeft.y + entity.height,
      };

    case 'polygon':
      return createBoundingBox(
        regularPolygonVertices(entity.center, entity.radius, entity.sides, entity.rotation)
      );

    case 'text':
      // Approximate - would need font metrics for accuracy
      return {
        minX: entity.position.x,
        minY: entity.position.y - entity.fontSize,
        maxX: entity.position.x + entity.content.length * entity.fontSize * 0.6,
        maxY: entity.position.y,
      };

    case 'dimension':
      return createBoundingBox([entity.startPoint, entity.endPoint, entity.textPosition]);

    case 'hatch':
      return createBoundingBox(entity.boundary);

    case 'block':
      // Would need block definition for accurate bounds
      return {
        minX: entity.insertionPoint.x,
        minY: entity.insertionPoint.y,
        maxX: entity.insertionPoint.x + 100 * entity.scale.x,
        maxY: entity.insertionPoint.y + 100 * entity.scale.y,
      };

    default:
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
}

function isAngleInArc(angle: number, startAngle: number, endAngle: number): boolean {
  const normalizedAngle = normalizeAngle(angle);
  const normalizedStart = normalizeAngle(startAngle);
  const normalizedEnd = normalizeAngle(endAngle);

  if (normalizedStart <= normalizedEnd) {
    return normalizedAngle >= normalizedStart && normalizedAngle <= normalizedEnd;
  } else {
    return normalizedAngle >= normalizedStart || normalizedAngle <= normalizedEnd;
  }
}

// ============================================
// Unit Conversion
// ============================================

export const UNIT_CONVERSIONS = {
  mm: 1,
  m: 1000,
  km: 1000000,
  inches: 25.4,
  feet: 304.8,
} as const;

export function convertUnits(value: number, from: keyof typeof UNIT_CONVERSIONS, to: keyof typeof UNIT_CONVERSIONS): number {
  const inMm = value * UNIT_CONVERSIONS[from];
  return inMm / UNIT_CONVERSIONS[to];
}

// ============================================
// Coordinate Transformations for PNG
// ============================================

export function latLongToUTM(lat: number, lon: number): { easting: number; northing: number; zone: number } {
  // PNG spans UTM zones 54-56
  const zone = Math.floor((lon + 180) / 6) + 1;

  const a = 6378137; // WGS84 semi-major axis
  const f = 1 / 298.257223563; // WGS84 flattening
  const k0 = 0.9996; // UTM scale factor

  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;

  const lonOrigin = (zone - 1) * 6 - 180 + 3;
  const lonOriginRad = lonOrigin * Math.PI / 180;

  const e = Math.sqrt(2 * f - f * f);
  const ePrimeSquared = e * e / (1 - e * e);

  const N = a / Math.sqrt(1 - e * e * Math.sin(latRad) * Math.sin(latRad));
  const T = Math.tan(latRad) * Math.tan(latRad);
  const C = ePrimeSquared * Math.cos(latRad) * Math.cos(latRad);
  const A = Math.cos(latRad) * (lonRad - lonOriginRad);

  const M = a * ((1 - e * e / 4 - 3 * e * e * e * e / 64) * latRad
    - (3 * e * e / 8 + 3 * e * e * e * e / 32) * Math.sin(2 * latRad)
    + (15 * e * e * e * e / 256) * Math.sin(4 * latRad));

  const easting = k0 * N * (A + (1 - T + C) * A * A * A / 6
    + (5 - 18 * T + T * T + 72 * C - 58 * ePrimeSquared) * A * A * A * A * A / 120)
    + 500000;

  let northing = k0 * (M + N * Math.tan(latRad) * (A * A / 2
    + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24
    + (61 - 58 * T + T * T + 600 * C - 330 * ePrimeSquared) * A * A * A * A * A * A / 720));

  if (lat < 0) {
    northing += 10000000; // Southern hemisphere offset
  }

  return { easting, northing, zone };
}
