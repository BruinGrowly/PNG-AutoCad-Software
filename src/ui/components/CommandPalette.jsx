/**
 * Global command palette (Ctrl/Cmd+K) for quick actions.
 */

import React, { useEffect, useMemo, useState } from 'react';
import './CommandPalette.css';

function formatSearchTokens(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function actionMatchesQuery(action, queryTokens) {
  if (queryTokens.length === 0) {
    return true;
  }

  const haystack = [
    action.label,
    action.group || '',
    action.shortcut || '',
    ...(action.keywords || []),
  ].join(' ').toLowerCase();

  return queryTokens.every((token) => haystack.includes(token));
}

export function CommandPalette({ open, onClose, actions = [] }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredActions = useMemo(() => {
    const tokens = formatSearchTokens(query);
    return actions.filter((action) => actionMatchesQuery(action, tokens));
  }, [actions, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }
    setTimeout(() => {
      const input = document.querySelector('.command-palette-input');
      if (input instanceof HTMLInputElement) {
        input.focus();
      }
    }, 0);
  }, [open]);

  useEffect(() => {
    if (activeIndex > filteredActions.length - 1) {
      setActiveIndex(Math.max(filteredActions.length - 1, 0));
    }
  }, [activeIndex, filteredActions.length]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((previous) => (
          filteredActions.length === 0 ? 0 : (previous + 1) % filteredActions.length
        ));
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((previous) => (
          filteredActions.length === 0
            ? 0
            : (previous - 1 + filteredActions.length) % filteredActions.length
        ));
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const targetAction = filteredActions[activeIndex];
        if (targetAction) {
          targetAction.onSelect();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredActions, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <section
        className="command-palette"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="command-palette-header">
          <input
            className="command-palette-input"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search actions: line, standards, export, help..."
            aria-label="Search commands"
          />
          <button type="button" className="command-palette-close" onClick={onClose}>Close</button>
        </div>

        <div className="command-palette-list">
          {filteredActions.length === 0 ? (
            <div className="command-empty-state">No matching actions.</div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                type="button"
                key={action.id}
                className={`command-item ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  action.onSelect();
                  onClose();
                }}
              >
                <div className="command-item-copy">
                  <span className="command-item-group">{action.group || 'Action'}</span>
                  <span className="command-item-label">{action.label}</span>
                </div>
                {action.shortcut && <span className="command-item-shortcut">{action.shortcut}</span>}
              </button>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          Use <kbd>Up</kbd>/<kbd>Down</kbd> to navigate, <kbd>Enter</kbd> to run, <kbd>Esc</kbd> to close.
        </div>
      </section>
    </div>
  );
}
