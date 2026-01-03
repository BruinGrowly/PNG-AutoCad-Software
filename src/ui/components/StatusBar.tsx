/**
 * Status Bar Component
 * Displays current state, coordinates, measurements, and quick toggles
 */

import React, { useState, useEffect } from 'react';
import { formatLastSaveTime } from '../hooks/useAutoSave';
import './StatusBar.css';

export interface StatusBarProps {
  // Coordinates
  cursorPosition: { x: number; y: number } | null;
  worldCoordinates: { x: number; y: number } | null;

  // Current state
  activeTool: string;
  activeLayer: string;
  zoom: number;
  units: 'mm' | 'm' | 'ft' | 'in';

  // Toggles
  gridEnabled: boolean;
  snapEnabled: boolean;
  orthoEnabled: boolean;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onToggleOrtho: () => void;

  // Measurements (while drawing)
  measurement?: {
    distance?: number;
    angle?: number;
    area?: number;
  };

  // Selection info
  selectedCount: number;

  // Save status
  lastSaveTime: Date | null;
  hasUnsavedChanges: boolean;
  isSaving: boolean;

  // Optional: PNG analysis status
  analysisStatus?: {
    province?: string;
    seismicZone?: string;
    climateZone?: string;
  };
}

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
  lastSaveTime,
  hasUnsavedChanges,
  isSaving,
  analysisStatus,
}: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCoordinate = (value: number): string => {
    switch (units) {
      case 'mm': return `${(value * 1000).toFixed(0)}`;
      case 'm': return value.toFixed(3);
      case 'ft': return (value * 3.28084).toFixed(3);
      case 'in': return (value * 39.3701).toFixed(2);
      default: return value.toFixed(3);
    }
  };

  const formatDistance = (value: number): string => `${formatCoordinate(value)} ${units}`;
  const formatAngle = (degrees: number): string => `${degrees.toFixed(1)}°`;

  const toolDisplayNames: Record<string, string> = {
    select: 'Select', line: 'Line', polyline: 'Polyline', rectangle: 'Rectangle',
    circle: 'Circle', arc: 'Arc', text: 'Text', dimension: 'Dimension', measure: 'Measure',
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
        <div className={`status-item save-status ${hasUnsavedChanges ? 'unsaved' : 'saved'}`}>
          {isSaving ? <span className="status-value saving">Saving...</span>
            : hasUnsavedChanges ? <span className="status-value unsaved-indicator">● Unsaved</span>
            : <span className="status-value saved-time">{formatLastSaveTime(lastSaveTime)}</span>}
        </div>
      </div>
    </div>
  );
}
