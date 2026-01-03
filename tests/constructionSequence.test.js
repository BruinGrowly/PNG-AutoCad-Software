/**
 * Construction Sequence Generator Tests
 * Tests for step-by-step build guidance
 */

import { describe, it, expect } from 'vitest';
import {
    EQUIPMENT_LEVELS,
    CURING_TIMES,
    generateConstructionSequence,
} from '../src/png/constructionSequence.js';

// ============================================
// Equipment Levels Tests
// ============================================

describe('EQUIPMENT_LEVELS', () => {
    it('has basic, standard, and mechanized levels', () => {
        expect(EQUIPMENT_LEVELS.basic).toBeDefined();
        expect(EQUIPMENT_LEVELS.standard).toBeDefined();
        expect(EQUIPMENT_LEVELS.mechanized).toBeDefined();
    });

    it('mechanized has higher rates than basic', () => {
        expect(EQUIPMENT_LEVELS.mechanized.excavationRate)
            .toBeGreaterThan(EQUIPMENT_LEVELS.basic.excavationRate);
        expect(EQUIPMENT_LEVELS.mechanized.concreteRate)
            .toBeGreaterThan(EQUIPMENT_LEVELS.basic.concreteRate);
    });
});

// ============================================
// Curing Times Tests
// ============================================

describe('CURING_TIMES', () => {
    it('footing cure is 7 days', () => {
        expect(CURING_TIMES.footing).toBe(7);
    });

    it('beam soffit removal is longest', () => {
        expect(CURING_TIMES.formworkRemoval.beam)
            .toBeGreaterThan(CURING_TIMES.formworkRemoval.column);
    });
});

// ============================================
// Main Generator Tests
// ============================================

describe('generateConstructionSequence', () => {
    it('generates sequence with project info', () => {
        const result = generateConstructionSequence({
            projectName: 'Test Building',
            province: 'Central',
        });

        expect(result.success).toBe(true);
        expect(result.project.name).toBe('Test Building');
        expect(result.project.province).toBe('Central');
    });

    it('generates at least 2 phases', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
        });

        expect(result.phases.length).toBeGreaterThanOrEqual(2);
    });

    it('includes site preparation phase', () => {
        const result = generateConstructionSequence({});

        const sitePhase = result.phases.find(p => p.name === 'Site Preparation');
        expect(sitePhase).toBeDefined();
        expect(sitePhase.phase).toBe(1);
    });

    it('includes foundation phase', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
        });

        const foundationPhase = result.phases.find(p => p.name === 'Foundation');
        expect(foundationPhase).toBeDefined();
        expect(foundationPhase.phase).toBe(2);
    });

    it('calculates total duration', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
            columns: [{ dimensions: { width: 300, height: 3000 } }],
        });

        expect(result.summary.totalDuration).toBeGreaterThan(10);
    });

    it('calculates total concrete volume', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
            columns: [{ dimensions: { width: 300, height: 3000 } }],
            beams: [{ dimensions: { length: 4000, width: 300, depth: 500 } }],
        });

        expect(result.summary.totalConcrete).toBeGreaterThan(0);
    });

    it('generates text report', () => {
        const result = generateConstructionSequence({
            projectName: 'Village Health Centre',
            province: 'Jiwaka',
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
        });

        expect(result.report).toContain('CONSTRUCTION SEQUENCE');
        expect(result.report).toContain('Village Health Centre');
        expect(result.report).toContain('Jiwaka');
        expect(result.report).toContain('PHASE 1');
        expect(result.report).toContain('PHASE 2');
    });
});

// ============================================
// Phase Content Tests
// ============================================

