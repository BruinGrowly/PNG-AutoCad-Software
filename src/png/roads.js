/**
 * Road Alignment and Design Module
 *
 * Provides horizontal/vertical alignment design and low-volume road
 * standards appropriate for Papua New Guinea conditions.
 *
 * Based on:
 * - ReCAP Rural Road Notes for developing countries
 * - Austroads geometric design guidelines
 * - PNG Department of Works standards
 */

import { distance, angleBetweenPoints } from '../core/geometry.js';

// ============================================
// Road Classification for PNG
// ============================================

/**
 * PNG road classification based on function and traffic
 * Aligned with ReCAP low-volume road definitions
 */
export const PNG_ROAD_CLASSES = {
  national: {
    name: 'National Road',
    description: 'Major highways connecting provinces',
    designSpeed: { min: 60, typical: 80, max: 100 },
    trafficADT: { min: 1000, typical: 3000 },
    laneWidth: 3.5,
    shoulderWidth: 1.5,
    surfaceType: 'sealed',
    designLife: 20,
  },
  provincial: {
    name: 'Provincial Road',
    description: 'Roads connecting districts within province',
    designSpeed: { min: 40, typical: 60, max: 80 },
    trafficADT: { min: 200, typical: 500 },
    laneWidth: 3.0,
    shoulderWidth: 1.0,
    surfaceType: 'sealed',
    designLife: 15,
  },
  district: {
    name: 'District Road',
    description: 'Roads connecting communities to district centers',
    designSpeed: { min: 30, typical: 40, max: 60 },
    trafficADT: { min: 50, typical: 150 },
    laneWidth: 2.75,
    shoulderWidth: 0.5,
    surfaceType: 'gravel',
    designLife: 10,
  },
  access: {
    name: 'Access Road',
    description: 'Local access roads to villages and facilities',
    designSpeed: { min: 20, typical: 30, max: 40 },
    trafficADT: { min: 10, typical: 50 },
    laneWidth: 2.5,
    shoulderWidth: 0.25,
    surfaceType: 'gravel',
    designLife: 10,
  },
  track: {
    name: 'Rural Track',
    description: 'Basic access for remote communities',
    designSpeed: { min: 15, typical: 20, max: 30 },
    trafficADT: { min: 0, typical: 20 },
    laneWidth: 3.0, // Single lane
    shoulderWidth: 0,
    surfaceType: 'earth',
    designLife: 5,
    singleLane: true,
  },
};

// ============================================
// Geometric Design Standards
// ============================================

/**
 * Minimum horizontal curve radius based on design speed
 * Calculated for e_max = 6%, f = 0.15 (conservative for tropical conditions)
 */
export const MINIMUM_CURVE_RADIUS = {
  20: 15,
  30: 30,
  40: 55,
  50: 90,
  60: 130,
  70: 175,
  80: 230,
  100: 395,
};

/**
 * Maximum gradient by road class and terrain
 */
export const MAXIMUM_GRADIENTS = {
  national: { flat: 4, rolling: 6, mountainous: 8 },
  provincial: { flat: 5, rolling: 7, mountainous: 10 },
  district: { flat: 6, rolling: 9, mountainous: 12 },
  access: { flat: 8, rolling: 10, mountainous: 14 },
  track: { flat: 10, rolling: 12, mountainous: 16 },
};

/**
 * Stopping sight distance requirements (meters)
 */
export const STOPPING_SIGHT_DISTANCE = {
  20: 20,
  30: 35,
  40: 50,
  50: 65,
  60: 85,
  70: 105,
  80: 130,
  100: 185,
};

// ============================================
// Horizontal Alignment
// ============================================

/**
 * Create a horizontal alignment from a series of points
 */
