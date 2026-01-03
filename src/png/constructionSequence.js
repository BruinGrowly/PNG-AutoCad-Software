/**
 * Construction Sequence Generator
 * 
 * Bridges the gap between design and execution by generating
 * step-by-step construction guidance for builders in PNG.
 * 
 * LJPW Alignment:
 * - Love: Speaks to builder's reality, not just engineer's calculations
 * - Justice: Same quality guidance regardless of project location
 * - Power: Transforms design knowledge into actionable steps
 * - Wisdom: Encodes construction best practices, curing times, sequences
 */

import { DISCLAIMER_CONSTRUCTION, ENGINEER_CERTIFICATION_BLOCK } from '../core/disclaimer.js';

// ============================================
// Equipment Levels
// ============================================

export const EQUIPMENT_LEVELS = {
    basic: {
        name: 'Basic (Hand Tools)',
        description: 'Shovel, pick, hand tamper, spirit level, tape measure',
        excavationRate: 2,      // m³ per day per worker
        concreteRate: 3,        // m³ per day for placing
        formworkRate: 10,       // m² per day
    },
    standard: {
        name: 'Standard (Some Power Tools)',
        description: 'Plus concrete mixer, vibrator, power saw',
        excavationRate: 4,
        concreteRate: 6,
        formworkRate: 20,
    },
    mechanized: {
        name: 'Mechanized',
        description: 'Plus excavator, concrete pump, crane',
        excavationRate: 20,
        concreteRate: 15,
        formworkRate: 40,
    },
};

// ============================================
// Curing Times (PNG Tropical Climate)
// ============================================

export const CURING_TIMES = {
    blinding: 1,        // days before continuing
    footing: 7,         // days minimum cure
    column: 7,
    beam: 7,
    slab: 14,
    formworkRemoval: {
        footing: 2,       // days before stripping
        column: 3,
        beam: 14,         // 14 days for beam soffits
        slab: 21,
    },
};

// ============================================
// Main Generator Function
// ============================================

/**
 * Generate a complete construction sequence from design data
 * 
 * @param {Object} params - Design parameters
 * @param {string} params.projectName - Project name
 * @param {string} params.province - PNG province
 * @param {Array} params.footings - Footing designs from sizePadFooting()
 * @param {Array} params.columns - Column designs from sizeConcreteColumn()
 * @param {Array} params.beams - Beam designs from sizeConcreteBeam()
 * @param {Object} params.roof - Roof design parameters
 * @param {string} params.soilType - Soil type for foundation
 * @param {string} params.equipment - Equipment level: 'basic', 'standard', 'mechanized'
 * @param {number} params.workers - Number of workers available
 * @returns {Object} Construction sequence with phases and steps
 */
export function generateConstructionSequence(params) {
    const {
        projectName = 'Untitled Project',
        province = 'National Capital District',
        footings = [],
        columns = [],
        beams = [],
        roof = {},
        soilType = 'medium-clay',
        equipment = 'basic',
        workers = 4,
    } = params;

    const equipmentConfig = EQUIPMENT_LEVELS[equipment] || EQUIPMENT_LEVELS.basic;
    const phases = [];
    let currentDay = 1;

    // ========================================
    // PHASE 1: Site Preparation
    // ========================================
    const sitePhase = generateSitePreparationPhase(footings, equipmentConfig, workers);
    sitePhase.startDay = currentDay;
    sitePhase.endDay = currentDay + sitePhase.duration - 1;
    phases.push(sitePhase);
    currentDay = sitePhase.endDay + 1;

    // ========================================
    // PHASE 2: Foundation
    // ========================================
    const foundationPhase = generateFoundationPhase(footings, columns, soilType, equipmentConfig, workers);
    foundationPhase.startDay = currentDay;
    foundationPhase.endDay = currentDay + foundationPhase.duration - 1;
    phases.push(foundationPhase);
    currentDay = foundationPhase.endDay + 1;

    // ========================================
    // PHASE 3: Columns
    // ========================================
    if (columns.length > 0) {
        const columnPhase = generateColumnPhase(columns, equipmentConfig, workers);
        columnPhase.startDay = currentDay;
        columnPhase.endDay = currentDay + columnPhase.duration - 1;
        phases.push(columnPhase);
        currentDay = columnPhase.endDay + 1;
    }

    // ========================================
    // PHASE 4: Beams & Lintels
    // ========================================
    if (beams.length > 0) {
        const beamPhase = generateBeamPhase(beams, equipmentConfig, workers);
        beamPhase.startDay = currentDay;
        beamPhase.endDay = currentDay + beamPhase.duration - 1;
        phases.push(beamPhase);
        currentDay = beamPhase.endDay + 1;
    }

    // ========================================
    // PHASE 5: Roof Structure
    // ========================================
    if (roof.type) {
        const roofPhase = generateRoofPhase(roof, equipmentConfig, workers);
        roofPhase.startDay = currentDay;
        roofPhase.endDay = currentDay + roofPhase.duration - 1;
        phases.push(roofPhase);
        currentDay = roofPhase.endDay + 1;
    }

    // Calculate totals
    const totalDuration = currentDay - 1;
    const totalConcrete = calculateTotalConcrete(footings, columns, beams);
    const totalSteel = calculateTotalSteel(footings, columns, beams);

    return {
        success: true,
        project: {
            name: projectName,
            province,
            equipment: equipmentConfig.name,
            workers,
        },
        summary: {
            totalDuration,
            totalPhases: phases.length,
            totalConcrete,
            totalSteel,
        },
        phases,
        report: generateTextReport(projectName, province, phases, totalDuration, equipmentConfig),
    };
}

