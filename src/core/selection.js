/**
 * Selection Module
 * Handles entity selection, hit testing, and bounding box selection
 * 
 * Extracted from engine.js for modularity
 */

import { getEntityBoundingBox, boundingBoxContainsPoint, distance } from './geometry.js';

// ============================================
// Entity Selection & Hit Testing
// ============================================

/**
 * Check if a point is near an entity
 * @param {{ x: number, y: number }} point
 * @param {Object} entity
 * @param {number} tolerance
 * @returns {boolean}
 */
export function isPointNearEntity(point, entity, tolerance = 5) {
    const bbox = getEntityBoundingBox(entity);
    const expandedBbox = {
        minX: bbox.minX - tolerance,
        minY: bbox.minY - tolerance,
        maxX: bbox.maxX + tolerance,
        maxY: bbox.maxY + tolerance,
    };

    if (!boundingBoxContainsPoint(expandedBbox, point)) {
        return false;
    }

    switch (entity.type) {
        case 'line':
            return distanceToLineSegment(point, entity.startPoint, entity.endPoint) <= tolerance;

        case 'polyline':
            for (let i = 0; i < entity.points.length - 1; i++) {
                if (distanceToLineSegment(point, entity.points[i], entity.points[i + 1]) <= tolerance) {
                    return true;
                }
            }
            if (entity.closed && entity.points.length > 2) {
                return distanceToLineSegment(
                    point,
                    entity.points[entity.points.length - 1],
                    entity.points[0]
                ) <= tolerance;
            }
            return false;

        case 'circle':
            const distToCenter = distance(point, entity.center);
            return Math.abs(distToCenter - entity.radius) <= tolerance;

        case 'rectangle':
            return isPointNearRectangle(point, entity.topLeft, entity.width, entity.height, tolerance);

        case 'text':
        case 'dimension':
        case 'hatch':
        case 'block':
            return boundingBoxContainsPoint(bbox, point);

        default:
            return false;
    }
}

/**
 * Calculate distance from point to line segment
 */
export function distanceToLineSegment(point, lineStart, lineEnd) {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    return distance(point, { x: xx, y: yy });
}

/**
 * Check if point is near a rectangle edge
 */
export function isPointNearRectangle(point, topLeft, width, height, tolerance) {
    const corners = [
        topLeft,
        { x: topLeft.x + width, y: topLeft.y },
        { x: topLeft.x + width, y: topLeft.y + height },
        { x: topLeft.x, y: topLeft.y + height },
    ];

    for (let i = 0; i < 4; i++) {
        if (distanceToLineSegment(point, corners[i], corners[(i + 1) % 4]) <= tolerance) {
            return true;
        }
    }

    return false;
}

/**
 * Select entities within a bounding box
 * @param {Array} entities
 * @param {Object} box
 * @returns {Array}
 */
export function selectEntitiesInBox(entities, box) {
    return entities.filter(entity => {
        const entityBox = getEntityBoundingBox(entity);
        return entityBox.minX >= box.minX &&
            entityBox.maxX <= box.maxX &&
            entityBox.minY >= box.minY &&
            entityBox.maxY <= box.maxY;
    });
}

/**
 * Nearest point on line segment
 */
export function nearestPointOnLineSegment(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return lineStart;

    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
    return { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
}

/**
 * Perpendicular foot on line segment
 */
export function perpendicularFootOnLine(point, lineStart, lineEnd) {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;

    const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq;
    if (t < 0 || t > 1) return null;

    return { x: lineStart.x + t * dx, y: lineStart.y + t * dy };
}

// ============================================
// Intersection Helpers
// ============================================

/**
 * Line segment intersection
 */
export function lineSegmentIntersection(p1, p2, p3, p4) {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 0.0001) return null;

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    }
    return null;
}

/**
 * Line-line intersection (infinite lines)
 */
export function lineLineIntersection(p1, p2, p3, p4) {
    const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(d) < 0.0001) return null;

    const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
}

/**
 * Line-circle intersection
 */
export function lineCircleIntersection(p1, p2, center, radius) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const fx = p1.x - center.x;
    const fy = p1.y - center.y;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) return [];

    const results = [];
    const sqrtD = Math.sqrt(discriminant);

    const t1 = (-b - sqrtD) / (2 * a);
    const t2 = (-b + sqrtD) / (2 * a);

    if (t1 >= 0 && t1 <= 1) {
        results.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
    }
    if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 0.0001) {
        results.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
    }

    return results;
}
