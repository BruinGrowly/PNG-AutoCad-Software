/**
 * Cost Estimation Tests
 * Tests for PNG material pricing and quantity calculations
 */

import { describe, it, expect } from 'vitest';
import {
    LOCATION_FACTORS,
    CONCRETE_PRICES,
    STEEL_PRICES,
    TIMBER_PRICES,
    LABOUR_RATES,
    calculateConcreteVolume,
    calculateReinforcementWeight,
    calculateFormworkArea,
    calculateConcreteCost,
    calculateReinforcementCost,
    calculateFormworkCost,
    costConcreteBeam,
    costConcreteColumn,
    costFooting,
    estimateBuildingCost,
} from '../src/png/costEstimation.js';

// ============================================
// Price Data Tests
// ============================================

describe('Material Prices', () => {
    describe('LOCATION_FACTORS', () => {
        it('Port Moresby is base (1.0)', () => {
            expect(LOCATION_FACTORS['port-moresby']).toBe(1.0);
        });

        it('remote areas have higher factor', () => {
            expect(LOCATION_FACTORS['remote']).toBeGreaterThan(1.0);
            expect(LOCATION_FACTORS['buka']).toBeGreaterThan(1.0);
        });

        it('has highland factors', () => {
            expect(LOCATION_FACTORS['goroka']).toBeDefined();
            expect(LOCATION_FACTORS['mt-hagen']).toBeDefined();
        });
    });

    describe('CONCRETE_PRICES', () => {
        it('N25 is common grade', () => {
            expect(CONCRETE_PRICES['N25']).toBeDefined();
            expect(CONCRETE_PRICES['N25'].price).toBeGreaterThan(0);
        });

        it('higher grades cost more', () => {
            expect(CONCRETE_PRICES['N40'].price).toBeGreaterThan(CONCRETE_PRICES['N20'].price);
        });
    });

    describe('STEEL_PRICES', () => {
        it('has reinforcement bars', () => {
            expect(STEEL_PRICES['D500N-16']).toBeDefined();
            expect(STEEL_PRICES['D500N-20']).toBeDefined();
        });

        it('has links (R10)', () => {
            expect(STEEL_PRICES['R10']).toBeDefined();
        });
    });

    describe('TIMBER_PRICES', () => {
        it('has PNG timbers', () => {
            expect(TIMBER_PRICES['kwila']).toBeDefined();
            expect(TIMBER_PRICES['taun']).toBeDefined();
        });

        it('kwila is premium priced', () => {
            expect(TIMBER_PRICES['kwila'].price).toBeGreaterThan(TIMBER_PRICES['pine-treated'].price);
        });
    });

    describe('LABOUR_RATES', () => {
        it('has daily rates in PGK', () => {
            expect(LABOUR_RATES['labourer'].price).toBeGreaterThan(0);
            expect(LABOUR_RATES['tradesman'].price).toBeGreaterThan(LABOUR_RATES['labourer'].price);
        });

        it('skilled trades cost more', () => {
            expect(LABOUR_RATES['electrician'].price).toBeGreaterThan(LABOUR_RATES['labourer'].price);
        });
    });
});

// ============================================
// Quantity Calculation Tests
// ============================================

