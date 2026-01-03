/**
 * PNG Civil Engineering CAD - Main Application Component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Canvas } from './components/Canvas.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { LayerPanel } from './components/LayerPanel.jsx';
import { PropertiesPanel } from './components/PropertiesPanel.jsx';
import { PNGAnalysisPanel } from './components/PNGAnalysisPanel.jsx';
import { ProjectDialog } from './components/ProjectDialog.jsx';
import { MenuBar } from './components/MenuBar.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { useCADStore } from './store/cadStore.js';
import { useOfflineStorage } from './hooks/useOfflineStorage.js';
import './styles/App.css';

export function App() {
  const [showProjectDialog, setShowProjectDialog] = useState(true);
  const [showPNGPanel, setShowPNGPanel] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const {
    project,
    activeTool,
    selectedEntityIds,
    activeLayerId,
    setProject,
    setActiveTool,
    setActiveLayer,
  } = useCADStore();

  const { saveProject, loadProject, getRecentProjects } = useOfflineStorage();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!project) return;

    const autoSaveInterval = setInterval(() => {
      saveProject(project);
    }, 60000); // Auto-save every minute

    return () => clearInterval(autoSaveInterval);
  }, [project, saveProject]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + key shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            if (project) saveProject(project);
            break;
          case 'z':
            e.preventDefault();
            // Undo handled by store
            break;
          case 'y':
            e.preventDefault();
            // Redo handled by store
            break;
          case 'a':
            e.preventDefault();
            // Select all
            break;
        }
      } else {
        // Tool shortcuts
        switch (e.key.toLowerCase()) {
          case 'v':
          case 'escape':
            setActiveTool('select');
            break;
          case 'l':
            setActiveTool('line');
            break;
          case 'c':
            setActiveTool('circle');
            break;
          case 'r':
            setActiveTool('rectangle');
            break;
          case 'p':
            setActiveTool('polyline');
            break;
          case 't':
            setActiveTool('text');
            break;
          case 'd':
            setActiveTool('dimension');
            break;
          case 'm':
            setActiveTool('measure');
            break;
          case 'h':
            setActiveTool('pan');
            break;
          case 'z':
            setActiveTool('zoom');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, saveProject, setActiveTool]);

  const handleNewProject = useCallback((newProject) => {
    setProject(newProject);
    setShowProjectDialog(false);
  }, [setProject]);

  const handleOpenProject = useCallback(async (projectId) => {
    const loadedProject = await loadProject(projectId);
    if (loadedProject) {
      setProject(loadedProject);
      setShowProjectDialog(false);
    }
  }, [loadProject, setProject]);

  const handleToolChange = useCallback((tool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  const togglePNGPanel = useCallback(() => {
    setShowPNGPanel(prev => !prev);
  }, []);

  if (showProjectDialog) {
    return (
      <ProjectDialog
        onNewProject={handleNewProject}
        onOpenProject={handleOpenProject}
        recentProjects={getRecentProjects()}
      />
    );
  }

  return (
    <div className="app">
      <MenuBar
        project={project}
        onNewProject={() => setShowProjectDialog(true)}
        onSave={() => project && saveProject(project)}
        onTogglePNGPanel={togglePNGPanel}
        isOffline={isOffline}
      />

      <div className="app-main">
        <Toolbar
          activeTool={activeTool}
          onToolChange={handleToolChange}
        />

        <div className="app-content">
          <LayerPanel
            layers={project?.layers || []}
            activeLayerId={activeLayerId}
            onLayerSelect={setActiveLayer}
          />

          <div className="canvas-container">
            <Canvas
              project={project}
              activeTool={activeTool}
              activeLayerId={activeLayerId}
            />
          </div>

          <div className="right-panels">
            <PropertiesPanel
              selectedEntityIds={selectedEntityIds}
              entities={project?.entities || []}
            />

            {showPNGPanel && project && (
              <PNGAnalysisPanel
                project={project}
                onClose={() => setShowPNGPanel(false)}
              />
            )}
          </div>
        </div>
      </div>

      <StatusBar
        activeTool={activeTool}
        selectedCount={selectedEntityIds.length}
        zoom={project?.viewports[0]?.zoom || 1}
        isOffline={isOffline}
        projectName={project?.name || 'Untitled'}
      />
    </div>
  );
}

export default App;
