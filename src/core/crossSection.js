/**
 * Cross-Section Generation Module
 * Creates CAD entities for engineering cross-sections
 */

import { generateId, DEFAULT_STYLE } from './engine.js';

// ============================================
// Channel Cross-Section
// ============================================

/**
 * Create a trapezoidal channel cross-section
 * @param {Object} params - Channel parameters
 * @param {number} params.bottomWidth - Bottom width in meters
 * @param {number} params.depth - Channel depth in meters
 * @param {number} params.sideSlope - Side slope ratio (horizontal:vertical)
 * @param {Object} params.origin - Drawing origin { x, y }
 * @param {number} params.scale - Drawing scale (1 = 1m = 1 drawing unit)
 * @param {Object} options - Drawing options
 * @returns {Object} Cross-section with entities and annotations
 */
export function createChannelCrossSection(params, options = {}) {
    const {
        bottomWidth,
        depth,
        sideSlope = 1.5, // 1.5H:1V typical
        origin = { x: 0, y: 0 },
        scale = 10, // 1m = 10 drawing units for visibility
    } = params;

    const {
        layerId = 'layer-drainage',
        lineStyle = { strokeColor: '#0000FF', strokeWidth: 1 },
        annotationStyle = { strokeColor: '#000000' },
        showDimensions = true,
        showMaterials = true,
        freeboard = 0.3, // 300mm freeboard
    } = options;

    const entities = [];
    const annotations = [];

    // Calculate geometry
    const totalDepth = depth + freeboard;
    const topWidth = bottomWidth + 2 * sideSlope * totalDepth;

    // Scale for drawing
    const bw = bottomWidth * scale;
    const d = totalDepth * scale;
    const tw = topWidth * scale;
    const wl = depth * scale; // Water level

    // Cross-section points (clockwise from bottom-left)
    const points = [
        { x: origin.x - bw / 2, y: origin.y },                    // Bottom left
        { x: origin.x + bw / 2, y: origin.y },                    // Bottom right
        { x: origin.x + tw / 2, y: origin.y + d },                // Top right
        { x: origin.x - tw / 2, y: origin.y + d },                // Top left
    ];

    // Channel outline
    entities.push({
        id: generateId(),
        type: 'polyline',
        points: points,
        closed: true,
        layerId,
        visible: true,
        locked: false,
        style: lineStyle,
        metadata: { type: 'channel-section', source: 'drainage-workflow' },
    });

    // Water level line (dashed)
    const waterLeftX = origin.x - (bottomWidth / 2 + sideSlope * depth) * scale;
    const waterRightX = origin.x + (bottomWidth / 2 + sideSlope * depth) * scale;
    entities.push({
        id: generateId(),
        type: 'line',
        startPoint: { x: waterLeftX, y: origin.y + wl },
        endPoint: { x: waterRightX, y: origin.y + wl },
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#00BFFF', strokeWidth: 0.5, lineType: 'dashed' },
        metadata: { type: 'water-level', depth: depth },
    });

    // Annotations
    if (showDimensions) {
        // Bottom width dimension
        annotations.push({
            id: generateId(),
            type: 'text',
            position: { x: origin.x, y: origin.y - 2 * scale },
            content: `${bottomWidth.toFixed(1)}m`,
            fontSize: 2,
            layerId,
            visible: true,
            locked: false,
            style: annotationStyle,
        });

        // Depth dimension
        annotations.push({
            id: generateId(),
            type: 'text',
            position: { x: origin.x + tw / 2 + 2 * scale, y: origin.y + d / 2 },
            content: `${totalDepth.toFixed(2)}m`,
            fontSize: 2,
            rotation: Math.PI / 2,
            layerId,
            visible: true,
            locked: false,
            style: annotationStyle,
        });

        // Side slope notation
        annotations.push({
            id: generateId(),
            type: 'text',
            position: { x: origin.x + tw / 4, y: origin.y + d / 2 },
            content: `${sideSlope}:1`,
            fontSize: 1.5,
            layerId,
            visible: true,
            locked: false,
            style: annotationStyle,
        });

        // Freeboard note
        annotations.push({
            id: generateId(),
            type: 'text',
            position: { x: origin.x + tw / 2 + 2 * scale, y: origin.y + wl + (freeboard * scale) / 2 },
            content: `FB ${(freeboard * 1000).toFixed(0)}mm`,
            fontSize: 1.5,
            layerId,
            visible: true,
            locked: false,
            style: annotationStyle,
        });
    }

    return {
        entities: [...entities, ...annotations],
        geometry: {
            bottomWidth,
            topWidth: topWidth,
            depth: totalDepth,
            waterDepth: depth,
            freeboard,
            sideSlope,
            crossSectionalArea: depth * (bottomWidth + sideSlope * depth),
            wettedPerimeter: bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope),
        },
    };
}

