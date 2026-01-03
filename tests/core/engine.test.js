/**
 * CAD Engine Tests
 * Tests for core CAD engine functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLayer,
  createEntity,
  createNewProject,
  createViewport,
  DEFAULT_LAYERS,
  DEFAULT_STYLE,
  DEFAULT_GRID,
  DEFAULT_SNAP,
  DEFAULT_UNITS,
  isPointNearEntity,
  selectEntitiesInBox,
  getSnapPoints,
  findNearestSnapPoint,
  snapToGrid,
  CommandHistory,
  screenToWorld,
  worldToScreen,
} from '../../src/core/engine.js';

describe('CAD Engine', () => {
  describe('Layer Management', () => {
    describe('createLayer', () => {
      it('should create a layer with name', () => {
        const layer = createLayer('Test Layer');
        expect(layer.name).toBe('Test Layer');
        expect(layer.id).toBeTruthy();
        expect(layer.visible).toBe(true);
        expect(layer.locked).toBe(false);
      });

      it('should create a layer with custom color', () => {
        const layer = createLayer('Red Layer', '#FF0000');
        expect(layer.color).toBe('#FF0000');
      });
    });

    describe('DEFAULT_LAYERS', () => {
      it('should have standard CAD layers', () => {
        expect(DEFAULT_LAYERS.length).toBeGreaterThan(0);
        expect(DEFAULT_LAYERS.find(l => l.name === '0')).toBeTruthy();
        expect(DEFAULT_LAYERS.find(l => l.name === 'Structural')).toBeTruthy();
      });
    });
  });

  describe('Entity Creation', () => {
    describe('createEntity', () => {
      it('should create a line entity', () => {
        const line = createEntity('line', {
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
        });

        expect(line.type).toBe('line');
        expect(line.id).toBeTruthy();
        expect(line.visible).toBe(true);
        expect(line.startPoint).toEqual({ x: 0, y: 0 });
      });

      it('should create entity with custom layer', () => {
        const line = createEntity('line', {
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
        }, 'layer-structural');

        expect(line.layerId).toBe('layer-structural');
      });

      it('should create a circle entity', () => {
        const circle = createEntity('circle', {
          center: { x: 50, y: 50 },
          radius: 25,
        });

        expect(circle.type).toBe('circle');
        expect(circle.center).toEqual({ x: 50, y: 50 });
        expect(circle.radius).toBe(25);
      });
    });
  });

  describe('Entity Selection', () => {
    let testLine;
    let testCircle;

    beforeEach(() => {
      testLine = {
        id: 'line-1',
        type: 'line',
        layerId: 'layer-0',
        visible: true,
        locked: false,
        style: DEFAULT_STYLE,
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 100, y: 0 },
      };

      testCircle = {
        id: 'circle-1',
        type: 'circle',
        layerId: 'layer-0',
        visible: true,
        locked: false,
        style: DEFAULT_STYLE,
        center: { x: 50, y: 50 },
        radius: 25,
      };
    });

    describe('isPointNearEntity', () => {
      it('should detect point on line', () => {
        expect(isPointNearEntity({ x: 50, y: 0 }, testLine, 5)).toBe(true);
      });

      it('should not detect point far from line', () => {
        expect(isPointNearEntity({ x: 50, y: 50 }, testLine, 5)).toBe(false);
      });

      it('should detect point on circle', () => {
        expect(isPointNearEntity({ x: 75, y: 50 }, testCircle, 5)).toBe(true);
      });
    });

    describe('selectEntitiesInBox', () => {
      it('should select entities inside box', () => {
        const entities = [testLine, testCircle];
        const box = { minX: 20, minY: 20, maxX: 80, maxY: 80 };
        const selected = selectEntitiesInBox(entities, box);
        expect(selected).toContainEqual(testCircle);
      });
    });
  });

  describe('Snap System', () => {
    describe('snapToGrid', () => {
      it('should snap to nearest grid point', () => {
        expect(snapToGrid({ x: 12, y: 18 }, 10)).toEqual({ x: 10, y: 20 });
      });
    });

    describe('getSnapPoints', () => {
      it('should get endpoint snap points for line', () => {
        const line = {
          id: 'line-1',
          type: 'line',
          layerId: 'layer-0',
          visible: true,
          locked: false,
          style: DEFAULT_STYLE,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 100 },
        };

        const snapPoints = getSnapPoints([line], { ...DEFAULT_SNAP, endpointSnap: true });
        expect(snapPoints.some(sp => sp.type === 'endpoint' && sp.point.x === 0 && sp.point.y === 0)).toBe(true);
      });
    });

    describe('findNearestSnapPoint', () => {
      it('should find nearest snap point', () => {
        const snapPoints = [
          { point: { x: 0, y: 0 }, type: 'endpoint' },
          { point: { x: 100, y: 100 }, type: 'endpoint' },
        ];

        const nearest = findNearestSnapPoint({ x: 5, y: 5 }, snapPoints, 20);
        expect(nearest).not.toBeNull();
        expect(nearest.point).toEqual({ x: 0, y: 0 });
      });
    });
  });

  describe('Command History', () => {
    let history;
    let value;

    beforeEach(() => {
      history = new CommandHistory();
      value = 0;
    });

    it('should execute command', () => {
      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => { value = 0; },
        redo: () => { value = 10; },
      });

      expect(value).toBe(10);
    });

    it('should undo command', () => {
      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => { value = 0; },
        redo: () => { value = 10; },
      });

      expect(history.undo()).toBe(true);
      expect(value).toBe(0);
    });

    it('should redo command', () => {
      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => { value = 0; },
        redo: () => { value = 10; },
      });

      history.undo();
      expect(history.redo()).toBe(true);
      expect(value).toBe(10);
    });

    it('should report canUndo correctly', () => {
      expect(history.canUndo()).toBe(false);

      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => {},
        redo: () => {},
      });

      expect(history.canUndo()).toBe(true);
    });
  });

  describe('Project Management', () => {
    describe('createNewProject', () => {
      it('should create new project with name', () => {
        const project = createNewProject('Test Project');
        expect(project.name).toBe('Test Project');
        expect(project.id).toBeTruthy();
      });

      it('should have default layers', () => {
        const project = createNewProject('Test');
        expect(project.layers.length).toBeGreaterThan(0);
      });

      it('should have PNG Building Board standards', () => {
        const project = createNewProject('Test');
        expect(project.metadata.standards).toContain('PNG Building Board Standards');
      });
    });
  });

  describe('Coordinate Transformations', () => {
    const viewport = {
      id: 'test',
      name: 'Test',
      bounds: { minX: -1000, minY: -1000, maxX: 1000, maxY: 1000 },
      zoom: 1,
      pan: { x: 0, y: 0 },
      rotation: 0,
      isActive: true,
    };
    const canvasSize = { width: 800, height: 600 };

    describe('screenToWorld', () => {
      it('should convert screen center to world origin', () => {
        const result = screenToWorld({ x: 400, y: 300 }, viewport, canvasSize);
        expect(result.x).toBeCloseTo(0);
        expect(result.y).toBeCloseTo(0);
      });
    });

    describe('worldToScreen', () => {
      it('should convert world origin to screen center', () => {
        const result = worldToScreen({ x: 0, y: 0 }, viewport, canvasSize);
        expect(result.x).toBeCloseTo(400);
        expect(result.y).toBeCloseTo(300);
      });
    });
  });

  describe('Default Constants', () => {
    it('should have valid default style', () => {
      expect(DEFAULT_STYLE.strokeColor).toBeTruthy();
      expect(DEFAULT_STYLE.strokeWidth).toBeGreaterThan(0);
    });

    it('should have valid default units for PNG', () => {
      expect(DEFAULT_UNITS.lengthUnit).toBe('m');
    });
  });
});
