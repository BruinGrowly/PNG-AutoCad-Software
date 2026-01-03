/**
 * Keyboard Shortcuts Hook
 * Manages keyboard shortcuts for the CAD application
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} KeyboardShortcut
 * @property {string} key - The key to press
 * @property {boolean} [ctrl] - Whether Ctrl is required
 * @property {boolean} [shift] - Whether Shift is required
 * @property {boolean} [alt] - Whether Alt is required
 * @property {boolean} [meta] - Whether Meta (Cmd on Mac) is required
 * @property {Function} action - The action to perform
 * @property {string} description - Description of the shortcut
 * @property {string} category - Category for grouping
 */

// Default shortcuts for the CAD application
export const DEFAULT_SHORTCUTS = [
  // File operations
  { key: 'n', ctrl: true, action: 'newProject', description: 'New Project', category: 'file' },
  { key: 'o', ctrl: true, action: 'openProject', description: 'Open Project', category: 'file' },
  { key: 's', ctrl: true, action: 'saveProject', description: 'Save Project', category: 'file' },
  { key: 's', ctrl: true, shift: true, action: 'saveProjectAs', description: 'Save As', category: 'file' },
  { key: 'e', ctrl: true, action: 'exportDXF', description: 'Export DXF', category: 'file' },
  { key: 'p', ctrl: true, action: 'print', description: 'Print', category: 'file' },

  // Edit operations
  { key: 'z', ctrl: true, action: 'undo', description: 'Undo', category: 'edit' },
  { key: 'y', ctrl: true, action: 'redo', description: 'Redo', category: 'edit' },
  { key: 'z', ctrl: true, shift: true, action: 'redo', description: 'Redo (Alt)', category: 'edit' },
  { key: 'x', ctrl: true, action: 'cut', description: 'Cut', category: 'edit' },
  { key: 'c', ctrl: true, action: 'copy', description: 'Copy', category: 'edit' },
  { key: 'v', ctrl: true, action: 'paste', description: 'Paste', category: 'edit' },
  { key: 'a', ctrl: true, action: 'selectAll', description: 'Select All', category: 'edit' },
  { key: 'Delete', action: 'delete', description: 'Delete Selected', category: 'edit' },
  { key: 'Escape', action: 'cancel', description: 'Cancel / Deselect', category: 'edit' },

  // View operations
  { key: 'f', ctrl: true, action: 'zoomFit', description: 'Zoom to Fit', category: 'view' },
  { key: '0', ctrl: true, action: 'zoomReset', description: 'Reset Zoom', category: 'view' },
  { key: '+', ctrl: true, action: 'zoomIn', description: 'Zoom In', category: 'view' },
  { key: '-', ctrl: true, action: 'zoomOut', description: 'Zoom Out', category: 'view' },
  { key: 'g', action: 'toggleGrid', description: 'Toggle Grid', category: 'view' },

  // Drawing tools
  { key: 'v', action: 'selectTool', description: 'Select Tool', category: 'draw' },
  { key: 'l', action: 'lineTool', description: 'Line Tool', category: 'draw' },
  { key: 'p', action: 'polylineTool', description: 'Polyline Tool', category: 'draw' },
  { key: 'r', action: 'rectangleTool', description: 'Rectangle Tool', category: 'draw' },
  { key: 'c', action: 'circleTool', description: 'Circle Tool', category: 'draw' },
  { key: 'a', action: 'arcTool', description: 'Arc Tool', category: 'draw' },
  { key: 't', action: 'textTool', description: 'Text Tool', category: 'draw' },
  { key: 'd', action: 'dimensionTool', description: 'Dimension Tool', category: 'draw' },
  { key: 'm', action: 'measureTool', description: 'Measure Tool', category: 'draw' },

  // Modify tools
  { key: 'm', ctrl: true, action: 'moveTool', description: 'Move', category: 'tools' },
  { key: 'r', ctrl: true, action: 'rotateTool', description: 'Rotate', category: 'tools' },
  { key: 's', alt: true, action: 'scaleTool', description: 'Scale', category: 'tools' },
  { key: 'o', ctrl: true, action: 'offsetTool', description: 'Offset', category: 'tools' },
  { key: 't', ctrl: true, action: 'trimTool', description: 'Trim', category: 'tools' },
  { key: 'x', ctrl: true, shift: true, action: 'extendTool', description: 'Extend', category: 'tools' },
  { key: 'i', ctrl: true, action: 'mirrorTool', description: 'Mirror', category: 'tools' },

  // Snap toggles
  { key: 's', action: 'toggleSnap', description: 'Toggle Snap', category: 'tools' },
  { key: 'o', action: 'toggleOrtho', description: 'Toggle Ortho', category: 'tools' },

  // PNG Analysis
  { key: '1', alt: true, action: 'climateAnalysis', description: 'Climate Analysis', category: 'png-analysis' },
  { key: '2', alt: true, action: 'seismicAnalysis', description: 'Seismic Analysis', category: 'png-analysis' },
  { key: '3', alt: true, action: 'floodAnalysis', description: 'Flood Analysis', category: 'png-analysis' },
  { key: '4', alt: true, action: 'materialsDatabase', description: 'Materials Database', category: 'png-analysis' },
  { key: '5', alt: true, action: 'structuralReport', description: 'Structural Report', category: 'png-analysis' },

  // Navigation
  { key: 'ArrowUp', action: 'panUp', description: 'Pan Up', category: 'navigation' },
  { key: 'ArrowDown', action: 'panDown', description: 'Pan Down', category: 'navigation' },
  { key: 'ArrowLeft', action: 'panLeft', description: 'Pan Left', category: 'navigation' },
  { key: 'ArrowRight', action: 'panRight', description: 'Pan Right', category: 'navigation' },
  { key: 'Home', action: 'panHome', description: 'Return to Origin', category: 'navigation' },

  // Help
  { key: 'F1', action: 'help', description: 'Help', category: 'help' },
  { key: '/', ctrl: true, action: 'shortcuts', description: 'Show Shortcuts', category: 'help' },
];

/**
 * Hook for managing keyboard shortcuts
 * @param {Object} handlers - Object mapping action names to handler functions
 * @param {Object} options - Options
 * @param {boolean} [options.enabled=true] - Whether shortcuts are enabled
 * @param {Array} [options.shortcuts] - Custom shortcuts array
 */
export function useKeyboardShortcuts(handlers, options = {}) {
  const {
    enabled = true,
    shortcuts = DEFAULT_SHORTCUTS,
  } = options;

  const handlersRef = useRef(handlers);

  // Update handlers ref when handlers change
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Don't handle shortcuts when typing in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      const altMatch = !!shortcut.alt === event.altKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch;
    });

    if (matchingShortcut) {
      const handler = handlersRef.current[matchingShortcut.action];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Get shortcuts grouped by category
 * @param {Array} shortcuts
 * @returns {Object}
 */
export function getShortcutsByCategory(shortcuts = DEFAULT_SHORTCUTS) {
  return shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});
}

/**
 * Format a shortcut for display
 * @param {Object} shortcut
 * @returns {string}
 */
export function formatShortcut(shortcut) {
  const parts = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
  return parts.join('+');
}
