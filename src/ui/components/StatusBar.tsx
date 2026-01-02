/**
 * Status Bar Component
 * Bottom status bar showing current state
 */

import React from 'react';
import type { DrawingTool } from '../../core/types';
import './StatusBar.css';

interface StatusBarProps {
  activeTool: DrawingTool;
  selectedCount: number;
  zoom: number;
  isOffline: boolean;
  projectName: string;
}

const TOOL_HINTS: Record<DrawingTool, string> = {
  select: 'Click to select objects, drag to box select',
  pan: 'Click and drag to pan the view',
  zoom: 'Click to zoom in, right-click to zoom out',
  line: 'Click start point, then click end point',
  polyline: 'Click points, double-click or right-click to finish',
  circle: 'Click center, then click to set radius',
  arc: 'Click center, then start point, then end point',
  rectangle: 'Click first corner, then opposite corner',
  polygon: 'Click center, then click to set radius',
  text: 'Click to place text',
  dimension: 'Click first point, then second point, then text position',
  hatch: 'Click inside closed boundary',
  block: 'Click to place block',
  measure: 'Click points to measure distance',
  trim: 'Select cutting edges, then click objects to trim',
  extend: 'Select boundary edges, then click objects to extend',
  offset: 'Enter offset distance, select object, then click side',
  mirror: 'Select objects, then define mirror line',
  rotate: 'Select objects, then click center and rotation angle',
  scale: 'Select objects, then click base point and scale factor',
  array: 'Select objects, then define array parameters',
};

export function StatusBar({
  activeTool,
  selectedCount,
  zoom,
  isOffline,
  projectName,
}: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="tool-name">
          {activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}
        </span>
        <span className="tool-hint">{TOOL_HINTS[activeTool]}</span>
      </div>

      <div className="status-center">
        {selectedCount > 0 && (
          <span className="selection-count">
            {selectedCount} object{selectedCount !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>

      <div className="status-right">
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>

        <span className="snap-status">
          <span title="Grid">G</span>
          <span title="Snap">S</span>
          <span title="Ortho">O</span>
        </span>

        {isOffline && (
          <span className="offline-status" title="Working offline - changes saved locally">
            Offline
          </span>
        )}

        <span className="project-name" title={projectName}>
          {projectName}
        </span>
      </div>
    </div>
  );
}
