/**
 * Terrain and Drainage Analysis Module
 *
 * Provides terrain modeling, watershed analysis, and drainage design
 * for tropical conditions in Papua New Guinea.
 *
 * Based on:
 * - ReCAP Rural Road Notes for tropical drainage
 * - ASCE flood-resistant design standards
 * - PNG climate data for rainfall intensity
 */

// ============================================
// PNG Rainfall Intensity Data (IDF Curves)
// ============================================

/**
 * Rainfall intensity-duration-frequency data for PNG regions
 * Values in mm/hr for various return periods and durations
 * Based on Bureau of Meteorology Pacific data
 */
export const PNG_RAINFALL_IDF = {
  coastal: {
    name: 'Coastal Lowlands',
    description: 'High intensity tropical rainfall',
    // Return period (years) -> duration (minutes) -> intensity (mm/hr)
    intensities: {
      2: { 5: 180, 10: 150, 15: 130, 30: 95, 60: 65, 120: 40 },
      5: { 5: 220, 10: 185, 15: 160, 30: 115, 60: 80, 120: 50 },
      10: { 5: 250, 10: 210, 15: 180, 30: 130, 60: 90, 120: 58 },
      25: { 5: 290, 10: 245, 15: 210, 30: 150, 60: 105, 120: 68 },
      50: { 5: 320, 10: 270, 15: 230, 30: 165, 60: 115, 120: 75 },
      100: { 5: 350, 10: 295, 15: 250, 30: 180, 60: 125, 120: 82 },
    },
    annualRainfall: 3000, // mm
  },
  highlands: {
    name: 'Highlands',
    description: 'Moderate intensity, frequent rainfall',
    intensities: {
      2: { 5: 140, 10: 115, 15: 100, 30: 70, 60: 48, 120: 30 },
      5: { 5: 170, 10: 140, 15: 120, 30: 85, 60: 58, 120: 38 },
      10: { 5: 195, 10: 160, 15: 138, 30: 98, 60: 68, 120: 44 },
      25: { 5: 225, 10: 185, 15: 160, 30: 112, 60: 78, 120: 52 },
      50: { 5: 250, 10: 205, 15: 178, 30: 125, 60: 88, 120: 58 },
      100: { 5: 275, 10: 225, 15: 195, 30: 138, 60: 96, 120: 64 },
    },
    annualRainfall: 2500,
  },
  islands: {
    name: 'Island Regions',
    description: 'Very high intensity, cyclone-prone',
    intensities: {
      2: { 5: 200, 10: 168, 15: 145, 30: 105, 60: 72, 120: 45 },
      5: { 5: 245, 10: 205, 15: 178, 30: 128, 60: 88, 120: 56 },
      10: { 5: 280, 10: 235, 15: 202, 30: 145, 60: 100, 120: 65 },
      25: { 5: 325, 10: 272, 15: 235, 30: 168, 60: 116, 120: 76 },
      50: { 5: 360, 10: 302, 15: 260, 30: 186, 60: 128, 120: 84 },
      100: { 5: 395, 10: 332, 15: 285, 30: 204, 60: 142, 120: 92 },
    },
    annualRainfall: 3500,
  },
  momase: {
    name: 'Momase (North Coast)',
    description: 'High rainfall, seasonal variation',
    intensities: {
      2: { 5: 190, 10: 158, 15: 136, 30: 98, 60: 68, 120: 42 },
      5: { 5: 230, 10: 192, 15: 165, 30: 118, 60: 82, 120: 52 },
      10: { 5: 262, 10: 218, 15: 188, 30: 135, 60: 94, 120: 60 },
      25: { 5: 302, 10: 252, 15: 218, 30: 155, 60: 108, 120: 70 },
      50: { 5: 335, 10: 280, 15: 240, 30: 172, 60: 120, 120: 78 },
      100: { 5: 368, 10: 308, 15: 265, 30: 188, 60: 132, 120: 86 },
    },
    annualRainfall: 3200,
  },
};

// ============================================
// Terrain Analysis
// ============================================

/**
 * Create a digital terrain model from elevation points
 */
