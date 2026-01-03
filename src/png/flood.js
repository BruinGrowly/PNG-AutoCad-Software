/**
 * PNG Flood Analysis Module
 * Flood risk assessment and design for Papua New Guinea
 */

// ============================================
// Flood Zone Definitions
// ============================================

const FLOOD_ZONE_DATA = {
  'minimal': {
    zone: 'minimal',
    description: 'Areas with minimal flood risk',
    returnPeriod: 500,
    expectedFrequency: 'Very rare (once in 500 years)',
    minimumFloorElevation: 0.3,
    constructionRestrictions: [],
    insuranceCategory: 'standard',
  },
  'moderate': {
    zone: 'moderate',
    description: '100-year flood zone',
    returnPeriod: 100,
    expectedFrequency: '1% annual chance',
    minimumFloorElevation: 0.6,
    constructionRestrictions: [
      'Elevate floor above 100-year flood level',
      'Use flood-resistant materials below flood level',
    ],
    insuranceCategory: 'elevated',
  },
  'high': {
    zone: 'high',
    description: '50-year flood zone',
    returnPeriod: 50,
    expectedFrequency: '2% annual chance',
    minimumFloorElevation: 1.0,
    constructionRestrictions: [
      'Mandatory elevated construction',
      'No habitable rooms below flood level',
      'Flood-resistant materials required',
      'Emergency access planning required',
    ],
    insuranceCategory: 'restricted',
  },
  'very-high': {
    zone: 'very-high',
    description: 'Annual flood zone / floodway',
    returnPeriod: 10,
    expectedFrequency: 'Regular flooding expected',
    minimumFloorElevation: 1.5,
    constructionRestrictions: [
      'Elevated or floating construction only',
      'No permanent structures in floodway',
      'Traditional stilt housing recommended',
      'Emergency evacuation plan mandatory',
      'All services above flood level',
    ],
    insuranceCategory: 'restricted',
  },
};

// ============================================
// Terrain-based Flood Risk
// ============================================

const TERRAIN_FLOOD_RISK = {
  'coastal-lowland': 'moderate',
  'riverine-floodplain': 'very-high',
  'highland-valley': 'moderate',
  'mountainous': 'minimal',
  'island-atoll': 'moderate',
  'swamp-wetland': 'very-high',
};

// ============================================
// Major River Systems in PNG
// ============================================

export const PNG_RIVER_SYSTEMS = [
  {
    name: 'Sepik River',
    provinces: ['East Sepik', 'Sandaun'],
    length: 1126,
    catchmentArea: 77700,
    averageDischarge: 4000,
    floodRisk: 'very-high',
    majorTributaries: ['April River', 'Yuat River', 'Keram River'],
    floodSeason: [1, 2, 3, 4],
    notes: 'Second longest river in PNG. Extensive floodplains with annual flooding.',
  },
  {
    name: 'Fly River',
    provinces: ['Western', 'Gulf'],
    length: 1050,
    catchmentArea: 64000,
    averageDischarge: 6000,
    floodRisk: 'very-high',
    majorTributaries: ['Strickland River', 'Ok Tedi'],
    floodSeason: [12, 1, 2, 3, 4],
    notes: 'Largest river by discharge. Mining impacts on sediment load.',
  },
  {
    name: 'Markham River',
    provinces: ['Morobe'],
    length: 180,
    catchmentArea: 12000,
    averageDischarge: 800,
    floodRisk: 'high',
    majorTributaries: ['Watut River', 'Wampit River'],
    floodSeason: [11, 12, 1, 2, 3],
    notes: 'Major river in Morobe. Flash flooding during wet season.',
  },
  {
    name: 'Ramu River',
    provinces: ['Madang', 'East Sepik'],
    length: 640,
    catchmentArea: 15000,
    averageDischarge: 1500,
    floodRisk: 'high',
    majorTributaries: ['Sogeram River', 'Fayantina River'],
    floodSeason: [12, 1, 2, 3, 4],
    notes: 'Significant agricultural area along river.',
  },
  {
    name: 'Purari River',
    provinces: ['Gulf', 'Southern Highlands'],
    length: 470,
    catchmentArea: 33000,
    averageDischarge: 2500,
    floodRisk: 'very-high',
    majorTributaries: ['Wahgi River', 'Tua River'],
    floodSeason: [12, 1, 2, 3],
    notes: 'High sediment load. Extensive delta system.',
  },
];

// ============================================
// Flood Analysis Functions
// ============================================

export function getFloodZoneData(zone) {
  return FLOOD_ZONE_DATA[zone];
}

export function getTerrainFloodRisk(terrainType) {
  return TERRAIN_FLOOD_RISK[terrainType];
}

