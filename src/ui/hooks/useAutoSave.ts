/**
 * Auto-Save Hook
 * Automatically saves project data at configurable intervals
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface AutoSaveOptions {
  /** Interval in milliseconds between auto-saves (default: 60000 = 1 minute) */
  interval?: number;
  /** Function to perform the save operation */
  onSave: () => Promise<void> | void;
  /** Called when auto-save completes successfully */
  onSaveComplete?: () => void;
  /** Called when auto-save fails */
  onSaveError?: (error: Error) => void;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Minimum time between saves when triggered by changes (debounce) */
  debounceMs?: number;
}

export interface AutoSaveState {
  lastSaveTime: Date | null;
  isSaving: boolean;
  saveCount: number;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

export interface AutoSaveActions {
  /** Manually trigger a save */
  saveNow: () => Promise<void>;
  /** Mark that there are unsaved changes */
  markDirty: () => void;
  /** Mark that changes have been saved */
  markClean: () => void;
  /** Enable/disable auto-save */
  setEnabled: (enabled: boolean) => void;
}

export function useAutoSave(options: AutoSaveOptions): [AutoSaveState, AutoSaveActions] {
  const {
    interval = 60000,
    onSave,
    onSaveComplete,
    onSaveError,
    enabled: initialEnabled = true,
    debounceMs = 5000,
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    lastSaveTime: null,
    isSaving: false,
    saveCount: 0,
    hasUnsavedChanges: false,
    error: null,
  });

  const [enabled, setEnabled] = useState(initialEnabled);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const performSave = useCallback(async () => {
    if (state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      await onSave();

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isSaving: false,
          lastSaveTime: new Date(),
          saveCount: prev.saveCount + 1,
          hasUnsavedChanges: false,
        }));
        onSaveComplete?.();
      }
    } catch (error) {
      if (isMountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState(prev => ({
          ...prev,
          isSaving: false,
          error: err,
        }));
        onSaveError?.(err);
      }
    }
  }, [onSave, onSaveComplete, onSaveError, state.isSaving]);

  const saveNow = useCallback(async () => {
    // Clear any pending debounced save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await performSave();
  }, [performSave]);

  const markDirty = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));

    // Debounced save on change
    if (enabled && debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        performSave();
      }, debounceMs);
    }
  }, [enabled, debounceMs, performSave]);

  const markClean = useCallback(() => {
    setState(prev => ({ ...prev, hasUnsavedChanges: false }));
  }, []);

  // Interval-based auto-save
  useEffect(() => {
    if (!enabled || interval <= 0) {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
        intervalTimerRef.current = null;
      }
      return;
    }

    intervalTimerRef.current = setInterval(() => {
      if (state.hasUnsavedChanges) {
        performSave();
      }
    }, interval);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [enabled, interval, state.hasUnsavedChanges, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (intervalTimerRef.current) clearInterval(intervalTimerRef.current);
    };
  }, []);

  // Save before page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.hasUnsavedChanges]);

  return [
    state,
    {
      saveNow,
      markDirty,
      markClean,
      setEnabled,
    },
  ];
}

// Helper to format last save time
export function formatLastSaveTime(lastSaveTime: Date | null): string {
  if (!lastSaveTime) return 'Never saved';

  const now = new Date();
  const diffMs = now.getTime() - lastSaveTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 10) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  return lastSaveTime.toLocaleString();
}
