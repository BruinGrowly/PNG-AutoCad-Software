/**
 * Cost Estimation Module
 * Material pricing and quantity takeoff for PNG construction
 * 
 * Prices in Papua New Guinea Kina (PGK)
 * Data sources: PNG construction industry estimates (2024-2025)
 * Note: Prices vary significantly by location and supplier
 */

// ============================================
// Material Unit Prices (PGK)
// ============================================

// Prices vary by province - higher in remote areas
export const LOCATION_FACTORS = {
    'port-moresby': 1.0,      // Base prices (NCD)
    'lae': 1.05,              // Slightly higher
    'madang': 1.15,           // Moderate transport cost
    'goroka': 1.25,           // Highland access
    'mt-hagen': 1.30,         // Remote highland
    'wewak': 1.35,            // Sea freight only
    'rabaul': 1.20,           // Island, good port
    'buka': 1.40,             // Bougainville
    'remote': 1.50,           // Very remote areas
};

// Concrete prices per m³
export const CONCRETE_PRICES = {
    'N20': { price: 850, unit: 'm³', description: 'Normal grade 20 MPa' },
    'N25': { price: 950, unit: 'm³', description: 'Normal grade 25 MPa' },
    'N32': { price: 1100, unit: 'm³', description: 'Normal grade 32 MPa' },
    'N40': { price: 1350, unit: 'm³', description: 'High strength 40 MPa' },
};

// Steel reinforcement prices per tonne
export const STEEL_PRICES = {
    'D500N-10': { price: 4500, unit: 'tonne', description: '10mm deformed bar' },
    'D500N-12': { price: 4300, unit: 'tonne', description: '12mm deformed bar' },
    'D500N-16': { price: 4200, unit: 'tonne', description: '16mm deformed bar' },
    'D500N-20': { price: 4100, unit: 'tonne', description: '20mm deformed bar' },
    'D500N-25': { price: 4000, unit: 'tonne', description: '25mm deformed bar' },
    'D500N-32': { price: 4000, unit: 'tonne', description: '32mm deformed bar' },
    'R10': { price: 4800, unit: 'tonne', description: '10mm round bar (links)' },
    'mesh-SL72': { price: 85, unit: 'm²', description: 'Reinforcing mesh SL72' },
    'mesh-SL82': { price: 95, unit: 'm²', description: 'Reinforcing mesh SL82' },
};

// Structural steel prices per tonne
export const STRUCTURAL_STEEL_PRICES = {
    'UB': { price: 5500, unit: 'tonne', description: 'Universal beam' },
    'UC': { price: 5500, unit: 'tonne', description: 'Universal column' },
    'PFC': { price: 5800, unit: 'tonne', description: 'Parallel flange channel' },
    'RHS': { price: 6200, unit: 'tonne', description: 'Rectangular hollow section' },
    'SHS': { price: 6200, unit: 'tonne', description: 'Square hollow section' },
    'purlins': { price: 3500, unit: 'tonne', description: 'C/Z purlins' },
};

// Timber prices per m³
export const TIMBER_PRICES = {
    'kwila': { price: 3500, unit: 'm³', description: 'Kwila (merbau) structural' },
    'taun': { price: 2800, unit: 'm³', description: 'Taun structural' },
    'rosewood': { price: 2200, unit: 'm³', description: 'PNG rosewood' },
    'pine-treated': { price: 1800, unit: 'm³', description: 'Treated pine' },
    'pine-untreated': { price: 1400, unit: 'm³', description: 'Untreated pine' },
    'formwork-ply': { price: 120, unit: 'm²', description: '18mm formwork plywood' },
};

// Roofing materials
export const ROOFING_PRICES = {
    'zincalume-0.42': { price: 45, unit: 'm²', description: 'Zincalume 0.42mm' },
    'zincalume-0.55': { price: 55, unit: 'm²', description: 'Zincalume 0.55mm' },
    'colorbond-0.42': { price: 65, unit: 'm²', description: 'Colorbond 0.42mm' },
    'colorbond-0.55': { price: 75, unit: 'm²', description: 'Colorbond 0.55mm' },
    'roofing-screws': { price: 0.80, unit: 'each', description: 'Tek screws + washer' },
    'ridge-cap': { price: 35, unit: 'lm', description: 'Ridge capping' },
    'gutter': { price: 40, unit: 'lm', description: 'Quad gutter' },
    'downpipe': { price: 25, unit: 'lm', description: '100mm downpipe' },
};

