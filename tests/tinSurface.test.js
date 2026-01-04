/**
 * TIN Surface and Contour Generation Tests
 */

import { describe, it, expect } from 'vitest';
import {
    createTINSurface,
    generateContours,
    parseCSVSurveyPoints,
    interpolateElevationOnTIN,
    calculateSlopeAtPoint,
    contoursToEntities,
    tinToEntities,
} from '../src/png/tinSurface.js';

// ============================================
// Test Data
// ============================================

const simpleSurveyPoints = [
    { x: 0, y: 0, z: 10 },
    { x: 100, y: 0, z: 10 },
    { x: 100, y: 100, z: 10 },
    { x: 0, y: 100, z: 10 },
];

const slopedSurveyPoints = [
    { x: 0, y: 0, z: 0 },
    { x: 100, y: 0, z: 0 },
    { x: 100, y: 100, z: 10 },
    { x: 0, y: 100, z: 10 },
];

const hillSurveyPoints = [
    // Outer ring at elevation 0
    { x: 0, y: 0, z: 0 },
    { x: 100, y: 0, z: 0 },
    { x: 100, y: 100, z: 0 },
    { x: 0, y: 100, z: 0 },
    // Peak in center
    { x: 50, y: 50, z: 20 },
];

const realWorldPoints = [
    // Simulates a typical survey point set
    { x: 1000, y: 1000, z: 100 },
    { x: 1020, y: 1000, z: 102 },
    { x: 1040, y: 1000, z: 105 },
    { x: 1000, y: 1020, z: 101 },
    { x: 1020, y: 1020, z: 103 },
    { x: 1040, y: 1020, z: 106 },
    { x: 1000, y: 1040, z: 102 },
    { x: 1020, y: 1040, z: 104 },
    { x: 1040, y: 1040, z: 108 },
];

// ============================================
// createTINSurface Tests
// ============================================

describe('createTINSurface', () => {
    it('should create a TIN from simple points', () => {
        const tin = createTINSurface(simpleSurveyPoints);

        expect(tin).toBeDefined();
        expect(tin.type).toBe('TINSurface');
        expect(tin.pointCount).toBe(4);
        expect(tin.triangleCount).toBeGreaterThanOrEqual(2);
    });

    it('should create valid triangles', () => {
        const tin = createTINSurface(hillSurveyPoints);

        expect(tin.triangles).toBeDefined();
        expect(tin.triangles.length).toBeGreaterThan(0);

        // Each triangle should have 3 vertices
        for (const triangle of tin.triangles) {
            expect(triangle.vertices).toHaveLength(3);
            expect(triangle.vertices[0]).toHaveProperty('x');
            expect(triangle.vertices[0]).toHaveProperty('y');
            expect(triangle.vertices[0]).toHaveProperty('z');
        }
    });

    it('should calculate correct statistics', () => {
        const tin = createTINSurface(hillSurveyPoints);

        expect(tin.statistics.minElevation).toBe(0);
        expect(tin.statistics.maxElevation).toBe(20);
        expect(tin.statistics.elevationRange).toBe(20);
        expect(tin.statistics.avgElevation).toBe(4); // (0+0+0+0+20)/5
    });

    it('should calculate correct bounds', () => {
        const tin = createTINSurface(realWorldPoints);

        expect(tin.bounds.minX).toBe(1000);
        expect(tin.bounds.maxX).toBe(1040);
        expect(tin.bounds.minY).toBe(1000);
        expect(tin.bounds.maxY).toBe(1040);
        expect(tin.bounds.minZ).toBe(100);
        expect(tin.bounds.maxZ).toBe(108);
    });

    it('should throw error for insufficient points', () => {
        expect(() => createTINSurface([{ x: 0, y: 0, z: 0 }])).toThrow();
        expect(() => createTINSurface([])).toThrow();
        expect(() => createTINSurface(null)).toThrow();
    });

    it('should filter invalid points', () => {
        const mixedPoints = [
            { x: 0, y: 0, z: 0 },
            { x: 'invalid', y: 50, z: 5 },
            { x: 100, y: 0, z: 0 },
            { x: 100, y: 100, z: 10 },
            { x: NaN, y: 50, z: 5 },
        ];

        const tin = createTINSurface(mixedPoints);
        expect(tin.pointCount).toBe(3); // Only valid points
    });
});

// ============================================
// generateContours Tests
// ============================================

