/**
 * Structural Calculations Workflow
 * Beam, column, and footing sizing for PNG conditions
 * 
 * References:
 * - AS 3600 Concrete Structures
 * - AS 4100 Steel Structures  
 * - AS 1720 Timber Structures
 * - PNG Building Standards
 */

import { SEISMIC_Z } from './buildingWorkflow.js';

// ============================================
// Material Properties
// ============================================

export const CONCRETE_GRADES = {
    'N20': { fck: 20, fcd: 13.3, description: 'Normal - footings, blinding' },
    'N25': { fck: 25, fcd: 16.7, description: 'Normal - general structural' },
    'N32': { fck: 32, fcd: 21.3, description: 'Normal - beams, columns' },
    'N40': { fck: 40, fcd: 26.7, description: 'High strength - prestressed' },
};

export const STEEL_GRADES = {
    'G300': { fy: 300, description: 'General structural steel' },
    'G350': { fy: 350, description: 'Higher strength structural' },
    'G450': { fy: 450, description: 'High strength' },
    'D500N': { fy: 500, description: 'Reinforcement bar' },
};

export const TIMBER_GRADES = {
    'F5': { fb: 5, fv: 0.7, E: 6100, description: 'Softwood - light framing' },
    'F7': { fb: 7, fv: 0.9, E: 7900, description: 'Softwood - general framing' },
    'F11': { fb: 11, fv: 1.2, E: 10500, description: 'Hardwood - structural' },
    'F14': { fb: 14, fv: 1.5, E: 12500, description: 'Hardwood - heavy structural' },
    'F17': { fb: 17, fv: 1.8, E: 14000, description: 'Hardwood - kwila grade' },
};

// Soil bearing capacities (kPa) - PNG conditions
export const SOIL_BEARING = {
    'rock': { allowable: 1000, description: 'Solid rock' },
    'weathered-rock': { allowable: 500, description: 'Weathered rock' },
    'dense-gravel': { allowable: 300, description: 'Dense gravel/sand' },
    'stiff-clay': { allowable: 150, description: 'Stiff clay' },
    'medium-clay': { allowable: 100, description: 'Medium clay (typical PNG)' },
    'soft-clay': { allowable: 50, description: 'Soft clay' },
    'coral': { allowable: 200, description: 'Coral (coastal PNG)' },
    'fill': { allowable: 75, description: 'Compacted fill' },
};

// ============================================
// Load Calculations
// ============================================

// Dead loads (kN/m²)
export const DEAD_LOADS = {
    'concrete-slab-100': 2.4,    // 100mm concrete slab
    'concrete-slab-150': 3.6,    // 150mm concrete slab
    'timber-floor': 0.4,          // Timber floor with joists
    'steel-sheeting': 0.15,       // Steel roof sheeting
    'tile-roof': 0.6,             // Concrete tile roof
    'ceiling': 0.25,              // Plasterboard ceiling
    'services': 0.1,              // Electrical, plumbing
};

// Live loads (kN/m²) per AS 1170.1
export const LIVE_LOADS = {
    'residential': 1.5,
    'office': 3.0,
    'retail': 4.0,
    'assembly': 5.0,
    'storage-light': 2.5,
    'storage-heavy': 5.0,
    'roof-accessible': 1.5,
    'roof-non-accessible': 0.25,
};

/**
 * Calculate total gravity load
 */
export function calculateGravityLoad(params) {
    const {
        deadLoad = 3.0,      // kN/m²
        liveLoad = 1.5,      // kN/m²
        tributaryArea = 20,  // m²
    } = params;

    // Load factors (AS 1170.0)
    const gammaG = 1.35;  // Dead load factor
    const gammaQ = 1.5;   // Live load factor

    const serviceLoad = (deadLoad + liveLoad) * tributaryArea;
    const ultimateLoad = (gammaG * deadLoad + gammaQ * liveLoad) * tributaryArea;

    return {
        serviceLoad,      // kN
        ultimateLoad,     // kN
        deadLoad: deadLoad * tributaryArea,
        liveLoad: liveLoad * tributaryArea,
    };
}

