/**
 * Context menu for canvas and entity operations.
 */

import React, { useEffect, useRef } from 'react';
import './ContextMenu.css';

export function ContextMenu({
  position,
  selectedCount,
  onClose,
  onDelete,
  onCopy,
  onPaste,
  onDuplicate,
  onSelectAll,
  onDeselect,
  onProperties,
  canPaste,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (adjustedPosition.x + rect.width > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - rect.width - 10;
    }
    if (adjustedPosition.y + rect.height > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - rect.height - 10;
    }
  }

  const handleAction = (action) => {
    action();
    onClose();
  };

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
    >
      {selectedCount > 0 ? (
        <>
          <div className="context-menu-header">
            {selectedCount} object{selectedCount > 1 ? 's' : ''} selected
          </div>

          <div className="context-menu-divider" />

          <button type="button" className="context-menu-item" onClick={() => handleAction(onCopy)}>
            <span className="item-icon">CP</span>
            <span className="item-label">Copy</span>
            <span className="item-shortcut">Ctrl+C</span>
          </button>

          <button type="button" className="context-menu-item" onClick={() => handleAction(onDuplicate)}>
            <span className="item-icon">DP</span>
            <span className="item-label">Duplicate</span>
            <span className="item-shortcut">Ctrl+D</span>
          </button>

          <div className="context-menu-divider" />

          <button type="button" className="context-menu-item danger" onClick={() => handleAction(onDelete)}>
            <span className="item-icon">DL</span>
            <span className="item-label">Delete</span>
            <span className="item-shortcut">Delete</span>
          </button>

          <div className="context-menu-divider" />

          <button type="button" className="context-menu-item" onClick={() => handleAction(onDeselect)}>
            <span className="item-icon">DS</span>
            <span className="item-label">Deselect</span>
            <span className="item-shortcut">Esc</span>
          </button>

          <button type="button" className="context-menu-item" onClick={() => handleAction(onProperties)}>
            <span className="item-icon">PR</span>
            <span className="item-label">Properties</span>
            <span className="item-shortcut" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className={`context-menu-item ${!canPaste ? 'disabled' : ''}`}
            onClick={() => canPaste && handleAction(onPaste)}
          >
            <span className="item-icon">PS</span>
            <span className="item-label">Paste</span>
            <span className="item-shortcut">Ctrl+V</span>
          </button>

          <div className="context-menu-divider" />

          <button type="button" className="context-menu-item" onClick={() => handleAction(onSelectAll)}>
            <span className="item-icon">SA</span>
            <span className="item-label">Select All</span>
            <span className="item-shortcut">Ctrl+A</span>
          </button>
        </>
      )}
    </div>
  );
}