describe('Phase Content', () => {
    describe('Site Preparation Phase', () => {
        it('includes setting out steps', () => {
            const result = generateConstructionSequence({});
            const sitePhase = result.phases.find(p => p.name === 'Site Preparation');

            const setOutStep = sitePhase.steps.find(s =>
                s.description.toLowerCase().includes('set out')
            );
            expect(setOutStep).toBeDefined();
        });

        it('mentions 3-4-5 triangle method', () => {
            const result = generateConstructionSequence({});
            const sitePhase = result.phases.find(p => p.name === 'Site Preparation');

            const details = JSON.stringify(sitePhase.steps);
            expect(details).toContain('3-4-5');
        });
    });

    describe('Foundation Phase', () => {
        it('includes excavation step', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 500 } }],
            });
            const foundationPhase = result.phases.find(p => p.name === 'Foundation');

            const excavationStep = foundationPhase.steps.find(s =>
                s.description.toLowerCase().includes('excavat')
            );
            expect(excavationStep).toBeDefined();
        });

        it('includes blinding concrete step', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
            });
            const foundationPhase = result.phases.find(p => p.name === 'Foundation');

            const blindingStep = foundationPhase.steps.find(s =>
                s.description.toLowerCase().includes('blinding')
            );
            expect(blindingStep).toBeDefined();
        });

        it('includes curing step with wait time', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
            });
            const foundationPhase = result.phases.find(p => p.name === 'Foundation');

            const curingStep = foundationPhase.steps.find(s =>
                s.description.toLowerCase().includes('curing')
            );
            expect(curingStep).toBeDefined();
            expect(curingStep.duration).toBe(7);
        });
    });

    describe('Column Phase', () => {
        it('is generated when columns are provided', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
                columns: [{ dimensions: { width: 300, height: 3000 } }],
            });

            const columnPhase = result.phases.find(p => p.name === 'Columns');
            expect(columnPhase).toBeDefined();
        });

        it('mentions 500mm lift limit', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
                columns: [{ dimensions: { width: 300, height: 3000 } }],
            });
            const columnPhase = result.phases.find(p => p.name === 'Columns');

            const pourStep = columnPhase.steps.find(s =>
                s.description.toLowerCase().includes('pour')
            );
            expect(JSON.stringify(pourStep)).toContain('500mm');
        });
    });

    describe('Beam Phase', () => {
        it('is generated when beams are provided', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
                beams: [{ dimensions: { length: 4000, width: 300, depth: 500 } }],
            });

            const beamPhase = result.phases.find(p => p.name === 'Beams & Lintels');
            expect(beamPhase).toBeDefined();
        });
    });

    describe('Roof Phase', () => {
        it('is generated when roof type is provided', () => {
            const result = generateConstructionSequence({
                footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
                roof: { type: 'metal', pitch: 20 },
            });

            const roofPhase = result.phases.find(p => p.name === 'Roof Structure');
            expect(roofPhase).toBeDefined();
        });

        it('includes gutter installation', () => {
            const result = generateConstructionSequence({
                roof: { type: 'metal', pitch: 20 },
            });
            const roofPhase = result.phases.find(p => p.name === 'Roof Structure');

            const gutterStep = roofPhase.steps.find(s =>
                s.description.toLowerCase().includes('gutter')
            );
            expect(gutterStep).toBeDefined();
        });
    });
});

// ============================================
// Equipment Level Impact Tests
// ============================================

describe('Equipment Level Impact', () => {
    it('basic equipment takes longer than mechanized', () => {
        const basicResult = generateConstructionSequence({
            footings: [{ dimensions: { length: 2000, width: 2000, depth: 500 } }],
            equipment: 'basic',
            workers: 4,
        });

        const mechanizedResult = generateConstructionSequence({
            footings: [{ dimensions: { length: 2000, width: 2000, depth: 500 } }],
            equipment: 'mechanized',
            workers: 4,
        });

        expect(basicResult.summary.totalDuration)
            .toBeGreaterThanOrEqual(mechanizedResult.summary.totalDuration);
    });
});

// ============================================
// Report Format Tests
// ============================================

describe('Report Format', () => {
    it('includes important notes section', () => {
        const result = generateConstructionSequence({
            projectName: 'Test',
        });

        expect(result.report).toContain('IMPORTANT NOTES');
    });

    it('includes warning symbols', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
        });

        expect(result.report).toContain('⚠️');
    });

    it('includes wait times', () => {
        const result = generateConstructionSequence({
            footings: [{ dimensions: { length: 1500, width: 1500, depth: 400 } }],
        });

        expect(result.report).toContain('⏱️');
    });
});
