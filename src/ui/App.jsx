/**
 * PNG Civil Engineering CAD - Main Application Component
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas } from './components/Canvas.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { LayerPanel } from './components/LayerPanel.jsx';
import { PropertiesPanel } from './components/PropertiesPanel.jsx';
import { PNGAnalysisPanel } from './components/PNGAnalysisPanel.jsx';
import { BuildingParametersPanel } from './components/BuildingParametersPanel.jsx';
import { ProjectDialog } from './components/ProjectDialog.jsx';
import { MenuBar } from './components/MenuBar.jsx';
import { StatusBar } from './components/StatusBar.jsx';
import { ProjectExplorer } from './components/ProjectExplorer.jsx';
import { KeyboardHelp } from './components/KeyboardHelp.jsx';
import { FeedbackForm } from './components/FeedbackForm.jsx';
import { SurfaceImportPanel } from './components/SurfaceImportPanel.jsx';
import { useNotifications } from './components/Notifications.jsx';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { useCADStore } from './store/cadStore.js';
import { useOfflineStorage } from './hooks/useOfflineStorage.js';
import { exportToPDF } from '../core/pdfExport.js';
import './styles/App.css';

const MODULES = [
  {
    id: 'workspace',
    label: 'Workspace',
    title: 'Core CAD Workspace',
    description: 'Draft, annotate, and coordinate model geometry with project layers.',
  },
  {
    id: 'standards',
    label: 'Standards',
    title: 'PNG Standards Assistant',
    description: 'Keep designs aligned with PNG context and AU/NZ-derived practice.',
  },
  {
    id: 'qa',
    label: 'QA / Inspection',
    title: 'Field QA and Inspection',
    description: 'Prepare checks, mark issues, and keep a clear audit trail.',
  },
  {
    id: 'drainage',
    label: 'Drainage',
    title: 'Drainage and Site Flows',
    description: 'Work on culverts, channels, and terrain-aware drainage decisions.',
  },
  {
    id: 'reports',
    label: 'Reports',
    title: 'Compliance and Delivery Reports',
    description: 'Package outputs for review with exports and project summaries.',
  },
];

export function App() {
  const [showProjectDialog, setShowProjectDialog] = useState(true);
  const [showPNGPanel, setShowPNGPanel] = useState(false);
  const [showBuildingPanel, setShowBuildingPanel] = useState(false);
  const [showProjectExplorer, setShowProjectExplorer] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showSurfaceImport, setShowSurfaceImport] = useState(false);
  const [activeModule, setActiveModule] = useState('workspace');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastManualSaveTime, setLastManualSaveTime] = useState(null);

  const notifications = useNotifications();

  const {
    project,
    isModified,
    activeTool,
    selectedEntityIds,
    activeLayerId,
    gridSettings,
    snapSettings,
    setProject,
    setActiveTool,
    setActiveLayer,
    deleteSelectedEntities,
    undo,
    redo,
    canUndo,
    canRedo,
    copy,
    cut,
    paste,
    selectAll,
    clearSelection,
    toggleGrid,
    toggleSnap,
  } = useCADStore();

  const { saveProject, loadProject, getRecentProjects } = useOfflineStorage();

  const activeViewport = useMemo(
    () => project?.viewports?.find((viewport) => viewport.isActive) || project?.viewports?.[0] || null,
    [project]
  );

  // Handle online/offline status.
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

  // Auto-save every minute.
  useEffect(() => {
    if (!project) return;

    const autoSaveInterval = setInterval(() => {
      saveProject(project);
    }, 60000);

    return () => clearInterval(autoSaveInterval);
  }, [project, saveProject]);

  const handleSaveProject = useCallback(async () => {
    if (!project) return;
    const saved = await saveProject(project);
    if (saved) {
      setLastManualSaveTime(new Date());
      return;
    }
    notifications.error('Save failed', 'Project could not be saved.');
  }, [notifications, project, saveProject]);

  const keyboardHandlers = useMemo(() => ({
    saveProject: handleSaveProject,
    undo: () => canUndo() && undo(),
    redo: () => canRedo() && redo(),
    selectAll,
    copy,
    cut,
    paste: () => paste(),
    deleteSelected: deleteSelectedEntities,
    selectTool: () => {
      clearSelection();
      setActiveTool('select');
    },
    lineTool: () => setActiveTool('line'),
    circleTool: () => setActiveTool('circle'),
    rectangleTool: () => setActiveTool('rectangle'),
    polylineTool: () => setActiveTool('polyline'),
    textTool: () => setActiveTool('text'),
    dimensionTool: () => setActiveTool('dimension'),
    measureTool: () => setActiveTool('measure'),
    panTool: () => setActiveTool('pan'),
    zoomTool: () => setActiveTool('zoom'),
    arcTool: () => setActiveTool('arc'),
    toggleExplorer: () => setShowProjectExplorer((prev) => !prev),
    showHelp: () => setShowKeyboardHelp(true),
    toggleGrid,
    toggleSnap,
  }), [
    canRedo,
    canUndo,
    clearSelection,
    copy,
    cut,
    deleteSelectedEntities,
    handleSaveProject,
    paste,
    redo,
    selectAll,
    setActiveTool,
    toggleGrid,
    toggleSnap,
    undo,
  ]);

  const keyboardShortcuts = useMemo(() => ([
    { key: 's', ctrl: true, action: 'saveProject' },
    { key: 'z', ctrl: true, action: 'undo' },
    { key: 'y', ctrl: true, action: 'redo' },
    { key: 'z', ctrl: true, shift: true, action: 'redo' },
    { key: 'a', ctrl: true, action: 'selectAll' },
    { key: 'c', ctrl: true, action: 'copy' },
    { key: 'x', ctrl: true, action: 'cut' },
    { key: 'v', ctrl: true, action: 'paste' },
    { key: 'Delete', action: 'deleteSelected' },
    { key: 'Escape', action: 'selectTool' },
    { key: 'v', action: 'selectTool' },
    { key: 'l', action: 'lineTool' },
    { key: 'c', action: 'circleTool' },
    { key: 'r', action: 'rectangleTool' },
    { key: 'p', action: 'polylineTool' },
    { key: 't', action: 'textTool' },
    { key: 'd', action: 'dimensionTool' },
    { key: 'm', action: 'measureTool' },
    { key: 'h', action: 'panTool' },
    { key: 'z', action: 'zoomTool' },
    { key: 'a', action: 'arcTool' },
    { key: 'e', action: 'toggleExplorer' },
    { key: 'F1', action: 'showHelp' },
    { key: '?', shift: true, action: 'showHelp' },
    { key: 'g', action: 'toggleGrid' },
    { key: 's', action: 'toggleSnap' },
  ]), []);

  useKeyboardShortcuts(keyboardHandlers, {
    enabled: !showProjectDialog,
    shortcuts: keyboardShortcuts,
  });

  const handleNewProject = useCallback((newProject) => {
    setProject(newProject);
    setShowProjectDialog(false);
  }, [setProject]);

  const handleOpenProject = useCallback(async (projectId) => {
    const loadedProject = await loadProject(projectId);
    if (loadedProject) {
      setProject(loadedProject);
      setShowProjectDialog(false);
      notifications.success('Project opened', loadedProject.name);
      return;
    }
    notifications.error('Open failed', 'Could not load selected project.');
  }, [loadProject, notifications, setProject]);

  const handleToolChange = useCallback((tool) => {
    if (tool === 'surface') {
      setShowSurfaceImport(true);
      return;
    }
    setActiveTool(tool);
  }, [setActiveTool]);

  const handleModuleChange = useCallback((moduleId) => {
    setActiveModule(moduleId);

    if (moduleId === 'standards' || moduleId === 'qa') {
      setShowPNGPanel(true);
    }

    if (moduleId === 'drainage') {
      setShowPNGPanel(true);
      setShowBuildingPanel(true);
    }

    if (moduleId === 'reports') {
      setShowProjectExplorer(true);
    }
  }, []);

  const togglePNGPanel = useCallback(() => {
    setShowPNGPanel((prev) => !prev);
  }, []);

  const toggleBuildingPanel = useCallback(() => {
    setShowBuildingPanel((prev) => !prev);
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!project) return;

    const entities = project.entities || [];
    const viewport = {
      minX: -500,
      minY: -350,
      maxX: 500,
      maxY: 350,
    };

    await exportToPDF({
      entities,
      viewport,
      paperSize: 'A3',
      orientation: 'landscape',
      titleBlock: {
        projectTitle: project.name || 'Untitled Project',
        drawingTitle: 'DRAWING',
        scale: '1:100',
      },
      filename: `${project.name || 'drawing'}.pdf`,
    });
  }, [project]);

  const handleInsertBuildingEntities = useCallback((entities) => {
    if (!entities || entities.length === 0) return;
    const { addEntities } = useCADStore.getState();
    addEntities(entities);
  }, []);

  const moduleDetails = useMemo(
    () => MODULES.find((module) => module.id === activeModule) || MODULES[0],
    [activeModule]
  );

  const moduleMetrics = useMemo(() => ([
    { label: 'Objects', value: project?.entities?.length || 0 },
    { label: 'Layers', value: project?.layers?.length || 0 },
    { label: 'Selected', value: selectedEntityIds.length },
    { label: 'Zoom', value: `${Math.round((activeViewport?.zoom || 1) * 100)}%` },
  ]), [activeViewport?.zoom, project?.entities?.length, project?.layers?.length, selectedEntityIds.length]);

  const activeLayerName = useMemo(
    () => project?.layers?.find((layer) => layer.id === activeLayerId)?.name || activeLayerId,
    [activeLayerId, project?.layers]
  );

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
    <div className="app-shell">
      <div className="app-shell-glow app-shell-glow-left" />
      <div className="app-shell-glow app-shell-glow-right" />

      <div className="app">
        <MenuBar
          project={project}
          modules={MODULES}
          activeModule={activeModule}
          onModuleChange={handleModuleChange}
          onNewProject={() => setShowProjectDialog(true)}
          onSave={handleSaveProject}
          onTogglePNGPanel={togglePNGPanel}
          onToggleBuildingPanel={toggleBuildingPanel}
          onExportPDF={handleExportPDF}
          onShowKeyboardHelp={() => setShowKeyboardHelp(true)}
          onToggleExplorer={() => setShowProjectExplorer((prev) => !prev)}
          onShowFeedback={() => setShowFeedbackForm(true)}
          isOffline={isOffline}
        />

        <section className={`module-brief module-brief-${activeModule}`}>
          <div className="module-brief-copy">
            <p className="module-kicker">{moduleDetails.label}</p>
            <h2>{moduleDetails.title}</h2>
            <p>{moduleDetails.description}</p>
          </div>

          <div className="module-brief-metrics">
            {moduleMetrics.map((metric) => (
              <div key={metric.label} className="module-metric-card">
                <span className="module-metric-label">{metric.label}</span>
                <span className="module-metric-value">{metric.value}</span>
              </div>
            ))}
          </div>

          <div className="module-brief-actions">
            <button onClick={() => setShowPNGPanel(true)}>Standards Panel</button>
            <button onClick={() => setShowBuildingPanel(true)}>Drainage Inputs</button>
            <button onClick={() => setShowProjectExplorer(true)}>Project Explorer</button>
            <button className="primary" onClick={handleExportPDF}>Export PDF</button>
          </div>
        </section>

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

              {showBuildingPanel && (
                <BuildingParametersPanel
                  onClose={() => setShowBuildingPanel(false)}
                  onInsertToDrawing={handleInsertBuildingEntities}
                />
              )}

              {showProjectExplorer && (
                <ProjectExplorer
                  project={project}
                  onClose={() => setShowProjectExplorer(false)}
                />
              )}
            </div>
          </div>
        </div>

        <StatusBar
          activeTool={activeTool}
          activeLayer={activeLayerName}
          units={project?.units?.lengthUnit || 'm'}
          gridEnabled={Boolean(gridSettings?.visible)}
          snapEnabled={Boolean(snapSettings?.enabled)}
          orthoEnabled={false}
          onToggleGrid={toggleGrid}
          onToggleSnap={toggleSnap}
          onToggleOrtho={() => {}}
          selectedCount={selectedEntityIds.length}
          entityCount={project?.entities?.length || 0}
          layerCount={project?.layers?.length || 0}
          zoom={activeViewport?.zoom || 1}
          lastSaveTime={lastManualSaveTime}
          hasUnsavedChanges={isModified}
          isSaving={false}
          isOffline={isOffline}
          projectName={project?.name || 'Untitled'}
          onToggleExplorer={() => setShowProjectExplorer((prev) => !prev)}
          onShowHelp={() => setShowKeyboardHelp(true)}
          onShowFeedback={() => setShowFeedbackForm(true)}
        />

        {showKeyboardHelp && (
          <KeyboardHelp onClose={() => setShowKeyboardHelp(false)} />
        )}

        {showFeedbackForm && (
          <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
        )}

        {showSurfaceImport && (
          <SurfaceImportPanel
            onClose={() => setShowSurfaceImport(false)}
            onSurfaceCreated={(surfaceData) => {
              if (project && surfaceData.entities.length > 0) {
                const bounds = surfaceData.bounds;
                const centerX = (bounds.minX + bounds.maxX) / 2;
                const centerY = (bounds.minY + bounds.maxY) / 2;

                const width = bounds.maxX - bounds.minX;
                const height = bounds.maxY - bounds.minY;
                const maxDimension = Math.max(width, height);
                const canvasSize = 800;
                const zoom = Math.min(canvasSize / (maxDimension * 1.2), 2);

                const updatedViewports = (project.viewports || []).length > 0
                  ? project.viewports.map((viewport, index) => {
                      const isTarget = viewport.isActive || index === 0;
                      if (!isTarget) return viewport;
                      return {
                        ...viewport,
                        zoom,
                        // Pan is in screen pixels: shift world center to viewport center.
                        pan: {
                          x: -centerX * zoom,
                          y: -centerY * zoom,
                        },
                      };
                    })
                  : [{
                      id: 'viewport-main',
                      name: 'Main',
                      isActive: true,
                      zoom,
                      pan: {
                        x: -centerX * zoom,
                        y: -centerY * zoom,
                      },
                      rotation: 0,
                      bounds: { minX: -10000, minY: -10000, maxX: 10000, maxY: 10000 },
                    }];

                const updatedProject = {
                  ...project,
                  entities: [...(project.entities || []), ...surfaceData.entities],
                  layers: [
                    ...(project.layers || []),
                    ...surfaceData.layers.filter((newLayer) =>
                      !project.layers?.some((layer) => layer.id === newLayer.id)
                    ),
                  ],
                  viewports: updatedViewports,
                };
                setProject(updatedProject);

                notifications.success(
                  'Surface created',
                  `${surfaceData.entities.length} entities added at (${centerX.toFixed(0)}, ${centerY.toFixed(0)}).`
                );
              }
              setShowSurfaceImport(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
