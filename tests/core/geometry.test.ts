/**
 * Geometry Module Tests
 * Comprehensive tests for geometric calculations
 */

import { describe, it, expect } from 'vitest';
import {
  createPoint,
  createPoint3D,
  distance,
  distance3D,
  midpoint,
  addPoints,
  subtractPoints,
  scalePoint,
  rotatePoint,
  normalizeAngle,
  angleBetweenPoints,
  polarToCartesian,
  lineLength,
  pointOnLine,
  distanceToLine,
  lineIntersection,
  perpendicularPoint,
  circleArea,
  circleCircumference,
  circleLineIntersection,
  circleCircleIntersection,
  polygonArea,
  polygonPerimeter,
  polygonCentroid,
  isPointInPolygon,
  regularPolygonVertices,
  createBoundingBox,
  expandBoundingBox,
  mergeBoundingBoxes,
  boundingBoxContainsPoint,
  boundingBoxesOverlap,
  boundingBoxCenter,
  boundingBoxDimensions,
  convertUnits,
  latLongToUTM,
} from '../../src/core/geometry';

describe('Geometry Module', () => {
  // ==========================================
  // Point Operations
  // ==========================================
  describe('Point Operations', () => {
    describe('createPoint', () => {
      it('should create a 2D point', () => {
        const point = createPoint(10, 20);
        expect(point).toEqual({ x: 10, y: 20 });
      });

      it('should handle negative coordinates', () => {
        const point = createPoint(-5, -10);
        expect(point).toEqual({ x: -5, y: -10 });
      });

      it('should handle zero coordinates', () => {
        const point = createPoint(0, 0);
        expect(point).toEqual({ x: 0, y: 0 });
      });

      it('should handle decimal coordinates', () => {
        const point = createPoint(3.14159, 2.71828);
        expect(point.x).toBeCloseTo(3.14159);
        expect(point.y).toBeCloseTo(2.71828);
      });
    });

    describe('createPoint3D', () => {
      it('should create a 3D point', () => {
        const point = createPoint3D(10, 20, 30);
        expect(point).toEqual({ x: 10, y: 20, z: 30 });
      });
    });

    describe('distance', () => {
      it('should calculate distance between two points', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 3, y: 4 };
        expect(distance(p1, p2)).toBe(5);
      });

      it('should return 0 for same point', () => {
        const p = { x: 5, y: 5 };
        expect(distance(p, p)).toBe(0);
      });

      it('should handle negative coordinates', () => {
        const p1 = { x: -3, y: -4 };
        const p2 = { x: 0, y: 0 };
        expect(distance(p1, p2)).toBe(5);
      });

      it('should calculate horizontal distance', () => {
        const p1 = { x: 0, y: 5 };
        const p2 = { x: 10, y: 5 };
        expect(distance(p1, p2)).toBe(10);
      });

      it('should calculate vertical distance', () => {
        const p1 = { x: 5, y: 0 };
        const p2 = { x: 5, y: 10 };
        expect(distance(p1, p2)).toBe(10);
      });
    });

    describe('distance3D', () => {
      it('should calculate 3D distance', () => {
        const p1 = { x: 0, y: 0, z: 0 };
        const p2 = { x: 1, y: 2, z: 2 };
        expect(distance3D(p1, p2)).toBe(3);
      });
    });

    describe('midpoint', () => {
      it('should calculate midpoint', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 10, y: 10 };
        expect(midpoint(p1, p2)).toEqual({ x: 5, y: 5 });
      });

      it('should handle negative coordinates', () => {
        const p1 = { x: -10, y: -10 };
        const p2 = { x: 10, y: 10 };
        expect(midpoint(p1, p2)).toEqual({ x: 0, y: 0 });
      });
    });

    describe('addPoints', () => {
      it('should add two points', () => {
        const p1 = { x: 3, y: 4 };
        const p2 = { x: 2, y: 1 };
        expect(addPoints(p1, p2)).toEqual({ x: 5, y: 5 });
      });
    });

    describe('subtractPoints', () => {
      it('should subtract two points', () => {
        const p1 = { x: 5, y: 5 };
        const p2 = { x: 2, y: 1 };
        expect(subtractPoints(p1, p2)).toEqual({ x: 3, y: 4 });
      });
    });

    describe('scalePoint', () => {
      it('should scale a point', () => {
        const p = { x: 3, y: 4 };
        expect(scalePoint(p, 2)).toEqual({ x: 6, y: 8 });
      });

      it('should handle negative scale', () => {
        const p = { x: 3, y: 4 };
        expect(scalePoint(p, -1)).toEqual({ x: -3, y: -4 });
      });
    });

    describe('rotatePoint', () => {
      it('should rotate point 90 degrees', () => {
        const p = { x: 1, y: 0 };
        const center = { x: 0, y: 0 };
        const result = rotatePoint(p, center, Math.PI / 2);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(1);
      });

      it('should rotate point 180 degrees', () => {
        const p = { x: 1, y: 0 };
        const center = { x: 0, y: 0 };
        const result = rotatePoint(p, center, Math.PI);
        expect(result.x).toBeCloseTo(-1);
        expect(result.y).toBeCloseTo(0);
      });

      it('should rotate around non-origin center', () => {
        const p = { x: 2, y: 1 };
        const center = { x: 1, y: 1 };
        const result = rotatePoint(p, center, Math.PI / 2);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(2);
      });
    });

    describe('normalizeAngle', () => {
      it('should normalize positive angle', () => {
        expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
      });

      it('should normalize negative angle', () => {
        expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(3 * Math.PI / 2);
      });

      it('should keep angle in range', () => {
        expect(normalizeAngle(Math.PI / 4)).toBeCloseTo(Math.PI / 4);
      });
    });

    describe('angleBetweenPoints', () => {
      it('should calculate angle for horizontal line', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 1, y: 0 };
        expect(angleBetweenPoints(p1, p2)).toBeCloseTo(0);
      });

      it('should calculate angle for vertical line', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 0, y: 1 };
        expect(angleBetweenPoints(p1, p2)).toBeCloseTo(Math.PI / 2);
      });

      it('should calculate 45 degree angle', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 1, y: 1 };
        expect(angleBetweenPoints(p1, p2)).toBeCloseTo(Math.PI / 4);
      });
    });

    describe('polarToCartesian', () => {
      it('should convert polar to cartesian', () => {
        const center = { x: 0, y: 0 };
        const result = polarToCartesian(center, 1, 0);
        expect(result.x).toBeCloseTo(1);
        expect(result.y).toBeCloseTo(0);
      });

      it('should handle 90 degree angle', () => {
        const center = { x: 0, y: 0 };
        const result = polarToCartesian(center, 1, Math.PI / 2);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(1);
      });
    });
  });

  // ==========================================
  // Line Operations
  // ==========================================
  describe('Line Operations', () => {
    describe('lineLength', () => {
      it('should calculate line length', () => {
        const line = {
          id: '1',
          type: 'line' as const,
          layerId: 'layer-0',
          visible: true,
          locked: false,
          style: { strokeColor: '#000', strokeWidth: 1, opacity: 1, lineType: 'continuous' as const },
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 3, y: 4 },
        };
        expect(lineLength(line)).toBe(5);
      });
    });

    describe('pointOnLine', () => {
      it('should find point at start (t=0)', () => {
        const start = { x: 0, y: 0 };
        const end = { x: 10, y: 10 };
        expect(pointOnLine(start, end, 0)).toEqual({ x: 0, y: 0 });
      });

      it('should find point at end (t=1)', () => {
        const start = { x: 0, y: 0 };
        const end = { x: 10, y: 10 };
        expect(pointOnLine(start, end, 1)).toEqual({ x: 10, y: 10 });
      });

      it('should find midpoint (t=0.5)', () => {
        const start = { x: 0, y: 0 };
        const end = { x: 10, y: 10 };
        expect(pointOnLine(start, end, 0.5)).toEqual({ x: 5, y: 5 });
      });
    });

    describe('distanceToLine', () => {
      it('should calculate perpendicular distance', () => {
        const point = { x: 0, y: 5 };
        const lineStart = { x: 0, y: 0 };
        const lineEnd = { x: 10, y: 0 };
        expect(distanceToLine(point, lineStart, lineEnd)).toBe(5);
      });

      it('should return distance to endpoint when beyond segment', () => {
        const point = { x: 15, y: 0 };
        const lineStart = { x: 0, y: 0 };
        const lineEnd = { x: 10, y: 0 };
        expect(distanceToLine(point, lineStart, lineEnd)).toBe(5);
      });
    });

    describe('lineIntersection', () => {
      it('should find intersection of crossing lines', () => {
        const result = lineIntersection(
          { x: 0, y: 0 }, { x: 10, y: 10 },
          { x: 0, y: 10 }, { x: 10, y: 0 }
        );
        expect(result).not.toBeNull();
        expect(result!.x).toBeCloseTo(5);
        expect(result!.y).toBeCloseTo(5);
      });

      it('should return null for parallel lines', () => {
        const result = lineIntersection(
          { x: 0, y: 0 }, { x: 10, y: 0 },
          { x: 0, y: 5 }, { x: 10, y: 5 }
        );
        expect(result).toBeNull();
      });

      it('should return null for non-intersecting segments', () => {
        const result = lineIntersection(
          { x: 0, y: 0 }, { x: 1, y: 1 },
          { x: 5, y: 0 }, { x: 5, y: -5 }
        );
        expect(result).toBeNull();
      });
    });

    describe('perpendicularPoint', () => {
      it('should find perpendicular point on horizontal line', () => {
        const lineStart = { x: 0, y: 0 };
        const lineEnd = { x: 10, y: 0 };
        const point = { x: 5, y: 5 };
        const result = perpendicularPoint(lineStart, lineEnd, point);
        expect(result.x).toBeCloseTo(5);
        expect(result.y).toBeCloseTo(0);
      });
    });
  });

  // ==========================================
  // Circle Operations
  // ==========================================
  describe('Circle Operations', () => {
    describe('circleArea', () => {
      it('should calculate circle area', () => {
        expect(circleArea(1)).toBeCloseTo(Math.PI);
        expect(circleArea(2)).toBeCloseTo(4 * Math.PI);
      });
    });

    describe('circleCircumference', () => {
      it('should calculate circumference', () => {
        expect(circleCircumference(1)).toBeCloseTo(2 * Math.PI);
        expect(circleCircumference(5)).toBeCloseTo(10 * Math.PI);
      });
    });

    describe('circleLineIntersection', () => {
      it('should find two intersection points', () => {
        const center = { x: 0, y: 0 };
        const radius = 5;
        const lineStart = { x: -10, y: 0 };
        const lineEnd = { x: 10, y: 0 };
        const result = circleLineIntersection(center, radius, lineStart, lineEnd);
        expect(result.length).toBe(2);
        expect(result.some(p => p.x === -5 && p.y === 0)).toBe(true);
        expect(result.some(p => p.x === 5 && p.y === 0)).toBe(true);
      });

      it('should return empty for non-intersecting', () => {
        const center = { x: 0, y: 0 };
        const radius = 5;
        const lineStart = { x: 10, y: 10 };
        const lineEnd = { x: 20, y: 10 };
        const result = circleLineIntersection(center, radius, lineStart, lineEnd);
        expect(result.length).toBe(0);
      });
    });

    describe('circleCircleIntersection', () => {
      it('should find intersection points of overlapping circles', () => {
        const result = circleCircleIntersection(
          { x: 0, y: 0 }, 5,
          { x: 6, y: 0 }, 5
        );
        expect(result.length).toBe(2);
      });

      it('should return empty for non-overlapping circles', () => {
        const result = circleCircleIntersection(
          { x: 0, y: 0 }, 2,
          { x: 10, y: 0 }, 2
        );
        expect(result.length).toBe(0);
      });

      it('should return empty for concentric circles', () => {
        const result = circleCircleIntersection(
          { x: 0, y: 0 }, 5,
          { x: 0, y: 0 }, 3
        );
        expect(result.length).toBe(0);
      });
    });
  });

  // ==========================================
  // Polygon Operations
  // ==========================================
  describe('Polygon Operations', () => {
    describe('polygonArea', () => {
      it('should calculate area of square', () => {
        const square = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ];
        expect(polygonArea(square)).toBe(100);
      });

      it('should calculate area of triangle', () => {
        const triangle = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 10 },
        ];
        expect(polygonArea(triangle)).toBe(50);
      });
    });

    describe('polygonPerimeter', () => {
      it('should calculate perimeter of square', () => {
        const square = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ];
        expect(polygonPerimeter(square)).toBe(40);
      });
    });

    describe('polygonCentroid', () => {
      it('should find centroid of square', () => {
        const square = [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
        ];
        const centroid = polygonCentroid(square);
        expect(centroid.x).toBeCloseTo(5);
        expect(centroid.y).toBeCloseTo(5);
      });
    });

    describe('isPointInPolygon', () => {
      const square = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      it('should return true for point inside', () => {
        expect(isPointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
      });

      it('should return false for point outside', () => {
        expect(isPointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
      });
    });

    describe('regularPolygonVertices', () => {
      it('should create triangle vertices', () => {
        const vertices = regularPolygonVertices({ x: 0, y: 0 }, 10, 3);
        expect(vertices.length).toBe(3);
      });

      it('should create hexagon vertices', () => {
        const vertices = regularPolygonVertices({ x: 0, y: 0 }, 10, 6);
        expect(vertices.length).toBe(6);
      });
    });
  });

  // ==========================================
  // Bounding Box Operations
  // ==========================================
  describe('Bounding Box Operations', () => {
    describe('createBoundingBox', () => {
      it('should create bounding box from points', () => {
        const points = [
          { x: 0, y: 0 },
          { x: 10, y: 5 },
          { x: 5, y: 10 },
        ];
        const bbox = createBoundingBox(points);
        expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
      });

      it('should handle empty array', () => {
        const bbox = createBoundingBox([]);
        expect(bbox).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
      });
    });

    describe('expandBoundingBox', () => {
      it('should expand bounding box', () => {
        const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
        const expanded = expandBoundingBox(bbox, 5);
        expect(expanded).toEqual({ minX: -5, minY: -5, maxX: 15, maxY: 15 });
      });
    });

    describe('mergeBoundingBoxes', () => {
      it('should merge multiple bounding boxes', () => {
        const boxes = [
          { minX: 0, minY: 0, maxX: 5, maxY: 5 },
          { minX: 3, minY: 3, maxX: 10, maxY: 10 },
        ];
        const merged = mergeBoundingBoxes(boxes);
        expect(merged).toEqual({ minX: 0, minY: 0, maxX: 10, maxY: 10 });
      });
    });

    describe('boundingBoxContainsPoint', () => {
      const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

      it('should return true for point inside', () => {
        expect(boundingBoxContainsPoint(bbox, { x: 5, y: 5 })).toBe(true);
      });

      it('should return false for point outside', () => {
        expect(boundingBoxContainsPoint(bbox, { x: 15, y: 5 })).toBe(false);
      });

      it('should return true for point on edge', () => {
        expect(boundingBoxContainsPoint(bbox, { x: 0, y: 5 })).toBe(true);
      });
    });

    describe('boundingBoxesOverlap', () => {
      it('should detect overlapping boxes', () => {
        const box1 = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
        const box2 = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
        expect(boundingBoxesOverlap(box1, box2)).toBe(true);
      });

      it('should detect non-overlapping boxes', () => {
        const box1 = { minX: 0, minY: 0, maxX: 5, maxY: 5 };
        const box2 = { minX: 10, minY: 10, maxX: 15, maxY: 15 };
        expect(boundingBoxesOverlap(box1, box2)).toBe(false);
      });
    });

    describe('boundingBoxCenter', () => {
      it('should find center of bounding box', () => {
        const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
        expect(boundingBoxCenter(bbox)).toEqual({ x: 5, y: 5 });
      });
    });

    describe('boundingBoxDimensions', () => {
      it('should calculate dimensions', () => {
        const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 20 };
        expect(boundingBoxDimensions(bbox)).toEqual({ width: 10, height: 20 });
      });
    });
  });

  // ==========================================
  // Unit Conversion
  // ==========================================
  describe('Unit Conversion', () => {
    describe('convertUnits', () => {
      it('should convert mm to m', () => {
        expect(convertUnits(1000, 'mm', 'm')).toBe(1);
      });

      it('should convert m to mm', () => {
        expect(convertUnits(1, 'm', 'mm')).toBe(1000);
      });

      it('should convert feet to m', () => {
        expect(convertUnits(1, 'feet', 'm')).toBeCloseTo(0.3048);
      });

      it('should convert inches to mm', () => {
        expect(convertUnits(1, 'inches', 'mm')).toBeCloseTo(25.4);
      });
    });
  });

  // ==========================================
  // Coordinate Transformations (PNG)
  // ==========================================
  describe('Coordinate Transformations', () => {
    describe('latLongToUTM', () => {
      it('should convert Port Moresby coordinates', () => {
        // Port Moresby: -9.4438° S, 147.1803° E
        const result = latLongToUTM(-9.4438, 147.1803);
        expect(result.zone).toBe(55);
        expect(result.easting).toBeGreaterThan(500000);
        expect(result.northing).toBeGreaterThan(0);
      });

      it('should convert Lae coordinates', () => {
        // Lae: -6.7310° S, 147.0000° E
        const result = latLongToUTM(-6.7310, 147.0000);
        expect(result.zone).toBe(55);
      });

      it('should handle Mount Hagen (highlands)', () => {
        // Mount Hagen: -5.8600° S, 144.2300° E
        // UTM Zone 55 covers 144°E to 150°E
        const result = latLongToUTM(-5.8600, 144.2300);
        expect(result.zone).toBe(55);
      });
    });
  });
});