describe('Quantity Calculations', () => {
    describe('calculateConcreteVolume', () => {
        it('calculates volume for beam', () => {
            const result = calculateConcreteVolume({
                length: 4000,
                width: 300,
                depth: 500,
            });

            // 4m × 0.3m × 0.5m = 0.6m³
            expect(result.netVolume).toBeCloseTo(0.6, 2);
        });

        it('includes waste allowance', () => {
            const result = calculateConcreteVolume({
                length: 1000,
                width: 1000,
                depth: 1000,
            });

            expect(result.totalVolume).toBeGreaterThan(result.netVolume);
        });

        it('multiplies by quantity', () => {
            const single = calculateConcreteVolume({
                length: 1000,
                width: 1000,
                depth: 100,
                quantity: 1,
            });

            const double = calculateConcreteVolume({
                length: 1000,
                width: 1000,
                depth: 100,
                quantity: 2,
            });

            expect(double.totalVolume).toBeCloseTo(single.totalVolume * 2, 2);
        });
    });

    describe('calculateReinforcementWeight', () => {
        it('parses bar count format (4N16)', () => {
            const result = calculateReinforcementWeight({
                barSpec: '4N16',
                length: 4000,
            });

            // 4 bars × 4m × 1.58 kg/m = 25.3 kg
            expect(result.weight).toBeCloseTo(25.3, 0);
        });

        it('parses spacing format (N12@200)', () => {
            const result = calculateReinforcementWeight({
                barSpec: 'N12@200',
                length: 4000,
                width: 1000,
            });

            expect(result.weight).toBeGreaterThan(0);
        });

        it('adds lap allowance', () => {
            const result = calculateReinforcementWeight({
                barSpec: '4N20',
                length: 5000,
            });

            expect(result.totalWeight).toBeGreaterThan(result.weight);
        });
    });

    describe('calculateFormworkArea', () => {
        it('calculates beam formwork (sides + soffit)', () => {
            const result = calculateFormworkArea({
                memberType: 'beam',
                length: 4000,
                width: 300,
                depth: 500,
            });

            // 2 sides (0.5m × 4m) + soffit (0.3m × 4m) = 5.2m²
            expect(result.grossArea).toBeCloseTo(5.2, 1);
        });

        it('calculates column formwork (4 sides)', () => {
            const result = calculateFormworkArea({
                memberType: 'column',
                length: 3000,
                width: 300,
                depth: 300,
            });

            // 4 sides × 0.3m × 3m = 3.6m²
            expect(result.grossArea).toBeCloseTo(3.6, 1);
        });

        it('applies reuse factor', () => {
            const result = calculateFormworkArea({
                memberType: 'slab',
                length: 10000,
                width: 10000,
                depth: 150,
            });

            expect(result.effectiveArea).toBeLessThan(result.grossArea);
        });
    });
});

// ============================================
// Cost Calculation Tests
// ============================================

describe('Cost Calculations', () => {
    describe('calculateConcreteCost', () => {
        it('calculates basic concrete cost', () => {
            const result = calculateConcreteCost({
                volume: 1.0,
                grade: 'N25',
                location: 'port-moresby',
                includeLabour: false,
            });

            expect(result.materialCost).toBeCloseTo(950, 0);
        });

        it('applies location factor', () => {
            const pom = calculateConcreteCost({
                volume: 1.0,
                grade: 'N25',
                location: 'port-moresby',
                includeLabour: false,
            });

            const remote = calculateConcreteCost({
                volume: 1.0,
                grade: 'N25',
                location: 'remote',
                includeLabour: false,
            });

            expect(remote.materialCost).toBeGreaterThan(pom.materialCost);
        });

        it('adds labour cost if included', () => {
            const withLabour = calculateConcreteCost({ volume: 2.0, includeLabour: true });
            const withoutLabour = calculateConcreteCost({ volume: 2.0, includeLabour: false });

            expect(withLabour.totalCost).toBeGreaterThan(withoutLabour.totalCost);
        });
    });

    describe('calculateReinforcementCost', () => {
        it('calculates steel cost per tonne', () => {
            const result = calculateReinforcementCost({
                weight: 1000,  // 1 tonne
                barSize: 16,
                location: 'port-moresby',
                includeLabour: false,
            });

            expect(result.materialCost).toBeCloseTo(4200, -1);
        });
    });

    describe('calculateFormworkCost', () => {
        it('includes plywood and framing', () => {
            const result = calculateFormworkCost({
                area: 10,
                location: 'port-moresby',
                includeLabour: false,
            });

            expect(result.materialCost).toBeGreaterThan(0);
        });

        it('fair-face costs more', () => {
            const standard = calculateFormworkCost({ area: 10, type: 'standard' });
            const fairFace = calculateFormworkCost({ area: 10, type: 'fair-face' });

            expect(fairFace.totalCost).toBeGreaterThan(standard.totalCost);
        });
    });
});

// ============================================
// Complete Element Costing Tests
// ============================================