/**
 * Calculate seismic load for structural element
 */
export function calculateSeismicLoad(params) {
    const {
        province = 'Central',
        buildingWeight = 500,  // kN
        buildingHeight = 6,    // m
        importanceFactor = 1.0,
        soilClass = 'Ce',
    } = params;

    // Get seismic zone factor
    const provinceKey = province.toLowerCase();
    const seismicData = SEISMIC_Z[provinceKey] || { z: 0.35 };
    const Z = seismicData.z;

    // Site factors based on soil class
    const siteFactors = {
        'Ae': 0.8, 'Be': 1.0, 'Ce': 1.25, 'De': 1.5, 'Ee': 1.8
    };
    const S = siteFactors[soilClass] || 1.25;

    // Approximate period (simplified)
    const T = 0.05 * buildingHeight;

    // Spectral coefficient (simplified AS 1170.4)
    const Ch = T < 0.4 ? 2.5 : (T < 1.5 ? 2.5 * (0.4 / T) ** 0.75 : 1.5);

    // Seismic coefficient
    const kp = Z * S * Ch * importanceFactor;

    // Base shear
    const V = kp * buildingWeight;

    return {
        Z,
        S,
        T,
        Ch,
        kp,
        baseShear: V,
        classification: seismicData.classification || 'Moderate',
    };
}

// ============================================
// Beam Sizing
// ============================================

/**
 * Size a reinforced concrete beam
 */
export function sizeConcreteBeam(params) {
    const {
        span = 4,              // m
        ultimateLoad = 50,     // kN/m (UDL)
        concreteGrade = 'N25',
        steelGrade = 'D500N',
        exposureClass = 'B1',  // PNG coastal
    } = params;

    const fc = CONCRETE_GRADES[concreteGrade]?.fck || 25;
    const fy = STEEL_GRADES[steelGrade]?.fy || 500;

    // Ultimate moment
    const Mu = (ultimateLoad * span ** 2) / 8;  // kN.m

    // Preliminary sizing (span/depth ratio)
    const depthRatio = 12;  // Simple span
    const d = Math.max(span * 1000 / depthRatio, 300);  // mm
    const b = Math.max(d / 2, 200);  // mm

    // Reinforcement calculation (simplified)
    const Mu_Nm = Mu * 1e6;  // N.mm
    const k = Mu_Nm / (b * d ** 2);
    const la = 0.9 * d;  // Lever arm approximation
    const As = Mu_Nm / (0.87 * fy * la);  // mm²

    // Minimum cover for PNG conditions
    const covers = { 'A1': 20, 'A2': 25, 'B1': 40, 'B2': 50, 'C': 65 };
    const cover = covers[exposureClass] || 40;

    // Select practical bar sizes
    const barOptions = [
        { dia: 12, area: 113 },
        { dia: 16, area: 201 },
        { dia: 20, area: 314 },
        { dia: 25, area: 491 },
        { dia: 32, area: 804 },
    ];

    let selectedBars = '4N16';  // Default
    for (const bar of barOptions) {
        const numBars = Math.ceil(As / bar.area);
        if (numBars >= 2 && numBars <= 8) {
            selectedBars = `${numBars}N${bar.dia}`;
            break;
        }
    }

    // Links/stirrups
    const linkSpacing = Math.min(d / 2, 300);

    return {
        success: true,
        dimensions: {
            width: Math.ceil(b / 25) * 25,  // Round to 25mm
            depth: Math.ceil(d / 25) * 25,
        },
        reinforcement: {
            bottom: selectedBars,
            top: '2N12',  // Nominal top steel
            links: `R10@${Math.ceil(linkSpacing / 25) * 25}`,
        },
        cover,
        ultimateMoment: Mu.toFixed(1),
        steelArea: Math.ceil(As),
        concreteGrade,
        steelGrade,
        report: `Beam ${Math.ceil(b / 25) * 25}×${Math.ceil(d / 25) * 25}mm, ${selectedBars} bottom, R10 links @ ${Math.ceil(linkSpacing / 25) * 25}mm`,
    };
}

