/**
 * TIN Surface and Contour Generation Module
 * 
 * Implements Delaunay triangulation for TIN (Triangulated Irregular Network)
 * surfaces and generates contour lines from survey point data.
 * 
 * This is the "graduation" from drafting tool to civil engineering tool.
 */

import Delaunator from 'delaunator';

// ============================================
// TIN Surface Creation
// ============================================

/**
 * Create a TIN (Triangulated Irregular Network) surface from survey points
 * 
 * @param {Array<{x: number, y: number, z: number}>} points - Survey points with elevation
 * @returns {Object} TIN surface with triangles and metadata
 */
export function createTINSurface(points) {
    if (!points || points.length < 3) {
        throw new Error('At least 3 points are required to create a TIN surface');
    }

    // Validate points
    const validPoints = points.filter(p =>
        typeof p.x === 'number' &&
        typeof p.y === 'number' &&
        typeof p.z === 'number' &&
        !isNaN(p.x) && !isNaN(p.y) && !isNaN(p.z)
    );

    if (validPoints.length < 3) {
        throw new Error('At least 3 valid points with x, y, z coordinates are required');
    }

    // Flatten coordinates for Delaunator (expects [x0, y0, x1, y1, ...])
    const coords = new Float64Array(validPoints.length * 2);
    for (let i = 0; i < validPoints.length; i++) {
        coords[i * 2] = validPoints[i].x;
        coords[i * 2 + 1] = validPoints[i].y;
    }

    // Perform Delaunay triangulation
    const delaunay = new Delaunator(coords);

    // Build triangle list with elevation data
    const triangles = [];
    for (let i = 0; i < delaunay.triangles.length; i += 3) {
        const i0 = delaunay.triangles[i];
        const i1 = delaunay.triangles[i + 1];
        const i2 = delaunay.triangles[i + 2];

        triangles.push({
            id: triangles.length,
            vertices: [
                { x: validPoints[i0].x, y: validPoints[i0].y, z: validPoints[i0].z },
                { x: validPoints[i1].x, y: validPoints[i1].y, z: validPoints[i1].z },
                { x: validPoints[i2].x, y: validPoints[i2].y, z: validPoints[i2].z },
            ],
            indices: [i0, i1, i2],
        });
    }

    // Calculate surface statistics
    const elevations = validPoints.map(p => p.z);
    const minZ = Math.min(...elevations);
    const maxZ = Math.max(...elevations);
    const avgZ = elevations.reduce((a, b) => a + b, 0) / elevations.length;

    // Calculate bounding box
    const xs = validPoints.map(p => p.x);
    const ys = validPoints.map(p => p.y);
    const bounds = {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
        minZ,
        maxZ,
    };

    return {
        type: 'TINSurface',
        points: validPoints,
        triangles,
        triangleCount: triangles.length,
        pointCount: validPoints.length,
        bounds,
        statistics: {
            minElevation: minZ,
            maxElevation: maxZ,
            avgElevation: avgZ,
            elevationRange: maxZ - minZ,
        },
        delaunay, // Keep reference for advanced operations
    };
}

// ============================================
// Contour Generation
// ============================================

/**
 * Generate contour lines from a TIN surface
 * Uses linear interpolation along triangle edges
 * 
 * @param {Object} tinSurface - TIN surface from createTINSurface
 * @param {Object} options - Contour options
 * @returns {Array} Array of contour polylines
 */
