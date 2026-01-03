/**
 * PNG Building Siting Workflow
 * One-click design parameters for any PNG location
 * 
 * Workflow: Location → All Parameters → Title Block
 */

import { generateId } from '../core/engine.js';
import { getClimateDataForProvince } from './climate.js';
import { normalizeProvince, getProvinceInfo } from './provinces.js';

// ============================================
// Seismic Hazard Data
// ============================================

/**
 * Seismic Z factors by province
 * Source: PNG Building Code (1982), updated with Gibson & Sandiford (2013)
 */
const SEISMIC_Z = {
    'western': { z: 0.20, classification: 'Low', nearFault: false },
    'gulf': { z: 0.35, classification: 'Moderate', nearFault: false },
    'central': { z: 0.40, classification: 'High', nearFault: false },
    'national capital district': { z: 0.40, classification: 'High', nearFault: false },
    'milne bay': { z: 0.45, classification: 'Very High', nearFault: true },
    'northern': { z: 0.45, classification: 'Very High', nearFault: true },
    'oro': { z: 0.45, classification: 'Very High', nearFault: true },
    'morobe': { z: 0.50, classification: 'Severe', nearFault: true },
    'madang': { z: 0.50, classification: 'Severe', nearFault: true },
    'east sepik': { z: 0.35, classification: 'Moderate', nearFault: false },
    'west sepik': { z: 0.30, classification: 'Moderate', nearFault: false },
    'sandaun': { z: 0.30, classification: 'Moderate', nearFault: false },
    'eastern highlands': { z: 0.35, classification: 'Moderate', nearFault: false },
    'western highlands': { z: 0.30, classification: 'Moderate', nearFault: false },
    'simbu': { z: 0.35, classification: 'Moderate', nearFault: false },
    'chimbu': { z: 0.35, classification: 'Moderate', nearFault: false },
    'southern highlands': { z: 0.25, classification: 'Low-Moderate', nearFault: false },
    'hela': { z: 0.25, classification: 'Low-Moderate', nearFault: false },
    'jiwaka': { z: 0.30, classification: 'Moderate', nearFault: false },
    'enga': { z: 0.30, classification: 'Moderate', nearFault: false },
    'new ireland': { z: 0.40, classification: 'High', nearFault: true },
    'east new britain': { z: 0.50, classification: 'Severe', nearFault: true },
    'west new britain': { z: 0.50, classification: 'Severe', nearFault: true },
    'manus': { z: 0.40, classification: 'High', nearFault: true },
    'bougainville': { z: 0.50, classification: 'Severe', nearFault: true },
};

/**
 * Wind regions by province
 * Source: AS/NZS 1170.2:2021 adapted for PNG cyclonic exposure
 */
const WIND_REGIONS = {
    'new ireland': { region: 'C', speed: 52, cyclonic: true },
    'east new britain': { region: 'C', speed: 52, cyclonic: true },
    'west new britain': { region: 'C', speed: 52, cyclonic: true },
    'manus': { region: 'C', speed: 52, cyclonic: true },
    'bougainville': { region: 'C', speed: 52, cyclonic: true },
    'milne bay': { region: 'B', speed: 45, cyclonic: true },
    'northern': { region: 'B', speed: 45, cyclonic: true },
    'oro': { region: 'B', speed: 45, cyclonic: true },
    'gulf': { region: 'B', speed: 45, cyclonic: false },
    'western': { region: 'B', speed: 45, cyclonic: false },
    // All others default to A
};

const DEFAULT_WIND = { region: 'A', speed: 37, cyclonic: false };

// ============================================
// Main Workflow Function
// ============================================

/**
 * Get all design parameters for a building location
 * 
 * @param {Object} params - Location parameters
 * @param {string} params.province - PNG province name
 * @param {string} params.terrainCategory - AS/NZS 1170.2 terrain category (1-4)
 * @param {string} params.buildingClass - Building importance (1-4)
 * @param {string} params.soilClass - Site soil class (Ae, Be, Ce, De, Ee)
 * @returns {Object} All design parameters with CAD entities for title block
 */
export function getBuildingParameters(params) {
    const {
        province,
        terrainCategory = 'TC2.5',
        buildingClass = '2',
        soilClass = 'Ce',
        siteElevation = 0,
    } = params;

    // Normalize province name
    const normalizedProvince = normalizeProvince(province);
    if (!normalizedProvince) {
        return {
            success: false,
            error: `Unknown province: ${province}. Please check spelling.`,
            suggestions: getProvinceInfo(province)?.suggestions || [],
        };
    }

    // Get seismic data
    const seismic = SEISMIC_Z[normalizedProvince] || { z: 0.35, classification: 'Moderate', nearFault: false };

    // Get wind data
    const wind = WIND_REGIONS[normalizedProvince] || DEFAULT_WIND;

    // Get climate data
    const climate = getClimateDataForProvince(province);

    // Calculate importance factor
    const importanceFactor = getImportanceFactor(buildingClass);

    // Calculate site factor
    const siteFactor = getSiteFactor(soilClass, seismic.z);

    // Calculate design seismic force coefficient
    const kp = seismic.z * importanceFactor.seismic * siteFactor;

    // Return all parameters
    const parameters = {
        success: true,

        location: {
            province: normalizedProvince.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            terrainCategory,
            siteElevation: `${siteElevation}m`,
            soilClass,
            buildingClass,
        },

        seismic: {
            Z: seismic.z,
            classification: seismic.classification,
            nearFault: seismic.nearFault,
            importanceFactor: importanceFactor.seismic,
            siteFactor: siteFactor,
            kp: kp.toFixed(3),
            source: 'PNG Building Code (1982) / Gibson & Sandiford (2013)',
        },

        wind: {
            region: wind.region,
            basicWindSpeed: `${wind.speed} m/s`,
            cyclonic: wind.cyclonic,
            terrainCategory,
            importanceFactor: importanceFactor.wind,
            source: 'AS/NZS 1170.2:2021',
        },

        climate: climate ? {
            zone: climate.zone,
            annualRainfall: `${climate.rainfall?.annual || 'N/A'} mm`,
            maxDailyRainfall: `${climate.rainfall?.maxDaily || 'N/A'} mm`,
            meanTemp: `${climate.temperature?.mean || 'N/A'}°C`,
            humidity: `${climate.humidity?.mean || 'N/A'}%`,
        } : {
            zone: 'Unknown',
            note: 'Climate data not available for this province',
        },

        flood: siteElevation < 20 ? {
            risk: 'Potential flood risk - verify local flood levels',
            recommendation: 'Minimum floor level should be FL + 500mm',
        } : {
            risk: 'Low flood risk based on elevation',
        },

        corrosion: {
            zone: getCorrosionZone(normalizedProvince, siteElevation),
            recommendation: getCorrosionRecommendation(normalizedProvince, siteElevation),
        },
    };

    // Generate title block entities
    parameters.titleBlockEntities = generateTitleBlockEntities(parameters);
    parameters.titleBlockText = generateTitleBlockText(parameters);

    return parameters;
}

