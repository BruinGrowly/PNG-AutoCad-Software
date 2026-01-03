/**
 * PNG Road Design Workflow
 * End-to-end road design from alignment to earthworks
 * 
 * Workflow: Survey Points → Alignment → Profile → Cross-Sections → Earthworks
 */

import { generateId } from '../core/engine.js';
import { createRoadCrossSection } from '../core/crossSection.js';

// ============================================
// Data Sources (Documented)
// ============================================

/**
 * PNG Road Design Standards
 * Source: PNG Department of Works Road Design Manual (1998)
 * Updated with: ReCAP Low Volume Rural Road Design (2019)
 */
const ROAD_CLASSES = {
    'provincial': {
        designSpeed: 60,
        carriagewayWidth: 6.0,
        shoulderWidth: 1.5,
        maxGrade: 8,
        minRadius: 120,
        crossfall: 0.03,
        superelevationMax: 0.08,
        sightDistance: 85,
        source: 'PNG DWorks (1998)',
    },
    'district': {
        designSpeed: 40,
        carriagewayWidth: 5.5,
        shoulderWidth: 1.0,
        maxGrade: 12,
        minRadius: 50,
        crossfall: 0.04,
        superelevationMax: 0.10,
        sightDistance: 45,
        source: 'ReCAP (2019)',
    },
    'access': {
        designSpeed: 30,
        carriagewayWidth: 4.5,
        shoulderWidth: 0.5,
        maxGrade: 15,
        minRadius: 25,
        crossfall: 0.05,
        superelevationMax: 0.10,
        sightDistance: 30,
        source: 'ReCAP (2019)',
    },
    'track': {
        designSpeed: 20,
        carriagewayWidth: 3.5,
        shoulderWidth: 0.0,
        maxGrade: 18,
        minRadius: 15,
        crossfall: 0.05,
        superelevationMax: 0.10,
        sightDistance: 20,
        source: 'ReCAP (2019)',
    },
};

/**
 * Batter slopes based on material
 * Source: ReCAP Table 7.3
 */
const BATTER_SLOPES = {
    'rock': 0.25,      // 0.25H:1V (very steep)
    'laterite': 1.0,   // 1:1
    'clay': 1.5,       // 1.5:1
    'sand': 2.0,       // 2:1
    'alluvial': 2.5,   // 2.5:1
    'swamp': 3.0,      // 3:1 (very flat)
};

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
        verticalScale = 10, // Exaggerated for visibility
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
    const profileEntities = generateProfileEntities(
        profile,
        profileOrigin,
        horizontalScale,
        verticalScale,
        layerId
    );
    entities.push(...profileEntities);

    // Cross-sections at key stations
    const crossSections = generateCrossSectionEntities(
        earthworks,
        crossSectionOrigin,
        standards,
        batterSlope,
        layerId
    );
    entities.push(...crossSections);

    // Station markers on plan
    for (const station of stations) {
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

        // Design data
        roadClass,
        standards,
        alignment,
        profile,
        earthworks,

        // Summary
        totalLength: alignment.totalLength,
        totalCut: earthworks.totalCut,
        totalFill: earthworks.totalFill,
        netEarthworks: earthworks.totalFill - earthworks.totalCut,

        // CAD entities
        entities,

        // Report
        report,

        // Title block data
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
// Alignment Calculations
// ============================================

function calculateHorizontalAlignment(points, standards) {
    const segments = [];
    let totalLength = 0;

    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const bearing = Math.atan2(dx, dy) * (180 / Math.PI);

        segments.push({
            index: i,
            start,
            end,
            length,
            bearing: bearing < 0 ? bearing + 360 : bearing,
            startChainage: totalLength,
            endChainage: totalLength + length,
        });

        totalLength += length;
    }

    // Calculate intersection points and curve data
    const curves = [];
    for (let i = 0; i < segments.length - 1; i++) {
        const s1 = segments[i];
        const s2 = segments[i + 1];
        const deflection = s2.bearing - s1.bearing;
        const adjustedDeflection = deflection > 180 ? deflection - 360 :
            deflection < -180 ? deflection + 360 : deflection;

        if (Math.abs(adjustedDeflection) > 1) {
            curves.push({
                ip: s1.end,
                chainage: s1.endChainage,
                deflection: adjustedDeflection,
                radius: Math.max(standards.minRadius, Math.abs(500 / adjustedDeflection) * 10),
            });
        }
    }

    return {
        segments,
        curves,
        totalLength,
        startPoint: points[0],
        endPoint: points[points.length - 1],
    };
}

function generateStations(alignment, interval) {
    const stations = [];
    let currentChainage = 0;

    while (currentChainage <= alignment.totalLength) {
        const point = getPointAtChainage(alignment, currentChainage);
        const elevation = point.z || 0;

        stations.push({
            chainage: currentChainage,
            point,
            groundLevel: elevation,
        });

        currentChainage += interval;
    }

    // Add final station if not already included
    if (stations[stations.length - 1].chainage < alignment.totalLength) {
        const point = getPointAtChainage(alignment, alignment.totalLength);
        stations.push({
            chainage: alignment.totalLength,
            point,
            groundLevel: point.z || 0,
        });
    }

    return stations;
}

function getPointAtChainage(alignment, chainage) {
    for (const segment of alignment.segments) {
        if (chainage >= segment.startChainage && chainage <= segment.endChainage) {
            const t = (chainage - segment.startChainage) / segment.length;
            return {
                x: segment.start.x + t * (segment.end.x - segment.start.x),
                y: segment.start.y + t * (segment.end.y - segment.start.y),
                z: (segment.start.z || 0) + t * ((segment.end.z || 0) - (segment.start.z || 0)),
            };
        }
    }
    return alignment.endPoint;
}

