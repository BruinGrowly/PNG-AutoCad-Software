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
} from '../../src/core/engine';
import type { LineEntity, CircleEntity, RectangleEntity, Entity } from '../../src/core/types';

describe('CAD Engine', () => {
  // ==========================================
  // Layer Management
  // ==========================================
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

      it('should use default color if not specified', () => {
        const layer = createLayer('Default Layer');
        expect(layer.color).toBe('#000000');
      });

      it('should generate unique IDs', () => {
        const layer1 = createLayer('Layer 1');
        const layer2 = createLayer('Layer 2');
        expect(layer1.id).not.toBe(layer2.id);
      });
    });

    describe('DEFAULT_LAYERS', () => {
      it('should have standard CAD layers', () => {
        expect(DEFAULT_LAYERS.length).toBeGreaterThan(0);
        expect(DEFAULT_LAYERS.find(l => l.name === '0')).toBeTruthy();
        expect(DEFAULT_LAYERS.find(l => l.name === 'Structural')).toBeTruthy();
        expect(DEFAULT_LAYERS.find(l => l.name === 'Foundation')).toBeTruthy();
        expect(DEFAULT_LAYERS.find(l => l.name === 'Drainage')).toBeTruthy();
      });

      it('should have unique IDs', () => {
        const ids = DEFAULT_LAYERS.map(l => l.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });
  });

  // ==========================================
  // Entity Creation
  // ==========================================
  describe('Entity Creation', () => {
    describe('createEntity', () => {
      it('should create a line entity', () => {
        const line = createEntity<LineEntity>('line', {
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
        });

        expect(line.type).toBe('line');
        expect(line.id).toBeTruthy();
        expect(line.visible).toBe(true);
        expect(line.locked).toBe(false);
        expect(line.startPoint).toEqual({ x: 0, y: 0 });
        expect(line.endPoint).toEqual({ x: 10, y: 10 });
      });

      it('should create entity with custom layer', () => {
        const line = createEntity<LineEntity>('line', {
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
        }, 'layer-structural');

        expect(line.layerId).toBe('layer-structural');
      });

      it('should create entity with custom style', () => {
        const line = createEntity<LineEntity>('line', {
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
        }, 'layer-0', { strokeColor: '#FF0000', strokeWidth: 2 });

        expect(line.style.strokeColor).toBe('#FF0000');
        expect(line.style.strokeWidth).toBe(2);
      });

      it('should create a circle entity', () => {
        const circle = createEntity<CircleEntity>('circle', {
          center: { x: 50, y: 50 },
          radius: 25,
        });

        expect(circle.type).toBe('circle');
        expect(circle.center).toEqual({ x: 50, y: 50 });
        expect(circle.radius).toBe(25);
      });

      it('should create a rectangle entity', () => {
        const rect = createEntity<RectangleEntity>('rectangle', {
          topLeft: { x: 0, y: 0 },
          width: 100,
          height: 50,
        });

        expect(rect.type).toBe('rectangle');
        expect(rect.width).toBe(100);
        expect(rect.height).toBe(50);
      });
    });
  });

  // ==========================================
  // Entity Selection
  // ==========================================
  describe('Entity Selection', () => {
    let testLine: LineEntity;
    let testCircle: CircleEntity;
    let testRect: RectangleEntity;

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

      testRect = {
        id: 'rect-1',
        type: 'rectangle',
        layerId: 'layer-0',
        visible: true,
        locked: false,
        style: DEFAULT_STYLE,
        topLeft: { x: 100, y: 100 },
        width: 50,
        height: 30,
      };
    });

    describe('isPointNearEntity', () => {
      it('should detect point on line', () => {
        expect(isPointNearEntity({ x: 50, y: 0 }, testLine, 5)).toBe(true);
      });

      it('should detect point near line', () => {
        expect(isPointNearEntity({ x: 50, y: 3 }, testLine, 5)).toBe(true);
      });

      it('should not detect point far from line', () => {
        expect(isPointNearEntity({ x: 50, y: 50 }, testLine, 5)).toBe(false);
      });

      it('should detect point on circle', () => {
        expect(isPointNearEntity({ x: 75, y: 50 }, testCircle, 5)).toBe(true);
      });

      it('should not detect point inside circle', () => {
        expect(isPointNearEntity({ x: 50, y: 50 }, testCircle, 5)).toBe(false);
      });

      it('should detect point on rectangle edge', () => {
        expect(isPointNearEntity({ x: 125, y: 100 }, testRect, 5)).toBe(true);
      });
    });

    describe('selectEntitiesInBox', () => {
      it('should select entities inside box', () => {
        const entities: Entity[] = [testLine, testCircle, testRect];
        const box = { minX: 20, minY: 20, maxX: 80, maxY: 80 };
        const selected = selectEntitiesInBox(entities, box);
        expect(selected).toContainEqual(testCircle);
      });

      it('should not select entities outside box', () => {
        const entities: Entity[] = [testLine, testCircle, testRect];
        const box = { minX: 200, minY: 200, maxX: 300, maxY: 300 };
        const selected = selectEntitiesInBox(entities, box);
        expect(selected.length).toBe(0);
      });
    });
  });

  // ==========================================
  // Snap System
  // ==========================================
  describe('Snap System', () => {
    describe('snapToGrid', () => {
      it('should snap to nearest grid point', () => {
        expect(snapToGrid({ x: 12, y: 18 }, 10)).toEqual({ x: 10, y: 20 });
      });

      it('should snap exact grid point', () => {
        expect(snapToGrid({ x: 20, y: 30 }, 10)).toEqual({ x: 20, y: 30 });
      });

      it('should handle small grid spacing', () => {
        expect(snapToGrid({ x: 2.3, y: 4.7 }, 1)).toEqual({ x: 2, y: 5 });
      });
    });

    describe('getSnapPoints', () => {
      it('should get endpoint snap points for line', () => {
        const line: LineEntity = {
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
        expect(snapPoints.some(sp => sp.type === 'endpoint' && sp.point.x === 100 && sp.point.y === 100)).toBe(true);
      });

      it('should get midpoint snap points for line', () => {
        const line: LineEntity = {
          id: 'line-1',
          type: 'line',
          layerId: 'layer-0',
          visible: true,
          locked: false,
          style: DEFAULT_STYLE,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 0 },
        };

        const snapPoints = getSnapPoints([line], { ...DEFAULT_SNAP, midpointSnap: true });
        expect(snapPoints.some(sp => sp.type === 'midpoint' && sp.point.x === 50 && sp.point.y === 0)).toBe(true);
      });

      it('should get center snap point for circle', () => {
        const circle: CircleEntity = {
          id: 'circle-1',
          type: 'circle',
          layerId: 'layer-0',
          visible: true,
          locked: false,
          style: DEFAULT_STYLE,
          center: { x: 50, y: 50 },
          radius: 25,
        };

        const snapPoints = getSnapPoints([circle], { ...DEFAULT_SNAP, centerSnap: true });
        expect(snapPoints.some(sp => sp.type === 'center' && sp.point.x === 50 && sp.point.y === 50)).toBe(true);
      });

      it('should not include snap points for invisible entities', () => {
        const line: LineEntity = {
          id: 'line-1',
          type: 'line',
          layerId: 'layer-0',
          visible: false,
          locked: false,
          style: DEFAULT_STYLE,
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 100, y: 100 },
        };

        const snapPoints = getSnapPoints([line], DEFAULT_SNAP);
        expect(snapPoints.length).toBe(0);
      });
    });

    describe('findNearestSnapPoint', () => {
      it('should find nearest snap point', () => {
        const snapPoints = [
          { point: { x: 0, y: 0 }, type: 'endpoint' as const },
          { point: { x: 100, y: 100 }, type: 'endpoint' as const },
        ];

        const nearest = findNearestSnapPoint({ x: 5, y: 5 }, snapPoints, 20);
        expect(nearest).not.toBeNull();
        expect(nearest!.point).toEqual({ x: 0, y: 0 });
      });

      it('should return null if no snap point in range', () => {
        const snapPoints = [
          { point: { x: 100, y: 100 }, type: 'endpoint' as const },
        ];

        const nearest = findNearestSnapPoint({ x: 0, y: 0 }, snapPoints, 10);
        expect(nearest).toBeNull();
      });
    });
  });

  // ==========================================
  // Command History
  // ==========================================
  describe('Command History', () => {
    let history: CommandHistory;
    let value: number;

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

    it('should report canRedo correctly', () => {
      expect(history.canRedo()).toBe(false);

      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => {},
        redo: () => {},
      });

      expect(history.canRedo()).toBe(false);
      history.undo();
      expect(history.canRedo()).toBe(true);
    });

    it('should clear redo stack on new command', () => {
      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => {},
        redo: () => {},
      });

      history.undo();
      expect(history.canRedo()).toBe(true);

      history.execute({
        id: '2',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => {},
        redo: () => {},
      });

      expect(history.canRedo()).toBe(false);
    });

    it('should clear history', () => {
      history.execute({
        id: '1',
        type: 'test',
        timestamp: new Date(),
        data: null,
        undo: () => {},
        redo: () => {},
      });

      history.clear();
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  // ==========================================
  // Project Management
  // ==========================================
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

      it('should have default viewport', () => {
        const project = createNewProject('Test');
        expect(project.viewports.length).toBeGreaterThan(0);
        expect(project.viewports[0].isActive).toBe(true);
      });

      it('should have PNG Building Board standards', () => {
        const project = createNewProject('Test');
        expect(project.metadata.standards).toContain('PNG Building Board Standards');
      });

      it('should default to NCD location', () => {
        const project = createNewProject('Test');
        expect(project.location.province).toBe('National Capital District');
      });
    });

    describe('createViewport', () => {
      it('should create viewport with name', () => {
        const viewport = createViewport('View 1');
        expect(viewport.name).toBe('View 1');
        expect(viewport.zoom).toBe(1);
        expect(viewport.pan).toEqual({ x: 0, y: 0 });
      });
    });
  });

  // ==========================================
  // Coordinate Transformations
  // ==========================================
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

      it('should handle zoom', () => {
        const zoomedViewport = { ...viewport, zoom: 2 };
        const result = screenToWorld({ x: 500, y: 300 }, zoomedViewport, canvasSize);
        expect(result.x).toBeCloseTo(50);
      });

      it('should handle pan', () => {
        const pannedViewport = { ...viewport, pan: { x: 100, y: 50 } };
        const result = screenToWorld({ x: 400, y: 300 }, pannedViewport, canvasSize);
        expect(result.x).toBeCloseTo(-100);
        expect(result.y).toBeCloseTo(-50);
      });
    });

    describe('worldToScreen', () => {
      it('should convert world origin to screen center', () => {
        const result = worldToScreen({ x: 0, y: 0 }, viewport, canvasSize);
        expect(result.x).toBeCloseTo(400);
        expect(result.y).toBeCloseTo(300);
      });

      it('should handle zoom', () => {
        const zoomedViewport = { ...viewport, zoom: 2 };
        const result = worldToScreen({ x: 50, y: 0 }, zoomedViewport, canvasSize);
        expect(result.x).toBeCloseTo(500);
      });

      it('should be inverse of screenToWorld', () => {
        const screenPoint = { x: 200, y: 150 };
        const worldPoint = screenToWorld(screenPoint, viewport, canvasSize);
        const backToScreen = worldToScreen(worldPoint, viewport, canvasSize);
        expect(backToScreen.x).toBeCloseTo(screenPoint.x);
        expect(backToScreen.y).toBeCloseTo(screenPoint.y);
      });
    });
  });

  // ==========================================
  // Default Constants
  // ==========================================
  describe('Default Constants', () => {
    it('should have valid default style', () => {
      expect(DEFAULT_STYLE.strokeColor).toBeTruthy();
      expect(DEFAULT_STYLE.strokeWidth).toBeGreaterThan(0);
      expect(DEFAULT_STYLE.opacity).toBe(1);
    });

    it('should have valid default grid', () => {
      expect(DEFAULT_GRID.spacing).toBeGreaterThan(0);
      expect(DEFAULT_GRID.majorLineEvery).toBeGreaterThan(0);
    });

    it('should have valid default snap', () => {
      expect(DEFAULT_SNAP.snapDistance).toBeGreaterThan(0);
    });

    it('should have valid default units for PNG', () => {
      expect(DEFAULT_UNITS.lengthUnit).toBe('m');
      expect(DEFAULT_UNITS.areaUnit).toBe('sqm');
    });
  });
});
