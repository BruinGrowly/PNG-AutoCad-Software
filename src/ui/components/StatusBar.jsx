/**
 * Status Bar Component
 * Displays current state, coordinates, measurements, and quick toggles
 */

import React, { useState, useEffect } from 'react';
import { formatLastSaveTime } from '../hooks/useAutoSave.js';
import './StatusBar.css';

/**
 * @param {Object} props
 * @param {{ x: number, y: number } | null} props.cursorPosition
 * @param {{ x: number, y: number } | null} props.worldCoordinates
 * @param {string} props.activeTool
 * @param {string} props.activeLayer
 * @param {number} props.zoom
 * @param {'mm' | 'm' | 'ft' | 'in'} props.units
 * @param {boolean} props.gridEnabled
 * @param {boolean} props.snapEnabled
 * @param {boolean} props.orthoEnabled
 * @param {Function} props.onToggleGrid
 * @param {Function} props.onToggleSnap
 * @param {Function} props.onToggleOrtho
 * @param {Object} [props.measurement]
 * @param {number} props.selectedCount
 * @param {number} props.entityCount
 * @param {number} props.layerCount
 * @param {Date | null} props.lastSaveTime
 * @param {boolean} props.hasUnsavedChanges
 * @param {boolean} props.isSaving
 * @param {Object} [props.analysisStatus]
 * @param {Function} props.onToggleExplorer
 * @param {Function} props.onShowHelp
 */
export function StatusBar({
  cursorPosition,
  worldCoordinates,
  activeTool,
  activeLayer,
  zoom,
  units,
  gridEnabled,
  snapEnabled,
  orthoEnabled,
  onToggleGrid,
  onToggleSnap,
  onToggleOrtho,
  measurement,
  selectedCount,
  entityCount = 0,
  layerCount = 0,
  lastSaveTime,
  hasUnsavedChanges,
  isSaving,
  analysisStatus,
  onToggleExplorer,
  onShowHelp,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCoordinate = (value) => {
    switch (units) {
      case 'mm': return `${(value * 1000).toFixed(0)}`;
      case 'm': return value.toFixed(3);
      case 'ft': return (value * 3.28084).toFixed(3);
      case 'in': return (value * 39.3701).toFixed(2);
      default: return value.toFixed(3);
    }
  };

  const formatDistance = (value) => `${formatCoordinate(value)} ${units}`;
  const formatAngle = (degrees) => `${degrees.toFixed(1)}°`;

  const toolDisplayNames = {
    select: 'Select', line: 'Line', polyline: 'Polyline', rectangle: 'Rectangle',
    circle: 'Circle', arc: 'Arc', text: 'Text', dimension: 'Dimension', measure: 'Measure',
    polygon: 'Polygon', trim: 'Trim', extend: 'Extend', offset: 'Offset',
    mirror: 'Mirror', rotate: 'Rotate', scale: 'Scale', array: 'Array', hatch: 'Hatch',
  };

  return (
    <div className="status-bar">
      <div className="status-bar-section status-bar-left">
        <div className="status-item coordinates">
          <span className="status-label">X:</span>
          <span className="status-value">{worldCoordinates ? formatCoordinate(worldCoordinates.x) : '---'}</span>
          <span className="status-label">Y:</span>
          <span className="status-value">{worldCoordinates ? formatCoordinate(worldCoordinates.y) : '---'}</span>
        </div>
        {measurement && (
          <div className="status-item measurement">
            {measurement.distance !== undefined && (
              <><span className="status-label">Dist:</span><span className="status-value highlight">{formatDistance(measurement.distance)}</span></>
            )}
            {measurement.angle !== undefined && (
              <><span className="status-label">Angle:</span><span className="status-value highlight">{formatAngle(measurement.angle)}</span></>
            )}
          </div>
        )}
      </div>
      <div className="status-bar-section status-bar-center">
        <div className="status-item"><span className="status-label">Tool:</span><span className="status-value">{toolDisplayNames[activeTool] || activeTool}</span></div>
        <div className="status-item"><span className="status-label">Layer:</span><span className="status-value">{activeLayer}</span></div>
        {selectedCount > 0 && <div className="status-item"><span className="status-value highlight">{selectedCount} selected</span></div>}

        {/* Entity count - click to toggle explorer */}
        <div className="status-item entity-count" onClick={onToggleExplorer} title="Toggle Project Explorer (E)">
          <span className="status-label">Objects:</span>
          <span className="status-value">{entityCount}</span>
        </div>

        {analysisStatus?.province && (
          <div className="status-item png-status">
            <span className="status-label">Province:</span><span className="status-value">{analysisStatus.province}</span>
            {analysisStatus.seismicZone && <span className="status-badge seismic">{analysisStatus.seismicZone}</span>}
          </div>
        )}
      </div>
      <div className="status-bar-section status-bar-right">
        <div className="status-toggles">
          <button className={`status-toggle ${gridEnabled ? 'active' : ''}`} onClick={onToggleGrid} title="Toggle Grid (G)">GRID</button>
          <button className={`status-toggle ${snapEnabled ? 'active' : ''}`} onClick={onToggleSnap} title="Toggle Snap (S)">SNAP</button>
          <button className={`status-toggle ${orthoEnabled ? 'active' : ''}`} onClick={onToggleOrtho} title="Toggle Ortho (O)">ORTHO</button>
        </div>
        <div className="status-item zoom-level"><span className="status-value">{Math.round(zoom * 100)}%</span></div>

        {/* Help button */}
        <button className="status-help-btn" onClick={onShowHelp} title="Keyboard Shortcuts (?)">
          ?
        </button>

        <div className={`status-item save-status ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}>
          {isSaving ? <span className="status-value saving">Saving...</span>
            : hasUnsavedChanges ? <span className="status-value unsaved-indicator">● Unsaved</span>
              : <span className="status-value saved-time">{formatLastSaveTime(lastSaveTime)}</span>}
        </div>
      </div>
    </div>
  );
}
