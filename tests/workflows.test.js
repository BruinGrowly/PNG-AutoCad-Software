/**
 * Workflow Module Tests
 * Tests for drainage, road, and building workflows
 */

import { describe, it, expect } from 'vitest';
import { designDrainage, RUNOFF_COEFFICIENTS, sizeDrainageStructure } from '../src/png/drainageWorkflow.js';
import { designRoad, ROAD_CLASSES, BATTER_SLOPES } from '../src/png/roadWorkflow.js';
import { getBuildingParameters, SEISMIC_Z, WIND_REGIONS } from '../src/png/buildingWorkflow.js';

// ============================================
// Drainage Workflow Tests
// ============================================

describe('Drainage Workflow', () => {
    describe('RUNOFF_COEFFICIENTS', () => {
        it('has coefficients for common PNG surfaces', () => {
            expect(RUNOFF_COEFFICIENTS['roof-metal']).toBe(0.95);
            expect(RUNOFF_COEFFICIENTS['kunai']).toBe(0.40);
            expect(RUNOFF_COEFFICIENTS['laterite']).toBe(0.75);
            expect(RUNOFF_COEFFICIENTS['village-coastal']).toBe(0.45);
        });

        it('all coefficients are between 0 and 1', () => {
            Object.values(RUNOFF_COEFFICIENTS).forEach(c => {
                expect(c).toBeGreaterThan(0);
                expect(c).toBeLessThanOrEqual(1);
            });
        });
    });

    describe('sizeDrainageStructure', () => {
        it('sizes pipe for small discharge', () => {
            const result = sizeDrainageStructure('pipe', 0.05, 0.01);
            expect(result.type).toBe('pipe');
            expect(result.diameter).toBeGreaterThanOrEqual(300);
            expect(result.diameter).toBeLessThanOrEqual(1200);
        });

        it('sizes channel for moderate discharge', () => {
            const result = sizeDrainageStructure('channel', 0.5, 0.01);
            expect(result.type).toBe('channel');
            expect(result.bottomWidth).toBeGreaterThan(0);
            expect(result.depth).toBeGreaterThan(0);
            expect(result.sideSlope).toBe(1.5);
        });

        it('sizes culvert for large discharge', () => {
            const result = sizeDrainageStructure('culvert', 2.0, 0.01);
            expect(result.type).toBe('culvert');
            expect(result.width).toBeGreaterThan(0);
            expect(result.height).toBeGreaterThan(0);
        });
    });

    describe('designDrainage', () => {
        const testCatchment = [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
        ];

        it('returns error for unknown province', () => {
            const result = designDrainage({
                catchmentBoundary: testCatchment,
                province: 'InvalidProvince',
                drainType: 'channel',
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('No climate data');
        });

        it('returns success for valid input', () => {
            const result = designDrainage({
                catchmentBoundary: testCatchment,
                outletPoint: { x: 50, y: 0 },
                province: 'Morobe',
                terrainType: 'coastal-lowland',
                returnPeriod: 10,
                surfaceType: 'village-coastal',
                drainType: 'channel',
            });
            expect(result.success).toBe(true);
            expect(result.designDischarge).toBeGreaterThan(0);
            expect(result.entities.length).toBeGreaterThan(0);
            expect(result.report).toBeDefined();
        });

        it('generates cross-section entities', () => {
            const result = designDrainage({
                catchmentBoundary: testCatchment,
                province: 'Central',
                drainType: 'channel',
            });
            expect(result.success).toBe(true);
            expect(result.entities.some(e => e.type === 'polyline')).toBe(true);
        });
    });
});

// ============================================
// Road Workflow Tests
// ============================================

describe('Road Workflow', () => {
    describe('ROAD_CLASSES', () => {
        it('has all standard road classes', () => {
            expect(ROAD_CLASSES).toHaveProperty('provincial');
            expect(ROAD_CLASSES).toHaveProperty('district');
            expect(ROAD_CLASSES).toHaveProperty('access');
            expect(ROAD_CLASSES).toHaveProperty('track');
        });

        it('district road has correct width', () => {
            expect(ROAD_CLASSES.district.carriagewayWidth).toBe(5.5);
            expect(ROAD_CLASSES.district.shoulderWidth).toBe(1.0);
        });
    });

    describe('BATTER_SLOPES', () => {
        it('has slopes for common PNG materials', () => {
            expect(BATTER_SLOPES.laterite).toBe(1.0);
            expect(BATTER_SLOPES.clay).toBe(1.5);
            expect(BATTER_SLOPES.alluvial).toBe(2.5);
        });
    });

    describe('designRoad', () => {
        const testAlignment = [
            { x: 0, y: 0, z: 100 },
            { x: 100, y: 0, z: 100 },
            { x: 200, y: 50, z: 105 },
            { x: 300, y: 50, z: 110 },
        ];

        it('returns error for insufficient points', () => {
            const result = designRoad({ alignmentPoints: [{ x: 0, y: 0 }] });
            expect(result.success).toBe(false);
            expect(result.error).toContain('At least 2 alignment points');
        });

        it('returns success for valid alignment', () => {
            const result = designRoad({
                alignmentPoints: testAlignment,
                roadClass: 'district',
                terrainType: 'laterite',
                stationInterval: 20,
            });
            expect(result.success).toBe(true);
            expect(result.totalLength).toBeGreaterThan(0);
            expect(result.alignment).toBeDefined();
            expect(result.profile).toBeDefined();
            expect(result.earthworks).toBeDefined();
        });

        it('calculates cut and fill volumes', () => {
            const result = designRoad({
                alignmentPoints: testAlignment,
                roadClass: 'district',
            });
            expect(result.success).toBe(true);
            expect(typeof result.totalCut).toBe('number');
            expect(typeof result.totalFill).toBe('number');
        });

        it('generates CAD entities', () => {
            const result = designRoad({
                alignmentPoints: testAlignment,
                roadClass: 'access',
            });
            expect(result.success).toBe(true);
            expect(result.entities.length).toBeGreaterThan(0);
            expect(result.entities.some(e => e.metadata?.type === 'centerline')).toBe(true);
        });

        it('includes title block data', () => {
            const result = designRoad({
                alignmentPoints: testAlignment,
                roadClass: 'provincial',
            });
            expect(result.titleBlockData).toBeDefined();
            expect(result.titleBlockData.roadClass).toContain('Provincial');
        });
    });
});

// ============================================
// Building Workflow Tests
// ============================================

describe('Building Workflow', () => {
    describe('SEISMIC_Z', () => {
        it('has Z values for all provinces', () => {
            expect(Object.keys(SEISMIC_Z).length).toBeGreaterThanOrEqual(20);
        });

        it('Madang has severe seismic rating', () => {
            expect(SEISMIC_Z.madang.z).toBe(0.50);
            expect(SEISMIC_Z.madang.classification).toBe('Severe');
            expect(SEISMIC_Z.madang.nearFault).toBe(true);
        });

        it('Western province has low seismic rating', () => {
            expect(SEISMIC_Z.western.z).toBe(0.20);
            expect(SEISMIC_Z.western.classification).toBe('Low');
        });
    });

    describe('WIND_REGIONS', () => {
        it('island provinces are cyclonic', () => {
            expect(WIND_REGIONS['new ireland'].cyclonic).toBe(true);
            expect(WIND_REGIONS['bougainville'].cyclonic).toBe(true);
        });

        it('cyclonic regions have higher wind speed', () => {
            expect(WIND_REGIONS['east new britain'].speed).toBe(52);
        });
    });

    describe('getBuildingParameters', () => {
        it('returns error for unknown province', () => {
            const result = getBuildingParameters({ province: 'InvalidPlace' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unknown province');
        });

        it('returns all parameters for valid province', () => {
            const result = getBuildingParameters({
                province: 'Madang',
                buildingClass: '2',
                soilClass: 'Ce',
            });
            expect(result.success).toBe(true);
            expect(result.seismic).toBeDefined();
            expect(result.wind).toBeDefined();
            expect(result.climate).toBeDefined();
            expect(result.corrosion).toBeDefined();
        });

        it('calculates kp for seismic design', () => {
            const result = getBuildingParameters({
                province: 'Madang',
                buildingClass: '2',
                soilClass: 'Ce',
            });
            expect(result.success).toBe(true);
            // kp = Z * Importance * SiteFactor
            expect(typeof result.seismic.kp).toBe('string');
            expect(parseFloat(result.seismic.kp)).toBeGreaterThan(0);
        });

        it('generates title block entities', () => {
            const result = getBuildingParameters({
                province: 'Central',
                buildingClass: '3',
            });
            expect(result.success).toBe(true);
            expect(result.titleBlockEntities).toBeDefined();
            expect(result.titleBlockEntities.length).toBeGreaterThan(0);
        });

        it('handles province name variations', () => {
            const result1 = getBuildingParameters({ province: 'MOROBE' });
            const result2 = getBuildingParameters({ province: 'morobe' });
            const result3 = getBuildingParameters({ province: 'Morobe' });

            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result3.success).toBe(true);
            expect(result1.seismic.Z).toBe(result2.seismic.Z);
            expect(result2.seismic.Z).toBe(result3.seismic.Z);
        });
    });
});