export function createTerrainModel(elevationPoints, options = {}) {
  const {
    gridSpacing = 10, // meters
    interpolationMethod = 'idw', // inverse distance weighting
  } = options;

  // Calculate bounds
  const bounds = {
    minX: Math.min(...elevationPoints.map(p => p.x)),
    maxX: Math.max(...elevationPoints.map(p => p.x)),
    minY: Math.min(...elevationPoints.map(p => p.y)),
    maxY: Math.max(...elevationPoints.map(p => p.y)),
    minZ: Math.min(...elevationPoints.map(p => p.z)),
    maxZ: Math.max(...elevationPoints.map(p => p.z)),
  };

  // Create grid
  const cols = Math.ceil((bounds.maxX - bounds.minX) / gridSpacing) + 1;
  const rows = Math.ceil((bounds.maxY - bounds.minY) / gridSpacing) + 1;
  const grid = [];

  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      const x = bounds.minX + col * gridSpacing;
      const y = bounds.minY + row * gridSpacing;
      const z = interpolateElevation(x, y, elevationPoints, interpolationMethod);
      grid[row][col] = { x, y, z };
    }
  }

  return {
    type: 'terrain-model',
    bounds,
    gridSpacing,
    rows,
    cols,
    grid,
    sourcePoints: elevationPoints,
    statistics: calculateTerrainStatistics(grid),
  };
}

function interpolateElevation(x, y, points, method) {
  if (method === 'idw') {
    // Inverse Distance Weighting
    let sumWeights = 0;
    let sumValues = 0;
    const power = 2;

    for (const p of points) {
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < 0.001) return p.z; // Exact point

      const weight = 1 / Math.pow(dist, power);
      sumWeights += weight;
      sumValues += weight * p.z;
    }

    return sumValues / sumWeights;
  }

  // Nearest neighbor fallback
  let nearest = points[0];
  let minDist = Infinity;
  for (const p of points) {
    const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
    if (dist < minDist) {
      minDist = dist;
      nearest = p;
    }
  }
  return nearest.z;
}

function calculateTerrainStatistics(grid) {
  let minElev = Infinity, maxElev = -Infinity, sumElev = 0, count = 0;
  const slopes = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const z = grid[row][col].z;
      minElev = Math.min(minElev, z);
      maxElev = Math.max(maxElev, z);
      sumElev += z;
      count++;

      // Calculate slope to neighbors
      if (row > 0 && col > 0) {
        const dz = Math.abs(z - grid[row - 1][col - 1].z);
        const dx = Math.sqrt(2) * (grid[1][1].x - grid[0][0].x);
        slopes.push((dz / dx) * 100); // Percent slope
      }
    }
  }

  const avgSlope = slopes.length > 0 ? slopes.reduce((a, b) => a + b, 0) / slopes.length : 0;
  const maxSlope = slopes.length > 0 ? Math.max(...slopes) : 0;

  return {
    minElevation: minElev,
    maxElevation: maxElev,
    averageElevation: sumElev / count,
    relief: maxElev - minElev,
    averageSlope: avgSlope,
    maxSlope: maxSlope,
  };
}

/**
 * Calculate slope at a point on terrain
 */
export function calculateSlope(terrain, x, y) {
  const { grid, gridSpacing, bounds } = terrain;

  const col = Math.floor((x - bounds.minX) / gridSpacing);
  const row = Math.floor((y - bounds.minY) / gridSpacing);

  if (row < 1 || row >= grid.length - 1 || col < 1 || col >= grid[0].length - 1) {
    return null;
  }

  // Calculate gradient using central differences
  const dzdx = (grid[row][col + 1].z - grid[row][col - 1].z) / (2 * gridSpacing);
  const dzdy = (grid[row + 1][col].z - grid[row - 1][col].z) / (2 * gridSpacing);

  const slopePercent = Math.sqrt(dzdx ** 2 + dzdy ** 2) * 100;
  const slopeDegrees = Math.atan(Math.sqrt(dzdx ** 2 + dzdy ** 2)) * 180 / Math.PI;
  const aspect = Math.atan2(dzdy, -dzdx) * 180 / Math.PI; // Direction of steepest descent

  return {
    percent: slopePercent,
    degrees: slopeDegrees,
    aspect: aspect < 0 ? aspect + 360 : aspect,
    ratio: `1:${Math.round(100 / slopePercent)}`,
  };
}

