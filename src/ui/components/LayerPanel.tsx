/**
 * Layer Panel Component
 * Layer management for the CAD application
 */

import React, { useState } from 'react';
import type { Layer } from '../../core/types';
import { useCADStore } from '../store/cadStore';
import './LayerPanel.css';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onLayerSelect: (layerId: string) => void;
}

export function LayerPanel({ layers, activeLayerId, onLayerSelect }: LayerPanelProps) {
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
    if (newLayerName.trim()) {
      addLayer(newLayerName.trim());
      setNewLayerName('');
      setIsAddingLayer(false);
    }
  };

  const handleColorChange = (layerId: string, color: string) => {
    updateLayer(layerId, { color });
  };

  return (
    <div className="layer-panel">
      <div className="panel-header">
        <h3>Layers</h3>
        <button
          className="add-layer-btn"
          onClick={() => setIsAddingLayer(true)}
          title="Add Layer"
        >
          +
        </button>
      </div>

      {isAddingLayer && (
        <div className="add-layer-form">
          <input
            type="text"
            value={newLayerName}
            onChange={(e) => setNewLayerName(e.target.value)}
            placeholder="Layer name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddLayer();
              if (e.key === 'Escape') setIsAddingLayer(false);
            }}
          />
          <button onClick={handleAddLayer}>Add</button>
          <button onClick={() => setIsAddingLayer(false)}>Cancel</button>
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
                className={`visibility-btn ${layer.visible ? 'visible' : 'hidden'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerVisibility(layer.id);
                }}
                title={layer.visible ? 'Hide Layer' : 'Show Layer'}
              >
                {layer.visible ? '👁' : '👁‍🗨'}
              </button>
              <button
                className={`lock-btn ${layer.locked ? 'locked' : 'unlocked'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayerLock(layer.id);
                }}
                title={layer.locked ? 'Unlock Layer' : 'Lock Layer'}
              >
                {layer.locked ? '🔒' : '🔓'}
              </button>
            </div>

            <input
              type="color"
              value={layer.color}
              onChange={(e) => handleColorChange(layer.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="layer-color"
              title="Layer Color"
            />

            <span className="layer-name">{layer.name}</span>

            {layer.id !== 'layer-0' && (
              <button
                className="delete-layer-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete layer "${layer.name}"?`)) {
                    deleteLayer(layer.id);
                  }
                }}
                title="Delete Layer"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
