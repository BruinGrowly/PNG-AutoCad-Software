/**
 * PNG Structural Analysis Module
 * Load calculations and structural design for Papua New Guinea conditions
 */

import { getClimateData } from './climate.js';
import { getMaterialById } from './materials.js';

// ============================================
// PNG-Specific Load Values
// ============================================

// Dead loads (kN/m²)
export const DEAD_LOADS = {
  // Roofing
  'corrugated-iron-0.42': 0.05,
  'corrugated-iron-0.55': 0.07,
  'thatch-kunai': 0.15,
  'thatch-sago-palm': 0.20,
  'concrete-tiles': 0.60,

  // Ceilings
  'plywood-6mm': 0.04,
  'plywood-12mm': 0.08,
  'fibre-cement-6mm': 0.11,
  'gypsum-board-10mm': 0.08,
  'woven-bamboo': 0.03,

  // Floors
  'concrete-slab-100mm': 2.4,
  'concrete-slab-150mm': 3.6,
  'timber-floor-20mm': 0.15,
  'bamboo-floor': 0.10,

  // Walls
  'timber-stud-wall': 0.15,
  'concrete-block-100mm': 1.8,
  'concrete-block-150mm': 2.4,
  'concrete-block-200mm': 3.0,
  'woven-bamboo-wall': 0.05,
  'kunai-grass-wall': 0.08,

  // Finishes
  'render-20mm': 0.44,
  'tiles-ceramic': 0.25,
};

// Live loads (kN/m²) - based on AS/NZS 1170.1 adapted for PNG
export const LIVE_LOADS = {
  // Residential
  'residential-general': 1.5,
  'residential-bedrooms': 1.5,
  'residential-stairs': 2.0,
  'residential-balcony': 2.5,

  // Commercial
  'office-general': 3.0,
  'office-filing': 5.0,
  'retail-general': 4.0,
  'retail-dense': 5.0,

  // Assembly
  'church': 5.0,
  'school-classroom': 3.0,
  'school-corridor': 4.0,
  'community-hall': 5.0,

  // Industrial
  'light-industrial': 5.0,
  'heavy-industrial': 7.5,
  'warehouse-light': 5.0,
  'warehouse-heavy': 10.0,

  // External
  'external-walkway': 4.0,
  'vehicle-access': 5.0,

  // Roof
  'roof-access': 0.25,
  'roof-maintenance': 1.0,
};

// ============================================
// Timber Strength Grades for PNG Species
// ============================================

export const TIMBER_GRADES = {
  'kwila-structural': { f_b: 75, f_t: 45, f_c: 55, f_s: 8.0, E: 18 },
  'taun-structural': { f_b: 50, f_t: 30, f_c: 38, f_s: 6.5, E: 13 },
  'calophyllum-structural': { f_b: 40, f_t: 24, f_c: 30, f_s: 5.5, E: 11 },
  'rosewood-structural': { f_b: 55, f_t: 33, f_c: 42, f_s: 7.0, E: 14 },
  'general-hardwood-f17': { f_b: 45, f_t: 27, f_c: 35, f_s: 6.0, E: 14 },
  'general-hardwood-f14': { f_b: 36, f_t: 22, f_c: 28, f_s: 5.0, E: 12 },
  'general-softwood-f8': { f_b: 22, f_t: 13, f_c: 18, f_s: 3.5, E: 9 },
};

// ============================================
// Timber Beam Design
// ============================================

