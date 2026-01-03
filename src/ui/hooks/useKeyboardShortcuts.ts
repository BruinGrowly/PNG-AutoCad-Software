/**
 * Keyboard Shortcuts Manager
 * Provides customizable keyboard shortcuts with conflict detection
 */

import { useEffect, useCallback, useState } from 'react';

export interface KeyboardShortcut {
  id: string;
  keys: string[];  // e.g., ['Ctrl', 'S'] or ['Escape']
  description: string;
  category: 'file' | 'edit' | 'view' | 'draw' | 'tools' | 'png-analysis' | 'navigation';
  action: () => void;
  enabled?: boolean;
}

export interface ShortcutCategory {
  name: string;
  shortcuts: KeyboardShortcut[];
}

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  // File operations
  { id: 'new-project', keys: ['Ctrl', 'N'], description: 'New Project', category: 'file' },
  { id: 'open-project', keys: ['Ctrl', 'O'], description: 'Open Project', category: 'file' },
  { id: 'save-project', keys: ['Ctrl', 'S'], description: 'Save Project', category: 'file' },
  { id: 'save-as', keys: ['Ctrl', 'Shift', 'S'], description: 'Save As', category: 'file' },
  { id: 'export', keys: ['Ctrl', 'E'], description: 'Export Drawing', category: 'file' },
  { id: 'print', keys: ['Ctrl', 'P'], description: 'Print', category: 'file' },

  // Edit operations
  { id: 'undo', keys: ['Ctrl', 'Z'], description: 'Undo', category: 'edit' },
  { id: 'redo', keys: ['Ctrl', 'Y'], description: 'Redo', category: 'edit' },
  { id: 'redo-alt', keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo (Alt)', category: 'edit' },
  { id: 'cut', keys: ['Ctrl', 'X'], description: 'Cut', category: 'edit' },
  { id: 'copy', keys: ['Ctrl', 'C'], description: 'Copy', category: 'edit' },
  { id: 'paste', keys: ['Ctrl', 'V'], description: 'Paste', category: 'edit' },
  { id: 'delete', keys: ['Delete'], description: 'Delete Selected', category: 'edit' },
  { id: 'select-all', keys: ['Ctrl', 'A'], description: 'Select All', category: 'edit' },
  { id: 'deselect', keys: ['Escape'], description: 'Deselect / Cancel', category: 'edit' },
  { id: 'duplicate', keys: ['Ctrl', 'D'], description: 'Duplicate', category: 'edit' },

  // View operations
  { id: 'zoom-in', keys: ['Ctrl', '+'], description: 'Zoom In', category: 'view' },
  { id: 'zoom-out', keys: ['Ctrl', '-'], description: 'Zoom Out', category: 'view' },
  { id: 'zoom-fit', keys: ['Ctrl', '0'], description: 'Zoom to Fit', category: 'view' },
  { id: 'zoom-selection', keys: ['Ctrl', '1'], description: 'Zoom to Selection', category: 'view' },
  { id: 'pan', keys: ['Space'], description: 'Pan (Hold)', category: 'view' },
  { id: 'toggle-grid', keys: ['G'], description: 'Toggle Grid', category: 'view' },
  { id: 'toggle-snap', keys: ['S'], description: 'Toggle Snap', category: 'view' },
  { id: 'toggle-ortho', keys: ['O'], description: 'Toggle Ortho Mode', category: 'view' },

  // Drawing tools
  { id: 'tool-select', keys: ['V'], description: 'Select Tool', category: 'draw' },
  { id: 'tool-line', keys: ['L'], description: 'Line Tool', category: 'draw' },
  { id: 'tool-polyline', keys: ['P'], description: 'Polyline Tool', category: 'draw' },
  { id: 'tool-rectangle', keys: ['R'], description: 'Rectangle Tool', category: 'draw' },
  { id: 'tool-circle', keys: ['C'], description: 'Circle Tool', category: 'draw' },
  { id: 'tool-arc', keys: ['A'], description: 'Arc Tool', category: 'draw' },
  { id: 'tool-text', keys: ['T'], description: 'Text Tool', category: 'draw' },
  { id: 'tool-dimension', keys: ['D'], description: 'Dimension Tool', category: 'draw' },
  { id: 'tool-measure', keys: ['M'], description: 'Measure Tool', category: 'draw' },

  // Tools
  { id: 'move', keys: ['Ctrl', 'M'], description: 'Move', category: 'tools' },
  { id: 'rotate', keys: ['Ctrl', 'R'], description: 'Rotate', category: 'tools' },
  { id: 'scale', keys: ['Ctrl', 'Shift', 'R'], description: 'Scale', category: 'tools' },
  { id: 'mirror', keys: ['Ctrl', 'Shift', 'M'], description: 'Mirror', category: 'tools' },
  { id: 'offset', keys: ['Ctrl', 'Shift', 'O'], description: 'Offset', category: 'tools' },
  { id: 'trim', keys: ['Ctrl', 'T'], description: 'Trim', category: 'tools' },
  { id: 'extend', keys: ['Ctrl', 'Shift', 'E'], description: 'Extend', category: 'tools' },

  // PNG Analysis
  { id: 'png-climate', keys: ['Alt', '1'], description: 'Climate Analysis', category: 'png-analysis' },
  { id: 'png-seismic', keys: ['Alt', '2'], description: 'Seismic Analysis', category: 'png-analysis' },
  { id: 'png-flood', keys: ['Alt', '3'], description: 'Flood Analysis', category: 'png-analysis' },
  { id: 'png-materials', keys: ['Alt', '4'], description: 'Materials Database', category: 'png-analysis' },
  { id: 'png-structural', keys: ['Alt', '5'], description: 'Structural Calc', category: 'png-analysis' },
  { id: 'png-report', keys: ['Alt', 'R'], description: 'Generate Report', category: 'png-analysis' },

  // Navigation
  { id: 'command-palette', keys: ['Ctrl', 'Shift', 'P'], description: 'Command Palette', category: 'navigation' },
  { id: 'quick-search', keys: ['Ctrl', 'K'], description: 'Quick Search', category: 'navigation' },
  { id: 'layer-panel', keys: ['Ctrl', 'L'], description: 'Layer Panel', category: 'navigation' },
  { id: 'properties', keys: ['Ctrl', 'I'], description: 'Properties Panel', category: 'navigation' },
  { id: 'help', keys: ['F1'], description: 'Help', category: 'navigation' },
];

