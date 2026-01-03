/**
 * PNG Climate Analysis Module
 * Provides climate data and design recommendations for Papua New Guinea
 */

import { normalizeProvinceName, lookupByProvince } from './provinces.js';

// ============================================
// Province Climate Mapping
// ============================================

const PROVINCE_CLIMATE_ZONES = {
  'Central': 'tropical-coastal',
  'East New Britain': 'tropical-island',
  'East Sepik': 'tropical-monsoon',
  'Eastern Highlands': 'tropical-highland',
  'Enga': 'tropical-highland',
  'Gulf': 'tropical-monsoon',
  'Hela': 'tropical-highland',
  'Jiwaka': 'tropical-highland',
  'Madang': 'tropical-coastal',
  'Manus': 'tropical-island',
  'Milne Bay': 'tropical-island',
  'Morobe': 'tropical-coastal',
  'National Capital District': 'tropical-coastal',
  'New Ireland': 'tropical-island',
  'Oro': 'tropical-monsoon',
  'Sandaun': 'tropical-monsoon',
  'Simbu': 'tropical-highland',
  'Southern Highlands': 'tropical-highland',
  'West New Britain': 'tropical-island',
  'Western': 'tropical-monsoon',
  'Western Highlands': 'tropical-highland',
  'Autonomous Region of Bougainville': 'tropical-island',
};

// ============================================
// Climate Zone Data
// ============================================

const CLIMATE_ZONE_DATA = {
  'tropical-coastal': {
    zone: 'tropical-coastal',
    averageTemperature: { min: 23, max: 32, annual: 27 },
    humidity: { min: 70, max: 95, annual: 82 },
    rainfall: {
      annual: 2500,
      wetSeasonMonths: [11, 12, 1, 2, 3, 4],
      maxMonthly: 400,
      maxDaily: 150,
    },
    wind: {
      averageSpeed: 12,
      maxGust: 80,
      predominantDirection: 'SE',
      cycloneRisk: 'low',
    },
    sunExposure: { averageDailyHours: 6, uvIndex: 12 },
  },

  'tropical-highland': {
    zone: 'tropical-highland',
    averageTemperature: { min: 12, max: 24, annual: 18 },
    humidity: { min: 60, max: 90, annual: 75 },
    rainfall: {
      annual: 2800,
      wetSeasonMonths: [11, 12, 1, 2, 3],
      maxMonthly: 350,
      maxDaily: 120,
    },
    wind: {
      averageSpeed: 8,
      maxGust: 60,
      predominantDirection: 'Variable',
      cycloneRisk: 'none',
    },
    sunExposure: { averageDailyHours: 5, uvIndex: 14 },
  },

  'tropical-monsoon': {
    zone: 'tropical-monsoon',
    averageTemperature: { min: 22, max: 33, annual: 27 },
    humidity: { min: 75, max: 98, annual: 87 },
    rainfall: {
      annual: 4000,
      wetSeasonMonths: [11, 12, 1, 2, 3, 4, 5],
      maxMonthly: 600,
      maxDaily: 200,
    },
    wind: {
      averageSpeed: 10,
      maxGust: 70,
      predominantDirection: 'NW',
      cycloneRisk: 'moderate',
    },
    sunExposure: { averageDailyHours: 5, uvIndex: 13 },
  },

  'tropical-island': {
    zone: 'tropical-island',
    averageTemperature: { min: 24, max: 31, annual: 27 },
    humidity: { min: 75, max: 95, annual: 85 },
    rainfall: {
      annual: 3000,
      wetSeasonMonths: [12, 1, 2, 3, 4],
      maxMonthly: 450,
      maxDaily: 180,
    },
    wind: {
      averageSpeed: 15,
      maxGust: 120,
      predominantDirection: 'SE',
      cycloneRisk: 'high',
    },
    sunExposure: { averageDailyHours: 7, uvIndex: 13 },
  },
};

// ============================================
// Climate Analysis Functions
// ============================================

export function getClimateZone(province) {
  // Use normalized lookup for case-insensitive matching
  return lookupByProvince(PROVINCE_CLIMATE_ZONES, province);
}

export function getClimateData(zone) {
  return CLIMATE_ZONE_DATA[zone];
}

export function getClimateDataForProvince(province) {
  const zone = getClimateZone(province);
  if (!zone) return null;
  return getClimateData(zone);
}

