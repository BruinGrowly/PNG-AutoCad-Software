/**
 * Keyboard shortcut reference modal.
 */

import React from 'react';
import './KeyboardHelp.css';

const SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { key: 'Middle Drag', description: 'Pan viewport' },
      { key: 'Wheel', description: 'Zoom viewport' },
      { key: 'Home or Z', description: 'Zoom to fit' },
    ],
  },
  {
    category: 'Drawing',
    shortcuts: [
      { key: 'L', description: 'Line tool' },
      { key: 'C', description: 'Circle tool' },
      { key: 'R', description: 'Rectangle tool' },
      { key: 'P', description: 'Polyline tool' },
      { key: 'A', description: 'Arc tool' },
      { key: 'T', description: 'Text tool' },
    ],
  },
  {
    category: 'Editing',
    shortcuts: [
      { key: 'Delete', description: 'Delete selected' },
      { key: 'Ctrl+Z', description: 'Undo' },
      { key: 'Ctrl+Y', description: 'Redo' },
      { key: 'Ctrl+C', description: 'Copy' },
      { key: 'Ctrl+V', description: 'Paste' },
      { key: 'Ctrl+A', description: 'Select all' },
      { key: 'Escape', description: 'Cancel or deselect' },
    ],
  },
  {
    category: 'View',
    shortcuts: [
      { key: 'G', description: 'Toggle grid' },
      { key: 'S', description: 'Toggle snap' },
      { key: 'F1', description: 'Open shortcuts help' },
      { key: 'E', description: 'Toggle explorer' },
    ],
  },
  {
    category: 'Project',
    shortcuts: [
      { key: 'Ctrl+N', description: 'New project' },
      { key: 'Ctrl+S', description: 'Save project' },
      { key: 'Ctrl+Shift+Z', description: 'Redo alternative' },
    ],
  },
];

export function KeyboardHelp({ onClose }) {
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' || event.key === '?' || event.key === 'F1') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="keyboard-help-modal" onClick={(event) => event.stopPropagation()}>
        <div className="keyboard-help-header">
          <div>
            <p className="keyboard-kicker">Quick Reference</p>
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>Close</button>
        </div>

        <div className="keyboard-help-content">
          {SHORTCUTS.map((group) => (
            <section key={group.category} className="shortcut-group">
              <h3>{group.category}</h3>
              <div className="shortcut-list">
                {group.shortcuts.map((shortcut) => (
                  <div key={`${group.category}-${shortcut.key}`} className="shortcut-item">
                    <kbd>{shortcut.key}</kbd>
                    <span>{shortcut.description}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="keyboard-help-footer">
          Press <kbd>?</kbd> or <kbd>Escape</kbd> to close
        </div>
      </div>
    </div>
  );
}
