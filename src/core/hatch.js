/**
 * CAD Hatch Patterns
 * Fill patterns for areas in civil engineering drawings
 */

import { generateId, DEFAULT_STYLE } from './engine.js';
import { isPointInPolygon, createBoundingBox } from './geometry.js';

// ============================================
// Hatch Pattern Definitions
// ============================================

export const HATCH_PATTERNS = {
  // Solid fill
  solid: {
    name: 'Solid',
    type: 'solid',
    description: 'Solid fill',
  },

  // Line patterns
  horizontal: {
    name: 'Horizontal Lines',
    type: 'lines',
    angle: 0,
    spacing: 5,
    description: 'Horizontal parallel lines',
  },

  vertical: {
    name: 'Vertical Lines',
    type: 'lines',
    angle: 90,
    spacing: 5,
    description: 'Vertical parallel lines',
  },

  diagonal45: {
    name: 'Diagonal 45°',
    type: 'lines',
    angle: 45,
    spacing: 5,
    description: 'Diagonal lines at 45 degrees',
  },

  diagonal135: {
    name: 'Diagonal 135°',
    type: 'lines',
    angle: 135,
    spacing: 5,
    description: 'Diagonal lines at 135 degrees',
  },

  crosshatch: {
    name: 'Crosshatch',
    type: 'crosshatch',
    angle1: 0,
    angle2: 90,
    spacing: 5,
    description: 'Perpendicular crosshatch pattern',
  },

  diagonalCross: {
    name: 'Diagonal Cross',
    type: 'crosshatch',
    angle1: 45,
    angle2: 135,
    spacing: 5,
    description: 'Diagonal crosshatch pattern',
  },

  // Civil engineering patterns
  concrete: {
    name: 'Concrete',
    type: 'dots',
    spacing: 8,
    dotSize: 1,
    description: 'Concrete/aggregate pattern',
  },

  brick: {
    name: 'Brick',
    type: 'brick',
    rowHeight: 10,
    brickWidth: 20,
    description: 'Brick/masonry pattern',
  },

  stone: {
    name: 'Stone',
    type: 'random-lines',
    density: 0.3,
    description: 'Random stone pattern',
  },

  earth: {
    name: 'Earth/Soil',
    type: 'dots',
    spacing: 4,
    dotSize: 0.5,
    random: true,
    description: 'Earth/soil section pattern',
  },

  gravel: {
    name: 'Gravel',
    type: 'circles',
    spacing: 6,
    radius: 2,
    random: true,
    description: 'Gravel pattern',
  },

  sand: {
    name: 'Sand',
    type: 'dots',
    spacing: 2,
    dotSize: 0.3,
    description: 'Sand pattern',
  },

  water: {
    name: 'Water',
    type: 'waves',
    spacing: 8,
    amplitude: 2,
    description: 'Water pattern',
  },

  grass: {
    name: 'Grass',
    type: 'grass',
    spacing: 10,
    height: 5,
    description: 'Grass/vegetation pattern',
  },

  insulation: {
    name: 'Insulation',
    type: 'zigzag',
    spacing: 10,
    amplitude: 5,
    description: 'Insulation pattern',
  },

  steel: {
    name: 'Steel',
    type: 'lines',
    angle: 45,
    spacing: 2,
    description: 'Steel section pattern',
  },

  wood: {
    name: 'Wood',
    type: 'wood-grain',
    spacing: 3,
    description: 'Wood grain pattern',
  },
};

// ============================================
// Hatch Entity Creation
// ============================================

/**
 * Create a hatch entity
 */
export function createHatch(boundary, patternName = 'diagonal45', options = {}) {
  const pattern = HATCH_PATTERNS[patternName] || HATCH_PATTERNS.diagonal45;

  return {
    id: generateId(),
    type: 'hatch',
    layerId: options.layerId || 'layer-0',
    visible: true,
    locked: false,
    style: {
      ...DEFAULT_STYLE,
      strokeColor: options.color || '#000000',
      fillColor: options.fillColor || null,
      opacity: options.opacity || 1,
    },
    boundary, // Array of points defining the boundary polygon
    patternName,
    pattern: { ...pattern, ...options.patternOverrides },
    scale: options.scale || 1,
    rotation: options.rotation || 0,
  };
}

/**
 * Create hatch from existing entity
 */