export function createAlignment(name, points, options = {}) {
  const {
    roadClass = 'district',
    designSpeed = null,
    terrain = 'rolling',
  } = options;

  const classification = PNG_ROAD_CLASSES[roadClass];
  const speed = designSpeed || classification.designSpeed.typical;
  const minRadius = MINIMUM_CURVE_RADIUS[speed] || 55;

  // Calculate tangent segments and intersection angles
  const segments = [];
  let chainage = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = distance(start, end);
    const bearing = angleBetweenPoints(start, end) * 180 / Math.PI;

    segments.push({
      type: 'tangent',
      index: i,
      start,
      end,
      length,
      bearing: bearing < 0 ? bearing + 360 : bearing,
      startChainage: chainage,
      endChainage: chainage + length,
    });

    chainage += length;
  }

  // Calculate intersection angles and recommended curves
  const intersections = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1];
    const curr = segments[i];

    let deflection = curr.bearing - prev.bearing;
    if (deflection > 180) deflection -= 360;
    if (deflection < -180) deflection += 360;

    if (Math.abs(deflection) > 1) { // More than 1 degree
      const recommendedRadius = calculateRecommendedRadius(Math.abs(deflection), speed);

      intersections.push({
        point: prev.end,
        chainage: prev.endChainage,
        inBearing: prev.bearing,
        outBearing: curr.bearing,
        deflectionAngle: deflection,
        direction: deflection > 0 ? 'right' : 'left',
        recommendedRadius: Math.max(minRadius, recommendedRadius),
        minimumRadius: minRadius,
      });
    }
  }

  return {
    type: 'alignment',
    name,
    roadClass,
    designSpeed: speed,
    terrain,
    classification,
    totalLength: chainage,
    segments,
    intersections,
    standards: {
      minRadius,
      maxGradient: MAXIMUM_GRADIENTS[roadClass][terrain],
      sightDistance: STOPPING_SIGHT_DISTANCE[speed],
      laneWidth: classification.laneWidth,
      shoulderWidth: classification.shoulderWidth,
    },
  };
}

function calculateRecommendedRadius(deflectionDeg, speed) {
  // Larger deflection angles need larger radii for comfort
  const deflectionRad = deflectionDeg * Math.PI / 180;
  const baseRadius = MINIMUM_CURVE_RADIUS[speed] || 55;

  // Increase radius for sharp turns
  if (deflectionDeg > 60) return baseRadius * 1.5;
  if (deflectionDeg > 30) return baseRadius * 1.2;
  return baseRadius;
}

/**
 * Design a horizontal curve at an intersection point
 */
export function designHorizontalCurve(intersection, radius = null, options = {}) {
  const {
    spiralLength = 0, // Transition spiral length (0 for simple curve)
    superelevationRate = 0.06, // Maximum superelevation (6%)
  } = options;

  const R = radius || intersection.recommendedRadius;
  const deflection = Math.abs(intersection.deflectionAngle);
  const deflectionRad = deflection * Math.PI / 180;

  // Simple circular curve geometry
  const tangentLength = R * Math.tan(deflectionRad / 2);
  const curveLength = R * deflectionRad;
  const externalDistance = R * (1 / Math.cos(deflectionRad / 2) - 1);
  const middleOrdinate = R * (1 - Math.cos(deflectionRad / 2));

  // Superelevation
  const superelevation = calculateSuperelevation(R, options.designSpeed || 50, superelevationRate);

  // Check against minimum radius
  const isBelowMinimum = R < intersection.minimumRadius;

  return {
    type: 'horizontal-curve',
    intersection,
    radius: R,
    deflectionAngle: deflection,
    direction: intersection.direction,
    tangentLength: Math.round(tangentLength * 100) / 100,
    curveLength: Math.round(curveLength * 100) / 100,
    externalDistance: Math.round(externalDistance * 100) / 100,
    middleOrdinate: Math.round(middleOrdinate * 100) / 100,
    superelevation: superelevation,
    pcChainage: intersection.chainage - tangentLength,
    ptChainage: intersection.chainage - tangentLength + curveLength,
    warnings: isBelowMinimum ? [{
      severity: 'error',
      message: `Radius ${R}m is below minimum ${intersection.minimumRadius}m for design speed`,
      remedy: 'Increase radius or reduce design speed',
    }] : [],
  };
}

