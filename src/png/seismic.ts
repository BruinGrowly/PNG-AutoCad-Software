/**
 * PNG Seismic Analysis Module
 * Earthquake and structural analysis for Papua New Guinea
 * Based on PNG Building Board requirements and AS/NZS 1170.4
 */

import type { PNGProvince, PNGSeismicZone, Point2D } from '../core/types';

// ============================================
// Seismic Zone Definitions
// ============================================

export interface SeismicZoneData {
  zone: PNGSeismicZone;
  hazardFactor: number;       // Z factor (0.1-0.6)
  description: string;
  designSpectrum: DesignSpectrum;
  faultProximity: 'near-fault' | 'far-fault';
  liquidationRisk: 'low' | 'moderate' | 'high';
}

export interface DesignSpectrum {
  T0: number;      // Period at start of plateau (seconds)
  T1: number;      // Period at end of plateau (seconds)
  Sa0: number;     // Spectral acceleration at T=0
  Sa1: number;     // Spectral acceleration at plateau
}

// Province to seismic zone mapping
const PROVINCE_SEISMIC_ZONES: Record<PNGProvince, PNGSeismicZone> = {
  // Very high seismic zone - near plate boundaries
  'Madang': 'zone-4',
  'East Sepik': 'zone-4',
  'Sandaun': 'zone-4',
  'Morobe': 'zone-4',
  'East New Britain': 'zone-4',
  'West New Britain': 'zone-4',
  'New Ireland': 'zone-4',
  'Autonomous Region of Bougainville': 'zone-4',
  'Manus': 'zone-4',

  // High seismic zone
  'Milne Bay': 'zone-3',
  'Oro': 'zone-3',
  'Gulf': 'zone-3',
  'Central': 'zone-3',
  'National Capital District': 'zone-3',

  // Moderate seismic zone - highlands
  'Eastern Highlands': 'zone-2',
  'Western Highlands': 'zone-2',
  'Southern Highlands': 'zone-2',
  'Enga': 'zone-2',
  'Simbu': 'zone-2',
  'Hela': 'zone-2',
  'Jiwaka': 'zone-2',

  // Lower seismic zone - western lowlands
  'Western': 'zone-1',
};

const SEISMIC_ZONE_DATA: Record<PNGSeismicZone, SeismicZoneData> = {
  'zone-1': {
    zone: 'zone-1',
    hazardFactor: 0.15,
    description: 'Low seismic hazard - Western lowlands',
    designSpectrum: { T0: 0.1, T1: 0.5, Sa0: 0.15, Sa1: 0.375 },
    faultProximity: 'far-fault',
    liquidationRisk: 'moderate', // Due to alluvial soils
  },
  'zone-2': {
    zone: 'zone-2',
    hazardFactor: 0.25,
    description: 'Moderate seismic hazard - Highlands region',
    designSpectrum: { T0: 0.1, T1: 0.5, Sa0: 0.25, Sa1: 0.625 },
    faultProximity: 'far-fault',
    liquidationRisk: 'low',
  },
  'zone-3': {
    zone: 'zone-3',
    hazardFactor: 0.35,
    description: 'High seismic hazard - Central and southern coast',
    designSpectrum: { T0: 0.1, T1: 0.5, Sa0: 0.35, Sa1: 0.875 },
    faultProximity: 'near-fault',
    liquidationRisk: 'moderate',
  },
  'zone-4': {
    zone: 'zone-4',
    hazardFactor: 0.50,
    description: 'Very high seismic hazard - Northern coast and islands (Ring of Fire)',
    designSpectrum: { T0: 0.1, T1: 0.5, Sa0: 0.50, Sa1: 1.25 },
    faultProximity: 'near-fault',
    liquidationRisk: 'high',
  },
};

// ============================================
// Seismic Analysis Functions
// ============================================