export function getRiverSystemsForProvince(province) {
  return PNG_RIVER_SYSTEMS.filter(r => r.provinces.includes(province));
}

// ============================================
// Flood Level Estimation
// ============================================

export function estimateFloodLevels(terrainType, distanceFromWater, groundElevation, isCoastal) {
  const estimates = [];

  const baseLevel = {
    'coastal-lowland': 1.5,
    'riverine-floodplain': 3.0,
    'highland-valley': 1.0,
    'mountainous': 0.3,
    'island-atoll': 2.0,
    'swamp-wetland': 2.5,
  };

  const base = baseLevel[terrainType];
  const distanceFactor = Math.max(0.3, 1 - distanceFromWater / 500);

  const returnPeriods = [10, 50, 100, 500];

  for (const rp of returnPeriods) {
    const rpFactor = Math.log10(rp) / 2;
    const level = base * rpFactor * distanceFactor;

    let velocity = 1.0;
    if (terrainType === 'mountainous' || terrainType === 'highland-valley') {
      velocity = 2.5;
    } else if (terrainType === 'swamp-wetland') {
      velocity = 0.5;
    }

    let duration = 24;
    if (terrainType === 'riverine-floodplain') {
      duration = 72;
    } else if (terrainType === 'mountainous') {
      duration = 6;
    }

    const recommendations = [];

    if (level > 1.0) {
      recommendations.push('Elevated construction required');
      recommendations.push('Install flood warning system');
    }

    if (velocity > 1.5) {
      recommendations.push('Design for debris impact loads');
      recommendations.push('Strengthen foundation against scour');
    }

    if (isCoastal) {
      recommendations.push('Consider storm surge in combination with rainfall flooding');
      recommendations.push('Use marine-grade materials below flood level');
    }

    estimates.push({
      returnPeriod: rp,
      floodLevel: Math.round(level * 10) / 10,
      velocity: Math.round(velocity * 10) / 10,
      duration,
      debrisRisk: velocity > 2 ? 'high' : velocity > 1 ? 'moderate' : 'low',
      recommendations,
    });
  }

  return estimates;
}

// ============================================
// Flood-Resistant Design
// ============================================

export function designForFloodZone(floodZone, buildingType, designFloodLevel) {
  const zoneData = getFloodZoneData(floodZone);

  let foundationType = 'elevated-slab';
  if (floodZone === 'very-high') {
    foundationType = 'piles';
  } else if (floodZone === 'high') {
    foundationType = buildingType === 'residential' ? 'piles' : 'platform';
  }

  const minimumFloorHeight = Math.max(
    zoneData.minimumFloorElevation,
    designFloodLevel + 0.3
  );

  let wallConstruction = 'Standard construction above flood level';
  if (floodZone === 'high' || floodZone === 'very-high') {
    wallConstruction = 'Flood-resistant walls below flood level: concrete block with render, or treated timber with removable panels';
  }

  const floodOpenings = floodZone !== 'minimal';

  let floodVents = null;
  if (floodOpenings && foundationType !== 'piles') {
    floodVents = {
      size: '150x150mm mesh-protected vents',
      quantity: 4,
    };
  }

  const materials = [];
  if (floodZone !== 'minimal') {
    materials.push('Concrete or treated timber for subfloor structure');
    materials.push('Galvanized or stainless steel fasteners');
    materials.push('Closed-cell foam insulation if required');
    materials.push('Marine-grade electrical components below flood level');
  }
  materials.push('Mold-resistant materials throughout');
  materials.push('Treated timber (H4 or higher) for ground contact');

  const serviceLocations = [
    `Electrical switchboard: minimum ${minimumFloorHeight + 0.3}m above ground`,
    `Hot water system: above flood level`,
    `Air conditioning equipment: above flood level`,
  ];

  if (floodZone === 'high' || floodZone === 'very-high') {
    serviceLocations.push('Septic/sewage: sealed system above flood level');
    serviceLocations.push('Fuel storage: anchored and above flood level');
  }

  const accessRequirements = [];
  if (minimumFloorHeight > 0.6) {
    accessRequirements.push('Stairs with handrails required');
    accessRequirements.push('Consider ramp for accessibility');
  }
  if (floodZone === 'very-high') {
    accessRequirements.push('Alternative access route for flood conditions');
    accessRequirements.push('Boat tie-up point recommended');
  }

  const emergencyFeatures = [];
  if (floodZone !== 'minimal') {
    emergencyFeatures.push('Flood warning markers on building');
    emergencyFeatures.push('Emergency supply storage above flood level');
  }
  if (floodZone === 'high' || floodZone === 'very-high') {
    emergencyFeatures.push('Emergency communication equipment');
    emergencyFeatures.push('Evacuation route signage');
    emergencyFeatures.push('Roof access for emergency rescue');
  }

  return {
    foundationType,
    minimumFloorHeight,
    wallConstruction,
    floodOpenings,
    floodVents,
    materials,
    serviceLocations,
    accessRequirements,
    emergencyFeatures,
  };
}

