/**
 * Entity Factory Module
 * Handles creation of all CAD entity types
 * 
 * Extracted from engine.js for modularity
 */

import { distance } from './geometry.js';
import { generateId } from './id.js';

export { generateId };

// ============================================
// Default Styles and Settings
// ============================================

/** @type {{ strokeColor: string, strokeWidth: number, fillColor?: string, opacity: number, lineType: string }} */
export const DEFAULT_STYLE = {
    strokeColor: '#000000',
    strokeWidth: 1,
    fillColor: undefined,
    opacity: 1,
    lineType: 'continuous',
};

/** @type {{ visible: boolean, spacing: number, majorLineEvery: number, color: string, majorColor: string, opacity: number }} */
export const DEFAULT_GRID = {
    visible: true,
    spacing: 10,
    majorLineEvery: 10,
    color: '#e0e0e0',
    majorColor: '#c0c0c0',
    opacity: 0.5,
};

/** @type {Object} */
export const DEFAULT_SNAP = {
    enabled: true,
    gridSnap: true,
    endpointSnap: true,
    midpointSnap: true,
    centerSnap: true,
    intersectionSnap: true,
    perpendicularSnap: true,
    tangentSnap: false,
    nearestSnap: false,
    snapDistance: 10,
};

/** @type {{ lengthUnit: string, areaUnit: string, angleUnit: string, precision: number }} */
export const DEFAULT_UNITS = {
    lengthUnit: 'm',
    areaUnit: 'sqm',
    angleUnit: 'degrees',
    precision: 3,
};

// ============================================
// Layer Management
// ============================================

/**
 * Create a new layer
 * @param {string} name - Layer name
 * @param {string} color - Layer color (default: '#000000')
 * @returns {Object} Layer object
 */
export function createLayer(name, color = '#000000') {
    return {
        id: generateId(),
        name,
        visible: true,
        locked: false,
        color,
        lineType: 'continuous',
        lineWeight: 1,
        order: 0,
    };
}

export const DEFAULT_LAYERS = [
    { id: 'layer-0', name: '0', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 0 },
    { id: 'layer-construction', name: 'Construction', visible: true, locked: false, color: '#808080', lineType: 'dashed', lineWeight: 0.5, order: 1 },
    { id: 'layer-dimensions', name: 'Dimensions', visible: true, locked: false, color: '#0000FF', lineType: 'continuous', lineWeight: 0.5, order: 2 },
    { id: 'layer-text', name: 'Text', visible: true, locked: false, color: '#000000', lineType: 'continuous', lineWeight: 1, order: 3 },
    { id: 'layer-structural', name: 'Structural', visible: true, locked: false, color: '#FF0000', lineType: 'continuous', lineWeight: 2, order: 4 },
    { id: 'layer-foundation', name: 'Foundation', visible: true, locked: false, color: '#8B4513', lineType: 'continuous', lineWeight: 2, order: 5 },
    { id: 'layer-drainage', name: 'Drainage', visible: true, locked: false, color: '#00BFFF', lineType: 'continuous', lineWeight: 1.5, order: 6 },
    { id: 'layer-electrical', name: 'Electrical', visible: true, locked: false, color: '#FFD700', lineType: 'continuous', lineWeight: 1, order: 7 },
    { id: 'layer-plumbing', name: 'Plumbing', visible: true, locked: false, color: '#00FF00', lineType: 'continuous', lineWeight: 1, order: 8 },
    { id: 'layer-site', name: 'Site', visible: true, locked: false, color: '#228B22', lineType: 'continuous', lineWeight: 1, order: 9 },
];

// ============================================
// Entity Creation
// ============================================

/**
 * Create a new entity
 * @param {string} type - Entity type
 * @param {Object} properties - Entity properties
 * @param {string} layerId - Layer ID (default: 'layer-0')
 * @param {Object} style - Entity style
 * @returns {Object} Entity object
 */
export function createEntity(type, properties, layerId = 'layer-0', style = {}) {
    return {
        id: generateId(),
        type,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
        ...properties,
    };
}