function normalizeKey(key: string): string {
  const keyMap: Record<string, string> = {
    'control': 'Ctrl',
    'meta': 'Ctrl',  // Mac Command key
    'alt': 'Alt',
    'shift': 'Shift',
    'escape': 'Escape',
    'delete': 'Delete',
    'backspace': 'Backspace',
    'enter': 'Enter',
    'space': 'Space',
    'arrowup': 'Up',
    'arrowdown': 'Down',
    'arrowleft': 'Left',
    'arrowright': 'Right',
    ' ': 'Space',
  };

  const normalized = key.toLowerCase();
  return keyMap[normalized] || key.toUpperCase();
}

function getKeysFromEvent(event: KeyboardEvent): string[] {
  const keys: string[] = [];

  if (event.ctrlKey || event.metaKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');

  const key = normalizeKey(event.key);
  if (!['Ctrl', 'Alt', 'Shift', 'Control', 'Meta'].includes(key)) {
    keys.push(key);
  }

  return keys;
}

function keysMatch(eventKeys: string[], shortcutKeys: string[]): boolean {
  if (eventKeys.length !== shortcutKeys.length) return false;

  const sortedEvent = [...eventKeys].sort();
  const sortedShortcut = [...shortcutKeys].sort();

  return sortedEvent.every((key, i) => key === sortedShortcut[i]);
}

export function formatShortcut(keys: string[]): string {
  return keys.join(' + ');
}

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  shortcuts: KeyboardShortcut[];
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { enabled = true, shortcuts } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape to still work
      if (event.key !== 'Escape') return;
    }

    const eventKeys = getKeysFromEvent(event);

    for (const shortcut of shortcuts) {
      if (shortcut.enabled === false) continue;

      if (keysMatch(eventKeys, shortcut.keys)) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        return;
      }
    }
  }, [enabled, shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Shortcut customization storage
const SHORTCUTS_STORAGE_KEY = 'png-cad-shortcuts';

export function saveCustomShortcuts(customizations: Record<string, string[]>): void {
  localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(customizations));
}

export function loadCustomShortcuts(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getShortcutsByCategory(shortcuts: KeyboardShortcut[]): ShortcutCategory[] {
  const categoryNames: Record<string, string> = {
    'file': 'File',
    'edit': 'Edit',
    'view': 'View',
    'draw': 'Drawing Tools',
    'tools': 'Modify Tools',
    'png-analysis': 'PNG Analysis',
    'navigation': 'Navigation',
  };

  const categories = new Map<string, KeyboardShortcut[]>();

  for (const shortcut of shortcuts) {
    const existing = categories.get(shortcut.category) || [];
    categories.set(shortcut.category, [...existing, shortcut]);
  }

  return Array.from(categories.entries()).map(([key, shortcuts]) => ({
    name: categoryNames[key] || key,
    shortcuts,
  }));
}