function calculateSuperelevation(radius, speed, maxE = 0.06) {
  // e + f = V² / (127 * R)  where V in km/h, R in meters
  const required = (speed * speed) / (127 * radius);
  const f = 0.15; // Side friction factor (conservative for wet conditions)

  const e = Math.max(0.02, Math.min(maxE, required - f));

  return {
    rate: Math.round(e * 1000) / 1000,
    percent: Math.round(e * 100 * 10) / 10,
    runoffLength: Math.round(speed * e * 10), // Approximate runoff length
  };
}

// ============================================
// Vertical Alignment
// ============================================

/**
 * Create a vertical profile from elevation points along alignment
 */
export function createVerticalProfile(alignment, elevationPoints) {
  // elevationPoints: array of { chainage, elevation }
  const sorted = [...elevationPoints].sort((a, b) => a.chainage - b.chainage);

  const grades = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const start = sorted[i];
    const end = sorted[i + 1];
    const rise = end.elevation - start.elevation;
    const run = end.chainage - start.chainage;
    const gradePercent = (rise / run) * 100;

    grades.push({
      startChainage: start.chainage,
      endChainage: end.chainage,
      startElevation: start.elevation,
      endElevation: end.elevation,
      length: run,
      rise,
      grade: Math.round(gradePercent * 100) / 100,
      direction: gradePercent > 0 ? 'uphill' : gradePercent < 0 ? 'downhill' : 'level',
    });
  }

  // Find vertical intersection points (VIPs)
  const vips = [];
  for (let i = 1; i < grades.length; i++) {
    const prev = grades[i - 1];
    const curr = grades[i];
    const algebraicDiff = curr.grade - prev.grade;

    if (Math.abs(algebraicDiff) > 0.5) { // Significant grade change
      vips.push({
        chainage: prev.endChainage,
        elevation: prev.endElevation,
        inGrade: prev.grade,
        outGrade: curr.grade,
        algebraicDiff,
        type: algebraicDiff > 0 ? 'sag' : 'crest',
      });
    }
  }

  // Check grades against standards
  const maxGrade = MAXIMUM_GRADIENTS[alignment.roadClass]?.[alignment.terrain] || 10;
  const warnings = [];

  for (const grade of grades) {
    if (Math.abs(grade.grade) > maxGrade) {
      warnings.push({
        severity: 'error',
        chainage: grade.startChainage,
        message: `Grade ${grade.grade}% exceeds maximum ${maxGrade}% for ${alignment.roadClass} road in ${alignment.terrain} terrain`,
        remedy: 'Reduce grade or reclassify road',
      });
    }
  }

  return {
    type: 'vertical-profile',
    alignment: alignment.name,
    elevationPoints: sorted,
    grades,
    vips,
    statistics: {
      minElevation: Math.min(...sorted.map(p => p.elevation)),
      maxElevation: Math.max(...sorted.map(p => p.elevation)),
      totalRise: sorted[sorted.length - 1].elevation - sorted[0].elevation,
      maxGrade: Math.max(...grades.map(g => Math.abs(g.grade))),
      avgGrade: grades.reduce((sum, g) => sum + Math.abs(g.grade), 0) / grades.length,
    },
    maxAllowedGrade: maxGrade,
    warnings,
  };
}

/**
 * Design a vertical curve at a VIP
 */