export function getDesignFactors(climateData, terrainType) {
  const isCoastal = terrainType === 'coastal-lowland' || terrainType === 'island-atoll';
  const isFloodProne = terrainType === 'riverine-floodplain' || terrainType === 'swamp-wetland';
  const isHighHumidity = climateData.humidity.annual > 80;
  const isHighRainfall = climateData.rainfall.annual > 3000;

  return {
    ventilationRequired: isHighHumidity ? 'extensive' : climateData.averageTemperature.max > 30 ? 'moderate' : 'minimal',
    insulationRequired: climateData.zone === 'tropical-highland',
    moistureProtection: isHighRainfall ? 'maximum' : isHighHumidity ? 'enhanced' : 'standard',
    roofPitchMin: isHighRainfall ? 30 : climateData.rainfall.annual > 2000 ? 25 : 20,
    overhangsRecommended: isHighRainfall ? 1.2 : 0.9,
    crossVentilationRequired: isHighHumidity && climateData.averageTemperature.max > 28,
    elevatedFloorRequired: isFloodProne,
    corrosionProtection: isCoastal ? 'marine-grade' : isHighHumidity ? 'enhanced' : 'standard',
    termiteProtection: climateData.averageTemperature.annual > 25 ? 'enhanced' : 'standard',
    moldPreventionMeasures: getMoldPreventionMeasures(isHighHumidity, isHighRainfall),
  };
}

function getMoldPreventionMeasures(isHighHumidity, isHighRainfall) {
  const measures = [];

  if (isHighHumidity || isHighRainfall) {
    measures.push('Use mold-resistant materials and coatings');
    measures.push('Ensure adequate ventilation in all spaces');
    measures.push('Install vapor barriers in walls and floors');
    measures.push('Provide roof ventilation');
  }

  if (isHighHumidity) {
    measures.push('Design for cross-ventilation');
    measures.push('Avoid enclosed spaces without airflow');
    measures.push('Use treated timber or alternatives');
  }

  if (isHighRainfall) {
    measures.push('Ensure proper drainage around building');
    measures.push('Waterproof all external surfaces');
    measures.push('Install adequate guttering and downpipes');
  }

  return measures;
}

// ============================================
// Rainfall & Drainage Calculations
// ============================================

export function calculateDesignRainfallIntensity(climateData, returnPeriod, duration) {
  const baseIntensity = climateData.rainfall.maxDaily / 24 * 60;
  const returnFactor = Math.log(returnPeriod) / Math.log(10) * 0.4 + 0.6;
  const durationFactor = Math.pow(60 / (duration + 10), 0.7);
  return baseIntensity * returnFactor * durationFactor;
}

export function calculateDrainageRequirements(params) {
  const areaHectares = params.catchmentArea / 10000;
  const peakRunoff = (params.runoffCoefficient * params.rainfallIntensity * areaHectares) / 360;

  const n = 0.013;
  const slope = 0.01;

  const pipeDiameter = Math.pow(
    (peakRunoff * n * Math.pow(4, 5 / 3)) / (Math.PI * Math.sqrt(slope)),
    3 / 8
  ) * Math.pow(4 / Math.PI, 3 / 8) * 1000;

  const standardSizes = [100, 150, 200, 225, 300, 375, 450, 525, 600, 750, 900, 1050, 1200];
  const pipeSize = standardSizes.find(s => s >= pipeDiameter) || standardSizes[standardSizes.length - 1];

  const channelWidth = Math.sqrt(peakRunoff / 0.5);
  const channelDepth = channelWidth * 0.5;

  const recommendations = [];

  if (peakRunoff > 0.5) {
    recommendations.push('Consider multiple smaller drains instead of single large drain');
  }

  if (params.runoffCoefficient > 0.7) {
    recommendations.push('High runoff area - consider permeable surfaces or retention');
  }

  recommendations.push('Install sediment traps at drain inlets');
  recommendations.push('Provide access points for maintenance every 50m');
  recommendations.push('Use erosion protection at outlets');

  return {
    peakRunoff,
    pipeSize,
    channelWidth,
    channelDepth,
    slope: slope * 100,
    recommendations,
  };
}

// ============================================
// Wind Load Calculations (PNG Building Code)
// ============================================

