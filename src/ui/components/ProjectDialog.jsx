/**
 * Project Dialog Component
 * New project creation and project opening
 */

import React, { useState } from 'react';
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
  { value: 'island-atoll', label: 'Island/Atoll' },
  { value: 'swamp-wetland', label: 'Swamp/Wetland' },
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

export function ProjectDialog({ onNewProject, onOpenProject, recentProjects }) {
  const [activeTab, setActiveTab] = useState('new');
  const [formError, setFormError] = useState('');
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('National Capital District');
  const [terrainType, setTerrainType] = useState('coastal-lowland');
  const [projectType, setProjectType] = useState('building');
  const [author, setAuthor] = useState('');

  const handleCreateProject = () => {
    setFormError('');
    if (!projectName.trim()) {
      setFormError('Please enter a project name.');
      return;
    }

    const project = createNewProject(projectName);
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
        <div className="dialog-header">
          <h1>PNG Civil CAD</h1>
          <p>Civil Engineering Design Software for Papua New Guinea</p>
        </div>

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
              <div className="form-section">
                <h3>Project Information</h3>

                {formError && (
                  <div className="project-dialog-error" role="alert">
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="projectName">Project Name *</label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author">Author / Engineer</label>
                  <input
                    id="author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectType">Project Type</label>
                  <select
                    id="projectType"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Location (PNG-Specific)</h3>

                <div className="form-group">
                  <label htmlFor="province">Province</label>
                  <select
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                  >
                    {PNG_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="terrainType">Terrain Type</label>
                  <select
                    id="terrainType"
                    value={terrainType}
                    onChange={(e) => setTerrainType(e.target.value)}
                  >
                    {TERRAIN_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="location-info">
                  <p>
                    Setting the correct location helps provide accurate climate, seismic, and
                    flood analysis for your project.
                  </p>
                </div>
              </div>

              <div className="form-section templates">
                <h3>Quick Start Templates</h3>
                <div className="template-grid">
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Residential House');
                      setProjectType('building');
                    }}
                  >
                    <span className="template-icon">🏠</span>
                    <span className="template-name">Residential House</span>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Community Building');
                      setProjectType('building');
                    }}
                  >
                    <span className="template-icon">🏛</span>
                    <span className="template-name">Community Building</span>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Road Project');
                      setProjectType('road');
                    }}
                  >
                    <span className="template-icon">🛣</span>
                    <span className="template-name">Road</span>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Bridge Design');
                      setProjectType('bridge');
                    }}
                  >
                    <span className="template-icon">🌉</span>
                    <span className="template-name">Bridge</span>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Water Supply System');
                      setProjectType('water-supply');
                    }}
                  >
                    <span className="template-icon">💧</span>
                    <span className="template-name">Water Supply</span>
                  </button>
                  <button
                    className="template-card"
                    onClick={() => {
                      setProjectName('Drainage System');
                      setProjectType('drainage');
                    }}
                  >
                    <span className="template-icon">🌊</span>
                    <span className="template-name">Drainage</span>
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <button className="primary-btn" onClick={handleCreateProject}>
                  Create Project
                </button>
              </div>
            </div>
          ) : (
            <div className="open-project">
              <div className="recent-projects">
                <h3>Recent Projects</h3>
                {recentProjects.length > 0 ? (
                  <div className="project-list">
                    {recentProjects.map((project) => (
                      <div
                        key={project.id}
                        className="project-item"
                        onClick={() => onOpenProject(project.id)}
                      >
                        <span className="project-name">{project.name}</span>
                        <span className="project-date">
                          {new Date(project.modifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-projects">No recent projects found</p>
                )}
              </div>

              <div className="import-section">
                <h3>Import Project</h3>
                <p>Import a project from file:</p>
                <div className="import-buttons">
                  <button className="import-btn">
                    <span>📁</span> Import .pngcad
                  </button>
                  <button className="import-btn">
                    <span>📐</span> Import DXF
                  </button>
                  <button className="import-btn">
                    <span>📄</span> Import DWG
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <p>PNG Civil CAD v1.0 - Designed for Papua New Guinea conditions</p>
        </div>
      </div>
    </div>
  );
}