export function designVerticalCurve(vip, curveLength = null, designSpeed = 50) {
  const A = Math.abs(vip.algebraicDiff);
  const ssd = STOPPING_SIGHT_DISTANCE[designSpeed] || 65;

  // Calculate minimum curve length for sight distance
  let minLength;
  if (vip.type === 'crest') {
    // Crest curve: L = A*S² / (200*(√h1 + √h2)²)  where h1=1.05m (driver eye), h2=0.15m (object)
    minLength = (A * ssd * ssd) / (200 * Math.pow(Math.sqrt(1.05) + Math.sqrt(0.15), 2));
  } else {
    // Sag curve: L = A*S² / (200*(h + S*tan(1°)))  where h=0.6m (headlight height)
    minLength = (A * ssd * ssd) / (200 * (0.6 + ssd * Math.tan(Math.PI / 180)));
  }

  // Use provided length or minimum
  const L = curveLength || Math.max(minLength, 30); // At least 30m

  // Curve properties
  const K = L / A; // Rate of vertical curvature
  const e = (A * L) / 800; // External distance (middle ordinate)

  return {
    type: 'vertical-curve',
    vip,
    curveType: vip.type,
    curveLength: Math.round(L),
    minCurveLength: Math.round(minLength),
    kValue: Math.round(K * 10) / 10,
    externalDistance: Math.round(e * 100) / 100,
    startChainage: vip.chainage - L / 2,
    endChainage: vip.chainage + L / 2,
    highLowPoint: vip.type === 'crest'
      ? { chainage: vip.chainage - (vip.inGrade * L) / (2 * vip.algebraicDiff) }
      : { chainage: vip.chainage - (vip.inGrade * L) / (2 * vip.algebraicDiff) },
    sightDistanceProvided: L >= minLength ? ssd : Math.sqrt(L * 200 * 2.74 / A),
    adequate: L >= minLength,
    warnings: L < minLength ? [{
      severity: 'warning',
      message: `Curve length ${Math.round(L)}m is less than recommended ${Math.round(minLength)}m`,
      remedy: 'Increase curve length for adequate sight distance',
    }] : [],
  };
}

// ============================================
// Cross Section Design
// ============================================

/**
 * Standard cross-section templates for PNG road classes
 */
export const CROSS_SECTION_TEMPLATES = {
  national_sealed: {
    name: 'National Road - Sealed',
    carriageway: { width: 7.0, lanes: 2, crossfall: 2.5 },
    shoulders: { width: 1.5, crossfall: 4.0, sealed: true },
    drains: { type: 'lined', width: 0.6, depth: 0.4 },
    batters: { cut: '1:1', fill: '1:1.5' },
    formation: 10.0,
  },
  provincial_sealed: {
    name: 'Provincial Road - Sealed',
    carriageway: { width: 6.0, lanes: 2, crossfall: 2.5 },
    shoulders: { width: 1.0, crossfall: 4.0, sealed: false },
    drains: { type: 'earth', width: 0.5, depth: 0.3 },
    batters: { cut: '1:1', fill: '1:1.5' },
    formation: 8.0,
  },
  district_gravel: {
    name: 'District Road - Gravel',
    carriageway: { width: 5.5, lanes: 2, crossfall: 4.0 },
    shoulders: { width: 0.5, crossfall: 5.0, sealed: false },
    drains: { type: 'earth', width: 0.4, depth: 0.3 },
    batters: { cut: '1:0.75', fill: '1:1.5' },
    formation: 6.5,
  },
  access_gravel: {
    name: 'Access Road - Gravel',
    carriageway: { width: 5.0, lanes: 2, crossfall: 4.0 },
    shoulders: { width: 0.25, crossfall: 5.0, sealed: false },
    drains: { type: 'earth', width: 0.3, depth: 0.25 },
    batters: { cut: '1:0.75', fill: '1:1.5' },
    formation: 5.5,
  },
  track_earth: {
    name: 'Rural Track - Earth',
    carriageway: { width: 3.0, lanes: 1, crossfall: 5.0 },
    shoulders: { width: 0, crossfall: 0, sealed: false },
    drains: { type: 'swale', width: 0.5, depth: 0.2 },
    batters: { cut: '1:0.5', fill: '1:1' },
    formation: 4.0,
  },
};

