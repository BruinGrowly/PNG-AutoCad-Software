/**
 * PNG CAD Integration Module
 * Converts PNG analysis results to CAD entities for drawing
 */

import { generateId, DEFAULT_STYLE } from '../core/engine.js';

// ============================================
// Terrain Analysis → CAD Entities
// ============================================

/**
 * Create contour lines from terrain model
 * @param {Object} terrain - Terrain model from createTerrainModel
 * @param {number} interval - Contour interval in meters
 * @param {Object} options - Generation options
 * @returns {Array} Array of polyline entities
 */
export function createContourEntities(terrain, interval = 1, options = {}) {
    const {
        layerId = 'layer-contours',
        majorInterval = 5,
        minorStyle = { strokeColor: '#8B4513', strokeWidth: 0.5 },
        majorStyle = { strokeColor: '#8B4513', strokeWidth: 1.5 },
    } = options;

    const entities = [];
    const { bounds, grid } = terrain;

    if (!grid || grid.length < 2) return entities;

    const rows = grid.length;
    const cols = grid[0].length;

    // Find elevation range
    let minZ = Infinity, maxZ = -Infinity;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] && grid[r][c].z !== undefined) {
                minZ = Math.min(minZ, grid[r][c].z);
                maxZ = Math.max(maxZ, grid[r][c].z);
            }
        }
    }

    // Generate contour levels
    const startLevel = Math.ceil(minZ / interval) * interval;
    const endLevel = Math.floor(maxZ / interval) * interval;

    for (let z = startLevel; z <= endLevel; z += interval) {
        const contourPoints = marchingSquaresContour(grid, z, bounds);

        if (contourPoints.length >= 2) {
            const isMajor = z % majorInterval === 0;

            entities.push({
                id: generateId(),
                type: 'polyline',
                points: contourPoints,
                closed: false,
                layerId,
                visible: true,
                locked: false,
                style: isMajor ? majorStyle : minorStyle,
                metadata: {
                    contourLevel: z,
                    isMajorContour: isMajor,
                    source: 'terrain-analysis',
                },
            });
        }
    }

    return entities;
}

/**
 * Simple marching squares for contour extraction
 */
function marchingSquaresContour(grid, level, bounds) {
    const points = [];
    const rows = grid.length;
    const cols = grid[0].length;

    const cellWidth = (bounds.maxX - bounds.minX) / (cols - 1);
    const cellHeight = (bounds.maxY - bounds.minY) / (rows - 1);

    for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
            const z00 = grid[r][c]?.z ?? 0;
            const z10 = grid[r][c + 1]?.z ?? 0;
            const z01 = grid[r + 1][c]?.z ?? 0;
            const z11 = grid[r + 1][c + 1]?.z ?? 0;

            // Check if contour passes through this cell
            const above = [z00 >= level, z10 >= level, z11 >= level, z01 >= level];
            const caseIndex = (above[0] ? 1 : 0) + (above[1] ? 2 : 0) +
                (above[2] ? 4 : 0) + (above[3] ? 8 : 0);

            if (caseIndex === 0 || caseIndex === 15) continue;

            const x0 = bounds.minX + c * cellWidth;
            const y0 = bounds.minY + r * cellHeight;

            // Interpolate contour crossing points
            const crossings = getContourCrossings(z00, z10, z01, z11, level, x0, y0, cellWidth, cellHeight);
            points.push(...crossings);
        }
    }

    return points;
}

function getContourCrossings(z00, z10, z01, z11, level, x0, y0, w, h) {
    const crossings = [];

    // Check each edge
    if ((z00 < level) !== (z10 < level)) {
        const t = (level - z00) / (z10 - z00);
        crossings.push({ x: x0 + t * w, y: y0 });
    }
    if ((z10 < level) !== (z11 < level)) {
        const t = (level - z10) / (z11 - z10);
        crossings.push({ x: x0 + w, y: y0 + t * h });
    }
    if ((z01 < level) !== (z11 < level)) {
        const t = (level - z01) / (z11 - z01);
        crossings.push({ x: x0 + t * w, y: y0 + h });
    }
    if ((z00 < level) !== (z01 < level)) {
        const t = (level - z00) / (z01 - z00);
        crossings.push({ x: x0, y: y0 + t * h });
    }

    return crossings;
}