export function designTimberBeam(span, tributaryWidth, deadLoad, liveLoad, timberGrade, climateZone) {
  const grade = TIMBER_GRADES[timberGrade] || TIMBER_GRADES['general-hardwood-f14'];

  const wD = deadLoad * tributaryWidth;
  const wL = liveLoad * tributaryWidth;
  const wU = 1.2 * wD + 1.5 * wL;

  const M_max = (wU * span * span) / 8;
  const Z_req = (M_max * 1e6) / (grade.f_b * getTimberDurationFactor('short-term') * getTimberMoistureFactor(climateZone));

  const standardSizes = [
    { width: 45, depth: 90 },
    { width: 45, depth: 140 },
    { width: 45, depth: 190 },
    { width: 45, depth: 240 },
    { width: 45, depth: 290 },
    { width: 70, depth: 190 },
    { width: 70, depth: 240 },
    { width: 70, depth: 290 },
    { width: 90, depth: 190 },
    { width: 90, depth: 240 },
    { width: 90, depth: 290 },
  ];

  let selectedSize = standardSizes[standardSizes.length - 1];
  for (const size of standardSizes) {
    const Z = (size.width * size.depth * size.depth) / 6;
    if (Z >= Z_req) {
      selectedSize = size;
      break;
    }
  }

  const Z_provided = (selectedSize.width * selectedSize.depth * selectedSize.depth) / 6;
  const utilizationRatio = Z_req / Z_provided;

  const I = (selectedSize.width * Math.pow(selectedSize.depth, 3)) / 12;
  const wS = wD + 0.4 * wL;
  const delta = (5 * wS * Math.pow(span * 1000, 4)) / (384 * grade.E * 1000 * I);
  const deltaLimit = (span * 1000) / 300;

  const recommendations = [];

  if (delta > deltaLimit) {
    recommendations.push(`Deflection ${delta.toFixed(1)}mm exceeds limit ${deltaLimit.toFixed(1)}mm - increase section`);
  }

  recommendations.push(`Use ${timberGrade} grade timber`);
  recommendations.push('Provide lateral restraint at supports and load points');

  if (climateZone === 'tropical-coastal' || climateZone === 'tropical-monsoon') {
    recommendations.push('Apply preservative treatment for humid conditions');
  }

  if (span > 4) {
    recommendations.push('Consider using LVL or glulam for long spans');
  }

  return {
    species: timberGrade.split('-')[0],
    grade: timberGrade,
    width: selectedSize.width,
    depth: selectedSize.depth,
    length: span,
    loadType: 'bending',
    designLoad: M_max,
    capacity: (grade.f_b * Z_provided) / 1e6,
    utilizationRatio,
    pass: utilizationRatio <= 1.0 && delta <= deltaLimit,
    recommendations,
  };
}

function getTimberDurationFactor(duration) {
  const factors = {
    'permanent': 0.57,
    'long-term': 0.69,
    'medium-term': 0.77,
    'short-term': 0.94,
    'instantaneous': 1.0,
  };
  return factors[duration];
}

function getTimberMoistureFactor(climateZone) {
  const factors = {
    'tropical-coastal': 0.85,
    'tropical-highland': 0.95,
    'tropical-monsoon': 0.80,
    'tropical-island': 0.85,
  };
  return factors[climateZone];
}

// ============================================
// Concrete Design
// ============================================

export function designConcreteFooting(columnLoad, soilBearingCapacity, province, isCoastal) {
  const totalLoad = columnLoad * 1.1;

  const areaRequired = (totalLoad * 1000) / soilBearingCapacity;
  const sideLength = Math.ceil(Math.sqrt(areaRequired) / 100) * 100;

  const depth = Math.max(300, sideLength / 4);

  const M_u = (totalLoad * sideLength) / 8000;
  const d = depth - 75;
  const A_s = (M_u * 1e6) / (0.85 * 500 * d);

  const barDiameter = A_s > 1200 ? 16 : 12;
  const barArea = Math.PI * barDiameter * barDiameter / 4;
  const numberOfBars = Math.ceil(A_s / barArea);
  const spacing = Math.floor((sideLength - 150) / (numberOfBars - 1));

  const recommendations = [];

  let cover = 50;
  if (isCoastal) {
    cover = 65;
    recommendations.push('Increased cover for marine exposure');
  }

  recommendations.push(`Concrete grade N25 minimum`);
  recommendations.push(`Clear cover ${cover}mm to all reinforcement`);
  recommendations.push('Place on 75mm blinding concrete');

  return {
    type: 'footing',
    dimensions: {
      width: sideLength,
      depth: depth,
      length: sideLength,
    },
    reinforcement: {
      main: `N${barDiameter}@${spacing} each way`,
    },
    concreteGrade: 'N25',
    designCapacity: (sideLength * sideLength * soilBearingCapacity) / 1e6,
    designLoad: totalLoad,
    utilizationRatio: totalLoad / ((sideLength * sideLength * soilBearingCapacity) / 1e6),
    coverRequired: cover,
    recommendations,
  };
}

