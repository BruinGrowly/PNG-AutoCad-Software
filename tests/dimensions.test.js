/**
 * Dimension Tests
 * Tests for CAD dimension and measurement functionality
 */

import { describe, it, expect } from 'vitest';
import {
  createLinearDimension,
  createHorizontalDimension,
  createVerticalDimension,
  createRadiusDimension,
  createDiameterDimension,
  createAngularDimension,
  createAreaDimension,
  measureDistance,
  measureAngle,
  measurePolygon,
  measureCircle,
  measureRectangle,
  formatDimension,
  formatArea,
  DEFAULT_DIMENSION_STYLE,
} from '../src/core/dimensions.js';

describe('Dimension Creation', () => {
  describe('createLinearDimension', () => {
    it('creates a linear dimension between two points', () => {
      const dim = createLinearDimension(
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      );

      expect(dim.type).toBe('dimension');
      expect(dim.dimensionType).toBe('linear');
      expect(dim.startPoint).toEqual({ x: 0, y: 0 });
      expect(dim.endPoint).toEqual({ x: 100, y: 0 });
      expect(dim.measuredValue).toBe(100);
    });

    it('calculates correct distance for diagonal lines', () => {
      const dim = createLinearDimension(
        { x: 0, y: 0 },
        { x: 3, y: 4 }
      );

      expect(dim.measuredValue).toBe(5);
    });

    it('applies custom offset', () => {
      const dim = createLinearDimension(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        20
      );

      expect(dim.dimLineStart.y).toBe(20);
      expect(dim.dimLineEnd.y).toBe(20);
    });

    it('applies custom styling options', () => {
      const dim = createLinearDimension(
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        10,
        { textHeight: 5, precision: 3, units: 'ft' }
      );

      expect(dim.dimensionStyle.textHeight).toBe(5);
      expect(dim.dimensionStyle.precision).toBe(3);
      expect(dim.dimensionStyle.units).toBe('ft');
    });
  });

  describe('createHorizontalDimension', () => {
    it('creates a horizontal dimension', () => {
      const dim = createHorizontalDimension(
        { x: 0, y: 10 },
        { x: 100, y: 50 }
      );

      expect(dim.dimensionType).toBe('horizontal');
      expect(dim.measuredValue).toBe(100);
    });
  });

  describe('createVerticalDimension', () => {
    it('creates a vertical dimension', () => {
      const dim = createVerticalDimension(
        { x: 10, y: 0 },
        { x: 50, y: 100 }
      );

      expect(dim.dimensionType).toBe('vertical');
      expect(dim.measuredValue).toBe(100);
    });
  });

  describe('createRadiusDimension', () => {
    it('creates a radius dimension for a circle', () => {
      const dim = createRadiusDimension({ x: 50, y: 50 }, 25);

      expect(dim.type).toBe('dimension');
      expect(dim.dimensionType).toBe('radius');
      expect(dim.measuredValue).toBe(25);
      expect(dim.displayText).toContain('R');
    });

    it('applies custom angle for dimension line', () => {
      const dim = createRadiusDimension({ x: 50, y: 50 }, 25, Math.PI / 2);

      expect(dim.angle).toBe(Math.PI / 2);
    });
  });

  describe('createDiameterDimension', () => {
    it('creates a diameter dimension for a circle', () => {
      const dim = createDiameterDimension({ x: 50, y: 50 }, 25);

      expect(dim.dimensionType).toBe('diameter');
      expect(dim.measuredValue).toBe(50);
      expect(dim.displayText).toContain('⌀');
    });
  });

  describe('createAngularDimension', () => {
    it('creates an angular dimension', () => {
      const dim = createAngularDimension({ x: 0, y: 0 }, 0, Math.PI / 2, 20);

      expect(dim.type).toBe('dimension');
      expect(dim.dimensionType).toBe('angular');
      expect(dim.measuredValue).toBeCloseTo(90, 1);
    });

    it('measures 45 degree angle', () => {
      const dim = createAngularDimension({ x: 0, y: 0 }, 0, Math.PI / 4, 20);

      expect(dim.measuredValue).toBeCloseTo(45, 1);
    });
  });

  describe('createAreaDimension', () => {
    it('creates an area dimension for a polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
      const dim = createAreaDimension(polygon);

      expect(dim.type).toBe('dimension');
      expect(dim.dimensionType).toBe('area');
      expect(dim.measuredValue).toBe(10000);
    });

    it('handles triangular areas', () => {
      const triangle = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 50, y: 100 },
      ];
      const dim = createAreaDimension(triangle);

      expect(dim.measuredValue).toBe(5000);
    });
  });
});

