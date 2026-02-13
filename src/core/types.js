/**
 * Core type definitions for PNG Civil Engineering CAD
 * Using JSDoc for type documentation in JavaScript
 */

// ============================================
// PNG Province List
// ============================================

export const PNG_PROVINCES = [
  'Central',
  'East New Britain',
  'East Sepik',
  'Eastern Highlands',
  'Enga',
  'Gulf',
  'Hela',
  'Jiwaka',
  'Madang',
  'Manus',
  'Milne Bay',
  'Morobe',
  'National Capital District',
  'New Ireland',
  'Oro',
  'Sandaun',
  'Simbu',
  'Southern Highlands',
  'West New Britain',
  'Western',
  'Western Highlands',
  'Autonomous Region of Bougainville',
];

// ============================================
// Terrain Types
// ============================================

export const TERRAIN_TYPES = [
  'coastal-lowland',
  'riverine-floodplain',
  'highland-valley',
  'mountainous',
  'island-atoll',
  'swamp-wetland',
];

// ============================================
// Climate Zones
// ============================================

export const CLIMATE_ZONES = [
  'tropical-coastal',
  'tropical-highland',
  'tropical-monsoon',
  'tropical-island',
];

// ============================================
// Seismic Zones
// ============================================

export const SEISMIC_ZONES = ['zone-1', 'zone-2', 'zone-3', 'zone-4'];

// ============================================
// Flood Zones
// ============================================

export const FLOOD_ZONES = ['minimal', 'moderate', 'high', 'very-high'];

// ============================================
// Entity Types
// ============================================

export const ENTITY_TYPES = [
  'line',
  'polyline',
  'circle',
  'arc',
  'rectangle',
  'polygon',
  'text',
  'dimension',
  'hatch',
  'block',
  'image',
];

// ============================================
// Line Types
// ============================================

export const LINE_TYPES = [
  'continuous',
  'dashed',
  'dotted',
  'dashdot',
  'center',
  'hidden',
  'phantom',
];

// ============================================
// Hatch Patterns
// ============================================

export const HATCH_PATTERNS = [
  'solid',
  'ansi31',
  'ansi32',
  'ansi33',
  'ansi34',
  'ansi35',
  'ansi36',
  'ansi37',
  'ansi38',
  'concrete',
  'earth',
  'gravel',
  'sand',
  'water',
  'grass',
  'timber',
];

// ============================================
// Drawing Tools
// ============================================

export const DRAWING_TOOLS = [
  'select',
  'pan',
  'zoom',
  'line',
  'polyline',
  'circle',
  'arc',
  'rectangle',
  'polygon',
  'text',
  'dimension',
  'hatch',
  'block',
  'measure',
  'trim',
  'extend',
  'offset',
  'mirror',
  'rotate',
  'scale',
  'array',
];

// ============================================
// Measurement Units
// ============================================

export const MEASUREMENT_UNITS = ['mm', 'm', 'km', 'inches', 'feet'];

// ============================================
// Project Types
// ============================================

export const PROJECT_TYPES = [
  'building',
  'road',
  'bridge',
  'water-supply',
  'drainage',
  'sanitation',
  'site-plan',
  'survey',
  'general',
];

// ============================================
// Block Categories
// ============================================

export const BLOCK_CATEGORIES = [
  'structural',
  'electrical',
  'plumbing',
  'furniture',
  'landscaping',
  'civil',
  'annotation',
  'png-specific',
];

// ============================================
// Default Values
// ============================================

export const DEFAULT_STYLE = {
  strokeColor: '#000000',
  strokeWidth: 1,
  fillColor: undefined,
  opacity: 1,
  lineType: 'continuous',
};

export const DEFAULT_GRID = {
  visible: true,
  spacing: 10,
  majorLineEvery: 10,
  color: '#e0e0e0',
  majorColor: '#c0c0c0',
  opacity: 0.5,
};

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

export const DEFAULT_UNITS = {
  lengthUnit: 'm',
  areaUnit: 'sqm',
  angleUnit: 'degrees',
  precision: 3,
};
