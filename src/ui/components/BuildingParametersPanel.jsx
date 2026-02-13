/**
 * Building Parameters Panel
 * One-click building design parameters for PNG projects.
 */

import React, { useState, useMemo } from 'react';
import { getBuildingParameters } from '../../png/buildingWorkflow.js';
import { PNG_PROVINCES } from '../../png/provinces.js';
import './BuildingParametersPanel.css';

export function BuildingParametersPanel({ onClose, onInsertToDrawing }) {
  const [province, setProvince] = useState('Central');
  const [buildingClass, setBuildingClass] = useState('2');
  const [soilClass, setSoilClass] = useState('Ce');
  const [siteElevation, setSiteElevation] = useState(20);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');

  const params = useMemo(
    () =>
      getBuildingParameters({
        province,
        buildingClass,
        soilClass,
        siteElevation,
      }),
    [province, buildingClass, soilClass, siteElevation]
  );

  const handleInsert = () => {
    if (params.success && onInsertToDrawing) {
      onInsertToDrawing(params.titleBlockEntities);
    }
  };

  const handleCopyText = async () => {
    if (!params.success) return;

    try {
      await navigator.clipboard.writeText(params.titleBlockText);
      setCopied(true);
      setCopyError('');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setCopyError('Copy failed. Clipboard access may be blocked.');
      setTimeout(() => setCopyError(''), 2500);
    }
  };

  return (
    <section className="building-params-panel">
      <div className="panel-header">
        <div>
          <p className="building-kicker">PNG Standards Assistant</p>
          <h2>Building Parameters</h2>
        </div>
        <button type="button" className="close-button" onClick={onClose}>Close</button>
      </div>

      <div className="panel-body">
        <div className="input-section">
          <h3>Site Inputs</h3>

          <div className="input-group">
            <label>Province</label>
            <select value={province} onChange={(event) => setProvince(event.target.value)}>
              {PNG_PROVINCES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <div className="input-grid">
            <div className="input-group">
              <label>Building Class</label>
              <select value={buildingClass} onChange={(event) => setBuildingClass(event.target.value)}>
                <option value="1">1 - Minor structures</option>
                <option value="2">2 - Normal buildings</option>
                <option value="3">3 - Important structures</option>
                <option value="4">4 - Essential facilities</option>
              </select>
            </div>

            <div className="input-group">
              <label>Soil Class</label>
              <select value={soilClass} onChange={(event) => setSoilClass(event.target.value)}>
                <option value="Ae">Ae - Strong rock</option>
                <option value="Be">Be - Rock</option>
                <option value="Ce">Ce - Shallow soil</option>
                <option value="De">De - Deep or soft soil</option>
                <option value="Ee">Ee - Very soft soil</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Site Elevation (m)</label>
            <input
              type="number"
              value={siteElevation}
              onChange={(event) => setSiteElevation(Number(event.target.value))}
              min={0}
              max={4000}
            />
          </div>
        </div>

        {params.success ? (
          <div className="results-section">
            <h3>Design Outputs</h3>

            <div className="param-card seismic">
              <div className="param-header">
                <span className="label">Seismic</span>
                <span className={`badge ${params.seismic.classification.toLowerCase()}`}>
                  {params.seismic.classification}
                </span>
              </div>
              <div className="param-content">
                <div className="param-row">
                  <span className="param-label">Z Factor</span>
                  <span className="param-value">{params.seismic.Z}</span>
                </div>
                <div className="param-row">
                  <span className="param-label">kp Coefficient</span>
                  <span className="param-value">{params.seismic.kp}</span>
                </div>
                <div className="param-row">
                  <span className="param-label">Near Fault</span>
                  <span className={`param-value ${params.seismic.nearFault ? 'warning' : ''}`}>
                    {params.seismic.nearFault ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="param-card wind">
              <div className="param-header">
                <span className="label">Wind</span>
                <span className={`badge region-${params.wind.region.toLowerCase()}`}>
                  Region {params.wind.region}
                </span>
              </div>
              <div className="param-content">
                <div className="param-row">
                  <span className="param-label">Basic Wind Speed</span>
                  <span className="param-value">{params.wind.basicWindSpeed}</span>
                </div>
                <div className="param-row">
                  <span className="param-label">Cyclonic Zone</span>
                  <span className={`param-value ${params.wind.cyclonic ? 'warning' : ''}`}>
                    {params.wind.cyclonic ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div className="param-card climate">
              <div className="param-header">
                <span className="label">Climate</span>
                <span className="badge">{params.climate.zone}</span>
              </div>
              <div className="param-content">
                <div className="param-row">
                  <span className="param-label">Annual Rainfall</span>
                  <span className="param-value">{params.climate.annualRainfall}</span>
                </div>
                <div className="param-row">
                  <span className="param-label">Max Daily Rainfall</span>
                  <span className="param-value">{params.climate.maxDailyRainfall}</span>
                </div>
              </div>
            </div>

            <div className="param-card flood">
              <div className="param-header">
                <span className="label">Flood</span>
                <span className={`badge ${params.flood.risk?.includes('Low') ? 'low' : 'warning'}`}>
                  {params.flood.risk?.includes('Low') ? 'Low Risk' : 'Check Required'}
                </span>
              </div>
              <div className="param-content">
                <div className="param-row">
                  <span className="param-label">Risk Assessment</span>
                  <span className="param-value">{params.flood.risk}</span>
                </div>
                {params.flood.recommendation && (
                  <div className="param-row">
                    <span className="param-label">Recommendation</span>
                    <span className="param-value">{params.flood.recommendation}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="param-card corrosion">
              <div className="param-header">
                <span className="label">Corrosion</span>
                <span className={`badge zone-${params.corrosion.zone}`}>
                  {params.corrosion.zone}
                </span>
              </div>
              <div className="param-content">
                <div className="param-row full-width">
                  <span className="param-value small">{params.corrosion.recommendation}</span>
                </div>
              </div>
            </div>

            <div className="sources">
              <strong>Data Sources</strong>
              <ul>
                <li>Seismic: {params.seismic.source}</li>
                <li>Wind: {params.wind.source}</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="error-section">
            <p>{params.error}</p>
            {params.suggestions?.length > 0 && (
              <p>Suggestions: {params.suggestions.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      <div className="panel-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleCopyText}
          disabled={!params.success}
        >
          {copied ? 'Copied' : 'Copy Text'}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={handleInsert}
          disabled={!params.success}
        >
          Insert to Drawing
        </button>
      </div>

      {copyError && <div className="copy-error">{copyError}</div>}
    </section>
  );
}