export function getSeismicZone(province: PNGProvince): PNGSeismicZone {
  return PROVINCE_SEISMIC_ZONES[province];
}

export function getSeismicZoneData(zone: PNGSeismicZone): SeismicZoneData {
  return SEISMIC_ZONE_DATA[zone];
}

export function getSeismicDataForProvince(province: PNGProvince): SeismicZoneData {
  const zone = getSeismicZone(province);
  return getSeismicZoneData(zone);
}

// ============================================
// Soil Classification
// ============================================

export type SoilClass = 'A' | 'B' | 'C' | 'D' | 'E';

export interface SoilClassData {
  class: SoilClass;
  description: string;
  siteFactor: number;
  shearWaveVelocity: { min: number; max: number }; // m/s
  amplificationFactor: number;
  liquidationPotential: 'none' | 'low' | 'moderate' | 'high';
}

const SOIL_CLASS_DATA: Record<SoilClass, SoilClassData> = {
  'A': {
    class: 'A',
    description: 'Strong rock',
    siteFactor: 0.8,
    shearWaveVelocity: { min: 1500, max: 99999 },
    amplificationFactor: 0.8,
    liquidationPotential: 'none',
  },
  'B': {
    class: 'B',
    description: 'Rock',
    siteFactor: 1.0,
    shearWaveVelocity: { min: 760, max: 1500 },
    amplificationFactor: 1.0,
    liquidationPotential: 'none',
  },
  'C': {
    class: 'C',
    description: 'Shallow soil - stiff/dense',
    siteFactor: 1.25,
    shearWaveVelocity: { min: 360, max: 760 },
    amplificationFactor: 1.25,
    liquidationPotential: 'low',
  },
  'D': {
    class: 'D',
    description: 'Deep or soft soil',
    siteFactor: 1.5,
    shearWaveVelocity: { min: 180, max: 360 },
    amplificationFactor: 1.5,
    liquidationPotential: 'moderate',
  },
  'E': {
    class: 'E',
    description: 'Very soft soil, >10m depth',
    siteFactor: 2.0,
    shearWaveVelocity: { min: 0, max: 180 },
    amplificationFactor: 2.0,
    liquidationPotential: 'high',
  },
};

export function getSoilClassData(soilClass: SoilClass): SoilClassData {
  return SOIL_CLASS_DATA[soilClass];
}

// ============================================
// Building Importance Categories
// ============================================

export type ImportanceCategory = 1 | 2 | 3 | 4;

export interface ImportanceCategoryData {
  category: ImportanceCategory;
  description: string;
  importanceFactor: number;
  examples: string[];
}

const IMPORTANCE_CATEGORIES: Record<ImportanceCategory, ImportanceCategoryData> = {
  1: {
    category: 1,
    description: 'Minor structures',
    importanceFactor: 0.9,
    examples: ['Farm buildings', 'Minor storage'],
  },
  2: {
    category: 2,
    description: 'Normal structures',
    importanceFactor: 1.0,
    examples: ['Houses', 'Offices', 'Shops'],
  },
  3: {
    category: 3,
    description: 'Important structures',
    importanceFactor: 1.3,
    examples: ['Schools', 'Churches', 'Community buildings'],
  },
  4: {
    category: 4,
    description: 'Essential facilities',
    importanceFactor: 1.5,
    examples: ['Hospitals', 'Emergency services', 'Power stations'],
  },
};

export function getImportanceFactor(category: ImportanceCategory): number {
  return IMPORTANCE_CATEGORIES[category].importanceFactor;
}

// ============================================
// Structural System Types
// ============================================

export type StructuralSystem =
  | 'timber-frame'
  | 'light-steel-frame'
  | 'masonry-unreinforced'
  | 'masonry-reinforced'
  | 'concrete-frame'
  | 'concrete-shear-wall'
  | 'steel-frame'
  | 'traditional-haus-tambaran';

