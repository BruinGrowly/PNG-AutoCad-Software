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
import * as climate from './png/climate.js';
import * as seismic from './png/seismic.js';
import * as flood from './png/flood.js';
import * as materials from './png/materials.js';
import * as structural from './png/structural.js';

export const core = {
  ...engine,
  ...geometry,
  ...types,
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
};
