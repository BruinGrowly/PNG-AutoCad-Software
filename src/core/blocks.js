/**
 * CAD Blocks and Symbols
 * Reusable drawing components for civil engineering
 */

import { generateId, DEFAULT_STYLE } from './engine.js';
import { rotatePoint, scalePoint, addPoints } from './geometry.js';

// ============================================
// Block Definition
// ============================================

/**
 * Create a block definition
 */
export function createBlockDefinition(name, entities, basePoint = { x: 0, y: 0 }) {
  return {
    id: generateId(),
    name,
    basePoint,
    entities: entities.map(e => ({ ...e, id: generateId() })),
    createdAt: new Date(),
  };
}

/**
 * Insert a block instance
 */
export function insertBlock(blockDef, position, scale = 1, rotation = 0, layerId = 'layer-0') {
  return {
    id: generateId(),
    type: 'block',
    layerId,
    visible: true,
    locked: false,
    style: { ...DEFAULT_STYLE },
    blockId: blockDef.id,
    blockName: blockDef.name,
    position,
    scale,
    rotation,
    // Store transformed entities for rendering
    entities: transformBlockEntities(blockDef.entities, blockDef.basePoint, position, scale, rotation),
  };
}

/**
 * Transform block entities based on insertion point, scale, and rotation
 */
function transformBlockEntities(entities, basePoint, position, scale, rotation) {
  return entities.map(entity => {
    const transformed = { ...entity, id: generateId() };

    switch (entity.type) {
      case 'line':
        transformed.startPoint = transformPoint(entity.startPoint, basePoint, position, scale, rotation);
        transformed.endPoint = transformPoint(entity.endPoint, basePoint, position, scale, rotation);
        break;
      case 'circle':
        transformed.center = transformPoint(entity.center, basePoint, position, scale, rotation);
        transformed.radius = entity.radius * scale;
        break;
      case 'arc':
        transformed.center = transformPoint(entity.center, basePoint, position, scale, rotation);
        transformed.radius = entity.radius * scale;
        transformed.startAngle = entity.startAngle + rotation;
        transformed.endAngle = entity.endAngle + rotation;
        break;
      case 'rectangle':
        transformed.topLeft = transformPoint(entity.topLeft, basePoint, position, scale, rotation);
        transformed.width = entity.width * scale;
        transformed.height = entity.height * scale;
        break;
      case 'polyline':
        transformed.points = entity.points.map(p => transformPoint(p, basePoint, position, scale, rotation));
        break;
      case 'text':
        transformed.position = transformPoint(entity.position, basePoint, position, scale, rotation);
        transformed.fontSize = entity.fontSize * scale;
        transformed.rotation = (entity.rotation || 0) + rotation;
        break;
    }

    return transformed;
  });
}

function transformPoint(point, basePoint, position, scale, rotation) {
  // Translate to origin
  let p = { x: point.x - basePoint.x, y: point.y - basePoint.y };
  // Scale
  p = scalePoint(p, scale);
  // Rotate
  p = rotatePoint(p, { x: 0, y: 0 }, rotation);
  // Translate to position
  return addPoints(p, position);
}

// ============================================
// Standard Civil Engineering Symbols
// ============================================

/**
 * Create a north arrow symbol
 */
export function createNorthArrow(size = 20) {
  return createBlockDefinition('North Arrow', [
    // Arrow body
    { type: 'polyline', points: [
      { x: 0, y: size },
      { x: -size * 0.3, y: -size * 0.3 },
      { x: 0, y: 0 },
      { x: size * 0.3, y: -size * 0.3 },
      { x: 0, y: size },
    ], closed: true, style: { ...DEFAULT_STYLE, fillColor: '#000000' } },
    // N letter
    { type: 'text', position: { x: 0, y: size * 1.3 }, content: 'N', fontSize: size * 0.4, alignment: 'center' },
  ], { x: 0, y: 0 });
}

/**
 * Create a section marker
 */
export function createSectionMarker(label = 'A', size = 10) {
  return createBlockDefinition(`Section ${label}`, [
    { type: 'circle', center: { x: 0, y: 0 }, radius: size, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: -size, y: 0 }, endPoint: { x: size, y: 0 }, style: DEFAULT_STYLE },
    { type: 'text', position: { x: 0, y: size * 0.3 }, content: label, fontSize: size * 0.8, alignment: 'center' },
  ], { x: 0, y: 0 });
}

/**
 * Create a level marker
 */