// ============================================
// Watershed & Catchment Analysis
// ============================================

/**
 * Delineate catchment area for a drainage point
 */
export function delineateCatchment(terrain, outletPoint, options = {}) {
  const { grid, gridSpacing, bounds } = terrain;
  const { minContributingArea = 100 } = options; // square meters

  // Find outlet cell
  const outletCol = Math.round((outletPoint.x - bounds.minX) / gridSpacing);
  const outletRow = Math.round((outletPoint.y - bounds.minY) / gridSpacing);

  // Flow accumulation using D8 algorithm
  const flowDir = calculateFlowDirection(grid);
  const flowAcc = calculateFlowAccumulation(flowDir, grid.length, grid[0].length);

  // Trace upstream from outlet
  const catchmentCells = new Set();
  const queue = [[outletRow, outletCol]];

  while (queue.length > 0) {
    const [row, col] = queue.shift();
    const key = `${row},${col}`;

    if (catchmentCells.has(key)) continue;
    if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length) continue;

    catchmentCells.add(key);

    // Find cells that flow into this cell
    const neighbors = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    const inflowDirs = [4, 8, 16, 2, 32, 1, 128, 64]; // D8 codes for each neighbor flowing here

    for (let i = 0; i < neighbors.length; i++) {
      const nr = row + neighbors[i][0];
      const nc = col + neighbors[i][1];
      if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
        if (flowDir[nr][nc] === inflowDirs[i]) {
          queue.push([nr, nc]);
        }
      }
    }
  }

  // Calculate catchment properties
  const cellArea = gridSpacing * gridSpacing;
  const area = catchmentCells.size * cellArea;

  let sumElev = 0, minElev = Infinity, maxElev = -Infinity;
  const boundary = [];

  for (const key of catchmentCells) {
    const [row, col] = key.split(',').map(Number);
    const z = grid[row][col].z;
    sumElev += z;
    minElev = Math.min(minElev, z);
    maxElev = Math.max(maxElev, z);
  }

  // Estimate time of concentration (Kirpich formula, adapted for tropical)
  const length = Math.sqrt(area) * 1.5; // Approximate longest flow path
  const slope = (maxElev - minElev) / length;
  const tc = 0.0078 * Math.pow(length, 0.77) * Math.pow(slope, -0.385); // hours

  return {
    type: 'catchment',
    outlet: outletPoint,
    area: area, // m²
    areaHectares: area / 10000,
    cellCount: catchmentCells.size,
    minElevation: minElev,
    maxElevation: maxElev,
    averageElevation: sumElev / catchmentCells.size,
    relief: maxElev - minElev,
    timeOfConcentration: tc, // hours
    cells: catchmentCells,
  };
}

function calculateFlowDirection(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const flowDir = Array(rows).fill(null).map(() => Array(cols).fill(0));

  const neighbors = [
    [-1, -1, 1], [-1, 0, 2], [-1, 1, 4],
    [0, -1, 8],              [0, 1, 16],
    [1, -1, 32], [1, 0, 64], [1, 1, 128],
  ];

  for (let row = 1; row < rows - 1; row++) {
    for (let col = 1; col < cols - 1; col++) {
      let maxDrop = 0;
      let flowCode = 0;

      for (const [dr, dc, code] of neighbors) {
        const drop = grid[row][col].z - grid[row + dr][col + dc].z;
        const dist = Math.sqrt(dr ** 2 + dc ** 2);
        const gradient = drop / dist;

        if (gradient > maxDrop) {
          maxDrop = gradient;
          flowCode = code;
        }
      }

      flowDir[row][col] = flowCode;
    }
  }

  return flowDir;
}

function calculateFlowAccumulation(flowDir, rows, cols) {
  const flowAcc = Array(rows).fill(null).map(() => Array(cols).fill(1));
  // Simplified - full implementation would use topological sort
  return flowAcc;
}

