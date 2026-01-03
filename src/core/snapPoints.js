/**
 * Snap Points Module
 * Handles object snapping for precise drawing
 * 
 * Extracted from engine.js for modularity
 */

import { distance } from './geometry.js';
import {
    lineSegmentIntersection,
    lineCircleIntersection,
    perpendicularFootOnLine,
    nearestPointOnLineSegment
} from './selection.js';

// ============================================
// Snap Point Extraction
// ============================================

/**
 * Get snap points from entities
 * @param {Array} entities
 * @param {Object} settings
 * @returns {Array<{ point: { x: number, y: number }, type: string }>}
 */
export function getSnapPoints(entities, settings) {
    const snapPoints = [];

    for (const entity of entities) {
        if (!entity.visible) continue;

        switch (entity.type) {
            case 'line':
                if (settings.endpointSnap) {
                    snapPoints.push({ point: entity.startPoint, type: 'endpoint' });
                    snapPoints.push({ point: entity.endPoint, type: 'endpoint' });
                }
                if (settings.midpointSnap) {
                    snapPoints.push({
                        point: {
                            x: (entity.startPoint.x + entity.endPoint.x) / 2,
                            y: (entity.startPoint.y + entity.endPoint.y) / 2,
                        },
                        type: 'midpoint',
                    });
                }
                break;

            case 'polyline':
                if (settings.endpointSnap) {
                    entity.points.forEach(p => snapPoints.push({ point: p, type: 'endpoint' }));
                }
                if (settings.midpointSnap) {
                    for (let i = 0; i < entity.points.length - 1; i++) {
                        snapPoints.push({
                            point: {
                                x: (entity.points[i].x + entity.points[i + 1].x) / 2,
                                y: (entity.points[i].y + entity.points[i + 1].y) / 2,
                            },
                            type: 'midpoint',
                        });
                    }
                }
                break;

            case 'circle':
                if (settings.centerSnap) {
                    snapPoints.push({ point: entity.center, type: 'center' });
                }
                // Quadrant points
                if (settings.endpointSnap) {
                    snapPoints.push({ point: { x: entity.center.x + entity.radius, y: entity.center.y }, type: 'quadrant' });
                    snapPoints.push({ point: { x: entity.center.x - entity.radius, y: entity.center.y }, type: 'quadrant' });
                    snapPoints.push({ point: { x: entity.center.x, y: entity.center.y + entity.radius }, type: 'quadrant' });
                    snapPoints.push({ point: { x: entity.center.x, y: entity.center.y - entity.radius }, type: 'quadrant' });
                }
                break;

            case 'arc':
                if (settings.centerSnap) {
                    snapPoints.push({ point: entity.center, type: 'center' });
                }
                if (settings.endpointSnap) {
                    const startRad = (entity.startAngle * Math.PI) / 180;
                    const endRad = (entity.endAngle * Math.PI) / 180;
                    snapPoints.push({
                        point: {
                            x: entity.center.x + entity.radius * Math.cos(startRad),
                            y: entity.center.y + entity.radius * Math.sin(startRad),
                        },
                        type: 'endpoint',
                    });
                    snapPoints.push({
                        point: {
                            x: entity.center.x + entity.radius * Math.cos(endRad),
                            y: entity.center.y + entity.radius * Math.sin(endRad),
                        },
                        type: 'endpoint',
                    });
                }
                break;

            case 'rectangle':
                if (settings.endpointSnap) {
                    snapPoints.push({ point: entity.topLeft, type: 'endpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y }, type: 'endpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height }, type: 'endpoint' });
                }
                if (settings.midpointSnap) {
                    snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y }, type: 'midpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height }, type: 'midpoint' });
                    snapPoints.push({ point: { x: entity.topLeft.x, y: entity.topLeft.y + entity.height / 2 }, type: 'midpoint' });
                }
                if (settings.centerSnap) {
                    snapPoints.push({
                        point: { x: entity.topLeft.x + entity.width / 2, y: entity.topLeft.y + entity.height / 2 },
                        type: 'center',
                    });
                }
                break;
        }
    }

    return snapPoints;
}

/**
 * Get intersection snap points between entities
 */