// ============================================
// Pipe Cross-Section
// ============================================

/**
 * Create a pipe cross-section drawing
 */
export function createPipeCrossSection(params, options = {}) {
    const {
        diameter, // in mm
        cover = 600, // mm cover
        bedding = 100, // mm bedding
        origin = { x: 0, y: 0 },
        scale = 0.01, // 1mm = 0.01 drawing units
    } = params;

    const {
        layerId = 'layer-drainage',
        pipeStyle = { strokeColor: '#808080', strokeWidth: 1.5 },
        trenchStyle = { strokeColor: '#8B4513', strokeWidth: 1 },
    } = options;

    const entities = [];

    const r = (diameter / 2) * scale;
    const pipeY = origin.y + bedding * scale + r;

    // Pipe circle
    entities.push({
        id: generateId(),
        type: 'circle',
        center: { x: origin.x, y: pipeY },
        radius: r,
        layerId,
        visible: true,
        locked: false,
        style: pipeStyle,
        metadata: { type: 'pipe', diameter },
    });

    // Trench outline
    const trenchWidth = diameter * 1.5 * scale;
    const trenchDepth = (cover + diameter + bedding) * scale;

    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x: origin.x - trenchWidth / 2, y: origin.y },
        width: trenchWidth,
        height: trenchDepth,
        layerId,
        visible: true,
        locked: false,
        style: trenchStyle,
        metadata: { type: 'trench' },
    });

    // Bedding hatching zone (simplified as line)
    entities.push({
        id: generateId(),
        type: 'line',
        startPoint: { x: origin.x - trenchWidth / 2, y: origin.y + bedding * scale },
        endPoint: { x: origin.x + trenchWidth / 2, y: origin.y + bedding * scale },
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#DEB887', strokeWidth: 0.5, lineType: 'dashed' },
    });

    // Annotations
    entities.push({
        id: generateId(),
        type: 'text',
        position: { x: origin.x, y: pipeY },
        content: `Ø${diameter}`,
        fontSize: 1.5,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000' },
    });

    return {
        entities,
        geometry: {
            pipeDiameter: diameter,
            cover,
            bedding,
            trenchWidth: diameter * 1.5,
            trenchDepth: cover + diameter + bedding,
        },
    };
}

// ============================================
// Road Cross-Section
// ============================================

/**
 * Create a road cross-section at a station
 */
