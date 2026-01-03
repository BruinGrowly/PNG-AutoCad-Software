/**
 * PNG Landowner Management Module
 * 
 * Handles customary land ownership documentation, stakeholder mapping,
 * consultation tracking, and benefit sharing for civil engineering projects.
 * 
 * Context: 97% of PNG land is under customary tenure.
 * Land disputes are the #1 cause of infrastructure project delays.
 */

// ============================================
// Unique ID Generator
// ============================================

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ============================================
// Province and LLG Data
// ============================================

export const PNG_PROVINCES = [
    'Central', 'East New Britain', 'East Sepik', 'Eastern Highlands', 'Enga',
    'Gulf', 'Hela', 'Jiwaka', 'Madang', 'Manus', 'Milne Bay', 'Morobe',
    'National Capital District', 'New Ireland', 'Oro', 'Sandaun', 'Simbu',
    'Southern Highlands', 'West New Britain', 'Western', 'Western Highlands',
    'Autonomous Region of Bougainville',
];

// Common concern categories for civil engineering projects
export const CONCERN_CATEGORIES = [
    { value: 'compensation', label: 'Compensation & Payment' },
    { value: 'environmental', label: 'Environmental Impact' },
    { value: 'cultural', label: 'Cultural Sites & Sacred Places' },
    { value: 'access', label: 'Access & Right of Way' },
    { value: 'resettlement', label: 'Resettlement & Relocation' },
    { value: 'employment', label: 'Local Employment' },
    { value: 'benefits', label: 'Benefit Sharing' },
    { value: 'boundary', label: 'Land Boundary Dispute' },
    { value: 'ownership', label: 'Ownership Dispute' },
    { value: 'water', label: 'Water Resources' },
    { value: 'other', label: 'Other' },
];

export const CONCERN_STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    ESCALATED: 'escalated',
    CLOSED: 'closed',
};

export const IMPACT_TYPES = {
    ACQUISITION: 'acquisition',      // Full land acquisition
    EASEMENT: 'easement',            // Right of way / easement
    TEMPORARY_ACCESS: 'temporary-access',  // Construction access only
    BUFFER_ZONE: 'buffer-zone',      // Environmental buffer
    INDIRECT: 'indirect',            // Indirectly affected
};

// ============================================
// Landowner Registry
// ============================================

/**
 * Create a new landowner registry for a project
 * @param {Object} projectBoundary - Project area boundary polygon
 * @returns {Object} Empty landowner registry
 */
export function createLandownerRegistry(projectBoundary) {
    return {
        id: generateId(),
        createdAt: new Date(),
        modifiedAt: new Date(),
        projectBoundary,
        parcels: [],
        consultations: [],
        concerns: [],
        statistics: {
            totalParcels: 0,
            totalAreaHectares: 0,
            ilgRegistered: 0,
            openConcerns: 0,
            consultationsHeld: 0,
        },
    };
}

/**
 * Create a new landowner parcel record
 * @param {Object} params - Parcel parameters
 * @returns {Object} Parcel object
 */
export function createLandownerParcel(params) {
    const {
        customaryName,
        clanName,
        subclanNames = [],
        province,
        llg = '',
        ward = '',
        boundaryPoints = [],
        areaHectares = 0,
        impactType = IMPACT_TYPES.INDIRECT,
        affectedAreaHectares = 0,
    } = params;

    return {
        id: generateId(),
        createdAt: new Date(),
        modifiedAt: new Date(),

        // Identity
        customaryName: customaryName || '',
        clanName: clanName || '',
        subclanNames,

        // Location
        province,
        llg,
        ward,

        // Boundary
        boundaryPoints,
        areaHectares,

        // ILG Status (Incorporated Land Group)
        ilgRegistered: false,
        ilgNumber: '',
        ilgRegistrationDate: null,

        // Project impact
        impactType,
        affectedAreaHectares,

        // Representatives
        representatives: [],

        // Consultation history (linked by ID)
        consultationIds: [],

        // Concerns (linked by ID)
        concernIds: [],

        // Notes
        notes: '',
    };
}

/**
 * Add a parcel to the registry
 */
export function addParcelToRegistry(registry, parcel) {
    const updatedParcels = [...registry.parcels, parcel];

    return {
        ...registry,
        modifiedAt: new Date(),
        parcels: updatedParcels,
        statistics: {
            ...registry.statistics,
            totalParcels: updatedParcels.length,
            totalAreaHectares: updatedParcels.reduce((sum, p) => sum + p.areaHectares, 0),
            ilgRegistered: updatedParcels.filter(p => p.ilgRegistered).length,
        },
    };
}

/**
 * Add a representative to a parcel
 */