/**
 * Size a timber beam
 */
export function sizeTimberBeam(params) {
    const {
        span = 3,              // m
        ultimateLoad = 5,      // kN/m (UDL)
        timberGrade = 'F11',
        loadDuration = 'permanent',
    } = params;

    const timber = TIMBER_GRADES[timberGrade];
    if (!timber) {
        return { success: false, error: `Unknown timber grade: ${timberGrade}` };
    }

    // Duration factors
    const k1 = { 'short': 1.0, 'medium': 0.94, 'long': 0.80, 'permanent': 0.57 };
    const durationFactor = k1[loadDuration] || 0.80;

    // Ultimate moment
    const Mu = (ultimateLoad * span ** 2) / 8;  // kN.m

    // Design bending stress
    const fbd = timber.fb * durationFactor;  // MPa

    // Required section modulus
    const Zreq = (Mu * 1e6) / (fbd * 1e3);  // mm³

    // Standard timber sizes (PNG availability)
    const standardSizes = [
        { b: 45, d: 90 },
        { b: 45, d: 140 },
        { b: 45, d: 190 },
        { b: 45, d: 240 },
        { b: 90, d: 190 },
        { b: 90, d: 240 },
        { b: 90, d: 290 },
        { b: 140, d: 240 },
        { b: 140, d: 290 },
    ];

    let selected = null;
    for (const size of standardSizes) {
        const Z = (size.b * size.d ** 2) / 6;
        if (Z >= Zreq) {
            selected = size;
            break;
        }
    }

    if (!selected) {
        selected = { b: 140, d: 290 };  // Largest standard
    }

    // Check deflection
    const serviceLoad = ultimateLoad / 1.5;  // Approximate
    const I = (selected.b * selected.d ** 3) / 12;  // mm⁴
    const E = timber.E;  // MPa
    const delta = (5 * serviceLoad * span ** 4 * 1e12) / (384 * E * I);  // mm
    const deltaLimit = span * 1000 / 300;  // Span/300

    return {
        success: true,
        dimensions: selected,
        timberGrade,
        ultimateMoment: Mu.toFixed(2),
        requiredZ: Math.ceil(Zreq),
        providedZ: Math.ceil((selected.b * selected.d ** 2) / 6),
        deflection: {
            actual: delta.toFixed(1),
            limit: deltaLimit.toFixed(1),
            ok: delta <= deltaLimit,
        },
        report: `${selected.b}×${selected.d}mm ${timberGrade} beam`,
    };
}

// ============================================
// Column Sizing
// ============================================

/**
 * Size a reinforced concrete column
 */
export function sizeConcreteColumn(params) {
    const {
        axialLoad = 500,       // kN (ultimate)
        height = 3,            // m
        concreteGrade = 'N32',
        steelGrade = 'D500N',
        restraint = 'braced',  // 'braced' or 'unbraced'
    } = params;

    const fc = CONCRETE_GRADES[concreteGrade]?.fck || 32;
    const fy = STEEL_GRADES[steelGrade]?.fy || 500;

    // Effective length factor
    const k = restraint === 'braced' ? 0.85 : 1.2;
    const Le = k * height * 1000;  // mm

    // Preliminary column size (assume 2% reinforcement)
    const rho = 0.02;
    const Ac = axialLoad * 1000 / (0.6 * fc + rho * fy);  // mm²
    const size = Math.ceil(Math.sqrt(Ac) / 25) * 25;  // Round to 25mm
    const minSize = Math.max(size, 200);  // Minimum 200mm

    // Slenderness check
    const slenderness = Le / minSize;
    const isSlender = slenderness > 22;

    // Reinforcement
    const Ag = minSize * minSize;
    const As = Math.max(0.01 * Ag, 4 * 113);  // Min 1% or 4N12
    const numBars = Math.ceil(As / 314);  // N20 bars
    const barConfig = `${Math.max(numBars, 4)}N20`;

    // Links
    const linkSpacing = Math.min(minSize, 300, 12 * 20);

    return {
        success: true,
        dimensions: {
            width: minSize,
            depth: minSize,
        },
        reinforcement: {
            main: barConfig,
            links: `R10@${Math.ceil(linkSpacing / 25) * 25}`,
        },
        axialLoad,
        slenderness: slenderness.toFixed(1),
        isSlender,
        concreteGrade,
        steelGrade,
        report: `Column ${minSize}×${minSize}mm, ${barConfig}, R10 links @ ${Math.ceil(linkSpacing / 25) * 25}mm`,
    };
}