describe('generateContours', () => {
    it('should generate contours for a hill', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const result = generateContours(tin, { interval: 5 });

        expect(result.contours).toBeDefined();
        expect(result.contourCount).toBeGreaterThan(0);
        expect(result.interval).toBe(5);
    });

    it('should auto-calculate interval', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const result = generateContours(tin); // No interval specified

        expect(result.interval).toBeDefined();
        expect(result.interval).toBeGreaterThan(0);
    });

    it('should mark major contours', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const result = generateContours(tin, { interval: 2, majorInterval: 5 });

        const majorContours = result.contours.filter(c => c.isMajor);
        const minorContours = result.contours.filter(c => !c.isMajor);

        // Should have both major and minor contours
        expect(majorContours.length + minorContours.length).toBe(result.contourCount);
    });

    it('should have correct elevation values', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const result = generateContours(tin, { interval: 5 });

        for (const contour of result.contours) {
            expect(contour.elevation).toBeDefined();
            expect(contour.elevation % 5).toBe(0); // Should be multiple of interval
        }
    });

    it('should generate contour polylines with points', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const result = generateContours(tin, { interval: 5 });

        for (const contour of result.contours) {
            expect(contour.points).toBeDefined();
            expect(contour.points.length).toBeGreaterThanOrEqual(2);

            // Each point should have x, y coordinates
            for (const point of contour.points) {
                expect(typeof point.x).toBe('number');
                expect(typeof point.y).toBe('number');
            }
        }
    });

    it('should return empty contours for flat surface', () => {
        const tin = createTINSurface(simpleSurveyPoints); // All at z=10
        const result = generateContours(tin, {
            interval: 1,
            minElevation: 0,
            maxElevation: 9
        });

        // No contours between 0-9 since surface is at z=10
        expect(result.contours.length).toBe(0);
    });
});

// ============================================
// parseCSVSurveyPoints Tests
// ============================================

describe('parseCSVSurveyPoints', () => {
    it('should parse simple CSV', () => {
        const csv = `x,y,z
0,0,10
100,0,15
50,50,20`;

        const result = parseCSVSurveyPoints(csv);

        expect(result.pointCount).toBe(3);
        expect(result.errorCount).toBe(0);
        expect(result.points[0]).toEqual({ x: 0, y: 0, z: 10, sourceRow: 2 });
        expect(result.points[2]).toEqual({ x: 50, y: 50, z: 20, sourceRow: 4 });
    });

    it('should handle Easting/Northing/Elevation headers', () => {
        const csv = `Easting,Northing,Elevation
1000,2000,100
1010,2010,105`;

        const result = parseCSVSurveyPoints(csv);

        expect(result.pointCount).toBe(2);
        expect(result.columns.x).toBe(0); // Easting
        expect(result.columns.y).toBe(1); // Northing
        expect(result.columns.z).toBe(2); // Elevation
    });

    it('should handle RL (Reduced Level) column', () => {
        const csv = `E,N,RL
1000,2000,100`;

        const result = parseCSVSurveyPoints(csv);

        expect(result.pointCount).toBe(1);
        expect(result.columns.z).toBe(2);
    });

    it('should skip rows with invalid values', () => {
        const csv = `x,y,z
0,0,10
invalid,50,20
100,100,30`;

        const result = parseCSVSurveyPoints(csv);

        expect(result.pointCount).toBe(2);
        expect(result.errorCount).toBe(1);
        expect(result.errors[0].row).toBe(3);
    });

    it('should handle CSV without header', () => {
        const csv = `0,0,10
100,0,15
50,50,20`;

        const result = parseCSVSurveyPoints(csv, { hasHeader: false });

        expect(result.pointCount).toBe(3);
        expect(result.points[0]).toEqual({ x: 0, y: 0, z: 10, sourceRow: 1 });
    });

    it('should handle different delimiters', () => {
        const csv = `x;y;z
0;0;10
100;100;20`;

        const result = parseCSVSurveyPoints(csv, { delimiter: ';' });

        expect(result.pointCount).toBe(2);
    });

    it('should handle empty lines', () => {
        const csv = `x,y,z
0,0,10

100,100,20
`;

        const result = parseCSVSurveyPoints(csv);

        expect(result.pointCount).toBe(2);
    });
});

// ============================================
// interpolateElevationOnTIN Tests
// ============================================

describe('interpolateElevationOnTIN', () => {
    it('should return exact elevation at vertex', () => {
        const tin = createTINSurface(hillSurveyPoints);

        // Test center point (should be very close to 20)
        const centerZ = interpolateElevationOnTIN(tin, 50, 50);
        expect(centerZ).toBeCloseTo(20, 0);
    });

    it('should interpolate between vertices', () => {
        const tin = createTINSurface(slopedSurveyPoints);

        // Midpoint of sloped surface
        const midZ = interpolateElevationOnTIN(tin, 50, 50);
        expect(midZ).toBeCloseTo(5, 1); // Should be around 5
    });

    it('should return null for points outside surface', () => {
        const tin = createTINSurface(simpleSurveyPoints);

        const outsideZ = interpolateElevationOnTIN(tin, 500, 500);
        expect(outsideZ).toBeNull();
    });

    it('should work on real-world coordinates', () => {
        const tin = createTINSurface(realWorldPoints);

        const centerZ = interpolateElevationOnTIN(tin, 1020, 1020);
        expect(centerZ).toBeCloseTo(103, 1);
    });
});

