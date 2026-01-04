/**
 * Surface Import Panel Component
 * Provides drag-and-drop CSV import for survey points
 * and displays TIN surface and contour generation options
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    parseCSVSurveyPoints,
    createTINSurface,
    generateContours,
    contoursToEntities,
    tinToEntities
} from '../../png/tinSurface.js';
import './SurfaceImportPanel.css';

export function SurfaceImportPanel({ onClose, onSurfaceCreated }) {
    const [dragActive, setDragActive] = useState(false);
    const [csvContent, setCsvContent] = useState('');
    const [fileName, setFileName] = useState('');
    const [parseResult, setParseResult] = useState(null);
    const [tinSurface, setTinSurface] = useState(null);
    const [contourOptions, setContourOptions] = useState({
        interval: '',  // Empty = auto
        showTIN: true,
        showContours: true,
    });
    const [error, setError] = useState(null);
    const [step, setStep] = useState('upload'); // upload, preview, options, complete
    const fileInputRef = useRef(null);

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError(null);

        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }, []);

    // Handle file selection via button
    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    // Process the uploaded file
    const handleFile = (file) => {
        if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
            setError('Please upload a CSV or TXT file');
            return;
        }

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            setCsvContent(content);
            parseCSV(content);
        };
        reader.onerror = () => {
            setError('Failed to read file');
        };
        reader.readAsText(file);
    };

    // Parse the CSV content
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
        } catch (err) {
            setError(`Parse error: ${err.message}`);
        }
    };

    // Create TIN surface from parsed points
    const createSurface = () => {
        try {
            const tin = createTINSurface(parseResult.points);
            setTinSurface(tin);
            setStep('options');
            setError(null);
        } catch (err) {
            setError(`Surface creation error: ${err.message}`);
        }
    };

    // Generate final entities and add to project
    const finishAndAdd = () => {
        try {
            const entities = [];
            const layers = [];

            // Add TIN mesh if enabled
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

            // Add contours if enabled
            if (contourOptions.showContours) {
                const interval = contourOptions.interval
                    ? parseFloat(contourOptions.interval)
                    : null;

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

            // Call parent callback with entities
            onSurfaceCreated({
                entities,
                layers,
                bounds: tinSurface.bounds,
                statistics: tinSurface.statistics,
                source: fileName,
            });

            setStep('complete');
        } catch (err) {
            setError(`Generation error: ${err.message}`);
        }
    };

    // Reset to start
    const reset = () => {
        setCsvContent('');
        setFileName('');
        setParseResult(null);
        setTinSurface(null);
        setError(null);
        setStep('upload');
    };

    return (
        <div className="surface-import-overlay" onClick={onClose}>
            <div className="surface-import-panel" onClick={(e) => e.stopPropagation()}>
                <div className="panel-header">
                    <h2>🏔️ Create Surface from Points</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="panel-content">
                    {error && (
                        <div className="error-banner">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Step 1: Upload */}
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
                                <div className="drop-icon">📄</div>
                                <div className="drop-text">
                                    <strong>Drop CSV file here</strong>
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
                                <p>First row should be headers. Each data row = one survey point.</p>
                            </div>

                            <div className="sample-data">
                                <h4>Example Data</h4>
                                <pre>
                                    {`Easting,Northing,RL
1000.00,2000.00,100.50
1010.00,2000.00,102.30
1020.00,2000.00,105.10
1000.00,2010.00,101.20
...`}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Preview */}
                    {step === 'preview' && parseResult && (
                        <div className="preview-section">
                            <div className="file-info">
                                <span className="file-icon">📄</span>
                                <span className="file-name">{fileName}</span>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-value">{parseResult.pointCount}</div>
                                    <div className="stat-label">Points</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-value">
                                        {parseResult.errorCount > 0 ? parseResult.errorCount : '✓'}
                                    </div>
                                    <div className="stat-label">
                                        {parseResult.errorCount > 0 ? 'Errors' : 'No Errors'}
                                    </div>
                                </div>
                            </div>

                            {parseResult.errorCount > 0 && (
                                <div className="error-list">
                                    <h4>Skipped Rows</h4>
                                    {parseResult.errors.slice(0, 5).map((err, i) => (
                                        <div key={i} className="error-row">
                                            Row {err.row}: {err.reason}
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
                                        {parseResult.points.slice(0, 5).map((p, i) => (
                                            <tr key={i}>
                                                <td>{p.x.toFixed(2)}</td>
                                                <td>{p.y.toFixed(2)}</td>
                                                <td>{p.z.toFixed(2)}</td>
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
                                <button className="btn-secondary" onClick={reset}>
                                    ← Back
                                </button>
                                <button className="btn-primary" onClick={createSurface}>
                                    Create Surface →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Options */}
                    {step === 'options' && tinSurface && (
                        <div className="options-section">
                            <div className="surface-stats">
                                <h4>Surface Created ✓</h4>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-value">{tinSurface.triangleCount}</div>
                                        <div className="stat-label">Triangles</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-value">{tinSurface.statistics.elevationRange.toFixed(1)}m</div>
                                        <div className="stat-label">Elev. Range</div>
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
                                        onChange={(e) => setContourOptions(prev => ({
                                            ...prev,
                                            showTIN: e.target.checked
                                        }))}
                                    />
                                    <span>Show TIN mesh (triangles)</span>
                                </label>

                                <label className="option-row">
                                    <input
                                        type="checkbox"
                                        checked={contourOptions.showContours}
                                        onChange={(e) => setContourOptions(prev => ({
                                            ...prev,
                                            showContours: e.target.checked
                                        }))}
                                    />
                                    <span>Show contour lines</span>
                                </label>

                                {contourOptions.showContours && (
                                    <div className="interval-option">
                                        <label>Contour Interval:</label>
                                        <input
                                            type="number"
                                            value={contourOptions.interval}
                                            onChange={(e) => setContourOptions(prev => ({
                                                ...prev,
                                                interval: e.target.value
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
                                <button className="btn-secondary" onClick={() => setStep('preview')}>
                                    ← Back
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={finishAndAdd}
                                    disabled={!contourOptions.showTIN && !contourOptions.showContours}
                                >
                                    Add to Drawing →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 'complete' && (
                        <div className="complete-section">
                            <div className="success-icon">✅</div>
                            <h3>Surface Added!</h3>
                            <p>The TIN surface and contours have been added to your drawing.</p>
                            <div className="action-buttons">
                                <button className="btn-secondary" onClick={reset}>
                                    Import Another
                                </button>
                                <button className="btn-primary" onClick={onClose}>
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
