/**
 * Project explorer with layer and entity overview.
 */

import React, { useMemo, useCallback } from 'react';
import { useCADStore } from '../store/cadStore.js';
import './ProjectExplorer.css';

const ENTITY_ICONS = {
  line: 'LI',
  polyline: 'PL',
  circle: 'CI',
  arc: 'AR',
  rectangle: 'RE',
  text: 'TX',
  dimension: 'DM',
  hatch: 'HT',
  point: 'PT',
  ellipse: 'EL',
  spline: 'SP',
};

export function ProjectExplorer({ project, onClose }) {
  const { selectedEntityIds, selectEntity, clearSelection } = useCADStore();

  const entitiesByLayer = useMemo(() => {
    if (!project?.entities || !project?.layers) {
      return {};
    }

    const grouped = {};
    project.layers.forEach((layer) => {
      grouped[layer.id] = {
        layer,
        entities: project.entities.filter((entity) => entity.layerId === layer.id),
      };
    });
    return grouped;
  }, [project?.entities, project?.layers]);

  const countByType = useMemo(() => {
    if (!project?.entities) {
      return {};
    }

    const counts = {};
    project.entities.forEach((entity) => {
      counts[entity.type] = (counts[entity.type] || 0) + 1;
    });
    return counts;
  }, [project?.entities]);

  const handleEntityClick = useCallback((entity, event) => {
    event.stopPropagation();
    selectEntity(entity.id, event.ctrlKey || event.metaKey);
  }, [selectEntity]);

  const handleLayerClick = useCallback((entities) => {
    clearSelection();
    entities.forEach((entity) => selectEntity(entity.id, true));
  }, [clearSelection, selectEntity]);

  const totalEntities = project?.entities?.length || 0;

  return (
    <section className="project-explorer">
      <div className="project-explorer-header">
        <h3>Project Explorer</h3>
        <button type="button" className="close-btn" onClick={onClose}>Close</button>
      </div>

      <div className="explorer-summary">
        <div className="summary-item">
          <span className="summary-label">Objects</span>
          <span className="summary-value">{totalEntities}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Layers</span>
          <span className="summary-value">{project?.layers?.length || 0}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Selected</span>
          <span className="summary-value">{selectedEntityIds.length}</span>
        </div>
      </div>

      <div className="type-summary">
        {Object.entries(countByType).map(([type, count]) => (
          <div key={type} className="type-chip">
            <span className="type-icon">{ENTITY_ICONS[type] || '??'}</span>
            <span className="type-name">{type}</span>
            <span className="type-count">{count}</span>
          </div>
        ))}
      </div>

      <div className="layer-tree">
        {Object.entries(entitiesByLayer).map(([layerId, { layer, entities }]) => (
          <div key={layerId} className="layer-group">
            <div
              className="layer-header"
              onClick={() => handleLayerClick(entities)}
              style={{ borderLeftColor: layer.color }}
            >
              <span className="layer-visibility">{layer.visible ? 'VIS' : 'OFF'}</span>
              <span className="layer-name">{layer.name}</span>
              <span className="layer-count">({entities.length})</span>
            </div>

            {entities.length > 0 && (
              <div className="entity-list">
                {entities.slice(0, 50).map((entity, index) => (
                  <div
                    key={entity.id}
                    className={`entity-item ${selectedEntityIds.includes(entity.id) ? 'selected' : ''}`}
                    onClick={(event) => handleEntityClick(entity, event)}
                    title={`${entity.type} - ${entity.id.substring(0, 8)}`}
                  >
                    <span className="entity-icon">{ENTITY_ICONS[entity.type] || '??'}</span>
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
          <p>No entities in this project.</p>
          <p>Start drawing to populate explorer data.</p>
        </div>
      )}
    </section>
  );
}
