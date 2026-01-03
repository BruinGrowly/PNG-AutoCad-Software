/**
 * Design Safety and Validation Module
 *
 * Comprehensive design validation, wind/cyclone loading, and safety checks
 * for civil engineering in Papua New Guinea.
 *
 * Based on:
 * - AS/NZS 1170.2 Wind Actions
 * - PNG Building Board requirements
 * - Pacific Quality Infrastructure Principles
 * - ASCE 7 (for reference)
 */

// ============================================
// Wind/Cyclone Zones for PNG
// ============================================

/**
 * PNG wind regions based on cyclone exposure
 * Updated to align with AS/NZS 1170.2 methodology
 */
export const PNG_WIND_REGIONS = {
  'A': {
    region: 'A',
    name: 'Non-cyclonic',
    description: 'Highlands and inland areas - low wind hazard',
    provinces: ['Eastern Highlands', 'Western Highlands', 'Southern Highlands', 'Enga', 'Simbu', 'Hela', 'Jiwaka'],
    regionalWindSpeed: 45, // m/s for 500-year return
    cycloneRisk: 'negligible',
    designWindSpeed: {
      importance1: 37,
      importance2: 41,
      importance3: 45,
      importance4: 48,
    },
  },
  'B': {
    region: 'B',
    name: 'Intermediate',
    description: 'Southern coast and Gulf - moderate wind hazard',
    provinces: ['Central', 'Gulf', 'Western', 'National Capital District', 'Oro'],
    regionalWindSpeed: 55, // m/s for 500-year return
    cycloneRisk: 'low',
    designWindSpeed: {
      importance1: 45,
      importance2: 50,
      importance3: 55,
      importance4: 60,
    },
  },
  'C': {
    region: 'C',
    name: 'Cyclonic',
    description: 'Northern coast and islands - cyclone prone',
    provinces: ['Madang', 'East Sepik', 'Sandaun', 'Morobe', 'Milne Bay'],
    regionalWindSpeed: 65, // m/s for 500-year return
    cycloneRisk: 'moderate',
    designWindSpeed: {
      importance1: 55,
      importance2: 60,
      importance3: 65,
      importance4: 70,
    },
  },
  'D': {
    region: 'D',
    name: 'Severe Cyclonic',
    description: 'Island regions - high cyclone exposure',
    provinces: ['East New Britain', 'West New Britain', 'New Ireland', 'Manus', 'Autonomous Region of Bougainville'],
    regionalWindSpeed: 75, // m/s for 500-year return (Category 4 cyclone)
    cycloneRisk: 'high',
    designWindSpeed: {
      importance1: 60,
      importance2: 67,
      importance3: 75,
      importance4: 80,
    },
  },
};

// Map provinces to wind regions
const PROVINCE_WIND_REGION = {};
for (const [regionCode, regionData] of Object.entries(PNG_WIND_REGIONS)) {
  for (const province of regionData.provinces) {
    PROVINCE_WIND_REGION[province] = regionCode;
  }
}

// ============================================
// Terrain Categories
// ============================================

export const TERRAIN_CATEGORIES = {
  1: {
    category: 1,
    description: 'Exposed open terrain',
    examples: 'Open water, flat coastal areas, airfields',
    multiplier: { '5m': 1.12, '10m': 1.18, '15m': 1.22, '20m': 1.24, '30m': 1.28 },
  },
  2: {
    category: 2,
    description: 'Open terrain with few obstructions',
    examples: 'Grassland, few trees, rural areas',
    multiplier: { '5m': 0.97, '10m': 1.05, '15m': 1.10, '20m': 1.14, '30m': 1.20 },
  },
  3: {
    category: 3,
    description: 'Suburban terrain',
    examples: 'Villages, scattered buildings, plantation',
    multiplier: { '5m': 0.83, '10m': 0.92, '15m': 0.97, '20m': 1.01, '30m': 1.08 },
  },
  4: {
    category: 4,
    description: 'Urban terrain',
    examples: 'Town centers, dense buildings',
    multiplier: { '5m': 0.75, '10m': 0.82, '15m': 0.87, '20m': 0.91, '30m': 0.98 },
  },
};

