/**
 * Design Validation Checker
 * Validates designs against PNG Building Standards and best practices
 * 
 * Provides automated compliance checking with:
 * - Warnings (advisory - consider improving)
 * - Errors (required - must fix before submission)
 * - Suggestions (optional - for better design)
 */

import { SEISMIC_Z } from './buildingWorkflow.js';

// ============================================
// Validation Result Types
// ============================================

export const SEVERITY = {
    ERROR: 'error',       // Must fix - non-compliant
    WARNING: 'warning',   // Should fix - potential issue
    INFO: 'info',         // Suggestion - improvement opportunity
    PASS: 'pass',         // Check passed
};

// ============================================
// Structural Validation Rules
// ============================================

/**
 * Validate beam design
 */
export function validateBeam(params) {
    const {
        span,           // mm
        width,          // mm
        depth,          // mm
        concreteGrade = 'N25',
        exposureClass = 'B1',
        seismicZone = 'moderate',
    } = params;

    const results = [];

    // Check span/depth ratio
    const spanDepthRatio = span / depth;
    if (spanDepthRatio > 18) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'BEAM-001',
            message: `Span/depth ratio ${spanDepthRatio.toFixed(1)} exceeds limit of 18`,
            suggestion: `Increase beam depth to at least ${Math.ceil(span / 18)}mm`,
        });
    } else if (spanDepthRatio > 15) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'BEAM-002',
            message: `Span/depth ratio ${spanDepthRatio.toFixed(1)} is high (recommend < 15)`,
            suggestion: `Consider increasing depth for better deflection control`,
        });
    } else {
        results.push({
            severity: SEVERITY.PASS,
            code: 'BEAM-001',
            message: `Span/depth ratio ${spanDepthRatio.toFixed(1)} is acceptable`,
        });
    }

    // Check minimum dimensions
    if (width < 200) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'BEAM-003',
            message: `Beam width ${width}mm is below minimum 200mm`,
            suggestion: `Increase width to at least 200mm for bar placement`,
        });
    }

    if (depth < 300) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'BEAM-004',
            message: `Beam depth ${depth}mm is below minimum 300mm`,
            suggestion: `Increase depth to at least 300mm`,
        });
    }

    // Check concrete grade for exposure
    const exposureGrades = {
        'A1': 'N20', 'A2': 'N20', 'B1': 'N25', 'B2': 'N32', 'C': 'N40',
    };
    const minGrade = exposureGrades[exposureClass] || 'N25';
    const gradeValue = parseInt(concreteGrade.replace('N', ''));
    const minGradeValue = parseInt(minGrade.replace('N', ''));

    if (gradeValue < minGradeValue) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'BEAM-005',
            message: `Concrete ${concreteGrade} insufficient for exposure ${exposureClass}`,
            suggestion: `Use minimum ${minGrade} for ${exposureClass} exposure`,
        });
    }

    // Seismic zone checks
    if (seismicZone === 'severe' && width < 300) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'BEAM-006',
            message: `Beam width ${width}mm may be narrow for severe seismic zone`,
            suggestion: `Consider 300mm minimum for ductile detailing`,
        });
    }

    return {
        element: 'beam',
        dimensions: { span, width, depth },
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

/**
 * Validate column design
 */
export function validateColumn(params) {
    const {
        width,          // mm
        height,         // mm (storey height)
        axialLoad,      // kN
        concreteGrade = 'N32',
        seismicZone = 'moderate',
    } = params;

    const results = [];

    // Minimum size
    if (width < 200) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'COL-001',
            message: `Column size ${width}mm is below minimum 200mm`,
            suggestion: `Increase to at least 200mm`,
        });
    }

    // Slenderness check
    const effectiveLength = 0.85 * height;  // Braced
    const slenderness = effectiveLength / width;

    if (slenderness > 22) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'COL-002',
            message: `Column slenderness ${slenderness.toFixed(1)} > 22, second-order effects apply`,
            suggestion: `Consider increasing column size or reducing unbraced length`,
        });
    } else {
        results.push({
            severity: SEVERITY.PASS,
            code: 'COL-002',
            message: `Column slenderness ${slenderness.toFixed(1)} is acceptable`,
        });
    }

    // Axial load check (simplified)
    const fc = parseInt(concreteGrade.replace('N', ''));
    const Ag = width * width;
    const maxLoad = 0.4 * fc * Ag / 1000;  // kN (simplified)

    if (axialLoad > maxLoad) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'COL-003',
            message: `Axial load ${axialLoad}kN exceeds capacity ${maxLoad.toFixed(0)}kN`,
            suggestion: `Increase column size or concrete grade`,
        });
    }

    // Seismic zone
    if (seismicZone === 'severe') {
        if (width < 300) {
            results.push({
                severity: SEVERITY.ERROR,
                code: 'COL-004',
                message: `Column ${width}mm is below 300mm minimum for severe seismic zone`,
                suggestion: `Increase to 300mm for ductile frame`,
            });
        }

        const gradeValue = parseInt(concreteGrade.replace('N', ''));
        if (gradeValue < 32) {
            results.push({
                severity: SEVERITY.WARNING,
                code: 'COL-005',
                message: `Concrete ${concreteGrade} may be low for severe seismic zone`,
                suggestion: `Consider N32 or higher for ductile detailing`,
            });
        }
    }

    return {
        element: 'column',
        dimensions: { width, height },
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

/**
 * Validate footing design
 */
export function validateFooting(params) {
    const {
        length,         // mm
        width,          // mm
        depth,          // mm
        columnSize,     // mm
        columnLoad,     // kN
        soilBearing,    // kPa
        groundwaterDepth = 2,  // m
    } = params;

    const results = [];

    // Minimum depth
    if (depth < 300) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'FTG-001',
            message: `Footing depth ${depth}mm is below minimum 300mm`,
            suggestion: `Increase depth to at least 300mm`,
        });
    }

    // Footing size vs column
    const extension = (length - columnSize) / 2;
    if (extension < 150) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'FTG-002',
            message: `Footing extension ${extension}mm is too small`,
            suggestion: `Footing should extend at least 150mm beyond column each side`,
        });
    }

    // Bearing capacity check
    const area = (length / 1000) * (width / 1000);  // m²
    const appliedPressure = columnLoad / area;  // kPa

    if (appliedPressure > soilBearing) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'FTG-003',
            message: `Applied pressure ${appliedPressure.toFixed(0)}kPa exceeds soil bearing ${soilBearing}kPa`,
            suggestion: `Increase footing size to reduce pressure`,
        });
    } else if (appliedPressure > soilBearing * 0.9) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'FTG-004',
            message: `Applied pressure ${appliedPressure.toFixed(0)}kPa is close to limit ${soilBearing}kPa`,
            suggestion: `Consider increasing footing size for safety margin`,
        });
    } else {
        results.push({
            severity: SEVERITY.PASS,
            code: 'FTG-003',
            message: `Bearing pressure ${appliedPressure.toFixed(0)}kPa is within capacity`,
        });
    }

    // Groundwater
    if (groundwaterDepth < depth / 1000) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'FTG-005',
            message: `Groundwater at ${groundwaterDepth}m is above footing base`,
            suggestion: `Dewatering required during construction, reduce bearing by 50%`,
        });
    }

    // Punching shear depth
    const minPunchingDepth = Math.max(columnSize / 4, 200);
    if (depth < minPunchingDepth) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'FTG-006',
            message: `Depth ${depth}mm may be insufficient for punching shear`,
            suggestion: `Consider depth of at least ${minPunchingDepth}mm`,
        });
    }

    return {
        element: 'footing',
        dimensions: { length, width, depth },
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

// ============================================
// Climate Validation Rules
// ============================================

/**
 * Validate roof design for PNG climate
 */
export function validateRoof(params) {
    const {
        roofPitch,      // degrees
        roofType = 'metal',  // 'metal', 'tile', 'thatch'
        overhang,       // mm
        province = 'Central',
        annualRainfall = 2500,  // mm
        isCyclonic = false,
    } = params;

    const results = [];

    // Minimum pitch for rainfall
    const minPitch = annualRainfall > 3500 ? 25 : annualRainfall > 2500 ? 20 : 15;

    if (roofPitch < minPitch) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'ROOF-001',
            message: `Roof pitch ${roofPitch}° is below minimum ${minPitch}° for ${annualRainfall}mm annual rainfall`,
            suggestion: `Increase pitch to at least ${minPitch}° for proper drainage`,
        });
    } else {
        results.push({
            severity: SEVERITY.PASS,
            code: 'ROOF-001',
            message: `Roof pitch ${roofPitch}° is adequate for rainfall`,
        });
    }

    // Overhang for walls
    const minOverhang = annualRainfall > 3000 ? 900 : annualRainfall > 2000 ? 750 : 600;

    if (overhang < minOverhang) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'ROOF-002',
            message: `Overhang ${overhang}mm may not protect walls adequately`,
            suggestion: `Consider ${minOverhang}mm overhang for ${annualRainfall}mm rainfall zone`,
        });
    }

    // Cyclone requirements
    if (isCyclonic) {
        if (roofType === 'thatch') {
            results.push({
                severity: SEVERITY.ERROR,
                code: 'ROOF-003',
                message: `Thatch roofing not permitted in cyclonic zones`,
                suggestion: `Use metal roofing with cyclone tie-downs`,
            });
        }

        results.push({
            severity: SEVERITY.INFO,
            code: 'ROOF-004',
            message: `Cyclone zone: Ensure cyclone straps and tie-downs are specified`,
            suggestion: `Refer to AS 4055 for wind loading requirements`,
        });
    }

    // Metal roof in highlands
    if (roofType === 'metal' && province.toLowerCase().includes('highland')) {
        results.push({
            severity: SEVERITY.INFO,
            code: 'ROOF-005',
            message: `Highland location: Consider thermal mass for temperature regulation`,
            suggestion: `Add ceiling insulation or consider alternative roofing`,
        });
    }

    return {
        element: 'roof',
        parameters: { roofPitch, overhang, roofType },
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

/**
 * Validate ventilation requirements
 */
export function validateVentilation(params) {
    const {
        floorArea,      // m²
        openableWindows,// m² of openable window area
        hasCrossVent = false,
        hasHighLevelVent = false,
        climateZone = 'tropical-coastal',
    } = params;

    const results = [];

    // Minimum ventilation (PNG Building Standards)
    const minVentRatio = climateZone.includes('highland') ? 0.05 : 0.10;
    const requiredVent = floorArea * minVentRatio;

    if (openableWindows < requiredVent) {
        results.push({
            severity: SEVERITY.ERROR,
            code: 'VENT-001',
            message: `Openable window area ${openableWindows}m² is below required ${requiredVent.toFixed(1)}m²`,
            suggestion: `Increase openable windows to ${minVentRatio * 100}% of floor area`,
        });
    } else {
        results.push({
            severity: SEVERITY.PASS,
            code: 'VENT-001',
            message: `Ventilation area ${openableWindows}m² meets requirements`,
        });
    }

    // Cross ventilation
    if (!hasCrossVent && climateZone.includes('coastal')) {
        results.push({
            severity: SEVERITY.WARNING,
            code: 'VENT-002',
            message: `Cross ventilation not provided`,
            suggestion: `Add openings on opposite walls for airflow in tropical climate`,
        });
    }

    // High level ventilation
    if (!hasHighLevelVent && climateZone.includes('tropical')) {
        results.push({
            severity: SEVERITY.INFO,
            code: 'VENT-003',
            message: `No high-level ventilation specified`,
            suggestion: `Consider roof vents or high windows to exhaust hot air`,
        });
    }

    return {
        element: 'ventilation',
        parameters: { floorArea, openableWindows },
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

// ============================================
// Seismic Validation Rules
// ============================================

/**
 * Validate seismic design requirements
 */
export function validateSeismic(params) {
    const {
        province,
        buildingClass = 2,
        numStoreys = 1,
        structuralSystem = 'concrete-frame',
        hasTieBeams = false,
        hasShearWalls = false,
        hasStrongColumnWeakBeam = false,
    } = params;

    const results = [];

    // Get seismic zone
    const provinceKey = province.toLowerCase();
    const seismicData = SEISMIC_Z[provinceKey] || { z: 0.35, classification: 'Moderate' };
    const zone = seismicData.classification;

    // Zone-specific requirements
    if (zone === 'Severe' || seismicData.z >= 0.45) {
        // Severe zone requirements
        if (!hasTieBeams && numStoreys > 1) {
            results.push({
                severity: SEVERITY.ERROR,
                code: 'SEIS-001',
                message: `Tie beams required at all floor levels in severe seismic zone`,
                suggestion: `Add continuous tie beams connecting all columns`,
            });
        }

        if (buildingClass >= 3 && !hasShearWalls) {
            results.push({
                severity: SEVERITY.ERROR,
                code: 'SEIS-002',
                message: `Shear walls required for Importance Class ${buildingClass} in severe zone`,
                suggestion: `Add shear walls or braced frames for lateral resistance`,
            });
        }

        if (structuralSystem === 'concrete-frame' && !hasStrongColumnWeakBeam) {
            results.push({
                severity: SEVERITY.WARNING,
                code: 'SEIS-003',
                message: `Strong-column weak-beam design recommended`,
                suggestion: `Column moment capacity should exceed beam capacity by 20%`,
            });
        }

        results.push({
            severity: SEVERITY.INFO,
            code: 'SEIS-004',
            message: `Severe seismic zone (Z=${seismicData.z}): Specialist structural engineer review required`,
        });

    } else if (zone === 'High' || seismicData.z >= 0.35) {
        // High zone requirements
        if (!hasTieBeams && numStoreys > 2) {
            results.push({
                severity: SEVERITY.WARNING,
                code: 'SEIS-005',
                message: `Tie beams recommended for 3+ storey buildings in high seismic zone`,
                suggestion: `Add tie beams at floor levels`,
            });
        }

    } else {
        // Moderate/Low zone
        results.push({
            severity: SEVERITY.PASS,
            code: 'SEIS-006',
            message: `Seismic zone ${zone} (Z=${seismicData.z}): Standard design acceptable`,
        });
    }

    // Height limits for unreinforced masonry
    if (structuralSystem === 'masonry' && !hasShearWalls) {
        const maxStoreys = zone === 'Severe' ? 0 : zone === 'High' ? 1 : 2;
        if (numStoreys > maxStoreys) {
            results.push({
                severity: SEVERITY.ERROR,
                code: 'SEIS-007',
                message: `Unreinforced masonry limited to ${maxStoreys} storeys in ${zone} zone`,
                suggestion: `Use reinforced masonry or frame construction`,
            });
        }
    }

    return {
        element: 'seismic',
        zone,
        zFactor: seismicData.z,
        results,
        passed: results.filter(r => r.severity === SEVERITY.ERROR).length === 0,
        errorCount: results.filter(r => r.severity === SEVERITY.ERROR).length,
        warningCount: results.filter(r => r.severity === SEVERITY.WARNING).length,
    };
}

// ============================================
// Complete Building Validation
// ============================================

/**
 * Run all validations on a building design
 */
export function validateBuildingDesign(params) {
    const {
        province,
        buildingClass = 2,
        numStoreys = 1,
        floorArea = 100,
        // Structural
        beams = [],      // Array of beam params
        columns = [],    // Array of column params
        footings = [],   // Array of footing params
        // Climate
        roofPitch = 20,
        overhang = 600,
        roofType = 'metal',
        openableWindows = 0,
        hasCrossVent = false,
        // Seismic
        structuralSystem = 'concrete-frame',
        hasTieBeams = false,
        hasShearWalls = false,
    } = params;

    const allResults = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    // Seismic validation
    const seismicResult = validateSeismic({
        province,
        buildingClass,
        numStoreys,
        structuralSystem,
        hasTieBeams,
        hasShearWalls,
    });
    allResults.push(seismicResult);
    totalErrors += seismicResult.errorCount;
    totalWarnings += seismicResult.warningCount;

    // Roof validation
    const roofResult = validateRoof({
        roofPitch,
        roofType,
        overhang,
        province,
        isCyclonic: seismicResult.zone === 'Severe',
    });
    allResults.push(roofResult);
    totalErrors += roofResult.errorCount;
    totalWarnings += roofResult.warningCount;

    // Ventilation
    const ventResult = validateVentilation({
        floorArea,
        openableWindows: openableWindows || floorArea * 0.1,
        hasCrossVent,
    });
    allResults.push(ventResult);
    totalErrors += ventResult.errorCount;
    totalWarnings += ventResult.warningCount;

    // Validate each beam
    for (const beam of beams) {
        const beamResult = validateBeam({
            ...beam,
            seismicZone: seismicResult.zone.toLowerCase(),
        });
        allResults.push(beamResult);
        totalErrors += beamResult.errorCount;
        totalWarnings += beamResult.warningCount;
    }

    // Validate each column
    for (const column of columns) {
        const colResult = validateColumn({
            ...column,
            seismicZone: seismicResult.zone.toLowerCase(),
        });
        allResults.push(colResult);
        totalErrors += colResult.errorCount;
        totalWarnings += colResult.warningCount;
    }

    // Validate each footing
    for (const footing of footings) {
        const ftgResult = validateFooting(footing);
        allResults.push(ftgResult);
        totalErrors += ftgResult.errorCount;
        totalWarnings += ftgResult.warningCount;
    }

    // Overall result
    const overallPassed = totalErrors === 0;

    return {
        success: true,
        passed: overallPassed,
        summary: {
            province,
            buildingClass,
            numStoreys,
            seismicZone: seismicResult.zone,
            totalErrors,
            totalWarnings,
            status: overallPassed
                ? (totalWarnings > 0 ? 'PASS WITH WARNINGS' : 'PASS')
                : 'FAIL',
        },
        validations: allResults,
        report: generateValidationReport(allResults, { province, buildingClass, numStoreys }),
    };
}

/**
 * Generate human-readable validation report
 */
function generateValidationReport(results, info) {
    const errors = [];
    const warnings = [];
    const passed = [];

    for (const validation of results) {
        for (const r of validation.results) {
            if (r.severity === SEVERITY.ERROR) {
                errors.push(`❌ ${r.code}: ${r.message}`);
                if (r.suggestion) errors.push(`   → ${r.suggestion}`);
            } else if (r.severity === SEVERITY.WARNING) {
                warnings.push(`⚠️ ${r.code}: ${r.message}`);
                if (r.suggestion) warnings.push(`   → ${r.suggestion}`);
            } else if (r.severity === SEVERITY.PASS) {
                passed.push(`✅ ${r.code}: ${r.message}`);
            }
        }
    }

    let report = `
DESIGN VALIDATION REPORT
========================
Location: ${info.province}
Building Class: ${info.buildingClass}
Storeys: ${info.numStoreys}
`;

    if (errors.length > 0) {
        report += `\n🔴 ERRORS (${errors.length / 2}):\n${errors.join('\n')}\n`;
    }

    if (warnings.length > 0) {
        report += `\n🟡 WARNINGS (${warnings.length / 2}):\n${warnings.join('\n')}\n`;
    }

    if (passed.length > 0) {
        report += `\n🟢 PASSED:\n${passed.join('\n')}\n`;
    }

    report += `\n──────────────────────────────`;
    report += `\nSTATUS: ${errors.length > 0 ? 'FAIL - Fix errors before submission' : 'PASS'}\n`;

    return report.trim();
}