export function addRepresentative(parcel, representative) {
    const { name, role, gender, contact = '', notes = '' } = representative;

    return {
        ...parcel,
        modifiedAt: new Date(),
        representatives: [
            ...parcel.representatives,
            {
                id: generateId(),
                name,
                role, // e.g., 'Chairman', 'Secretary', 'Elder', 'Women Representative'
                gender,
                contact,
                notes,
                addedAt: new Date(),
            },
        ],
    };
}

/**
 * Update ILG (Incorporated Land Group) status for a parcel
 */
export function updateILGStatus(parcel, ilgNumber, registrationDate) {
    return {
        ...parcel,
        modifiedAt: new Date(),
        ilgRegistered: true,
        ilgNumber,
        ilgRegistrationDate: registrationDate,
    };
}

// ============================================
// Consultation Tracking
// ============================================

/**
 * Record a community consultation
 */
export function createConsultation(params) {
    const {
        parcelIds = [],
        date,
        location,
        attendees = [],
        womenPresent = 0,
        youthPresent = 0,
        eldersPresent = 0,
        agenda = '',
        concerns = [],
        agreements = [],
        nextSteps = [],
        notes = '',
    } = params;

    return {
        id: generateId(),
        createdAt: new Date(),
        date: date || new Date(),
        location,
        parcelIds,

        // Attendance (for inclusion tracking)
        attendees,
        totalAttendees: attendees.length,
        womenPresent,
        youthPresent,
        eldersPresent,

        // Meeting content
        agenda,
        concerns,
        agreements,
        nextSteps,
        notes,

        // Attachments (for photos, signed forms, etc.)
        attachments: [],
    };
}

/**
 * Add consultation to registry and link to parcels
 */
export function recordConsultation(registry, consultation) {
    const updatedConsultations = [...registry.consultations, consultation];

    // Link consultation to parcels
    const updatedParcels = registry.parcels.map(parcel => {
        if (consultation.parcelIds.includes(parcel.id)) {
            return {
                ...parcel,
                consultationIds: [...parcel.consultationIds, consultation.id],
            };
        }
        return parcel;
    });

    return {
        ...registry,
        modifiedAt: new Date(),
        consultations: updatedConsultations,
        parcels: updatedParcels,
        statistics: {
            ...registry.statistics,
            consultationsHeld: updatedConsultations.length,
        },
    };
}

// ============================================
// Concern Register
// ============================================

/**
 * Create a new concern/issue
 */
export function createConcern(params) {
    const {
        parcelId,
        category,
        description,
        raisedBy,
        priority = 'medium', // low, medium, high, critical
    } = params;

    return {
        id: generateId(),
        createdAt: new Date(),
        parcelId,
        category,
        description,
        raisedBy,
        raisedDate: new Date(),
        priority,
        status: CONCERN_STATUS.OPEN,
        resolution: '',
        resolvedDate: null,
        resolvedBy: '',
        updates: [],
    };
}

/**
 * Add concern to registry
 */
export function addConcern(registry, concern) {
    const updatedConcerns = [...registry.concerns, concern];

    // Link concern to parcel
    const updatedParcels = registry.parcels.map(parcel => {
        if (parcel.id === concern.parcelId) {
            return {
                ...parcel,
                concernIds: [...parcel.concernIds, concern.id],
            };
        }
        return parcel;
    });

    return {
        ...registry,
        modifiedAt: new Date(),
        concerns: updatedConcerns,
        parcels: updatedParcels,
        statistics: {
            ...registry.statistics,
            openConcerns: updatedConcerns.filter(c => c.status === CONCERN_STATUS.OPEN).length,
        },
    };
}

/**
 * Update concern status
 */
export function updateConcernStatus(registry, concernId, status, resolution = '', resolvedBy = '') {
    const updatedConcerns = registry.concerns.map(concern => {
        if (concern.id === concernId) {
            return {
                ...concern,
                status,
                resolution: status === CONCERN_STATUS.RESOLVED ? resolution : concern.resolution,
                resolvedDate: status === CONCERN_STATUS.RESOLVED ? new Date() : concern.resolvedDate,
                resolvedBy: status === CONCERN_STATUS.RESOLVED ? resolvedBy : concern.resolvedBy,
                updates: [
                    ...concern.updates,
                    {
                        date: new Date(),
                        previousStatus: concern.status,
                        newStatus: status,
                        note: resolution,
                    },
                ],
            };
        }
        return concern;
    });

    return {
        ...registry,
        modifiedAt: new Date(),
        concerns: updatedConcerns,
        statistics: {
            ...registry.statistics,
            openConcerns: updatedConcerns.filter(c => c.status === CONCERN_STATUS.OPEN).length,
        },
    };
}