// ============================================
// Footing Sizing
// ============================================

/**
 * Size a pad footing for a column
 */
export function sizePadFooting(params) {
    const {
        columnLoad = 500,      // kN (service)
        columnSize = 300,      // mm
        soilType = 'medium-clay',
        concreteGrade = 'N25',
        steelGrade = 'D500N',
        groundwaterDepth = 2,  // m (for PNG conditions)
    } = params;

    const soil = SOIL_BEARING[soilType];
    if (!soil) {
        return { success: false, error: `Unknown soil type: ${soilType}` };
    }

    const fc = CONCRETE_GRADES[concreteGrade]?.fck || 25;

    // Reduce bearing for groundwater (PNG coastal)
    let allowableBearing = soil.allowable;
    if (groundwaterDepth < 1) {
        allowableBearing *= 0.5;
    } else if (groundwaterDepth < 2) {
        allowableBearing *= 0.75;
    }

    // Required area
    const Areq = columnLoad / allowableBearing * 1000;  // mm²
    const sideLength = Math.ceil(Math.sqrt(Areq) / 50) * 50;  // Round to 50mm
    const minSide = Math.max(sideLength, columnSize + 200, 600);

    // Footing depth (punching shear)
    const depth = Math.max(minSide / 4, 300);

    // Ultimate soil pressure
    const ultimateLoad = columnLoad * 1.5;  // Approximate
    const ultimatePressure = ultimateLoad / (minSide * minSide / 1e6);  // kN/m²

    // Reinforcement (simplified)
    const Mu = ultimatePressure * (minSide / 2 - columnSize / 2) ** 2 / 2 / 1e6;  // kN.m/m
    const As = Math.max(Mu * 1e6 / (0.87 * 500 * 0.9 * depth), 0.0015 * 1000 * depth);
    const barSpacing = Math.min(300, 113 * 1000 / As);  // N12 bars
    const reinforcement = `N12@${Math.ceil(barSpacing / 25) * 25} both ways`;

    // Excavation warning for PNG conditions
    const warnings = [];
    if (groundwaterDepth < 1.5) {
        warnings.push('Dewatering may be required during construction');
    }
    if (soilType === 'soft-clay') {
        warnings.push('Consider pile foundation for soft clay');
    }

    return {
        success: true,
        dimensions: {
            length: minSide,
            width: minSide,
            depth: Math.ceil(depth / 25) * 25,
        },
        reinforcement,
        cover: 75,  // In-ground cover for PNG
        soilType,
        allowableBearing: allowableBearing.toFixed(0),
        ultimatePressure: ultimatePressure.toFixed(0),
        concreteGrade,
        warnings,
        report: `Pad footing ${minSide}×${minSide}×${Math.ceil(depth / 25) * 25}mm, ${reinforcement}`,
    };
}

/**
 * Size a strip footing for a wall
 */