// ============================================
// Wind Load Calculations
// ============================================

/**
 * Get wind region for a province
 */
export function getWindRegion(province) {
  const regionCode = PROVINCE_WIND_REGION[province];
  return PNG_WIND_REGIONS[regionCode] || PNG_WIND_REGIONS['B'];
}

/**
 * Calculate design wind speed for a location
 */
export function calculateDesignWindSpeed(params) {
  const {
    province,
    importanceCategory = 2,
    terrainCategory = 2,
    buildingHeight = 10,
    shielding = 1.0, // 1.0 = no shielding
    topography = 1.0, // 1.0 = flat terrain
  } = params;

  const region = getWindRegion(province);
  const baseSpeed = region.designWindSpeed[`importance${importanceCategory}`];

  // Height multiplier (interpolate from terrain category data)
  const terrain = TERRAIN_CATEGORIES[terrainCategory];
  const heights = [5, 10, 15, 20, 30];
  const multipliers = heights.map(h => terrain.multiplier[`${h}m`]);

  let heightMultiplier;
  if (buildingHeight <= 5) {
    heightMultiplier = multipliers[0];
  } else if (buildingHeight >= 30) {
    heightMultiplier = multipliers[4];
  } else {
    // Linear interpolation
    for (let i = 0; i < heights.length - 1; i++) {
      if (buildingHeight >= heights[i] && buildingHeight <= heights[i + 1]) {
        const t = (buildingHeight - heights[i]) / (heights[i + 1] - heights[i]);
        heightMultiplier = multipliers[i] * (1 - t) + multipliers[i + 1] * t;
        break;
      }
    }
  }

  const designSpeed = baseSpeed * heightMultiplier * shielding * topography;

  return {
    province,
    windRegion: region.region,
    regionName: region.name,
    cycloneRisk: region.cycloneRisk,
    baseWindSpeed: baseSpeed,
    heightMultiplier: Math.round(heightMultiplier * 100) / 100,
    shieldingFactor: shielding,
    topographyFactor: topography,
    designWindSpeed: Math.round(designSpeed * 10) / 10,
    designWindPressure: Math.round(0.6 * designSpeed * designSpeed) / 1000, // kPa
  };
}

/**
 * Calculate wind loads on a building
 */
