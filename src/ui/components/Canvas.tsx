/**
 * CAD Canvas Component
 * Main drawing canvas using HTML5 Canvas / Fabric.js
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Project, DrawingTool, Point2D, Entity } from '../../core/types';
import { useCADStore } from '../store/cadStore';
import { screenToWorld, worldToScreen } from '../../core/engine';
import {
  distance,
  midpoint,
  snapToGrid,
} from '../../core/geometry';
import './Canvas.css';

interface CanvasProps {
  project: Project | null;
  activeTool: DrawingTool;
  activeLayerId: string;
}

export function Canvas({ project, activeTool, activeLayerId }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mousePos, setMousePos] = useState<Point2D>({ x: 0, y: 0 });
  const [worldMousePos, setWorldMousePos] = useState<Point2D>({ x: 0, y: 0 });

  const {
    isDrawing,
    currentPoints,
    previewEntity,
    gridSettings,
    snapSettings,
    selectedEntityIds,
    startDrawing,
    addDrawingPoint,
    finishDrawing,
    cancelDrawing,
    setPreviewEntity,
    addEntity,
    selectEntity,
    clearSelection,
    setZoom,
    setPan,
  } = useCADStore();

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get active viewport
  const viewport = project?.viewports.find((v) => v.isActive) || {
    zoom: 1,
    pan: { x: 0, y: 0 },
    rotation: 0,
  };

  // Convert screen to world coordinates
  const toWorld = useCallback(
    (screenPoint: Point2D): Point2D => {
      return screenToWorld(screenPoint, viewport as any, canvasSize);
    },
    [viewport, canvasSize]
  );

  // Convert world to screen coordinates
  const toScreen = useCallback(
    (worldPoint: Point2D): Point2D => {
      return worldToScreen(worldPoint, viewport as any, canvasSize);
    },
    [viewport, canvasSize]
  );

  // Apply snapping
  const applySnap = useCallback(
    (point: Point2D): Point2D => {
      if (!snapSettings.enabled) return point;

      if (snapSettings.gridSnap && gridSettings.visible) {
        return snapToGrid(point, gridSettings.spacing);
      }

      // TODO: Add entity snap points

      return point;
    },
    [snapSettings, gridSettings]
  );

  // Draw grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!gridSettings.visible) return;

      const spacing = gridSettings.spacing * viewport.zoom;
      const majorSpacing = spacing * gridSettings.majorLineEvery;

      // Calculate grid bounds
      const startX = (canvasSize.width / 2 + viewport.pan.x) % spacing;
      const startY = (canvasSize.height / 2 + viewport.pan.y) % spacing;

      ctx.save();

      // Minor grid lines
      ctx.strokeStyle = gridSettings.color;
      ctx.globalAlpha = gridSettings.opacity;
      ctx.lineWidth = 0.5;

      ctx.beginPath();
      for (let x = startX; x < canvasSize.width; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
      }
      for (let y = startY; y < canvasSize.height; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
      }
      ctx.stroke();

      // Major grid lines
      const majorStartX = (canvasSize.width / 2 + viewport.pan.x) % majorSpacing;
      const majorStartY = (canvasSize.height / 2 + viewport.pan.y) % majorSpacing;

      ctx.strokeStyle = gridSettings.majorColor;
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let x = majorStartX; x < canvasSize.width; x += majorSpacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
      }
      for (let y = majorStartY; y < canvasSize.height; y += majorSpacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
      }
      ctx.stroke();

      // Origin axes
      const origin = toScreen({ x: 0, y: 0 });
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(origin.x, 0);
      ctx.lineTo(origin.x, canvasSize.height);
      ctx.stroke();

      ctx.strokeStyle = '#00ff00';
      ctx.beginPath();
      ctx.moveTo(0, origin.y);
      ctx.lineTo(canvasSize.width, origin.y);
      ctx.stroke();

      ctx.restore();
    },
    [gridSettings, viewport, canvasSize, toScreen]
  );

  // Draw entity
  const drawEntity = useCallback(
    (ctx: CanvasRenderingContext2D, entity: Entity, isSelected: boolean) => {
      if (!entity.visible) return;

      const layer = project?.layers.find((l) => l.id === entity.layerId);
      if (layer && !layer.visible) return;

      ctx.save();

      // Apply style
      ctx.strokeStyle = isSelected ? '#0066ff' : entity.style.strokeColor;
      ctx.lineWidth = entity.style.strokeWidth * viewport.zoom;
      ctx.globalAlpha = entity.style.opacity;

      if (entity.style.fillColor) {
        ctx.fillStyle = entity.style.fillColor;
      }

      // Apply line type
      switch (entity.style.lineType) {
        case 'dashed':
          ctx.setLineDash([10 * viewport.zoom, 5 * viewport.zoom]);
          break;
        case 'dotted':
          ctx.setLineDash([2 * viewport.zoom, 3 * viewport.zoom]);
          break;
        case 'dashdot':
          ctx.setLineDash([10 * viewport.zoom, 3 * viewport.zoom, 2 * viewport.zoom, 3 * viewport.zoom]);
          break;
        default:
          ctx.setLineDash([]);
      }

      ctx.beginPath();

      switch (entity.type) {
        case 'line': {
          const start = toScreen(entity.startPoint);
          const end = toScreen(entity.endPoint);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          ctx.stroke();
          break;
        }

        case 'polyline': {
          if (entity.points.length < 2) break;
          const firstPoint = toScreen(entity.points[0]);
          ctx.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < entity.points.length; i++) {
            const point = toScreen(entity.points[i]);
            ctx.lineTo(point.x, point.y);
          }
          if (entity.closed) {
            ctx.closePath();
            if (entity.style.fillColor) ctx.fill();
          }
          ctx.stroke();
          break;
        }

        case 'circle': {
          const center = toScreen(entity.center);
          const radius = entity.radius * viewport.zoom;
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          if (entity.style.fillColor) ctx.fill();
          ctx.stroke();
          break;
        }

        case 'arc': {
          const center = toScreen(entity.center);
          const radius = entity.radius * viewport.zoom;
          ctx.arc(center.x, center.y, radius, entity.startAngle, entity.endAngle);
          ctx.stroke();
          break;
        }

        case 'rectangle': {
          const topLeft = toScreen(entity.topLeft);
          const width = entity.width * viewport.zoom;
          const height = entity.height * viewport.zoom;

          if (entity.cornerRadius) {
            const r = entity.cornerRadius * viewport.zoom;
            ctx.moveTo(topLeft.x + r, topLeft.y);
            ctx.lineTo(topLeft.x + width - r, topLeft.y);
            ctx.arc(topLeft.x + width - r, topLeft.y + r, r, -Math.PI / 2, 0);
            ctx.lineTo(topLeft.x + width, topLeft.y + height - r);
            ctx.arc(topLeft.x + width - r, topLeft.y + height - r, r, 0, Math.PI / 2);
            ctx.lineTo(topLeft.x + r, topLeft.y + height);
            ctx.arc(topLeft.x + r, topLeft.y + height - r, r, Math.PI / 2, Math.PI);
            ctx.lineTo(topLeft.x, topLeft.y + r);
            ctx.arc(topLeft.x + r, topLeft.y + r, r, Math.PI, -Math.PI / 2);
          } else {
            ctx.rect(topLeft.x, topLeft.y, width, height);
          }

          if (entity.style.fillColor) ctx.fill();
          ctx.stroke();
          break;
        }

        case 'text': {
          const pos = toScreen(entity.position);
          ctx.font = `${entity.fontSize * viewport.zoom}px ${entity.fontFamily}`;
          ctx.textAlign = entity.alignment;
          ctx.fillStyle = entity.style.strokeColor;
          ctx.save();
          ctx.translate(pos.x, pos.y);
          ctx.rotate(entity.rotation);
          ctx.fillText(entity.content, 0, 0);
          ctx.restore();
          break;
        }

        // Add more entity types as needed
      }

      // Draw selection handles
      if (isSelected) {
        drawSelectionHandles(ctx, entity);
      }

      ctx.restore();
    },
    [project, viewport, toScreen]
  );

  // Draw selection handles
  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, entity: Entity) => {
    ctx.fillStyle = '#0066ff';
    const handleSize = 6;

    const drawHandle = (point: Point2D) => {
      const screenPoint = toScreen(point);
      ctx.fillRect(
        screenPoint.x - handleSize / 2,
        screenPoint.y - handleSize / 2,
        handleSize,
        handleSize
      );
    };

    switch (entity.type) {
      case 'line':
        drawHandle(entity.startPoint);
        drawHandle(entity.endPoint);
        drawHandle(midpoint(entity.startPoint, entity.endPoint));
        break;

      case 'circle':
        drawHandle(entity.center);
        drawHandle({ x: entity.center.x + entity.radius, y: entity.center.y });
        drawHandle({ x: entity.center.x - entity.radius, y: entity.center.y });
        drawHandle({ x: entity.center.x, y: entity.center.y + entity.radius });
        drawHandle({ x: entity.center.x, y: entity.center.y - entity.radius });
        break;

      case 'rectangle':
        drawHandle(entity.topLeft);
        drawHandle({ x: entity.topLeft.x + entity.width, y: entity.topLeft.y });
        drawHandle({ x: entity.topLeft.x + entity.width, y: entity.topLeft.y + entity.height });
        drawHandle({ x: entity.topLeft.x, y: entity.topLeft.y + entity.height });
        break;

      // Add more cases
    }
  };

  // Draw preview
  const drawPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!isDrawing || currentPoints.length === 0) return;

      ctx.save();
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);

      const layer = project?.layers.find((l) => l.id === activeLayerId);
      if (layer) {
        ctx.strokeStyle = layer.color;
      }

      ctx.beginPath();

      switch (activeTool) {
        case 'line': {
          const start = toScreen(currentPoints[0]);
          const end = toScreen(worldMousePos);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          break;
        }

        case 'polyline': {
          const firstPoint = toScreen(currentPoints[0]);
          ctx.moveTo(firstPoint.x, firstPoint.y);
          for (let i = 1; i < currentPoints.length; i++) {
            const point = toScreen(currentPoints[i]);
            ctx.lineTo(point.x, point.y);
          }
          const endPoint = toScreen(worldMousePos);
          ctx.lineTo(endPoint.x, endPoint.y);
          break;
        }

        case 'circle': {
          const center = toScreen(currentPoints[0]);
          const radiusPoint = toScreen(worldMousePos);
          const radius = distance(center, radiusPoint);
          ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
          break;
        }

        case 'rectangle': {
          const start = toScreen(currentPoints[0]);
          const end = toScreen(worldMousePos);
          ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
          break;
        }
      }

      ctx.stroke();
      ctx.restore();
    },
    [isDrawing, currentPoints, activeTool, worldMousePos, toScreen, project, activeLayerId]
  );

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Draw grid
    drawGrid(ctx);

    // Draw entities
    if (project) {
      // Sort entities by layer order
      const sortedEntities = [...project.entities].sort((a, b) => {
        const layerA = project.layers.find((l) => l.id === a.layerId);
        const layerB = project.layers.find((l) => l.id === b.layerId);
        return (layerA?.order || 0) - (layerB?.order || 0);
      });

      for (const entity of sortedEntities) {
        const isSelected = selectedEntityIds.includes(entity.id);
        drawEntity(ctx, entity, isSelected);
      }
    }

    // Draw preview
    drawPreview(ctx);

    // Draw cursor crosshair for drawing tools
    if (['line', 'polyline', 'circle', 'rectangle', 'polygon'].includes(activeTool)) {
      ctx.save();
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);

      ctx.beginPath();
      ctx.moveTo(mousePos.x - 20, mousePos.y);
      ctx.lineTo(mousePos.x + 20, mousePos.y);
      ctx.moveTo(mousePos.x, mousePos.y - 20);
      ctx.lineTo(mousePos.x, mousePos.y + 20);
      ctx.stroke();

      ctx.restore();
    }
  }, [
    canvasSize,
    project,
    selectedEntityIds,
    viewport,
    gridSettings,
    isDrawing,
    currentPoints,
    activeTool,
    mousePos,
    drawGrid,
    drawEntity,
    drawPreview,
  ]);

  // Mouse event handlers
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const screenPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      setMousePos(screenPos);
      const worldPos = applySnap(toWorld(screenPos));
      setWorldMousePos(worldPos);
    },
    [toWorld, applySnap]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return; // Left click only

      const worldPos = worldMousePos;

      switch (activeTool) {
        case 'select':
          // Find entity under cursor
          // TODO: Implement proper hit testing
          clearSelection();
          break;

        case 'pan':
          // Start panning
          break;

        case 'line':
        case 'circle':
        case 'rectangle':
          if (!isDrawing) {
            startDrawing(worldPos);
          }
          break;

        case 'polyline':
          if (!isDrawing) {
            startDrawing(worldPos);
          } else {
            addDrawingPoint(worldPos);
          }
          break;
      }
    },
    [activeTool, worldMousePos, isDrawing, startDrawing, addDrawingPoint, clearSelection]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) return;

      const worldPos = worldMousePos;

      switch (activeTool) {
        case 'line':
          if (isDrawing && currentPoints.length > 0) {
            const lineEntity = {
              id: Math.random().toString(36).substring(2, 15),
              type: 'line' as const,
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous' as const,
              },
              startPoint: currentPoints[0],
              endPoint: worldPos,
            };
            addEntity(lineEntity);
            finishDrawing();
          }
          break;

        case 'circle':
          if (isDrawing && currentPoints.length > 0) {
            const radius = distance(currentPoints[0], worldPos);
            const circleEntity = {
              id: Math.random().toString(36).substring(2, 15),
              type: 'circle' as const,
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous' as const,
              },
              center: currentPoints[0],
              radius,
            };
            addEntity(circleEntity);
            finishDrawing();
          }
          break;

        case 'rectangle':
          if (isDrawing && currentPoints.length > 0) {
            const start = currentPoints[0];
            const topLeft = {
              x: Math.min(start.x, worldPos.x),
              y: Math.min(start.y, worldPos.y),
            };
            const width = Math.abs(worldPos.x - start.x);
            const height = Math.abs(worldPos.y - start.y);

            const rectEntity = {
              id: Math.random().toString(36).substring(2, 15),
              type: 'rectangle' as const,
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous' as const,
              },
              topLeft,
              width,
              height,
            };
            addEntity(rectEntity);
            finishDrawing();
          }
          break;
      }
    },
    [
      activeTool,
      isDrawing,
      currentPoints,
      worldMousePos,
      activeLayerId,
      project,
      addEntity,
      finishDrawing,
    ]
  );

  const handleDoubleClick = useCallback(() => {
    if (activeTool === 'polyline' && isDrawing && currentPoints.length >= 2) {
      const polylineEntity = {
        id: Math.random().toString(36).substring(2, 15),
        type: 'polyline' as const,
        layerId: activeLayerId,
        visible: true,
        locked: false,
        style: {
          strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
          strokeWidth: 1,
          opacity: 1,
          lineType: 'continuous' as const,
        },
        points: currentPoints,
        closed: false,
      };
      addEntity(polylineEntity);
      finishDrawing();
    }
  }, [activeTool, isDrawing, currentPoints, activeLayerId, project, addEntity, finishDrawing]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = viewport.zoom;
      const newZoom = Math.max(0.1, Math.min(10, currentZoom * zoomFactor));

      setZoom(newZoom);
    },
    [viewport.zoom, setZoom]
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isDrawing) {
      cancelDrawing();
    }
  }, [isDrawing, cancelDrawing]);

  return (
    <div ref={containerRef} className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ cursor: getCursor(activeTool, isDrawing) }}
      />
      <div className="canvas-coords">
        X: {worldMousePos.x.toFixed(2)} Y: {worldMousePos.y.toFixed(2)}
      </div>
    </div>
  );
}

function getCursor(tool: DrawingTool, isDrawing: boolean): string {
  switch (tool) {
    case 'select':
      return 'default';
    case 'pan':
      return isDrawing ? 'grabbing' : 'grab';
    case 'zoom':
      return 'zoom-in';
    case 'line':
    case 'polyline':
    case 'circle':
    case 'rectangle':
    case 'polygon':
    case 'arc':
      return 'crosshair';
    case 'text':
      return 'text';
    default:
      return 'default';
  }
}