export function generateContours(tinSurface, options = {}) {
    const {
        interval = null,        // Contour interval (auto-calculated if null)
        minElevation = null,    // Start elevation (auto if null)
        maxElevation = null,    // End elevation (auto if null)
        majorInterval = 5,      // Every Nth contour is major
    } = options;

    // Auto-calculate interval if not provided
    const minZ = minElevation ?? tinSurface.statistics.minElevation;
    const maxZ = maxElevation ?? tinSurface.statistics.maxElevation;
    const range = maxZ - minZ;

    // Smart interval selection based on range
    let contourInterval = interval;
    if (!contourInterval) {
        if (range <= 5) contourInterval = 0.5;
        else if (range <= 20) contourInterval = 1;
        else if (range <= 50) contourInterval = 2;
        else if (range <= 100) contourInterval = 5;
        else if (range <= 500) contourInterval = 10;
        else contourInterval = 20;
    }

    // Generate contour elevations
    const contourElevations = [];
    const startElev = Math.ceil(minZ / contourInterval) * contourInterval;
    for (let z = startElev; z <= maxZ; z += contourInterval) {
        contourElevations.push(z);
    }

    // Extract contour segments from each triangle
    const contourSegments = new Map(); // elevation -> segments[]

    for (const triangle of tinSurface.triangles) {
        for (const elevation of contourElevations) {
            const segments = extractContourFromTriangle(triangle, elevation);
            if (segments.length > 0) {
                if (!contourSegments.has(elevation)) {
                    contourSegments.set(elevation, []);
                }
                contourSegments.get(elevation).push(...segments);
            }
        }
    }

    // Connect segments into polylines
    const contours = [];
    let contourIndex = 0;

    for (const [elevation, segments] of contourSegments) {
        if (segments.length === 0) continue;

        const polylines = connectSegments(segments);

        for (const polyline of polylines) {
            const isMajor = Math.abs(elevation / contourInterval) % majorInterval === 0;

            contours.push({
                id: `contour-${contourIndex++}`,
                type: 'contour',
                elevation,
                isMajor,
                points: polyline,
                pointCount: polyline.length,
            });
        }
    }

    return {
        contours,
        contourCount: contours.length,
        interval: contourInterval,
        majorInterval,
        elevationRange: { min: minZ, max: maxZ },
    };
}

/**
 * Extract contour line segment from a triangle at a given elevation
 * Uses linear interpolation along edges
 */
function extractContourFromTriangle(triangle, elevation) {
    const v = triangle.vertices;
    const crossings = [];

    // Check each edge for crossing
    for (let i = 0; i < 3; i++) {
        const v1 = v[i];
        const v2 = v[(i + 1) % 3];

        // Check if elevation crosses this edge
        if ((v1.z <= elevation && v2.z >= elevation) ||
            (v1.z >= elevation && v2.z <= elevation)) {
            // Avoid division by zero
            if (Math.abs(v2.z - v1.z) < 0.0001) continue;

            // Linear interpolation to find crossing point
            const t = (elevation - v1.z) / (v2.z - v1.z);

            // Skip exact vertex matches (handled by adjacent triangles)
            if (t < 0.0001 || t > 0.9999) continue;

            crossings.push({
                x: v1.x + t * (v2.x - v1.x),
                y: v1.y + t * (v2.y - v1.y),
                z: elevation,
            });
        }
    }

    // A contour line crosses a triangle at exactly 2 points (or 0)
    if (crossings.length === 2) {
        return [{ start: crossings[0], end: crossings[1] }];
    }

    return [];
}

/**
 * Connect individual segments into continuous polylines
 * Uses spatial proximity to join segments
 */
function connectSegments(segments) {
    if (segments.length === 0) return [];

    const TOLERANCE = 0.0001;
    const used = new Array(segments.length).fill(false);
    const polylines = [];

    function pointsEqual(p1, p2) {
        return Math.abs(p1.x - p2.x) < TOLERANCE &&
            Math.abs(p1.y - p2.y) < TOLERANCE;
    }

    function findConnectedSegment(point, excludeIndex) {
        for (let i = 0; i < segments.length; i++) {
            if (used[i] || i === excludeIndex) continue;

            if (pointsEqual(segments[i].start, point)) {
                return { index: i, reverse: false };
            }
            if (pointsEqual(segments[i].end, point)) {
                return { index: i, reverse: true };
            }
        }
        return null;
    }

    // Build polylines by connecting segments
    for (let startIdx = 0; startIdx < segments.length; startIdx++) {
        if (used[startIdx]) continue;

        const polyline = [segments[startIdx].start, segments[startIdx].end];
        used[startIdx] = true;

        // Extend forward
        let currentEnd = polyline[polyline.length - 1];
        let connected = findConnectedSegment(currentEnd, startIdx);

        while (connected) {
            used[connected.index] = true;
            const seg = segments[connected.index];

            if (connected.reverse) {
                polyline.push(seg.start);
            } else {
                polyline.push(seg.end);
            }

            currentEnd = polyline[polyline.length - 1];
            connected = findConnectedSegment(currentEnd, connected.index);
        }

        // Extend backward
        let currentStart = polyline[0];
        connected = findConnectedSegment(currentStart, startIdx);

        while (connected) {
            used[connected.index] = true;
            const seg = segments[connected.index];

            if (connected.reverse) {
                polyline.unshift(seg.end);
            } else {
                polyline.unshift(seg.start);
            }

            currentStart = polyline[0];
            connected = findConnectedSegment(currentStart, connected.index);
        }

        polylines.push(polyline);
    }

    return polylines;
}