/**
 * Generate cross-section at a chainage
 */
export function generateCrossSection(chainage, profile, template, terrain = null) {
  const section = CROSS_SECTION_TEMPLATES[template];
  if (!section) {
    throw new Error(`Unknown template: ${template}`);
  }

  // Get design elevation from profile
  let designElevation = 0;
  if (profile) {
    const grade = profile.grades.find(g =>
      chainage >= g.startChainage && chainage <= g.endChainage
    );
    if (grade) {
      const dist = chainage - grade.startChainage;
      designElevation = grade.startElevation + (grade.grade / 100) * dist;
    }
  }

  // Generate cross-section points
  const halfCarriageway = section.carriageway.width / 2;
  const shoulderWidth = section.shoulders.width;
  const drainWidth = section.drains.width;

  const points = [];

  // Left side (from outside in)
  if (terrain) {
    points.push({ offset: -(halfCarriageway + shoulderWidth + drainWidth + 5), elevation: terrain.left || designElevation });
  }
  points.push({
    offset: -(halfCarriageway + shoulderWidth + drainWidth),
    elevation: designElevation - section.drains.depth,
    label: 'Drain invert',
  });
  points.push({
    offset: -(halfCarriageway + shoulderWidth),
    elevation: designElevation - (shoulderWidth * section.shoulders.crossfall / 100),
    label: 'Edge shoulder',
  });
  points.push({
    offset: -halfCarriageway,
    elevation: designElevation,
    label: 'Edge carriageway',
  });

  // Centerline
  points.push({
    offset: 0,
    elevation: designElevation + (halfCarriageway * section.carriageway.crossfall / 100),
    label: 'Centerline',
  });

  // Right side (mirror)
  points.push({
    offset: halfCarriageway,
    elevation: designElevation,
    label: 'Edge carriageway',
  });
  points.push({
    offset: halfCarriageway + shoulderWidth,
    elevation: designElevation - (shoulderWidth * section.shoulders.crossfall / 100),
    label: 'Edge shoulder',
  });
  points.push({
    offset: halfCarriageway + shoulderWidth + drainWidth,
    elevation: designElevation - section.drains.depth,
    label: 'Drain invert',
  });
  if (terrain) {
    points.push({ offset: halfCarriageway + shoulderWidth + drainWidth + 5, elevation: terrain.right || designElevation });
  }

  return {
    chainage,
    designElevation,
    template: section.name,
    formationWidth: section.formation,
    points,
    carriageway: section.carriageway,
    shoulders: section.shoulders,
    drains: section.drains,
    batters: section.batters,
  };
}

// ============================================
// Low-Volume Road Specific Functions
// ============================================

/**
 * Assess appropriate road standard based on traffic and conditions
 */