// ============================================
// Traditional PNG Flood-Adapted Housing
// ============================================

export const TRADITIONAL_FLOOD_HOUSING = [
  {
    type: 'Haus Win (Stilt House)',
    description: 'Traditional elevated house on timber posts, common in lowland and coastal areas',
    regions: ['Sepik', 'Gulf', 'Western Province', 'Coastal areas'],
    keyFeatures: [
      'Raised floor 1-3m above ground',
      'Timber or bamboo posts embedded in ground',
      'Open or lattice walls for ventilation',
      'Ladder or stairs for access',
      'Space below used for storage, animals, or work',
    ],
    adaptations: [
      'Height varies based on local flood levels',
      'Flexible connections allow movement',
      'Traditional lashing absorbs flood forces',
      'Easily repairable after flood damage',
    ],
    modernIntegration: [
      'Use concrete footings for posts',
      'Treat timber posts for longevity',
      'Incorporate modern bracing systems',
      'Add handrails to stairs for safety',
      'Install modern roofing on traditional frame',
    ],
  },
  {
    type: 'Floating House',
    description: 'Houses designed to rise with flood waters, found in some Sepik communities',
    regions: ['Middle Sepik', 'Lake Murray area'],
    keyFeatures: [
      'Buoyant base from logs or drums',
      'Guide posts prevent drifting',
      'Flexible service connections',
      'Lightweight construction',
    ],
    adaptations: [
      'Rises and falls with water level',
      'No structural stress from water',
      'Suitable for annual flooding',
    ],
    modernIntegration: [
      'Use modern flotation materials',
      'Add stability systems',
      'Flexible utility connections',
      'Anchor system for safety',
    ],
  },
  {
    type: 'Haus Bilong Warawara (Swamp House)',
    description: 'Specialized construction for permanent swamp/wetland areas',
    regions: ['Sepik Plains', 'Kikori Delta', 'Purari Delta'],
    keyFeatures: [
      'Very high elevation (2-4m)',
      'Sago palm materials',
      'Narrow platforms between houses',
      'Canoe access below',
    ],
    adaptations: [
      'Designed for permanent water presence',
      'Materials resistant to constant moisture',
      'Community layout for mutual support',
    ],
    modernIntegration: [
      'Concrete or steel pile foundations',
      'Treated timber deck framing',
      'Modern roofing materials',
      'Solar power and water collection',
    ],
  },
];

// ============================================
// Flood Report Generation
// ============================================

export function generateFloodReport(province, terrainType, distanceFromWater, groundElevation, buildingType, isCoastal) {
  const floodZone = getTerrainFloodRisk(terrainType);
  const zoneData = getFloodZoneData(floodZone);
  const nearbyRivers = getRiverSystemsForProvince(province);
  const floodEstimates = estimateFloodLevels(terrainType, distanceFromWater, groundElevation, isCoastal);

  const designFloodLevel = floodEstimates.find(e => e.returnPeriod === 100)?.floodLevel || 1.5;
  const designRequirements = designForFloodZone(floodZone, buildingType, designFloodLevel);

  const traditionalApproaches = TRADITIONAL_FLOOD_HOUSING.filter(t =>
    terrainType === 'riverine-floodplain' ||
    terrainType === 'swamp-wetland' ||
    terrainType === 'coastal-lowland'
  );

  const recommendations = [];

  if (nearbyRivers.length > 0) {
    recommendations.push(`Located near ${nearbyRivers.map(r => r.name).join(', ')} - check historical flood levels`);
    const floodSeasons = [...new Set(nearbyRivers.flatMap(r => r.floodSeason))].sort((a, b) => a - b);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    recommendations.push(`Primary flood season: ${floodSeasons.map(m => monthNames[m - 1]).join(', ')}`);
  }

  recommendations.push(`Design floor level: ${designRequirements.minimumFloorHeight}m above ground`);
  recommendations.push(`Foundation type: ${designRequirements.foundationType}`);

  if (floodZone === 'very-high') {
    recommendations.push('Consider traditional stilt house design adapted with modern materials');
    recommendations.push('Engage with local community about historical flood patterns');
  }

  if (isCoastal) {
    recommendations.push('Consider combined river and tidal/storm surge flooding');
    recommendations.push('Climate change may increase coastal flood risk');
  }

  return {
    location: province,
    terrainType,
    floodZone,
    zoneData,
    nearbyRivers,
    floodEstimates,
    designRequirements,
    traditionalApproaches,
    recommendations,
  };
}