// ============================================
// Helper Functions
// ============================================

function getImportanceFactor(buildingClass) {
    const factors = {
        '1': { seismic: 0.8, wind: 0.9 },   // Minor structures
        '2': { seismic: 1.0, wind: 1.0 },   // Normal
        '3': { seismic: 1.3, wind: 1.1 },   // Important (schools, health)
        '4': { seismic: 1.8, wind: 1.15 },  // Essential (hospitals, fire stations)
    };
    return factors[buildingClass] || factors['2'];
}

function getSiteFactor(soilClass, Z) {
    // Simplified site factors from AS 1170.4
    const factors = {
        'Ae': { low: 0.8, high: 0.8 },   // Strong rock
        'Be': { low: 1.0, high: 1.0 },   // Rock
        'Ce': { low: 1.25, high: 1.25 }, // Shallow soil
        'De': { low: 1.4, high: 1.6 },   // Deep/soft soil
        'Ee': { low: 1.4, high: 1.8 },   // Very soft soil
    };

    const factor = factors[soilClass] || factors['Ce'];
    return Z >= 0.3 ? factor.high : factor.low;
}

function getCorrosionZone(province, elevation) {
    // Coastal and island provinces have higher corrosion
    const coastalProvinces = [
        'milne bay', 'northern', 'oro', 'morobe', 'madang',
        'east sepik', 'west sepik', 'sandaun', 'new ireland',
        'east new britain', 'west new britain', 'manus', 'bougainville',
    ];

    if (coastalProvinces.includes(province) && elevation < 50) {
        return 'C5'; // Very severe
    } else if (coastalProvinces.includes(province)) {
        return 'C4'; // Severe
    } else {
        return 'C3'; // Moderate
    }
}

function getCorrosionRecommendation(province, elevation) {
    const zone = getCorrosionZone(province, elevation);
    const recommendations = {
        'C5': 'Hot-dip galvanized min 600g/m² or marine-grade stainless steel',
        'C4': 'Hot-dip galvanized min 450g/m² or epoxy-coated reinforcement',
        'C3': 'Standard galvanized or painted steel acceptable',
    };
    return recommendations[zone];
}

function generateTitleBlockText(params) {
    return `
DESIGN PARAMETERS
=================
Province: ${params.location.province}
Building Class: ${params.location.buildingClass}
Soil Class: ${params.location.soilClass}

SEISMIC
Z = ${params.seismic.Z}
Classification: ${params.seismic.classification}
kp = ${params.seismic.kp}

WIND
Region: ${params.wind.region}
V = ${params.wind.basicWindSpeed}
${params.wind.cyclonic ? 'CYCLONIC ZONE' : ''}

CLIMATE
Zone: ${params.climate.zone}
Annual Rainfall: ${params.climate.annualRainfall}

CORROSION
Zone: ${params.corrosion.zone}
`.trim();
}

function generateTitleBlockEntities(params, origin = { x: 0, y: 0 }) {
    const entities = [];
    const layerId = 'layer-0';
    const lineHeight = 4;
    let y = origin.y;

    const lines = [
        ['DESIGN PARAMETERS', 3, true],
        [`Province: ${params.location.province}`, 2],
        [`Building Class: ${params.location.buildingClass}`, 2],
        ['', 0],
        ['SEISMIC', 2.5, true],
        [`Z = ${params.seismic.Z}  (${params.seismic.classification})`, 2],
        [`kp = ${params.seismic.kp}`, 2],
        ['', 0],
        ['WIND', 2.5, true],
        [`Region ${params.wind.region}: ${params.wind.basicWindSpeed}`, 2],
        ['', 0],
        ['CORROSION', 2.5, true],
        [`Zone: ${params.corrosion.zone}`, 2],
    ];

    for (const [text, fontSize, bold] of lines) {
        if (text) {
            entities.push({
                id: generateId(),
                type: 'text',
                position: { x: origin.x, y: y },
                content: text,
                fontSize,
                layerId,
                visible: true,
                locked: false,
                style: { strokeColor: '#000000', fontWeight: bold ? 'bold' : 'normal' },
            });
        }
        y -= lineHeight;
    }

    return entities;
}

// ============================================
// Exports
// ============================================

export {
    SEISMIC_Z,
    WIND_REGIONS,
    getImportanceFactor,
    getSiteFactor,
    getCorrosionZone,
};