export function assessRoadStandard(params) {
  const {
    estimatedADT, // Average Daily Traffic
    percentHeavyVehicles = 10,
    designLife = 10,
    terrain = 'rolling',
    rainfallZone = 'high', // low, medium, high, very-high
    accessImportance = 'standard', // basic, standard, important, critical
  } = params;

  // Calculate design traffic
  const growthRate = 0.03; // 3% annual growth
  const growthFactor = (Math.pow(1 + growthRate, designLife) - 1) / (growthRate * designLife);
  const designADT = estimatedADT * growthFactor;

  // Equivalent Standard Axles per vehicle (simplified)
  const esaPerHeavy = 2.5;
  const esaPerLight = 0.01;
  const dailyESA = (estimatedADT * percentHeavyVehicles / 100 * esaPerHeavy) +
    (estimatedADT * (100 - percentHeavyVehicles) / 100 * esaPerLight);
  const designESA = dailyESA * 365 * designLife * growthFactor / 1000000; // Million ESA

  // Recommend road class
  let recommendedClass;
  if (designADT > 500 || accessImportance === 'critical') {
    recommendedClass = 'provincial';
  } else if (designADT > 100 || accessImportance === 'important') {
    recommendedClass = 'district';
  } else if (designADT > 25) {
    recommendedClass = 'access';
  } else {
    recommendedClass = 'track';
  }

  // Recommend surface type
  let surfaceType;
  if (designESA > 0.5) {
    surfaceType = 'sealed';
  } else if (rainfallZone === 'very-high' && designADT > 50) {
    surfaceType = 'sealed'; // High rainfall requires sealing for maintainability
  } else if (designESA > 0.1) {
    surfaceType = 'gravel';
  } else {
    surfaceType = 'earth';
  }

  return {
    inputParameters: params,
    designTraffic: {
      currentADT: estimatedADT,
      designADT: Math.round(designADT),
      growthFactor: Math.round(growthFactor * 100) / 100,
      designESA: Math.round(designESA * 1000) / 1000,
    },
    recommendation: {
      roadClass: recommendedClass,
      classification: PNG_ROAD_CLASSES[recommendedClass],
      surfaceType,
      designSpeed: PNG_ROAD_CLASSES[recommendedClass].designSpeed.typical,
      crossSection: `${recommendedClass}_${surfaceType === 'sealed' ? 'sealed' : 'gravel'}`,
    },
    reasoning: [
      `Design traffic of ${Math.round(designADT)} vpd suggests ${recommendedClass} classification`,
      `${designESA.toFixed(3)} MESA over ${designLife} years`,
      rainfallZone === 'very-high' ? 'High rainfall zone favors sealed surface for durability' : null,
      accessImportance !== 'standard' ? `${accessImportance} access importance considered` : null,
    ].filter(Boolean),
  };
}

/**
 * Calculate pavement thickness for gravel roads
 * Based on DCP-DN method from ReCAP guidelines
 */
export function calculateGravelThickness(params) {
  const {
    designESA, // Million ESA
    subgradeStrength, // CBR percent or 'weak', 'medium', 'strong'
    materialQuality = 'standard', // poor, standard, good
    rainfallZone = 'high',
  } = params;

  // Convert descriptive subgrade to CBR
  let cbr;
  if (typeof subgradeStrength === 'number') {
    cbr = subgradeStrength;
  } else {
    cbr = { weak: 3, medium: 8, strong: 15 }[subgradeStrength] || 8;
  }

  // Material quality factor
  const qualityFactor = { poor: 1.3, standard: 1.0, good: 0.85 }[materialQuality] || 1.0;

  // Rainfall factor (tropical adjustment)
  const rainfallFactor = { low: 0.9, medium: 1.0, high: 1.1, 'very-high': 1.25 }[rainfallZone] || 1.0;

  // Base thickness calculation (simplified TRL ORN31 method)
  // T = 58 * N^0.24 / CBR^0.5  where N = ESA in thousands
  const baseThickness = 58 * Math.pow(designESA * 1000, 0.24) / Math.pow(cbr, 0.5);

  // Apply factors
  const adjustedThickness = baseThickness * qualityFactor * rainfallFactor;

  // Minimum thicknesses
  const minThickness = { weak: 200, medium: 150, strong: 125 }[subgradeStrength] || 150;

  const finalThickness = Math.max(minThickness, Math.round(adjustedThickness / 25) * 25); // Round to 25mm

  return {
    designESA,
    subgradeCBR: cbr,
    materialQuality,
    rainfallZone,
    calculatedThickness: Math.round(adjustedThickness),
    minimumThickness: minThickness,
    recommendedThickness: finalThickness,
    layers: finalThickness > 200 ? [
      { name: 'Wearing course', thickness: 75, material: 'Selected gravel' },
      { name: 'Base', thickness: finalThickness - 75, material: 'Natural gravel' },
    ] : [
      { name: 'Gravel surfacing', thickness: finalThickness, material: 'Selected gravel' },
    ],
    maintenanceInterval: rainfallZone === 'very-high' ? '6-12 months' : '12-18 months',
    notes: [
      'Ensure adequate drainage before surfacing',
      'Compact to at least 95% MDD',
      cbr < 5 ? 'Consider subgrade improvement or geotextile' : null,
      rainfallZone === 'very-high' ? 'Consider surface treatment if budget allows' : null,
    ].filter(Boolean),
  };
}

