/**
 * Layer-Based Rendering Utilities
 * Provides bylayer and byblock color resolution for CAD entities
 */

// ============================================
// Special Color Values
// ============================================

export const BYLAYER = 'bylayer';
export const BYBLOCK = 'byblock';

// ============================================
// Color Resolution
// ============================================

/**
 * Resolve the actual color for an entity based on layer settings
 * @param {Object} entity - Entity to get color for
 * @param {Array} layers - Array of layer objects
 * @param {Object} blockContext - Optional block context for BYBLOCK resolution
 * @returns {string} Resolved hex color string
 */
export function resolveEntityColor(entity, layers, blockContext = null) {
    const entityColor = entity.style?.strokeColor;

    // If entity has explicit color, use it
    if (entityColor && entityColor !== BYLAYER && entityColor !== BYBLOCK) {
        return entityColor;
    }

    // BYBLOCK: Use the color of the block instance
    if (entityColor === BYBLOCK && blockContext) {
        return blockContext.color || resolveLayerColor(blockContext.layerId, layers);
    }

    // BYLAYER: Use the layer's color
    return resolveLayerColor(entity.layerId, layers);
}

/**
 * Get the color for a layer
 * @param {string} layerId - Layer ID
 * @param {Array} layers - Array of layer objects
 * @returns {string} Layer color or default
 */
export function resolveLayerColor(layerId, layers) {
    const layer = layers.find(l => l.id === layerId);
    return layer?.color || '#000000';
}

/**
 * Resolve the actual line weight for an entity
 */
export function resolveEntityLineWeight(entity, layers) {
    const entityWeight = entity.style?.strokeWidth;

    if (entityWeight && entityWeight !== 'bylayer') {
        return entityWeight;
    }

    const layer = layers.find(l => l.id === entity.layerId);
    return layer?.lineWeight || 1;
}

/**
 * Resolve the line type for an entity
 */
export function resolveEntityLineType(entity, layers) {
    const entityType = entity.style?.lineType;

    if (entityType && entityType !== 'bylayer') {
        return entityType;
    }

    const layer = layers.find(l => l.id === entity.layerId);
    return layer?.lineType || 'continuous';
}

// ============================================
// Entity Visibility
// ============================================

/**
 * Check if an entity should be visible based on entity and layer settings
 * @param {Object} entity - Entity to check
 * @param {Array} layers - Array of layer objects
 * @returns {boolean} Whether entity should be rendered
 */
export function isEntityVisible(entity, layers) {
    // Entity's own visibility
    if (!entity.visible) return false;

    // Layer visibility
    const layer = layers.find(l => l.id === entity.layerId);
    if (layer && !layer.visible) return false;

    // Frozen layers (if using that concept)
    if (layer && layer.frozen) return false;

    return true;
}

/**
 * Check if an entity can be selected (not locked)
 */
export function isEntitySelectable(entity, layers) {
    // Entity must be visible to be selectable
    if (!isEntityVisible(entity, layers)) return false;

    // Entity's own lock status
    if (entity.locked) return false;

    // Layer lock status
    const layer = layers.find(l => l.id === entity.layerId);
    if (layer && layer.locked) return false;

    return true;
}

// ============================================
// Render Style Resolution
// ============================================

/**
 * Get complete render style for an entity
 * @param {Object} entity - Entity to style
 * @param {Array} layers - Layer array
 * @param {Object} blockContext - Optional block context
 * @returns {Object} Complete style object for rendering
 */
export function getEntityRenderStyle(entity, layers, blockContext = null) {
    return {
        strokeColor: resolveEntityColor(entity, layers, blockContext),
        strokeWidth: resolveEntityLineWeight(entity, layers),
        lineType: resolveEntityLineType(entity, layers),
        fillColor: entity.style?.fillColor || 'none',
        opacity: entity.style?.opacity ?? 1,
    };
}

/**
 * Get CSS dash array for line type
 * @param {string} lineType - Line type name
 * @param {number} scale - Scale factor for dash lengths
 * @returns {string} SVG stroke-dasharray value
 */
export function getLineDashArray(lineType, scale = 1) {
    const patterns = {
        'continuous': 'none',
        'solid': 'none',
        'dashed': `${8 * scale},${4 * scale}`,
        'dotted': `${2 * scale},${4 * scale}`,
        'dashdot': `${8 * scale},${3 * scale},${2 * scale},${3 * scale}`,
        'dashdotdot': `${8 * scale},${3 * scale},${2 * scale},${3 * scale},${2 * scale},${3 * scale}`,
        'center': `${12 * scale},${3 * scale},${4 * scale},${3 * scale}`,
        'hidden': `${4 * scale},${4 * scale}`,
        'phantom': `${12 * scale},${3 * scale},${2 * scale},${3 * scale},${2 * scale},${3 * scale}`,
    };

    return patterns[lineType?.toLowerCase()] || 'none';
}

// ============================================
// Layer Operations
// ============================================

/**
 * Get all entities on a specific layer
 */
export function getEntitiesOnLayer(entities, layerId) {
    return entities.filter(e => e.layerId === layerId);
}

/**
 * Move entities to a different layer
 * @param {Array} entities - Entities to move
 * @param {string} newLayerId - Target layer ID
 * @returns {Array} Updated entities
 */
export function moveEntitiesToLayer(entities, newLayerId) {
    return entities.map(entity => ({
        ...entity,
        layerId: newLayerId,
    }));
}

/**
 * Set entity color to BYLAYER
 */
export function setEntityColorByLayer(entity) {
    return {
        ...entity,
        style: {
            ...entity.style,
            strokeColor: BYLAYER,
        },
    };
}

/**
 * Set entity color to BYBLOCK
 */
export function setEntityColorByBlock(entity) {
    return {
        ...entity,
        style: {
            ...entity.style,
            strokeColor: BYBLOCK,
        },
    };
}

/**
 * Override entity color with explicit value
 */
export function setEntityExplicitColor(entity, color) {
    return {
        ...entity,
        style: {
            ...entity.style,
            strokeColor: color,
        },
    };
}

// ============================================
// Layer Sorting for Render Order
// ============================================

/**
 * Sort entities by layer order for proper z-ordering during render
 */
export function sortEntitiesByLayerOrder(entities, layers) {
    const layerOrderMap = new Map(layers.map(l => [l.id, l.order ?? 0]));

    return [...entities].sort((a, b) => {
        const orderA = layerOrderMap.get(a.layerId) ?? 0;
        const orderB = layerOrderMap.get(b.layerId) ?? 0;
        return orderA - orderB;
    });
}
