/**
 * Menu Bar Component
 * Application menu with file, edit, view options
 */

import React, { useState } from 'react';
import { useCADStore } from '../store/cadStore.js';
import './MenuBar.css';

export function MenuBar({
  project,
  onNewProject,
  onSave,
  onTogglePNGPanel,
  isOffline,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [helpDialog, setHelpDialog] = useState(null); // 'docs' | 'shortcuts' | 'standards' | 'about'

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

  const closeHelpDialog = () => setHelpDialog(null);

  const handleMenuClick = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleMenuItemClick = (action) => {
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
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">Ctrl+O</span>
                  Open Project
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(onSave)}>
                  <span className="shortcut">Ctrl+S</span>
                  Save
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">Ctrl+Shift+S</span>
                  Save As...
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Export DXF
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Export PDF
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
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
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Layer Panel
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
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
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">L</span>
                  Line
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">P</span>
                  Polyline
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">C</span>
                  Circle
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">A</span>
                  Arc
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  <span className="shortcut">R</span>
                  Rectangle
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
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
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Climate Report
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Seismic Analysis
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Flood Assessment
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Material Database
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => { })}>
                  Structural Design
                </button>
                <button onClick={() => handleMenuItemClick(() => { })}>
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
                <button onClick={() => handleMenuItemClick(() => setHelpDialog('docs'))}>
                  Documentation
                </button>
                <button onClick={() => handleMenuItemClick(() => setHelpDialog('standards'))}>
                  PNG Building Standards
                </button>
                <button onClick={() => handleMenuItemClick(() => setHelpDialog('shortcuts'))}>
                  Keyboard Shortcuts
                </button>
                <div className="menu-divider" />
                <button onClick={() => handleMenuItemClick(() => setHelpDialog('about'))}>
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

      {/* Help Dialogs */}
      {helpDialog && (
        <div className="help-dialog-overlay" onClick={closeHelpDialog}>
          <div className="help-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="help-dialog-close" onClick={closeHelpDialog}>×</button>

            {helpDialog === 'docs' && (
              <>
                <h2>📚 Documentation</h2>
                <div className="help-content">
                  <h3>Getting Started</h3>
                  <p>PNG Civil CAD is a browser-based CAD application designed for civil engineering projects in Papua New Guinea.</p>

                  <h3>Creating a Project</h3>
                  <ol>
                    <li>Click <strong>File → New Project</strong> or press <kbd>Ctrl+N</kbd></li>
                    <li>Enter project name and select your province</li>
                    <li>Choose terrain type for accurate analysis</li>
                    <li>Click <strong>Create Project</strong></li>
                  </ol>

                  <h3>Drawing Tools</h3>
                  <ul>
                    <li><strong>Line (L)</strong> - Click start point, click end point</li>
                    <li><strong>Rectangle (R)</strong> - Click corner, drag to opposite corner</li>
                    <li><strong>Circle (C)</strong> - Click center, drag for radius</li>
                    <li><strong>Polyline (P)</strong> - Click points, double-click to finish</li>
                  </ul>

                  <h3>PNG Analysis Features</h3>
                  <p>Access the PNG Analysis menu for seismic, climate, flood, and structural analysis tools tailored to Papua New Guinea conditions.</p>
                </div>
              </>
            )}

            {helpDialog === 'shortcuts' && (
              <>
                <h2>⌨️ Keyboard Shortcuts</h2>
                <div className="help-content shortcuts-table">
                  <table>
                    <thead>
                      <tr><th>Action</th><th>Shortcut</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>New Project</td><td><kbd>Ctrl+N</kbd></td></tr>
                      <tr><td>Save</td><td><kbd>Ctrl+S</kbd></td></tr>
                      <tr><td>Undo</td><td><kbd>Ctrl+Z</kbd></td></tr>
                      <tr><td>Redo</td><td><kbd>Ctrl+Y</kbd></td></tr>
                      <tr><td>Select All</td><td><kbd>Ctrl+A</kbd></td></tr>
                      <tr><td>Copy</td><td><kbd>Ctrl+C</kbd></td></tr>
                      <tr><td>Paste</td><td><kbd>Ctrl+V</kbd></td></tr>
                      <tr><td>Cut</td><td><kbd>Ctrl+X</kbd></td></tr>
                    </tbody>
                  </table>
                  <h3>Drawing Tools</h3>
                  <table>
                    <tbody>
                      <tr><td>Select Tool</td><td><kbd>V</kbd> or <kbd>Esc</kbd></td></tr>
                      <tr><td>Line</td><td><kbd>L</kbd></td></tr>
                      <tr><td>Circle</td><td><kbd>C</kbd></td></tr>
                      <tr><td>Rectangle</td><td><kbd>R</kbd></td></tr>
                      <tr><td>Polyline</td><td><kbd>P</kbd></td></tr>
                      <tr><td>Text</td><td><kbd>T</kbd></td></tr>
                      <tr><td>Dimension</td><td><kbd>D</kbd></td></tr>
                      <tr><td>Measure</td><td><kbd>M</kbd></td></tr>
                      <tr><td>Pan</td><td><kbd>H</kbd></td></tr>
                      <tr><td>Zoom</td><td><kbd>Z</kbd></td></tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {helpDialog === 'standards' && (
              <>
                <h2>🏛️ PNG Building Standards</h2>
                <div className="help-content">
                  <h3>Referenced Standards</h3>
                  <ul>
                    <li><strong>AS/NZS 1170.4</strong> - Earthquake actions</li>
                    <li><strong>AS/NZS 1170.2</strong> - Wind actions</li>
                    <li><strong>AS 2870</strong> - Residential slabs and footings</li>
                    <li><strong>AS 3600</strong> - Concrete structures</li>
                    <li><strong>ASCE 24</strong> - Flood resistant design</li>
                  </ul>

                  <h3>Seismic Zones</h3>
                  <table>
                    <thead><tr><th>Zone</th><th>Hazard (Z)</th><th>Provinces</th></tr></thead>
                    <tbody>
                      <tr><td>Zone 4</td><td>0.45-0.55</td><td>East New Britain, Madang, Morobe</td></tr>
                      <tr><td>Zone 3</td><td>0.35-0.40</td><td>Central, Milne Bay, Oro</td></tr>
                      <tr><td>Zone 2</td><td>0.28-0.30</td><td>Highlands provinces</td></tr>
                      <tr><td>Zone 1</td><td>0.15</td><td>Western</td></tr>
                    </tbody>
                  </table>

                  <h3>Wind Regions</h3>
                  <table>
                    <thead><tr><th>Region</th><th>Description</th><th>Design Speed</th></tr></thead>
                    <tbody>
                      <tr><td>A</td><td>Non-cyclonic (Highlands)</td><td>41 m/s</td></tr>
                      <tr><td>B</td><td>Intermediate (South coast)</td><td>50 m/s</td></tr>
                      <tr><td>C</td><td>Cyclonic (North coast)</td><td>60 m/s</td></tr>
                      <tr><td>D</td><td>Severe cyclonic (Islands)</td><td>67 m/s</td></tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {helpDialog === 'about' && (
              <>
                <h2>🏗️ About PNG Civil CAD</h2>
                <div className="help-content about-content">
                  <p className="version"><strong>Version 1.0</strong></p>
                  <p>Civil Engineering CAD Software designed specifically for Papua New Guinea conditions.</p>

                  <h3>Features</h3>
                  <ul>
                    <li>PNG-specific seismic, wind, and flood analysis</li>
                    <li>Local materials database</li>
                    <li>Climate zone considerations</li>
                    <li>Low-volume road design standards</li>
                    <li>DXF import/export support</li>
                    <li>Offline-capable design</li>
                  </ul>

                  <h3>Design Philosophy</h3>
                  <p>Built with safety, local context, and longevity as core principles. Embeds engineering intelligence specific to PNG conditions.</p>

                  <p className="license">MIT License</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