describe('Measurement Functions', () => {
  describe('measureDistance', () => {
    it('measures horizontal distance', () => {
      const result = measureDistance({ x: 0, y: 0 }, { x: 100, y: 0 });

      expect(result.distance).toBe(100);
      expect(result.deltaX).toBe(100);
      expect(result.deltaY).toBe(0);
      expect(result.angleDegrees).toBe(0);
    });

    it('measures vertical distance', () => {
      const result = measureDistance({ x: 0, y: 0 }, { x: 0, y: 100 });

      expect(result.distance).toBe(100);
      expect(result.deltaX).toBe(0);
      expect(result.deltaY).toBe(100);
      expect(result.angleDegrees).toBe(90);
    });

    it('measures diagonal distance', () => {
      const result = measureDistance({ x: 0, y: 0 }, { x: 100, y: 100 });

      expect(result.distance).toBeCloseTo(141.42, 1);
      expect(result.angleDegrees).toBe(45);
    });
  });

  describe('measureAngle', () => {
    it('measures right angle (three points)', () => {
      // Vertex at origin, one arm along x-axis, other along y-axis
      const result = measureAngle(
        { x: 100, y: 0 },  // p1 - end of first arm
        { x: 0, y: 0 },    // p2 - vertex
        { x: 0, y: 100 }   // p3 - end of second arm
      );

      expect(result.degrees).toBeCloseTo(90, 1);
    });

    it('measures 45 degree angle', () => {
      const result = measureAngle(
        { x: 100, y: 0 },
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      );

      expect(result.degrees).toBeCloseTo(45, 1);
    });
  });

  describe('measurePolygon', () => {
    it('measures square polygon', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
      const result = measurePolygon(polygon);

      expect(result.area).toBe(10000);
      expect(result.perimeter).toBe(400);
      expect(result.centroid.x).toBe(50);
      expect(result.centroid.y).toBe(50);
    });

    it('calculates centroid correctly for rectangle', () => {
      const polygon = [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 0, y: 100 },
      ];
      const result = measurePolygon(polygon);

      expect(result.centroid.x).toBe(100);
      expect(result.centroid.y).toBe(50);
    });
  });

  describe('measureCircle', () => {
    it('measures circle properties', () => {
      const result = measureCircle(10);

      expect(result.radius).toBe(10);
      expect(result.diameter).toBe(20);
      expect(result.circumference).toBeCloseTo(62.83, 1);
      expect(result.area).toBeCloseTo(314.16, 1);
    });
  });

  describe('measureRectangle', () => {
    it('measures rectangle properties', () => {
      const result = measureRectangle(100, 50);

      expect(result.width).toBe(100);
      expect(result.height).toBe(50);
      expect(result.area).toBe(5000);
      expect(result.perimeter).toBe(300);
      expect(result.diagonal).toBeCloseTo(111.8, 1);
    });
  });
});

describe('Format Functions', () => {
  describe('formatDimension', () => {
    it('formats with default precision', () => {
      const result = formatDimension(123.456789, DEFAULT_DIMENSION_STYLE);
      expect(result).toBe('123.46 m');
    });

    it('formats without units when showUnits is false', () => {
      const result = formatDimension(100, { ...DEFAULT_DIMENSION_STYLE, showUnits: false });
      expect(result).toBe('100.00');
    });

    it('formats different units', () => {
      const result = formatDimension(100, { ...DEFAULT_DIMENSION_STYLE, units: 'mm' });
      expect(result).toBe('100.00 mm');
    });
  });

  describe('formatArea', () => {
    it('formats area with squared units', () => {
      const result = formatArea(10000, DEFAULT_DIMENSION_STYLE);
      expect(result).toBe('10000.00 m²');
    });
  });
});

describe('DEFAULT_DIMENSION_STYLE', () => {
  it('has expected default values', () => {
    expect(DEFAULT_DIMENSION_STYLE.textHeight).toBeDefined();
    expect(DEFAULT_DIMENSION_STYLE.arrowSize).toBeDefined();
    expect(DEFAULT_DIMENSION_STYLE.precision).toBeDefined();
    expect(DEFAULT_DIMENSION_STYLE.units).toBe('m');
  });
});
