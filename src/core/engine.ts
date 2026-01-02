/**
 * Core CAD Engine - Handles drawing, selection, and entity management
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Entity,
  Layer,
  Point2D,
  BoundingBox,
  DrawingTool,
  EntityStyle,
  LineType,
  Command,
  Project,
  UnitSettings,
  GridSettings,
  SnapSettings,
  Viewport,
} from './types';
import { getEntityBoundingBox, boundingBoxContainsPoint, distance } from './geometry';

// ============================================
// Unique ID Generator (fallback if uuid not available)
// ============================================

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// Default Styles and Settings
// ============================================

export const DEFAULT_STYLE: EntityStyle = {
  strokeColor: '#000000',
  strokeWidth: 1,
  opacity: 1,
  lineType: 'continuous',
};

export const DEFAULT_GRID: GridSettings = {
  visible: true,
  spacing: 10,
  majorLineEvery: 10,
  color: '#e0e0e0',
  majorColor: '#c0c0c0',
  opacity: 0.5,
};

export const DEFAULT_SNAP: SnapSettings = {
  enabled: true,
  gridSnap: true,
  endpointSnap: true,
  midpointSnap: true,
  centerSnap: true,
  intersectionSnap: true,
  perpendicularSnap: true,
  tangentSnap: false,
  nearestSnap: false,
  snapDistance: 10,
};

export const DEFAULT_UNITS: UnitSettings = {
  lengthUnit: 'm',
  areaUnit: 'sqm',
  angleUnit: 'degrees',
  precision: 3,
};

// ============================================
// Layer Management
// ============================================

export function createLayer(name: string, color: string = '#000000'): Layer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    color,
    lineType: 'continuous',
    lineWeight: 1,
    order: 0,
  };
}

export const DEFAULT_LAYERS: Layer[] = [
  { id: 'layer-0', name: '0', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 0 },
  { id: 'layer-construction', name: 'Construction', visible: true, locked: false, color: '#808080', lineType: 'dashed', lineWeight: 0.5, order: 1 },
  { id: 'layer-dimensions', name: 'Dimensions', visible: true, locked: false, color: '#0000FF', lineType: 'continuous', lineWeight: 0.5, order: 2 },
  { id: 'layer-text', name: 'Text', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 3 },
  { id: 'layer-structural', name: 'Structural', visible: true, locked: false, color: '#FF0000', lineType: 'continuous', lineWeight: 2, order: 4 },
  { id: 'layer-foundation', name: 'Foundation', visible: true, locked: false, color: '#8B4513', lineType: 'continuous', lineWeight: 2, order: 5 },
  { id: 'layer-drainage', name: 'Drainage', visible: true, locked: false, color: '#00BFFF', lineType: 'continuous', lineWeight: 1.5, order: 6 },
  { id: 'layer-electrical', name: 'Electrical', visible: true, locked: false, color: '#FFD700', lineType: 'continuous', lineWeight: 1, order: 7 },
  { id: 'layer-plumbing', name: 'Plumbing', visible: true, locked: false, color: '#00FF00', lineType: 'continuous', lineWeight: 1, order: 8 },
  { id: 'layer-site', name: 'Site', visible: true, locked: false, color: '#228B22', lineType: 'continuous', lineWeight: 1, order: 9 },
];

// ============================================
// Entity Creation
// ============================================

export function createEntity<T extends Entity>(
  type: T['type'],
  properties: Omit<T, 'id' | 'type' | 'visible' | 'locked' | 'style'>,
  layerId: string = 'layer-0',
  style: Partial<EntityStyle> = {}
): T {
  return {
    id: generateId(),
    type,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
    ...properties,
  } as T;
}

// ============================================
// Entity Selection
// ============================================

export function isPointNearEntity(point: Point2D, entity: Entity, tolerance: number = 5): boolean {
  const bbox = getEntityBoundingBox(entity);
  const expandedBbox: BoundingBox = {
    minX: bbox.minX - tolerance,
    minY: bbox.minY - tolerance,
    maxX: bbox.maxX + tolerance,
    maxY: bbox.maxY + tolerance,
  };

  if (!boundingBoxContainsPoint(expandedBbox, point)) {
    return false;
  }

  switch (entity.type) {
    case 'line':
      return distanceToLineSegment(point, entity.startPoint, entity.endPoint) <= tolerance;

    case 'polyline':
      for (let i = 0; i < entity.points.length - 1; i++) {
        if (distanceToLineSegment(point, entity.points[i], entity.points[i + 1]) <= tolerance) {
          return true;
        }
      }
      if (entity.closed && entity.points.length > 2) {
        return distanceToLineSegment(
          point,
          entity.points[entity.points.length - 1],
          entity.points[0]
        ) <= tolerance;
      }
      return false;

    case 'circle':
      const distToCenter = distance(point, entity.center);
      return Math.abs(distToCenter - entity.radius) <= tolerance;

    case 'rectangle':
      return isPointNearRectangle(point, entity.topLeft, entity.width, entity.height, tolerance);

    case 'text':
    case 'dimension':
    case 'hatch':
    case 'block':
      return boundingBoxContainsPoint(bbox, point);

    default:
      return false;
  }
}

function distanceToLineSegment(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx: number, yy: number;

  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }

  return distance(point, { x: xx, y: yy });
}

function isPointNearRectangle(
  point: Point2D,
  topLeft: Point2D,
  width: number,
  height: number,
  tolerance: number
): boolean {
  const corners = [
    topLeft,
    { x: topLeft.x + width, y: topLeft.y },
    { x: topLeft.x + width, y: topLeft.y + height },
    { x: topLeft.x, y: topLeft.y + height },
  ];

  for (let i = 0; i < 4; i++) {
    if (distanceToLineSegment(point, corners[i], corners[(i + 1) % 4]) <= tolerance) {
      return true;
    }
  }

  return false;
}

export function selectEntitiesInBox(entities: Entity[], box: BoundingBox): Entity[] {
  return entities.filter(entity => {
    const entityBox = getEntityBoundingBox(entity);
    return entityBox.minX >= box.minX &&
           entityBox.maxX <= box.maxX &&
           entityBox.minY >= box.minY &&
           entityBox.maxY <= box.maxY;
  });
}

// ============================================
// Snap Points
// ============================================

export interface SnapPoint {
  point: Point2D;
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'tangent' | 'nearest' | 'grid';
}

export function getSnapPoints(entities: Entity[], settings: SnapSettings): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];

  for (const entity of entities) {
    if (!entity.visible) continue;

    switch (entity.type) {
      case 'line':
        if (settings.endpointSnap) {
          snapPoints.push({ point: entity.startPoint, type: 'endpoint' });
          snapPoints.push({ point: entity.endPoint, type: 'endpoint' });
        }
        if (settings.midpointSnap) {
          snapPoints.push({
            point: {
              x: (entity.startPoint.x + entity.endPoint.x) / 2,
              y: (entity.startPoint.y + entity.endPoint.y) / 2,
            },
            type: 'midpoint',
          });
        }
        break;

      case 'polyline':
        if (settings.endpointSnap) {
          entity.points.forEach(p => snapPoints.push({ point: p, type: 'endpoint' }));
        }
        if (settings.midpointSnap) {
          for (let i = 0; i < entity.points.length - 1; i++) {
            snapPoints.push({
              point: {
                x: (entity.points[i].x + entity.points[i + 1].x) / 2,
                y: (entity.points[i].y + entity.points[i + 1].y) / 2,
              },
              type: 'midpoint',
            });
          }
        }
        break;

      case 'circle':
        if (settings.centerSnap) {
          snapPoints.push({ point: entity.center, type: 'center' });
        }
        if (settings.endpointSnap) {
          // Quadrant points
          snapPoints.push({ point: { x: entity.center.x + entity.radius, y: entity.center.y }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.center.x - entity.radius, y: entity.center.y }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.center.x, y: entity.center.y + entity.radius }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.center.x, y: entity.center.y - entity.radius }, type: 'endpoint' });
        }
        break;

      case 'rectangle':
        if (settings.endpointSnap) {
          snapPoints.push({ point: entity.topLeft, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
        }
        if (settings.midpointSnap) {
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height }, type: 'midpoint' });
          snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
        }
        if (settings.centerSnap) {
          snapPoints.push({
            point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height / 2 },
            type: 'center',
          });
        }
        break;
    }
  }

  return snapPoints;
}

export function findNearestSnapPoint(
  point: Point2D,
  snapPoints: SnapPoint[],
  maxDistance: number
): SnapPoint | null {
  let nearest: SnapPoint | null = null;
  let minDist = maxDistance;

  for (const sp of snapPoints) {
    const dist = distance(point, sp.point);
    if (dist < minDist) {
      minDist = dist;
      nearest = sp;
    }
  }

  return nearest;
}

// ============================================
// Grid Snap
// ============================================

export function snapToGrid(point: Point2D, gridSpacing: number): Point2D {
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing,
  };
}

// ============================================
// Command History (Undo/Redo)
// ============================================

export class CommandHistory {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxHistory: number = 100;

  execute(command: Command): void {
    command.redo();
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo(): boolean {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    return false;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ============================================
// Entity Commands
// ============================================

export function createAddEntityCommand(
  entities: Entity[],
  newEntity: Entity,
  setEntities: (entities: Entity[]) => void
): Command {
  return {
    id: generateId(),
    type: 'add-entity',
    timestamp: new Date(),
    data: newEntity,
    undo: () => setEntities(entities.filter(e => e.id !== newEntity.id)),
    redo: () => setEntities([...entities.filter(e => e.id !== newEntity.id), newEntity]),
  };
}

export function createDeleteEntityCommand(
  entities: Entity[],
  entityId: string,
  setEntities: (entities: Entity[]) => void
): Command {
  const entity = entities.find(e => e.id === entityId);
  if (!entity) throw new Error(`Entity ${entityId} not found`);

  return {
    id: generateId(),
    type: 'delete-entity',
    timestamp: new Date(),
    data: entity,
    undo: () => setEntities([...entities.filter(e => e.id !== entityId), entity]),
    redo: () => setEntities(entities.filter(e => e.id !== entityId)),
  };
}

export function createModifyEntityCommand(
  entities: Entity[],
  entityId: string,
  newProperties: Partial<Entity>,
  setEntities: (entities: Entity[]) => void
): Command {
  const entityIndex = entities.findIndex(e => e.id === entityId);
  if (entityIndex === -1) throw new Error(`Entity ${entityId} not found`);

  const oldEntity = { ...entities[entityIndex] };
  const newEntity = { ...oldEntity, ...newProperties };

  return {
    id: generateId(),
    type: 'modify-entity',
    timestamp: new Date(),
    data: { old: oldEntity, new: newEntity },
    undo: () => {
      const updated = [...entities];
      updated[entityIndex] = oldEntity;
      setEntities(updated);
    },
    redo: () => {
      const updated = [...entities];
      updated[entityIndex] = newEntity as Entity;
      setEntities(updated);
    },
  };
}

// ============================================
// Viewport Management
// ============================================

export function createViewport(name: string): Viewport {
  return {
    id: generateId(),
    name,
    bounds: { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 },
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
    isActive: false,
  };
}

export function screenToWorld(screenPoint: Point2D, viewport: Viewport, canvasSize: { width: number; height: number }): Point2D {
  return {
    x: (screenPoint.x - canvasSize.width / 2 - viewport.pan.x) / viewport.zoom,
    y: (screenPoint.y - canvasSize.height / 2 - viewport.pan.y) / viewport.zoom,
  };
}

export function worldToScreen(worldPoint: Point2D, viewport: Viewport, canvasSize: { width: number; height: number }): Point2D {
  return {
    x: worldPoint.x * viewport.zoom + canvasSize.width / 2 + viewport.pan.x,
    y: worldPoint.y * viewport.zoom + canvasSize.height / 2 + viewport.pan.y,
  };
}

// ============================================
// Project Management
// ============================================

export function createNewProject(name: string): Project {
  return {
    id: generateId(),
    name,
    description: '',
    createdAt: new Date(),
    modifiedAt: new Date(),
    author: '',
    location: {
      province: 'National Capital District',
      terrainType: 'coastal-lowland',
    },
    projectType: 'general',
    units: DEFAULT_UNITS,
    layers: [...DEFAULT_LAYERS],
    entities: [],
    blocks: [],
    viewports: [{ ...createViewport('Main'), isActive: true }],
    metadata: {
      standards: ['PNG Building Board Standards'],
    },
  };
}

// ============================================
// Export Engine State
// ============================================

export interface CADEngineState {
  project: Project;
  activeTool: DrawingTool;
  selectedEntityIds: string[];
  activeLayerId: string;
  gridSettings: GridSettings;
  snapSettings: SnapSettings;
  commandHistory: CommandHistory;
}

export function createInitialState(projectName: string = 'Untitled'): CADEngineState {
  return {
    project: createNewProject(projectName),
    activeTool: 'select',
    selectedEntityIds: [],
    activeLayerId: 'layer-0',
    gridSettings: DEFAULT_GRID,
    snapSettings: DEFAULT_SNAP,
    commandHistory: new CommandHistory(),
  };
}