export function getIntersectionSnapPoints(entities, cursorPoint, maxDistance) {
    const intersections = [];
    const lines = [];
    const circles = [];

    // Collect line segments
    for (const entity of entities) {
        if (!entity.visible) continue;

        if (entity.type === 'line') {
            lines.push({ start: entity.startPoint, end: entity.endPoint });
        } else if (entity.type === 'polyline') {
            for (let i = 0; i < entity.points.length - 1; i++) {
                lines.push({ start: entity.points[i], end: entity.points[i + 1] });
            }
            if (entity.closed && entity.points.length > 2) {
                lines.push({ start: entity.points[entity.points.length - 1], end: entity.points[0] });
            }
        } else if (entity.type === 'rectangle') {
            const corners = [
                entity.topLeft,
                { x: entity.topLeft.x + entity.width, y: entity.topLeft.y },
                { x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height },
                { x: entity.topLeft.x, y: entity.topLeft.y + entity.height },
            ];
            for (let i = 0; i < 4; i++) {
                lines.push({ start: corners[i], end: corners[(i + 1) % 4] });
            }
        } else if (entity.type === 'circle') {
            circles.push({ center: entity.center, radius: entity.radius });
        }
    }

    // Find line-line intersections
    for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const int = lineSegmentIntersection(lines[i].start, lines[i].end, lines[j].start, lines[j].end);
            if (int && distance(int, cursorPoint) <= maxDistance) {
                intersections.push({ point: int, type: 'intersection' });
            }
        }
    }

    // Find line-circle intersections
    for (const line of lines) {
        for (const circle of circles) {
            const ints = lineCircleIntersection(line.start, line.end, circle.center, circle.radius);
            for (const int of ints) {
                if (distance(int, cursorPoint) <= maxDistance) {
                    intersections.push({ point: int, type: 'intersection' });
                }
            }
        }
    }

    return intersections;
}

/**
 * Get perpendicular snap point from cursor to an entity
 */
export function getPerpendicularSnapPoint(entity, cursorPoint) {
    if (entity.type === 'line') {
        const foot = perpendicularFootOnLine(cursorPoint, entity.startPoint, entity.endPoint);
        if (foot) {
            return { point: foot, type: 'perpendicular' };
        }
    } else if (entity.type === 'polyline') {
        let nearest = null;
        let minDist = Infinity;
        for (let i = 0; i < entity.points.length - 1; i++) {
            const foot = perpendicularFootOnLine(cursorPoint, entity.points[i], entity.points[i + 1]);
            if (foot) {
                const d = distance(foot, cursorPoint);
                if (d < minDist) {
                    minDist = d;
                    nearest = foot;
                }
            }
        }
        if (nearest) {
            return { point: nearest, type: 'perpendicular' };
        }
    }
    return null;
}

/**
 * Get tangent snap points from a point to a circle
 */
export function getTangentSnapPoints(circle, fromPoint) {
    const dx = fromPoint.x - circle.center.x;
    const dy = fromPoint.y - circle.center.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d <= circle.radius) {
        return []; // Point inside circle
    }

    const a = Math.acos(circle.radius / d);
    const b = Math.atan2(dy, dx);

    return [
        {
            point: {
                x: circle.center.x + circle.radius * Math.cos(b + a),
                y: circle.center.y + circle.radius * Math.sin(b + a),
            },
            type: 'tangent',
        },
        {
            point: {
                x: circle.center.x + circle.radius * Math.cos(b - a),
                y: circle.center.y + circle.radius * Math.sin(b - a),
            },
            type: 'tangent',
        },
    ];
}

/**
 * Get nearest point on entity
 */
export function getNearestSnapPoint(entity, cursorPoint) {
    if (entity.type === 'line') {
        const nearest = nearestPointOnLineSegment(cursorPoint, entity.startPoint, entity.endPoint);
        return { point: nearest, type: 'nearest' };
    } else if (entity.type === 'circle') {
        const angle = Math.atan2(cursorPoint.y - entity.center.y, cursorPoint.x - entity.center.x);
        return {
            point: {
                x: entity.center.x + entity.radius * Math.cos(angle),
                y: entity.center.y + entity.radius * Math.sin(angle),
            },
            type: 'nearest',
        };
    } else if (entity.type === 'polyline') {
        let nearest = null;
        let minDist = Infinity;
        for (let i = 0; i < entity.points.length - 1; i++) {
            const pt = nearestPointOnLineSegment(cursorPoint, entity.points[i], entity.points[i + 1]);
            const d = distance(pt, cursorPoint);
            if (d < minDist) {
                minDist = d;
                nearest = pt;
            }
        }
        if (nearest) {
            return { point: nearest, type: 'nearest' };
        }
    }
    return null;
}

/**
 * Find nearest snap point from a list
 */
export function findNearestSnapPoint(point, snapPoints, maxDistance) {
    let nearest = null;
    let minDist = maxDistance;

    for (const sp of snapPoints) {
        const dist = distance(point, sp.point);
        if (dist < minDist) {
            minDist = dist;
            nearest = sp;
        }
    }

    return nearest;
}