// ============================================
// Phase Generators
// ============================================

function generateSitePreparationPhase(footings, equipment, workers) {
    const steps = [];

    steps.push({
        step: 1.1,
        description: 'Clear vegetation within building footprint plus 2 metres on all sides',
        details: [
            'Remove all trees, shrubs, and grass',
            'Stockpile topsoil separately for landscaping',
            'Dispose of roots completely - do not bury',
        ],
        materials: ['Bush knives', 'Rakes', 'Wheelbarrows'],
    });

    steps.push({
        step: 1.2,
        description: 'Set out building corners using string lines',
        details: [
            'Drive timber pegs at each corner',
            'Use 3-4-5 triangle method to ensure right angles',
            '  → Measure 3m along one side, 4m along adjacent side',
            '  → Diagonal must be exactly 5m for 90° angle',
            'Double-check all dimensions from drawing',
        ],
        materials: ['Timber pegs', 'String line', 'Hammer', '30m tape measure'],
        warning: 'Setting out errors are expensive to fix later - measure twice!',
    });

    steps.push({
        step: 1.3,
        description: 'Establish site level datum',
        details: [
            'Fix a permanent benchmark (painted mark on tree or concrete peg)',
            'All levels will be measured from this point',
            'Record datum level in site diary',
        ],
        materials: ['Water level or dumpy level', 'Permanent marker'],
    });

    steps.push({
        step: 1.4,
        description: 'Mark footing positions',
        details: footings.map((f, i) =>
            `Footing ${i + 1}: ${f.dimensions?.length || 1500}mm × ${f.dimensions?.width || 1500}mm`
        ),
        materials: ['Lime powder or sand for marking', 'Spray paint'],
    });

    const duration = Math.ceil(2 / (equipment.excavationRate / 2)); // Site prep is lighter work

    return {
        phase: 1,
        name: 'Site Preparation',
        duration,
        steps,
        tips: [
            'Best to start site work in dry weather',
            'Keep string lines in place for reference throughout construction',
        ],
    };
}

