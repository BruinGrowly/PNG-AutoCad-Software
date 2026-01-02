/**
 * Properties Panel Component
 * Display and edit properties of selected entities
 */

import React from 'react';
import type { Entity } from '../../core/types';
import { useCADStore } from '../store/cadStore';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedEntityIds: string[];
  entities: Entity[];
}

export function PropertiesPanel({ selectedEntityIds, entities }: PropertiesPanelProps) {
  const { updateEntity, project } = useCADStore();

  const selectedEntities = entities.filter((e) => selectedEntityIds.includes(e.id));

  if (selectedEntities.length === 0) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="panel-content empty">
          <p>No objects selected</p>
          <p className="hint">Select an object to view its properties</p>
        </div>
      </div>
    );
  }

  if (selectedEntities.length > 1) {
    return (
      <div className="properties-panel">
        <div className="panel-header">
          <h3>Properties</h3>
        </div>
        <div className="panel-content">
          <p>{selectedEntities.length} objects selected</p>
          <div className="multi-select-info">
            {Object.entries(
              selectedEntities.reduce((acc, e) => {
                acc[e.type] = (acc[e.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="type-count">
                <span>{type}</span>
                <span>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const entity = selectedEntities[0];
  const layer = project?.layers.find((l) => l.id === entity.layerId);

  return (
    <div className="properties-panel">
      <div className="panel-header">
        <h3>Properties</h3>
        <span className="entity-type">{entity.type}</span>
      </div>

      <div className="panel-content">
        <div className="property-section">
          <h4>General</h4>

          <div className="property-row">
            <label>ID</label>
            <span className="property-value readonly">{entity.id.substring(0, 8)}...</span>
          </div>

          <div className="property-row">
            <label>Layer</label>
            <select
              value={entity.layerId}
              onChange={(e) => updateEntity(entity.id, { layerId: e.target.value })}
            >
              {project?.layers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="property-row">
            <label>Visible</label>
            <input
              type="checkbox"
              checked={entity.visible}
              onChange={(e) => updateEntity(entity.id, { visible: e.target.checked })}
            />
          </div>

          <div className="property-row">
            <label>Locked</label>
            <input
              type="checkbox"
              checked={entity.locked}
              onChange={(e) => updateEntity(entity.id, { locked: e.target.checked })}
            />
          </div>
        </div>

        <div className="property-section">
          <h4>Style</h4>

          <div className="property-row">
            <label>Stroke Color</label>
            <input
              type="color"
              value={entity.style.strokeColor}
              onChange={(e) =>
                updateEntity(entity.id, {
                  style: { ...entity.style, strokeColor: e.target.value },
                })
              }
            />
          </div>

          <div className="property-row">
            <label>Stroke Width</label>
            <input
              type="number"
              value={entity.style.strokeWidth}
              onChange={(e) =>
                updateEntity(entity.id, {
                  style: { ...entity.style, strokeWidth: Number(e.target.value) },
                })
              }
              min={0.1}
              max={10}
              step={0.1}
            />
          </div>

          <div className="property-row">
            <label>Line Type</label>
            <select
              value={entity.style.lineType}
              onChange={(e) =>
                updateEntity(entity.id, {
                  style: { ...entity.style, lineType: e.target.value as any },
                })
              }
            >
              <option value="continuous">Continuous</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="dashdot">Dash-Dot</option>
              <option value="center">Center</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="property-row">
            <label>Opacity</label>
            <input
              type="range"
              value={entity.style.opacity}
              onChange={(e) =>
                updateEntity(entity.id, {
                  style: { ...entity.style, opacity: Number(e.target.value) },
                })
              }
              min={0}
              max={1}
              step={0.1}
            />
            <span>{Math.round(entity.style.opacity * 100)}%</span>
          </div>
        </div>

        <div className="property-section">
          <h4>Geometry</h4>
          {renderGeometryProperties(entity, updateEntity)}
        </div>
      </div>
    </div>
  );
}

function renderGeometryProperties(
  entity: Entity,
  updateEntity: (id: string, updates: Partial<Entity>) => void
) {
  switch (entity.type) {
    case 'line':
      return (
        <>
          <div className="property-row">
            <label>Start X</label>
            <input
              type="number"
              value={entity.startPoint.x.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  startPoint: { ...entity.startPoint, x: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Start Y</label>
            <input
              type="number"
              value={entity.startPoint.y.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  startPoint: { ...entity.startPoint, y: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>End X</label>
            <input
              type="number"
              value={entity.endPoint.x.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  endPoint: { ...entity.endPoint, x: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>End Y</label>
            <input
              type="number"
              value={entity.endPoint.y.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  endPoint: { ...entity.endPoint, y: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row readonly">
            <label>Length</label>
            <span>
              {Math.sqrt(
                Math.pow(entity.endPoint.x - entity.startPoint.x, 2) +
                  Math.pow(entity.endPoint.y - entity.startPoint.y, 2)
              ).toFixed(2)}
            </span>
          </div>
        </>
      );

    case 'circle':
      return (
        <>
          <div className="property-row">
            <label>Center X</label>
            <input
              type="number"
              value={entity.center.x.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  center: { ...entity.center, x: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Center Y</label>
            <input
              type="number"
              value={entity.center.y.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  center: { ...entity.center, y: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Radius</label>
            <input
              type="number"
              value={entity.radius.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, { radius: Number(e.target.value) } as any)
              }
              min={0}
            />
          </div>
          <div className="property-row readonly">
            <label>Diameter</label>
            <span>{(entity.radius * 2).toFixed(2)}</span>
          </div>
          <div className="property-row readonly">
            <label>Circumference</label>
            <span>{(2 * Math.PI * entity.radius).toFixed(2)}</span>
          </div>
          <div className="property-row readonly">
            <label>Area</label>
            <span>{(Math.PI * entity.radius * entity.radius).toFixed(2)}</span>
          </div>
        </>
      );

    case 'rectangle':
      return (
        <>
          <div className="property-row">
            <label>X</label>
            <input
              type="number"
              value={entity.topLeft.x.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  topLeft: { ...entity.topLeft, x: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Y</label>
            <input
              type="number"
              value={entity.topLeft.y.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  topLeft: { ...entity.topLeft, y: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Width</label>
            <input
              type="number"
              value={entity.width.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, { width: Number(e.target.value) } as any)
              }
              min={0}
            />
          </div>
          <div className="property-row">
            <label>Height</label>
            <input
              type="number"
              value={entity.height.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, { height: Number(e.target.value) } as any)
              }
              min={0}
            />
          </div>
          <div className="property-row readonly">
            <label>Perimeter</label>
            <span>{(2 * (entity.width + entity.height)).toFixed(2)}</span>
          </div>
          <div className="property-row readonly">
            <label>Area</label>
            <span>{(entity.width * entity.height).toFixed(2)}</span>
          </div>
        </>
      );

    case 'text':
      return (
        <>
          <div className="property-row">
            <label>X</label>
            <input
              type="number"
              value={entity.position.x.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  position: { ...entity.position, x: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Y</label>
            <input
              type="number"
              value={entity.position.y.toFixed(2)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  position: { ...entity.position, y: Number(e.target.value) },
                } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Content</label>
            <input
              type="text"
              value={entity.content}
              onChange={(e) =>
                updateEntity(entity.id, { content: e.target.value } as any)
              }
            />
          </div>
          <div className="property-row">
            <label>Font Size</label>
            <input
              type="number"
              value={entity.fontSize}
              onChange={(e) =>
                updateEntity(entity.id, { fontSize: Number(e.target.value) } as any)
              }
              min={1}
            />
          </div>
          <div className="property-row">
            <label>Rotation</label>
            <input
              type="number"
              value={((entity.rotation * 180) / Math.PI).toFixed(1)}
              onChange={(e) =>
                updateEntity(entity.id, {
                  rotation: (Number(e.target.value) * Math.PI) / 180,
                } as any)
              }
            />
          </div>
        </>
      );

    default:
      return <p>No geometry properties available</p>;
  }
}