export function calculateWindLoads(params) {
  const {
    province,
    buildingWidth,
    buildingLength,
    buildingHeight,
    roofType = 'hip', // hip, gable, flat, mono
    roofPitch = 20, // degrees
    importanceCategory = 2,
    terrainCategory = 2,
    enclosure = 'enclosed', // enclosed, partial, open
  } = params;

  const windSpeed = calculateDesignWindSpeed({
    province,
    importanceCategory,
    terrainCategory,
    buildingHeight,
  });

  const q = 0.6 * Math.pow(windSpeed.designWindSpeed, 2) / 1000; // kPa

  // Pressure coefficients (simplified)
  const Cpe = {
    windward: 0.8,
    leeward: -0.5,
    side: -0.65,
    roof_windward: roofPitch > 10 ? 0.3 : -0.9,
    roof_leeward: -0.5,
  };

  // Internal pressure coefficient
  const Cpi = enclosure === 'enclosed' ? 0.0 : enclosure === 'partial' ? 0.3 : 0.7;

  // Calculate design pressures
  const pressures = {
    windward_wall: q * (Cpe.windward - Cpi),
    leeward_wall: q * (Cpe.leeward - Cpi),
    side_wall: q * (Cpe.side - Cpi),
    roof_windward: q * (Cpe.roof_windward - Cpi),
    roof_leeward: q * (Cpe.roof_leeward - Cpi),
  };

  // Calculate total forces
  const windwardArea = buildingWidth * buildingHeight;
  const leewardArea = buildingWidth * buildingHeight;
  const sideArea = buildingLength * buildingHeight;
  const roofArea = buildingWidth * buildingLength / Math.cos(roofPitch * Math.PI / 180);

  const forces = {
    windward_wall: pressures.windward_wall * windwardArea,
    leeward_wall: Math.abs(pressures.leeward_wall) * leewardArea,
    total_lateral: (pressures.windward_wall - pressures.leeward_wall) * windwardArea,
    roof_uplift: Math.abs(Math.min(pressures.roof_windward, pressures.roof_leeward)) * roofArea,
  };

  // Cyclone-specific requirements
  const cycloneRequirements = [];
  if (windSpeed.cycloneRisk !== 'negligible') {
    cycloneRequirements.push('Use cyclone-rated fasteners for roof sheeting');
    cycloneRequirements.push('Provide continuous load path from roof to foundation');
    cycloneRequirements.push('Install window protection or impact-resistant glazing');
    if (windSpeed.cycloneRisk === 'high') {
      cycloneRequirements.push('Consider safe room or shelter area within building');
      cycloneRequirements.push('Use strapping at all structural connections');
      cycloneRequirements.push('Garage doors and large openings need wind-rated products');
    }
  }

  return {
    windSpeed,
    dynamicPressure: Math.round(q * 1000) / 1000, // kPa
    pressures: Object.fromEntries(
      Object.entries(pressures).map(([k, v]) => [k, Math.round(v * 1000) / 1000])
    ),
    forces: Object.fromEntries(
      Object.entries(forces).map(([k, v]) => [k, Math.round(v / 10) / 100]) // kN
    ),
    baseShear: Math.round(forces.total_lateral / 10) / 100, // kN
    baseOverturning: Math.round(forces.total_lateral * buildingHeight / 2 / 100) / 10, // kN.m
    cycloneRequirements,
  };
}

// ============================================
// Updated Seismic Hazard Data (475-year return)
// ============================================

/**
 * Modern seismic hazard factors based on 475-year return period
 * Updated from Geoscience Australia / OpenQuake analysis
 * The 1982 PNG code used 20-year return period scaled to 200-year
 */
export const SEISMIC_HAZARD_475 = {
  // Zone 4 - Very high (Northern coast, islands)
  'Madang': { Z: 0.50, nearFault: true },
  'East Sepik': { Z: 0.48, nearFault: true },
  'Sandaun': { Z: 0.45, nearFault: true },
  'Morobe': { Z: 0.50, nearFault: true },
  'East New Britain': { Z: 0.55, nearFault: true }, // New Britain Trench
  'West New Britain': { Z: 0.55, nearFault: true },
  'New Ireland': { Z: 0.50, nearFault: true },
  'Manus': { Z: 0.45, nearFault: true },
  'Autonomous Region of Bougainville': { Z: 0.50, nearFault: true },

  // Zone 3 - High (Southern coast)
  'Milne Bay': { Z: 0.40, nearFault: false },
  'Oro': { Z: 0.38, nearFault: false },
  'Gulf': { Z: 0.35, nearFault: false },
  'Central': { Z: 0.35, nearFault: false },
  'National Capital District': { Z: 0.35, nearFault: false },

  // Zone 2 - Moderate (Highlands)
  'Eastern Highlands': { Z: 0.30, nearFault: false },
  'Western Highlands': { Z: 0.28, nearFault: false },
  'Southern Highlands': { Z: 0.28, nearFault: false },
  'Enga': { Z: 0.30, nearFault: false },
  'Simbu': { Z: 0.30, nearFault: false },
  'Hela': { Z: 0.28, nearFault: false },
  'Jiwaka': { Z: 0.28, nearFault: false },

  // Zone 1 - Lower (Western)
  'Western': { Z: 0.15, nearFault: false },
};

/**
 * Get modern seismic hazard factor for province
 */