export function createHatchFromEntity(entity, patternName = 'diagonal45', options = {}) {
  let boundary;

  switch (entity.type) {
    case 'rectangle':
      boundary = [
        entity.topLeft,
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y },
        { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height },
        { x: entity.topLeft.x, y: entity.topLeft.y + entity.height },
      ];
      break;

    case 'polyline':
      if (!entity.closed) {
        throw new Error('Polyline must be closed for hatching');
      }
      boundary = entity.points;
      break;

    case 'circle':
      // Approximate circle with polygon
      boundary = [];
      const segments = 32;
      for (let i = 0; i < segments; i++) {
        const angle = (i * 2 * Math.PI) / segments;
        boundary.push({
          x: entity.center.x + entity.radius * Math.cos(angle),
          y: entity.center.y + entity.radius * Math.sin(angle),
        });
      }
      break;

    default:
      throw new Error(`Cannot create hatch from entity type: ${entity.type}`);
  }

  return createHatch(boundary, patternName, options);
}

// ============================================
// Hatch Line Generation
// ============================================

/**
 * Generate hatch lines for rendering
 */
export function generateHatchLines(hatch) {
  const bbox = createBoundingBox(hatch.boundary);
  const pattern = hatch.pattern;
  const scale = hatch.scale || 1;
  const rotation = hatch.rotation || 0;
  const lines = [];

  switch (pattern.type) {
    case 'solid':
      // Solid fill - no lines needed, use fillColor
      return { type: 'solid', boundary: hatch.boundary };

    case 'lines':
      return generateParallelLines(hatch.boundary, bbox, pattern.angle + rotation, pattern.spacing * scale);

    case 'crosshatch':
      const lines1 = generateParallelLines(hatch.boundary, bbox, pattern.angle1 + rotation, pattern.spacing * scale);
      const lines2 = generateParallelLines(hatch.boundary, bbox, pattern.angle2 + rotation, pattern.spacing * scale);
      return { type: 'lines', lines: [...lines1.lines, ...lines2.lines] };

    case 'dots':
      return generateDots(hatch.boundary, bbox, pattern.spacing * scale, pattern.dotSize * scale, pattern.random);

    case 'circles':
      return generateCircles(hatch.boundary, bbox, pattern.spacing * scale, pattern.radius * scale, pattern.random);

    case 'brick':
      return generateBrickPattern(hatch.boundary, bbox, pattern.rowHeight * scale, pattern.brickWidth * scale);

    case 'waves':
      return generateWavePattern(hatch.boundary, bbox, pattern.spacing * scale, pattern.amplitude * scale);

    case 'grass':
      return generateGrassPattern(hatch.boundary, bbox, pattern.spacing * scale, pattern.height * scale);

    default:
      return generateParallelLines(hatch.boundary, bbox, 45, 5 * scale);
  }
}

/**
 * Generate parallel lines within a boundary
 */
function generateParallelLines(boundary, bbox, angleDeg, spacing) {
  const lines = [];
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  // Calculate the diagonal of the bounding box
  const width = bbox.maxX - bbox.minX;
  const height = bbox.maxY - bbox.minY;
  const diagonal = Math.sqrt(width * width + height * height);

  // Center of the bounding box
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;

  // Generate lines perpendicular to the angle
  const numLines = Math.ceil(diagonal / spacing) + 1;
  const startOffset = -diagonal / 2;

  for (let i = 0; i < numLines; i++) {
    const offset = startOffset + i * spacing;

    // Line perpendicular to angle, offset by 'offset'
    const perpX = -sin * offset;
    const perpY = cos * offset;

    // Line endpoints (extended beyond bbox)
    const x1 = cx + perpX - cos * diagonal;
    const y1 = cy + perpY - sin * diagonal;
    const x2 = cx + perpX + cos * diagonal;
    const y2 = cy + perpY + sin * diagonal;

    // Clip line to boundary
    const clipped = clipLineToPolygon({ x: x1, y: y1 }, { x: x2, y: y2 }, boundary);
    if (clipped) {
      lines.push(clipped);
    }
  }

  return { type: 'lines', lines };
}

/**
 * Generate dots within a boundary
 */
function generateDots(boundary, bbox, spacing, size, random = false) {
  const dots = [];
  const jitter = random ? spacing * 0.3 : 0;

  for (let x = bbox.minX; x <= bbox.maxX; x += spacing) {
    for (let y = bbox.minY; y <= bbox.maxY; y += spacing) {
      const px = x + (random ? (Math.random() - 0.5) * jitter : 0);
      const py = y + (random ? (Math.random() - 0.5) * jitter : 0);

      if (isPointInPolygon({ x: px, y: py }, boundary)) {
        dots.push({ x: px, y: py, radius: size });
      }
    }
  }

  return { type: 'dots', dots };
}

/**
 * Generate circles within a boundary
 */