// ============================================
// CSV Import
// ============================================

/**
 * Parse CSV survey data into points array
 * Supports formats: X,Y,Z or PointID,X,Y,Z or Easting,Northing,Elevation
 * 
 * @param {string} csvContent - Raw CSV content
 * @param {Object} options - Parse options
 * @returns {Array} Array of {x, y, z} points
 */
export function parseCSVSurveyPoints(csvContent, options = {}) {
    const {
        xColumn = null,       // Column index for X (auto-detect if null)
        yColumn = null,       // Column index for Y
        zColumn = null,       // Column index for Z
        hasHeader = true,     // First row is header
        delimiter = ',',      // CSV delimiter
    } = options;

    const lines = csvContent.trim().split(/\r?\n/);
    if (lines.length < (hasHeader ? 2 : 1)) {
        throw new Error('CSV file must contain at least one data row');
    }

    // Parse header or detect columns
    let xIdx = 0, yIdx = 1, zIdx = 2;
    let startRow = 0;

    if (hasHeader) {
        const header = lines[0].toLowerCase().split(delimiter).map(h => h.trim());
        startRow = 1;

        // Auto-detect column indices
        if (xColumn === null) {
            xIdx = header.findIndex(h =>
                h === 'x' || h === 'easting' || h === 'e' || h === 'longitude'
            );
            if (xIdx === -1) xIdx = 0;
        } else {
            xIdx = xColumn;
        }

        if (yColumn === null) {
            yIdx = header.findIndex(h =>
                h === 'y' || h === 'northing' || h === 'n' || h === 'latitude'
            );
            if (yIdx === -1) yIdx = 1;
        } else {
            yIdx = yColumn;
        }

        if (zColumn === null) {
            zIdx = header.findIndex(h =>
                h === 'z' || h === 'elevation' || h === 'elev' || h === 'height' || h === 'rl'
            );
            if (zIdx === -1) zIdx = 2;
        } else {
            zIdx = zColumn;
        }
    }

    // Parse data rows
    const points = [];
    const errors = [];

    for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(delimiter).map(v => v.trim());

        const x = parseFloat(values[xIdx]);
        const y = parseFloat(values[yIdx]);
        const z = parseFloat(values[zIdx]);

        if (isNaN(x) || isNaN(y) || isNaN(z)) {
            errors.push({ row: i + 1, line, reason: 'Invalid numeric values' });
            continue;
        }

        points.push({ x, y, z, sourceRow: i + 1 });
    }

    return {
        points,
        pointCount: points.length,
        errors,
        errorCount: errors.length,
        columns: { x: xIdx, y: yIdx, z: zIdx },
    };
}

// ============================================
// Elevation Interpolation
// ============================================

/**
 * Interpolate elevation at a point on the TIN surface
 * Uses barycentric interpolation within triangles
 * 
 * @param {Object} tinSurface - TIN surface
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number|null} Interpolated elevation or null if outside surface
 */
export function interpolateElevationOnTIN(tinSurface, x, y) {
    // Find containing triangle
    for (const triangle of tinSurface.triangles) {
        const result = interpolateInTriangle(triangle, x, y);
        if (result !== null) {
            return result;
        }
    }
    return null;
}

/**
 * Interpolate elevation within a triangle using barycentric coordinates
 */
function interpolateInTriangle(triangle, x, y) {
    const v = triangle.vertices;

    // Compute barycentric coordinates
    const denom = (v[1].y - v[2].y) * (v[0].x - v[2].x) +
        (v[2].x - v[1].x) * (v[0].y - v[2].y);

    if (Math.abs(denom) < 0.0001) return null;

    const w1 = ((v[1].y - v[2].y) * (x - v[2].x) +
        (v[2].x - v[1].x) * (y - v[2].y)) / denom;

    const w2 = ((v[2].y - v[0].y) * (x - v[2].x) +
        (v[0].x - v[2].x) * (y - v[2].y)) / denom;

    const w3 = 1 - w1 - w2;

    // Check if point is inside triangle
    const TOLERANCE = 0.0001;
    if (w1 >= -TOLERANCE && w2 >= -TOLERANCE && w3 >= -TOLERANCE) {
        // Interpolate elevation
        return w1 * v[0].z + w2 * v[1].z + w3 * v[2].z;
    }

    return null;
}

