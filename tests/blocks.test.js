/**
 * Block Tests
 * Tests for CAD block/symbol functionality
 */

import { describe, it, expect } from 'vitest';
import {
  createBlockDefinition,
  insertBlock,
  getStandardBlock,
  listStandardBlocks,
  STANDARD_BLOCKS,
  createNorthArrow,
  createSectionMarker,
  createLevelMarker,
  createDoorSymbol,
  createWindowSymbol,
  createColumnSymbol,
  createToiletSymbol,
  createSinkSymbol,
  createTreeSymbol,
  createManholeSymbol,
  createBenchmarkSymbol,
  createTraditionalHausSymbol,
  createWaterTankSymbol,
  createSepticTankSymbol,
} from '../src/core/blocks.js';

describe('Block Definition', () => {
  describe('createBlockDefinition', () => {
    it('creates a block definition with entities', () => {
      const entities = [
        { type: 'line', startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 10 } },
        { type: 'circle', center: { x: 5, y: 5 }, radius: 3 },
      ];
      const block = createBlockDefinition('test-block', entities);

      expect(block.name).toBe('test-block');
      expect(block.entities.length).toBe(2);
      expect(block.basePoint).toEqual({ x: 0, y: 0 });
      expect(block.id).toBeDefined();
    });

    it('accepts custom base point', () => {
      const block = createBlockDefinition('test', [], { x: 10, y: 20 });
      expect(block.basePoint).toEqual({ x: 10, y: 20 });
    });

    it('assigns unique IDs to entities', () => {
      const entities = [
        { type: 'line' },
        { type: 'line' },
      ];
      const block = createBlockDefinition('test', entities);

      expect(block.entities[0].id).toBeDefined();
      expect(block.entities[1].id).toBeDefined();
      expect(block.entities[0].id).not.toBe(block.entities[1].id);
    });
  });
});

describe('Block Insertion', () => {
  describe('insertBlock', () => {
    it('creates a block entity at insertion point', () => {
      const blockDef = createBlockDefinition('test', []);
      const ref = insertBlock(blockDef, { x: 100, y: 200 });

      expect(ref.type).toBe('block');
      expect(ref.blockId).toBe(blockDef.id);
      expect(ref.position).toEqual({ x: 100, y: 200 });
    });

    it('applies scale factor', () => {
      const blockDef = createBlockDefinition('test', []);
      const ref = insertBlock(blockDef, { x: 0, y: 0 }, 2);

      expect(ref.scale).toBe(2);
    });

    it('applies rotation', () => {
      const blockDef = createBlockDefinition('test', []);
      const ref = insertBlock(blockDef, { x: 0, y: 0 }, 1, 45);

      expect(ref.rotation).toBe(45);
    });

    it('applies layer ID', () => {
      const blockDef = createBlockDefinition('test', []);
      const ref = insertBlock(blockDef, { x: 0, y: 0 }, 1, 0, 'custom-layer');

      expect(ref.layerId).toBe('custom-layer');
    });

    it('transforms entities based on position and scale', () => {
      const entities = [
        { type: 'circle', center: { x: 10, y: 10 }, radius: 5 },
      ];
      const blockDef = createBlockDefinition('test', entities);
      const ref = insertBlock(blockDef, { x: 100, y: 100 }, 2);

      // Entities should be transformed
      expect(ref.entities.length).toBe(1);
      expect(ref.entities[0].center.x).toBe(120); // 10 * 2 + 100
      expect(ref.entities[0].center.y).toBe(120);
      expect(ref.entities[0].radius).toBe(10); // 5 * 2
    });
  });
});

describe('Standard Block Library', () => {
  describe('STANDARD_BLOCKS', () => {
    it('has STANDARD_BLOCKS object', () => {
      expect(STANDARD_BLOCKS).toBeDefined();
      expect(typeof STANDARD_BLOCKS).toBe('object');
    });

    it('has expected standard block types', () => {
      expect(STANDARD_BLOCKS['north-arrow']).toBeDefined();
      expect(STANDARD_BLOCKS['door']).toBeDefined();
      expect(STANDARD_BLOCKS['window']).toBeDefined();
      expect(STANDARD_BLOCKS['column']).toBeDefined();
      expect(STANDARD_BLOCKS['toilet']).toBeDefined();
      expect(STANDARD_BLOCKS['sink']).toBeDefined();
      expect(STANDARD_BLOCKS['tree']).toBeDefined();
      expect(STANDARD_BLOCKS['manhole']).toBeDefined();
    });
  });

  describe('getStandardBlock', () => {
    it('gets a standard block by name', () => {
      const block = getStandardBlock('north-arrow');
      expect(block.name).toBe('North Arrow');
    });

    it('throws for unknown block name', () => {
      expect(() => getStandardBlock('unknown')).toThrow('Unknown block');
    });

    it('passes arguments to block creator', () => {
      const block = getStandardBlock('door', 1500);
      expect(block.name).toBe('Door');
    });
  });

  describe('listStandardBlocks', () => {
    it('returns array of block names', () => {
      const blocks = listStandardBlocks();
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks).toContain('north-arrow');
      expect(blocks).toContain('door');
    });
  });
});

