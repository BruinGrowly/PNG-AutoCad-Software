/**
 * PNG Drainage Design Workflow
 * End-to-end drainage design from catchment to drawing
 * 
 * Workflow: Survey → Analysis → Sizing → Cross-Section → Drawing
 */

import { generateId } from '../core/engine.js';
import { createChannelCrossSection, createPipeCrossSection, createCulvertCrossSection } from '../core/crossSection.js';
import { getClimateDataForProvince, calculateDesignRainfallIntensity } from './climate.js';

// ============================================
// Data Sources (Documented)
// ============================================

/**
 * Runoff coefficients for PNG conditions
 * Source: PNG Department of Works, Drainage Design Manual (1985)
 * Updated with values from ReCAP Low Volume Roads Manual (2019)
 */
const RUNOFF_COEFFICIENTS = {
    // Urban surfaces
    'roof-metal': 0.95,
    'roof-thatch': 0.60,
    'concrete': 0.95,
    'asphalt': 0.90,
    'gravel': 0.60,

    // Pervious surfaces
    'grass-flat': 0.25,      // <2% slope
    'grass-moderate': 0.35,  // 2-7% slope
    'grass-steep': 0.45,     // >7% slope
    'kunai': 0.40,           // Kunai grassland (common in PNG highlands)
    'garden': 0.35,          // Food gardens (mixed vegetation)

    // Natural surfaces
    'forest': 0.20,
    'bush': 0.30,
    'bare-soil': 0.70,
    'laterite': 0.75,        // Common PNG soil type

    // Composite (typical PNG settlements)
    'village-coastal': 0.45,
    'village-highland': 0.40,
    'township': 0.65,
};

/**
 * Time of concentration formulas
 * Source: Bransby-Williams adapted for PNG steep catchments
 */
function calculateTimeOfConcentration(catchmentArea, length, slope, terrainType) {
    // Bransby-Williams: tc = L / (72 * (A^0.1) * (S^0.2))
    // L in km, A in km², S in %, tc in hours

    const L = length / 1000; // m to km
    const A = catchmentArea / 1000000; // m² to km²
    const S = slope * 100; // ratio to %

    let tc = L / (72 * Math.pow(A, 0.1) * Math.pow(Math.max(S, 0.5), 0.2));

    // Adjustment for PNG terrain
    const terrainFactors = {
        'steep-mountain': 0.7,
        'highland-valley': 0.9,
        'coastal-lowland': 1.1,
        'swamp-wetland': 1.5,
    };

    tc *= terrainFactors[terrainType] || 1.0;

    // Convert to minutes, minimum 5 minutes
    return Math.max(tc * 60, 5);
}

// ============================================
// Main Workflow Function
// ============================================

/**
 * Complete drainage design workflow
 * 
 * @param {Object} params - Workflow parameters
 * @param {Array} params.catchmentBoundary - Array of points defining catchment
 * @param {Object} params.outletPoint - Outlet location { x, y }
 * @param {string} params.province - PNG province name
 * @param {string} params.terrainType - Terrain classification
 * @param {number} params.returnPeriod - Design return period (years)
 * @param {string} params.surfaceType - Predominant surface type
 * @param {string} params.drainType - 'channel', 'pipe', or 'culvert'
 * @param {Object} options - Additional options
 * @returns {Object} Complete design with entities and report
 */
export function designDrainage(params, options = {}) {
    const {
        catchmentBoundary,
        outletPoint,
        province,
        terrainType = 'coastal-lowland',
        returnPeriod = 10,
        surfaceType = 'village-coastal',
        drainType = 'channel',
    } = params;

    const {
        layerId = 'layer-drainage',
        crossSectionOrigin = { x: 0, y: -50 },
        drawingScale = 10,
    } = options;

    // Step 1: Calculate catchment properties
    const catchmentProps = calculateCatchmentProperties(catchmentBoundary);

    // Step 2: Get climate data for province
    const climateData = getClimateDataForProvince(province);
    if (!climateData) {
        return {
            success: false,
            error: `No climate data available for province: ${province}`,
        };
    }

    // Step 3: Calculate time of concentration
    const tc = calculateTimeOfConcentration(
        catchmentProps.area,
        catchmentProps.longestFlowPath,
        catchmentProps.averageSlope,
        terrainType
    );

    // Step 4: Calculate design rainfall intensity
    const rainfallIntensity = calculateDesignRainfallIntensity(
        climateData,
        returnPeriod,
        tc
    );

    // Step 5: Get runoff coefficient
    const runoffCoefficient = getRunoffCoefficient(surfaceType, catchmentProps.averageSlope);

    // Step 6: Calculate design discharge (Rational Method)
    // Q = C * I * A / 360 (I in mm/hr, A in ha, Q in m³/s)
    const designDischarge = (runoffCoefficient * rainfallIntensity * (catchmentProps.area / 10000)) / 360;

    // Step 7: Size the drainage structure
    const sizing = sizeDrainageStructure(drainType, designDischarge, catchmentProps.averageSlope);

    // Step 8: Generate cross-section entities
    const crossSection = generateCrossSection(
        drainType,
        sizing,
        crossSectionOrigin,
        drawingScale,
        layerId
    );

    // Step 9: Generate catchment boundary entities
    const catchmentEntities = generateCatchmentEntities(
        catchmentBoundary,
        outletPoint,
        layerId
    );

    // Step 10: Generate design report
    const report = generateDesignReport({
        catchmentProps,
        climateData,
        tc,
        rainfallIntensity,
        runoffCoefficient,
        designDischarge,
        sizing,
        drainType,
        returnPeriod,
        province,
        surfaceType,
    });

    return {
        success: true,

        // Design results
        catchmentArea: catchmentProps.area,
        designDischarge,
        drainType,
        sizing,

        // CAD entities for drawing
        entities: [
            ...catchmentEntities,
            ...crossSection.entities,
        ],

        // Cross-section geometry
        crossSectionGeometry: crossSection.geometry,

        // Design report
        report,

        // Data for title block
        titleBlockData: {
            projectTitle: 'Drainage Design',
            province,
            returnPeriod: `${returnPeriod} year`,
            designDischarge: `${designDischarge.toFixed(3)} m³/s`,
            drainageType: drainType,
            drainSize: sizing.description,
        },
    };
}