describe('Element Costing', () => {
    describe('costConcreteBeam', () => {
        it('costs a typical beam', () => {
            const result = costConcreteBeam({
                length: 4000,
                width: 300,
                depth: 500,
                reinforcementKg: 50,
                location: 'port-moresby',
            });

            expect(result.success).toBe(true);
            expect(result.totalCost).toBeGreaterThan(0);
            expect(result.concrete.cost).toBeGreaterThan(0);
            expect(result.steel.cost).toBeGreaterThan(0);
            expect(result.formwork.cost).toBeGreaterThan(0);
        });

        it('generates report string', () => {
            const result = costConcreteBeam({
                length: 4000,
                width: 300,
                depth: 500,
                reinforcementKg: 50,
            });

            expect(result.report).toContain('Beam');
            expect(result.report).toContain('PGK');
        });
    });

    describe('costConcreteColumn', () => {
        it('costs a typical column', () => {
            const result = costConcreteColumn({
                width: 300,
                height: 3000,
                reinforcementKg: 80,
                location: 'lae',
            });

            expect(result.success).toBe(true);
            expect(result.totalCost).toBeGreaterThan(0);
        });

        it('handles multiple columns', () => {
            const single = costConcreteColumn({
                width: 300,
                height: 3000,
                reinforcementKg: 80,
                quantity: 1,
            });

            const multiple = costConcreteColumn({
                width: 300,
                height: 3000,
                reinforcementKg: 80,
                quantity: 4,
            });

            expect(multiple.totalCost).toBeGreaterThan(single.totalCost);
        });
    });

    describe('costFooting', () => {
        it('costs a pad footing', () => {
            const result = costFooting({
                length: 1500,
                width: 1500,
                depth: 400,
                reinforcementKg: 30,
                location: 'port-moresby',
            });

            expect(result.success).toBe(true);
            expect(result.totalCost).toBeGreaterThan(0);
        });

        it('includes excavation by default', () => {
            const withExc = costFooting({
                length: 1500,
                width: 1500,
                depth: 400,
                reinforcementKg: 30,
                includeExcavation: true,
            });

            const withoutExc = costFooting({
                length: 1500,
                width: 1500,
                depth: 400,
                reinforcementKg: 30,
                includeExcavation: false,
            });

            expect(withExc.totalCost).toBeGreaterThan(withoutExc.totalCost);
        });
    });
});

// ============================================
// Building Estimate Tests
// ============================================

describe('estimateBuildingCost', () => {
    it('estimates residential building', () => {
        const result = estimateBuildingCost({
            floorArea: 100,
            numStoreys: 1,
            buildingType: 'residential',
            quality: 'medium',
            location: 'port-moresby',
        });

        expect(result.success).toBe(true);
        expect(result.costs.total).toBeGreaterThan(0);
    });

    it('higher quality costs more', () => {
        const basic = estimateBuildingCost({
            floorArea: 100,
            quality: 'basic',
        });

        const high = estimateBuildingCost({
            floorArea: 100,
            quality: 'high',
        });

        expect(high.costs.total).toBeGreaterThan(basic.costs.total);
    });

    it('multi-storey costs more per m²', () => {
        const single = estimateBuildingCost({
            floorArea: 100,
            numStoreys: 1,
        });

        const double = estimateBuildingCost({
            floorArea: 100,
            numStoreys: 2,
        });

        // Double has 2x area but costs more than 2x due to height factor
        const costPerM2Single = single.costs.total / 100;
        const costPerM2Double = double.costs.total / 200;
        expect(costPerM2Double).toBeGreaterThan(costPerM2Single);
    });

    it('includes contingency and fees', () => {
        const result = estimateBuildingCost({
            floorArea: 100,
            buildingType: 'residential',
        });

        expect(result.costs.contingency).toBeGreaterThan(0);
        expect(result.costs.professionalFees).toBeGreaterThan(0);
    });

    it('generates detailed report', () => {
        const result = estimateBuildingCost({
            floorArea: 150,
            numStoreys: 2,
            buildingType: 'commercial',
            quality: 'high',
            location: 'lae',
        });

        expect(result.report).toContain('COST ESTIMATE SUMMARY');
        expect(result.report).toContain('BREAKDOWN');
        expect(result.report).toContain('TOTAL');
    });
});