// ============================================
// Drainage Design
// ============================================

/**
 * Calculate design discharge using Rational Method
 * Q = C * I * A (modified for metric units)
 */
export function calculateDesignDischarge(catchment, designParams) {
  const {
    region = 'coastal',
    returnPeriod = 10, // years
    runoffCoefficient = null, // Will calculate if not provided
    landUse = 'mixed',
  } = designParams;

  // Get rainfall intensity for the duration = time of concentration
  const duration = Math.max(5, Math.min(120, Math.round(catchment.timeOfConcentration * 60)));
  const idf = PNG_RAINFALL_IDF[region];

  if (!idf) {
    throw new Error(`Unknown region: ${region}. Use: coastal, highlands, islands, or momase`);
  }

  // Interpolate intensity for duration
  const returnData = idf.intensities[returnPeriod];
  if (!returnData) {
    throw new Error(`No data for ${returnPeriod}-year return period`);
  }

  const durations = Object.keys(returnData).map(Number).sort((a, b) => a - b);
  let intensity;

  if (duration <= durations[0]) {
    intensity = returnData[durations[0]];
  } else if (duration >= durations[durations.length - 1]) {
    intensity = returnData[durations[durations.length - 1]];
  } else {
    // Linear interpolation
    for (let i = 0; i < durations.length - 1; i++) {
      if (duration >= durations[i] && duration <= durations[i + 1]) {
        const t = (duration - durations[i]) / (durations[i + 1] - durations[i]);
        intensity = returnData[durations[i]] * (1 - t) + returnData[durations[i + 1]] * t;
        break;
      }
    }
  }

  // Calculate or use provided runoff coefficient
  const C = runoffCoefficient || getRunoffCoefficient(landUse, catchment.statistics?.averageSlope || 5);

  // Rational formula: Q = C * I * A / 360
  // Where Q is in m³/s, I is in mm/hr, A is in hectares
  const Q = (C * intensity * catchment.areaHectares) / 360;

  return {
    catchmentArea: catchment.areaHectares,
    runoffCoefficient: C,
    rainfallIntensity: intensity,
    duration: duration,
    returnPeriod: returnPeriod,
    region: idf.name,
    designDischarge: Q, // m³/s
    timeOfConcentration: catchment.timeOfConcentration,
    safetyNote: returnPeriod < 25
      ? 'Consider using 25-50 year return period for critical infrastructure'
      : null,
  };
}

function getRunoffCoefficient(landUse, slopePercent) {
  // Runoff coefficients for PNG tropical conditions
  const baseCoefficients = {
    forest: 0.25,
    grassland: 0.35,
    agriculture: 0.45,
    mixed: 0.50,
    village: 0.55,
    urban: 0.70,
    commercial: 0.80,
    impervious: 0.95,
  };

  let C = baseCoefficients[landUse] || 0.50;

  // Adjust for slope (tropical soils saturate quickly)
  if (slopePercent > 10) C += 0.05;
  if (slopePercent > 20) C += 0.05;
  if (slopePercent > 30) C += 0.05;

  return Math.min(0.95, C);
}

/**
 * Design drainage channel/pipe for calculated discharge
 */