export interface StructuralSystemData {
  system: StructuralSystem;
  description: string;
  ductilityFactor: number;       // μ - ductility
  structuralPerformanceFactor: number;  // Sp
  overstrengthFactor: number;    // Ωo
  heightLimit: number;           // meters (for PNG zones)
  suitability: PNGSeismicZone[];
  recommendations: string[];
}

const STRUCTURAL_SYSTEMS: Record<StructuralSystem, StructuralSystemData> = {
  'timber-frame': {
    system: 'timber-frame',
    description: 'Light timber frame construction',
    ductilityFactor: 3.0,
    structuralPerformanceFactor: 0.67,
    overstrengthFactor: 2.0,
    heightLimit: 10,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Use proper tie-down connections',
      'Brace walls adequately',
      'Connect roof to walls with straps',
      'Use ring beam at top plate level',
    ],
  },
  'light-steel-frame': {
    system: 'light-steel-frame',
    description: 'Light gauge steel frame',
    ductilityFactor: 2.5,
    structuralPerformanceFactor: 0.77,
    overstrengthFactor: 1.5,
    heightLimit: 12,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Use proprietary bracing systems',
      'Ensure adequate corrosion protection',
      'Follow manufacturer specifications',
    ],
  },
  'masonry-unreinforced': {
    system: 'masonry-unreinforced',
    description: 'Unreinforced masonry - NOT recommended in PNG',
    ductilityFactor: 1.0,
    structuralPerformanceFactor: 0.77,
    overstrengthFactor: 1.0,
    heightLimit: 6,
    suitability: ['zone-1'],
    recommendations: [
      'NOT RECOMMENDED - use reinforced masonry',
      'If used, limit to single storey',
      'Add ring beams at all floor/roof levels',
    ],
  },
  'masonry-reinforced': {
    system: 'masonry-reinforced',
    description: 'Reinforced concrete masonry',
    ductilityFactor: 2.0,
    structuralPerformanceFactor: 0.77,
    overstrengthFactor: 1.5,
    heightLimit: 15,
    suitability: ['zone-1', 'zone-2', 'zone-3'],
    recommendations: [
      'Grout all cells with vertical reinforcement',
      'Provide bond beams at all floor levels',
      'Use proper lap lengths for reinforcement',
      'Consider seismic detailing in zone-3',
    ],
  },
  'concrete-frame': {
    system: 'concrete-frame',
    description: 'Reinforced concrete moment frame',
    ductilityFactor: 4.0,
    structuralPerformanceFactor: 0.67,
    overstrengthFactor: 1.5,
    heightLimit: 50,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Use ductile detailing in zones 3-4',
      'Ensure strong column-weak beam design',
      'Provide adequate confinement at joints',
      'Consider capacity design principles',
    ],
  },
  'concrete-shear-wall': {
    system: 'concrete-shear-wall',
    description: 'Reinforced concrete shear wall system',
    ductilityFactor: 4.5,
    structuralPerformanceFactor: 0.67,
    overstrengthFactor: 1.5,
    heightLimit: 60,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Preferred system for high seismic zones',
      'Use ductile wall design',
      'Provide boundary elements',
      'Ensure adequate foundation capacity',
    ],
  },
  'steel-frame': {
    system: 'steel-frame',
    description: 'Structural steel moment frame',
    ductilityFactor: 5.0,
    structuralPerformanceFactor: 0.67,
    overstrengthFactor: 1.5,
    heightLimit: 100,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Use moment connections with adequate ductility',
      'Consider eccentrically braced frames',
      'Ensure connection capacity exceeds member capacity',
      'Provide corrosion protection for PNG climate',
    ],
  },
  'traditional-haus-tambaran': {
    system: 'traditional-haus-tambaran',
    description: 'Traditional PNG construction',
    ductilityFactor: 3.5,
    structuralPerformanceFactor: 0.67,
    overstrengthFactor: 1.5,
    heightLimit: 15,
    suitability: ['zone-1', 'zone-2', 'zone-3', 'zone-4'],
    recommendations: [
      'Traditional lashing provides good ductility',
      'Ensure adequate foundation embedment',
      'Use appropriate timber species',
      'Follow traditional building knowledge',
    ],
  },
};

