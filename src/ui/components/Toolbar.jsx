/**
 * CAD toolbar with grouped tools.
 */

import React from 'react';
import './Toolbar.css';

const TOOLS = [
  { id: 'select', name: 'Select', icon: 'SE', shortcut: 'V', group: 'navigation' },
  { id: 'pan', name: 'Pan', icon: 'PA', shortcut: 'H', group: 'navigation' },
  { id: 'zoom', name: 'Zoom', icon: 'ZO', shortcut: 'Z', group: 'navigation' },

  { id: 'line', name: 'Line', icon: 'LI', shortcut: 'L', group: 'draw' },
  { id: 'polyline', name: 'Polyline', icon: 'PL', shortcut: 'P', group: 'draw' },
  { id: 'circle', name: 'Circle', icon: 'CI', shortcut: 'C', group: 'draw' },
  { id: 'arc', name: 'Arc', icon: 'AR', shortcut: 'A', group: 'draw' },
  { id: 'rectangle', name: 'Rect', icon: 'RE', shortcut: 'R', group: 'draw' },
  { id: 'polygon', name: 'Poly', icon: 'PG', shortcut: 'G', group: 'draw' },

  { id: 'trim', name: 'Trim', icon: 'TR', shortcut: 'TR', group: 'modify' },
  { id: 'extend', name: 'Extend', icon: 'EX', shortcut: 'EX', group: 'modify' },
  { id: 'offset', name: 'Offset', icon: 'OF', shortcut: 'O', group: 'modify' },
  { id: 'mirror', name: 'Mirror', icon: 'MI', shortcut: 'MI', group: 'modify' },
  { id: 'rotate', name: 'Rotate', icon: 'RO', shortcut: 'RO', group: 'modify' },
  { id: 'scale', name: 'Scale', icon: 'SC', shortcut: 'SC', group: 'modify' },
  { id: 'array', name: 'Array', icon: 'AY', shortcut: 'AR', group: 'modify' },

  { id: 'text', name: 'Text', icon: 'TX', shortcut: 'T', group: 'annotate' },
  { id: 'dimension', name: 'Dim', icon: 'DM', shortcut: 'D', group: 'annotate' },
  { id: 'measure', name: 'Measure', icon: 'MS', shortcut: 'M', group: 'annotate' },
  { id: 'hatch', name: 'Hatch', icon: 'HT', shortcut: 'HA', group: 'annotate' },

  { id: 'surface', name: 'Surface', icon: 'SF', shortcut: 'SU', group: 'surface' },
];

const GROUPS = [
  { id: 'navigation', label: 'Navigate' },
  { id: 'draw', label: 'Draw' },
  { id: 'modify', label: 'Modify' },
  { id: 'annotate', label: 'Annotate' },
  { id: 'surface', label: 'Surface' },
];

export function Toolbar({ activeTool, onToolChange }) {
  return (
    <aside className="toolbar">
      {GROUPS.map((group, index) => (
        <React.Fragment key={group.id}>
          <div className="toolbar-section">
            <div className="toolbar-section-title">{group.label}</div>
            <div className="toolbar-buttons">
              {TOOLS.filter((tool) => tool.group === group.id).map((tool) => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  isActive={activeTool === tool.id}
                  onClick={() => onToolChange(tool.id)}
                />
              ))}
            </div>
          </div>
          {index < GROUPS.length - 1 && <div className="toolbar-divider" />}
        </React.Fragment>
      ))}
    </aside>
  );
}

function ToolButton({ tool, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={`${tool.name} (${tool.shortcut})`}
    >
      <span className="toolbar-button-icon">{tool.icon}</span>
      <span className="toolbar-button-label">{tool.name}</span>
    </button>
  );
}
