/**
 * Core CAD Engine - Handles drawing, selection, and entity management
 */

import { getEntityBoundingBox, boundingBoxContainsPoint, distance } from './geometry.js';

// ============================================
// Unique ID Generator
// ============================================

export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// Default Styles and Settings
// ============================================

/** @type {{ strokeColor: string, strokeWidth: number, opacity: number, lineType: string }} */
export const DEFAULT_STYLE = {
  strokeColor: '#000000',
  strokeWidth: 1,
  opacity: 1,
  lineType: 'continuous',
};

/** @type {{ visible: boolean, spacing: number, majorLineEvery: number, color: string, majorColor: string, opacity: number }} */
export const DEFAULT_GRID = {
  visible: true,
  spacing: 10,
  majorLineEvery: 10,
  color: '#e0e0e0',
  majorColor: '#c0c0c0',
  opacity: 0.5,
};

/** @type {Object} */
export const DEFAULT_SNAP = {
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

/** @type {{ lengthUnit: string, areaUnit: string, angleUnit: string, precision: number }} */
export const DEFAULT_UNITS = {
  lengthUnit: 'm',
  areaUnit: 'sqm',
  angleUnit: 'degrees',
  precision: 3,
};

// ============================================
// Layer Management
// ============================================

/**
 * Create a new layer
 * @param {string} name - Layer name
 * @param {string} color - Layer color (default: '#000000')
 * @returns {Object} Layer object
 */
export function createLayer(name, color = '#000000') {
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

export const DEFAULT_LAYERS = [
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

/**
 * Create a new entity
 * @param {string} type - Entity type
 * @param {Object} properties - Entity properties
 * @param {string} layerId - Layer ID (default: 'layer-0')
 * @param {Object} style - Entity style
 * @returns {Object} Entity object
 */
export function createEntity(type, properties, layerId = 'layer-0', style = {}) {
  return {
    id: generateId(),
    type,
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE, ...style },
    ...properties,
  };
}

// ============================================
// Entity Selection
// ============================================

/**
 * Check if a point is near an entity
 * @param {{ x: number, y: number }} point
 * @param {Object} entity
 * @param {number} tolerance
 * @returns {boolean}
 */
export function isPointNearEntity(point, entity, tolerance = 5) {
  const bbox = getEntityBoundingBox(entity);
  const expandedBbox = {
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

function distanceToLineSegment(point, lineStart, lineEnd) {
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

  let xx, yy;

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

function isPointNearRectangle(point, topLeft, width, height, tolerance) {
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

/**
 * Select entities within a bounding box
 * @param {Array} entities
 * @param {Object} box
 * @returns {Array}
 */
export function selectEntitiesInBox(entities, box) {
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

/**
 * Get snap points from entities
 * @param {Array} entities
 * @param {Object} settings
 * @returns {Array<{ point: { x: number, y: number }, type: string }>}
 */
export function getSnapPoints(entities, settings) {
  const snapPoints = [];

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

/**
 * Find nearest snap point
 * @param {{ x: number, y: number }} point
 * @param {Array} snapPoints
 * @param {number} maxDistance
 * @returns {Object|null}
 */
export function findNearestSnapPoint(point, snapPoints, maxDistance) {
  let nearest = null;
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

/**
 * Snap point to grid
 * @param {{ x: number, y: number }} point
 * @param {number} gridSpacing
 * @returns {{ x: number, y: number }}
 */
export function snapToGrid(point, gridSpacing) {
  return {
    x: Math.round(point.x / gridSpacing) * gridSpacing,
    y: Math.round(point.y / gridSpacing) * gridSpacing,
  };
}

// ============================================
// Command History (Undo/Redo)
// ============================================

export class CommandHistory {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = 100;
  }

  execute(command) {
    command.redo();
    this.undoStack.push(command);
    this.redoStack = [];

    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
  }

  undo() {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
      return true;
    }
    return false;
  }

  redo() {
    const command = this.redoStack.pop();
    if (command) {
      command.redo();
      this.undoStack.push(command);
      return true;
    }
    return false;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

// ============================================
// Entity Commands
// ============================================

export function createAddEntityCommand(entities, newEntity, setEntities) {
  return {
    id: generateId(),
    type: 'add-entity',
    timestamp: new Date(),
    data: newEntity,
    undo: () => setEntities(entities.filter(e => e.id !== newEntity.id)),
    redo: () => setEntities([...entities.filter(e => e.id !== newEntity.id), newEntity]),
  };
}

export function createDeleteEntityCommand(entities, entityId, setEntities) {
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

export function createModifyEntityCommand(entities, entityId, newProperties, setEntities) {
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
      updated[entityIndex] = newEntity;
      setEntities(updated);
    },
  };
}

// ============================================
// Viewport Management
// ============================================

export function createViewport(name) {
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

export function screenToWorld(screenPoint, viewport, canvasSize) {
  return {
    x: (screenPoint.x - canvasSize.width / 2 - viewport.pan.x) / viewport.zoom,
    y: (screenPoint.y - canvasSize.height / 2 - viewport.pan.y) / viewport.zoom,
  };
}

export function worldToScreen(worldPoint, viewport, canvasSize) {
  return {
    x: worldPoint.x * viewport.zoom + canvasSize.width / 2 + viewport.pan.x,
    y: worldPoint.y * viewport.zoom + canvasSize.height / 2 + viewport.pan.y,
  };
}

// ============================================
// Project Management
// ============================================

export function createNewProject(name) {
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
// Engine State
// ============================================

export function createInitialState(projectName = 'Untitled') {
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