function generateCircles(boundary, bbox, spacing, radius, random = false) {
  const circles = [];
  const jitter = random ? spacing * 0.2 : 0;

  for (let x = bbox.minX; x <= bbox.maxX; x += spacing) {
    for (let y = bbox.minY; y <= bbox.maxY; y += spacing) {
      const px = x + (random ? (Math.random() - 0.5) * jitter : 0);
      const py = y + (random ? (Math.random() - 0.5) * jitter : 0);

      if (isPointInPolygon({ x: px, y: py }, boundary)) {
        circles.push({ x: px, y: py, radius: radius * (random ? 0.5 + Math.random() : 1) });
      }
    }
  }

  return { type: 'circles', circles };
}

/**
 * Generate brick pattern
 */
function generateBrickPattern(boundary, bbox, rowHeight, brickWidth) {
  const lines = [];

  // Horizontal lines
  for (let y = bbox.minY; y <= bbox.maxY; y += rowHeight) {
    const clipped = clipLineToPolygon({ x: bbox.minX, y }, { x: bbox.maxX, y }, boundary);
    if (clipped) lines.push(clipped);
  }

  // Vertical lines (staggered)
  let row = 0;
  for (let y = bbox.minY; y <= bbox.maxY; y += rowHeight) {
    const offset = (row % 2) * (brickWidth / 2);
    for (let x = bbox.minX + offset; x <= bbox.maxX; x += brickWidth) {
      const clipped = clipLineToPolygon({ x, y }, { x, y: y + rowHeight }, boundary);
      if (clipped) lines.push(clipped);
    }
    row++;
  }

  return { type: 'lines', lines };
}

/**
 * Generate wave pattern
 */
function generateWavePattern(boundary, bbox, spacing, amplitude) {
  const waves = [];

  for (let y = bbox.minY; y <= bbox.maxY; y += spacing) {
    const points = [];
    for (let x = bbox.minX; x <= bbox.maxX; x += 2) {
      const py = y + Math.sin((x / spacing) * Math.PI) * amplitude;
      if (isPointInPolygon({ x, y: py }, boundary)) {
        points.push({ x, y: py });
      }
    }
    if (points.length > 1) {
      waves.push(points);
    }
  }

  return { type: 'polylines', polylines: waves };
}

/**
 * Generate grass pattern
 */
function generateGrassPattern(boundary, bbox, spacing, height) {
  const strokes = [];

  for (let x = bbox.minX; x <= bbox.maxX; x += spacing) {
    for (let y = bbox.minY; y <= bbox.maxY; y += spacing * 1.5) {
      const px = x + (Math.random() - 0.5) * spacing * 0.5;
      const py = y + (Math.random() - 0.5) * spacing * 0.5;

      if (isPointInPolygon({ x: px, y: py }, boundary)) {
        // Three grass blades
        const h = height * (0.7 + Math.random() * 0.3);
        strokes.push([
          { x: px, y: py },
          { x: px - 1, y: py - h },
        ]);
        strokes.push([
          { x: px, y: py },
          { x: px, y: py - h * 1.1 },
        ]);
        strokes.push([
          { x: px, y: py },
          { x: px + 1, y: py - h * 0.9 },
        ]);
      }
    }
  }

  return { type: 'strokes', strokes };
}

/**
 * Clip a line to a polygon boundary
 */
function clipLineToPolygon(p1, p2, polygon) {
  // Simple implementation - find intersections and return segment inside
  const intersections = [];

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const intersection = lineSegmentIntersection(p1, p2, polygon[i], polygon[j]);
    if (intersection) {
      intersections.push(intersection);
    }
  }

  // Check if endpoints are inside
  const p1Inside = isPointInPolygon(p1, polygon);
  const p2Inside = isPointInPolygon(p2, polygon);

  if (p1Inside && p2Inside) {
    return { start: p1, end: p2 };
  }

  if (intersections.length >= 2) {
    // Sort by distance from p1
    intersections.sort((a, b) => {
      const da = (a.x - p1.x) ** 2 + (a.y - p1.y) ** 2;
      const db = (b.x - p1.x) ** 2 + (b.y - p1.y) ** 2;
      return da - db;
    });
    return { start: intersections[0], end: intersections[1] };
  }

  if (intersections.length === 1) {
    if (p1Inside) return { start: p1, end: intersections[0] };
    if (p2Inside) return { start: intersections[0], end: p2 };
  }

  return null;
}

function lineSegmentIntersection(p1, p2, p3, p4) {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;

  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-10) return null;

  const dx = p3.x - p1.x;
  const dy = p3.y - p1.y;

  const t1 = (dx * d2y - dy * d2x) / cross;
  const t2 = (dx * d1y - dy * d1x) / cross;

  if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
    return { x: p1.x + t1 * d1x, y: p1.y + t1 * d1y };
  }

  return null;
}

// ============================================
// Pattern List
// ============================================

export function listHatchPatterns() {
  return Object.entries(HATCH_PATTERNS).map(([key, pattern]) => ({
    id: key,
    name: pattern.name,
    description: pattern.description,
  }));
}
