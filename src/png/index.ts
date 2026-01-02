/**
 * PNG-Specific Modules Index
 * Central export for all Papua New Guinea specific functionality
 */

// Climate Analysis
export {
  getClimateZone,
  getClimateData,
  getClimateDataForProvince,
  getDesignFactors,
  calculateDesignRainfallIntensity,
  calculateDrainageRequirements,
  calculateWindLoad,
  analyzeThermalComfort,
  generateClimateReport,
} from './climate';

export type {
  ClimateData,
  ClimateDesignFactors,
  DrainageDesignParams,
  DrainageResult,
  WindLoadParams,
  WindLoadResult,
  ThermalComfortResult,
  ClimateReport,
} from './climate';

// Materials Database
export {
  PNG_TIMBER,
  PNG_CONCRETE_MATERIALS,
  PNG_STEEL,
  PNG_MASONRY,
  ALL_MATERIALS,
  getMaterialById,
  getMaterialsByCategory,
  getMaterialsByAvailability,
  searchMaterials,
  getMaterialsForApplication,
  getTermiteResistantMaterials,
  getMarineGradeMaterials,
  estimateMaterialCost,
} from './materials';

export type {
  Material,
  MaterialCategory,
  AvailabilityLevel,
  MaterialProperties,
  DurabilityProperties,
  SustainabilityProperties,
  MaterialCostEstimate,
} from './materials';

// Seismic Analysis
export {
  getSeismicZone,
  getSeismicZoneData,
  getSeismicDataForProvince,
  getSoilClassData,
  getImportanceFactor,
  getStructuralSystemData,
  getRecommendedSystems,
  calculateSeismicDesign,
  getFoundationRecommendations,
  generateSeismicReport,
} from './seismic';

export type {
  SeismicZoneData,
  SoilClass,
  SoilClassData,
  ImportanceCategory,
  ImportanceCategoryData,
  StructuralSystem,
  StructuralSystemData,
  SeismicDesignInput,
  SeismicDesignResult,
  FoundationRecommendation,
  SeismicReport,
} from './seismic';

// Structural Analysis
export {
  DEAD_LOADS,
  LIVE_LOADS,
  TIMBER_GRADES,
  designTimberBeam,
  designConcreteFooting,
  designRoofForPNG,
  generateLoadCombinations,
  generateStructuralReport,
} from './structural';

export type {
  LoadCase,
  LoadType,
  LoadCombination,
  TimberMemberDesign,
  ConcreteDesign,
  RoofDesignResult,
  StructuralReport,
} from './structural';

// Flood Analysis
export {
  getFloodZoneData,
  getTerrainFloodRisk,
  getRiverSystemsForProvince,
  estimateFloodLevels,
  designForFloodZone,
  PNG_RIVER_SYSTEMS,
  TRADITIONAL_FLOOD_HOUSING,
  generateFloodReport,
} from './flood';

export type {
  FloodZoneData,
  RiverSystemData,
  FloodLevelEstimate,
  FloodResistantDesign,
  TraditionalFloodHousing,
  FloodReport,
} from './flood';
