/**
 * Keyboard Shortcuts Help Overlay
 * Shows when user presses ? key
 */

import React from 'react';
import './KeyboardHelp.css';

const SHORTCUTS = [
    {
        category: 'Navigation', shortcuts: [
            { key: 'Pan', description: 'Hold middle mouse and drag' },
            { key: 'Zoom', description: 'Mouse wheel scroll' },
            { key: 'Zoom to Fit', description: 'Home or Z' },
        ]
    },
    {
        category: 'Drawing Tools', shortcuts: [
            { key: 'L', description: 'Line tool' },
            { key: 'C', description: 'Circle tool' },
            { key: 'R', description: 'Rectangle tool' },
            { key: 'P', description: 'Polyline tool' },
            { key: 'A', description: 'Arc tool' },
            { key: 'T', description: 'Text tool' },
        ]
    },
    {
        category: 'Editing', shortcuts: [
            { key: 'Delete / Backspace', description: 'Delete selected' },
            { key: 'Ctrl+Z', description: 'Undo' },
            { key: 'Ctrl+Y', description: 'Redo' },
            { key: 'Ctrl+C', description: 'Copy' },
            { key: 'Ctrl+V', description: 'Paste' },
            { key: 'Ctrl+A', description: 'Select all' },
            { key: 'Escape', description: 'Cancel / Deselect' },
        ]
    },
    {
        category: 'View', shortcuts: [
            { key: 'G', description: 'Toggle grid' },
            { key: 'S', description: 'Toggle snap' },
            { key: 'O', description: 'Toggle ortho mode' },
            { key: 'F', description: 'Zoom to fit' },
            { key: '+/-', description: 'Zoom in/out' },
        ]
    },
    {
        category: 'File', shortcuts: [
            { key: 'Ctrl+N', description: 'New project' },
            { key: 'Ctrl+O', description: 'Open project' },
            { key: 'Ctrl+S', description: 'Save project' },
            { key: 'Ctrl+E', description: 'Export' },
        ]
    },
    {
        category: 'Help', shortcuts: [
            { key: '? or F1', description: 'Show this help' },
        ]
    },
];

export function KeyboardHelp({ onClose }) {
    // Close on Escape or clicking backdrop
    const handleKeyDown = (e) => {
        if (e.key === 'Escape' || e.key === '?') {
            onClose();
        }
    };

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="keyboard-help-overlay" onClick={onClose}>
            <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="keyboard-help-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="keyboard-help-content">
                    {SHORTCUTS.map((group) => (
                        <div key={group.category} className="shortcut-group">
                            <h3>{group.category}</h3>
                            <div className="shortcut-list">
                                {group.shortcuts.map((shortcut, idx) => (
                                    <div key={idx} className="shortcut-item">
                                        <kbd>{shortcut.key}</kbd>
                                        <span>{shortcut.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="keyboard-help-footer">
                    Press <kbd>?</kbd> or <kbd>Escape</kbd> to close
                </div>
            </div>
        </div>
    );
}
