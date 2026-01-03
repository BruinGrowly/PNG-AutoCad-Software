/**
 * CAD Application State Management
 * Using Zustand for lightweight state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createNewProject,
  createLayer,
  DEFAULT_GRID,
  DEFAULT_SNAP,
} from '../../core/engine.js';

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useCADStore = create(
  persist(
    (set, get) => ({
      // Initial state
      project: null,
      isModified: false,
      activeTool: 'select',
      previousTool: 'select',
      selectedEntityIds: [],
      activeLayerId: 'layer-0',
      isDrawing: false,
      currentPoints: [],
      previewEntity: null,
      gridSettings: DEFAULT_GRID,
      snapSettings: DEFAULT_SNAP,
      commandHistory: [],
      undoIndex: -1,
      clipboard: [],

      // Project actions
      setProject: (project) => set({ project, isModified: false }),

      updateProject: (updates) => set((state) => ({
        project: state.project ? { ...state.project, ...updates, modifiedAt: new Date() } : null,
        isModified: true,
      })),

      // Tool actions
      setActiveTool: (tool) => set((state) => ({
        activeTool: tool,
        previousTool: state.activeTool,
        isDrawing: false,
        currentPoints: [],
        previewEntity: null,
      })),

      setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

      // Entity operations
      addEntity: (entity) => set((state) => {
        if (!state.project) return state;

        // Store pure data, not closures - prevents recursive command creation
        const command = {
          id: generateId(),
          type: 'add-entity',
          timestamp: new Date(),
          entityId: entity.id,
          entityData: JSON.parse(JSON.stringify(entity)), // Deep clone
        };

        return {
          project: {
            ...state.project,
            entities: [...state.project.entities, entity],
            modifiedAt: new Date(),
          },
          commandHistory: [...state.commandHistory.slice(0, state.undoIndex + 1), command],
          undoIndex: state.undoIndex + 1,
          isModified: true,
        };
      }),

      updateEntity: (id, updates) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            entities: state.project.entities.map((e) =>
              e.id === id ? { ...e, ...updates } : e
            ),
            modifiedAt: new Date(),
          },
          isModified: true,
        };
      }),

      deleteEntity: (id) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            entities: state.project.entities.filter((e) => e.id !== id),
            modifiedAt: new Date(),
          },
          selectedEntityIds: state.selectedEntityIds.filter((eid) => eid !== id),
          isModified: true,
        };
      }),

      deleteSelectedEntities: () => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            entities: state.project.entities.filter(
              (e) => !state.selectedEntityIds.includes(e.id)
            ),
            modifiedAt: new Date(),
          },
          selectedEntityIds: [],
          isModified: true,
        };
      }),

      // Selection operations
      selectEntity: (id, addToSelection = false) => set((state) => ({
        selectedEntityIds: addToSelection
          ? state.selectedEntityIds.includes(id)
            ? state.selectedEntityIds.filter((eid) => eid !== id)
            : [...state.selectedEntityIds, id]
          : [id],
      })),

      selectEntities: (ids) => set({ selectedEntityIds: ids }),

      clearSelection: () => set({ selectedEntityIds: [] }),

      selectAll: () => set((state) => ({
        selectedEntityIds: state.project?.entities
          .filter((e) => e.visible && !e.locked)
          .map((e) => e.id) || [],
      })),

      // Layer operations
      addLayer: (name, color = '#000000') => set((state) => {
        if (!state.project) return state;

        const newLayer = createLayer(name, color);
        return {
          project: {
            ...state.project,
            layers: [...state.project.layers, newLayer],
            modifiedAt: new Date(),
          },
          isModified: true,
        };
      }),

      updateLayer: (id, updates) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((l) =>
              l.id === id ? { ...l, ...updates } : l
            ),
            modifiedAt: new Date(),
          },
          isModified: true,
        };
      }),

      deleteLayer: (id) => set((state) => {
        if (!state.project) return state;
        if (state.project.layers.length <= 1) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.filter((l) => l.id !== id),
            entities: state.project.entities.map((e) =>
              e.layerId === id ? { ...e, layerId: 'layer-0' } : e
            ),
            modifiedAt: new Date(),
          },
          activeLayerId: state.activeLayerId === id ? 'layer-0' : state.activeLayerId,
          isModified: true,
        };
      }),

      toggleLayerVisibility: (id) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((l) =>
              l.id === id ? { ...l, visible: !l.visible } : l
            ),
          },
        };
      }),

      toggleLayerLock: (id) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((l) =>
              l.id === id ? { ...l, locked: !l.locked } : l
            ),
          },
        };
      }),

      // Drawing state
      startDrawing: (point) => set({
        isDrawing: true,
        currentPoints: [point],
      }),

      addDrawingPoint: (point) => set((state) => ({
        currentPoints: [...state.currentPoints, point],
      })),

      finishDrawing: () => set({
        isDrawing: false,
        currentPoints: [],
        previewEntity: null,
      }),

      cancelDrawing: () => set({
        isDrawing: false,
        currentPoints: [],
        previewEntity: null,
      }),

      setPreviewEntity: (entity) => set({ previewEntity: entity }),

      // Grid and Snap
      setGridSettings: (settings) => set((state) => ({
        gridSettings: { ...state.gridSettings, ...settings },
      })),

      setSnapSettings: (settings) => set((state) => ({
        snapSettings: { ...state.snapSettings, ...settings },
      })),

      toggleGrid: () => set((state) => ({
        gridSettings: { ...state.gridSettings, visible: !state.gridSettings.visible },
      })),

      toggleSnap: () => set((state) => ({
        snapSettings: { ...state.snapSettings, enabled: !state.snapSettings.enabled },
      })),

      // Undo/Redo - applies changes directly without calling action functions
      undo: () => set((state) => {
        if (state.undoIndex < 0 || !state.project) return state;

        const command = state.commandHistory[state.undoIndex];
        let newEntities = [...state.project.entities];
        let newSelectedIds = [...state.selectedEntityIds];

        // Interpret command data and apply reverse operation
        switch (command.type) {
          case 'add-entity':
            // Undo add = remove the entity
            newEntities = newEntities.filter(e => e.id !== command.entityId);
            newSelectedIds = newSelectedIds.filter(id => id !== command.entityId);
            break;
          case 'delete-entity':
            // Undo delete = restore the entity
            newEntities.push(command.entityData);
            break;
          case 'modify-entity':
            // Undo modify = restore old state
            newEntities = newEntities.map(e =>
              e.id === command.entityId ? command.oldData : e
            );
            break;
          default:
            console.warn('Unknown command type:', command.type);
        }

        return {
          project: {
            ...state.project,
            entities: newEntities,
            modifiedAt: new Date(),
          },
          selectedEntityIds: newSelectedIds,
          undoIndex: state.undoIndex - 1,
          isModified: true,
        };
      }),

      redo: () => set((state) => {
        if (state.undoIndex >= state.commandHistory.length - 1 || !state.project) return state;

        const command = state.commandHistory[state.undoIndex + 1];
        let newEntities = [...state.project.entities];

        // Interpret command data and re-apply operation
        switch (command.type) {
          case 'add-entity':
            // Redo add = add the entity back
            newEntities.push(command.entityData);
            break;
          case 'delete-entity':
            // Redo delete = remove the entity again
            newEntities = newEntities.filter(e => e.id !== command.entityId);
            break;
          case 'modify-entity':
            // Redo modify = apply new state
            newEntities = newEntities.map(e =>
              e.id === command.entityId ? command.newData : e
            );
            break;
          default:
            console.warn('Unknown command type:', command.type);
        }

        return {
          project: {
            ...state.project,
            entities: newEntities,
            modifiedAt: new Date(),
          },
          undoIndex: state.undoIndex + 1,
          isModified: true,
        };
      }),

      canUndo: () => get().undoIndex >= 0,
      canRedo: () => get().undoIndex < get().commandHistory.length - 1,

      // Clipboard
      copy: () => set((state) => {
        if (!state.project) return state;

        const selectedEntities = state.project.entities.filter(
          (e) => state.selectedEntityIds.includes(e.id)
        );

        return { clipboard: selectedEntities };
      }),

      cut: () => {
        get().copy();
        get().deleteSelectedEntities();
      },

      paste: (offset = { x: 20, y: 20 }) => set((state) => {
        if (!state.project || state.clipboard.length === 0) return state;

        const newEntities = state.clipboard.map((e) => ({
          ...e,
          id: generateId(),
          ...(e.type === 'line' && {
            startPoint: { x: e.startPoint.x + offset.x, y: e.startPoint.y + offset.y },
            endPoint: { x: e.endPoint.x + offset.x, y: e.endPoint.y + offset.y },
          }),
        }));

        return {
          project: {
            ...state.project,
            entities: [...state.project.entities, ...newEntities],
            modifiedAt: new Date(),
          },
          selectedEntityIds: newEntities.map((e) => e.id),
          isModified: true,
        };
      }),

      // Viewport
      setZoom: (zoom) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            viewports: state.project.viewports.map((v) =>
              v.isActive ? { ...v, zoom: Math.max(0.1, Math.min(10, zoom)) } : v
            ),
          },
        };
      }),

      setPan: (pan) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            viewports: state.project.viewports.map((v) =>
              v.isActive ? { ...v, pan } : v
            ),
          },
        };
      }),

      // Reset
      reset: () => set({
        project: null,
        isModified: false,
        activeTool: 'select',
        previousTool: 'select',
        selectedEntityIds: [],
        activeLayerId: 'layer-0',
        isDrawing: false,
        currentPoints: [],
        previewEntity: null,
        commandHistory: [],
        undoIndex: -1,
        clipboard: [],
      }),
    }),
    {
      name: 'png-cad-store',
      partialize: (state) => ({
        gridSettings: state.gridSettings,
        snapSettings: state.snapSettings,
      }),
    }
  )
);