export function designDrainageChannel(designDischarge, options = {}) {
  const {
    channelType = 'trapezoidal', // trapezoidal, rectangular, circular
    material = 'earth',
    maxVelocity = null, // Will set based on material
    minVelocity = 0.6, // m/s - to prevent sedimentation
    freeboard = 0.3, // meters
    bedSlope = null, // Will calculate required slope
  } = options;

  const Q = designDischarge.designDischarge;

  // Manning's n values for tropical conditions
  const manningN = {
    earth: 0.025,
    grass: 0.030,
    gravel: 0.025,
    concrete: 0.015,
    stone: 0.030,
    corrugatedMetal: 0.024,
    hdpe: 0.012,
  };

  const n = manningN[material] || 0.025;

  // Maximum velocities to prevent erosion
  const maxVelocities = {
    earth: 1.0,
    grass: 1.5,
    gravel: 2.0,
    concrete: 4.0,
    stone: 2.5,
    corrugatedMetal: 3.0,
    hdpe: 4.0,
  };

  const vMax = maxVelocity || maxVelocities[material] || 2.0;

  let design;

  if (channelType === 'trapezoidal') {
    design = designTrapezoidalChannel(Q, n, vMax, minVelocity, bedSlope);
  } else if (channelType === 'circular') {
    design = designCircularPipe(Q, n, vMax, minVelocity, bedSlope);
  } else {
    design = designRectangularChannel(Q, n, vMax, minVelocity, bedSlope);
  }

  return {
    ...design,
    material,
    manningN: n,
    maxAllowedVelocity: vMax,
    minAllowedVelocity: minVelocity,
    freeboard,
    designDischarge: Q,
    designReturn: designDischarge.returnPeriod + '-year',
    totalDepth: design.depth + freeboard,
    warnings: generateDrainageWarnings(design, vMax, minVelocity),
  };
}

function designTrapezoidalChannel(Q, n, vMax, vMin, slope) {
  // Optimal trapezoidal section: side slopes 1:1.5 (V:H), bottom width = 0.5 * depth
  // Iterative solution using Manning's equation

  let depth = 0.5; // Initial guess
  const sideSlope = 1.5; // 1V:1.5H

  for (let i = 0; i < 50; i++) {
    const bottomWidth = depth * 0.5;
    const topWidth = bottomWidth + 2 * depth * sideSlope;
    const area = (bottomWidth + topWidth) / 2 * depth;
    const wettedPerimeter = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope ** 2);
    const hydraulicRadius = area / wettedPerimeter;

    // Target velocity between vMin and vMax
    const targetV = Math.min(vMax * 0.8, Math.max(vMin * 1.2, Q / area));

    // Calculate required slope using Manning's equation
    // V = (1/n) * R^(2/3) * S^(1/2)
    const requiredSlope = slope || (targetV * n / Math.pow(hydraulicRadius, 2/3)) ** 2;

    // Recalculate velocity
    const V = (1 / n) * Math.pow(hydraulicRadius, 2/3) * Math.pow(requiredSlope, 0.5);
    const calculatedQ = area * V;

    if (Math.abs(calculatedQ - Q) / Q < 0.01) {
      return {
        type: 'trapezoidal',
        depth: Math.round(depth * 100) / 100,
        bottomWidth: Math.round(bottomWidth * 100) / 100,
        topWidth: Math.round(topWidth * 100) / 100,
        sideSlope: `1V:${sideSlope}H`,
        area: Math.round(area * 1000) / 1000,
        wettedPerimeter: Math.round(wettedPerimeter * 100) / 100,
        hydraulicRadius: Math.round(hydraulicRadius * 1000) / 1000,
        velocity: Math.round(V * 100) / 100,
        bedSlope: requiredSlope,
        slopePercent: Math.round(requiredSlope * 10000) / 100,
      };
    }

    // Adjust depth
    depth *= Math.sqrt(Q / calculatedQ);
  }

  return { error: 'Could not converge on solution' };
}