describe('Standard Symbol Creation', () => {
  describe('createNorthArrow', () => {
    it('creates a north arrow block', () => {
      const block = createNorthArrow();

      expect(block.name).toBe('North Arrow');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('applies custom size', () => {
      const block = createNorthArrow(50);

      expect(block.name).toBe('North Arrow');
    });
  });

  describe('createSectionMarker', () => {
    it('creates a section marker block', () => {
      const block = createSectionMarker('A');

      expect(block.name).toBe('Section A');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('includes label in name', () => {
      const block = createSectionMarker('B', 20);
      expect(block.name).toBe('Section B');
    });

    it('has text entity with label', () => {
      const block = createSectionMarker('C');
      const textEntity = block.entities.find(e => e.type === 'text');
      expect(textEntity).toBeDefined();
      expect(textEntity.content).toBe('C');
    });
  });

  describe('createLevelMarker', () => {
    it('creates a level marker block', () => {
      const block = createLevelMarker('100.00');

      expect(block.name).toBe('Level 100.00');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createDoorSymbol', () => {
    it('creates a door symbol', () => {
      const block = createDoorSymbol();

      expect(block.name).toBe('Door');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('accepts custom width', () => {
      const block = createDoorSymbol(1200);
      expect(block.name).toBe('Door');
    });
  });

  describe('createWindowSymbol', () => {
    it('creates a window symbol', () => {
      const block = createWindowSymbol();

      expect(block.name).toBe('Window');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createColumnSymbol', () => {
    it('creates a column symbol', () => {
      const block = createColumnSymbol();

      expect(block.name).toBe('Column');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('accepts custom size', () => {
      const block = createColumnSymbol(400);
      expect(block.name).toBe('Column');
    });
  });

  describe('createToiletSymbol', () => {
    it('creates a toilet symbol', () => {
      const block = createToiletSymbol();

      expect(block.name).toBe('Toilet');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createSinkSymbol', () => {
    it('creates a sink symbol', () => {
      const block = createSinkSymbol();

      expect(block.name).toBe('Sink');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createTreeSymbol', () => {
    it('creates a tree symbol', () => {
      const block = createTreeSymbol();

      expect(block.name).toBe('Tree');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('accepts custom radius', () => {
      const block = createTreeSymbol(3000);
      expect(block.name).toBe('Tree');
    });
  });

  describe('createManholeSymbol', () => {
    it('creates a manhole symbol', () => {
      const block = createManholeSymbol();

      expect(block.name).toBe('Manhole');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createBenchmarkSymbol', () => {
    it('creates a benchmark symbol', () => {
      const block = createBenchmarkSymbol();

      expect(block.name).toBe('Benchmark');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });
});

describe('PNG-Specific Symbols', () => {
  describe('createTraditionalHausSymbol', () => {
    it('creates a traditional haus symbol', () => {
      const block = createTraditionalHausSymbol();

      expect(block.name).toBe('Traditional Haus');
      expect(block.entities.length).toBeGreaterThan(0);
    });

    it('accepts custom size', () => {
      const block = createTraditionalHausSymbol(8000);
      expect(block.name).toBe('Traditional Haus');
    });
  });

  describe('createWaterTankSymbol', () => {
    it('creates a water tank symbol', () => {
      const block = createWaterTankSymbol();

      expect(block.name).toBe('Water Tank');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });

  describe('createSepticTankSymbol', () => {
    it('creates a septic tank symbol', () => {
      const block = createSepticTankSymbol();

      expect(block.name).toBe('Septic Tank');
      expect(block.entities.length).toBeGreaterThan(0);
    });
  });
});
