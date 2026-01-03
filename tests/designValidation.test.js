/**
 * Design Validation Tests
 * Tests for PNG compliance checking
 */

import { describe, it, expect } from 'vitest';
import {
    SEVERITY,
    validateBeam,
    validateColumn,
    validateFooting,
    validateRoof,
    validateVentilation,
    validateSeismic,
    validateBuildingDesign,
} from '../src/png/designValidation.js';

// ============================================
// Beam Validation Tests
// ============================================

describe('validateBeam', () => {
    it('passes valid beam', () => {
        const result = validateBeam({
            span: 4000,
            width: 300,
            depth: 500,
        });

        expect(result.passed).toBe(true);
        expect(result.errorCount).toBe(0);
    });

    it('fails beam with excessive span/depth ratio', () => {
        const result = validateBeam({
            span: 6000,
            width: 300,
            depth: 300,  // ratio = 20 > 18
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'BEAM-001' && r.severity === SEVERITY.ERROR)).toBe(true);
    });

    it('warns on high span/depth ratio', () => {
        const result = validateBeam({
            span: 4800,
            width: 300,
            depth: 300,  // ratio = 16
        });

        expect(result.warningCount).toBeGreaterThan(0);
    });

    it('fails beam with narrow width', () => {
        const result = validateBeam({
            span: 3000,
            width: 150,  // < 200mm
            depth: 400,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'BEAM-003')).toBe(true);
    });

    it('checks concrete grade for exposure class', () => {
        const result = validateBeam({
            span: 4000,
            width: 300,
            depth: 500,
            concreteGrade: 'N20',
            exposureClass: 'B2',  // Requires N32
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'BEAM-005')).toBe(true);
    });
});

// ============================================
// Column Validation Tests
// ============================================

describe('validateColumn', () => {
    it('passes valid column', () => {
        const result = validateColumn({
            width: 300,
            height: 3000,
            axialLoad: 500,
            concreteGrade: 'N32',
        });

        expect(result.passed).toBe(true);
    });

    it('fails undersized column', () => {
        const result = validateColumn({
            width: 150,  // < 200mm
            height: 3000,
            axialLoad: 200,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'COL-001')).toBe(true);
    });

    it('warns on slender column', () => {
        const result = validateColumn({
            width: 200,
            height: 6000,  // Le/d > 22
            axialLoad: 200,
        });

        expect(result.warningCount).toBeGreaterThan(0);
    });

    it('fails overloaded column', () => {
        const result = validateColumn({
            width: 200,
            height: 3000,
            axialLoad: 2000,  // Too high for size
            concreteGrade: 'N25',
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'COL-003')).toBe(true);
    });

    it('enforces severe seismic requirements', () => {
        const result = validateColumn({
            width: 250,  // < 300mm
            height: 3000,
            axialLoad: 300,
            seismicZone: 'severe',
        });

        expect(result.results.some(r => r.code === 'COL-004')).toBe(true);
    });
});

// ============================================
// Footing Validation Tests
// ============================================

describe('validateFooting', () => {
    it('passes valid footing', () => {
        const result = validateFooting({
            length: 1500,
            width: 1500,
            depth: 500,  // Adequate for punching shear (> columnSize/4 = 75)
            columnSize: 300,
            columnLoad: 300,  // Lower load for comfortable margin
            soilBearing: 150,
        });

        expect(result.passed).toBe(true);
    });

    it('fails shallow footing', () => {
        const result = validateFooting({
            length: 1500,
            width: 1500,
            depth: 200,  // < 300mm
            columnSize: 300,
            columnLoad: 500,
            soilBearing: 150,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'FTG-001')).toBe(true);
    });

    it('fails undersized footing', () => {
        const result = validateFooting({
            length: 500,   // Too small extension
            width: 500,
            depth: 400,
            columnSize: 300,
            columnLoad: 500,
            soilBearing: 150,
        });

        expect(result.passed).toBe(false);
    });

    it('fails overstressed footing', () => {
        const result = validateFooting({
            length: 600,
            width: 600,
            depth: 400,
            columnSize: 300,
            columnLoad: 500,  // Pressure = 1389 kPa >> 100 kPa
            soilBearing: 100,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'FTG-003')).toBe(true);
    });

    it('warns about groundwater', () => {
        const result = validateFooting({
            length: 1500,
            width: 1500,
            depth: 500,
            columnSize: 300,
            columnLoad: 500,
            soilBearing: 150,
            groundwaterDepth: 0.3,  // Above footing base
        });

        expect(result.warningCount).toBeGreaterThan(0);
        expect(result.results.some(r => r.code === 'FTG-005')).toBe(true);
    });
});

// ============================================
// Roof Validation Tests
// ============================================

