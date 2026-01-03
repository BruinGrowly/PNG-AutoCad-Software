/**
 * Auto-Save Hook
 * Provides automatic saving functionality with configurable intervals
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * @typedef {Object} AutoSaveOptions
 * @property {number} [debounceMs=1000] - Debounce time for changes
 * @property {number} [intervalMs=60000] - Auto-save interval
 * @property {boolean} [enabled=true] - Whether auto-save is enabled
 */

/**
 * Auto-save hook for project data
 * @param {Function} saveFunction - Function to call when saving
 * @param {any} data - Data to save
 * @param {AutoSaveOptions} options - Auto-save options
 */
export function useAutoSave(saveFunction, data, options = {}) {
  const {
    debounceMs = 1000,
    intervalMs = 60000,
    enabled = true,
  } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const debounceTimerRef = useRef(null);
  const intervalTimerRef = useRef(null);
  const dataRef = useRef(data);

  // Update data ref when data changes
  useEffect(() => {
    dataRef.current = data;
    setHasUnsavedChanges(true);
  }, [data]);

  // Save function wrapper
  const performSave = useCallback(async () => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      setSaveError(null);
      await saveFunction(dataRef.current);
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      setSaveError(error);
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [enabled, isSaving, saveFunction]);

  // Debounced save on data change
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(performSave, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [enabled, hasUnsavedChanges, performSave, debounceMs]);

  // Interval-based auto-save
  useEffect(() => {
    if (!enabled) return;

    intervalTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        performSave();
      }
    }, intervalMs);

    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current);
      }
    };
  }, [enabled, hasUnsavedChanges, performSave, intervalMs]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    await performSave();
  }, [performSave]);

  return {
    isSaving,
    lastSaveTime,
    hasUnsavedChanges,
    saveError,
    saveNow,
  };
}

/**
 * Format the last save time for display
 * @param {Date | null} lastSaveTime
 * @returns {string}
 */
export function formatLastSaveTime(lastSaveTime) {
  if (!lastSaveTime) return 'Never saved';

  const now = new Date();
  const diff = now.getTime() - lastSaveTime.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) {
    return 'Just saved';
  } else if (minutes < 60) {
    return `Saved ${minutes}m ago`;
  } else if (hours < 24) {
    return `Saved ${hours}h ago`;
  } else {
    return `Saved ${lastSaveTime.toLocaleDateString()}`;
  }
}