export function getSeismicHazard475(province) {
  const data = SEISMIC_HAZARD_475[province];
  if (!data) return { Z: 0.30, nearFault: false }; // Default moderate

  return {
    province,
    hazardFactor: data.Z,
    nearFault: data.nearFault,
    returnPeriod: 475,
    probabilityExceedance: '10% in 50 years',
    codeReference: 'Updated per AS/NZS 1170.4:2007 methodology',
    note: 'These values supersede the 1982 PNG Building Code values',
  };
}

// ============================================
// Combined Load Analysis
// ============================================

/**
 * Calculate combined seismic and wind demands
 */
export function calculateCombinedLoads(params) {
  const {
    province,
    buildingWeight, // kN
    buildingHeight,
    buildingWidth,
    buildingLength,
    importanceCategory = 2,
    soilClass = 'C',
    structuralSystem = 'concrete-frame',
  } = params;

  // Get seismic base shear (simplified using new hazard factors)
  const seismicHazard = getSeismicHazard475(province);
  const siteFactor = { A: 0.8, B: 1.0, C: 1.25, D: 1.5, E: 2.0 }[soilClass] || 1.25;
  const importanceFactor = { 1: 0.9, 2: 1.0, 3: 1.3, 4: 1.5 }[importanceCategory] || 1.0;
  const ductility = {
    'timber-frame': 3.0,
    'concrete-frame': 4.0,
    'concrete-shear-wall': 4.5,
    'steel-frame': 5.0,
    'masonry-reinforced': 2.0,
  }[structuralSystem] || 3.0;

  const seismicCoeff = (seismicHazard.hazardFactor * siteFactor * importanceFactor) / ductility;
  const seismicBaseShear = seismicCoeff * buildingWeight;

  // Get wind base shear
  const windLoads = calculateWindLoads({
    province,
    buildingWidth,
    buildingLength,
    buildingHeight,
    importanceCategory,
  });

  const windBaseShear = windLoads.baseShear;

  // Determine governing load case
  const governing = seismicBaseShear > windBaseShear ? 'seismic' : 'wind';
  const designBaseShear = Math.max(seismicBaseShear, windBaseShear);

  // Load combinations (AS/NZS 1170.0)
  const combinations = [
    {
      name: '1.35G',
      description: 'Dead load only',
      factor: 1.35,
    },
    {
      name: '1.2G + 1.5Q',
      description: 'Dead + Live',
      factor: 1.2 + 1.5 * 0.3, // Assuming Q = 0.3G typical
    },
    {
      name: '1.2G + Wu + ψcQ',
      description: 'Dead + Wind + Live (combination)',
      lateralForce: windBaseShear * 1.0,
    },
    {
      name: 'G + Eu + ψEQ',
      description: 'Dead + Earthquake + Live (combination)',
      lateralForce: seismicBaseShear * 1.0,
    },
  ];

  return {
    seismic: {
      hazardFactor: seismicHazard.hazardFactor,
      siteFactor,
      importanceFactor,
      ductilityFactor: ductility,
      coefficient: Math.round(seismicCoeff * 1000) / 1000,
      baseShear: Math.round(seismicBaseShear * 10) / 10, // kN
    },
    wind: {
      designSpeed: windLoads.windSpeed.designWindSpeed,
      cycloneRisk: windLoads.windSpeed.cycloneRisk,
      baseShear: Math.round(windBaseShear * 10) / 10, // kN
    },
    governing,
    designBaseShear: Math.round(designBaseShear * 10) / 10,
    loadCombinations: combinations,
    recommendations: [
      `Design lateral system for ${governing} loading`,
      governing === 'seismic' && seismicHazard.nearFault
        ? 'Near-fault effects should be considered in detailed design'
        : null,
      windLoads.windSpeed.cycloneRisk === 'high'
        ? 'Cyclone detailing requirements apply'
        : null,
    ].filter(Boolean),
  };
}

// ============================================
// Design Validation Framework
// ============================================

/**
 * Comprehensive design validation check
 */