// ============================================
// Helper Functions
// ============================================

function calculateCatchmentProperties(boundary) {
    if (!boundary || boundary.length < 3) {
        return { area: 0, perimeter: 0, longestFlowPath: 0, averageSlope: 0.02 };
    }

    // Calculate area using shoelace formula
    let area = 0;
    let perimeter = 0;
    const n = boundary.length;

    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += boundary[i].x * boundary[j].y;
        area -= boundary[j].x * boundary[i].y;

        const dx = boundary[j].x - boundary[i].x;
        const dy = boundary[j].y - boundary[i].y;
        perimeter += Math.sqrt(dx * dx + dy * dy);
    }
    area = Math.abs(area) / 2;

    // Estimate longest flow path (simplified as longest diagonal)
    let maxDist = 0;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            const dx = boundary[j].x - boundary[i].x;
            const dy = boundary[j].y - boundary[i].y;
            maxDist = Math.max(maxDist, Math.sqrt(dx * dx + dy * dy));
        }
    }

    return {
        area,
        perimeter,
        longestFlowPath: maxDist,
        averageSlope: 0.02, // Default 2% - would need terrain data for actual
    };
}

function getRunoffCoefficient(surfaceType, slope) {
    const baseC = RUNOFF_COEFFICIENTS[surfaceType] || 0.5;

    // Adjust for slope (steeper = higher runoff)
    if (slope > 0.07) return Math.min(baseC + 0.1, 0.95);
    if (slope < 0.02) return Math.max(baseC - 0.05, 0.1);

    return baseC;
}

function sizeDrainageStructure(drainType, discharge, slope) {
    // Manning's equation: Q = (1/n) * A * R^(2/3) * S^(1/2)
    const n = 0.025; // Manning's n for earth channels
    const minSlope = Math.max(slope, 0.005);

    switch (drainType) {
        case 'pipe': {
            // Solve for diameter: D = (Q * n * 4^(5/3) / (π * √S))^(3/8)
            const D = Math.pow(
                (discharge * n * Math.pow(4, 5 / 3)) / (Math.PI * Math.sqrt(minSlope)),
                3 / 8
            ) * 1000; // Convert to mm

            const standardSizes = [300, 375, 450, 525, 600, 750, 900, 1050, 1200];
            const diameter = standardSizes.find(s => s >= D) || standardSizes[standardSizes.length - 1];

            return {
                type: 'pipe',
                diameter,
                description: `Ø${diameter}mm RCP`,
                cover: 600, // 600mm minimum cover
                bedding: 100,
            };
        }

        case 'culvert': {
            // Size for headwater/diameter ratio of 1.2
            const area = discharge / (2.0 * Math.sqrt(minSlope)); // Approximate

            // Standard box culvert sizes (width x height)
            const sizes = [
                { w: 0.9, h: 0.6 }, { w: 1.2, h: 0.6 }, { w: 1.2, h: 0.9 },
                { w: 1.5, h: 0.9 }, { w: 1.8, h: 1.2 }, { w: 2.4, h: 1.2 },
                { w: 3.0, h: 1.5 }, { w: 3.6, h: 1.8 },
            ];

            const selected = sizes.find(s => s.w * s.h >= area) || sizes[sizes.length - 1];

            return {
                type: 'culvert',
                width: selected.w,
                height: selected.h,
                description: `${selected.w.toFixed(1)}m x ${selected.h.toFixed(1)}m Box Culvert`,
                wallThickness: 0.3,
                slabThickness: 0.3,
            };
        }

        case 'channel':
        default: {
            // Trapezoidal channel, optimize for minimum area
            // For side slope 1.5:1, optimal b/d ≈ 0.6
            const sideSlope = 1.5;

            // Solve iteratively
            let depth = 0.5;
            for (let i = 0; i < 10; i++) {
                const bottomWidth = 0.6 * depth;
                const area = depth * (bottomWidth + sideSlope * depth);
                const wp = bottomWidth + 2 * depth * Math.sqrt(1 + sideSlope * sideSlope);
                const R = area / wp;
                const Q = (1 / n) * area * Math.pow(R, 2 / 3) * Math.sqrt(minSlope);

                if (Q >= discharge) break;
                depth += 0.1;
            }

            const bottomWidth = Math.max(0.6 * depth, 0.3);

            return {
                type: 'channel',
                bottomWidth: Math.round(bottomWidth * 10) / 10,
                depth: Math.round(depth * 10) / 10,
                sideSlope,
                description: `${bottomWidth.toFixed(1)}m x ${depth.toFixed(1)}m Trapezoidal Channel`,
                freeboard: 0.3,
            };
        }
    }
}

