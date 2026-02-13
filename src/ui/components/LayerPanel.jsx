/**
 * Layer management panel.
 */

import React, { useState } from 'react';
import { useCADStore } from '../store/cadStore.js';
import './LayerPanel.css';

export function LayerPanel({ layers, activeLayerId, onLayerSelect }) {
  const [newLayerName, setNewLayerName] = useState('');
  const [isAddingLayer, setIsAddingLayer] = useState(false);

  const {
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
  } = useCADStore();

  const handleAddLayer = () => {
    const normalized = newLayerName.trim();
    if (!normalized) {
      return;
    }

    addLayer(normalized);
    setNewLayerName('');
    setIsAddingLayer(false);
  };

  return (
    <aside className="layer-panel">
      <div className="panel-header">
        <h3>Layers</h3>
        <button
          type="button"
          className="add-layer-btn"
          onClick={() => setIsAddingLayer((prev) => !prev)}
          title="Add layer"
        >
          Add
        </button>
      </div>

      {isAddingLayer && (
        <div className="add-layer-form">
          <input
            type="text"
            value={newLayerName}
            onChange={(event) => setNewLayerName(event.target.value)}
            placeholder="Layer name"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleAddLayer();
              }
              if (event.key === 'Escape') {
                setIsAddingLayer(false);
              }
            }}
          />
          <button type="button" onClick={handleAddLayer}>Create</button>
        </div>
      )}

      <div className="layer-list">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${layer.id === activeLayerId ? 'active' : ''}`}
            onClick={() => onLayerSelect(layer.id)}
          >
            <div className="layer-controls">
              <button
                type="button"
                className={`visibility-btn ${layer.visible ? 'visible' : 'hidden'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? 'VIS' : 'OFF'}
              </button>
              <button
                type="button"
                className={`lock-btn ${layer.locked ? 'locked' : 'unlocked'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                title={layer.locked ? 'Unlock layer' : 'Lock layer'}
              >
                {layer.locked ? 'LOCK' : 'OPEN'}
              </button>
            </div>

            <input
              type="color"
              value={layer.color}
              onChange={(event) => updateLayer(layer.id, { color: event.target.value })}
              onClick={(event) => event.stopPropagation()}
              className="layer-color"
              title="Layer color"
            />

            <span className="layer-name">{layer.name}</span>

            {layer.id !== 'layer-0' && (
              <button
                type="button"
                className="delete-layer-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  if (window.confirm(`Delete layer "${layer.name}"?`)) {
                    deleteLayer(layer.id);
                  }
                }}
                title="Delete layer"
              >
                Del
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
