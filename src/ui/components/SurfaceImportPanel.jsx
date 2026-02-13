/**
 * Surface import panel for survey-point CSV/TXT files.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  parseCSVSurveyPoints,
  createTINSurface,
  generateContours,
  contoursToEntities,
  tinToEntities,
} from '../../png/tinSurface.js';
import './SurfaceImportPanel.css';

export function SurfaceImportPanel({ onClose, onSurfaceCreated }) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [tinSurface, setTinSurface] = useState(null);
  const [contourOptions, setContourOptions] = useState({
    interval: '',
    showTIN: true,
    showContours: true,
  });
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload');
  const fileInputRef = useRef(null);

  const handleDrag = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    setError(null);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file) => {
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.txt')) {
      setError('Please upload a CSV or TXT file.');
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      parseCSV(content);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
    };
    reader.readAsText(file);
  };

  const parseCSV = (content) => {
    try {
      const result = parseCSVSurveyPoints(content);

      if (result.pointCount < 3) {
        setError(`Need at least 3 valid points. Found: ${result.pointCount}`);
        return;
      }

      setParseResult(result);
      setStep('preview');
      setError(null);
    } catch (parseError) {
      setError(`Parse error: ${parseError.message}`);
    }
  };

  const createSurface = () => {
    try {
      const tin = createTINSurface(parseResult.points);
      setTinSurface(tin);
      setStep('options');
      setError(null);
    } catch (surfaceError) {
      setError(`Surface creation error: ${surfaceError.message}`);
    }
  };

  const finishAndAdd = () => {
    try {
      const entities = [];
      const layers = [];

      if (contourOptions.showTIN) {
        const tinEntities = tinToEntities(tinSurface, {
          layerId: 'tin-mesh',
          triangleColor: '#888888',
          triangleLineWidth: 0.25,
        });
        entities.push(...tinEntities);
        layers.push({
          id: 'tin-mesh',
          name: 'TIN Mesh',
          color: '#888888',
          visible: true,
        });
      }

      if (contourOptions.showContours) {
        const interval = contourOptions.interval ? parseFloat(contourOptions.interval) : null;

        const contourData = generateContours(tinSurface, { interval });
        const contourEntities = contoursToEntities(contourData, {
          layerId: 'contours',
          majorColor: '#0066cc',
          minorColor: '#aaaaaa',
        });
        entities.push(...contourEntities);
        layers.push({
          id: 'contours',
          name: `Contours (${contourData.interval}m)`,
          color: '#0066cc',
          visible: true,
        });
      }

      onSurfaceCreated({
        entities,
        layers,
        bounds: tinSurface.bounds,
        statistics: tinSurface.statistics,
        source: fileName,
      });

      setStep('complete');
    } catch (generationError) {
      setError(`Generation error: ${generationError.message}`);
    }
  };

  const reset = () => {
    setFileName('');
    setParseResult(null);
    setTinSurface(null);
    setError(null);
    setStep('upload');
  };

  return (
    <div className="surface-import-overlay" onClick={onClose}>
      <section className="surface-import-panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="surface-kicker">Terrain Tools</p>
            <h2>Create Surface from Points</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>Close</button>
        </div>

        <div className="panel-content">
          {error && <div className="error-banner">{error}</div>}

          {step === 'upload' && (
            <div className="upload-section">
              <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-icon">CSV</div>
                <div className="drop-text">
                  <strong>Drop survey file here</strong>
                  <span>or click to browse</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="format-help">
                <h4>Supported Formats</h4>
                <div className="format-examples">
                  <code>X,Y,Z</code>
                  <code>Easting,Northing,Elevation</code>
                  <code>E,N,RL</code>
                </div>
                <p>Use a header row. Each data row is one survey point.</p>
              </div>

              <div className="sample-data">
                <h4>Example Data</h4>
                <pre>
{`Easting,Northing,RL
1000.00,2000.00,100.50
1010.00,2000.00,102.30
1020.00,2000.00,105.10
1000.00,2010.00,101.20`}
                </pre>
              </div>
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="preview-section">
              <div className="file-info">
                <span className="file-icon">FILE</span>
                <span className="file-name">{fileName}</span>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{parseResult.pointCount}</div>
                  <div className="stat-label">Points</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {parseResult.errorCount > 0 ? parseResult.errorCount : '0'}
                  </div>
                  <div className="stat-label">
                    {parseResult.errorCount > 0 ? 'Errors' : 'No Errors'}
                  </div>
                </div>
              </div>

              {parseResult.errorCount > 0 && (
                <div className="error-list">
                  <h4>Skipped Rows</h4>
                  {parseResult.errors.slice(0, 5).map((rowError, index) => (
                    <div key={index} className="error-row">
                      Row {rowError.row}: {rowError.reason}
                    </div>
                  ))}
                  {parseResult.errors.length > 5 && (
                    <div className="error-more">
                      ...and {parseResult.errors.length - 5} more
                    </div>
                  )}
                </div>
              )}

              <div className="point-preview">
                <h4>Point Preview</h4>
                <table>
                  <thead>
                    <tr><th>X</th><th>Y</th><th>Z</th></tr>
                  </thead>
                  <tbody>
                    {parseResult.points.slice(0, 5).map((point, index) => (
                      <tr key={index}>
                        <td>{point.x.toFixed(2)}</td>
                        <td>{point.y.toFixed(2)}</td>
                        <td>{point.z.toFixed(2)}</td>
                      </tr>
                    ))}
                    {parseResult.points.length > 5 && (
                      <tr className="more-row">
                        <td colSpan={3}>...{parseResult.points.length - 5} more points</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="action-buttons">
                <button type="button" className="btn-secondary" onClick={reset}>Back</button>
                <button type="button" className="btn-primary" onClick={createSurface}>Create Surface</button>
              </div>
            </div>
          )}

          {step === 'options' && tinSurface && (
            <div className="options-section">
              <div className="surface-stats">
                <h4>Surface Created</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-value">{tinSurface.triangleCount}</div>
                    <div className="stat-label">Triangles</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{tinSurface.statistics.elevationRange.toFixed(1)}m</div>
                    <div className="stat-label">Range</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{tinSurface.statistics.minElevation.toFixed(1)}</div>
                    <div className="stat-label">Min Elev.</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-value">{tinSurface.statistics.maxElevation.toFixed(1)}</div>
                    <div className="stat-label">Max Elev.</div>
                  </div>
                </div>
              </div>

              <div className="contour-options">
                <h4>Display Options</h4>

                <label className="option-row">
                  <input
                    type="checkbox"
                    checked={contourOptions.showTIN}
                    onChange={(event) => setContourOptions((previous) => ({
                      ...previous,
                      showTIN: event.target.checked,
                    }))}
                  />
                  <span>Show TIN mesh</span>
                </label>

                <label className="option-row">
                  <input
                    type="checkbox"
                    checked={contourOptions.showContours}
                    onChange={(event) => setContourOptions((previous) => ({
                      ...previous,
                      showContours: event.target.checked,
                    }))}
                  />
                  <span>Show contour lines</span>
                </label>

                {contourOptions.showContours && (
                  <div className="interval-option">
                    <label>Contour interval</label>
                    <input
                      type="number"
                      value={contourOptions.interval}
                      onChange={(event) => setContourOptions((previous) => ({
                        ...previous,
                        interval: event.target.value,
                      }))}
                      placeholder="Auto"
                      min="0.1"
                      step="0.5"
                    />
                    <span className="unit">m</span>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button type="button" className="btn-secondary" onClick={() => setStep('preview')}>Back</button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={finishAndAdd}
                  disabled={!contourOptions.showTIN && !contourOptions.showContours}
                >
                  Add to Drawing
                </button>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="complete-section">
              <div className="success-icon">Done</div>
              <h3>Surface Added</h3>
              <p>The TIN surface and contours were added to your drawing.</p>
              <div className="action-buttons">
                <button type="button" className="btn-secondary" onClick={reset}>Import Another</button>
                <button type="button" className="btn-primary" onClick={onClose}>Close</button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
