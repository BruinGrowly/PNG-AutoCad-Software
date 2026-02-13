/**
 * Modern application header with module navigation and command input.
 */

import React, { useMemo, useState } from 'react';
import { useCADStore } from '../store/cadStore.js';
import { downloadDXF } from '../../core/dxf.js';
import './MenuBar.css';

function LegacyMenu({ title, children }) {
  return (
    <details className="legacy-menu">
      <summary>{title}</summary>
      <div className="legacy-menu-dropdown">
        {children}
      </div>
    </details>
  );
}

export function MenuBar({
  project,
  modules = [],
  activeModule = 'workspace',
  onModuleChange,
  onNewProject,
  onSave,
  onTogglePNGPanel,
  onToggleBuildingPanel,
  onExportPDF,
  onShowKeyboardHelp,
  onToggleExplorer,
  onShowFeedback,
  isOffline,
}) {
  const [commandInput, setCommandInput] = useState('');
  const [commandStatus, setCommandStatus] = useState(null);
  const [showAbout, setShowAbout] = useState(false);

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
    setActiveTool,
  } = useCADStore();

  const commandExamples = useMemo(() => ([
    'line',
    'circle',
    'save',
    'undo',
    'redo',
    'toggle grid',
    'toggle snap',
    'standards',
    'drainage',
    'reports',
    'export pdf',
    'export dxf',
  ]), []);

  const runCommand = (rawCommand) => {
    const command = rawCommand.trim().toLowerCase();
    if (!command) {
      return;
    }

    let handled = true;
    let response = 'Command applied.';

    if (command.includes('line')) {
      setActiveTool('line');
      response = 'Tool set to line.';
    } else if (command.includes('polyline')) {
      setActiveTool('polyline');
      response = 'Tool set to polyline.';
    } else if (command.includes('circle')) {
      setActiveTool('circle');
      response = 'Tool set to circle.';
    } else if (command.includes('rectangle')) {
      setActiveTool('rectangle');
      response = 'Tool set to rectangle.';
    } else if (command.includes('text')) {
      setActiveTool('text');
      response = 'Tool set to text.';
    } else if (command.includes('save')) {
      onSave();
      response = 'Project save requested.';
    } else if (command.includes('undo')) {
      if (canUndo()) {
        undo();
        response = 'Undid previous action.';
      } else {
        response = 'Nothing to undo.';
      }
    } else if (command.includes('redo')) {
      if (canRedo()) {
        redo();
        response = 'Redid previous action.';
      } else {
        response = 'Nothing to redo.';
      }
    } else if (command.includes('grid')) {
      toggleGrid();
      response = 'Grid toggled.';
    } else if (command.includes('snap')) {
      toggleSnap();
      response = 'Snap toggled.';
    } else if (command.includes('export pdf')) {
      onExportPDF?.();
      response = 'PDF export requested.';
    } else if (command.includes('export dxf')) {
      if (project) {
        downloadDXF(project, `${project.name || 'drawing'}.dxf`);
        response = 'DXF export requested.';
      } else {
        response = 'No open project for DXF export.';
      }
    } else if (command.includes('standards')) {
      onModuleChange?.('standards');
      response = 'Standards module opened.';
    } else if (command.includes('qa')) {
      onModuleChange?.('qa');
      response = 'QA module opened.';
    } else if (command.includes('drainage')) {
      onModuleChange?.('drainage');
      response = 'Drainage module opened.';
    } else if (command.includes('report')) {
      onModuleChange?.('reports');
      response = 'Reports module opened.';
    } else if (command.includes('workspace')) {
      onModuleChange?.('workspace');
      response = 'Workspace module opened.';
    } else if (command.includes('explorer')) {
      onToggleExplorer?.();
      response = 'Project explorer toggled.';
    } else if (command.includes('help')) {
      onShowKeyboardHelp?.();
      response = 'Keyboard help opened.';
    } else if (command.includes('feedback')) {
      onShowFeedback?.();
      response = 'Feedback form opened.';
    } else if (command.includes('new project')) {
      onNewProject();
      response = 'New project dialog opened.';
    } else {
      handled = false;
      response = 'Unknown command. Try one of the suggestions.';
    }

    setCommandStatus({ handled, response });
    setTimeout(() => setCommandStatus(null), 2600);
    setCommandInput('');
  };

  return (
    <header className="menu-bar">
      <div className="menu-row menu-row-top">
        <div className="brand-block">
          <span className="brand-kicker">PNG Civil Engineering Standards Platform</span>
          <div className="brand-title-row">
            <h1>PNG AutoCAD Workspace</h1>
            <span className="brand-version">Forward UI</span>
          </div>
        </div>

        <div className="menu-meta">
          {isOffline && <span className="status-pill status-pill-warning">Offline</span>}
          {project && (
            <span className="status-pill">
              {project.name} | {project.location?.province || 'No province'}
            </span>
          )}
          <button className="ghost" onClick={onNewProject}>New</button>
          <button className="primary" onClick={onSave}>Save</button>
        </div>
      </div>

      <div className="menu-row menu-row-middle">
        <nav className="module-tabs" aria-label="Primary modules">
          {modules.map((module) => (
            <button
              key={module.id}
              className={`module-tab ${activeModule === module.id ? 'active' : ''}`}
              onClick={() => onModuleChange?.(module.id)}
            >
              {module.label}
            </button>
          ))}
        </nav>

        <div className="command-center">
          <input
            type="text"
            value={commandInput}
            onChange={(event) => setCommandInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                runCommand(commandInput);
              }
            }}
            placeholder="Command bar: line, save, standards, export pdf..."
            list="menu-command-suggestions"
            aria-label="Command bar"
          />
          <datalist id="menu-command-suggestions">
            {commandExamples.map((example) => (
              <option key={example} value={example} />
            ))}
          </datalist>
          <button className="command-run" onClick={() => runCommand(commandInput)}>Run</button>
          {commandStatus && (
            <span className={`command-status ${commandStatus.handled ? 'ok' : 'warn'}`}>
              {commandStatus.response}
            </span>
          )}
        </div>

        <div className="quick-actions">
          <button onClick={undo} disabled={!canUndo()}>Undo</button>
          <button onClick={redo} disabled={!canRedo()}>Redo</button>
          <button
            className={gridSettings.visible ? 'toggled' : ''}
            onClick={toggleGrid}
          >
            Grid
          </button>
          <button
            className={snapSettings.enabled ? 'toggled' : ''}
            onClick={toggleSnap}
          >
            Snap
          </button>
          <button onClick={() => onModuleChange?.('standards')}>Standards</button>
          <button onClick={onToggleExplorer}>Explorer</button>
          <button onClick={onShowKeyboardHelp}>Help</button>
        </div>
      </div>

      <div className="menu-row menu-row-bottom">
        <LegacyMenu title="File">
          <button onClick={onNewProject}>New Project</button>
          <button onClick={onSave}>Save Project</button>
          <button onClick={() => project && downloadDXF(project, `${project.name || 'drawing'}.dxf`)}>
            Export DXF
          </button>
          <button onClick={onExportPDF}>Export PDF</button>
        </LegacyMenu>

        <LegacyMenu title="Edit">
          <button onClick={undo} disabled={!canUndo()}>Undo</button>
          <button onClick={redo} disabled={!canRedo()}>Redo</button>
          <button onClick={cut}>Cut</button>
          <button onClick={copy}>Copy</button>
          <button onClick={() => paste()}>Paste</button>
          <button onClick={selectAll}>Select All</button>
          <button onClick={clearSelection}>Clear Selection</button>
          <button onClick={deleteSelectedEntities}>Delete Selected</button>
        </LegacyMenu>

        <LegacyMenu title="Draw">
          <button onClick={() => setActiveTool('select')}>Select</button>
          <button onClick={() => setActiveTool('line')}>Line</button>
          <button onClick={() => setActiveTool('polyline')}>Polyline</button>
          <button onClick={() => setActiveTool('circle')}>Circle</button>
          <button onClick={() => setActiveTool('arc')}>Arc</button>
          <button onClick={() => setActiveTool('rectangle')}>Rectangle</button>
        </LegacyMenu>

        <LegacyMenu title="Modules">
          <button onClick={() => onModuleChange?.('workspace')}>Workspace</button>
          <button onClick={() => onModuleChange?.('standards')}>Standards</button>
          <button onClick={() => onModuleChange?.('qa')}>QA / Inspection</button>
          <button onClick={() => onModuleChange?.('drainage')}>Drainage</button>
          <button onClick={() => onModuleChange?.('reports')}>Reports</button>
          <button onClick={onToggleBuildingPanel}>Building Parameters</button>
          <button onClick={onTogglePNGPanel}>Open Standards Panel</button>
        </LegacyMenu>

        <LegacyMenu title="View">
          <button onClick={() => setZoom(1)}>Zoom 100%</button>
          <button onClick={() => setZoom(1)}>Zoom to Fit</button>
          <button onClick={toggleGrid}>{gridSettings.visible ? 'Hide Grid' : 'Show Grid'}</button>
          <button onClick={toggleSnap}>{snapSettings.enabled ? 'Disable Snap' : 'Enable Snap'}</button>
          <button onClick={onToggleExplorer}>Project Explorer</button>
        </LegacyMenu>

        <LegacyMenu title="Help">
          <button onClick={onShowKeyboardHelp}>Keyboard Shortcuts</button>
          <button onClick={() => setShowAbout(true)}>About</button>
          <button onClick={onShowFeedback}>Send Feedback</button>
        </LegacyMenu>
      </div>

      {showAbout && (
        <div className="about-overlay" onClick={() => setShowAbout(false)}>
          <div className="about-modal" onClick={(event) => event.stopPropagation()}>
            <button className="about-close" onClick={() => setShowAbout(false)}>x</button>
            <h2>About This Platform</h2>
            <p>
              PNG AutoCAD Workspace is a standards-first CAD environment for PNG civil engineering.
              It combines drafting tools with contextual analysis for local project delivery.
            </p>
            <ul>
              <li>Integrated CAD drawing workspace</li>
              <li>PNG-aware standards and analysis modules</li>
              <li>Offline-capable local project workflow</li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
