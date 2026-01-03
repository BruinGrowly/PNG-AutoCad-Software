/**
 * CAD Canvas Component
 * Main drawing canvas using HTML5 Canvas
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCADStore } from '../store/cadStore.js';
import { screenToWorld, worldToScreen, snapToGrid, trimEntity, extendEntity } from '../../core/engine.js';
import { distance, midpoint } from '../../core/geometry.js';
import './Canvas.css';

export function Canvas({ project, activeTool, activeLayerId }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [worldMousePos, setWorldMousePos] = useState({ x: 0, y: 0 });
  const [cuttingEdge, setCuttingEdge] = useState(null);  // For trim/extend tools

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
    updateEntity,
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
    (screenPoint) => {
      return screenToWorld(screenPoint, viewport, canvasSize);
    },
    [viewport, canvasSize]
  );

  // Convert world to screen coordinates
  const toScreen = useCallback(
    (worldPoint) => {
      return worldToScreen(worldPoint, viewport, canvasSize);
    },
    [viewport, canvasSize]
  );

  // Apply snapping
  const applySnap = useCallback(
    (point) => {
      if (!snapSettings.enabled) return point;

      if (snapSettings.gridSnap && gridSettings.visible) {
        return snapToGrid(point, gridSettings.spacing);
      }

      return point;
    },
    [snapSettings, gridSettings]
  );

  // Helper: distance from point to line segment
  const distanceToLineSegment = (point, lineStart, lineEnd) => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) return distance(point, lineStart);

    let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const projection = {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy,
    };

    return distance(point, projection);
  };

  // Find entity at a given world point (for trim/extend/select)
  const findEntityAtPoint = useCallback(
    (point, threshold = 10) => {
      if (!project?.entities) return null;

      for (const entity of project.entities) {
        if (!entity.visible) continue;

        // Check based on entity type
        switch (entity.type) {
          case 'line': {
            // Distance from point to line segment
            const { startPoint, endPoint } = entity;
            const lineDist = distanceToLineSegment(point, startPoint, endPoint);
            if (lineDist < threshold) return entity;
            break;
          }
          case 'circle': {
            // Distance to circle perimeter
            const distToCenter = distance(point, entity.center);
            const distToPerimeter = Math.abs(distToCenter - entity.radius);
            if (distToPerimeter < threshold) return entity;
            break;
          }
          case 'polyline': {
            // Check each segment
            for (let i = 0; i < entity.points.length - 1; i++) {
              const segDist = distanceToLineSegment(point, entity.points[i], entity.points[i + 1]);
              if (segDist < threshold) return entity;
            }
            if (entity.closed && entity.points.length > 2) {
              const closeDist = distanceToLineSegment(
                point,
                entity.points[entity.points.length - 1],
                entity.points[0]
              );
              if (closeDist < threshold) return entity;
            }
            break;
          }
          case 'rectangle': {
            // Check if near any edge
            const { topLeft, width, height } = entity;
            const corners = [
              topLeft,
              { x: topLeft.x + width, y: topLeft.y },
              { x: topLeft.x + width, y: topLeft.y + height },
              { x: topLeft.x, y: topLeft.y + height },
            ];
            for (let i = 0; i < 4; i++) {
              const next = (i + 1) % 4;
              const edgeDist = distanceToLineSegment(point, corners[i], corners[next]);
              if (edgeDist < threshold) return entity;
            }
            break;
          }
        }
      }
      return null;
    },
    [project]
  );

  // Draw grid
  const drawGrid = useCallback(
    (ctx) => {
      if (!gridSettings.visible) return;

      const spacing = gridSettings.spacing * viewport.zoom;
      const majorSpacing = spacing * gridSettings.majorLineEvery;

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
    (ctx, entity, isSelected) => {
      if (!entity.visible) return;

      const layer = project?.layers.find((l) => l.id === entity.layerId);
      if (layer && !layer.visible) return;

      ctx.save();

      ctx.strokeStyle = isSelected ? '#0066ff' : entity.style.strokeColor;
      ctx.lineWidth = entity.style.strokeWidth * viewport.zoom;
      ctx.globalAlpha = entity.style.opacity;

      if (entity.style.fillColor) {
        ctx.fillStyle = entity.style.fillColor;
      }

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
      }

      if (isSelected) {
        drawSelectionHandles(ctx, entity);
      }

      ctx.restore();
    },
    [project, viewport, toScreen]
  );

  // Draw selection handles
  const drawSelectionHandles = (ctx, entity) => {
    ctx.fillStyle = '#0066ff';
    const handleSize = 6;

    const drawHandle = (point) => {
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
    }
  };

  // Draw preview
  const drawPreview = useCallback(
    (ctx) => {
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

        case 'polygon': {
          // Polygon preview - same as polyline but shows closing line to first point
          const firstPt = toScreen(currentPoints[0]);
          ctx.moveTo(firstPt.x, firstPt.y);
          for (let i = 1; i < currentPoints.length; i++) {
            const point = toScreen(currentPoints[i]);
            ctx.lineTo(point.x, point.y);
          }
          const endPt = toScreen(worldMousePos);
          ctx.lineTo(endPt.x, endPt.y);
          // Show closing line back to start (dashed to indicate pending)
          ctx.setLineDash([3, 3]);
          ctx.lineTo(firstPt.x, firstPt.y);
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

        case 'arc': {
          // 3-point arc preview
          if (currentPoints.length === 1) {
            // Just show a line from first point to cursor
            const start = toScreen(currentPoints[0]);
            const end = toScreen(worldMousePos);
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
          } else if (currentPoints.length >= 2) {
            // Show the arc through all three points
            const p1 = currentPoints[0];
            const p2 = currentPoints[1];
            const p3 = worldMousePos;

            // Calculate arc center using 3-point circle formula
            const ax = p1.x, ay = p1.y;
            const bx = p2.x, by = p2.y;
            const cx = p3.x, cy = p3.y;

            const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

            if (Math.abs(d) > 0.0001) {
              const centerX = ((ax * ax + ay * ay) * (by - cy) +
                (bx * bx + by * by) * (cy - ay) +
                (cx * cx + cy * cy) * (ay - by)) / d;
              const centerY = ((ax * ax + ay * ay) * (cx - bx) +
                (bx * bx + by * by) * (ax - cx) +
                (cx * cx + cy * cy) * (bx - ax)) / d;

              const center = toScreen({ x: centerX, y: centerY });
              const radius = distance(center, toScreen(p1));
              const startAngle = Math.atan2(ay - centerY, ax - centerX);
              const endAngle = Math.atan2(cy - centerY, cx - centerX);

              // Determine if arc should go clockwise or counter-clockwise
              const midAngle = Math.atan2(by - centerY, bx - centerX);
              let counterClockwise = false;

              // Check if mid-angle is between start and end going counter-clockwise
              let angleDiff = (midAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
              let totalDiff = (endAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
              if (angleDiff > totalDiff) {
                counterClockwise = true;
              }

              ctx.arc(center.x, center.y, radius, startAngle, endAngle, counterClockwise);
            } else {
              // Points are collinear, draw lines
              const s1 = toScreen(p1);
              const s2 = toScreen(p2);
              const s3 = toScreen(p3);
              ctx.moveTo(s1.x, s1.y);
              ctx.lineTo(s2.x, s2.y);
              ctx.lineTo(s3.x, s3.y);
            }
          }
          break;
        }

        case 'measure':
        case 'dimension': {
          // Show a line with distance text
          const start = toScreen(currentPoints[0]);
          const end = toScreen(worldMousePos);
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);
          // Draw dimension text at midpoint
          const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
          ctx.fillStyle = '#0066ff';
          ctx.font = '12px Arial';
          const dist = distance(currentPoints[0], worldMousePos);
          ctx.fillText(dist.toFixed(1), mid.x + 5, mid.y - 5);
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

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    drawGrid(ctx);

    if (project) {
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

    drawPreview(ctx);

    // Draw cursor crosshair for drawing tools
    if (['line', 'polyline', 'circle', 'arc', 'rectangle', 'polygon', 'text', 'measure', 'dimension', 'offset', 'mirror', 'rotate', 'scale'].includes(activeTool)) {
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
    (e) => {
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
    (e) => {
      if (e.button !== 0) return;

      const worldPos = worldMousePos;

      switch (activeTool) {
        case 'select':
          clearSelection();
          break;

        case 'pan':
          break;

        case 'line':
        case 'circle':
        case 'rectangle':
          if (!isDrawing) {
            startDrawing(worldPos);
          }
          break;

        case 'arc':
          // Arc uses 3 points: start, through, end
          if (!isDrawing) {
            startDrawing(worldPos);
          } else if (currentPoints.length < 2) {
            addDrawingPoint(worldPos);
          }
          break;

        case 'polyline':
        case 'polygon':
          if (!isDrawing) {
            startDrawing(worldPos);
          } else {
            addDrawingPoint(worldPos);
          }
          break;

        case 'text':
          // Text is placed with a single click, then a prompt appears
          if (!isDrawing) {
            const textContent = prompt('Enter text:');
            if (textContent && textContent.trim()) {
              const textEntity = {
                id: Math.random().toString(36).substring(2, 15),
                type: 'text',
                layerId: activeLayerId,
                visible: true,
                locked: false,
                style: {
                  strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                  strokeWidth: 1,
                  opacity: 1,
                  lineType: 'continuous',
                },
                position: worldPos,
                content: textContent,
                fontSize: 12,
                fontFamily: 'Arial',
                alignment: 'left',
                rotation: 0,
              };
              addEntity(textEntity);
            }
          }
          break;

        case 'measure':
        case 'dimension':
          // Two-point measurement/dimension - click two points
          if (!isDrawing) {
            startDrawing(worldPos);
          }
          break;

        case 'offset':
        case 'mirror':
        case 'rotate':
        case 'scale':
          // These tools work on selected entities
          // If nothing selected, alert user
          if (selectedEntityIds.length === 0) {
            alert('Please select entities first, then use this tool.');
          } else if (!isDrawing) {
            // Start operation - first click is base point
            startDrawing(worldPos);
          }
          break;

        case 'trim':
          // Trim workflow: first click = select cutting edge, second click = select entity to trim
          {
            const entity = findEntityAtPoint(worldPos);
            if (!cuttingEdge) {
              // First click - select cutting edge
              if (entity) {
                setCuttingEdge(entity);
                alert(`Cutting edge selected: ${entity.type}. Now click on the entity to trim.`);
              } else {
                alert('Click on an entity to use as cutting edge.');
              }
            } else {
              // Second click - trim the entity
              if (entity && entity.id !== cuttingEdge.id) {
                const trimmed = trimEntity(entity, cuttingEdge, worldPos);
                if (trimmed) {
                  // Update the entity with trimmed version
                  updateEntity(entity.id, {
                    startPoint: trimmed.startPoint,
                    endPoint: trimmed.endPoint,
                  });
                  setCuttingEdge(null);  // Reset for next trim
                } else {
                  alert('Could not trim - no intersection found or entity type not supported.');
                }
              } else if (!entity) {
                alert('Click on an entity to trim it.');
              }
            }
          }
          break;

        case 'extend':
          // Extend workflow: similar to trim
          {
            const entity = findEntityAtPoint(worldPos);
            if (!cuttingEdge) {
              // First click - select boundary edge
              if (entity) {
                setCuttingEdge(entity);
                alert(`Boundary selected: ${entity.type}. Now click on the entity to extend.`);
              } else {
                alert('Click on an entity to use as boundary.');
              }
            } else {
              // Second click - extend the entity
              if (entity && entity.id !== cuttingEdge.id) {
                const extended = extendEntity(entity, cuttingEdge, worldPos);
                if (extended) {
                  // Update the entity with extended version
                  updateEntity(entity.id, {
                    startPoint: extended.startPoint,
                    endPoint: extended.endPoint,
                  });
                  setCuttingEdge(null);  // Reset for next extend
                } else {
                  alert('Could not extend - no intersection found or entity type not supported.');
                }
              } else if (!entity) {
                alert('Click on an entity to extend it.');
              }
            }
          }
          break;
      }
    },
    [activeTool, worldMousePos, isDrawing, startDrawing, addDrawingPoint, clearSelection, selectedEntityIds, activeLayerId, project, addEntity, cuttingEdge, findEntityAtPoint, updateEntity]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (e.button !== 0) return;

      const worldPos = worldMousePos;

      switch (activeTool) {
        case 'line':
          if (isDrawing && currentPoints.length > 0) {
            const lineEntity = {
              id: Math.random().toString(36).substring(2, 15),
              type: 'line',
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous',
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
              type: 'circle',
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous',
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
              type: 'rectangle',
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous',
              },
              topLeft,
              width,
              height,
            };
            addEntity(rectEntity);
            finishDrawing();
          }
          break;

        case 'arc':
          // Arc creation on third point (first two points are collected in mouseDown)
          if (isDrawing && currentPoints.length >= 2) {
            const p1 = currentPoints[0];
            const p2 = currentPoints[1];
            const p3 = worldPos;

            // Calculate arc center using 3-point circle formula
            const ax = p1.x, ay = p1.y;
            const bx = p2.x, by = p2.y;
            const cx = p3.x, cy = p3.y;

            const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));

            if (Math.abs(d) > 0.0001) {
              const centerX = ((ax * ax + ay * ay) * (by - cy) +
                (bx * bx + by * by) * (cy - ay) +
                (cx * cx + cy * cy) * (ay - by)) / d;
              const centerY = ((ax * ax + ay * ay) * (cx - bx) +
                (bx * bx + by * by) * (ax - cx) +
                (cx * cx + cy * cy) * (bx - ax)) / d;

              const radius = Math.sqrt((ax - centerX) ** 2 + (ay - centerY) ** 2);
              const startAngle = Math.atan2(ay - centerY, ax - centerX);
              const endAngle = Math.atan2(cy - centerY, cx - centerX);

              const arcEntity = {
                id: Math.random().toString(36).substring(2, 15),
                type: 'arc',
                layerId: activeLayerId,
                visible: true,
                locked: false,
                style: {
                  strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                  strokeWidth: 1,
                  opacity: 1,
                  lineType: 'continuous',
                },
                center: { x: centerX, y: centerY },
                radius,
                startAngle,
                endAngle,
              };
              addEntity(arcEntity);
            }
            finishDrawing();
          }
          break;

        case 'measure':
          // Show distance measurement
          if (isDrawing && currentPoints.length > 0) {
            const dist = distance(currentPoints[0], worldPos);
            const dx = Math.abs(worldPos.x - currentPoints[0].x);
            const dy = Math.abs(worldPos.y - currentPoints[0].y);
            alert(`Distance: ${dist.toFixed(2)} units\nΔX: ${dx.toFixed(2)}\nΔY: ${dy.toFixed(2)}`);
            finishDrawing();
          }
          break;

        case 'dimension':
          // Create a dimension entity
          if (isDrawing && currentPoints.length > 0) {
            const dist = distance(currentPoints[0], worldPos);
            const dimensionEntity = {
              id: Math.random().toString(36).substring(2, 15),
              type: 'dimension',
              layerId: activeLayerId,
              visible: true,
              locked: false,
              style: {
                strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
                strokeWidth: 1,
                opacity: 1,
                lineType: 'continuous',
              },
              startPoint: currentPoints[0],
              endPoint: worldPos,
              text: dist.toFixed(2),
              offset: 20,
            };
            addEntity(dimensionEntity);
            finishDrawing();
          }
          break;

        case 'offset':
          // Offset selected entities by distance from base point to current
          if (isDrawing && currentPoints.length > 0 && selectedEntityIds.length > 0) {
            const offsetDist = prompt('Enter offset distance:', '100');
            if (offsetDist && !isNaN(parseFloat(offsetDist))) {
              const offsetValue = parseFloat(offsetDist);
              selectedEntityIds.forEach((entityId) => {
                const entity = project?.entities.find((e) => e.id === entityId);
                if (entity) {
                  const newEntity = JSON.parse(JSON.stringify(entity));
                  newEntity.id = Math.random().toString(36).substring(2, 15);
                  // Offset based on entity type
                  if (newEntity.startPoint) newEntity.startPoint.y += offsetValue;
                  if (newEntity.endPoint) newEntity.endPoint.y += offsetValue;
                  if (newEntity.center) newEntity.center.y += offsetValue;
                  if (newEntity.topLeft) newEntity.topLeft.y += offsetValue;
                  if (newEntity.position) newEntity.position.y += offsetValue;
                  if (newEntity.points) {
                    newEntity.points = newEntity.points.map((p) => ({ x: p.x, y: p.y + offsetValue }));
                  }
                  addEntity(newEntity);
                }
              });
            }
            finishDrawing();
          }
          break;

        case 'mirror':
          // Mirror selected entities across a vertical line at clicked point
          if (isDrawing && currentPoints.length > 0 && selectedEntityIds.length > 0) {
            const mirrorX = worldPos.x;
            selectedEntityIds.forEach((entityId) => {
              const entity = project?.entities.find((e) => e.id === entityId);
              if (entity) {
                const newEntity = JSON.parse(JSON.stringify(entity));
                newEntity.id = Math.random().toString(36).substring(2, 15);
                // Mirror X coordinates around mirrorX
                const mirrorPoint = (p) => ({ x: 2 * mirrorX - p.x, y: p.y });
                if (newEntity.startPoint) newEntity.startPoint = mirrorPoint(newEntity.startPoint);
                if (newEntity.endPoint) newEntity.endPoint = mirrorPoint(newEntity.endPoint);
                if (newEntity.center) newEntity.center = mirrorPoint(newEntity.center);
                if (newEntity.topLeft) {
                  newEntity.topLeft = mirrorPoint({ x: newEntity.topLeft.x + newEntity.width, y: newEntity.topLeft.y });
                  newEntity.topLeft.x -= newEntity.width;
                }
                if (newEntity.position) newEntity.position = mirrorPoint(newEntity.position);
                if (newEntity.points) {
                  newEntity.points = newEntity.points.map(mirrorPoint);
                }
                addEntity(newEntity);
              }
            });
            finishDrawing();
          }
          break;

        case 'rotate':
          // Rotate selected entities around first clicked point
          if (isDrawing && currentPoints.length > 0 && selectedEntityIds.length > 0) {
            const angleStr = prompt('Enter rotation angle (degrees):', '90');
            if (angleStr && !isNaN(parseFloat(angleStr))) {
              const angleDeg = parseFloat(angleStr);
              const angleRad = (angleDeg * Math.PI) / 180;
              const pivot = currentPoints[0];
              const rotatePoint = (p) => {
                const dx = p.x - pivot.x;
                const dy = p.y - pivot.y;
                return {
                  x: pivot.x + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
                  y: pivot.y + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
                };
              };
              selectedEntityIds.forEach((entityId) => {
                const entity = project?.entities.find((e) => e.id === entityId);
                if (entity) {
                  const newEntity = JSON.parse(JSON.stringify(entity));
                  newEntity.id = Math.random().toString(36).substring(2, 15);
                  if (newEntity.startPoint) newEntity.startPoint = rotatePoint(newEntity.startPoint);
                  if (newEntity.endPoint) newEntity.endPoint = rotatePoint(newEntity.endPoint);
                  if (newEntity.center) newEntity.center = rotatePoint(newEntity.center);
                  if (newEntity.topLeft) newEntity.topLeft = rotatePoint(newEntity.topLeft);
                  if (newEntity.position) newEntity.position = rotatePoint(newEntity.position);
                  if (newEntity.points) {
                    newEntity.points = newEntity.points.map(rotatePoint);
                  }
                  if (newEntity.rotation !== undefined) {
                    newEntity.rotation += angleRad;
                  }
                  addEntity(newEntity);
                }
              });
            }
            finishDrawing();
          }
          break;

        case 'scale':
          // Scale selected entities from first clicked point
          if (isDrawing && currentPoints.length > 0 && selectedEntityIds.length > 0) {
            const scaleStr = prompt('Enter scale factor:', '2');
            if (scaleStr && !isNaN(parseFloat(scaleStr))) {
              const scaleFactor = parseFloat(scaleStr);
              const pivot = currentPoints[0];
              const scalePoint = (p) => ({
                x: pivot.x + (p.x - pivot.x) * scaleFactor,
                y: pivot.y + (p.y - pivot.y) * scaleFactor,
              });
              selectedEntityIds.forEach((entityId) => {
                const entity = project?.entities.find((e) => e.id === entityId);
                if (entity) {
                  const newEntity = JSON.parse(JSON.stringify(entity));
                  newEntity.id = Math.random().toString(36).substring(2, 15);
                  if (newEntity.startPoint) newEntity.startPoint = scalePoint(newEntity.startPoint);
                  if (newEntity.endPoint) newEntity.endPoint = scalePoint(newEntity.endPoint);
                  if (newEntity.center) newEntity.center = scalePoint(newEntity.center);
                  if (newEntity.topLeft) newEntity.topLeft = scalePoint(newEntity.topLeft);
                  if (newEntity.position) newEntity.position = scalePoint(newEntity.position);
                  if (newEntity.points) {
                    newEntity.points = newEntity.points.map(scalePoint);
                  }
                  if (newEntity.radius) newEntity.radius *= scaleFactor;
                  if (newEntity.width) newEntity.width *= scaleFactor;
                  if (newEntity.height) newEntity.height *= scaleFactor;
                  if (newEntity.fontSize) newEntity.fontSize *= scaleFactor;
                  addEntity(newEntity);
                }
              });
            }
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
      selectedEntityIds,
    ]
  );

  const handleDoubleClick = useCallback(() => {
    if (activeTool === 'polyline' && isDrawing && currentPoints.length >= 2) {
      const polylineEntity = {
        id: Math.random().toString(36).substring(2, 15),
        type: 'polyline',
        layerId: activeLayerId,
        visible: true,
        locked: false,
        style: {
          strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
          strokeWidth: 1,
          opacity: 1,
          lineType: 'continuous',
        },
        points: currentPoints,
        closed: false,
      };
      addEntity(polylineEntity);
      finishDrawing();
    } else if (activeTool === 'polygon' && isDrawing && currentPoints.length >= 3) {
      // Polygon creates a closed polyline
      const polygonEntity = {
        id: Math.random().toString(36).substring(2, 15),
        type: 'polyline',  // Polygons are stored as closed polylines
        layerId: activeLayerId,
        visible: true,
        locked: false,
        style: {
          strokeColor: project?.layers.find((l) => l.id === activeLayerId)?.color || '#000000',
          strokeWidth: 1,
          opacity: 1,
          lineType: 'continuous',
        },
        points: currentPoints,
        closed: true,  // This makes it a closed polygon
      };
      addEntity(polygonEntity);
      finishDrawing();
    }
  }, [activeTool, isDrawing, currentPoints, activeLayerId, project, addEntity, finishDrawing]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = viewport.zoom;
      const newZoom = Math.max(0.1, Math.min(10, currentZoom * zoomFactor));

      setZoom(newZoom);
    },
    [viewport.zoom, setZoom]
  );

  const handleContextMenu = useCallback((e) => {
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

function getCursor(tool, isDrawing) {
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