// Masonry
export const MASONRY_PRICES = {
    'block-150': { price: 8.50, unit: 'each', description: '150mm concrete block' },
    'block-200': { price: 10.50, unit: 'each', description: '200mm concrete block' },
    'brick-standard': { price: 1.20, unit: 'each', description: 'Standard clay brick' },
    'mortar-bag': { price: 45, unit: 'bag', description: '40kg mortar premix' },
    'cement-bag': { price: 65, unit: 'bag', description: '50kg cement' },
    'sand-m3': { price: 180, unit: 'm³', description: 'Washed sand' },
    'aggregate-m3': { price: 220, unit: 'm³', description: '20mm aggregate' },
};

// Labour rates per day
export const LABOUR_RATES = {
    'labourer': { price: 80, unit: 'day', description: 'Unskilled labourer' },
    'tradesman': { price: 150, unit: 'day', description: 'Skilled tradesman' },
    'carpenter': { price: 180, unit: 'day', description: 'Carpenter' },
    'steelfixer': { price: 180, unit: 'day', description: 'Steel fixer' },
    'concretor': { price: 180, unit: 'day', description: 'Concretor' },
    'electrician': { price: 200, unit: 'day', description: 'Electrician' },
    'plumber': { price: 200, unit: 'day', description: 'Plumber' },
    'supervisor': { price: 250, unit: 'day', description: 'Site supervisor' },
    'engineer': { price: 400, unit: 'day', description: 'Site engineer' },
};

// ============================================
// Quantity Takeoff Calculations
// ============================================

/**
 * Calculate concrete volume
 */
export function calculateConcreteVolume(params) {
    const {
        length,     // mm
        width,      // mm
        depth,      // mm
        quantity = 1,
    } = params;

    const volumeM3 = (length / 1000) * (width / 1000) * (depth / 1000) * quantity;
    const wastePercent = 0.05;  // 5% waste
    const totalM3 = volumeM3 * (1 + wastePercent);

    return {
        netVolume: volumeM3,
        wasteAllowance: volumeM3 * wastePercent,
        totalVolume: totalM3,
        unit: 'm³',
    };
}

/**
 * Calculate reinforcement weight from bar specification
 */
export function calculateReinforcementWeight(params) {
    const {
        barSpec,     // e.g., "4N16" or "N12@200"
        length = 0,  // mm (total bar length or member length)
        width = 0,   // mm (for mesh-like spec)
    } = params;

    // Bar weights per meter (kg/m)
    const barWeights = {
        10: 0.617,
        12: 0.888,
        16: 1.58,
        20: 2.47,
        25: 3.85,
        32: 6.31,
    };

    // Parse bar specification
    let totalWeight = 0;
    let description = '';

    if (barSpec.includes('@')) {
        // Spacing format: N12@200
        const match = barSpec.match(/[NR](\d+)@(\d+)/);
        if (match) {
            const diameter = parseInt(match[1]);
            const spacing = parseInt(match[2]);
            const numBars = Math.ceil((length / spacing) + 1);
            const barLength = width > 0 ? width / 1000 : length / 1000;
            totalWeight = numBars * barLength * (barWeights[diameter] || 0);
            description = `${numBars} × ${diameter}mm bars @ ${spacing}mm spacing`;
        }
    } else {
        // Count format: 4N16
        const match = barSpec.match(/(\d+)N(\d+)/);
        if (match) {
            const numBars = parseInt(match[1]);
            const diameter = parseInt(match[2]);
            const barLength = length / 1000;
            totalWeight = numBars * barLength * (barWeights[diameter] || 0);
            description = `${numBars} × ${diameter}mm bars × ${barLength.toFixed(2)}m`;
        }
    }

    return {
        weight: totalWeight,
        unit: 'kg',
        description,
        lapsAllowance: totalWeight * 0.10,  // 10% for laps
        totalWeight: totalWeight * 1.10,
    };
}

