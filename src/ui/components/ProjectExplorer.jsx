/**
 * Project Explorer Component
 * Shows entity tree view with click-to-select functionality
 */

import React, { useMemo, useCallback } from 'react';
import { useCADStore } from '../store/cadStore.js';
import './ProjectExplorer.css';

// Entity type icons (using Unicode symbols for simplicity)
const ENTITY_ICONS = {
    line: '─',
    polyline: '⌇',
    circle: '○',
    arc: '⌒',
    rectangle: '▢',
    text: 'T',
    dimension: '↔',
    hatch: '▤',
    point: '•',
    ellipse: '⬭',
    spline: '〜',
};

export function ProjectExplorer({ project, onClose }) {
    const { selectedEntityIds, selectEntity, clearSelection, setZoom, setPan } = useCADStore();

    // Group entities by layer
    const entitiesByLayer = useMemo(() => {
        if (!project?.entities || !project?.layers) return {};

        const grouped = {};
        project.layers.forEach(layer => {
            grouped[layer.id] = {
                layer,
                entities: project.entities.filter(e => e.layerId === layer.id),
            };
        });
        return grouped;
    }, [project?.entities, project?.layers]);

    // Count by type
    const countByType = useMemo(() => {
        if (!project?.entities) return {};

        const counts = {};
        project.entities.forEach(e => {
            counts[e.type] = (counts[e.type] || 0) + 1;
        });
        return counts;
    }, [project?.entities]);

    // Handle entity click - select and zoom to it
    const handleEntityClick = useCallback((entity, event) => {
        event.stopPropagation();
        selectEntity(entity.id, event.ctrlKey || event.metaKey);
    }, [selectEntity]);

    // Handle layer click - select all entities on layer
    const handleLayerClick = useCallback((layerId, entities) => {
        clearSelection();
        entities.forEach(e => selectEntity(e.id, true));
    }, [clearSelection, selectEntity]);

    // Get entity center for potential zoom-to
    const getEntityCenter = (entity) => {
        switch (entity.type) {
            case 'line':
                return {
                    x: (entity.startPoint.x + entity.endPoint.x) / 2,
                    y: (entity.startPoint.y + entity.endPoint.y) / 2,
                };
            case 'circle':
            case 'arc':
                return entity.center;
            case 'rectangle':
                return {
                    x: entity.topLeft.x + entity.width / 2,
                    y: entity.topLeft.y + entity.height / 2,
                };
            case 'text':
                return entity.position;
            case 'polyline':
                if (entity.points && entity.points.length > 0) {
                    const sumX = entity.points.reduce((s, p) => s + p.x, 0);
                    const sumY = entity.points.reduce((s, p) => s + p.y, 0);
                    return { x: sumX / entity.points.length, y: sumY / entity.points.length };
                }
                return { x: 0, y: 0 };
            default:
                return { x: 0, y: 0 };
        }
    };

    const totalEntities = project?.entities?.length || 0;

    return (
        <div className="project-explorer">
            <div className="project-explorer-header">
                <h3>📂 Project Explorer</h3>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Summary */}
            <div className="explorer-summary">
                <div className="summary-item">
                    <span className="summary-label">Objects:</span>
                    <span className="summary-value">{totalEntities}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Layers:</span>
                    <span className="summary-value">{project?.layers?.length || 0}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Selected:</span>
                    <span className="summary-value">{selectedEntityIds.length}</span>
                </div>
            </div>

            {/* Type summary */}
            <div className="type-summary">
                {Object.entries(countByType).map(([type, count]) => (
                    <div key={type} className="type-chip">
                        <span className="type-icon">{ENTITY_ICONS[type] || '?'}</span>
                        <span className="type-name">{type}</span>
                        <span className="type-count">{count}</span>
                    </div>
                ))}
            </div>

            {/* Layer tree */}
            <div className="layer-tree">
                {Object.entries(entitiesByLayer).map(([layerId, { layer, entities }]) => (
                    <div key={layerId} className="layer-group">
                        <div
                            className="layer-header"
                            onClick={() => handleLayerClick(layerId, entities)}
                            style={{ borderLeftColor: layer.color }}
                        >
                            <span className="layer-icon">{layer.visible ? '👁' : '👁‍🗨'}</span>
                            <span className="layer-name">{layer.name}</span>
                            <span className="layer-count">({entities.length})</span>
                        </div>

                        {entities.length > 0 && (
                            <div className="entity-list">
                                {entities.slice(0, 50).map((entity, index) => (
                                    <div
                                        key={entity.id}
                                        className={`entity-item ${selectedEntityIds.includes(entity.id) ? 'selected' : ''}`}
                                        onClick={(e) => handleEntityClick(entity, e)}
                                        title={`${entity.type} - ${entity.id.substring(0, 8)}`}
                                    >
                                        <span className="entity-icon">{ENTITY_ICONS[entity.type] || '?'}</span>
                                        <span className="entity-type">{entity.type}</span>
                                        <span className="entity-index">#{index + 1}</span>
                                    </div>
                                ))}
                                {entities.length > 50 && (
                                    <div className="entity-overflow">
                                        ... and {entities.length - 50} more
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {totalEntities === 0 && (
                <div className="empty-state">
                    <p>No entities in project.</p>
                    <p>Start drawing to see them here!</p>
                </div>
            )}
        </div>
    );
}