function generateFoundationPhase(footings, columns, soilType, equipment, workers) {
    const steps = [];

    // Calculate excavation volume
    const excavationVolume = footings.reduce((sum, f) => {
        const l = (f.dimensions?.length || 1500) / 1000;
        const w = (f.dimensions?.width || 1500) / 1000;
        const d = ((f.dimensions?.depth || 400) + 100) / 1000; // +100mm for blinding
        return sum + (l * w * d);
    }, 0);

    const excavationDays = Math.ceil(excavationVolume / (equipment.excavationRate * workers));

    steps.push({
        step: 2.1,
        description: 'Excavate footings',
        details: footings.map((f, i) =>
            `Footing ${i + 1}: Excavate to ${(f.dimensions?.depth || 400) + 100}mm depth`
        ),
        duration: excavationDays,
        materials: ['Shovels', 'Picks', 'Wheelbarrows'],
        warning: soilType.includes('soft')
            ? 'Soft soil detected - may need deeper founding or soil improvement'
            : null,
    });

    steps.push({
        step: 2.2,
        description: 'Compact excavation base',
        details: [
            'Remove any loose material',
            'Compact with hand tamper or plate compactor',
            'Check level is uniform across footing',
        ],
        materials: ['Hand tamper', 'Spirit level'],
    });

    steps.push({
        step: 2.3,
        description: 'Pour blinding concrete (100mm)',
        details: [
            'Mix ratio: 1 cement : 3 sand : 6 aggregate',
            'Level and smooth surface',
            'This provides clean base for reinforcement',
        ],
        duration: 1,
        materials: ['Cement', 'Sand', 'Aggregate', 'Water'],
        wait: `${CURING_TIMES.blinding} day before continuing`,
    });

    // Reinforcement
    const rebarDetails = footings.map((f, i) => ({
        footing: i + 1,
        bottomMat: f.reinforcement?.bottom || 'N12@200 both ways',
        cover: `${f.cover || 75}mm cover blocks`,
    }));

    steps.push({
        step: 2.4,
        description: 'Fix footing reinforcement',
        details: [
            ...rebarDetails.map(r =>
                `Footing ${r.footing}: ${r.bottomMat}, ${r.cover}`
            ),
            'Use concrete cover blocks - plastic or precast',
            'Tie all bar intersections with wire',
        ],
        materials: ['Reinforcing bars as specified', 'Tie wire', 'Cover blocks'],
        warning: 'Minimum 75mm cover for in-ground concrete in PNG conditions',
    });

    // Column starter bars
    if (columns.length > 0) {
        steps.push({
            step: 2.5,
            description: 'Fix column starter bars',
            details: columns.map((c, i) => {
                const mainBars = c.reinforcement?.main || '4N16';
                const devLength = 40 * 16; // 40 × bar diameter for N16
                return `Column ${i + 1}: ${mainBars}, extend ${devLength}mm into footing`;
            }),
            materials: ['Column reinforcement', 'Tie wire'],
            warning: 'Starter bars must be plumb - check with spirit level',
        });
    }

    steps.push({
        step: 2.6,
        description: 'Erect footing formwork',
        details: [
            'Use 18mm plywood or timber boards',
            'Brace securely - concrete is heavy!',
            'Oil formwork faces for easy removal',
        ],
        materials: ['Formwork plywood', 'Bracing timber', 'Nails', 'Form oil'],
    });

    // Concrete pour
    const concreteVolume = footings.reduce((sum, f) => {
        const l = (f.dimensions?.length || 1500) / 1000;
        const w = (f.dimensions?.width || 1500) / 1000;
        const d = (f.dimensions?.depth || 400) / 1000;
        return sum + (l * w * d);
    }, 0);

    steps.push({
        step: 2.7,
        description: 'Pour footing concrete',
        details: [
            `Total volume: ${concreteVolume.toFixed(1)}m³`,
            `Concrete grade: ${footings[0]?.concreteGrade || 'N25'}`,
            'Compact with vibrator or rod',
            'Level top surface',
        ],
        duration: Math.ceil(concreteVolume / equipment.concreteRate),
        materials: [
            'Ready-mix concrete OR',
            'Cement, sand, aggregate for site-mix (1:2:4 ratio)',
        ],
        wait: `Cure for ${CURING_TIMES.footing} days minimum`,
        warning: 'Keep concrete wet - cover with plastic or wet hessian',
    });

    steps.push({
        step: 2.8,
        description: 'Curing period',
        details: [
            'Keep concrete moist for 7 days',
            'Cover with plastic sheet or wet sacks',
            'Water twice daily in hot weather',
        ],
        duration: CURING_TIMES.footing,
        warning: 'Do NOT remove formwork or load footings during this time',
    });

    const duration = excavationDays + 2 + 1 + CURING_TIMES.footing; // excavation + prep + pour + cure

    return {
        phase: 2,
        name: 'Foundation',
        duration,
        steps,
        tips: [
            'Order concrete one day ahead - confirm delivery time',
            'Have complete team ready on pour day',
            soilType.includes('clay')
                ? 'Clay soil: Avoid excavation in heavy rain'
                : null,
        ].filter(Boolean),
    };
}

