/**
 * Hatch Pattern Tests
 * Tests for CAD hatch pattern functionality
 */

import { describe, it, expect } from 'vitest';
import {
  HATCH_PATTERNS,
  createHatch,
  createHatchFromEntity,
  generateHatchLines,
  listHatchPatterns,
} from '../src/core/hatch.js';

describe('Hatch Patterns', () => {
  describe('HATCH_PATTERNS', () => {
    it('has solid pattern', () => {
      expect(HATCH_PATTERNS.solid).toBeDefined();
      expect(HATCH_PATTERNS.solid.type).toBe('solid');
    });

    it('has line patterns', () => {
      expect(HATCH_PATTERNS.horizontal).toBeDefined();
      expect(HATCH_PATTERNS.horizontal.type).toBe('lines');
      expect(HATCH_PATTERNS.horizontal.angle).toBe(0);

      expect(HATCH_PATTERNS.vertical).toBeDefined();
      expect(HATCH_PATTERNS.vertical.angle).toBe(90);

      expect(HATCH_PATTERNS.diagonal45).toBeDefined();
      expect(HATCH_PATTERNS.diagonal45.angle).toBe(45);
    });

    it('has crosshatch patterns', () => {
      expect(HATCH_PATTERNS.crosshatch).toBeDefined();
      expect(HATCH_PATTERNS.crosshatch.type).toBe('crosshatch');

      expect(HATCH_PATTERNS.diagonalCross).toBeDefined();
    });

    it('has civil engineering patterns', () => {
      expect(HATCH_PATTERNS.concrete).toBeDefined();
      expect(HATCH_PATTERNS.brick).toBeDefined();
      expect(HATCH_PATTERNS.stone).toBeDefined();
      expect(HATCH_PATTERNS.earth).toBeDefined();
      expect(HATCH_PATTERNS.gravel).toBeDefined();
      expect(HATCH_PATTERNS.sand).toBeDefined();
      expect(HATCH_PATTERNS.water).toBeDefined();
      expect(HATCH_PATTERNS.grass).toBeDefined();
      expect(HATCH_PATTERNS.insulation).toBeDefined();
      expect(HATCH_PATTERNS.steel).toBeDefined();
      expect(HATCH_PATTERNS.wood).toBeDefined();
    });

    it('each pattern has name and description', () => {
      Object.values(HATCH_PATTERNS).forEach(pattern => {
        expect(pattern.name).toBeDefined();
        expect(pattern.description).toBeDefined();
      });
    });
  });
});

describe('Hatch Creation', () => {
  describe('createHatch', () => {
    const squareBoundary = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    it('creates a hatch entity with boundary', () => {
      const hatch = createHatch(squareBoundary);

      expect(hatch.type).toBe('hatch');
      expect(hatch.boundary).toEqual(squareBoundary);
      expect(hatch.id).toBeDefined();
    });

    it('uses default diagonal45 pattern', () => {
      const hatch = createHatch(squareBoundary);

      expect(hatch.patternName).toBe('diagonal45');
    });

    it('accepts custom pattern', () => {
      const hatch = createHatch(squareBoundary, 'brick');

      expect(hatch.patternName).toBe('brick');
      expect(hatch.pattern.type).toBe('brick');
    });

    it('falls back to diagonal45 for unknown pattern', () => {
      const hatch = createHatch(squareBoundary, 'unknown-pattern');

      expect(hatch.pattern.type).toBe('lines');
      expect(hatch.pattern.angle).toBe(45);
    });

    it('accepts custom options', () => {
      const hatch = createHatch(squareBoundary, 'solid', {
        color: '#FF0000',
        fillColor: '#0000FF',
        opacity: 0.5,
        scale: 2,
        rotation: 30,
        layerId: 'custom-layer',
      });

      expect(hatch.style.strokeColor).toBe('#FF0000');
      expect(hatch.style.fillColor).toBe('#0000FF');
      expect(hatch.style.opacity).toBe(0.5);
      expect(hatch.scale).toBe(2);
      expect(hatch.rotation).toBe(30);
      expect(hatch.layerId).toBe('custom-layer');
    });

    it('accepts pattern overrides', () => {
      const hatch = createHatch(squareBoundary, 'horizontal', {
        patternOverrides: { spacing: 10, angle: 15 },
      });

      expect(hatch.pattern.spacing).toBe(10);
      expect(hatch.pattern.angle).toBe(15);
    });
  });

  describe('createHatchFromEntity', () => {
    it('creates hatch from rectangle entity', () => {
      const rect = {
        type: 'rectangle',
        topLeft: { x: 0, y: 0 },
        width: 100,
        height: 50,
      };
      const hatch = createHatchFromEntity(rect);

      expect(hatch.type).toBe('hatch');
      expect(hatch.boundary.length).toBe(4);
    });

    it('creates hatch from closed polyline', () => {
      const polyline = {
        type: 'polyline',
        closed: true,
        points: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 50, y: 100 },
        ],
      };
      const hatch = createHatchFromEntity(polyline);

      expect(hatch.type).toBe('hatch');
      expect(hatch.boundary.length).toBe(3);
    });

    it('throws for open polyline', () => {
      const polyline = {
        type: 'polyline',
        closed: false,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      };

      expect(() => createHatchFromEntity(polyline)).toThrow('Polyline must be closed');
    });

    it('creates hatch from circle', () => {
      const circle = {
        type: 'circle',
        center: { x: 50, y: 50 },
        radius: 25,
      };
      const hatch = createHatchFromEntity(circle);

      expect(hatch.type).toBe('hatch');
      expect(hatch.boundary.length).toBe(32); // Approximated with 32 segments
    });

    it('throws for unsupported entity type', () => {
      const line = { type: 'line' };

      expect(() => createHatchFromEntity(line)).toThrow('Cannot create hatch');
    });

    it('applies pattern and options', () => {
      const rect = {
        type: 'rectangle',
        topLeft: { x: 0, y: 0 },
        width: 100,
        height: 50,
      };
      const hatch = createHatchFromEntity(rect, 'concrete', { scale: 2 });

      expect(hatch.patternName).toBe('concrete');
      expect(hatch.scale).toBe(2);
    });
  });
});