// ============================================
// Benefit Sharing Calculations
// ============================================

/**
 * Calculate benefit sharing based on affected area
 * @param {Object} params - Calculation parameters
 * @returns {Object} Benefit allocation breakdown
 */
export function calculateBenefitSharing(params) {
    const {
        projectValue,                    // Total project value (PGK)
        benefitSharePercent = 2,         // % of project for landowner benefits
        affectedParcels = [],            // Array of { parcelId, affectedAreaHectares }
        distributionModel = 'area-based', // 'area-based', 'equal', 'custom'
    } = params;

    const totalBenefitPool = projectValue * (benefitSharePercent / 100);
    const totalAffectedArea = affectedParcels.reduce((sum, p) => sum + p.affectedAreaHectares, 0);

    let allocations = [];

    if (distributionModel === 'area-based' && totalAffectedArea > 0) {
        // Distribute proportionally by affected area
        allocations = affectedParcels.map(parcel => ({
            parcelId: parcel.parcelId,
            affectedAreaHectares: parcel.affectedAreaHectares,
            sharePercent: (parcel.affectedAreaHectares / totalAffectedArea) * 100,
            amount: (parcel.affectedAreaHectares / totalAffectedArea) * totalBenefitPool,
        }));
    } else if (distributionModel === 'equal' && affectedParcels.length > 0) {
        // Equal distribution
        const perParcel = totalBenefitPool / affectedParcels.length;
        allocations = affectedParcels.map(parcel => ({
            parcelId: parcel.parcelId,
            affectedAreaHectares: parcel.affectedAreaHectares,
            sharePercent: 100 / affectedParcels.length,
            amount: perParcel,
        }));
    }

    return {
        projectValue,
        benefitSharePercent,
        totalBenefitPool,
        totalAffectedAreaHectares: totalAffectedArea,
        distributionModel,
        allocations,
        note: 'Amounts are indicative and subject to formal agreement negotiation',
    };
}

// ============================================
// Affected Area Analysis
// ============================================

/**
 * Identify parcels affected by a project footprint
 * @param {Array} projectFootprint - Array of {x, y} points forming project boundary
 * @param {Object} registry - Landowner registry
 * @returns {Array} Affected parcels with overlap details
 */
export function identifyAffectedParcels(projectFootprint, registry) {
    const affected = [];

    for (const parcel of registry.parcels) {
        if (parcel.boundaryPoints.length < 3) continue;

        // Check for intersection/overlap
        const overlap = calculatePolygonOverlap(projectFootprint, parcel.boundaryPoints);

        if (overlap.overlaps) {
            affected.push({
                parcelId: parcel.id,
                parcelName: parcel.customaryName,
                clanName: parcel.clanName,
                totalAreaHectares: parcel.areaHectares,
                affectedAreaHectares: overlap.overlapAreaHectares,
                percentAffected: (overlap.overlapAreaHectares / parcel.areaHectares) * 100,
                impactType: determineImpactType(overlap.percentOverlap),
            });
        }
    }

    return affected;
}

/**
 * Simple polygon overlap calculation
 * Uses bounding box check + point-in-polygon for basic overlap detection
 */
function calculatePolygonOverlap(polygon1, polygon2) {
    // Bounding box check first (fast rejection)
    const bbox1 = getBoundingBox(polygon1);
    const bbox2 = getBoundingBox(polygon2);

    if (!bboxOverlap(bbox1, bbox2)) {
        return { overlaps: false, overlapAreaHectares: 0, percentOverlap: 0 };
    }

    // Check if any points from one polygon are inside the other
    const p1InP2 = polygon1.filter(pt => pointInPolygon(pt, polygon2)).length;
    const p2InP1 = polygon2.filter(pt => pointInPolygon(pt, polygon1)).length;

    if (p1InP2 === 0 && p2InP1 === 0) {
        return { overlaps: false, overlapAreaHectares: 0, percentOverlap: 0 };
    }

    // Estimate overlap area (simplified - full implementation would use polygon clipping)
    const area1 = calculatePolygonArea(polygon1);
    const area2 = calculatePolygonArea(polygon2);
    const overlapEstimate = Math.min(area1, area2) * Math.max(p1InP2 / polygon1.length, p2InP1 / polygon2.length);

    return {
        overlaps: true,
        overlapAreaHectares: overlapEstimate / 10000, // m² to hectares
        percentOverlap: (overlapEstimate / area2) * 100,
    };
}

function getBoundingBox(points) {
    const xs = points.map(p => p.x || p.lng);
    const ys = points.map(p => p.y || p.lat);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
    };
}