function generateColumnPhase(columns, equipment, workers) {
    const steps = [];

    steps.push({
        step: 3.1,
        description: 'Remove footing formwork',
        details: [
            'Carefully remove formwork sides',
            'Do not damage concrete edges',
            'Clean and store formwork for reuse',
        ],
        duration: 1,
    });

    steps.push({
        step: 3.2,
        description: 'Prepare column reinforcement cages',
        details: columns.map((c, i) => {
            const mainBars = c.reinforcement?.main || '4N16';
            const links = c.reinforcement?.links || 'R10@150';
            return `Column ${i + 1}: ${mainBars} with ${links} links`;
        }),
        materials: ['Column bars', 'Link bars', 'Tie wire', 'Link bender'],
        warning: 'Link spacing is critical for seismic resistance',
    });

    steps.push({
        step: 3.3,
        description: 'Erect column formwork',
        details: columns.map((c, i) =>
            `Column ${i + 1}: ${c.dimensions?.width || 300}mm × ${c.dimensions?.width || 300}mm × ${c.dimensions?.height || 3000}mm`
        ),
        materials: ['Column forms', 'Props', 'Bracing', 'Plumb bob'],
        warning: 'Columns must be exactly plumb - check on all four sides',
    });

    steps.push({
        step: 3.4,
        description: 'Pour column concrete',
        details: [
            `Concrete grade: ${columns[0]?.concreteGrade || 'N32'}`,
            'Pour in maximum 500mm lifts',
            'Vibrate each lift thoroughly',
            'Leave surface rough for beam connection',
        ],
        duration: 1,
        materials: ['Concrete (N32)', 'Vibrator or rod'],
        warning: 'Never pour more than 500mm without vibrating - prevents honeycombing',
    });

    steps.push({
        step: 3.5,
        description: 'Curing period',
        details: [
            'Keep formwork in place',
            'Water top of columns daily',
        ],
        duration: CURING_TIMES.column,
        wait: `${CURING_TIMES.formworkRemoval.column} days before removing formwork`,
    });

    const duration = 2 + 1 + CURING_TIMES.column;

    return {
        phase: 3,
        name: 'Columns',
        duration,
        steps,
        tips: [
            'Pre-assemble column cages on ground - easier to install',
            'Check plumb daily during curing - formwork can shift',
        ],
    };
}

function generateBeamPhase(beams, equipment, workers) {
    const steps = [];

    steps.push({
        step: 4.1,
        description: 'Erect beam formwork and scaffolding',
        details: [
            'Install props and bearers',
            'Set soffit forms to correct level',
            'Install side forms',
            'Check all levels before continuing',
        ],
        materials: ['Props', 'Bearer timbers', 'Formwork plywood', 'Nails'],
        duration: 2,
        warning: 'Falsework must be on solid bearing - not on loose fill',
    });

    steps.push({
        step: 4.2,
        description: 'Fix beam reinforcement',
        details: beams.map((b, i) => {
            const bottom = b.reinforcement?.bottom || '4N16';
            const top = b.reinforcement?.top || '2N12';
            const links = b.reinforcement?.links || 'R10@200';
            return `Beam ${i + 1}: Bottom: ${bottom}, Top: ${top}, Links: ${links}`;
        }),
        materials: ['Beam reinforcement', 'Cover blocks', 'Tie wire'],
        warning: 'Ensure minimum 25mm cover to all bars',
    });

    const concreteVolume = beams.reduce((sum, b) => {
        const l = (b.dimensions?.length || 4000) / 1000;
        const w = (b.dimensions?.width || 300) / 1000;
        const d = (b.dimensions?.depth || 500) / 1000;
        return sum + (l * w * d);
    }, 0);

    steps.push({
        step: 4.3,
        description: 'Pour beam concrete',
        details: [
            `Total volume: ${concreteVolume.toFixed(1)}m³`,
            `Concrete grade: ${beams[0]?.concreteGrade || 'N25'}`,
            'Compact thoroughly esp. around bars',
        ],
        duration: 1,
        materials: ['Concrete', 'Vibrator'],
    });

    steps.push({
        step: 4.4,
        description: 'Curing period',
        details: [
            'Keep beam tops wet',
            'Cover with wet hessian + plastic',
        ],
        duration: CURING_TIMES.beam,
        warning: `Do NOT remove beam soffit props for ${CURING_TIMES.formworkRemoval.beam} days`,
    });

    const duration = 2 + 1 + CURING_TIMES.beam;

    return {
        phase: 4,
        name: 'Beams & Lintels',
        duration,
        steps,
        tips: [
            'Pour beams on same day if possible for monolithic action',
            'Leave props in place longer in wet/cold weather',
        ],
    };
}

