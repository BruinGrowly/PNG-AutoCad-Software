/**
 * Global command palette (Ctrl/Cmd+K) for quick actions.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './CommandPalette.css';

function formatSearchTokens(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

function prepareAction(action) {
  const label = (action.label || '').toLowerCase();
  const group = (action.group || '').toLowerCase();
  const shortcut = (action.shortcut || '').toLowerCase();
  const keywords = (action.keywords || []).map((keyword) => keyword.toLowerCase());

  return {
    action,
    label,
    group,
    shortcut,
    keywords,
    haystack: [label, group, shortcut, ...keywords].join(' '),
  };
}

function getActionScore(preparedAction, queryTokens) {
  if (queryTokens.length === 0) {
    return 1;
  }

  let score = 0;

  for (const token of queryTokens) {
    if (!preparedAction.haystack.includes(token)) {
      return -1;
    }

    if (preparedAction.label.startsWith(token)) {
      score += 8;
      continue;
    }
    if (preparedAction.label.includes(token)) {
      score += 5;
      continue;
    }
    if (preparedAction.keywords.some((keyword) => keyword.startsWith(token))) {
      score += 4;
      continue;
    }
    if (preparedAction.group.includes(token)) {
      score += 2;
      continue;
    }
    score += 1;
  }

  return score;
}

export function CommandPalette({
  open,
  onClose,
  actions = [],
  recentActionIds = [],
  onActionExecuted,
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const filteredActions = useMemo(() => {
    const tokens = formatSearchTokens(query);
    const preparedActions = actions.map(prepareAction);
    const recentActionRanks = new Map(recentActionIds.map((id, index) => [id, index]));

    return preparedActions
      .map((preparedAction) => {
        const baseScore = getActionScore(preparedAction, tokens);
        if (baseScore < 0) return null;

        const recentIndex = recentActionRanks.has(preparedAction.action.id)
          ? recentActionRanks.get(preparedAction.action.id)
          : null;

        return {
          ...preparedAction.action,
          score: baseScore,
          recentIndex,
          isRecent: recentIndex !== null,
        };
      })
      .filter(Boolean)
      .sort((first, second) => {
        if (tokens.length === 0) {
          const firstRecent = first.recentIndex !== null;
          const secondRecent = second.recentIndex !== null;

          if (firstRecent && secondRecent) {
            return first.recentIndex - second.recentIndex;
          }
          if (firstRecent !== secondRecent) {
            return firstRecent ? -1 : 1;
          }
        }

        if (second.score !== first.score) {
          return second.score - first.score;
        }
        return (first.label || '').localeCompare(second.label || '');
      });
  }, [actions, query, recentActionIds]);

  const runAction = useCallback((action) => {
    if (!action) return;
    action.onSelect?.();
    onActionExecuted?.(action.id);
    onClose();
  }, [onActionExecuted, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
      return;
    }

    const frameHandle = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frameHandle);
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
        runAction(targetAction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredActions, onClose, open, runAction]);

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
            ref={inputRef}
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
          <div className="command-palette-summary">
            {query
              ? `${filteredActions.length} match${filteredActions.length === 1 ? '' : 'es'}`
              : 'Recent actions appear first'}
          </div>

          {filteredActions.length === 0 ? (
            <div className="command-empty-state">No matching actions.</div>
          ) : (
            filteredActions.map((action, index) => (
              <button
                type="button"
                key={action.id}
                className={`command-item ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => runAction(action)}
              >
                <div className="command-item-copy">
                  <div className="command-item-meta">
                    <span className="command-item-group">{action.group || 'Action'}</span>
                    {action.isRecent && <span className="command-item-badge">Recent</span>}
                  </div>
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