export function calculateWindLoad(params) {
  const V_R = params.climateData.wind.maxGust / 3.6;
  const M_zh = getTerrainMultiplier(params.buildingHeight, params.terrainCategory);
  const M_s = 1.0;
  const M_t = params.topographyFactor;

  const V_des = V_R * M_zh * M_s * M_t;

  const airDensity = 1.2;
  const dynamicPressure = 0.5 * airDensity * V_des * V_des / 1000;
  const pressureCoefficient = 1.3;
  const windPressure = dynamicPressure * pressureCoefficient;
  const upliftForce = dynamicPressure * 1.5;

  const recommendations = [];

  if (params.climateData.wind.cycloneRisk === 'high') {
    recommendations.push('Design for cyclonic wind conditions');
    recommendations.push('Use cyclone-rated fasteners and tie-downs');
    recommendations.push('Reinforce roof-to-wall connections');
  }

  if (params.buildingHeight > 10) {
    recommendations.push('Consider wind tunnel testing for accurate loads');
  }

  recommendations.push('Ensure adequate roof tie-down straps');
  recommendations.push('Use approved cyclone shutters in exposed areas');

  return {
    designWindSpeed: V_des,
    pressureCoefficient,
    windPressure,
    upliftForce,
    recommendations,
  };
}

function getTerrainMultiplier(height, category) {
  const baseMultipliers = {
    1: 1.12,
    2: 1.00,
    3: 0.89,
    4: 0.75,
  };

  const heightFactor = Math.pow(Math.max(height, 3) / 10, 0.15);
  return baseMultipliers[category] * heightFactor;
}

// ============================================
// Thermal Comfort Analysis
// ============================================

export function analyzeThermalComfort(climateData, buildingType) {
  const maxTemp = climateData.averageTemperature.max;
  const humidity = climateData.humidity.annual;
  const heatIndex = maxTemp + (0.5 * (humidity - 50));

  let thermalStress;
  if (heatIndex < 28) thermalStress = 'none';
  else if (heatIndex < 32) thermalStress = 'mild';
  else if (heatIndex < 38) thermalStress = 'moderate';
  else thermalStress = 'high';

  const coolingStrategy = [];

  if (thermalStress !== 'none') {
    coolingStrategy.push('Maximize cross-ventilation');
    coolingStrategy.push('Use light-colored roof materials');
    coolingStrategy.push('Provide adequate shading');
  }

  if (thermalStress === 'moderate' || thermalStress === 'high') {
    coolingStrategy.push('Consider ceiling fans');
    coolingStrategy.push('Install insulation in roof');
    if (buildingType === 'commercial') {
      coolingStrategy.push('Consider mechanical cooling for critical areas');
    }
  }

  const heatingRequired = climateData.averageTemperature.min < 15;

  const naturalVentilationViable = climateData.averageTemperature.max < 32 &&
    humidity < 85 &&
    climateData.wind.averageSpeed > 5;

  let openingPercentage = 10;
  if (thermalStress === 'mild') openingPercentage = 15;
  if (thermalStress === 'moderate') openingPercentage = 20;
  if (thermalStress === 'high') openingPercentage = 25;

  return {
    thermalStress,
    coolingStrategy,
    heatingRequired,
    naturalVentilationViable,
    recommendedOpeningPercentage: openingPercentage,
  };
}

// ============================================
// Export Climate Report
// ============================================

export function generateClimateReport(province, terrainType, buildingType) {
  const climateZone = getClimateZone(province);
  const climateData = getClimateData(climateZone);
  const designFactors = getDesignFactors(climateData, terrainType);
  const thermalComfort = analyzeThermalComfort(climateData, buildingType);

  const recommendations = [
    ...designFactors.moldPreventionMeasures,
    ...thermalComfort.coolingStrategy,
  ];

  if (terrainType === 'coastal-lowland') {
    recommendations.push('Use corrosion-resistant materials for coastal exposure');
    recommendations.push('Design for potential storm surge if near coast');
  }

  if (terrainType === 'highland-valley') {
    recommendations.push('Consider temperature variation between day and night');
    recommendations.push('Provide thermal mass for temperature regulation');
  }

  if (terrainType === 'riverine-floodplain') {
    recommendations.push('Elevate building above flood level');
    recommendations.push('Use flood-resistant construction materials');
    recommendations.push('Plan for emergency access during floods');
  }

  return {
    province,
    climateZone,
    climateData,
    designFactors,
    thermalComfort,
    recommendations: [...new Set(recommendations)],
  };
}