export function validateDesign(design) {
  const issues = [];
  const passed = [];

  // Structural safety checks
  if (design.structuralSystem) {
    const seismic = getSeismicHazard475(design.province);

    // Check structural system suitability
    if (design.structuralSystem === 'masonry-unreinforced' && seismic.hazardFactor > 0.20) {
      issues.push({
        category: 'structural',
        severity: 'critical',
        code: 'STR-001',
        message: 'Unreinforced masonry not permitted in this seismic zone',
        requirement: 'Use reinforced masonry or alternative system',
        reference: 'AS 3700 / PNG Building Code',
      });
    } else {
      passed.push('Structural system appropriate for seismic zone');
    }

    // Check building height limits
    const heightLimits = {
      'timber-frame': 10,
      'masonry-unreinforced': 6,
      'masonry-reinforced': 15,
      'concrete-frame': 50,
      'steel-frame': 100,
    };
    const limit = heightLimits[design.structuralSystem];
    if (limit && design.buildingHeight > limit) {
      issues.push({
        category: 'structural',
        severity: 'error',
        code: 'STR-002',
        message: `Building height ${design.buildingHeight}m exceeds limit for ${design.structuralSystem}`,
        requirement: `Maximum height: ${limit}m`,
        reference: 'AS/NZS 1170.4',
      });
    }
  }

  // Foundation checks
  if (design.foundationType && design.soilClass) {
    if (design.soilClass === 'E' && design.foundationType === 'pad-footing') {
      issues.push({
        category: 'geotechnical',
        severity: 'error',
        code: 'GEO-001',
        message: 'Pad footings not suitable for Class E (very soft) soils',
        requirement: 'Use raft foundation or piles',
        reference: 'AS 2870',
      });
    }
  }

  // Flood resilience checks
  if (design.floorLevel !== undefined && design.floodLevel !== undefined) {
    const freeboard = design.floorLevel - design.floodLevel;
    if (freeboard < 0.3) {
      issues.push({
        category: 'flood',
        severity: 'critical',
        code: 'FLD-001',
        message: `Insufficient freeboard: ${(freeboard * 1000).toFixed(0)}mm`,
        requirement: 'Minimum 300mm freeboard above design flood level',
        reference: 'ASCE 24 / PNG Building Guidelines',
      });
    } else if (freeboard < 0.6 && design.importanceCategory >= 3) {
      issues.push({
        category: 'flood',
        severity: 'warning',
        code: 'FLD-002',
        message: 'Important structures should have 600mm+ freeboard',
        requirement: 'Consider raising floor level',
        reference: 'Pacific Quality Infrastructure Principles',
      });
    } else {
      passed.push(`Adequate flood freeboard: ${(freeboard * 1000).toFixed(0)}mm`);
    }
  }

  // Drainage checks
  if (design.siteSlope !== undefined) {
    if (design.siteSlope < 1) {
      issues.push({
        category: 'drainage',
        severity: 'warning',
        code: 'DRN-001',
        message: 'Site slope less than 1% may cause ponding',
        requirement: 'Provide positive drainage away from building',
        reference: 'Good practice',
      });
    }
  }

  // Material durability checks
  if (design.materials) {
    for (const material of design.materials) {
      if (material === 'untreated-timber' && design.groundContact) {
        issues.push({
          category: 'durability',
          severity: 'error',
          code: 'DUR-001',
          message: 'Untreated timber not permitted in ground contact',
          requirement: 'Use H4 or H5 treated timber, or concrete',
          reference: 'AS 1604',
        });
      }
    }
  }

  // Calculate overall score
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  let overallStatus;
  if (criticalCount > 0) {
    overallStatus = 'FAIL - Critical issues must be resolved';
  } else if (errorCount > 0) {
    overallStatus = 'FAIL - Errors must be resolved';
  } else if (warningCount > 0) {
    overallStatus = 'PASS with warnings';
  } else {
    overallStatus = 'PASS';
  }

  return {
    overallStatus,
    summary: {
      critical: criticalCount,
      errors: errorCount,
      warnings: warningCount,
      passed: passed.length,
    },
    issues,
    passed,
    validationDate: new Date().toISOString(),
    disclaimer: 'This automated check does not replace professional engineering review',
  };
}

