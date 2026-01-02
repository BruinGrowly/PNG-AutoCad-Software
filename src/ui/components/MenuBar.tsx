/**
 * Menu Bar Component
 * Application menu with file, edit, view options
 */

import React, { useState } from 'react';
import type { Project } from '../../core/types';
import { useCADStore } from '../store/cadStore';
import './MenuBar.css';

interface MenuBarProps {
  project: Project | null;
  onNewProject: () => void;
  onSave: () => void;
  onTogglePNGPanel: () => void;
  isOffline: boolean;
}

export function MenuBar({
  project,
  onNewProject,
  onSave,
  onTogglePNGPanel,
  isOffline,
}: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    copy,
    cut,
    paste,
    selectAll,
    clearSelection,
    deleteSelectedEntities,
    toggleGrid,
    toggleSnap,
    gridSettings,
    snapSettings,
    setZoom,
  } = useCADStore();

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  return (
    <div className="menu-bar">
      <div className="menu-left">
        <div className="app-logo">
          <span className="logo-icon">🏗</span>
          <span className="logo-text">PNG Civil CAD</span>
        </div>

        <div className="menu-items">
          {/* File Menu */}
          <div className="menu-item">
            <button
              className={`menu-button ${activeMenu === 'file' ? 'active' : ''}`}
              onClick={() => handleMenuClick('file')}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuItemClick(onNewProject)}>
                  <span className="shortcut">Ctrl+N</span>
                  New Project
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">Ctrl+O</span>
                  Open Project
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(onSave)}>
                  <span className="shortcut">Ctrl+S</span>
                  Save
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">Ctrl+Shift+S</span>
                  Save As...
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Export DXF
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Export PDF
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Print...
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="menu-item">
            <button
              className={`menu-button ${activeMenu === 'edit' ? 'active' : ''}`}
              onClick={() => handleMenuClick('edit')}
            >
              Edit
            </button>
            {activeMenu === 'edit' && (
              <div className="menu-dropdown">
                <button
                  onClick={() => handleMenuItemClick(undo)}
                  disabled={!canUndo()}
                >
                  <span className="shortcut">Ctrl+Z</span>
                  Undo
                </button>
                <button
                  onClick={() => handleMenuItemClick(redo)}
                  disabled={!canRedo()}
                >
                  <span className="shortcut">Ctrl+Y</span>
                  Redo
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(cut)}>
                  <span className="shortcut">Ctrl+X</span>
                  Cut
                </button>
                <button onClick={() => handleMenuItemClick(copy)}>
                  <span className="shortcut">Ctrl+C</span>
                  Copy
                </button>
                <button onClick={() => handleMenuItemClick(() => paste())}>
                  <span className="shortcut">Ctrl+V</span>
                  Paste
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(selectAll)}>
                  <span className="shortcut">Ctrl+A</span>
                  Select All
                </button>
                <button onClick={() => handleMenuItemClick(clearSelection)}>
                  <span className="shortcut">Escape</span>
                  Clear Selection
                </button>
                <button onClick={() => handleMenuItemClick(deleteSelectedEntities)}>
                  <span className="shortcut">Delete</span>
                  Delete Selected
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="menu-item">
            <button
              className={`menu-button ${activeMenu === 'view' ? 'active' : ''}`}
              onClick={() => handleMenuClick('view')}
            >
              View
            </button>
            {activeMenu === 'view' && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuItemClick(() => setZoom(1))}>
                  <span className="shortcut">Ctrl+0</span>
                  Zoom to Fit
                </button>
                <button onClick={() => handleMenuItemClick(() => setZoom(1))}>
                  <span className="shortcut">Ctrl+1</span>
                  Zoom 100%
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(toggleGrid)}>
                  <span className="shortcut">G</span>
                  {gridSettings.visible ? '✓ ' : ''}Grid
                </button>
                <button onClick={() => handleMenuItemClick(toggleSnap)}>
                  <span className="shortcut">S</span>
                  {snapSettings.enabled ? '✓ ' : ''}Snap
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Layer Panel
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Properties Panel
                </button>
              </div>
            )}
          </div>

          {/* Draw Menu */}
          <div className="menu-item">
            <button
              className={`menu-button ${activeMenu === 'draw' ? 'active' : ''}`}
              onClick={() => handleMenuClick('draw')}
            >
              Draw
            </button>
            {activeMenu === 'draw' && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">L</span>
                  Line
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">P</span>
                  Polyline
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">C</span>
                  Circle
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">A</span>
                  Arc
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">R</span>
                  Rectangle
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  <span className="shortcut">G</span>
                  Polygon
                </button>
              </div>
            )}
          </div>

          {/* PNG Analysis Menu */}
          <div className="menu-item">
            <button
              className={`menu-button png-menu ${activeMenu === 'png' ? 'active' : ''}`}
              onClick={() => handleMenuClick('png')}
            >
              PNG Analysis
            </button>
            {activeMenu === 'png' && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuItemClick(onTogglePNGPanel)}>
                  Analysis Panel
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Climate Report
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Seismic Analysis
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Flood Assessment
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Material Database
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Structural Design
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Drainage Calculator
                </button>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="menu-item">
            <button
              className={`menu-button ${activeMenu === 'help' ? 'active' : ''}`}
              onClick={() => handleMenuClick('help')}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="menu-dropdown">
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Documentation
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  PNG Building Standards
                </button>
                <button onClick={() => handleMenuItemClick(() => {})}>
                  Keyboard Shortcuts
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => {})}>
                  About PNG Civil CAD
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="menu-right">
        {isOffline && (
          <div className="offline-indicator" title="Working Offline">
            <span>📴</span> Offline
          </div>
        )}
        {project && (
          <div className="project-info">
            <span className="project-name">{project.name}</span>
            <span className="project-location">{project.location.province}</span>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {activeMenu && (
        <div className="menu-backdrop" onClick={() => setActiveMenu(null)} />
      )}
    </div>
  );
}