// ============================================
// Safety Checks
// ============================================

/**
 * Perform safety audit on alignment design
 */
export function auditAlignmentSafety(alignment, profile = null) {
  const issues = [];
  const { designSpeed, standards } = alignment;

  // Check horizontal curves
  for (const intersection of alignment.intersections) {
    if (intersection.recommendedRadius < standards.minRadius) {
      issues.push({
        type: 'horizontal-geometry',
        severity: 'error',
        location: `Chainage ${intersection.chainage.toFixed(0)}m`,
        issue: `Sharp curve (${Math.abs(intersection.deflectionAngle).toFixed(1)}°) requires radius ≥${standards.minRadius}m`,
        recommendation: 'Realign to increase curve radius or add warning signs',
      });
    }
  }

  // Check vertical grades
  if (profile) {
    for (const grade of profile.grades) {
      if (Math.abs(grade.grade) > standards.maxGrade) {
        issues.push({
          type: 'vertical-geometry',
          severity: 'error',
          location: `Chainage ${grade.startChainage.toFixed(0)}-${grade.endChainage.toFixed(0)}m`,
          issue: `Grade ${grade.grade.toFixed(1)}% exceeds maximum ${standards.maxGrade}%`,
          recommendation: 'Reduce grade or improve surface for traction',
        });
      }

      // Long steep grades
      if (Math.abs(grade.grade) > 8 && grade.length > 300) {
        issues.push({
          type: 'vertical-geometry',
          severity: 'warning',
          location: `Chainage ${grade.startChainage.toFixed(0)}m`,
          issue: `Long steep grade (${grade.grade.toFixed(1)}% for ${grade.length.toFixed(0)}m)`,
          recommendation: 'Consider runaway vehicle facilities or rest areas',
        });
      }
    }

    // Check crest curves for sight distance
    for (const vip of profile.vips) {
      if (vip.type === 'crest' && Math.abs(vip.algebraicDiff) > 5) {
        issues.push({
          type: 'sight-distance',
          severity: 'warning',
          location: `Chainage ${vip.chainage.toFixed(0)}m`,
          issue: `Crest with ${Math.abs(vip.algebraicDiff).toFixed(1)}% change may limit sight distance`,
          recommendation: `Provide vertical curve with K ≥ ${Math.round(STOPPING_SIGHT_DISTANCE[designSpeed] ** 2 / (200 * 2.74))}`,
        });
      }
    }
  }

  // Check combination of horizontal and vertical
  if (profile) {
    for (const intersection of alignment.intersections) {
      const nearbyVIP = profile.vips.find(v =>
        Math.abs(v.chainage - intersection.chainage) < 100
      );
      if (nearbyVIP) {
        issues.push({
          type: 'combined-geometry',
          severity: 'warning',
          location: `Chainage ${intersection.chainage.toFixed(0)}m`,
          issue: 'Horizontal curve coincides with vertical curve',
          recommendation: 'Separate horizontal and vertical curves where possible',
        });
      }
    }
  }

  return {
    alignment: alignment.name,
    designSpeed,
    roadClass: alignment.roadClass,
    totalLength: alignment.totalLength,
    issueCount: issues.length,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length,
    issues,
    overallRating: issues.filter(i => i.severity === 'error').length === 0
      ? (issues.length === 0 ? 'Good' : 'Acceptable with warnings')
      : 'Requires revision',
  };
}
