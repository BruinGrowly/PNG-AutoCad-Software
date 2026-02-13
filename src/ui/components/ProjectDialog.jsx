/**
 * Project dialog for new/open workflows.
 */

import React, { useMemo, useState } from 'react';
import { createNewProject } from '../../core/engine.js';
import './ProjectDialog.css';

const PNG_PROVINCES = [
  'Central',
  'East New Britain',
  'East Sepik',
  'Eastern Highlands',
  'Enga',
  'Gulf',
  'Hela',
  'Jiwaka',
  'Madang',
  'Manus',
  'Milne Bay',
  'Morobe',
  'National Capital District',
  'New Ireland',
  'Oro',
  'Sandaun',
  'Simbu',
  'Southern Highlands',
  'West New Britain',
  'Western',
  'Western Highlands',
  'Autonomous Region of Bougainville',
];

const TERRAIN_TYPES = [
  { value: 'coastal-lowland', label: 'Coastal Lowland' },
  { value: 'riverine-floodplain', label: 'Riverine Floodplain' },
  { value: 'highland-valley', label: 'Highland Valley' },
  { value: 'mountainous', label: 'Mountainous' },
  { value: 'island-atoll', label: 'Island / Atoll' },
  { value: 'swamp-wetland', label: 'Swamp / Wetland' },
];

const PROJECT_TYPES = [
  { value: 'building', label: 'Building' },
  { value: 'road', label: 'Road' },
  { value: 'bridge', label: 'Bridge' },
  { value: 'water-supply', label: 'Water Supply' },
  { value: 'drainage', label: 'Drainage' },
  { value: 'sanitation', label: 'Sanitation' },
  { value: 'site-plan', label: 'Site Plan' },
  { value: 'survey', label: 'Survey' },
  { value: 'general', label: 'General' },
];

const TEMPLATE_PRESETS = [
  { id: 'residential', label: 'Residential House', projectType: 'building', note: 'Housing' },
  { id: 'community', label: 'Community Building', projectType: 'building', note: 'Public Works' },
  { id: 'road', label: 'Road Project', projectType: 'road', note: 'Transport' },
  { id: 'bridge', label: 'Bridge Design', projectType: 'bridge', note: 'Structure' },
  { id: 'water', label: 'Water Supply System', projectType: 'water-supply', note: 'Utilities' },
  { id: 'drainage', label: 'Drainage System', projectType: 'drainage', note: 'Hydrology' },
];

export function ProjectDialog({ onNewProject, onOpenProject, recentProjects = [] }) {
  const [activeTab, setActiveTab] = useState('new');
  const [formError, setFormError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('National Capital District');
  const [terrainType, setTerrainType] = useState('coastal-lowland');
  const [projectType, setProjectType] = useState('building');
  const [author, setAuthor] = useState('');

  const openStats = useMemo(() => ({
    recents: recentProjects.length,
    provinces: PNG_PROVINCES.length,
    standards: 'PNG + AU/NZ',
  }), [recentProjects.length]);

  const handleCreateProject = () => {
    setFormError('');

    if (!projectName.trim()) {
      setFormError('Please enter a project name.');
      return;
    }

    const project = createNewProject(projectName.trim());
    project.description = description;
    project.author = author;
    project.location = {
      province,
      terrainType,
    };
    project.projectType = projectType;

    onNewProject(project);
  };

  return (
    <div className="project-dialog-overlay">
      <div className="project-dialog">
        <header className="dialog-header">
          <div>
            <p className="dialog-kicker">PNG Civil Engineering Standards Platform</p>
            <h1>Start a New Project</h1>
            <p className="dialog-subtitle">
              Configure location-aware defaults so standards, climate, and seismic context are ready from the first line.
            </p>
          </div>

          <div className="dialog-stat-grid">
            <div className="dialog-stat-card">
              <span className="dialog-stat-label">Recent Projects</span>
              <span className="dialog-stat-value">{openStats.recents}</span>
            </div>
            <div className="dialog-stat-card">
              <span className="dialog-stat-label">PNG Provinces</span>
              <span className="dialog-stat-value">{openStats.provinces}</span>
            </div>
            <div className="dialog-stat-card">
              <span className="dialog-stat-label">Standards Set</span>
              <span className="dialog-stat-value">{openStats.standards}</span>
            </div>
          </div>
        </header>

        <div className="dialog-tabs">
          <button
            className={activeTab === 'new' ? 'active' : ''}
            onClick={() => setActiveTab('new')}
          >
            New Project
          </button>
          <button
            className={activeTab === 'open' ? 'active' : ''}
            onClick={() => setActiveTab('open')}
          >
            Open Project
          </button>
        </div>

        <div className="dialog-content">
          {activeTab === 'new' ? (
            <div className="new-project-form">
              <section className="form-section">
                <h3>Project Information</h3>

                {formError && (
                  <div className="project-dialog-error" role="alert">
                    {formError}
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="projectName">Project Name *</label>
                    <input
                      id="projectName"
                      type="text"
                      value={projectName}
                      onChange={(event) => setProjectName(event.target.value)}
                      placeholder="Enter project name"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="projectType">Project Type</label>
                    <select
                      id="projectType"
                      value={projectType}
                      onChange={(event) => setProjectType(event.target.value)}
                    >
                      {PROJECT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Project summary and scope"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author">Author / Engineer</label>
                  <input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Name or team"
                  />
                </div>
              </section>

              <section className="form-section">
                <h3>Site Context (PNG)</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="province">Province</label>
                    <select
                      id="province"
                      value={province}
                      onChange={(event) => setProvince(event.target.value)}
                    >
                      {PNG_PROVINCES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="terrainType">Terrain Type</label>
                    <select
                      id="terrainType"
                      value={terrainType}
                      onChange={(event) => setTerrainType(event.target.value)}
                    >
                      {TERRAIN_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="location-info">
                  Correct location and terrain improve flood, climate, and seismic analysis guidance.
                </div>
              </section>

              <section className="form-section templates">
                <h3>Quick Start Templates</h3>
                <div className="template-grid">
                  {TEMPLATE_PRESETS.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="template-card"
                      onClick={() => {
                        setProjectName(template.label);
                        setProjectType(template.projectType);
                      }}
                    >
                      <span className="template-note">{template.note}</span>
                      <span className="template-name">{template.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="form-actions">
                <button className="primary-btn" onClick={handleCreateProject}>
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="open-project">
              <section className="recent-projects">
                <h3>Recent Projects</h3>
                {recentProjects.length > 0 ? (
                  <div className="project-list">
                    {recentProjects.map((recentProject) => (
                      <button
                        type="button"
                        key={recentProject.id}
                        className="project-item"
                        onClick={() => onOpenProject(recentProject.id)}
                      >
                        <span className="project-name">{recentProject.name}</span>
                        <span className="project-date">
                          {new Date(recentProject.modifiedAt).toLocaleDateString()}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-projects">No recent projects found.</p>
                )}
              </section>

              <section className="import-section">
                <h3>Import Project</h3>
                <p>Import from your existing civil design workflow.</p>
                <div className="import-buttons">
                  <button type="button" className="import-btn">Import .pngcad</button>
                  <button type="button" className="import-btn">Import DXF</button>
                  <button type="button" className="import-btn">Import DWG</button>
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="dialog-footer">
          PNG AutoCAD Workspace | standards-first civil engineering for Papua New Guinea
        </footer>
      </div>
    </div>
  );
}