/**
 * Calculate formwork area
 */
export function calculateFormworkArea(params) {
    const {
        memberType,   // 'beam', 'column', 'slab', 'footing'
        length,       // mm
        width,        // mm
        depth,        // mm
        quantity = 1,
    } = params;

    let area = 0;

    switch (memberType) {
        case 'beam':
            // Two sides + soffit
            area = (2 * (depth / 1000) + (width / 1000)) * (length / 1000);
            break;
        case 'column':
            // Four sides
            area = 4 * (width / 1000) * (length / 1000);
            break;
        case 'slab':
            // Soffit only
            area = (length / 1000) * (width / 1000);
            break;
        case 'footing':
            // Four sides (assume depth is height of formwork)
            area = 2 * ((length / 1000) + (width / 1000)) * (depth / 1000);
            break;
    }

    const uses = 4;  // Average reuses
    const effectiveArea = (area * quantity) / uses;

    return {
        grossArea: area * quantity,
        effectiveArea,
        unit: 'm²',
        reuses: uses,
    };
}

// ============================================
// Cost Calculation Functions
// ============================================

/**
 * Calculate concrete cost
 */
export function calculateConcreteCost(params) {
    const {
        volume,           // m³
        grade = 'N25',
        location = 'port-moresby',
        includeLabour = true,
        includePump = false,
    } = params;

    const basePrice = CONCRETE_PRICES[grade]?.price || 950;
    const locationFactor = LOCATION_FACTORS[location] || 1.0;

    const materialCost = volume * basePrice * locationFactor;

    // Labour: 0.5 days per m³
    const labourCost = includeLabour ? volume * 0.5 * LABOUR_RATES.concretor.price : 0;

    // Pump: K350 flat fee + K45/m³
    const pumpCost = includePump ? 350 + volume * 45 : 0;

    return {
        volume,
        grade,
        location,
        materialCost,
        labourCost,
        pumpCost,
        totalCost: materialCost + labourCost + pumpCost,
        unit: 'PGK',
        breakdown: {
            concrete: materialCost,
            labour: labourCost,
            pumping: pumpCost,
        },
    };
}

/**
 * Calculate reinforcement cost
 */
export function calculateReinforcementCost(params) {
    const {
        weight,           // kg
        barSize = 16,     // mm
        location = 'port-moresby',
        includeLabour = true,
    } = params;

    const barKey = `D500N-${barSize}`;
    const pricePerTonne = STEEL_PRICES[barKey]?.price || 4200;
    const locationFactor = LOCATION_FACTORS[location] || 1.0;

    const materialCost = (weight / 1000) * pricePerTonne * locationFactor;

    // Labour: K120 per 100kg
    const labourCost = includeLabour ? (weight / 100) * 120 : 0;

    return {
        weight,
        barSize,
        location,
        materialCost,
        labourCost,
        totalCost: materialCost + labourCost,
        unit: 'PGK',
    };
}

/**
 * Calculate formwork cost
 */
export function calculateFormworkCost(params) {
    const {
        area,             // m²
        type = 'standard', // 'standard' or 'fair-face'
        location = 'port-moresby',
        includeLabour = true,
    } = params;

    const plyPrice = TIMBER_PRICES['formwork-ply'].price;
    const locationFactor = LOCATION_FACTORS[location] || 1.0;

    // Add timber framing: K60/m²
    const framingPrice = 60;
    const materialCost = area * (plyPrice + framingPrice) * locationFactor;

    // Fair-face premium
    const qualityFactor = type === 'fair-face' ? 1.3 : 1.0;

    // Labour: K80/m² for erection and strike
    const labourCost = includeLabour ? area * 80 : 0;

    return {
        area,
        type,
        materialCost: materialCost * qualityFactor,
        labourCost,
        totalCost: (materialCost * qualityFactor) + labourCost,
        unit: 'PGK',
    };
}

// ============================================
// Complete Structural Element Costing
// ============================================

