/**
 * Status bar with quick toggles and project state.
 */

import React from 'react';
import { formatLastSaveTime } from '../hooks/useAutoSave.js';
import './StatusBar.css';

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
  onShowFeedback,
  isOffline,
  projectName,
}) {
  const formatCoordinate = (value) => {
    switch (units) {
      case 'mm':
        return `${(value * 1000).toFixed(0)}`;
      case 'm':
        return value.toFixed(3);
      case 'ft':
        return (value * 3.28084).toFixed(3);
      case 'in':
        return (value * 39.3701).toFixed(2);
      default:
        return value.toFixed(3);
    }
  };

  const formatDistance = (value) => `${formatCoordinate(value)} ${units}`;
  const formatAngle = (degrees) => `${degrees.toFixed(1)} deg`;

  const toolDisplayNames = {
    select: 'Select',
    line: 'Line',
    polyline: 'Polyline',
    rectangle: 'Rectangle',
    circle: 'Circle',
    arc: 'Arc',
    text: 'Text',
    dimension: 'Dimension',
    measure: 'Measure',
    polygon: 'Polygon',
    trim: 'Trim',
    extend: 'Extend',
    offset: 'Offset',
    mirror: 'Mirror',
    rotate: 'Rotate',
    scale: 'Scale',
    array: 'Array',
    hatch: 'Hatch',
    pan: 'Pan',
    zoom: 'Zoom',
    surface: 'Surface',
  };

  return (
    <footer className="status-bar">
      <div className="status-bar-section status-bar-left">
        <div className="status-item status-project">
          <span className="status-value">{projectName || 'Untitled project'}</span>
          {isOffline && <span className="status-badge offline">Offline</span>}
        </div>

        <div className="status-item coordinates">
          <span className="status-label">X</span>
          <span className="status-value">{worldCoordinates ? formatCoordinate(worldCoordinates.x) : '---'}</span>
          <span className="status-label">Y</span>
          <span className="status-value">{worldCoordinates ? formatCoordinate(worldCoordinates.y) : '---'}</span>
        </div>

        {measurement && (
          <div className="status-item measurement">
            {measurement.distance !== undefined && (
              <>
                <span className="status-label">Dist</span>
                <span className="status-value highlight">{formatDistance(measurement.distance)}</span>
              </>
            )}
            {measurement.angle !== undefined && (
              <>
                <span className="status-label">Angle</span>
                <span className="status-value highlight">{formatAngle(measurement.angle)}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="status-bar-section status-bar-center">
        <div className="status-item"><span className="status-label">Tool</span><span className="status-value">{toolDisplayNames[activeTool] || activeTool}</span></div>
        <div className="status-item"><span className="status-label">Layer</span><span className="status-value">{activeLayer}</span></div>
        <div className="status-item"><span className="status-label">Objects</span><span className="status-value">{entityCount}</span></div>
        <div className="status-item"><span className="status-label">Layers</span><span className="status-value">{layerCount}</span></div>
        {selectedCount > 0 && <div className="status-item"><span className="status-value highlight">{selectedCount} selected</span></div>}
        {analysisStatus?.province && (
          <div className="status-item png-status">
            <span className="status-label">Province</span>
            <span className="status-value">{analysisStatus.province}</span>
            {analysisStatus.seismicZone && <span className="status-badge seismic">{analysisStatus.seismicZone}</span>}
          </div>
        )}
      </div>

      <div className="status-bar-section status-bar-right">
        <div className="status-toggles">
          <button className={`status-toggle ${gridEnabled ? 'active' : ''}`} onClick={onToggleGrid} title="Toggle Grid (G)">Grid</button>
          <button className={`status-toggle ${snapEnabled ? 'active' : ''}`} onClick={onToggleSnap} title="Toggle Snap (S)">Snap</button>
          <button className={`status-toggle ${orthoEnabled ? 'active' : ''}`} onClick={onToggleOrtho} title="Toggle Ortho (O)">Ortho</button>
        </div>

        <div className="status-item zoom-level">
          <span className="status-value">{Math.round(zoom * 100)}%</span>
        </div>

        <button className="status-action-btn" onClick={onToggleExplorer} title="Toggle project explorer">
          Explorer
        </button>
        <button className="status-action-btn" onClick={onShowHelp} title="Keyboard shortcuts">
          Help
        </button>
        <button className="status-action-btn" onClick={onShowFeedback} title="Send feedback">
          Feedback
        </button>

        <div className={`status-item save-status ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}>
          {isSaving ? (
            <span className="status-value saving">Saving...</span>
          ) : hasUnsavedChanges ? (
            <span className="status-value unsaved-indicator">Unsaved</span>
          ) : (
            <span className="status-value saved-time">{formatLastSaveTime(lastSaveTime)}</span>
          )}
        </div>
      </div>
    </footer>
  );
}