// ============================================
// Lifecycle Cost Estimation
// ============================================

/**
 * Estimate lifecycle costs for infrastructure
 * Based on Pacific Quality Infrastructure principles
 */
export function estimateLifecycleCost(params) {
  const {
    constructionCost, // Initial cost in PGK
    assetType = 'building', // building, road, bridge, drainage
    designLife = 50, // years
    province,
    quality = 'standard', // basic, standard, high
    discountRate = 0.05, // 5% discount rate
  } = params;

  // Maintenance cost factors (annual as % of construction cost)
  const maintenanceRates = {
    building: { basic: 0.03, standard: 0.02, high: 0.015 },
    road: { basic: 0.08, standard: 0.05, high: 0.03 },
    bridge: { basic: 0.025, standard: 0.02, high: 0.015 },
    drainage: { basic: 0.04, standard: 0.03, high: 0.02 },
  };

  // Climate adjustment (tropical conditions increase maintenance)
  const climateMultiplier = 1.25;

  // Remote location adjustment
  const remoteProvinces = ['Western', 'Gulf', 'Sandaun', 'Hela'];
  const remoteMultiplier = remoteProvinces.includes(province) ? 1.3 : 1.0;

  const annualMaintenance = constructionCost *
    maintenanceRates[assetType][quality] *
    climateMultiplier *
    remoteMultiplier;

  // Major rehabilitation (every 15-25 years depending on asset)
  const rehabilitationInterval = { building: 25, road: 15, bridge: 30, drainage: 20 }[assetType];
  const rehabilitationCost = constructionCost * { basic: 0.4, standard: 0.3, high: 0.25 }[quality];

  // Calculate NPV of lifecycle costs
  let npvMaintenance = 0;
  let npvRehabilitation = 0;

  for (let year = 1; year <= designLife; year++) {
    const discountFactor = 1 / Math.pow(1 + discountRate, year);

    // Annual maintenance
    npvMaintenance += annualMaintenance * discountFactor;

    // Rehabilitation
    if (year % rehabilitationInterval === 0 && year < designLife) {
      npvRehabilitation += rehabilitationCost * discountFactor;
    }
  }

  // Residual value at end of design life
  const residualValue = constructionCost * 0.1; // 10% residual
  const npvResidual = residualValue / Math.pow(1 + discountRate, designLife);

  const totalNPV = constructionCost + npvMaintenance + npvRehabilitation - npvResidual;
  const annualizedCost = totalNPV * discountRate / (1 - Math.pow(1 + discountRate, -designLife));

  return {
    initialCost: constructionCost,
    annualMaintenance: Math.round(annualMaintenance),
    rehabilitationCost: Math.round(rehabilitationCost),
    rehabilitationInterval,
    npv: {
      construction: constructionCost,
      maintenance: Math.round(npvMaintenance),
      rehabilitation: Math.round(npvRehabilitation),
      residualValue: Math.round(npvResidual),
      total: Math.round(totalNPV),
    },
    annualizedCost: Math.round(annualizedCost),
    costPerYear: Math.round(totalNPV / designLife),
    qualityImpact: quality === 'high'
      ? 'Higher initial cost but lower lifecycle cost'
      : quality === 'basic'
        ? 'Lower initial cost but higher lifecycle cost'
        : 'Balanced approach',
    recommendations: [
      quality === 'basic' ? 'Consider upgrading quality to reduce lifecycle costs' : null,
      remoteProvinces.includes(province) ? 'Remote location increases maintenance costs - consider durable materials' : null,
      'Include maintenance budget in project planning',
      'Regular inspections extend asset life',
    ].filter(Boolean),
  };
}

// ============================================
// Foundation Design Guide
// ============================================

/**
 * Comprehensive foundation recommendations based on PNG conditions
 */