/**
 * Cost a complete concrete beam
 */
export function costConcreteBeam(params) {
    const {
        length,           // mm
        width,            // mm
        depth,            // mm
        reinforcementKg,  // kg
        concreteGrade = 'N25',
        location = 'port-moresby',
        quantity = 1,
    } = params;

    // Concrete
    const concreteVol = calculateConcreteVolume({ length, width, depth, quantity });
    const concreteCost = calculateConcreteCost({
        volume: concreteVol.totalVolume,
        grade: concreteGrade,
        location,
        includePump: true,
    });

    // Reinforcement
    const steelCost = calculateReinforcementCost({
        weight: reinforcementKg * quantity * 1.1,  // 10% laps
        location,
    });

    // Formwork
    const formworkArea = calculateFormworkArea({
        memberType: 'beam',
        length,
        width,
        depth,
        quantity,
    });
    const formworkCost = calculateFormworkCost({
        area: formworkArea.effectiveArea,
        location,
    });

    const totalCost = concreteCost.totalCost + steelCost.totalCost + formworkCost.totalCost;

    return {
        success: true,
        dimensions: { length, width, depth },
        quantity,
        concrete: {
            volume: concreteVol.totalVolume.toFixed(2),
            cost: concreteCost.totalCost,
        },
        steel: {
            weight: (reinforcementKg * quantity * 1.1).toFixed(1),
            cost: steelCost.totalCost,
        },
        formwork: {
            area: formworkArea.effectiveArea.toFixed(1),
            cost: formworkCost.totalCost,
        },
        totalCost,
        costPerUnit: totalCost / quantity,
        unit: 'PGK',
        report: `Beam ${width}×${depth}mm × ${length}mm: PGK ${totalCost.toFixed(2)} (${quantity} nos)`,
    };
}

/**
 * Cost a complete concrete column
 */
export function costConcreteColumn(params) {
    const {
        width,            // mm
        height,           // mm
        reinforcementKg,
        concreteGrade = 'N32',
        location = 'port-moresby',
        quantity = 1,
    } = params;

    // Concrete
    const concreteVol = calculateConcreteVolume({
        length: width,
        width: width,
        depth: height,
        quantity,
    });
    const concreteCost = calculateConcreteCost({
        volume: concreteVol.totalVolume,
        grade: concreteGrade,
        location,
    });

    // Reinforcement
    const steelCost = calculateReinforcementCost({
        weight: reinforcementKg * quantity * 1.1,
        location,
    });

    // Formwork
    const formworkArea = calculateFormworkArea({
        memberType: 'column',
        length: height,
        width: width,
        depth: width,
        quantity,
    });
    const formworkCost = calculateFormworkCost({
        area: formworkArea.effectiveArea,
        location,
    });

    const totalCost = concreteCost.totalCost + steelCost.totalCost + formworkCost.totalCost;

    return {
        success: true,
        dimensions: { width, height },
        quantity,
        concrete: {
            volume: concreteVol.totalVolume.toFixed(2),
            cost: concreteCost.totalCost,
        },
        steel: {
            weight: (reinforcementKg * quantity * 1.1).toFixed(1),
            cost: steelCost.totalCost,
        },
        formwork: {
            area: formworkArea.effectiveArea.toFixed(1),
            cost: formworkCost.totalCost,
        },
        totalCost,
        costPerUnit: totalCost / quantity,
        unit: 'PGK',
        report: `Column ${width}×${width}mm × ${height}mm: PGK ${totalCost.toFixed(2)} (${quantity} nos)`,
    };
}

/**
 * Cost a complete footing
 */