describe('validateRoof', () => {
    it('passes adequate roof pitch', () => {
        const result = validateRoof({
            roofPitch: 25,
            overhang: 900,
            annualRainfall: 3000,
        });

        expect(result.passed).toBe(true);
    });

    it('fails low pitch in high rainfall', () => {
        const result = validateRoof({
            roofPitch: 10,  // Too low
            overhang: 600,
            annualRainfall: 4000,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'ROOF-001')).toBe(true);
    });

    it('warns on short overhang', () => {
        const result = validateRoof({
            roofPitch: 25,
            overhang: 400,  // Short
            annualRainfall: 3500,
        });

        expect(result.warningCount).toBeGreaterThan(0);
    });

    it('fails thatch in cyclonic zone', () => {
        const result = validateRoof({
            roofPitch: 30,
            overhang: 900,
            roofType: 'thatch',
            isCyclonic: true,
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'ROOF-003')).toBe(true);
    });
});

// ============================================
// Ventilation Validation Tests
// ============================================

describe('validateVentilation', () => {
    it('passes adequate ventilation', () => {
        const result = validateVentilation({
            floorArea: 100,
            openableWindows: 12,  // 12% > 10%
        });

        expect(result.passed).toBe(true);
    });

    it('fails insufficient ventilation', () => {
        const result = validateVentilation({
            floorArea: 100,
            openableWindows: 5,  // 5% < 10%
            climateZone: 'tropical-coastal',
        });

        expect(result.passed).toBe(false);
        expect(result.results.some(r => r.code === 'VENT-001')).toBe(true);
    });

    it('warns no cross ventilation in coastal', () => {
        const result = validateVentilation({
            floorArea: 100,
            openableWindows: 15,
            hasCrossVent: false,
            climateZone: 'tropical-coastal',
        });

        expect(result.warningCount).toBeGreaterThan(0);
    });
});

// ============================================
// Seismic Validation Tests
// ============================================

describe('validateSeismic', () => {
    it('passes low zone requirements', () => {
        const result = validateSeismic({
            province: 'Western',  // Low zone
            buildingClass: 2,
            numStoreys: 2,
        });

        expect(result.passed).toBe(true);
    });

    it('requires tie beams in severe zone', () => {
        const result = validateSeismic({
            province: 'Madang',  // Severe
            buildingClass: 2,
            numStoreys: 2,
            hasTieBeams: false,
        });

        expect(result.results.some(r => r.code === 'SEIS-001')).toBe(true);
    });

    it('requires shear walls for important buildings in severe zone', () => {
        const result = validateSeismic({
            province: 'Madang',
            buildingClass: 3,  // School/church
            numStoreys: 1,
            hasShearWalls: false,
        });

        expect(result.results.some(r => r.code === 'SEIS-002')).toBe(true);
    });

    it('limits masonry height in seismic zones', () => {
        const result = validateSeismic({
            province: 'Morobe',  // High
            numStoreys: 3,
            structuralSystem: 'masonry',
            hasShearWalls: false,
        });

        expect(result.passed).toBe(false);
    });
});

// ============================================
// Complete Building Validation Tests
// ============================================

describe('validateBuildingDesign', () => {
    it('validates complete building', () => {
        const result = validateBuildingDesign({
            province: 'Central',
            buildingClass: 2,
            numStoreys: 1,
            floorArea: 100,
            roofPitch: 22,
            overhang: 750,
            beams: [{ span: 4000, width: 300, depth: 500 }],
            columns: [{ width: 300, height: 3000, axialLoad: 400 }],
        });

        expect(result.success).toBe(true);
        expect(result.summary).toBeDefined();
        expect(result.report).toContain('DESIGN VALIDATION REPORT');
    });

    it('reports overall pass status', () => {
        const result = validateBuildingDesign({
            province: 'Western',
            buildingClass: 1,
            numStoreys: 1,
            roofPitch: 20,
            overhang: 600,
        });

        expect(result.passed).toBe(true);
        expect(result.summary.status).toContain('PASS');
    });

    it('reports overall fail status', () => {
        const result = validateBuildingDesign({
            province: 'Madang',
            buildingClass: 3,
            numStoreys: 2,
            roofPitch: 10,  // Too low
            overhang: 300,  // Too short
            beams: [{ span: 8000, width: 200, depth: 300 }],  // Fails many checks
        });

        expect(result.passed).toBe(false);
        expect(result.summary.totalErrors).toBeGreaterThan(0);
    });

    it('generates readable report', () => {
        const result = validateBuildingDesign({
            province: 'Morobe',
            buildingClass: 2,
            numStoreys: 1,
        });

        expect(result.report).toContain('Location: Morobe');
        expect(result.report).toContain('Building Class: 2');
    });
});
