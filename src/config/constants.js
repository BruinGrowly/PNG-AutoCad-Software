/**
 * Configuration Constants
 * 
 * Centralized configuration for thresholds, limits, and magic numbers
 * Following the LJPW principle of Justice (fairness, transparency)
 */

// ============================================
// Structural Thresholds
// ============================================

export const STRUCTURAL = {
    // Beam limits
    beam: {
        minWidth: 200,           // mm
        minDepth: 300,           // mm
        maxSpanDepthRatio: 18,   // span/depth
        warnSpanDepthRatio: 15,  // warning threshold
    },

    // Column limits
    column: {
        minSize: 200,            // mm
        maxSlenderness: 22,      // Le/d
        seismicMinSize: 300,     // mm for severe zone
    },

    // Footing limits
    footing: {
        minDepth: 300,           // mm
        minExtension: 150,       // mm beyond column
        inGroundCover: 75,       // mm
    },

    // Reinforcement
    reinforcement: {
        minCover: {
            internal: 25,          // mm
            external: 40,          // mm
            inGround: 75,          // mm
            marine: 65,            // mm
        },
        minPercentage: 0.01,     // 1% minimum
        maxPercentage: 0.04,     // 4% maximum
        lapsAllowance: 0.10,     // 10% for laps
        wasteAllowance: 0.05,    // 5% waste
    },

    // Concrete
    concrete: {
        exposureGrades: {
            'A1': 'N20',
            'A2': 'N20',
            'B1': 'N25',
            'B2': 'N32',
            'C': 'N40',
        },
        pumpFlatFee: 350,        // PGK
        pumpPerM3: 45,           // PGK/m³
    },
};

// ============================================
// Climate Thresholds
// ============================================

export const CLIMATE = {
    // Roof requirements
    roof: {
        // Minimum pitch by annual rainfall (mm)
        minPitchByRainfall: {
            3500: 25,  // Over 3500mm
            2500: 20,  // 2500-3500mm
            0: 15,     // Under 2500mm
        },
        // Minimum overhang by rainfall (mm)
        minOverhangByRainfall: {
            3000: 900,
            2000: 750,
            0: 600,
        },
    },

    // Ventilation requirements
    ventilation: {
        minRatioTropical: 0.10,   // 10% of floor area
        minRatioHighland: 0.05,   // 5% of floor area
    },

    // Temperature
    temperature: {
        highlandCoolThreshold: 1500,  // m elevation
    },
};

// ============================================
// Seismic Thresholds
// ============================================

export const SEISMIC = {
    // Zone classifications by Z factor
    zoneClassification: {
        severe: 0.45,
        high: 0.35,
        moderate: 0.25,
        low: 0,
    },

    // Height limits for unreinforced masonry
    masonryMaxStoreys: {
        severe: 0,
        high: 1,
        moderate: 2,
        low: 3,
    },

    // Ductility requirements
    strongColumnWeakBeamRatio: 1.2,  // Column capacity / Beam capacity

    // Soil class factors
    soilClassFactors: {
        'Ae': 0.8,
        'Be': 1.0,
        'Ce': 1.25,
        'De': 1.5,
        'Ee': 1.8,
    },
};

// ============================================
// Cost Estimation Thresholds
// ============================================

export const COST = {
    // Contingency and fees
    contingencyRate: 0.10,        // 10%
    professionalFeesRate: 0.08,  // 8%

    // Height factor for multi-storey
    heightFactorPerStorey: 0.12,  // 12% per additional floor

    // Formwork reuses
    formworkReuses: 4,

    // Labour rates (PGK/day)
    labourRates: {
        labourer: 80,
        tradesman: 150,
        carpenter: 180,
        steelfixer: 180,
        concretor: 180,
        electrician: 200,
        plumber: 200,
        supervisor: 250,
        engineer: 400,
    },
};

// ============================================
// Design Validation Thresholds
// ============================================

export const VALIDATION = {
    // Bearing pressure safety margin
    bearingMarginWarning: 0.90,  // Warn at 90% of capacity

    // Punching shear depth ratio
    punchingShearMinRatio: 0.25,  // depth >= columnSize * 0.25

    // Groundwater warning depth
    groundwaterWarningDepth: 1.5,  // m
};

// ============================================
// UI/UX Constants
// ============================================

export const UI = {
    // Snap settings
    snap: {
        defaultTolerance: 5,      // pixels
        maxSearchDistance: 100,   // pixels
    },

    // Selection
    selection: {
        boxPadding: 2,            // pixels
    },

    // Auto-save
    autoSave: {
        intervalMs: 30000,        // 30 seconds
    },

    // Suggestions
    maxSuggestions: 3,
};

// ============================================
// File Format Constants
// ============================================

export const FILE = {
    dxf: {
        version: 'AC1015',        // AutoCAD 2000
        defaultLayer: '0',
    },

    pdf: {
        defaultDpi: 150,
        margins: {
            top: 20,
            bottom: 20,
            left: 20,
            right: 20,
        },
    },
};
