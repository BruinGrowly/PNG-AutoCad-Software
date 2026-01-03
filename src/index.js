/**
 * PNG Civil Engineering CAD Software
 * Main Entry Point
 *
 * A comprehensive CAD application designed specifically for
 * civil engineering projects in Papua New Guinea
 */

// Core CAD Engine
export * from './core/engine.js';
export * from './core/geometry.js';
export * from './core/types.js';
export * from './core/dimensions.js';
export * from './core/blocks.js';
export * from './core/hatch.js';
export * from './core/dxf.js';

// PNG Analysis Modules
export * from './png/climate.js';
export * from './png/seismic.js';
export * from './png/flood.js';
export * from './png/materials.js';
export * from './png/structural.js';

// Re-export for convenience
import * as engine from './core/engine.js';
import * as geometry from './core/geometry.js';
import * as types from './core/types.js';
import * as dimensions from './core/dimensions.js';
import * as blocks from './core/blocks.js';
import * as hatch from './core/hatch.js';
import * as dxf from './core/dxf.js';
import * as climate from './png/climate.js';
import * as seismic from './png/seismic.js';
import * as flood from './png/flood.js';
import * as materials from './png/materials.js';
import * as structural from './png/structural.js';

export const core = {
  ...engine,
  ...geometry,
  ...types,
  ...dimensions,
  ...blocks,
  ...hatch,
  ...dxf,
};

export const png = {
  climate,
  seismic,
  flood,
  materials,
  structural,
};

// Default export with all modules
export default {
  core,
  png,

  // Quick access to commonly used functions
  createNewProject: engine.createNewProject,
  createInitialState: engine.createInitialState,
  createLayer: engine.createLayer,
  createEntity: engine.createEntity,

  // PNG Analysis shortcuts
  getClimateDataForProvince: climate.getClimateDataForProvince,
  getSeismicDataForProvince: seismic.getSeismicDataForProvince,
  generateFloodReport: flood.generateFloodReport,
  getMaterialById: materials.getMaterialById,
  generateStructuralReport: structural.generateStructuralReport,

  // Geometry utilities
  distance: geometry.distance,
  distance3D: geometry.distance3D,
  latLongToUTM: geometry.latLongToUTM,

  // Dimension tools
  createLinearDimension: dimensions.createLinearDimension,
  createRadiusDimension: dimensions.createRadiusDimension,
  createAngularDimension: dimensions.createAngularDimension,
  measureDistance: dimensions.measureDistance,

  // Block tools
  createBlockDefinition: blocks.createBlockDefinition,
  insertBlock: blocks.insertBlock,
  STANDARD_BLOCKS: blocks.STANDARD_BLOCKS,

  // Hatch tools
  createHatch: hatch.createHatch,
  HATCH_PATTERNS: hatch.HATCH_PATTERNS,
  listHatchPatterns: hatch.listHatchPatterns,

  // DXF export/import
  exportToDXF: dxf.exportToDXF,
  downloadDXF: dxf.downloadDXF,
  parseDXF: dxf.parseDXF,
};
