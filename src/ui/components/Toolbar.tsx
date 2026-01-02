/**
 * CAD Toolbar Component
 * Drawing tools and actions
 */

import React from 'react';
import type { DrawingTool } from '../../core/types';
import './Toolbar.css';

interface ToolbarProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
}

interface ToolDefinition {
  id: DrawingTool;
  name: string;
  icon: string;
  shortcut: string;
  group: 'navigation' | 'draw' | 'modify' | 'annotate';
}

const TOOLS: ToolDefinition[] = [
  // Navigation
  { id: 'select', name: 'Select', icon: '⬚', shortcut: 'V', group: 'navigation' },
  { id: 'pan', name: 'Pan', icon: '✋', shortcut: 'H', group: 'navigation' },
  { id: 'zoom', name: 'Zoom', icon: '🔍', shortcut: 'Z', group: 'navigation' },

  // Drawing
  { id: 'line', name: 'Line', icon: '╱', shortcut: 'L', group: 'draw' },
  { id: 'polyline', name: 'Polyline', icon: '⌇', shortcut: 'P', group: 'draw' },
  { id: 'circle', name: 'Circle', icon: '○', shortcut: 'C', group: 'draw' },
  { id: 'arc', name: 'Arc', icon: '⌒', shortcut: 'A', group: 'draw' },
  { id: 'rectangle', name: 'Rectangle', icon: '▭', shortcut: 'R', group: 'draw' },
  { id: 'polygon', name: 'Polygon', icon: '⬡', shortcut: 'G', group: 'draw' },

  // Modify
  { id: 'trim', name: 'Trim', icon: '✂', shortcut: 'TR', group: 'modify' },
  { id: 'extend', name: 'Extend', icon: '↔', shortcut: 'EX', group: 'modify' },
  { id: 'offset', name: 'Offset', icon: '⧉', shortcut: 'O', group: 'modify' },
  { id: 'mirror', name: 'Mirror', icon: '⌀', shortcut: 'MI', group: 'modify' },
  { id: 'rotate', name: 'Rotate', icon: '↻', shortcut: 'RO', group: 'modify' },
  { id: 'scale', name: 'Scale', icon: '⊡', shortcut: 'SC', group: 'modify' },
  { id: 'array', name: 'Array', icon: '▦', shortcut: 'AR', group: 'modify' },

  // Annotate
  { id: 'text', name: 'Text', icon: 'T', shortcut: 'T', group: 'annotate' },
  { id: 'dimension', name: 'Dimension', icon: '↔︎', shortcut: 'D', group: 'annotate' },
  { id: 'measure', name: 'Measure', icon: '📏', shortcut: 'M', group: 'annotate' },
  { id: 'hatch', name: 'Hatch', icon: '▤', shortcut: 'HA', group: 'annotate' },
];

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  const groupedTools = {
    navigation: TOOLS.filter((t) => t.group === 'navigation'),
    draw: TOOLS.filter((t) => t.group === 'draw'),
    modify: TOOLS.filter((t) => t.group === 'modify'),
    annotate: TOOLS.filter((t) => t.group === 'annotate'),
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="toolbar-section-title">Navigate</div>
        <div className="toolbar-buttons">
          {groupedTools.navigation.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <div className="toolbar-section-title">Draw</div>
        <div className="toolbar-buttons">
          {groupedTools.draw.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <div className="toolbar-section-title">Modify</div>
        <div className="toolbar-buttons">
          {groupedTools.modify.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-section">
        <div className="toolbar-section-title">Annotate</div>
        <div className="toolbar-buttons">
          {groupedTools.annotate.map((tool) => (
            <ToolButton
              key={tool.id}
              tool={tool}
              isActive={activeTool === tool.id}
              onClick={() => onToolChange(tool.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: ToolDefinition;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps) {
  return (
    <button
      className={`toolbar-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={`${tool.name} (${tool.shortcut})`}
    >
      <span className="toolbar-button-icon">{tool.icon}</span>
      <span className="toolbar-button-label">{tool.name}</span>
    </button>
  );
}