function bboxOverlap(a, b) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function pointInPolygon(point, polygon) {
    const x = point.x || point.lng;
    const y = point.y || point.lat;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x || polygon[i].lng;
        const yi = polygon[i].y || polygon[i].lat;
        const xj = polygon[j].x || polygon[j].lng;
        const yj = polygon[j].y || polygon[j].lat;

        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }

    return inside;
}

function calculatePolygonArea(points) {
    let area = 0;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x || points[i].lng;
        const yi = points[i].y || points[i].lat;
        const xj = points[j].x || points[j].lng;
        const yj = points[j].y || points[j].lat;
        area += (xj + xi) * (yj - yi);
    }
    return Math.abs(area / 2);
}

function determineImpactType(percentOverlap) {
    if (percentOverlap >= 90) return IMPACT_TYPES.ACQUISITION;
    if (percentOverlap >= 30) return IMPACT_TYPES.EASEMENT;
    if (percentOverlap >= 10) return IMPACT_TYPES.BUFFER_ZONE;
    return IMPACT_TYPES.INDIRECT;
}

// ============================================
// Report Generation
// ============================================

/**
 * Generate landowner impact summary report
 */
export function generateLandownerReport(registry) {
    const stats = registry.statistics;
    const openConcerns = registry.concerns.filter(c => c.status === CONCERN_STATUS.OPEN);
    const escalatedConcerns = registry.concerns.filter(c => c.status === CONCERN_STATUS.ESCALATED);

    // Gender inclusion metrics
    const totalAttendance = registry.consultations.reduce((sum, c) => sum + c.totalAttendees, 0);
    const womenAttendance = registry.consultations.reduce((sum, c) => sum + c.womenPresent, 0);
    const womenParticipationPercent = totalAttendance > 0 ? (womenAttendance / totalAttendance) * 100 : 0;

    // Concern breakdown by category
    const concernsByCategory = {};
    for (const concern of registry.concerns) {
        concernsByCategory[concern.category] = (concernsByCategory[concern.category] || 0) + 1;
    }

    return {
        generatedAt: new Date(),
        summary: {
            totalParcels: stats.totalParcels,
            totalAreaHectares: Math.round(stats.totalAreaHectares * 100) / 100,
            ilgRegisteredPercent: stats.totalParcels > 0
                ? Math.round((stats.ilgRegistered / stats.totalParcels) * 100)
                : 0,
            consultationsHeld: stats.consultationsHeld,
            totalConcerns: registry.concerns.length,
            openConcerns: openConcerns.length,
            escalatedConcerns: escalatedConcerns.length,
        },
        inclusion: {
            womenParticipationPercent: Math.round(womenParticipationPercent),
            consultationsWithWomen: registry.consultations.filter(c => c.womenPresent > 0).length,
        },
        concerns: {
            byCategory: concernsByCategory,
            critical: openConcerns.filter(c => c.priority === 'critical'),
            needingAction: openConcerns.filter(c => c.priority === 'high' || c.priority === 'critical'),
        },
        recommendations: generateRecommendations(registry),
    };
}

function generateRecommendations(registry) {
    const recommendations = [];
    const stats = registry.statistics;

    // ILG registration
    const unregisteredParcels = registry.parcels.filter(p => !p.ilgRegistered);
    if (unregisteredParcels.length > 0) {
        recommendations.push({
            priority: 'high',
            category: 'ILG Registration',
            message: `${unregisteredParcels.length} parcel(s) not ILG registered. Assist with registration before project proceeds.`,
        });
    }

    // Escalated concerns
    const escalated = registry.concerns.filter(c => c.status === CONCERN_STATUS.ESCALATED);
    if (escalated.length > 0) {
        recommendations.push({
            priority: 'critical',
            category: 'Escalated Concerns',
            message: `${escalated.length} escalated concern(s) require immediate management attention.`,
        });
    }

    // Gender inclusion
    const recentConsultations = registry.consultations.slice(-5);
    const lowWomenParticipation = recentConsultations.filter(c =>
        c.totalAttendees > 0 && (c.womenPresent / c.totalAttendees) < 0.3
    );
    if (lowWomenParticipation.length > 2) {
        recommendations.push({
            priority: 'medium',
            category: 'Inclusion',
            message: 'Women participation below 30% in recent consultations. Consider targeted engagement.',
        });
    }

    // Boundary disputes
    const boundaryDisputes = registry.concerns.filter(
        c => c.category === 'boundary' && c.status === CONCERN_STATUS.OPEN
    );
    if (boundaryDisputes.length > 0) {
        recommendations.push({
            priority: 'high',
            category: 'Land Boundaries',
            message: `${boundaryDisputes.length} unresolved boundary dispute(s). Resolve before construction.`,
        });
    }

    return recommendations;
}