// ============================================
// Roof Design for PNG Climate
// ============================================

export function designRoofForPNG(span, roofType, climateZone, seismicZone, windRegion) {
  const climateData = getClimateData(climateZone);

  let minPitch = 15;
  if (climateData.rainfall.annual > 3000) {
    minPitch = 25;
  }
  if (climateData.rainfall.annual > 4000) {
    minPitch = 30;
  }

  const pitch = roofType === 'flat' ? 5 : Math.max(minPitch, 20);

  let overhang = 0.6;
  if (climateData.rainfall.annual > 2500) {
    overhang = 0.9;
  }
  if (climateData.rainfall.annual > 3500) {
    overhang = 1.2;
  }

  const rafterSpan = span / 2;
  const rafterLoad = 0.15 + (windRegion === 'cyclonic' ? 1.0 : 0.5);

  const rafterTable = [
    { maxSpan: 2.5, size: { width: 45, depth: 90 } },
    { maxSpan: 3.5, size: { width: 45, depth: 140 } },
    { maxSpan: 4.5, size: { width: 45, depth: 190 } },
    { maxSpan: 5.5, size: { width: 70, depth: 190 } },
    { maxSpan: 6.5, size: { width: 70, depth: 240 } },
  ];

  const rafterSize = rafterTable.find(r => rafterSpan <= r.maxSpan)?.size
    || { width: 90, depth: 290 };

  const upliftCoefficient = windRegion === 'cyclonic' ? 1.2 : 0.8;
  const windSpeed = climateData.wind.maxGust / 3.6;
  const windPressure = 0.5 * 1.2 * windSpeed * windSpeed / 1000;
  const upliftForce = windPressure * upliftCoefficient;

  const tieDownRequired = windRegion === 'cyclonic' ||
    seismicZone === 'zone-3' ||
    seismicZone === 'zone-4';

  const recommendations = [];

  recommendations.push(`Minimum roof pitch: ${pitch}°`);
  recommendations.push(`Minimum overhang: ${overhang}m for weather protection`);

  if (tieDownRequired) {
    recommendations.push('Install roof tie-down straps at each rafter');
    recommendations.push('Connect rafters to top plate with approved connectors');
  }

  if (windRegion === 'cyclonic') {
    recommendations.push('Use Type 17 roofing screws at reduced spacing');
    recommendations.push('Install additional edge fasteners');
    recommendations.push('Consider roof safety mesh under sheeting');
  }

  if (pitch < 20) {
    recommendations.push('Use sealed lap joints for low pitch');
  }

  recommendations.push('Install sarking/building paper under roofing');
  recommendations.push('Provide ridge and eave ventilation');

  return {
    pitch,
    overhangs: overhang,
    rafterSize,
    rafterSpacing: 600,
    roofingMaterial: 'corrugated-iron-0.55',
    purlins: {
      size: '70x45',
      spacing: 900,
    },
    tieDownRequired,
    upliftForce,
    recommendations,
  };
}

// ============================================
// Load Combination Generator
// ============================================