export function createRoadCrossSection(params, options = {}) {
    const {
        carriagewayWidth = 6.0,
        shoulderWidth = 1.5,
        crossfall = 0.03, // 3%
        batter = 2, // 2H:1V
        cutHeight = 0, // meters
        fillHeight = 0, // meters
        origin = { x: 0, y: 0 },
        scale = 5,
        station = 0,
    } = params;

    const {
        layerId = 'layer-roads',
        surfaceStyle = { strokeColor: '#333333', strokeWidth: 2 },
        formationStyle = { strokeColor: '#8B4513', strokeWidth: 1 },
    } = options;

    const entities = [];

    const halfCarriageway = (carriagewayWidth / 2) * scale;
    const shoulder = shoulderWidth * scale;
    const totalHalfWidth = halfCarriageway + shoulder;
    const crownHeight = halfCarriageway * crossfall;

    // Road surface profile
    const surfacePoints = [
        { x: origin.x - totalHalfWidth, y: origin.y },                      // Left edge
        { x: origin.x - halfCarriageway, y: origin.y },                     // Left carriageway
        { x: origin.x, y: origin.y + crownHeight },                         // Crown
        { x: origin.x + halfCarriageway, y: origin.y },                     // Right carriageway
        { x: origin.x + totalHalfWidth, y: origin.y },                      // Right edge
    ];

    entities.push({
        id: generateId(),
        type: 'polyline',
        points: surfacePoints,
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: surfaceStyle,
        metadata: { type: 'road-surface', station },
    });

    // Batter slopes for cut or fill
    if (fillHeight > 0) {
        const fillH = fillHeight * scale;
        const batterOffset = batter * fillHeight * scale;

        // Left batter
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x: origin.x - totalHalfWidth, y: origin.y },
            endPoint: { x: origin.x - totalHalfWidth - batterOffset, y: origin.y - fillH },
            layerId,
            visible: true,
            locked: false,
            style: formationStyle,
        });

        // Right batter
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x: origin.x + totalHalfWidth, y: origin.y },
            endPoint: { x: origin.x + totalHalfWidth + batterOffset, y: origin.y - fillH },
            layerId,
            visible: true,
            locked: false,
            style: formationStyle,
        });
    }

    if (cutHeight > 0) {
        const cutH = cutHeight * scale;
        const batterOffset = batter * cutHeight * scale;

        // Left cut
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x: origin.x - totalHalfWidth, y: origin.y },
            endPoint: { x: origin.x - totalHalfWidth - batterOffset, y: origin.y + cutH },
            layerId,
            visible: true,
            locked: false,
            style: formationStyle,
        });

        // Right cut
        entities.push({
            id: generateId(),
            type: 'line',
            startPoint: { x: origin.x + totalHalfWidth, y: origin.y },
            endPoint: { x: origin.x + totalHalfWidth + batterOffset, y: origin.y + cutH },
            layerId,
            visible: true,
            locked: false,
            style: formationStyle,
        });
    }

    // Station label
    entities.push({
        id: generateId(),
        type: 'text',
        position: { x: origin.x, y: origin.y - 3 * scale },
        content: `STA ${station.toFixed(0)}m`,
        fontSize: 2,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000' },
    });

    return {
        entities,
        geometry: {
            station,
            carriagewayWidth,
            shoulderWidth,
            totalWidth: carriagewayWidth + 2 * shoulderWidth,
            crossfall: crossfall * 100,
            cutHeight,
            fillHeight,
        },
    };
}

// ============================================
// Culvert Cross-Section
// ============================================

/**
 * Create a box culvert cross-section
 */
export function createCulvertCrossSection(params, options = {}) {
    const {
        width, // internal width m
        height, // internal height m
        wallThickness = 0.3, // 300mm walls
        slabThickness = 0.3, // 300mm slab
        origin = { x: 0, y: 0 },
        scale = 10,
    } = params;

    const {
        layerId = 'layer-drainage',
        concreteStyle = { strokeColor: '#808080', strokeWidth: 1.5 },
        openingStyle = { strokeColor: '#00BFFF', strokeWidth: 0.5 },
    } = options;

    const entities = [];

    const w = width * scale;
    const h = height * scale;
    const wt = wallThickness * scale;
    const st = slabThickness * scale;

    // Outer rectangle
    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x: origin.x - w / 2 - wt, y: origin.y - st },
        width: w + 2 * wt,
        height: h + 2 * st,
        layerId,
        visible: true,
        locked: false,
        style: concreteStyle,
        metadata: { type: 'culvert-outer' },
    });

    // Inner opening
    entities.push({
        id: generateId(),
        type: 'rectangle',
        topLeft: { x: origin.x - w / 2, y: origin.y },
        width: w,
        height: h,
        layerId,
        visible: true,
        locked: false,
        style: openingStyle,
        metadata: { type: 'culvert-opening' },
    });

    // Size annotation
    entities.push({
        id: generateId(),
        type: 'text',
        position: { x: origin.x, y: origin.y + h / 2 },
        content: `${width.toFixed(1)}m x ${height.toFixed(1)}m`,
        fontSize: 2,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000' },
    });

    return {
        entities,
        geometry: {
            internalWidth: width,
            internalHeight: height,
            wallThickness,
            slabThickness,
            openingArea: width * height,
        },
    };
}
