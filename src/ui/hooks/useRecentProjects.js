/**
 * Recent Projects Hook
 * Manages recently opened projects for quick access
 */

import { useState, useEffect, useCallback } from 'react';

const RECENT_PROJECTS_KEY = 'png-cad-recent-projects';
const MAX_RECENT_PROJECTS = 10;

function loadRecentProjects() {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (!stored) return [];

    const projects = JSON.parse(stored);
    return projects.map(p => ({
      ...p,
      lastOpened: new Date(p.lastOpened),
    }));
  } catch {
    return [];
  }
}

function saveRecentProjects(projects) {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(projects));
}

export function useRecentProjects() {
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    setRecentProjects(loadRecentProjects());
  }, []);

  const addRecentProject = useCallback((project) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(p => p.id !== project.id);

      const updated = [
        { ...project, lastOpened: new Date() },
        ...filtered,
      ].slice(0, MAX_RECENT_PROJECTS);

      saveRecentProjects(updated);
      return updated;
    });
  }, []);

  const removeRecentProject = useCallback((id) => {
    setRecentProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveRecentProjects(updated);
      return updated;
    });
  }, []);

  const clearRecentProjects = useCallback(() => {
    setRecentProjects([]);
    localStorage.removeItem(RECENT_PROJECTS_KEY);
  }, []);

  return {
    recentProjects,
    addRecentProject,
    removeRecentProject,
    clearRecentProjects,
  };
}

// Project Templates for PNG Civil Engineering
export const PROJECT_TEMPLATES = [
  {
    id: 'haus-residential',
    name: 'Residential House',
    description: 'Standard PNG residential building with foundation, walls, and roofing layers',
    category: 'residential',
    icon: '🏠',
    defaultLayers: ['Site', 'Foundation', 'Floor Plan', 'Walls', 'Roof', 'Electrical', 'Plumbing', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 0.5,
    },
  },
  {
    id: 'haus-win',
    name: 'Traditional Haus Win',
    description: 'Traditional PNG stilt house design with elevated floor',
    category: 'residential',
    icon: '🏡',
    defaultLayers: ['Site', 'Posts', 'Platform', 'Walls', 'Roof', 'Stairs', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 0.3,
    },
  },
  {
    id: 'commercial-office',
    name: 'Commercial Office',
    description: 'Multi-story commercial building with structural grid',
    category: 'commercial',
    icon: '🏢',
    defaultLayers: ['Site', 'Grid', 'Foundation', 'Columns', 'Beams', 'Slabs', 'Walls', 'Facade', 'MEP', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 1.0,
    },
  },
  {
    id: 'community-hall',
    name: 'Community Hall',
    description: 'Large open-plan community building',
    category: 'community',
    icon: '🏛️',
    defaultLayers: ['Site', 'Foundation', 'Structure', 'Roof', 'Seating', 'Stage', 'Electrical', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 1.0,
    },
  },
  {
    id: 'school-building',
    name: 'School Building',
    description: 'Educational facility with classrooms',
    category: 'community',
    icon: '🏫',
    defaultLayers: ['Site', 'Foundation', 'Classrooms', 'Corridor', 'Admin', 'Toilets', 'Roof', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 0.5,
    },
  },
  {
    id: 'health-center',
    name: 'Health Center',
    description: 'Medical facility with treatment rooms',
    category: 'community',
    icon: '🏥',
    defaultLayers: ['Site', 'Foundation', 'Reception', 'Treatment', 'Ward', 'Pharmacy', 'MEP', 'Roof', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 0.5,
    },
  },
  {
    id: 'warehouse',
    name: 'Warehouse / Storage',
    description: 'Industrial storage building with large spans',
    category: 'industrial',
    icon: '🏭',
    defaultLayers: ['Site', 'Foundation', 'Structure', 'Roof', 'Loading', 'Office', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 1.0,
    },
  },
  {
    id: 'road-section',
    name: 'Road Cross-Section',
    description: 'Road design with drainage and shoulders',
    category: 'infrastructure',
    icon: '🛤️',
    defaultLayers: ['Centerline', 'Carriageway', 'Shoulders', 'Drainage', 'Earthworks', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 0.5,
    },
  },
  {
    id: 'bridge-general',
    name: 'Bridge Arrangement',
    description: 'Bridge general arrangement drawing',
    category: 'infrastructure',
    icon: '🌉',
    defaultLayers: ['Abutments', 'Piers', 'Deck', 'Bearings', 'Railings', 'Approach', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 1.0,
    },
  },
  {
    id: 'site-layout',
    name: 'Site Layout',
    description: 'General site layout with buildings and infrastructure',
    category: 'infrastructure',
    icon: '📐',
    defaultLayers: ['Boundary', 'Existing', 'Proposed', 'Roads', 'Drainage', 'Landscaping', 'Dimensions'],
    defaultSettings: {
      units: 'metric',
      gridSpacing: 5.0,
    },
  },
];

export function getTemplatesByCategory(category) {
  return PROJECT_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id) {
  return PROJECT_TEMPLATES.find(t => t.id === id);
}