/**
 * Create catchment boundary entities from delineateCatchment result
 */
export function createCatchmentEntities(catchment, options = {}) {
    const {
        layerId = 'layer-drainage',
        boundaryStyle = { strokeColor: '#0000FF', strokeWidth: 2 },
        outletStyle = { strokeColor: '#FF0000', strokeWidth: 3 },
    } = options;

    const entities = [];

    // Catchment boundary polygon
    if (catchment.boundary && catchment.boundary.length >= 3) {
        entities.push({
            id: generateId(),
            type: 'polyline',
            points: catchment.boundary,
            closed: true,
            layerId,
            visible: true,
            locked: false,
            style: boundaryStyle,
            metadata: {
                catchmentId: catchment.id,
                area: catchment.area,
                source: 'terrain-analysis',
            },
        });
    }

    // Outlet point marker
    if (catchment.outlet) {
        entities.push({
            id: generateId(),
            type: 'circle',
            center: catchment.outlet,
            radius: 2,
            layerId,
            visible: true,
            locked: false,
            style: outletStyle,
            metadata: {
                type: 'outlet',
                catchmentId: catchment.id,
                source: 'terrain-analysis',
            },
        });
    }

    return entities;
}

// ============================================
// Road Alignment → CAD Entities
// ============================================

/**
 * Create road alignment entities from road design
 */
export function createRoadAlignmentEntities(alignment, options = {}) {
    const {
        layerId = 'layer-roads',
        centerlineStyle = { strokeColor: '#000000', strokeWidth: 1, lineType: 'continuous' },
        edgeStyle = { strokeColor: '#666666', strokeWidth: 0.5 },
        stationMarkerInterval = 20,
    } = options;

    const entities = [];

    // Centerline
    if (alignment.centerline && alignment.centerline.length >= 2) {
        entities.push({
            id: generateId(),
            type: 'polyline',
            points: alignment.centerline,
            closed: false,
            layerId,
            visible: true,
            locked: false,
            style: centerlineStyle,
            metadata: {
                alignmentId: alignment.id,
                type: 'centerline',
                source: 'road-design',
            },
        });
    }

    // Left edge
    if (alignment.leftEdge && alignment.leftEdge.length >= 2) {
        entities.push({
            id: generateId(),
            type: 'polyline',
            points: alignment.leftEdge,
            closed: false,
            layerId,
            visible: true,
            locked: false,
            style: edgeStyle,
            metadata: {
                alignmentId: alignment.id,
                type: 'left-edge',
                source: 'road-design',
            },
        });
    }

    // Right edge
    if (alignment.rightEdge && alignment.rightEdge.length >= 2) {
        entities.push({
            id: generateId(),
            type: 'polyline',
            points: alignment.rightEdge,
            closed: false,
            layerId,
            visible: true,
            locked: false,
            style: edgeStyle,
            metadata: {
                alignmentId: alignment.id,
                type: 'right-edge',
                source: 'road-design',
            },
        });
    }

    // Station markers
    if (alignment.stations) {
        for (const station of alignment.stations) {
            if (station.chainage % stationMarkerInterval === 0) {
                // Cross mark at station
                const markSize = 1;
                entities.push({
                    id: generateId(),
                    type: 'line',
                    startPoint: { x: station.point.x - markSize, y: station.point.y },
                    endPoint: { x: station.point.x + markSize, y: station.point.y },
                    layerId,
                    visible: true,
                    locked: false,
                    style: { strokeColor: '#FF0000', strokeWidth: 0.5 },
                });

                // Station label
                entities.push({
                    id: generateId(),
                    type: 'text',
                    position: { x: station.point.x + 2, y: station.point.y },
                    content: `${station.chainage}m`,
                    fontSize: 1.5,
                    layerId,
                    visible: true,
                    locked: false,
                    style: { strokeColor: '#000000' },
                });
            }
        }
    }

    return entities;
}

// ============================================
// Landowner Parcels → CAD Entities
// ============================================

/**
 * Create landowner parcel boundary entities
 */