export function getStructuralSystemData(system: StructuralSystem): StructuralSystemData {
  return STRUCTURAL_SYSTEMS[system];
}

export function getRecommendedSystems(zone: PNGSeismicZone): StructuralSystem[] {
  return Object.entries(STRUCTURAL_SYSTEMS)
    .filter(([_, data]) => data.suitability.includes(zone))
    .map(([system, _]) => system as StructuralSystem);
}

// ============================================
// Seismic Design Calculations
// ============================================

export interface SeismicDesignInput {
  province: PNGProvince;
  soilClass: SoilClass;
  importanceCategory: ImportanceCategory;
  structuralSystem: StructuralSystem;
  buildingHeight: number;      // meters
  buildingPeriod?: number;     // seconds (optional, will be estimated)
  buildingWeight: number;      // kN
  numberOfStoreys: number;
}

export interface SeismicDesignResult {
  seismicZone: PNGSeismicZone;
  hazardFactor: number;
  siteFactor: number;
  importanceFactor: number;
  ductilityFactor: number;
  structuralPerformanceFactor: number;
  buildingPeriod: number;
  spectralAcceleration: number;
  designBaseShear: number;     // kN
  designBaseShearCoefficient: number;
  lateralForceDistribution: { storey: number; force: number }[];
  recommendations: string[];
  warnings: string[];
}

export function calculateSeismicDesign(input: SeismicDesignInput): SeismicDesignResult {
  const zoneData = getSeismicDataForProvince(input.province);
  const soilData = getSoilClassData(input.soilClass);
  const systemData = getStructuralSystemData(input.structuralSystem);

  // Calculate building period if not provided
  const period = input.buildingPeriod ?? estimateBuildingPeriod(input);

  // Get spectral acceleration
  const Sa = calculateSpectralAcceleration(zoneData, period, soilData.siteFactor);

  // Calculate design base shear coefficient
  // Cd = Sa * I / (μ * Sp)
  const importanceFactor = getImportanceFactor(input.importanceCategory);
  const Cd = (Sa * importanceFactor) / (systemData.ductilityFactor * systemData.structuralPerformanceFactor);

  // Design base shear
  const V = Cd * input.buildingWeight;

  // Lateral force distribution
  const distribution = calculateLateralForceDistribution(
    V,
    input.numberOfStoreys,
    input.buildingHeight
  );

  // Generate recommendations and warnings
  const recommendations: string[] = [...systemData.recommendations];
  const warnings: string[] = [];

  // Check height limits
  if (input.buildingHeight > systemData.heightLimit) {
    warnings.push(`Building height ${input.buildingHeight}m exceeds recommended limit of ${systemData.heightLimit}m for ${input.structuralSystem}`);
  }

  // Check system suitability
  if (!systemData.suitability.includes(zoneData.zone)) {
    warnings.push(`Structural system ${input.structuralSystem} is NOT recommended for ${zoneData.zone}`);
  }

  // Liquefaction warning
  if (soilData.liquidationPotential === 'high' || zoneData.liquidationRisk === 'high') {
    warnings.push('High liquefaction risk - consider ground improvement or deep foundations');
    recommendations.push('Conduct detailed geotechnical investigation');
    recommendations.push('Consider pile foundations to competent stratum');
  }

  // Zone-specific recommendations
  if (zoneData.zone === 'zone-4') {
    recommendations.push('Engage structural engineer experienced in high seismic design');
    recommendations.push('Consider seismic isolation for essential facilities');
  }

  return {
    seismicZone: zoneData.zone,
    hazardFactor: zoneData.hazardFactor,
    siteFactor: soilData.siteFactor,
    importanceFactor,
    ductilityFactor: systemData.ductilityFactor,
    structuralPerformanceFactor: systemData.structuralPerformanceFactor,
    buildingPeriod: period,
    spectralAcceleration: Sa,
    designBaseShear: V,
    designBaseShearCoefficient: Cd,
    lateralForceDistribution: distribution,
    recommendations,
    warnings,
  };
}