export function generateLoadCombinations(hasWind, hasSeismic, hasFlood) {
  const combinations = [];

  combinations.push({
    id: 'ulc-1',
    name: '1.35G',
    description: 'Dead load only',
    factors: [{ loadCaseId: 'dead', factor: 1.35 }],
    isUltimate: true,
  });

  combinations.push({
    id: 'ulc-2',
    name: '1.2G + 1.5Q',
    description: 'Dead + Live',
    factors: [
      { loadCaseId: 'dead', factor: 1.2 },
      { loadCaseId: 'live', factor: 1.5 },
    ],
    isUltimate: true,
  });

  if (hasWind) {
    combinations.push({
      id: 'ulc-3',
      name: '1.2G + W + 0.4Q',
      description: 'Dead + Wind + Live (reduced)',
      factors: [
        { loadCaseId: 'dead', factor: 1.2 },
        { loadCaseId: 'wind', factor: 1.0 },
        { loadCaseId: 'live', factor: 0.4 },
      ],
      isUltimate: true,
    });

    combinations.push({
      id: 'ulc-4',
      name: '0.9G + W',
      description: 'Dead (reduced) + Wind (uplift)',
      factors: [
        { loadCaseId: 'dead', factor: 0.9 },
        { loadCaseId: 'wind', factor: 1.0 },
      ],
      isUltimate: true,
    });
  }

  if (hasSeismic) {
    combinations.push({
      id: 'ulc-5',
      name: 'G + E + 0.3Q',
      description: 'Dead + Seismic + Live (reduced)',
      factors: [
        { loadCaseId: 'dead', factor: 1.0 },
        { loadCaseId: 'seismic', factor: 1.0 },
        { loadCaseId: 'live', factor: 0.3 },
      ],
      isUltimate: true,
    });
  }

  if (hasFlood) {
    combinations.push({
      id: 'ulc-6',
      name: '1.2G + 1.0F + 0.4Q',
      description: 'Dead + Flood + Live',
      factors: [
        { loadCaseId: 'dead', factor: 1.2 },
        { loadCaseId: 'water', factor: 1.0 },
        { loadCaseId: 'live', factor: 0.4 },
      ],
      isUltimate: true,
    });
  }

  combinations.push({
    id: 'slc-1',
    name: 'G + Q',
    description: 'Serviceability - short term',
    factors: [
      { loadCaseId: 'dead', factor: 1.0 },
      { loadCaseId: 'live', factor: 1.0 },
    ],
    isUltimate: false,
  });

  combinations.push({
    id: 'slc-2',
    name: 'G + 0.4Q',
    description: 'Serviceability - long term',
    factors: [
      { loadCaseId: 'dead', factor: 1.0 },
      { loadCaseId: 'live', factor: 0.4 },
    ],
    isUltimate: false,
  });

  return combinations;
}

// ============================================
// Structural Report Generator
// ============================================

export function generateStructuralReport(projectName, location, climateZone, seismicZone, memberDesigns) {
  const combinations = generateLoadCombinations(true, true, false);

  const generalRecommendations = [
    'All structural work to be carried out by qualified personnel',
    'Verify soil conditions before foundation construction',
    'Use approved fasteners and connectors throughout',
    'Provide adequate ventilation to all enclosed spaces',
    'Install termite protection as specified',
    'Apply weatherproofing to all external timber',
  ];

  if (seismicZone === 'zone-3' || seismicZone === 'zone-4') {
    generalRecommendations.push('Ensure all structural connections are designed for seismic loads');
    generalRecommendations.push('Provide hold-down anchors at shear wall ends');
  }

  return {
    projectInfo: {
      name: projectName,
      location,
      date: new Date(),
    },
    designCriteria: {
      climateZone,
      seismicZone,
      soilClass: 'D',
      windRegion: 'standard',
    },
    loads: {
      dead: 1.5,
      live: 2.0,
      wind: 0.8,
      seismic: 0.5,
    },
    loadCombinations: combinations,
    memberDesigns,
    generalRecommendations,
    referenceStandards: [
      'PNG Building Board Standards',
      'AS/NZS 1170 Structural Design Actions',
      'AS 1720 Timber Structures',
      'AS 3600 Concrete Structures',
      'AS 4100 Steel Structures',
    ],
  };
}
