/**
 * PNG Road Design Workflow
 * End-to-end road design from alignment to earthworks
 * 
 * This is the main workflow module that orchestrates the road design process.
 * Individual calculations are in separate modules for maintainability.
 */

import { generateId } from '../core/engine.js';
import { createRoadCrossSection } from '../core/crossSection.js';
import {
    ROAD_CLASSES,
    BATTER_SLOPES,
    calculateHorizontalAlignment,
    generateStations,
    generateRoadEdges,
} from './roadAlignment.js';
import {
    calculateVerticalProfile,
    calculateEarthworks,
} from './roadProfile.js';

// ============================================
// Main Workflow Function
// ============================================

/**
 * Complete road design workflow
 * 
 * @param {Object} params - Workflow parameters
 * @param {Array} params.alignmentPoints - Array of alignment points { x, y, z }
 * @param {string} params.roadClass - Road classification
 * @param {string} params.terrainType - Terrain classification for batter slopes
 * @param {number} params.stationInterval - Cross-section interval (meters)
 * @param {Object} options - Additional options
 * @returns {Object} Complete design with entities and calculations
 */
export function designRoad(params, options = {}) {
    const {
        alignmentPoints,
        roadClass = 'district',
        terrainType = 'laterite',
        stationInterval = 20,
    } = params;

    const {
        layerId = 'layer-roads',
        profileOrigin = { x: 0, y: -100 },
        crossSectionOrigin = { x: 200, y: 0 },
        horizontalScale = 1,
        verticalScale = 10,
    } = options;

    if (!alignmentPoints || alignmentPoints.length < 2) {
        return { success: false, error: 'At least 2 alignment points required' };
    }

    // Get road standards
    const standards = ROAD_CLASSES[roadClass] || ROAD_CLASSES['district'];
    const batterSlope = BATTER_SLOPES[terrainType] || 1.5;

    // Step 1: Calculate horizontal alignment
    const alignment = calculateHorizontalAlignment(alignmentPoints, standards);

    // Step 2: Generate stations along alignment
    const stations = generateStations(alignment, stationInterval);

    // Step 3: Calculate vertical profile
    const profile = calculateVerticalProfile(stations, standards);

    // Step 4: Calculate earthworks at each station
    const earthworks = calculateEarthworks(profile, standards, batterSlope);

    // Step 5: Generate CAD entities
    const entities = generateRoadEntities({
        alignmentPoints,
        alignment,
        profile,
        earthworks,
        standards,
        batterSlope,
        stationInterval,
        layerId,
        profileOrigin,
        crossSectionOrigin,
        horizontalScale,
        verticalScale,
    });

    // Generate report
    const report = generateRoadReport({
        roadClass,
        standards,
        alignment,
        profile,
        earthworks,
        terrainType,
        batterSlope,
    });

    return {
        success: true,
        roadClass,
        standards,
        alignment,
        profile,
        earthworks,
        totalLength: alignment.totalLength,
        totalCut: earthworks.totalCut,
        totalFill: earthworks.totalFill,
        netEarthworks: earthworks.totalFill - earthworks.totalCut,
        entities,
        report,
        titleBlockData: {
            projectTitle: 'Road Design',
            roadClass: roadClass.charAt(0).toUpperCase() + roadClass.slice(1) + ' Road',
            totalLength: `${alignment.totalLength.toFixed(0)}m`,
            cut: `${earthworks.totalCut.toFixed(0)} m³`,
            fill: `${earthworks.totalFill.toFixed(0)} m³`,
        },
    };
}

// ============================================
// Entity Generation
// ============================================

function generateRoadEntities(data) {
    const {
        alignmentPoints,
        profile,
        earthworks,
        standards,
        batterSlope,
        stationInterval,
        layerId,
        profileOrigin,
        crossSectionOrigin,
        horizontalScale,
        verticalScale,
    } = data;

    const entities = [];

    // Alignment centerline
    entities.push({
        id: generateId(),
        type: 'polyline',
        points: alignmentPoints.map(p => ({ x: p.x, y: p.y })),
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000', strokeWidth: 1.5 },
        metadata: { type: 'centerline', source: 'road-workflow' },
    });

    // Road edges
    const { leftEdge, rightEdge } = generateRoadEdges(
        alignmentPoints,
        standards.carriagewayWidth / 2 + standards.shoulderWidth
    );

    entities.push({
        id: generateId(),
        type: 'polyline',
        points: leftEdge,
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#666666', strokeWidth: 0.5 },
        metadata: { type: 'left-edge' },
    });

    entities.push({
        id: generateId(),
        type: 'polyline',
        points: rightEdge,
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#666666', strokeWidth: 0.5 },
        metadata: { type: 'right-edge' },
    });

    // Profile entities
    entities.push(...generateProfileEntities(
        profile,
        profileOrigin,
        horizontalScale,
        verticalScale,
        layerId
    ));

    // Cross-sections at key stations
    entities.push(...generateCrossSectionEntities(
        earthworks,
        crossSectionOrigin,
        standards,
        batterSlope,
        layerId
    ));

    // Station markers on plan
    for (const station of profile.stations) {
        if (station.chainage % (stationInterval * 5) === 0) {
            entities.push({
                id: generateId(),
                type: 'text',
                position: { x: station.point.x + 5, y: station.point.y },
                content: `${station.chainage}`,
                fontSize: 2,
                layerId,
                visible: true,
                locked: false,
                style: { strokeColor: '#FF0000' },
            });
        }
    }

    return entities;
}

