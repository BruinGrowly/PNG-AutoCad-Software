/**
 * Offline Storage Hook
 * Stores project data in IndexedDB when available, with localStorage fallback.
 */

import { useCallback, useEffect, useState } from 'react';
import { generateId } from '../../core/id.js';

const STORAGE_KEY = 'png-cad-projects'; // Legacy fallback storage.
const RECENT_PROJECTS_KEY = 'png-cad-recent';
const MAX_RECENT_PROJECTS = 10;

const DB_NAME = 'PNGCivilCAD';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';

function hasIndexedDB() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function initLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
  }
  if (!localStorage.getItem(RECENT_PROJECTS_KEY)) {
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify([]));
  }
}

function getLegacyProjects() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function setLegacyProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function normalizeProjectDates(project) {
  if (!project) return project;
  if (project.createdAt) project.createdAt = new Date(project.createdAt);
  if (project.modifiedAt) project.modifiedAt = new Date(project.modifiedAt);
  return project;
}

function openProjectsDB() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(PROJECT_STORE)) {
        const projectStore = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
        projectStore.createIndex('name', 'name', { unique: false });
        projectStore.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
  });
}

function withTransaction(db, storeName, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB transaction failed'));
  });
}

async function idbPutProject(db, projectRecord) {
  return withTransaction(db, PROJECT_STORE, 'readwrite', (store) => store.put(projectRecord));
}

async function idbGetProject(db, projectId) {
  return withTransaction(db, PROJECT_STORE, 'readonly', (store) => store.get(projectId));
}

async function idbDeleteProject(db, projectId) {
  return withTransaction(db, PROJECT_STORE, 'readwrite', (store) => store.delete(projectId));
}

async function idbGetAllProjects(db) {
  return withTransaction(db, PROJECT_STORE, 'readonly', (store) => store.getAll());
}

async function migrateLegacyProjectsToIndexedDB(db) {
  const legacyProjects = getLegacyProjects();
  const records = Object.values(legacyProjects);
  if (records.length === 0) return;

  for (const record of records) {
    await idbPutProject(db, record);
  }
}

function updateRecentProjects(projectId, projectName) {
  const recentProjects = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]');
  const filtered = recentProjects.filter((project) => project.id !== projectId);

  filtered.unshift({
    id: projectId,
    name: projectName,
    modifiedAt: new Date(),
  });

  localStorage.setItem(
    RECENT_PROJECTS_KEY,
    JSON.stringify(filtered.slice(0, MAX_RECENT_PROJECTS))
  );
}

export function useOfflineStorage() {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState(null);
  const [storageBackend, setStorageBackend] = useState('localStorage');

  useEffect(() => {
    let mounted = true;

    (async () => {
      initLocalStorage();

      if (hasIndexedDB()) {
        try {
          const indexedDb = await openProjectsDB();
          if (indexedDb) {
            await migrateLegacyProjectsToIndexedDB(indexedDb);
            if (!mounted) return;
            setDb(indexedDb);
            setStorageBackend('indexedDB');
          }
        } catch {
          if (!mounted) return;
          setStorageBackend('localStorage');
        }
      }

      if (mounted) setIsReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const saveProject = useCallback(async (project) => {
    try {
      const storedProject = {
        id: project.id,
        name: project.name,
        data: JSON.stringify(project),
        savedAt: new Date().toISOString(),
      };

      if (db) {
        await idbPutProject(db, storedProject);
      } else {
        const projects = getLegacyProjects();
        projects[project.id] = storedProject;
        setLegacyProjects(projects);
      }

      updateRecentProjects(project.id, project.name);
      return true;
    } catch {
      return false;
    }
  }, [db]);

  const loadProject = useCallback(async (projectId) => {
    try {
      let storedProject = null;

      if (db) {
        storedProject = await idbGetProject(db, projectId);
      }
      if (!storedProject) {
        storedProject = getLegacyProjects()[projectId] || null;
      }
      if (!storedProject) {
        return null;
      }

      return normalizeProjectDates(JSON.parse(storedProject.data));
    } catch {
      return null;
    }
  }, [db]);

  const deleteProject = useCallback(async (projectId) => {
    try {
      if (db) {
        await idbDeleteProject(db, projectId);
      } else {
        const projects = getLegacyProjects();
        if (!projects[projectId]) return false;
        delete projects[projectId];
        setLegacyProjects(projects);
      }

      const recentProjects = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]');
      localStorage.setItem(
        RECENT_PROJECTS_KEY,
        JSON.stringify(recentProjects.filter((project) => project.id !== projectId))
      );
      return true;
    } catch {
      return false;
    }
  }, [db]);

  const getRecentProjects = useCallback(() => {
    try {
      const recentProjects = JSON.parse(localStorage.getItem(RECENT_PROJECTS_KEY) || '[]');
      return recentProjects.map((project) => ({
        ...project,
        modifiedAt: new Date(project.modifiedAt),
      }));
    } catch {
      return [];
    }
  }, []);

  const getAllProjects = useCallback(async () => {
    try {
      if (db) {
        return await idbGetAllProjects(db);
      }
      return Object.values(getLegacyProjects());
    } catch {
      return [];
    }
  }, [db]);

  const exportProject = useCallback(async (project) => {
    const projectJson = JSON.stringify(project, null, 2);
    return new Blob([projectJson], { type: 'application/json' });
  }, []);

  const importProject = useCallback(async (file) => {
    try {
      const text = await file.text();
      const project = JSON.parse(text);

      if (!project.id || !project.name || !project.entities) {
        throw new Error('Invalid project file');
      }

      normalizeProjectDates(project);
      project.id = generateId(); // Avoid collisions with existing project IDs.

      const saved = await saveProject(project);
      return saved ? project : null;
    } catch {
      return null;
    }
  }, [saveProject]);

  const getStorageUsage = useCallback(async () => {
    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        };
      }

      const data = localStorage.getItem(STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const available = 5 * 1024 * 1024;
      return { used, available };
    } catch {
      return { used: 0, available: 0 };
    }
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      if (db) {
        const records = await idbGetAllProjects(db);
        for (const record of records) {
          await idbDeleteProject(db, record.id);
        }
      }

      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_PROJECTS_KEY);
      initLocalStorage();
      return true;
    } catch {
      return false;
    }
  }, [db]);

  return {
    isReady,
    storageBackend,
    saveProject,
    loadProject,
    deleteProject,
    getRecentProjects,
    getAllProjects,
    exportProject,
    importProject,
    getStorageUsage,
    clearAllData,
  };
}

// Optional utility export for direct IndexedDB initialization.
export async function initIndexedDB() {
  try {
    return await openProjectsDB();
  } catch {
    return null;
  }
}