describe('Hatch Line Generation', () => {
  const squareBoundary = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];

  describe('generateHatchLines', () => {
    it('generates solid type for solid pattern', () => {
      const hatch = createHatch(squareBoundary, 'solid');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('solid');
      expect(result.boundary).toBeDefined();
    });

    it('generates lines for line patterns', () => {
      const hatch = createHatch(squareBoundary, 'horizontal');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('lines');
      expect(result.lines).toBeDefined();
      expect(result.lines.length).toBeGreaterThan(0);
    });

    it('generates lines for crosshatch patterns', () => {
      const hatch = createHatch(squareBoundary, 'crosshatch');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('lines');
      expect(result.lines.length).toBeGreaterThan(0);
    });

    it('generates dots for dot patterns', () => {
      const hatch = createHatch(squareBoundary, 'concrete');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('dots');
      expect(result.dots).toBeDefined();
    });

    it('generates circles for gravel pattern', () => {
      const hatch = createHatch(squareBoundary, 'gravel');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('circles');
      expect(result.circles).toBeDefined();
    });

    it('generates lines for brick pattern', () => {
      const hatch = createHatch(squareBoundary, 'brick');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('lines');
    });

    it('generates polylines for wave pattern', () => {
      const hatch = createHatch(squareBoundary, 'water');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('polylines');
      expect(result.polylines).toBeDefined();
    });

    it('generates strokes for grass pattern', () => {
      const hatch = createHatch(squareBoundary, 'grass');
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('strokes');
      expect(result.strokes).toBeDefined();
    });

    it('respects scale option', () => {
      const hatch1 = createHatch(squareBoundary, 'horizontal', { scale: 1 });
      const hatch2 = createHatch(squareBoundary, 'horizontal', { scale: 2 });

      const result1 = generateHatchLines(hatch1);
      const result2 = generateHatchLines(hatch2);

      // With larger scale, fewer lines should be generated
      expect(result2.lines.length).toBeLessThan(result1.lines.length);
    });

    it('respects rotation option', () => {
      const hatch = createHatch(squareBoundary, 'horizontal', { rotation: 45 });
      const result = generateHatchLines(hatch);

      expect(result.type).toBe('lines');
      // Lines should be at 45 degrees instead of horizontal
    });
  });
});

describe('Pattern List', () => {
  describe('listHatchPatterns', () => {
    it('returns array of pattern info', () => {
      const patterns = listHatchPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('each pattern has id, name, and description', () => {
      const patterns = listHatchPatterns();

      patterns.forEach(pattern => {
        expect(pattern.id).toBeDefined();
        expect(pattern.name).toBeDefined();
        expect(pattern.description).toBeDefined();
      });
    });

    it('includes all defined patterns', () => {
      const patterns = listHatchPatterns();
      const patternIds = patterns.map(p => p.id);

      expect(patternIds).toContain('solid');
      expect(patternIds).toContain('horizontal');
      expect(patternIds).toContain('concrete');
      expect(patternIds).toContain('brick');
    });
  });
});