function estimateBuildingPeriod(input: SeismicDesignInput): number {
  // Approximate period: T = Ct * h^x
  // Where Ct and x depend on structural system
  const coefficients: Record<StructuralSystem, { Ct: number; x: number }> = {
    'timber-frame': { Ct: 0.05, x: 0.75 },
    'light-steel-frame': { Ct: 0.05, x: 0.75 },
    'masonry-unreinforced': { Ct: 0.05, x: 0.75 },
    'masonry-reinforced': { Ct: 0.05, x: 0.75 },
    'concrete-frame': { Ct: 0.075, x: 0.75 },
    'concrete-shear-wall': { Ct: 0.05, x: 0.75 },
    'steel-frame': { Ct: 0.085, x: 0.75 },
    'traditional-haus-tambaran': { Ct: 0.05, x: 0.75 },
  };

  const { Ct, x } = coefficients[input.structuralSystem];
  return Ct * Math.pow(input.buildingHeight, x);
}

function calculateSpectralAcceleration(
  zoneData: SeismicZoneData,
  period: number,
  siteFactor: number
): number {
  const { T0, T1, Sa0, Sa1 } = zoneData.designSpectrum;

  let Sa: number;
  if (period < T0) {
    // Linear interpolation from Sa0 at T=0 to Sa1 at T=T0
    Sa = Sa0 + (Sa1 - Sa0) * (period / T0);
  } else if (period <= T1) {
    // Plateau region
    Sa = Sa1;
  } else {
    // Descending branch: Sa = Sa1 * (T1/T)
    Sa = Sa1 * (T1 / period);
  }

  return Sa * siteFactor;
}

function calculateLateralForceDistribution(
  baseShear: number,
  storeys: number,
  totalHeight: number
): { storey: number; force: number }[] {
  // Distribute force using inverted triangular distribution
  // Fi = V * (wi * hi) / Σ(wi * hi)
  // Assuming equal floor weights

  const distribution: { storey: number; force: number }[] = [];
  let sumWiHi = 0;

  const storeyHeight = totalHeight / storeys;

  // Calculate Σ(wi * hi)
  for (let i = 1; i <= storeys; i++) {
    sumWiHi += i * storeyHeight;
  }

  // Calculate force at each storey
  for (let i = 1; i <= storeys; i++) {
    const hi = i * storeyHeight;
    const force = (baseShear * hi) / sumWiHi;
    distribution.push({ storey: i, force });
  }

  return distribution;
}

// ============================================
// Foundation Recommendations
// ============================================

export interface FoundationRecommendation {
  type: 'pad-footing' | 'strip-footing' | 'raft' | 'piles' | 'traditional-post';
  description: string;
  suitability: string;
  considerations: string[];
}

