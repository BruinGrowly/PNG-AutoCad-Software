/**
 * PNG Seismic Analysis Module
 * Earthquake and structural analysis for Papua New Guinea
 * Based on PNG Building Board requirements and AS/NZS 1170.4
 */

// ============================================
// Province to seismic zone mapping
// ============================================

const PROVINCE_SEISMIC_ZONES = {
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

const SEISMIC_ZONE_DATA = {
  'zone-1': {
    zone: 'zone-1',
    hazardFactor: 0.15,
    description: 'Low seismic hazard - Western lowlands',
    designSpectrum: { T0: 0.1, T1: 0.5, Sa0: 0.15, Sa1: 0.375 },
    faultProximity: 'far-fault',
    liquidationRisk: 'moderate',
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
// Soil Classification Data
// ============================================

const SOIL_CLASS_DATA = {
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

// ============================================
// Importance Categories
// ============================================

const IMPORTANCE_CATEGORIES = {
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

// ============================================
// Structural Systems
// ============================================

const STRUCTURAL_SYSTEMS = {
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

// ============================================
// Seismic Analysis Functions
// ============================================

export function getSeismicZone(province) {
  return PROVINCE_SEISMIC_ZONES[province];
}

export function getSeismicZoneData(zone) {
  return SEISMIC_ZONE_DATA[zone];
}

export function getSeismicDataForProvince(province) {
  const zone = getSeismicZone(province);
  return getSeismicZoneData(zone);
}

export function getSoilClassData(soilClass) {
  return SOIL_CLASS_DATA[soilClass];
}

export function getImportanceFactor(category) {
  return IMPORTANCE_CATEGORIES[category].importanceFactor;
}

export function getStructuralSystemData(system) {
  return STRUCTURAL_SYSTEMS[system];
}

export function getRecommendedSystems(zone) {
  return Object.entries(STRUCTURAL_SYSTEMS)
    .filter(([_, data]) => data.suitability.includes(zone))
    .map(([system, _]) => system);
}

// ============================================
// Seismic Design Calculations
// ============================================

export function calculateSeismicDesign(input) {
  const zoneData = getSeismicDataForProvince(input.province);
  const soilData = getSoilClassData(input.soilClass);
  const systemData = getStructuralSystemData(input.structuralSystem);

  const period = input.buildingPeriod ?? estimateBuildingPeriod(input);
  const Sa = calculateSpectralAcceleration(zoneData, period, soilData.siteFactor);

  const importanceFactor = getImportanceFactor(input.importanceCategory);
  const Cd = (Sa * importanceFactor) / (systemData.ductilityFactor * systemData.structuralPerformanceFactor);

  const V = Cd * input.buildingWeight;

  const distribution = calculateLateralForceDistribution(
    V,
    input.numberOfStoreys,
    input.buildingHeight
  );

  const recommendations = [...systemData.recommendations];
  const warnings = [];

  if (input.buildingHeight > systemData.heightLimit) {
    warnings.push(`Building height ${input.buildingHeight}m exceeds recommended limit of ${systemData.heightLimit}m for ${input.structuralSystem}`);
  }

  if (!systemData.suitability.includes(zoneData.zone)) {
    warnings.push(`Structural system ${input.structuralSystem} is NOT recommended for ${zoneData.zone}`);
  }

  if (soilData.liquidationPotential === 'high' || zoneData.liquidationRisk === 'high') {
    warnings.push('High liquefaction risk - consider ground improvement or deep foundations');
    recommendations.push('Conduct detailed geotechnical investigation');
    recommendations.push('Consider pile foundations to competent stratum');
  }

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

function estimateBuildingPeriod(input) {
  const coefficients = {
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

function calculateSpectralAcceleration(zoneData, period, siteFactor) {
  const { T0, T1, Sa0, Sa1 } = zoneData.designSpectrum;

  let Sa;
  if (period < T0) {
    Sa = Sa0 + (Sa1 - Sa0) * (period / T0);
  } else if (period <= T1) {
    Sa = Sa1;
  } else {
    Sa = Sa1 * (T1 / period);
  }

  return Sa * siteFactor;
}

function calculateLateralForceDistribution(baseShear, storeys, totalHeight) {
  const distribution = [];
  let sumWiHi = 0;

  const storeyHeight = totalHeight / storeys;

  for (let i = 1; i <= storeys; i++) {
    sumWiHi += i * storeyHeight;
  }

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

export function getFoundationRecommendations(zone, soilClass, buildingWeight, numberOfStoreys) {
  const recommendations = [];

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

export function generateSeismicReport(input) {
  const seismicData = getSeismicDataForProvince(input.province);
  const designResults = calculateSeismicDesign(input);
  const foundationRecommendations = getFoundationRecommendations(
    seismicData.zone,
    input.soilClass,
    input.buildingWeight,
    input.numberOfStoreys
  );

  const detailingRequirements = [];

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
