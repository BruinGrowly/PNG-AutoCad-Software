/**
 * CAD Application State Management
 * Using Zustand for lightweight state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  createLayer,
  DEFAULT_GRID,
  DEFAULT_SNAP,
} from '../../core/engine.js';
import { generateId } from '../../core/id.js';

const MAX_HISTORY = 500;

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function ensureEntityId(entity) {
  return entity.id ? entity : { ...entity, id: generateId() };
}

function appendCommand(state, command) {
  const nextHistory = [
    ...state.commandHistory.slice(0, state.undoIndex + 1),
    command,
  ];

  if (nextHistory.length > MAX_HISTORY) {
    const trimmed = nextHistory.slice(nextHistory.length - MAX_HISTORY);
    return { commandHistory: trimmed, undoIndex: trimmed.length - 1 };
  }

  return { commandHistory: nextHistory, undoIndex: state.undoIndex + 1 };
}

function createAddEntityCommand(entity) {
  return {
    id: generateId(),
    type: 'add-entity',
    timestamp: new Date(),
    entityId: entity.id,
    entityData: deepClone(entity),
  };
}

function createAddEntitiesCommand(entities) {
  return {
    id: generateId(),
    type: 'add-entities',
    timestamp: new Date(),
    entityIds: entities.map((entity) => entity.id),
    entityDataList: deepClone(entities),
  };
}

function createDeleteEntityCommand(entity) {
  return {
    id: generateId(),
    type: 'delete-entity',
    timestamp: new Date(),
    entityId: entity.id,
    entityData: deepClone(entity),
  };
}

function createDeleteEntitiesCommand(entities) {
  return {
    id: generateId(),
    type: 'delete-entities',
    timestamp: new Date(),
    entityIds: entities.map((entity) => entity.id),
    entityDataList: deepClone(entities),
  };
}

function createModifyEntityCommand(oldEntity, newEntity) {
  return {
    id: generateId(),
    type: 'modify-entity',
    timestamp: new Date(),
    entityId: oldEntity.id,
    oldData: deepClone(oldEntity),
    newData: deepClone(newEntity),
  };
}

function applyPointOffset(point, offset) {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

function translateEntity(entity, offset) {
  const translated = deepClone(entity);

  if (translated.startPoint) translated.startPoint = applyPointOffset(translated.startPoint, offset);
  if (translated.endPoint) translated.endPoint = applyPointOffset(translated.endPoint, offset);
  if (translated.center) translated.center = applyPointOffset(translated.center, offset);
  if (translated.topLeft) translated.topLeft = applyPointOffset(translated.topLeft, offset);
  if (translated.position) translated.position = applyPointOffset(translated.position, offset);
  if (translated.points) translated.points = translated.points.map((p) => applyPointOffset(p, offset));
  if (translated.controlPoints) translated.controlPoints = translated.controlPoints.map((p) => applyPointOffset(p, offset));
  if (translated.boundary) translated.boundary = translated.boundary.map((p) => applyPointOffset(p, offset));
  if (translated.point1) translated.point1 = applyPointOffset(translated.point1, offset);
  if (translated.point2) translated.point2 = applyPointOffset(translated.point2, offset);
  if (translated.textPosition) translated.textPosition = applyPointOffset(translated.textPosition, offset);
  if (translated.dimLinePosition) translated.dimLinePosition = applyPointOffset(translated.dimLinePosition, offset);
  if (translated.vertex) translated.vertex = applyPointOffset(translated.vertex, offset);

  return translated;
}

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
      setProject: (project) => set(() => {
        const fallbackLayerId = project?.layers?.find((layer) => layer.id === 'layer-0')
          ? 'layer-0'
          : (project?.layers?.[0]?.id || 'layer-0');

        return {
          project,
          isModified: false,
          selectedEntityIds: [],
          commandHistory: [],
          undoIndex: -1,
          activeLayerId: fallbackLayerId,
        };
      }),

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

        const entityToAdd = ensureEntityId(entity);
        const command = createAddEntityCommand(entityToAdd);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: [...state.project.entities, entityToAdd],
            modifiedAt: new Date(),
          },
          ...historyState,
          isModified: true,
        };
      }),

      addEntities: (entities) => set((state) => {
        if (!state.project || !entities || entities.length === 0) return state;

        const entitiesToAdd = entities.map(ensureEntityId);
        const command = createAddEntitiesCommand(entitiesToAdd);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: [...state.project.entities, ...entitiesToAdd],
            modifiedAt: new Date(),
          },
          selectedEntityIds: entitiesToAdd.map((entity) => entity.id),
          ...historyState,
          isModified: true,
        };
      }),

      updateEntity: (id, updates) => set((state) => {
        if (!state.project) return state;

        const existing = state.project.entities.find((entity) => entity.id === id);
        if (!existing) return state;

        const updated = { ...existing, ...updates };
        const command = createModifyEntityCommand(existing, updated);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: state.project.entities.map((entity) =>
              entity.id === id ? updated : entity
            ),
            modifiedAt: new Date(),
          },
          ...historyState,
          isModified: true,
        };
      }),

      deleteEntity: (id) => set((state) => {
        if (!state.project) return state;

        const entityToDelete = state.project.entities.find((entity) => entity.id === id);
        if (!entityToDelete) return state;

        const command = createDeleteEntityCommand(entityToDelete);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: state.project.entities.filter((entity) => entity.id !== id),
            modifiedAt: new Date(),
          },
          selectedEntityIds: state.selectedEntityIds.filter((entityId) => entityId !== id),
          ...historyState,
          isModified: true,
        };
      }),

      deleteSelectedEntities: () => set((state) => {
        if (!state.project || state.selectedEntityIds.length === 0) return state;

        const selectedEntities = state.project.entities.filter(
          (entity) => state.selectedEntityIds.includes(entity.id)
        );
        if (selectedEntities.length === 0) return state;

        const command = createDeleteEntitiesCommand(selectedEntities);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: state.project.entities.filter(
              (entity) => !state.selectedEntityIds.includes(entity.id)
            ),
            modifiedAt: new Date(),
          },
          selectedEntityIds: [],
          ...historyState,
          isModified: true,
        };
      }),

      // Selection operations
      selectEntity: (id, addToSelection = false) => set((state) => ({
        selectedEntityIds: addToSelection
          ? state.selectedEntityIds.includes(id)
            ? state.selectedEntityIds.filter((entityId) => entityId !== id)
            : [...state.selectedEntityIds, id]
          : [id],
      })),

      selectEntities: (ids) => set({ selectedEntityIds: ids }),

      clearSelection: () => set({ selectedEntityIds: [] }),

      selectAll: () => set((state) => ({
        selectedEntityIds: state.project?.entities
          .filter((entity) => entity.visible && !entity.locked)
          .map((entity) => entity.id) || [],
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
            layers: state.project.layers.map((layer) =>
              layer.id === id ? { ...layer, ...updates } : layer
            ),
            modifiedAt: new Date(),
          },
          isModified: true,
        };
      }),

      deleteLayer: (id) => set((state) => {
        if (!state.project) return state;
        if (id === 'layer-0') return state;
        if (state.project.layers.length <= 1) return state;

        const remainingLayers = state.project.layers.filter((layer) => layer.id !== id);
        const fallbackLayerId = remainingLayers.find((layer) => layer.id === 'layer-0')
          ? 'layer-0'
          : remainingLayers[0]?.id;

        if (!fallbackLayerId) return state;

        return {
          project: {
            ...state.project,
            layers: remainingLayers,
            entities: state.project.entities.map((entity) =>
              entity.layerId === id ? { ...entity, layerId: fallbackLayerId } : entity
            ),
            modifiedAt: new Date(),
          },
          activeLayerId: state.activeLayerId === id ? fallbackLayerId : state.activeLayerId,
          isModified: true,
        };
      }),

      toggleLayerVisibility: (id) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((layer) =>
              layer.id === id ? { ...layer, visible: !layer.visible } : layer
            ),
          },
        };
      }),

      toggleLayerLock: (id) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            layers: state.project.layers.map((layer) =>
              layer.id === id ? { ...layer, locked: !layer.locked } : layer
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

        switch (command.type) {
          case 'add-entity':
            newEntities = newEntities.filter((entity) => entity.id !== command.entityId);
            newSelectedIds = newSelectedIds.filter((id) => id !== command.entityId);
            break;

          case 'add-entities':
            newEntities = newEntities.filter(
              (entity) => !command.entityIds.includes(entity.id)
            );
            newSelectedIds = newSelectedIds.filter((id) => !command.entityIds.includes(id));
            break;

          case 'delete-entity':
            if (!newEntities.some((entity) => entity.id === command.entityId)) {
              newEntities.push(command.entityData);
            }
            break;

          case 'delete-entities':
            for (const entityData of command.entityDataList) {
              if (!newEntities.some((entity) => entity.id === entityData.id)) {
                newEntities.push(entityData);
              }
            }
            break;

          case 'modify-entity':
            newEntities = newEntities.map((entity) =>
              entity.id === command.entityId ? command.oldData : entity
            );
            break;

          default:
            return state;
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
        let newSelectedIds = [...state.selectedEntityIds];

        switch (command.type) {
          case 'add-entity':
            if (!newEntities.some((entity) => entity.id === command.entityId)) {
              newEntities.push(command.entityData);
            }
            break;

          case 'add-entities':
            for (const entityData of command.entityDataList) {
              if (!newEntities.some((entity) => entity.id === entityData.id)) {
                newEntities.push(entityData);
              }
            }
            newSelectedIds = command.entityIds;
            break;

          case 'delete-entity':
            newEntities = newEntities.filter((entity) => entity.id !== command.entityId);
            newSelectedIds = newSelectedIds.filter((id) => id !== command.entityId);
            break;

          case 'delete-entities':
            newEntities = newEntities.filter(
              (entity) => !command.entityIds.includes(entity.id)
            );
            newSelectedIds = newSelectedIds.filter((id) => !command.entityIds.includes(id));
            break;

          case 'modify-entity':
            newEntities = newEntities.map((entity) =>
              entity.id === command.entityId ? command.newData : entity
            );
            break;

          default:
            return state;
        }

        return {
          project: {
            ...state.project,
            entities: newEntities,
            modifiedAt: new Date(),
          },
          selectedEntityIds: newSelectedIds,
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
          (entity) => state.selectedEntityIds.includes(entity.id)
        );

        return { clipboard: deepClone(selectedEntities) };
      }),

      cut: () => {
        get().copy();
        get().deleteSelectedEntities();
      },

      paste: (offset = { x: 20, y: 20 }) => set((state) => {
        if (!state.project || state.clipboard.length === 0) return state;

        const newEntities = state.clipboard.map((entity) => ({
          ...translateEntity(entity, offset),
          id: generateId(),
        }));

        const command = createAddEntitiesCommand(newEntities);
        const historyState = appendCommand(state, command);

        return {
          project: {
            ...state.project,
            entities: [...state.project.entities, ...newEntities],
            modifiedAt: new Date(),
          },
          selectedEntityIds: newEntities.map((entity) => entity.id),
          ...historyState,
          isModified: true,
        };
      }),

      // Viewport
      setZoom: (zoom) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            viewports: state.project.viewports.map((viewport) =>
              viewport.isActive ? { ...viewport, zoom: Math.max(0.1, Math.min(10, zoom)) } : viewport
            ),
          },
        };
      }),

      setPan: (pan) => set((state) => {
        if (!state.project) return state;

        return {
          project: {
            ...state.project,
            viewports: state.project.viewports.map((viewport) =>
              viewport.isActive ? { ...viewport, pan } : viewport
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