function generateRoofPhase(roof, equipment, workers) {
    const steps = [];
    const roofType = roof.type || 'metal';

    steps.push({
        step: 5.1,
        description: 'Install wall plate / ring beam connection',
        details: [
            'Fix hold-down bolts to beam/wall plate',
            'Ensure level and aligned',
        ],
        duration: 1,
        materials: ['Hold-down bolts', 'Nuts', 'Washers'],
    });

    steps.push({
        step: 5.2,
        description: 'Erect roof trusses or rafters',
        details: [
            `Roof pitch: ${roof.pitch || 20}°`,
            'Brace first truss securely before continuing',
            'Install temporary bracing',
            'Check spacing matches drawing',
        ],
        duration: 2,
        materials: ['Trusses/Rafters', 'Bracing', 'Connector plates'],
        warning: 'Roof work at height - use safety equipment',
    });

    steps.push({
        step: 5.3,
        description: 'Install purlins and battens',
        details: [
            'Fix purlins at spacing to suit roofing',
            'Standard: 900mm for 0.48mm sheeting',
        ],
        duration: 1,
        materials: ['Purlins', 'Tek screws'],
    });

    if (roofType === 'metal' || roofType === 'zincalume') {
        steps.push({
            step: 5.4,
            description: 'Install roof sheeting',
            details: [
                'Start from leeward side (away from prevailing wind)',
                'Overlap minimum 150mm at ends, one corrugation at sides',
                'Use correct screws with washers',
            ],
            duration: 2,
            materials: ['Roofing sheets', 'Roofing screws with washers'],
            warning: 'Do not walk on unsupported sheeting',
        });

        steps.push({
            step: 5.5,
            description: 'Install flashings and ridge cap',
            details: [
                'Fix ridge cap over apex',
                'Install barge boards at gable ends',
                'Seal all penetrations',
            ],
            duration: 1,
            materials: ['Ridge cap', 'Barge boards', 'Sealant'],
        });
    }

    steps.push({
        step: 5.6,
        description: 'Install gutters and downpipes',
        details: [
            'Fall: minimum 1:200 towards downpipes',
            'Downpipes at each corner + max 12m spacing',
        ],
        duration: 1,
        materials: ['Gutters', 'Downpipes', 'Brackets', 'Pop rivets'],
    });

    const duration = 8; // Typical roof duration

    return {
        phase: 5,
        name: 'Roof Structure',
        duration,
        steps,
        tips: [
            'Complete roof before wet season if possible',
            'Once roof is on, internal work can proceed in any weather',
        ],
    };
}

// ============================================
// Utility Functions
// ============================================

function calculateTotalConcrete(footings, columns, beams) {
    let total = 0;

    for (const f of footings) {
        const l = (f.dimensions?.length || 1500) / 1000;
        const w = (f.dimensions?.width || 1500) / 1000;
        const d = (f.dimensions?.depth || 400) / 1000;
        total += l * w * d;
    }

    for (const c of columns) {
        const size = (c.dimensions?.width || 300) / 1000;
        const h = (c.dimensions?.height || 3000) / 1000;
        total += size * size * h;
    }

    for (const b of beams) {
        const l = (b.dimensions?.length || 4000) / 1000;
        const w = (b.dimensions?.width || 300) / 1000;
        const d = (b.dimensions?.depth || 500) / 1000;
        total += l * w * d;
    }

    return Math.ceil(total * 1.05 * 10) / 10; // +5% waste, round to 0.1
}

function calculateTotalSteel(footings, columns, beams) {
    let total = 0;

    for (const f of footings) {
        total += f.steel?.weight || 30;
    }
    for (const c of columns) {
        total += c.steel?.weight || 25;
    }
    for (const b of beams) {
        total += b.steel?.weight || 40;
    }

    return Math.ceil(total * 1.1); // +10% for laps/waste
}

function generateTextReport(projectName, province, phases, totalDuration, equipment) {
    // Start with disclaimer
    let report = DISCLAIMER_CONSTRUCTION + '\n\n';

    report += `
CONSTRUCTION SEQUENCE
=====================
Project: ${projectName}
Location: ${province}
Equipment: ${equipment.name}
Total Duration: ${totalDuration} days

`;

    for (const phase of phases) {
        report += `
PHASE ${phase.phase}: ${phase.name.toUpperCase()} (Days ${phase.startDay}-${phase.endDay})
${'-'.repeat(50)}
`;

        for (const step of phase.steps) {
            report += `\n${step.step} ${step.description}\n`;

            if (step.details && step.details.length > 0) {
                for (const detail of step.details) {
                    report += `    ${detail}\n`;
                }
            }

            if (step.materials) {
                report += `    Materials: ${step.materials.join(', ')}\n`;
            }

            if (step.warning) {
                report += `    ⚠️ ${step.warning}\n`;
            }

            if (step.wait) {
                report += `    ⏱️ ${step.wait}\n`;
            }
        }

        if (phase.tips && phase.tips.length > 0) {
            report += `\n  💡 Tips:\n`;
            for (const tip of phase.tips) {
                report += `     • ${tip}\n`;
            }
        }
    }

    report += `
${'='.repeat(50)}
END OF CONSTRUCTION SEQUENCE

⚠️ IMPORTANT NOTES:
• This sequence assumes continuous work without weather delays
• Curing times must be respected - do not rush!
• Always verify dimensions on site against drawings
• Report any discrepancies to the Engineer before proceeding
`;

    // Add engineer certification block at the end
    report += '\n\n' + ENGINEER_CERTIFICATION_BLOCK;

    return report.trim();
}