export function createLevelMarker(elevation = '0.00', size = 8) {
  return createBlockDefinition(`Level ${elevation}`, [
    { type: 'polyline', points: [
      { x: -size, y: 0 },
      { x: 0, y: size },
      { x: size, y: 0 },
      { x: 0, y: -size },
      { x: -size, y: 0 },
    ], closed: true, style: DEFAULT_STYLE },
    { type: 'text', position: { x: size * 1.5, y: 0 }, content: elevation, fontSize: size * 0.6, alignment: 'left' },
  ], { x: 0, y: 0 });
}

/**
 * Create a door symbol (plan view)
 */
export function createDoorSymbol(width = 900, openingAngle = 90) {
  const angleRad = (openingAngle * Math.PI) / 180;
  return createBlockDefinition('Door', [
    // Door leaf
    { type: 'line', startPoint: { x: 0, y: 0 }, endPoint: { x: width, y: 0 }, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    // Swing arc
    { type: 'arc', center: { x: 0, y: 0 }, radius: width, startAngle: 0, endAngle: angleRad, style: { ...DEFAULT_STYLE, lineType: 'dashed' } },
    // Door swing line
    { type: 'line', startPoint: { x: 0, y: 0 }, endPoint: { x: width * Math.cos(angleRad), y: width * Math.sin(angleRad) }, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
  ], { x: 0, y: 0 });
}

/**
 * Create a window symbol (plan view)
 */
export function createWindowSymbol(width = 1200, wallThickness = 200) {
  const half = wallThickness / 2;
  return createBlockDefinition('Window', [
    // Wall opening
    { type: 'line', startPoint: { x: 0, y: -half }, endPoint: { x: 0, y: half }, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: width, y: -half }, endPoint: { x: width, y: half }, style: DEFAULT_STYLE },
    // Glass lines
    { type: 'line', startPoint: { x: 0, y: 0 }, endPoint: { x: width, y: 0 }, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    { type: 'line', startPoint: { x: width * 0.25, y: -half * 0.5 }, endPoint: { x: width * 0.25, y: half * 0.5 }, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: width * 0.75, y: -half * 0.5 }, endPoint: { x: width * 0.75, y: half * 0.5 }, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

/**
 * Create a column symbol
 */
export function createColumnSymbol(width = 300, depth = 300) {
  return createBlockDefinition('Column', [
    { type: 'rectangle', topLeft: { x: -width / 2, y: -depth / 2 }, width, height: depth, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    { type: 'line', startPoint: { x: -width / 2, y: -depth / 2 }, endPoint: { x: width / 2, y: depth / 2 }, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: width / 2, y: -depth / 2 }, endPoint: { x: -width / 2, y: depth / 2 }, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

/**
 * Create a toilet symbol (plan view)
 */
export function createToiletSymbol() {
  return createBlockDefinition('Toilet', [
    // Bowl
    { type: 'arc', center: { x: 0, y: 150 }, radius: 200, startAngle: Math.PI, endAngle: 0, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: -200, y: 150 }, endPoint: { x: -200, y: 0 }, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: 200, y: 150 }, endPoint: { x: 200, y: 0 }, style: DEFAULT_STYLE },
    // Tank
    { type: 'rectangle', topLeft: { x: -180, y: -150 }, width: 360, height: 150, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

/**
 * Create a sink symbol (plan view)
 */
export function createSinkSymbol() {
  return createBlockDefinition('Sink', [
    { type: 'rectangle', topLeft: { x: -250, y: -200 }, width: 500, height: 400, style: DEFAULT_STYLE },
    { type: 'circle', center: { x: 0, y: 0 }, radius: 30, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

/**
 * Create a tree symbol (plan view)
 */
export function createTreeSymbol(radius = 2000) {
  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? radius : radius * 0.7;
    points.push({ x: r * Math.cos(angle), y: r * Math.sin(angle) });
  }

  return createBlockDefinition('Tree', [
    { type: 'polyline', points, closed: true, style: { ...DEFAULT_STYLE, strokeColor: '#228B22' } },
    { type: 'circle', center: { x: 0, y: 0 }, radius: radius * 0.2, style: { ...DEFAULT_STYLE, strokeColor: '#8B4513' } },
  ], { x: 0, y: 0 });
}

/**
 * Create a manhole symbol
 */
export function createManholeSymbol(diameter = 600) {
  const r = diameter / 2;
  return createBlockDefinition('Manhole', [
    { type: 'circle', center: { x: 0, y: 0 }, radius: r, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    { type: 'circle', center: { x: 0, y: 0 }, radius: r * 0.7, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: -r * 0.5, y: -r * 0.5 }, endPoint: { x: r * 0.5, y: r * 0.5 }, style: DEFAULT_STYLE },
    { type: 'line', startPoint: { x: r * 0.5, y: -r * 0.5 }, endPoint: { x: -r * 0.5, y: r * 0.5 }, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

/**
 * Create a benchmark symbol
 */
export function createBenchmarkSymbol(size = 10) {
  return createBlockDefinition('Benchmark', [
    { type: 'polyline', points: [
      { x: 0, y: size },
      { x: -size, y: -size },
      { x: size, y: -size },
      { x: 0, y: size },
    ], closed: true, style: DEFAULT_STYLE },
    { type: 'circle', center: { x: 0, y: -size * 0.3 }, radius: size * 0.3, style: DEFAULT_STYLE },
  ], { x: 0, y: 0 });
}

// ============================================
// PNG-Specific Symbols
// ============================================

/**
 * Create a traditional haus symbol (simplified plan)
 */
export function createTraditionalHausSymbol(width = 6000, depth = 4000) {
  return createBlockDefinition('Traditional Haus', [
    // Main floor (raised)
    { type: 'rectangle', topLeft: { x: 0, y: 0 }, width, height: depth, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    // Support posts
    { type: 'circle', center: { x: 500, y: 500 }, radius: 100, style: { ...DEFAULT_STYLE, fillColor: '#8B4513' } },
    { type: 'circle', center: { x: width - 500, y: 500 }, radius: 100, style: { ...DEFAULT_STYLE, fillColor: '#8B4513' } },
    { type: 'circle', center: { x: 500, y: depth - 500 }, radius: 100, style: { ...DEFAULT_STYLE, fillColor: '#8B4513' } },
    { type: 'circle', center: { x: width - 500, y: depth - 500 }, radius: 100, style: { ...DEFAULT_STYLE, fillColor: '#8B4513' } },
    // Center post
    { type: 'circle', center: { x: width / 2, y: depth / 2 }, radius: 150, style: { ...DEFAULT_STYLE, fillColor: '#8B4513' } },
  ], { x: 0, y: 0 });
}

/**
 * Create a water tank symbol
 */
export function createWaterTankSymbol(diameter = 2000) {
  const r = diameter / 2;
  return createBlockDefinition('Water Tank', [
    { type: 'circle', center: { x: 0, y: 0 }, radius: r, style: { ...DEFAULT_STYLE, strokeWidth: 2, strokeColor: '#00BFFF' } },
    { type: 'text', position: { x: 0, y: 0 }, content: 'WT', fontSize: r * 0.5, alignment: 'center' },
  ], { x: 0, y: 0 });
}

/**
 * Create a septic tank symbol
 */
export function createSepticTankSymbol(width = 2000, depth = 1500) {
  return createBlockDefinition('Septic Tank', [
    { type: 'rectangle', topLeft: { x: -width / 2, y: -depth / 2 }, width, height: depth, style: { ...DEFAULT_STYLE, strokeWidth: 2 } },
    { type: 'line', startPoint: { x: -width / 2, y: 0 }, endPoint: { x: width / 2, y: 0 }, style: DEFAULT_STYLE },
    { type: 'text', position: { x: 0, y: -depth * 0.25 }, content: 'ST', fontSize: depth * 0.2, alignment: 'center' },
  ], { x: 0, y: 0 });
}

// ============================================
// Block Library
// ============================================

export const STANDARD_BLOCKS = {
  'north-arrow': createNorthArrow,
  'section-marker': createSectionMarker,
  'level-marker': createLevelMarker,
  'door': createDoorSymbol,
  'window': createWindowSymbol,
  'column': createColumnSymbol,
  'toilet': createToiletSymbol,
  'sink': createSinkSymbol,
  'tree': createTreeSymbol,
  'manhole': createManholeSymbol,
  'benchmark': createBenchmarkSymbol,
  'traditional-haus': createTraditionalHausSymbol,
  'water-tank': createWaterTankSymbol,
  'septic-tank': createSepticTankSymbol,
};

export function getStandardBlock(name, ...args) {
  const creator = STANDARD_BLOCKS[name];
  if (!creator) {
    throw new Error(`Unknown block: ${name}`);
  }
  return creator(...args);
}

export function listStandardBlocks() {
  return Object.keys(STANDARD_BLOCKS);
}