export function getFoundationDesign(params) {
  const {
    province,
    soilClass,
    soilDescription = null,
    buildingType = 'residential',
    numberOfStoreys = 1,
    buildingWeight = null, // kN
    floodZone = false,
    nearCoast = false,
    terrainSlope = 0, // percent
  } = params;

  const seismic = getSeismicHazard475(province);
  const recommendations = [];
  const warnings = [];

  // Determine foundation options based on conditions
  if (soilClass === 'A' || soilClass === 'B') {
    // Good founding conditions
    recommendations.push({
      type: 'strip-footing',
      suitability: 'Excellent',
      minWidth: numberOfStoreys <= 2 ? 400 : 600,
      minDepth: 450,
      notes: 'Standard strip footings suitable',
    });
    if (numberOfStoreys <= 2) {
      recommendations.push({
        type: 'pad-footing',
        suitability: 'Excellent',
        minSize: 600,
        minDepth: 450,
        notes: 'Isolated footings under columns',
      });
    }
  } else if (soilClass === 'C') {
    // Moderate conditions
    recommendations.push({
      type: 'strip-footing',
      suitability: 'Good',
      minWidth: numberOfStoreys <= 2 ? 500 : 750,
      minDepth: 500,
      notes: 'Wider footings required, provide reinforcement',
    });
    if (seismic.hazardFactor > 0.35) {
      recommendations.push({
        type: 'tied-footings',
        suitability: 'Recommended',
        notes: 'Tie beams between footings for seismic zones',
      });
    }
  } else if (soilClass === 'D') {
    // Poor conditions
    recommendations.push({
      type: 'raft',
      suitability: 'Recommended',
      thickness: numberOfStoreys <= 2 ? 200 : 300,
      notes: 'Raft foundation provides load distribution',
    });
    warnings.push('Ground improvement may be beneficial');
  } else if (soilClass === 'E') {
    // Very poor conditions
    recommendations.push({
      type: 'piles',
      suitability: 'Required',
      notes: 'Piles to competent stratum essential',
    });
    recommendations.push({
      type: 'raft-on-piles',
      suitability: 'Alternative',
      notes: 'Combined system for load distribution',
    });
    warnings.push('Detailed geotechnical investigation required');
    warnings.push('Specialist foundation design essential');
  }

  // Flood zone adjustments
  if (floodZone) {
    recommendations.forEach(r => {
      r.notes += '. Consider flood effects on soil capacity';
    });
    warnings.push('Use flood-resistant foundation materials');
    warnings.push('Anchor against flotation if below flood level');
  }

  // Coastal adjustments
  if (nearCoast) {
    warnings.push('Use sulfate-resistant cement (Type SR)');
    warnings.push('Increased concrete cover for reinforcement (50mm minimum)');
    warnings.push('Consider stainless steel or coated reinforcement');
  }

  // Slope adjustments
  if (terrainSlope > 15) {
    recommendations.push({
      type: 'stepped-footing',
      suitability: 'For sloping sites',
      notes: 'Step footings to follow slope, tie with reinforcement',
    });
    warnings.push('Upslope drainage essential');
  }

  // Traditional construction option
  if (buildingType === 'residential' && numberOfStoreys === 1) {
    recommendations.push({
      type: 'timber-post',
      suitability: 'Traditional option',
      embedment: 600,
      notes: 'Treated timber posts, concrete collar at ground level',
    });
  }

  return {
    province,
    soilClass,
    seismicHazard: seismic.hazardFactor,
    numberOfStoreys,
    recommendations,
    warnings,
    generalRequirements: [
      'Remove topsoil and organic material',
      'Compact subgrade to 95% standard compaction',
      'Provide blinding layer under footings',
      'Minimum concrete strength 25 MPa',
      seismic.hazardFactor > 0.30 ? 'Provide starter bars for columns' : null,
    ].filter(Boolean),
    inspectionPoints: [
      'Excavation to design depth and dimensions',
      'Subgrade condition and bearing capacity',
      'Reinforcement placement and cover',
      'Concrete placement and curing',
    ],
  };
}
