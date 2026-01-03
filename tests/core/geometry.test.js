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
} from '../../src/core/geometry.js';

describe('Geometry Module', () => {
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
    });

    describe('rotatePoint', () => {
      it('should rotate point 90 degrees', () => {
        const p = { x: 1, y: 0 };
        const center = { x: 0, y: 0 };
        const result = rotatePoint(p, center, Math.PI / 2);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(1);
      });
    });
  });

  describe('Line Operations', () => {
    describe('lineLength', () => {
      it('should calculate line length', () => {
        const line = {
          id: '1',
          type: 'line',
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 3, y: 4 },
        };
        expect(lineLength(line)).toBe(5);
      });
    });

    describe('lineIntersection', () => {
      it('should find intersection of crossing lines', () => {
        const result = lineIntersection(
          { x: 0, y: 0 }, { x: 10, y: 10 },
          { x: 0, y: 10 }, { x: 10, y: 0 }
        );
        expect(result).not.toBeNull();
        expect(result.x).toBeCloseTo(5);
        expect(result.y).toBeCloseTo(5);
      });

      it('should return null for parallel lines', () => {
        const result = lineIntersection(
          { x: 0, y: 0 }, { x: 10, y: 0 },
          { x: 0, y: 5 }, { x: 10, y: 5 }
        );
        expect(result).toBeNull();
      });
    });
  });

  describe('Circle Operations', () => {
    describe('circleArea', () => {
      it('should calculate circle area', () => {
        expect(circleArea(1)).toBeCloseTo(Math.PI);
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
    });
  });

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
  });

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
    });

    describe('boundingBoxContainsPoint', () => {
      const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

      it('should return true for point inside', () => {
        expect(boundingBoxContainsPoint(bbox, { x: 5, y: 5 })).toBe(true);
      });

      it('should return false for point outside', () => {
        expect(boundingBoxContainsPoint(bbox, { x: 15, y: 5 })).toBe(false);
      });
    });
  });

  describe('Unit Conversion', () => {
    describe('convertUnits', () => {
      it('should convert mm to m', () => {
        expect(convertUnits(1000, 'mm', 'm')).toBe(1);
      });

      it('should convert m to mm', () => {
        expect(convertUnits(1, 'm', 'mm')).toBe(1000);
      });
    });
  });

  describe('Coordinate Transformations', () => {
    describe('latLongToUTM', () => {
      it('should convert Port Moresby coordinates', () => {
        const result = latLongToUTM(-9.4438, 147.1803);
        expect(result.zone).toBe(55);
        expect(result.easting).toBeGreaterThan(500000);
      });
    });
  });
});
