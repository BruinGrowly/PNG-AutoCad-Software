/**
 * Road Alignment Module
 * Horizontal alignment calculations for road design
 */

// ============================================
// Road Standards
// ============================================

/**
 * PNG Road Design Standards
 * Source: PNG Department of Works Road Design Manual (1998)
 * Updated with: ReCAP Low Volume Rural Road Design (2019)
 */
export const ROAD_CLASSES = {
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
export const BATTER_SLOPES = {
    'rock': 0.25,
    'laterite': 1.0,
    'clay': 1.5,
    'sand': 2.0,
    'alluvial': 2.5,
    'swamp': 3.0,
};

// ============================================
// Horizontal Alignment
// ============================================

/**
 * Calculate horizontal alignment from points
 * @param {Array} points - Array of alignment points { x, y, z }
 * @param {Object} standards - Road standards
 * @returns {Object} Alignment data
 */
export function calculateHorizontalAlignment(points, standards) {
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

/**
 * Generate stations along alignment
 * @param {Object} alignment - Alignment object
 * @param {number} interval - Station interval in meters
 * @returns {Array} Station data
 */
export function generateStations(alignment, interval) {
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

/**
 * Get point at specific chainage
 */
export function getPointAtChainage(alignment, chainage) {
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

/**
 * Generate road edges from centerline
 */
export function generateRoadEdges(centerline, offset) {
    const leftEdge = [];
    const rightEdge = [];

    for (let i = 0; i < centerline.length; i++) {
        const curr = centerline[i];
        let dx, dy;

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

        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * offset;
        const ny = dx / len * offset;

        leftEdge.push({ x: curr.x + nx, y: curr.y + ny });
        rightEdge.push({ x: curr.x - nx, y: curr.y - ny });
    }

    return { leftEdge, rightEdge };
}