function designCircularPipe(Q, n, vMax, vMin, slope) {
  // Design for 80% full flow
  const fillRatio = 0.8;

  let diameter = 0.3; // Initial guess

  for (let i = 0; i < 50; i++) {
    const theta = 2 * Math.acos(1 - 2 * fillRatio); // Angle to water surface
    const area = (diameter ** 2 / 8) * (theta - Math.sin(theta));
    const wettedPerimeter = diameter * theta / 2;
    const hydraulicRadius = area / wettedPerimeter;

    const targetV = Math.min(vMax * 0.8, Math.max(vMin * 1.2, Q / area));
    const requiredSlope = slope || (targetV * n / Math.pow(hydraulicRadius, 2/3)) ** 2;

    const V = (1 / n) * Math.pow(hydraulicRadius, 2/3) * Math.pow(requiredSlope, 0.5);
    const calculatedQ = area * V;

    if (Math.abs(calculatedQ - Q) / Q < 0.01) {
      // Round up to standard pipe size
      const standardSizes = [0.15, 0.20, 0.25, 0.30, 0.375, 0.45, 0.525, 0.60, 0.75, 0.90, 1.05, 1.20, 1.50, 1.80];
      const nominalDiameter = standardSizes.find(s => s >= diameter) || diameter;

      return {
        type: 'circular',
        diameter: Math.round(nominalDiameter * 1000), // mm
        fillRatio: fillRatio,
        area: Math.round(area * 10000) / 10000,
        wettedPerimeter: Math.round(wettedPerimeter * 100) / 100,
        hydraulicRadius: Math.round(hydraulicRadius * 1000) / 1000,
        velocity: Math.round(V * 100) / 100,
        bedSlope: requiredSlope,
        slopePercent: Math.round(requiredSlope * 10000) / 100,
      };
    }

    diameter *= Math.pow(Q / calculatedQ, 0.4);
  }

  return { error: 'Could not converge on solution' };
}

function designRectangularChannel(Q, n, vMax, vMin, slope) {
  // Optimal rectangular section: width = 2 * depth
  let depth = 0.5;

  for (let i = 0; i < 50; i++) {
    const width = 2 * depth;
    const area = width * depth;
    const wettedPerimeter = width + 2 * depth;
    const hydraulicRadius = area / wettedPerimeter;

    const targetV = Math.min(vMax * 0.8, Math.max(vMin * 1.2, Q / area));
    const requiredSlope = slope || (targetV * n / Math.pow(hydraulicRadius, 2/3)) ** 2;

    const V = (1 / n) * Math.pow(hydraulicRadius, 2/3) * Math.pow(requiredSlope, 0.5);
    const calculatedQ = area * V;

    if (Math.abs(calculatedQ - Q) / Q < 0.01) {
      return {
        type: 'rectangular',
        depth: Math.round(depth * 100) / 100,
        width: Math.round(width * 100) / 100,
        area: Math.round(area * 1000) / 1000,
        wettedPerimeter: Math.round(wettedPerimeter * 100) / 100,
        hydraulicRadius: Math.round(hydraulicRadius * 1000) / 1000,
        velocity: Math.round(V * 100) / 100,
        bedSlope: requiredSlope,
        slopePercent: Math.round(requiredSlope * 10000) / 100,
      };
    }

    depth *= Math.sqrt(Q / calculatedQ);
  }

  return { error: 'Could not converge on solution' };
}

function generateDrainageWarnings(design, vMax, vMin) {
  const warnings = [];

  if (design.velocity > vMax) {
    warnings.push({
      severity: 'error',
      message: `Velocity ${design.velocity} m/s exceeds maximum ${vMax} m/s - erosion risk`,
      remedy: 'Use erosion-resistant lining or reduce slope',
    });
  }

  if (design.velocity < vMin) {
    warnings.push({
      severity: 'warning',
      message: `Velocity ${design.velocity} m/s below minimum ${vMin} m/s - sedimentation risk`,
      remedy: 'Increase slope or reduce channel size',
    });
  }

  if (design.slopePercent > 5) {
    warnings.push({
      severity: 'warning',
      message: 'Steep channel slope - consider drop structures',
      remedy: 'Add energy dissipation structures every 2-3m of drop',
    });
  }

  return warnings;
}

// ============================================
// Minimum Floor Level Calculator
// ============================================

/**
 * Calculate minimum floor level for flood resilience
 * Based on ASCE 24 and PNG conditions
 */