// ============================================
// Vertical Profile
// ============================================

function calculateVerticalProfile(stations, standards) {
    const profile = {
        stations: [],
        maxGrade: 0,
        totalRise: 0,
        totalFall: 0,
    };

    for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        let designLevel = station.groundLevel; // Start with ground level
        let grade = 0;

        if (i > 0) {
            const prev = stations[i - 1];
            const dChainage = station.chainage - prev.chainage;
            const dElevation = station.groundLevel - prev.groundLevel;
            grade = (dElevation / dChainage) * 100;

            // Limit grade to maximum allowed
            if (Math.abs(grade) > standards.maxGrade) {
                const limitedGrade = Math.sign(grade) * standards.maxGrade;
                designLevel = profile.stations[i - 1].designLevel + (limitedGrade / 100) * dChainage;
                grade = limitedGrade;
            }

            profile.maxGrade = Math.max(profile.maxGrade, Math.abs(grade));
            if (dElevation > 0) profile.totalRise += dElevation;
            else profile.totalFall += Math.abs(dElevation);
        }

        profile.stations.push({
            chainage: station.chainage,
            point: station.point,
            groundLevel: station.groundLevel,
            designLevel,
            grade,
            cutFill: designLevel - station.groundLevel, // positive = fill, negative = cut
        });
    }

    return profile;
}

// ============================================
// Earthworks
// ============================================

function calculateEarthworks(profile, standards, batterSlope) {
    const stationEarthworks = [];
    let totalCut = 0;
    let totalFill = 0;

    const totalWidth = standards.carriagewayWidth + 2 * standards.shoulderWidth;

    for (let i = 0; i < profile.stations.length; i++) {
        const station = profile.stations[i];
        const cutFillHeight = station.cutFill;

        // Calculate cross-sectional area (simplified trapezoid)
        let cutArea = 0;
        let fillArea = 0;

        if (cutFillHeight < 0) {
            // Cut section
            const cutHeight = Math.abs(cutFillHeight);
            const topWidth = totalWidth + 2 * batterSlope * cutHeight;
            cutArea = (totalWidth + topWidth) / 2 * cutHeight;
        } else if (cutFillHeight > 0) {
            // Fill section
            const fillHeight = cutFillHeight;
            const bottomWidth = totalWidth + 2 * batterSlope * fillHeight;
            fillArea = (totalWidth + bottomWidth) / 2 * fillHeight;
        }

        // Calculate volume (using average end-area method)
        let cutVolume = 0;
        let fillVolume = 0;

        if (i > 0) {
            const prevStation = stationEarthworks[i - 1];
            const distance = station.chainage - profile.stations[i - 1].chainage;

            cutVolume = (cutArea + prevStation.cutArea) / 2 * distance;
            fillVolume = (fillArea + prevStation.fillArea) / 2 * distance;

            totalCut += cutVolume;
            totalFill += fillVolume;
        }

        stationEarthworks.push({
            chainage: station.chainage,
            groundLevel: station.groundLevel,
            designLevel: station.designLevel,
            cutFillHeight,
            cutArea,
            fillArea,
            cutVolume,
            fillVolume,
            cumulativeCut: totalCut,
            cumulativeFill: totalFill,
        });
    }

    return {
        stations: stationEarthworks,
        totalCut,
        totalFill,
        netVolume: totalFill - totalCut,
        balancePoint: findBalancePoint(stationEarthworks),
    };
}

function findBalancePoint(stationEarthworks) {
    for (let i = 1; i < stationEarthworks.length; i++) {
        const prev = stationEarthworks[i - 1];
        const curr = stationEarthworks[i];

        if ((prev.cumulativeFill - prev.cumulativeCut) * (curr.cumulativeFill - curr.cumulativeCut) < 0) {
            return curr.chainage;
        }
    }
    return null;
}

// ============================================
// Entity Generation
// ============================================

function generateRoadEdges(centerline, offset) {
    const leftEdge = [];
    const rightEdge = [];

    for (let i = 0; i < centerline.length; i++) {
        const curr = centerline[i];
        let dx, dy, len;

        if (i === 0) {
            const next = centerline[i + 1];
            dx = next.x - curr.x;
            dy = next.y - curr.y;
        } else if (i === centerline.length - 1) {
            const prev = centerline[i - 1];
            dx = curr.x - prev.x;
            dy = curr.y - prev.y;
        } else {
            const prev = centerline[i - 1];
            const next = centerline[i + 1];
            dx = next.x - prev.x;
            dy = next.y - prev.y;
        }

        len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * offset;
        const ny = dx / len * offset;

        leftEdge.push({ x: curr.x + nx, y: curr.y + ny });
        rightEdge.push({ x: curr.x - nx, y: curr.y - ny });
    }

    return { leftEdge, rightEdge };
}

function generateProfileEntities(profile, origin, hScale, vScale, layerId) {
    const entities = [];

    // Ground line
    const groundPoints = profile.stations.map((s, i) => ({
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

    // Axis labels
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
    const spacing = 60; // Spacing between cross-sections

    // Show first, middle, and last cross-sections
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
// Exports
// ============================================

export {
    ROAD_CLASSES,
    BATTER_SLOPES,
    calculateHorizontalAlignment,
    calculateVerticalProfile,
    calculateEarthworks,
};