export function createLandownerEntities(registry, options = {}) {
    const {
        layerId = 'layer-landowners',
        boundaryStyle = { strokeColor: '#8B0000', strokeWidth: 1.5 },
        labelFontSize = 2,
        showLabels = true,
    } = options;

    const entities = [];

    for (const parcel of registry.parcels) {
        if (parcel.boundaryPoints && parcel.boundaryPoints.length >= 3) {
            // Parcel boundary
            entities.push({
                id: generateId(),
                type: 'polyline',
                points: parcel.boundaryPoints,
                closed: true,
                layerId,
                visible: true,
                locked: false,
                style: boundaryStyle,
                metadata: {
                    parcelId: parcel.id,
                    customaryName: parcel.customaryName,
                    clanName: parcel.clanName,
                    ilgNumber: parcel.ilgNumber,
                    source: 'landowner-registry',
                },
            });

            // Parcel label
            if (showLabels && parcel.customaryName) {
                const centroid = calculateCentroid(parcel.boundaryPoints);
                entities.push({
                    id: generateId(),
                    type: 'text',
                    position: centroid,
                    content: parcel.customaryName,
                    fontSize: labelFontSize,
                    layerId,
                    visible: true,
                    locked: false,
                    style: { strokeColor: '#8B0000' },
                    metadata: { parcelId: parcel.id },
                });
            }
        }
    }

    return entities;
}

function calculateCentroid(points) {
    let sumX = 0, sumY = 0;
    for (const p of points) {
        sumX += p.x || p.lng || 0;
        sumY += p.y || p.lat || 0;
    }
    return {
        x: sumX / points.length,
        y: sumY / points.length,
    };
}

// ============================================
// Structural Analysis → CAD Entities
// ============================================

/**
 * Create foundation layout entities
 */
export function createFoundationEntities(foundation, options = {}) {
    const {
        layerId = 'layer-foundation',
        outlineStyle = { strokeColor: '#8B4513', strokeWidth: 2 },
        footingStyle = { strokeColor: '#A0522D', strokeWidth: 1 },
    } = options;

    const entities = [];

    // Main foundation outline
    if (foundation.outline) {
        entities.push({
            id: generateId(),
            type: 'polyline',
            points: foundation.outline,
            closed: true,
            layerId,
            visible: true,
            locked: false,
            style: outlineStyle,
            metadata: {
                foundationType: foundation.type,
                source: 'structural-analysis',
            },
        });
    }

    // Column footings
    if (foundation.footings) {
        for (const footing of foundation.footings) {
            const halfW = footing.width / 2;
            const halfD = footing.depth / 2;

            entities.push({
                id: generateId(),
                type: 'rectangle',
                topLeft: { x: footing.position.x - halfW, y: footing.position.y - halfD },
                width: footing.width,
                height: footing.depth,
                layerId,
                visible: true,
                locked: false,
                style: footingStyle,
                metadata: {
                    footingId: footing.id,
                    loadCapacity: footing.capacity,
                    source: 'structural-analysis',
                },
            });
        }
    }

    return entities;
}

// ============================================
// Default Layers for PNG Analysis
// ============================================

export const PNG_ANALYSIS_LAYERS = [
    { id: 'layer-contours', name: 'Contours', color: '#8B4513', lineType: 'continuous', order: 20 },
    { id: 'layer-drainage', name: 'Drainage', color: '#00BFFF', lineType: 'continuous', order: 21 },
    { id: 'layer-roads', name: 'Roads', color: '#808080', lineType: 'continuous', order: 22 },
    { id: 'layer-landowners', name: 'Landowner Boundaries', color: '#8B0000', lineType: 'continuous', order: 23 },
    { id: 'layer-foundation', name: 'Foundation', color: '#8B4513', lineType: 'continuous', order: 24 },
    { id: 'layer-structural', name: 'Structural', color: '#FF0000', lineType: 'continuous', order: 25 },
];

/**
 * Add PNG analysis layers to project
 */
export function addPNGLayersToProject(project) {
    const existingIds = new Set(project.layers.map(l => l.id));
    const newLayers = PNG_ANALYSIS_LAYERS.filter(l => !existingIds.has(l.id));

    return {
        ...project,
        layers: [...project.layers, ...newLayers.map(l => ({
            ...l,
            visible: true,
            locked: false,
            lineWeight: 1,
        }))],
    };
}