export function getFoundationRecommendations(
  zone: PNGSeismicZone,
  soilClass: SoilClass,
  buildingWeight: number,
  numberOfStoreys: number
): FoundationRecommendation[] {
  const recommendations: FoundationRecommendation[] = [];

  // Traditional post foundation - suitable for lightweight
  if (numberOfStoreys <= 2 && buildingWeight < 500) {
    recommendations.push({
      type: 'traditional-post',
      description: 'Treated timber posts embedded in ground',
      suitability: 'Suitable for lightweight timber construction',
      considerations: [
        'Use termite-treated posts',
        'Minimum embedment 600mm',
        'Concrete collar at ground level helps prevent rot',
        'Traditional method proven in PNG conditions',
      ],
    });
  }

  // Pad footings
  if (soilClass !== 'E' && numberOfStoreys <= 3) {
    recommendations.push({
      type: 'pad-footing',
      description: 'Isolated pad footings under columns',
      suitability: 'Suitable for frame structures on competent soil',
      considerations: [
        zone === 'zone-4' ? 'Provide tie beams between footings' : '',
        'Minimum depth below ground 450mm',
        'Size based on soil bearing capacity',
      ].filter(Boolean),
    });
  }

  // Strip footings
  if (soilClass !== 'E') {
    recommendations.push({
      type: 'strip-footing',
      description: 'Continuous strip footing under walls',
      suitability: 'Suitable for masonry and wall structures',
      considerations: [
        'Provide reinforcement for seismic zones',
        'Minimum width 400mm for single storey',
        'Increase width for poor soils',
      ],
    });
  }

  // Raft foundation
  if (soilClass === 'D' || soilClass === 'E' || numberOfStoreys > 2) {
    recommendations.push({
      type: 'raft',
      description: 'Reinforced concrete raft/mat foundation',
      suitability: 'Suitable for poor soils or larger buildings',
      considerations: [
        'Provides uniform load distribution',
        'Good for liquefaction-prone areas',
        'More expensive but provides redundancy',
        'Recommended for essential facilities',
      ],
    });
  }

  // Pile foundation
  if (soilClass === 'E' || zone === 'zone-4' || buildingWeight > 2000) {
    recommendations.push({
      type: 'piles',
      description: 'Driven or bored piles to competent stratum',
      suitability: 'Required for very soft soils or high seismic risk',
      considerations: [
        'Transfer load to competent bearing stratum',
        'Design for both axial and lateral loads',
        'Consider pile caps and tie beams',
        'Specialist contractor required',
      ],
    });
  }

  return recommendations;
}

// ============================================
// Seismic Report Generation
// ============================================

export interface SeismicReport {
  location: PNGProvince;
  seismicData: SeismicZoneData;
  designResults: SeismicDesignResult;
  foundationRecommendations: FoundationRecommendation[];
  detailingRequirements: string[];
  referenceStandards: string[];
}

export function generateSeismicReport(input: SeismicDesignInput): SeismicReport {
  const seismicData = getSeismicDataForProvince(input.province);
  const designResults = calculateSeismicDesign(input);
  const foundationRecommendations = getFoundationRecommendations(
    seismicData.zone,
    input.soilClass,
    input.buildingWeight,
    input.numberOfStoreys
  );

  const detailingRequirements: string[] = [];

  // Zone-specific detailing
  if (seismicData.zone === 'zone-3' || seismicData.zone === 'zone-4') {
    detailingRequirements.push('Ductile detailing required for all structural elements');
    detailingRequirements.push('Capacity design principles must be applied');
    detailingRequirements.push('Special seismic hooks on stirrups (135° minimum)');
    detailingRequirements.push('Close stirrup spacing in plastic hinge regions');
  }

  if (seismicData.zone === 'zone-4') {
    detailingRequirements.push('Joint reinforcement required in beam-column connections');
    detailingRequirements.push('Confinement reinforcement in columns');
    detailingRequirements.push('Boundary elements in shear walls');
  }

  // General requirements
  detailingRequirements.push('All structural connections must be designed for seismic forces');
  detailingRequirements.push('Non-structural elements must be properly braced');
  detailingRequirements.push('Services must have flexible connections');

  return {
    location: input.province,
    seismicData,
    designResults,
    foundationRecommendations,
    detailingRequirements,
    referenceStandards: [
      'PNG Building Board Requirements',
      'AS/NZS 1170.4 Structural Design Actions - Earthquake Actions',
      'AS 3600 Concrete Structures (seismic provisions)',
      'AS 4100 Steel Structures (seismic provisions)',
      'NZS 3604 Timber-framed buildings',
    ],
  };
}