function generateProfileEntities(profile, origin, hScale, vScale, layerId) {
    const entities = [];

    // Ground line
    const groundPoints = profile.stations.map(s => ({
        x: origin.x + s.chainage * hScale,
        y: origin.y + s.groundLevel * vScale,
    }));

    entities.push({
        id: generateId(),
        type: 'polyline',
        points: groundPoints,
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#8B4513', strokeWidth: 1 },
        metadata: { type: 'ground-profile' },
    });

    // Design line
    const designPoints = profile.stations.map(s => ({
        x: origin.x + s.chainage * hScale,
        y: origin.y + s.designLevel * vScale,
    }));

    entities.push({
        id: generateId(),
        type: 'polyline',
        points: designPoints,
        closed: false,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#FF0000', strokeWidth: 1.5 },
        metadata: { type: 'design-profile' },
    });

    // Title
    entities.push({
        id: generateId(),
        type: 'text',
        position: { x: origin.x - 20, y: origin.y },
        content: 'LONG SECTION',
        fontSize: 3,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#000000' },
    });

    return entities;
}

function generateCrossSectionEntities(earthworks, origin, standards, batterSlope, layerId) {
    const entities = [];
    const spacing = 60;

    const indices = [0, Math.floor(earthworks.stations.length / 2), earthworks.stations.length - 1];

    indices.forEach((idx, i) => {
        const station = earthworks.stations[idx];
        const sectionOrigin = { x: origin.x + i * spacing, y: origin.y };

        const section = createRoadCrossSection({
            carriagewayWidth: standards.carriagewayWidth,
            shoulderWidth: standards.shoulderWidth,
            crossfall: standards.crossfall,
            batter: batterSlope,
            cutHeight: station.cutFillHeight < 0 ? Math.abs(station.cutFillHeight) : 0,
            fillHeight: station.cutFillHeight > 0 ? station.cutFillHeight : 0,
            origin: sectionOrigin,
            scale: 5,
            station: station.chainage,
        }, { layerId });

        entities.push(...section.entities);
    });

    return entities;
}

function generateRoadReport(data) {
    return {
        title: 'Road Design Summary',
        timestamp: new Date().toISOString(),
        classification: {
            roadClass: data.roadClass,
            designSpeed: `${data.standards.designSpeed} km/h`,
            carriagewayWidth: `${data.standards.carriagewayWidth}m`,
            shoulderWidth: `${data.standards.shoulderWidth}m`,
            source: data.standards.source,
        },
        alignment: {
            totalLength: `${data.alignment.totalLength.toFixed(0)}m`,
            numberOfCurves: data.alignment.curves.length,
            minimumRadius: `${data.standards.minRadius}m`,
        },
        profile: {
            maxGrade: `${data.profile.maxGrade.toFixed(1)}%`,
            allowedGrade: `${data.standards.maxGrade}%`,
            totalRise: `${data.profile.totalRise.toFixed(1)}m`,
            totalFall: `${data.profile.totalFall.toFixed(1)}m`,
        },
        earthworks: {
            totalCut: `${data.earthworks.totalCut.toFixed(0)} m³`,
            totalFill: `${data.earthworks.totalFill.toFixed(0)} m³`,
            netVolume: `${(data.earthworks.totalFill - data.earthworks.totalCut).toFixed(0)} m³`,
            balancePoint: data.earthworks.balancePoint ?
                `CH ${data.earthworks.balancePoint.toFixed(0)}` : 'N/A',
        },
        terrain: {
            type: data.terrainType,
            batterSlope: `${data.batterSlope}:1`,
        },
        dataSources: [
            'PNG Department of Works Road Design Manual (1998)',
            'ReCAP Low Volume Rural Road Design (2019)',
        ],
    };
}

// ============================================
// Re-exports from submodules
// ============================================

export {
    ROAD_CLASSES,
    BATTER_SLOPES,
    calculateHorizontalAlignment,
    calculateVerticalProfile,
    calculateEarthworks,
};
