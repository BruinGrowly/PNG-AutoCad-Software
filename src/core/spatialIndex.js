/**
 * Spatial Indexing Module
 * Provides R-tree based spatial indexing for efficient entity queries
 */

// ============================================
// Simple R-tree Implementation
// ============================================

/**
 * Create a new spatial index
 * @returns {Object} Spatial index object
 */
export function createSpatialIndex() {
    return {
        root: null,
        size: 0,
        maxEntriesPerNode: 9,
        minEntriesPerNode: 4,
    };
}

/**
 * Insert an entity into the spatial index
 * @param {Object} index - Spatial index
 * @param {Object} entity - Entity with id and bounding box
 * @param {Object} bbox - Bounding box { minX, minY, maxX, maxY }
 */
export function indexInsert(index, entity, bbox) {
    const entry = {
        id: entity.id,
        bbox: { ...bbox },
        entity,
    };

    if (!index.root) {
        index.root = {
            bbox: { ...bbox },
            entries: [entry],
            isLeaf: true,
        };
    } else {
        insertEntry(index.root, entry, index.maxEntriesPerNode, index.minEntriesPerNode);
        expandBbox(index.root.bbox, bbox);
    }

    index.size++;
    return index;
}

/**
 * Remove an entity from the spatial index
 */
export function indexRemove(index, entityId) {
    if (!index.root) return index;

    const removed = removeEntry(index.root, entityId);
    if (removed) {
        index.size--;

        // If root is empty, reset
        if (index.root.entries.length === 0) {
            index.root = null;
        }
    }

    return index;
}

/**
 * Query entities that intersect with a bounding box
 * @param {Object} index - Spatial index
 * @param {Object} queryBbox - Query bounding box
 * @returns {Array} Matching entities
 */
export function indexQuery(index, queryBbox) {
    if (!index.root) return [];

    const results = [];
    queryNode(index.root, queryBbox, results);
    return results;
}

/**
 * Query entities near a point
 * @param {Object} index - Spatial index
 * @param {Object} point - Query point { x, y }
 * @param {number} radius - Search radius
 * @returns {Array} Matching entities
 */
export function indexQueryNear(index, point, radius) {
    const queryBbox = {
        minX: point.x - radius,
        minY: point.y - radius,
        maxX: point.x + radius,
        maxY: point.y + radius,
    };

    return indexQuery(index, queryBbox).filter(entity => {
        // Additional distance check for circular area
        const cx = (entity.bbox.minX + entity.bbox.maxX) / 2;
        const cy = (entity.bbox.minY + entity.bbox.maxY) / 2;
        const dx = cx - point.x;
        const dy = cy - point.y;
        return Math.sqrt(dx * dx + dy * dy) <= radius;
    });
}

/**
 * Rebuild index from entity array
 * @param {Array} entities - Array of entities
 * @param {Function} getBbox - Function to get bounding box from entity
 * @returns {Object} New spatial index
 */
export function buildIndex(entities, getBbox) {
    const index = createSpatialIndex();

    for (const entity of entities) {
        const bbox = getBbox(entity);
        if (bbox) {
            indexInsert(index, entity, bbox);
        }
    }

    return index;
}

/**
 * Get all entities in the index
 */
export function indexGetAll(index) {
    if (!index.root) return [];

    const results = [];
    collectAll(index.root, results);
    return results;
}

// ============================================
// Internal R-tree Operations
// ============================================

function insertEntry(node, entry, maxEntries, minEntries) {
    if (node.isLeaf) {
        node.entries.push(entry);

        // Check if node needs splitting
        if (node.entries.length > maxEntries) {
            splitNode(node, minEntries);
        }
    } else {
        // Find best child to insert into
        const bestChild = chooseSubtree(node.entries, entry.bbox);
        insertEntry(bestChild, entry, maxEntries, minEntries);
        expandBbox(bestChild.bbox, entry.bbox);
    }
}

function removeEntry(node, entityId) {
    if (node.isLeaf) {
        const idx = node.entries.findIndex(e => e.id === entityId);
        if (idx >= 0) {
            node.entries.splice(idx, 1);
            return true;
        }
        return false;
    } else {
        for (const child of node.entries) {
            if (removeEntry(child, entityId)) {
                recalculateBbox(child);
                return true;
            }
        }
        return false;
    }
}

function queryNode(node, queryBbox, results) {
    if (!bboxIntersects(node.bbox, queryBbox)) {
        return;
    }

    if (node.isLeaf) {
        for (const entry of node.entries) {
            if (bboxIntersects(entry.bbox, queryBbox)) {
                results.push({
                    id: entry.id,
                    bbox: entry.bbox,
                    entity: entry.entity,
                });
            }
        }
    } else {
        for (const child of node.entries) {
            queryNode(child, queryBbox, results);
        }
    }
}

function collectAll(node, results) {
    if (node.isLeaf) {
        for (const entry of node.entries) {
            results.push(entry.entity);
        }
    } else {
        for (const child of node.entries) {
            collectAll(child, results);
        }
    }
}

