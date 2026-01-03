/**
 * Structural Workflow Tests
 * Tests for beam, column, and footing calculations
 */

import { describe, it, expect } from 'vitest';
import {
    CONCRETE_GRADES,
    STEEL_GRADES,
    TIMBER_GRADES,
    SOIL_BEARING,
    DEAD_LOADS,
    LIVE_LOADS,
    calculateGravityLoad,
    calculateSeismicLoad,
    sizeConcreteBeam,
    sizeTimberBeam,
    sizeConcreteColumn,
    sizePadFooting,
    sizeStripFooting,
    designStructuralFrame,
} from '../src/png/structuralWorkflow.js';

// ============================================
// Material Properties Tests
// ============================================

describe('Material Properties', () => {
    describe('CONCRETE_GRADES', () => {
        it('has standard PNG grades', () => {
            expect(CONCRETE_GRADES).toHaveProperty('N20');
            expect(CONCRETE_GRADES).toHaveProperty('N25');
            expect(CONCRETE_GRADES).toHaveProperty('N32');
            expect(CONCRETE_GRADES).toHaveProperty('N40');
        });

        it('N25 has correct properties', () => {
            expect(CONCRETE_GRADES.N25.fck).toBe(25);
            expect(CONCRETE_GRADES.N25.fcd).toBeCloseTo(16.7, 1);
        });
    });

    describe('STEEL_GRADES', () => {
        it('has reinforcement grade', () => {
            expect(STEEL_GRADES['D500N'].fy).toBe(500);
        });

        it('has structural grades', () => {
            expect(STEEL_GRADES['G300'].fy).toBe(300);
            expect(STEEL_GRADES['G350'].fy).toBe(350);
        });
    });

    describe('TIMBER_GRADES', () => {
        it('has kwila grade F17', () => {
            expect(TIMBER_GRADES['F17'].fb).toBe(17);
            expect(TIMBER_GRADES['F17'].E).toBe(14000);
        });

        it('has common framing grade F7', () => {
            expect(TIMBER_GRADES['F7'].fb).toBe(7);
        });
    });

    describe('SOIL_BEARING', () => {
        it('has PNG-specific soil types', () => {
            expect(SOIL_BEARING['coral'].allowable).toBe(200);
            expect(SOIL_BEARING['medium-clay'].allowable).toBe(100);
        });

        it('rock has highest bearing', () => {
            expect(SOIL_BEARING['rock'].allowable).toBe(1000);
        });

        it('soft clay has lowest bearing', () => {
            expect(SOIL_BEARING['soft-clay'].allowable).toBe(50);
        });
    });
});

// ============================================
// Load Calculation Tests
// ============================================

describe('Load Calculations', () => {
    describe('DEAD_LOADS', () => {
        it('has slab loads', () => {
            expect(DEAD_LOADS['concrete-slab-100']).toBe(2.4);
            expect(DEAD_LOADS['concrete-slab-150']).toBe(3.6);
        });
    });

    describe('LIVE_LOADS', () => {
        it('has residential load', () => {
            expect(LIVE_LOADS['residential']).toBe(1.5);
        });

        it('has commercial loads', () => {
            expect(LIVE_LOADS['office']).toBe(3.0);
            expect(LIVE_LOADS['retail']).toBe(4.0);
        });
    });

    describe('calculateGravityLoad', () => {
        it('calculates load for typical residential', () => {
            const result = calculateGravityLoad({
                deadLoad: 3.0,
                liveLoad: 1.5,
                tributaryArea: 20,
            });

            expect(result.serviceLoad).toBe(90);  // (3+1.5)*20
            expect(result.ultimateLoad).toBeCloseTo(126, 0);  // (1.35*3 + 1.5*1.5)*20
        });

        it('separates dead and live components', () => {
            const result = calculateGravityLoad({
                deadLoad: 4.0,
                liveLoad: 2.0,
                tributaryArea: 10,
            });

            expect(result.deadLoad).toBe(40);
            expect(result.liveLoad).toBe(20);
        });
    });

    describe('calculateSeismicLoad', () => {
        it('calculates for Madang (severe zone)', () => {
            const result = calculateSeismicLoad({
                province: 'Madang',
                buildingWeight: 500,
            });

            expect(result.Z).toBe(0.50);
            expect(result.classification).toBe('Severe');
            expect(result.baseShear).toBeGreaterThan(0);
        });

        it('calculates for Western (low zone)', () => {
            const result = calculateSeismicLoad({
                province: 'Western',
                buildingWeight: 500,
            });

            expect(result.Z).toBe(0.20);
            expect(result.classification).toBe('Low');
        });

        it('applies soil class factor', () => {
            const resultCe = calculateSeismicLoad({
                province: 'Central',
                buildingWeight: 500,
                soilClass: 'Ce',
            });

            const resultEe = calculateSeismicLoad({
                province: 'Central',
                buildingWeight: 500,
                soilClass: 'Ee',
            });

            expect(resultEe.baseShear).toBeGreaterThan(resultCe.baseShear);
        });
    });
});

// ============================================
// Beam Sizing Tests
// ============================================