export function calculateMinimumFloorLevel(params) {
  const {
    baseFloodElevation, // meters above datum
    buildingType = 'residential',
    floodZone = 'standard', // standard, high, coastal
    terrainType = 'flat',
    province = null,
  } = params;

  // Freeboard requirements (based on ASCE 24-24 and PNG conditions)
  const freeboardRequirements = {
    residential: {
      standard: 0.3,
      high: 0.6,
      coastal: 1.0,
    },
    commercial: {
      standard: 0.45,
      high: 0.75,
      coastal: 1.2,
    },
    critical: { // Schools, clinics, emergency facilities
      standard: 0.6,
      high: 1.0,
      coastal: 1.5,
    },
    industrial: {
      standard: 0.3,
      high: 0.6,
      coastal: 1.0,
    },
  };

  const freeboard = freeboardRequirements[buildingType]?.[floodZone] || 0.6;

  // Additional factors for PNG
  let additionalFreeboard = 0;

  // Climate change allowance (rising sea levels, increased rainfall intensity)
  additionalFreeboard += 0.3;

  // Terrain factor
  if (terrainType === 'riverine-floodplain') additionalFreeboard += 0.3;
  if (terrainType === 'coastal-lowland') additionalFreeboard += 0.2;

  // High-risk provinces
  const highRiskProvinces = ['Gulf', 'Western', 'East Sepik', 'Sandaun'];
  if (highRiskProvinces.includes(province)) additionalFreeboard += 0.2;

  const minimumFloorLevel = baseFloodElevation + freeboard + additionalFreeboard;

  return {
    baseFloodElevation,
    standardFreeboard: freeboard,
    climateChangeAllowance: 0.3,
    terrainAdjustment: additionalFreeboard - 0.3,
    totalFreeboard: freeboard + additionalFreeboard,
    minimumFloorLevel: Math.round(minimumFloorLevel * 100) / 100,
    buildingType,
    floodZone,
    recommendations: [
      `Set finished floor level at minimum ${minimumFloorLevel.toFixed(2)}m above datum`,
      'Use flood-resistant materials below design flood elevation',
      'Ensure adequate drainage around foundation',
      floodZone === 'coastal' ? 'Consider elevated construction on piles' : null,
    ].filter(Boolean),
    codeReference: 'Based on ASCE 24-24 with PNG climate adaptations',
  };
}

// ============================================
// Cut and Fill Calculations
// ============================================

/**
 * Calculate earthwork volumes between existing and proposed surfaces
 */
export function calculateCutFill(existingTerrain, proposedElevations, options = {}) {
  const {
    shrinkageFactor = 1.1, // Cut material compacts when used as fill
    bulkingFactor = 1.25, // Cut material expands during transport
  } = options;

  const { grid, gridSpacing } = existingTerrain;
  const cellArea = gridSpacing * gridSpacing;

  let cutVolume = 0;
  let fillVolume = 0;
  const cutCells = [];
  const fillCells = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const existing = grid[row][col].z;
      const proposed = proposedElevations[row]?.[col];

      if (proposed === undefined) continue;

      const diff = proposed - existing;

      if (diff < 0) {
        // Cut
        const volume = Math.abs(diff) * cellArea;
        cutVolume += volume;
        cutCells.push({ row, col, depth: Math.abs(diff), volume });
      } else if (diff > 0) {
        // Fill
        const volume = diff * cellArea;
        fillVolume += volume;
        fillCells.push({ row, col, depth: diff, volume });
      }
    }
  }

  // Adjusted volumes considering material behavior
  const usableCutForFill = cutVolume / shrinkageFactor;
  const importRequired = Math.max(0, fillVolume - usableCutForFill);
  const exportRequired = Math.max(0, usableCutForFill - fillVolume) * bulkingFactor;

  return {
    cutVolume: Math.round(cutVolume),
    fillVolume: Math.round(fillVolume),
    netVolume: Math.round(cutVolume - fillVolume),
    usableCutForFill: Math.round(usableCutForFill),
    importRequired: Math.round(importRequired),
    exportRequired: Math.round(exportRequired),
    shrinkageFactor,
    bulkingFactor,
    balanced: Math.abs(importRequired) < 10 && Math.abs(exportRequired) < 10,
    costEstimate: {
      cutPerM3: 25, // PGK per m³
      fillPerM3: 35, // PGK per m³
      importPerM3: 80, // PGK per m³ including transport
      exportPerM3: 45, // PGK per m³ including transport
      totalEstimate: Math.round(
        cutVolume * 25 +
        fillVolume * 35 +
        importRequired * 80 +
        exportRequired * 45
      ),
    },
    cutCells,
    fillCells,
  };
}
