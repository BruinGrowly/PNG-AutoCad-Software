/**
 * Offline Storage Hook
 * Handles local storage and offline capabilities
 */

import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../../core/types';

const STORAGE_KEY = 'png-cad-projects';
const RECENT_PROJECTS_KEY = 'png-cad-recent';
const MAX_RECENT_PROJECTS = 10;

interface StoredProject {
  id: string;
  name: string;
  data: string; // JSON stringified project
  savedAt: string;
}

interface RecentProject {
  id: string;
  name: string;
  modifiedAt: Date;
}

export function useOfflineStorage() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize storage
    initializeStorage();
    setIsReady(true);
  }, []);

  const initializeStorage = () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(RECENT_PROJECTS_KEY)) {
      localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify([]));
    }
  };

  const saveProject = useCallback(async (project: Project): Promise<boolean> => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      const storedProject: StoredProject = {
        id: project.id,
        name: project.name,
        data: JSON.stringify(project),
        savedAt: new Date().toISOString(),
      };

      projects[project.id] = storedProject;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

      // Update recent projects
      updateRecentProjects(project.id, project.name);

      console.log(`Project "${project.name}" saved successfully`);
      return true;
    } catch (error) {
      console.error('Failed to save project:', error);
      return false;
    }
  }, []);

  const loadProject = useCallback(async (projectId: string): Promise<Project | null> => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const storedProject = projects[projectId] as StoredProject | undefined;

      if (!storedProject) {
        console.error(`Project ${projectId} not found`);
        return null;
      }

      const project = JSON.parse(storedProject.data) as Project;

      // Convert date strings back to Date objects
      project.createdAt = new Date(project.createdAt);
      project.modifiedAt = new Date(project.modifiedAt);

      console.log(`Project "${project.name}" loaded successfully`);
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      if (projects[projectId]) {
        delete projects[projectId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));

        // Remove from recent projects
        const recentProjects = JSON.parse(
          localStorage.getItem(RECENT_PROJECTS_KEY) || '[]'
        ) as RecentProject[];
        const filtered = recentProjects.filter((p) => p.id !== projectId);
        localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(filtered));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }, []);

  const getRecentProjects = useCallback((): RecentProject[] => {
    try {
      const recentProjects = JSON.parse(
        localStorage.getItem(RECENT_PROJECTS_KEY) || '[]'
      ) as RecentProject[];

      return recentProjects.map((p) => ({
        ...p,
        modifiedAt: new Date(p.modifiedAt),
      }));
    } catch (error) {
      console.error('Failed to get recent projects:', error);
      return [];
    }
  }, []);

  const getAllProjects = useCallback((): StoredProject[] => {
    try {
      const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Object.values(projects);
    } catch (error) {
      console.error('Failed to get all projects:', error);
      return [];
    }
  }, []);

  const exportProject = useCallback(async (project: Project): Promise<Blob> => {
    const projectJson = JSON.stringify(project, null, 2);
    return new Blob([projectJson], { type: 'application/json' });
  }, []);

  const importProject = useCallback(async (file: File): Promise<Project | null> => {
    try {
      const text = await file.text();
      const project = JSON.parse(text) as Project;

      // Validate project structure
      if (!project.id || !project.name || !project.entities) {
        throw new Error('Invalid project file');
      }

      // Convert dates
      project.createdAt = new Date(project.createdAt);
      project.modifiedAt = new Date(project.modifiedAt);

      // Generate new ID to avoid conflicts
      project.id = generateId();

      // Save imported project
      await saveProject(project);

      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      return null;
    }
  }, [saveProject]);

  const getStorageUsage = useCallback((): { used: number; available: number } => {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      // Estimate available (5MB typical limit)
      const available = 5 * 1024 * 1024;

      return { used, available };
    } catch {
      return { used: 0, available: 5 * 1024 * 1024 };
    }
  }, []);

  const clearAllData = useCallback((): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(RECENT_PROJECTS_KEY);
      initializeStorage();
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    isReady,
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

// Helper functions

function updateRecentProjects(projectId: string, projectName: string) {
  const recentProjects = JSON.parse(
    localStorage.getItem(RECENT_PROJECTS_KEY) || '[]'
  ) as RecentProject[];

  // Remove if already exists
  const filtered = recentProjects.filter((p) => p.id !== projectId);

  // Add to front
  filtered.unshift({
    id: projectId,
    name: projectName,
    modifiedAt: new Date(),
  });

  // Keep only max recent
  const trimmed = filtered.slice(0, MAX_RECENT_PROJECTS);

  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(trimmed));
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// IndexedDB for larger projects (optional enhancement)
export async function initIndexedDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.log('IndexedDB not supported');
      resolve(null);
      return;
    }

    const request = indexedDB.open('PNGCivilCAD', 1);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
      resolve(null);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores
      if (!db.objectStoreNames.contains('projects')) {
        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('name', 'name', { unique: false });
        projectStore.createIndex('modifiedAt', 'modifiedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('blocks')) {
        db.createObjectStore('blocks', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    };
  });
}