describe('Beam Sizing', () => {
    describe('sizeConcreteBeam', () => {
        it('sizes beam for typical span', () => {
            const result = sizeConcreteBeam({
                span: 4,
                ultimateLoad: 30,
                concreteGrade: 'N25',
            });

            expect(result.success).toBe(true);
            expect(result.dimensions.width).toBeGreaterThanOrEqual(200);
            expect(result.dimensions.depth).toBeGreaterThanOrEqual(300);
        });

        it('increases size for larger loads', () => {
            const light = sizeConcreteBeam({ span: 4, ultimateLoad: 20 });
            const heavy = sizeConcreteBeam({ span: 4, ultimateLoad: 60 });

            expect(heavy.dimensions.depth).toBeGreaterThanOrEqual(light.dimensions.depth);
        });

        it('provides reinforcement specification', () => {
            const result = sizeConcreteBeam({ span: 5, ultimateLoad: 40 });

            expect(result.reinforcement.bottom).toMatch(/^\d+N\d+$/);
            expect(result.reinforcement.links).toMatch(/R10@\d+/);
        });

        it('specifies cover for coastal exposure', () => {
            const result = sizeConcreteBeam({
                span: 4,
                ultimateLoad: 30,
                exposureClass: 'B1',
            });

            expect(result.cover).toBe(40);
        });
    });

    describe('sizeTimberBeam', () => {
        it('sizes timber beam for typical load', () => {
            const result = sizeTimberBeam({
                span: 3,
                ultimateLoad: 5,
                timberGrade: 'F11',
            });

            expect(result.success).toBe(true);
            expect(result.dimensions.b).toBeGreaterThan(0);
            expect(result.dimensions.d).toBeGreaterThan(0);
        });

        it('checks deflection', () => {
            const result = sizeTimberBeam({
                span: 4,
                ultimateLoad: 8,
                timberGrade: 'F7',
            });

            expect(result.deflection).toBeDefined();
            expect(typeof result.deflection.ok).toBe('boolean');
        });

        it('returns error for unknown grade', () => {
            const result = sizeTimberBeam({
                span: 3,
                ultimateLoad: 5,
                timberGrade: 'INVALID',
            });

            expect(result.success).toBe(false);
        });
    });
});

// ============================================
// Column Sizing Tests
// ============================================

describe('Column Sizing', () => {
    describe('sizeConcreteColumn', () => {
        it('sizes column for typical load', () => {
            const result = sizeConcreteColumn({
                axialLoad: 500,
                height: 3,
            });

            expect(result.success).toBe(true);
            expect(result.dimensions.width).toBeGreaterThanOrEqual(200);
        });

        it('checks slenderness', () => {
            const short = sizeConcreteColumn({ axialLoad: 500, height: 2 });
            const tall = sizeConcreteColumn({ axialLoad: 500, height: 6 });

            expect(parseFloat(tall.slenderness)).toBeGreaterThan(parseFloat(short.slenderness));
        });

        it('provides main bar specification', () => {
            const result = sizeConcreteColumn({ axialLoad: 800 });

            expect(result.reinforcement.main).toMatch(/^\d+N\d+$/);
        });
    });
});

// ============================================
// Footing Sizing Tests
// ============================================

describe('Footing Sizing', () => {
    describe('sizePadFooting', () => {
        it('sizes footing for typical load', () => {
            const result = sizePadFooting({
                columnLoad: 500,
                soilType: 'medium-clay',
            });

            expect(result.success).toBe(true);
            expect(result.dimensions.length).toBeGreaterThanOrEqual(600);
            expect(result.dimensions.depth).toBeGreaterThanOrEqual(300);
        });

        it('increases size for poor soil', () => {
            // Use high load to see size difference (min footing is 600mm)
            const goodSoil = sizePadFooting({ columnLoad: 1000, soilType: 'dense-gravel' });
            const poorSoil = sizePadFooting({ columnLoad: 1000, soilType: 'soft-clay' });

            // Poor soil requires larger footing for same load (or minimum applies)
            expect(poorSoil.dimensions.length).toBeGreaterThanOrEqual(goodSoil.dimensions.length);
        });

        it('warns about groundwater', () => {
            const result = sizePadFooting({
                columnLoad: 500,
                soilType: 'medium-clay',
                groundwaterDepth: 0.5,
            });

            expect(result.warnings.length).toBeGreaterThan(0);
        });

        it('specifies in-ground cover', () => {
            const result = sizePadFooting({ columnLoad: 500 });
            expect(result.cover).toBe(75);
        });

        it('returns error for unknown soil', () => {
            const result = sizePadFooting({ soilType: 'moon-dust' });
            expect(result.success).toBe(false);
        });
    });

    describe('sizeStripFooting', () => {
        it('sizes strip for wall load', () => {
            const result = sizeStripFooting({
                wallLoad: 30,
                wallThickness: 200,
                soilType: 'medium-clay',
            });

            expect(result.success).toBe(true);
            expect(result.dimensions.width).toBeGreaterThan(result.dimensions.depth);
        });
    });
});

// ============================================
// Complete Workflow Test
// ============================================

describe('designStructuralFrame', () => {
    it('designs complete structural frame', () => {
        const result = designStructuralFrame({
            province: 'Morobe',
            buildingType: 'residential',
            numStoreys: 2,
            floorArea: 100,
            spanX: 4,
            spanY: 4,
        });

        expect(result.success).toBe(true);
        expect(result.elements.beam).toBeDefined();
        expect(result.elements.column).toBeDefined();
        expect(result.elements.footing).toBeDefined();
    });

    it('includes seismic info for severe zones', () => {
        const result = designStructuralFrame({
            province: 'Madang',
            buildingType: 'residential',
        });

        expect(result.loads.seismicClassification).toBe('Severe');
        expect(result.warnings.some(w => w.includes('Severe') || w.includes('seismic'))).toBe(true);
    });

    it('generates complete report', () => {
        const result = designStructuralFrame({
            province: 'Central',
            buildingType: 'residential',
        });

        expect(result.report).toContain('STRUCTURAL DESIGN SUMMARY');
        expect(result.report).toContain('TYPICAL BEAM');
        expect(result.report).toContain('TYPICAL COLUMN');
        expect(result.report).toContain('TYPICAL FOOTING');
    });
});