// ============================================
// calculateSlopeAtPoint Tests
// ============================================

describe('calculateSlopeAtPoint', () => {
    it('should return zero slope for flat surface', () => {
        const tin = createTINSurface(simpleSurveyPoints);

        const slope = calculateSlopeAtPoint(tin, 50, 50);
        expect(slope).not.toBeNull();
        expect(slope.slopeDegrees).toBeCloseTo(0, 1);
    });

    it('should calculate slope for sloped surface', () => {
        const tin = createTINSurface(slopedSurveyPoints);

        const slope = calculateSlopeAtPoint(tin, 50, 50);
        expect(slope).not.toBeNull();
        expect(slope.slopeDegrees).toBeGreaterThan(0);
        expect(slope.slopePercent).toBeGreaterThan(0);
    });

    it('should return aspect direction', () => {
        const tin = createTINSurface(slopedSurveyPoints);

        const slope = calculateSlopeAtPoint(tin, 50, 50);
        expect(slope).not.toBeNull();
        expect(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']).toContain(slope.aspectDirection);
    });

    it('should return null for points outside surface', () => {
        const tin = createTINSurface(simpleSurveyPoints);

        const slope = calculateSlopeAtPoint(tin, 500, 500);
        expect(slope).toBeNull();
    });
});

// ============================================
// Entity Conversion Tests
// ============================================

describe('contoursToEntities', () => {
    it('should convert contours to polyline entities', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const contourData = generateContours(tin, { interval: 5 });
        const entities = contoursToEntities(contourData);

        expect(entities.length).toBe(contourData.contourCount);

        for (const entity of entities) {
            expect(entity.type).toBe('polyline');
            expect(entity.metadata.entityType).toBe('contour');
            expect(entity.metadata.elevation).toBeDefined();
        }
    });

    it('should apply different styles for major/minor contours', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const contourData = generateContours(tin, { interval: 2 });
        const entities = contoursToEntities(contourData, {
            majorColor: '#ff0000',
            minorColor: '#00ff00',
        });

        const majorEntity = entities.find(e => e.metadata.isMajor);
        const minorEntity = entities.find(e => !e.metadata.isMajor);

        if (majorEntity) {
            expect(majorEntity.style.strokeColor).toBe('#ff0000');
        }
        if (minorEntity) {
            expect(minorEntity.style.strokeColor).toBe('#00ff00');
        }
    });
});

describe('tinToEntities', () => {
    it('should convert TIN to polygon entities', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const entities = tinToEntities(tin);

        expect(entities.length).toBe(tin.triangleCount);

        for (const entity of entities) {
            expect(entity.type).toBe('polygon');
            expect(entity.points).toHaveLength(3);
            expect(entity.metadata.entityType).toBe('tin-triangle');
        }
    });

    it('should return empty array when showTriangles is false', () => {
        const tin = createTINSurface(hillSurveyPoints);
        const entities = tinToEntities(tin, { showTriangles: false });

        expect(entities).toHaveLength(0);
    });
});

// ============================================
// Integration Tests
// ============================================

describe('Full Workflow Integration', () => {
    it('should handle complete workflow: CSV → TIN → Contours → Entities', () => {
        // 1. Parse CSV
        const csv = `x,y,z
0,0,0
100,0,0
100,100,10
0,100,10
50,50,15`;

        const parsed = parseCSVSurveyPoints(csv);
        expect(parsed.pointCount).toBe(5);

        // 2. Create TIN
        const tin = createTINSurface(parsed.points);
        expect(tin.triangleCount).toBeGreaterThan(0);

        // 3. Generate contours
        const contourData = generateContours(tin, { interval: 2 });
        expect(contourData.contourCount).toBeGreaterThan(0);

        // 4. Convert to entities
        const contourEntities = contoursToEntities(contourData);
        const tinEntities = tinToEntities(tin);

        expect(contourEntities.length).toBeGreaterThan(0);
        expect(tinEntities.length).toBeGreaterThan(0);

        // Verify total entity structure
        const allEntities = [...tinEntities, ...contourEntities];
        for (const entity of allEntities) {
            expect(entity.id).toBeDefined();
            expect(entity.type).toBeDefined();
            expect(entity.points).toBeDefined();
        }
    });
});