// ============================================
// Surface Analysis
// ============================================

/**
 * Calculate slope and aspect at a point on the TIN surface
 * 
 * @param {Object} tinSurface - TIN surface
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {Object|null} Slope (degrees) and aspect (degrees from north)
 */
export function calculateSlopeAtPoint(tinSurface, x, y) {
    // Find containing triangle
    for (const triangle of tinSurface.triangles) {
        const v = triangle.vertices;

        // Check if point is in this triangle
        if (interpolateInTriangle(triangle, x, y) !== null) {
            // Calculate plane equation: ax + by + cz = d
            const v1 = { x: v[1].x - v[0].x, y: v[1].y - v[0].y, z: v[1].z - v[0].z };
            const v2 = { x: v[2].x - v[0].x, y: v[2].y - v[0].y, z: v[2].z - v[0].z };

            // Cross product for normal
            const normal = {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x,
            };

            // Normalize
            const length = Math.sqrt(normal.x ** 2 + normal.y ** 2 + normal.z ** 2);
            if (length < 0.0001) return null;

            normal.x /= length;
            normal.y /= length;
            normal.z /= length;

            // Slope in degrees (angle from horizontal)
            const slopeDegrees = Math.acos(Math.abs(normal.z)) * (180 / Math.PI);

            // Aspect (direction of steepest descent, degrees from north)
            let aspectDegrees = Math.atan2(-normal.x, -normal.y) * (180 / Math.PI);
            if (aspectDegrees < 0) aspectDegrees += 360;

            // Slope percentage
            const slopePercent = Math.tan(slopeDegrees * Math.PI / 180) * 100;

            return {
                slopeDegrees,
                slopePercent,
                aspectDegrees,
                aspectDirection: getAspectDirection(aspectDegrees),
            };
        }
    }

    return null;
}

/**
 * Get compass direction from aspect angle
 */
function getAspectDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// ============================================
// Export Functions
// ============================================

/**
 * Convert contours to CAD entities for drawing
 * 
 * @param {Object} contourData - Output from generateContours
 * @param {Object} options - Conversion options
 * @returns {Array} Array of CAD polyline entities
 */
export function contoursToEntities(contourData, options = {}) {
    const {
        majorColor = '#0066cc',
        minorColor = '#aaaaaa',
        majorLineWidth = 1.5,
        minorLineWidth = 0.5,
        layerId = 'contours',
    } = options;

    return contourData.contours.map(contour => ({
        id: contour.id,
        type: 'polyline',
        points: contour.points.map(p => ({ x: p.x, y: p.y })),
        closed: false,
        layerId,
        style: {
            strokeColor: contour.isMajor ? majorColor : minorColor,
            strokeWidth: contour.isMajor ? majorLineWidth : minorLineWidth,
        },
        metadata: {
            elevation: contour.elevation,
            isMajor: contour.isMajor,
            entityType: 'contour',
        },
    }));
}

/**
 * Convert TIN triangles to CAD entities for visualization
 * 
 * @param {Object} tinSurface - TIN surface
 * @param {Object} options - Conversion options
 * @returns {Array} Array of CAD polygon entities
 */
export function tinToEntities(tinSurface, options = {}) {
    const {
        showTriangles = true,
        triangleColor = '#888888',
        triangleLineWidth = 0.25,
        layerId = 'tin-mesh',
    } = options;

    if (!showTriangles) return [];

    return tinSurface.triangles.map(triangle => ({
        id: `tin-${triangle.id}`,
        type: 'polygon',
        points: triangle.vertices.map(v => ({ x: v.x, y: v.y })),
        closed: true,
        layerId,
        style: {
            strokeColor: triangleColor,
            strokeWidth: triangleLineWidth,
            fillColor: 'transparent',
        },
        metadata: {
            entityType: 'tin-triangle',
            triangleId: triangle.id,
        },
    }));
}