/**
 * Create an arc entity
 */
export function createArc(center, radius, startAngle, endAngle, layerId = 'layer-0', style = {}) {
    return {
        id: generateId(),
        type: 'arc',
        center,
        radius,
        startAngle: (startAngle * Math.PI) / 180,
        endAngle: (endAngle * Math.PI) / 180,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
    };
}

/**
 * Create an arc from 3 points
 */
export function createArcFrom3Points(p1, p2, p3, layerId = 'layer-0', style = {}) {
    const ax = p1.x, ay = p1.y;
    const bx = p2.x, by = p2.y;
    const cx = p3.x, cy = p3.y;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 0.0001) {
        return createEntity('line', { startPoint: p1, endPoint: p3 }, layerId, style);
    }

    const centerX = ((ax * ax + ay * ay) * (by - cy) +
        (bx * bx + by * by) * (cy - ay) +
        (cx * cx + cy * cy) * (ay - by)) / d;
    const centerY = ((ax * ax + ay * ay) * (cx - bx) +
        (bx * bx + by * by) * (ax - cx) +
        (cx * cx + cy * cy) * (bx - ax)) / d;

    const center = { x: centerX, y: centerY };
    const radius = Math.sqrt((ax - centerX) ** 2 + (ay - centerY) ** 2);

    const startAngle = Math.atan2(ay - centerY, ax - centerX);
    const endAngle = Math.atan2(cy - centerY, cx - centerX);

    return {
        id: generateId(),
        type: 'arc',
        center,
        radius,
        startAngle,
        endAngle,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
    };
}

/**
 * Create an ellipse entity
 */
export function createEllipse(center, radiusX, radiusY, rotation = 0, layerId = 'layer-0', style = {}) {
    return {
        id: generateId(),
        type: 'ellipse',
        center,
        radiusX,
        radiusY,
        rotation: (rotation * Math.PI) / 180,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
    };
}

/**
 * Create a point/marker entity
 */
export function createPoint(position, markerType = 'cross', size = 1, layerId = 'layer-0', style = {}) {
    return {
        id: generateId(),
        type: 'point',
        position,
        markerType,
        size,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
    };
}

/**
 * Create a spline from control points
 */
export function createSpline(controlPoints, closed = false, tension = 0.5, layerId = 'layer-0', style = {}) {
    return {
        id: generateId(),
        type: 'spline',
        controlPoints,
        closed,
        tension,
        layerId,
        visible: true,
        locked: false,
        style: { ...DEFAULT_STYLE, ...style },
    };
}

/**
 * Get interpolated points along a spline (for rendering)
 * Uses Catmull-Rom spline interpolation
 */
export function interpolateSpline(spline, segments = 20) {
    const points = spline.controlPoints;
    if (points.length < 2) return points;

    const result = [];
    const n = points.length;
    const tension = spline.tension || 0.5;

    for (let i = 0; i < n - (spline.closed ? 0 : 1); i++) {
        const p0 = points[(i - 1 + n) % n];
        const p1 = points[i];
        const p2 = points[(i + 1) % n];
        const p3 = points[(i + 2) % n];

        for (let t = 0; t < segments; t++) {
            const s = t / segments;
            const s2 = s * s;
            const s3 = s2 * s;

            const x = catmullRom(p0.x, p1.x, p2.x, p3.x, s, s2, s3, tension);
            const y = catmullRom(p0.y, p1.y, p2.y, p3.y, s, s2, s3, tension);
            result.push({ x, y });
        }
    }

    if (!spline.closed) {
        result.push(points[n - 1]);
    }

    return result;
}

function catmullRom(p0, p1, p2, p3, t, t2, t3, tension) {
    const t0 = tension * (p2 - p0);
    const t1 = tension * (p3 - p1);
    return (2 * t3 - 3 * t2 + 1) * p1 +
        (t3 - 2 * t2 + t) * t0 +
        (-2 * t3 + 3 * t2) * p2 +
        (t3 - t2) * t1;
}