export function sizeStripFooting(params) {
    const {
        wallLoad = 30,         // kN/m (service)
        wallThickness = 200,   // mm
        soilType = 'medium-clay',
        concreteGrade = 'N20',
    } = params;

    const soil = SOIL_BEARING[soilType];
    if (!soil) {
        return { success: false, error: `Unknown soil type: ${soilType}` };
    }

    const allowableBearing = soil.allowable;

    // Required width
    const Wreq = wallLoad / allowableBearing * 1000;  // mm
    const width = Math.max(Math.ceil(Wreq / 50) * 50, wallThickness + 150, 300);

    // Depth
    const depth = Math.max(width / 3, 200);

    // Reinforcement
    const reinforcement = `N12@300 bottom, N12@300 transverse`;

    return {
        success: true,
        dimensions: {
            width,
            depth: Math.ceil(depth / 25) * 25,
        },
        reinforcement,
        cover: 75,
        soilType,
        allowableBearing: allowableBearing.toFixed(0),
        concreteGrade,
        report: `Strip footing ${width}×${Math.ceil(depth / 25) * 25}mm, N12@300 BW`,
    };
}

// ============================================
// Complete Structural Design Workflow
// ============================================

/**
 * Design a complete structural frame
 */
export function designStructuralFrame(params) {
    const {
        province = 'Central',
        buildingType = 'residential',
        numStoreys = 1,
        floorArea = 100,         // m² per floor
        spanX = 4,               // m
        spanY = 4,               // m
        soilType = 'medium-clay',
        structuralSystem = 'concrete-frame',
        concreteGrade = 'N25',
    } = params;

    // Calculate loads
    const deadLoad = DEAD_LOADS['concrete-slab-150'] + DEAD_LOADS['ceiling'];
    const liveLoad = LIVE_LOADS[buildingType] || 1.5;
    const tributaryArea = spanX * spanY;

    const gravityLoad = calculateGravityLoad({
        deadLoad,
        liveLoad,
        tributaryArea,
    });

    const buildingWeight = (deadLoad + liveLoad * 0.3) * floorArea * numStoreys;
    const seismicLoad = calculateSeismicLoad({
        province,
        buildingWeight,
        buildingHeight: numStoreys * 3,
        soilClass: 'Ce',
    });

    // Size beam
    const beamLoad = gravityLoad.ultimateLoad / spanX;  // kN/m
    const beam = sizeConcreteBeam({
        span: spanX,
        ultimateLoad: beamLoad,
        concreteGrade,
    });

    // Size column
    const columnLoad = gravityLoad.ultimateLoad * (1 + seismicLoad.kp * 0.3);
    const column = sizeConcreteColumn({
        axialLoad: columnLoad,
        height: 3,
        concreteGrade: 'N32',
    });

    // Size footing
    const footing = sizePadFooting({
        columnLoad: gravityLoad.serviceLoad * 1.1,
        columnSize: column.dimensions.width,
        soilType,
        concreteGrade,
    });

    return {
        success: true,
        summary: {
            province,
            buildingType,
            numStoreys,
            floorArea,
            structuralSystem,
        },
        loads: {
            dead: deadLoad.toFixed(2),
            live: liveLoad.toFixed(2),
            seismicKp: seismicLoad.kp.toFixed(3),
            seismicClassification: seismicLoad.classification,
        },
        elements: {
            beam: beam.report,
            column: column.report,
            footing: footing.report,
        },
        details: {
            beam,
            column,
            footing,
        },
        warnings: [
            ...(footing.warnings || []),
            ...(seismicLoad.classification === 'Severe' ? ['Specialist seismic design required for severe zone'] : []),
        ],
        report: `
STRUCTURAL DESIGN SUMMARY
========================
Location: ${province}
Building: ${numStoreys}-storey ${buildingType}
Seismic: ${seismicLoad.classification} (kp=${seismicLoad.kp.toFixed(3)})

TYPICAL BEAM: ${beam.report}
TYPICAL COLUMN: ${column.report}
TYPICAL FOOTING: ${footing.report}

Concrete: ${concreteGrade}
Steel: D500N reinforcement
Cover: 40mm (beams/columns), 75mm (footings)
    `.trim(),
    };
}