export function costFooting(params) {
    const {
        length,           // mm
        width,            // mm
        depth,            // mm
        reinforcementKg,
        concreteGrade = 'N25',
        location = 'port-moresby',
        quantity = 1,
        includeExcavation = true,
    } = params;

    // Excavation (if included)
    let excavationCost = 0;
    if (includeExcavation) {
        const excVolume = (length / 1000) * (width / 1000) * ((depth + 100) / 1000) * quantity;
        // K50/m³ for excavation
        excavationCost = excVolume * 50;
    }

    // Concrete
    const concreteVol = calculateConcreteVolume({ length, width, depth, quantity });
    const concreteCost = calculateConcreteCost({
        volume: concreteVol.totalVolume,
        grade: concreteGrade,
        location,
    });

    // Reinforcement
    const steelCost = calculateReinforcementCost({
        weight: reinforcementKg * quantity,
        location,
    });

    // Formwork (sides only)
    const formworkArea = calculateFormworkArea({
        memberType: 'footing',
        length,
        width,
        depth,
        quantity,
    });
    const formworkCost = calculateFormworkCost({
        area: formworkArea.effectiveArea,
        location,
    });

    const totalCost = excavationCost + concreteCost.totalCost + steelCost.totalCost + formworkCost.totalCost;

    return {
        success: true,
        dimensions: { length, width, depth },
        quantity,
        excavation: {
            cost: excavationCost,
        },
        concrete: {
            volume: concreteVol.totalVolume.toFixed(2),
            cost: concreteCost.totalCost,
        },
        steel: {
            weight: (reinforcementKg * quantity).toFixed(1),
            cost: steelCost.totalCost,
        },
        formwork: {
            area: formworkArea.effectiveArea.toFixed(1),
            cost: formworkCost.totalCost,
        },
        totalCost,
        costPerUnit: totalCost / quantity,
        unit: 'PGK',
        report: `Footing ${length}×${width}×${depth}mm: PGK ${totalCost.toFixed(2)} (${quantity} nos)`,
    };
}

// ============================================
// Complete Building Cost Estimate
// ============================================

/**
 * Estimate cost for a simple building
 */
export function estimateBuildingCost(params) {
    const {
        floorArea,        // m²
        numStoreys = 1,
        buildingType = 'residential',
        quality = 'medium',  // 'basic', 'medium', 'high'
        location = 'port-moresby',
    } = params;

    // Base rates per m² (PGK)
    const baseRates = {
        residential: { basic: 3500, medium: 5500, high: 8500 },
        commercial: { basic: 4500, medium: 6500, high: 10000 },
        industrial: { basic: 2500, medium: 3500, high: 5000 },
        warehouse: { basic: 1800, medium: 2500, high: 3500 },
    };

    const baseRate = baseRates[buildingType]?.[quality] || 5500;
    const locationFactor = LOCATION_FACTORS[location] || 1.0;

    // Height factor (taller = more expensive per m²)
    const heightFactor = 1 + (numStoreys - 1) * 0.12;

    const totalArea = floorArea * numStoreys;
    const ratePerM2 = baseRate * locationFactor * heightFactor;
    const constructionCost = totalArea * ratePerM2;

    // Add contingency
    const contingency = constructionCost * 0.10;

    // Professional fees (design, supervision)
    const professionalFees = constructionCost * 0.08;

    const totalCost = constructionCost + contingency + professionalFees;

    return {
        success: true,
        summary: {
            floorArea,
            numStoreys,
            totalArea,
            buildingType,
            quality,
            location,
        },
        rates: {
            baseRate,
            adjustedRate: ratePerM2.toFixed(2),
            locationFactor,
            heightFactor: heightFactor.toFixed(2),
        },
        costs: {
            construction: constructionCost,
            contingency,
            professionalFees,
            total: totalCost,
        },
        unit: 'PGK',
        report: `
COST ESTIMATE SUMMARY
====================
Building: ${numStoreys}-storey ${quality} ${buildingType}
Location: ${location}
Floor Area: ${totalArea} m² (${floorArea} m² × ${numStoreys} floors)

Rate: PGK ${ratePerM2.toFixed(2)}/m²

BREAKDOWN:
Construction:       PGK ${constructionCost.toLocaleString()}
Contingency (10%):  PGK ${contingency.toLocaleString()}
Professional (8%):  PGK ${professionalFees.toLocaleString()}
──────────────────────────────
TOTAL:              PGK ${totalCost.toLocaleString()}

Note: Estimate only. Actual costs may vary.
    `.trim(),
    };
}