function generateCrossSection(drainType, sizing, origin, scale, layerId) {
    switch (drainType) {
        case 'pipe':
            return createPipeCrossSection({
                diameter: sizing.diameter,
                cover: sizing.cover,
                bedding: sizing.bedding,
                origin,
                scale: 0.02,
            }, { layerId });

        case 'culvert':
            return createCulvertCrossSection({
                width: sizing.width,
                height: sizing.height,
                wallThickness: sizing.wallThickness,
                slabThickness: sizing.slabThickness,
                origin,
                scale,
            }, { layerId });

        case 'channel':
        default:
            return createChannelCrossSection({
                bottomWidth: sizing.bottomWidth,
                depth: sizing.depth,
                sideSlope: sizing.sideSlope,
                origin,
                scale,
            }, { layerId, freeboard: sizing.freeboard });
    }
}

function generateCatchmentEntities(boundary, outlet, layerId) {
    const entities = [];

    // Catchment boundary polygon
    entities.push({
        id: generateId(),
        type: 'polyline',
        points: boundary,
        closed: true,
        layerId,
        visible: true,
        locked: false,
        style: { strokeColor: '#0000FF', strokeWidth: 1.5, lineType: 'dashed' },
        metadata: { type: 'catchment-boundary', source: 'drainage-workflow' },
    });

    // Outlet point marker
    if (outlet) {
        entities.push({
            id: generateId(),
            type: 'circle',
            center: outlet,
            radius: 3,
            layerId,
            visible: true,
            locked: false,
            style: { strokeColor: '#FF0000', strokeWidth: 2 },
            metadata: { type: 'outlet', source: 'drainage-workflow' },
        });

        entities.push({
            id: generateId(),
            type: 'text',
            position: { x: outlet.x + 5, y: outlet.y },
            content: 'OUTLET',
            fontSize: 2,
            layerId,
            visible: true,
            locked: false,
            style: { strokeColor: '#FF0000' },
        });
    }

    return entities;
}

function generateDesignReport(data) {
    return {
        title: 'Drainage Design Summary',
        timestamp: new Date().toISOString(),

        catchment: {
            area: `${(data.catchmentProps.area / 10000).toFixed(2)} ha`,
            perimeter: `${data.catchmentProps.perimeter.toFixed(0)} m`,
            longestFlowPath: `${data.catchmentProps.longestFlowPath.toFixed(0)} m`,
        },

        hydrology: {
            province: data.province,
            returnPeriod: `${data.returnPeriod} years`,
            timeOfConcentration: `${data.tc.toFixed(1)} minutes`,
            rainfallIntensity: `${data.rainfallIntensity.toFixed(1)} mm/hr`,
            runoffCoefficient: data.runoffCoefficient.toFixed(2),
            surfaceType: data.surfaceType,
        },

        discharge: {
            designDischarge: `${data.designDischarge.toFixed(4)} m³/s`,
            designDischargeL: `${(data.designDischarge * 1000).toFixed(1)} L/s`,
        },

        structure: {
            type: data.drainType,
            description: data.sizing.description,
            dimensions: data.sizing,
        },

        notes: [
            'Design based on Rational Method (Q = CIA/360)',
            `Rainfall data from PNG Climate Zone: ${data.climateData.zone}`,
            'Manning\'s n = 0.025 for earth channel',
            'Freeboard = 300mm included in channel design',
        ],

        dataSources: [
            'PNG Department of Works Drainage Design Manual (1985)',
            'ReCAP Low Volume Roads Manual (2019)',
            'PNG Bureau of Meteorology rainfall records',
        ],
    };
}

// ============================================
// Exports
// ============================================

export {
    RUNOFF_COEFFICIENTS,
    calculateTimeOfConcentration,
    sizeDrainageStructure,
};