function chooseSubtree(children, bbox) {
    let best = children[0];
    let bestEnlargement = Infinity;

    for (const child of children) {
        const enlargement = bboxEnlargement(child.bbox, bbox);
        if (enlargement < bestEnlargement) {
            bestEnlargement = enlargement;
            best = child;
        }
    }

    return best;
}

function splitNode(node, minEntries) {
    // Simple split: divide entries into two groups
    const entries = node.entries;
    const mid = Math.ceil(entries.length / 2);

    const group1 = entries.slice(0, mid);
    const group2 = entries.slice(mid);

    // Convert current node to internal node
    node.isLeaf = false;
    node.entries = [
        {
            bbox: calculateGroupBbox(group1),
            entries: group1,
            isLeaf: true,
        },
        {
            bbox: calculateGroupBbox(group2),
            entries: group2,
            isLeaf: true,
        },
    ];
}

// ============================================
// Bounding Box Utilities
// ============================================

function bboxIntersects(a, b) {
    return a.minX <= b.maxX &&
        a.maxX >= b.minX &&
        a.minY <= b.maxY &&
        a.maxY >= b.minY;
}

function expandBbox(target, source) {
    target.minX = Math.min(target.minX, source.minX);
    target.minY = Math.min(target.minY, source.minY);
    target.maxX = Math.max(target.maxX, source.maxX);
    target.maxY = Math.max(target.maxY, source.maxY);
}

function bboxEnlargement(bbox, addBbox) {
    const newArea = (Math.max(bbox.maxX, addBbox.maxX) - Math.min(bbox.minX, addBbox.minX)) *
        (Math.max(bbox.maxY, addBbox.maxY) - Math.min(bbox.minY, addBbox.minY));
    const oldArea = (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);
    return newArea - oldArea;
}

function calculateGroupBbox(entries) {
    const bbox = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
    };

    for (const entry of entries) {
        expandBbox(bbox, entry.bbox);
    }

    return bbox;
}

function recalculateBbox(node) {
    if (node.entries.length === 0) return;

    node.bbox = calculateGroupBbox(node.entries);
}

// ============================================
// Entity Bounding Box Calculation
// ============================================

/**
 * Get bounding box for an entity
 * @param {Object} entity - CAD entity
 * @returns {Object} Bounding box { minX, minY, maxX, maxY }
 */
export function getEntityBoundingBox(entity) {
    switch (entity.type) {
        case 'line':
            return {
                minX: Math.min(entity.startPoint.x, entity.endPoint.x),
                minY: Math.min(entity.startPoint.y, entity.endPoint.y),
                maxX: Math.max(entity.startPoint.x, entity.endPoint.x),
                maxY: Math.max(entity.startPoint.y, entity.endPoint.y),
            };

        case 'circle':
            return {
                minX: entity.center.x - entity.radius,
                minY: entity.center.y - entity.radius,
                maxX: entity.center.x + entity.radius,
                maxY: entity.center.y + entity.radius,
            };

        case 'arc':
            return {
                minX: entity.center.x - entity.radius,
                minY: entity.center.y - entity.radius,
                maxX: entity.center.x + entity.radius,
                maxY: entity.center.y + entity.radius,
            };

        case 'ellipse':
            const rx = entity.radiusX || entity.radius;
            const ry = entity.radiusY || entity.radius;
            return {
                minX: entity.center.x - rx,
                minY: entity.center.y - ry,
                maxX: entity.center.x + rx,
                maxY: entity.center.y + ry,
            };

        case 'polyline':
        case 'spline':
            const points = entity.points || entity.controlPoints || [];
            if (points.length === 0) return null;
            return {
                minX: Math.min(...points.map(p => p.x)),
                minY: Math.min(...points.map(p => p.y)),
                maxX: Math.max(...points.map(p => p.x)),
                maxY: Math.max(...points.map(p => p.y)),
            };

        case 'rectangle':
            return {
                minX: entity.topLeft.x,
                minY: entity.topLeft.y,
                maxX: entity.topLeft.x + entity.width,
                maxY: entity.topLeft.y + entity.height,
            };

        case 'text':
        case 'point':
            const pos = entity.position;
            const size = entity.fontSize || entity.size || 1;
            return {
                minX: pos.x - size,
                minY: pos.y - size,
                maxX: pos.x + size,
                maxY: pos.y + size,
            };

        default:
            return null;
    }
}

// ============================================
// Viewport Culling
// ============================================

/**
 * Get entities visible in viewport (frustum culling)
 * @param {Object} index - Spatial index
 * @param {Object} viewport - { x, y, width, height, zoom }
 * @returns {Array} Visible entities
 */
export function getVisibleEntities(index, viewport) {
    const viewBbox = {
        minX: viewport.x - viewport.width / 2 / viewport.zoom,
        minY: viewport.y - viewport.height / 2 / viewport.zoom,
        maxX: viewport.x + viewport.width / 2 / viewport.zoom,
        maxY: viewport.y + viewport.height / 2 / viewport.zoom,
    };

    return indexQuery(index, viewBbox).map(r => r.entity);
}
