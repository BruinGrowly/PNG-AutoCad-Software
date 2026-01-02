/**
 * PNG Analysis Panel
 * Climate, seismic, flood, and material analysis for PNG projects
 */

import React, { useState, useMemo } from 'react';
import type { Project, PNGProvince, PNGTerrainType } from '../../core/types';
import {
  generateClimateReport,
  generateSeismicReport,
  generateFloodReport,
  searchMaterials,
  getMaterialsByCategory,
  ALL_MATERIALS,
  type ClimateReport,
  type SeismicReport,
  type FloodReport,
  type Material,
  type SoilClass,
  type ImportanceCategory,
  type StructuralSystem,
} from '../../png';
import './PNGAnalysisPanel.css';

interface PNGAnalysisPanelProps {
  project: Project;
  onClose: () => void;
}

type AnalysisTab = 'climate' | 'seismic' | 'flood' | 'materials' | 'structural';

export function PNGAnalysisPanel({ project, onClose }: PNGAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('climate');
  const [materialSearch, setMaterialSearch] = useState('');

  // Analysis inputs
  const [soilClass, setSoilClass] = useState<SoilClass>('D');
  const [importance, setImportance] = useState<ImportanceCategory>(2);
  const [structuralSystem, setStructuralSystem] = useState<StructuralSystem>('timber-frame');
  const [buildingHeight, setBuildingHeight] = useState(6);
  const [buildingWeight, setBuildingWeight] = useState(500);
  const [numberOfStoreys, setNumberOfStoreys] = useState(2);
  const [distanceFromWater, setDistanceFromWater] = useState(100);

  const province = project.location.province;
  const terrainType = project.location.terrainType;
  const buildingType = project.projectType === 'building' ? 'residential' : 'commercial';

  // Generate reports
  const climateReport = useMemo(
    () => generateClimateReport(province, terrainType, buildingType as any),
    [province, terrainType, buildingType]
  );

  const seismicReport = useMemo(
    () =>
      generateSeismicReport({
        province,
        soilClass,
        importanceCategory: importance,
        structuralSystem,
        buildingHeight,
        buildingWeight,
        numberOfStoreys,
      }),
    [province, soilClass, importance, structuralSystem, buildingHeight, buildingWeight, numberOfStoreys]
  );

  const floodReport = useMemo(
    () =>
      generateFloodReport(
        province,
        terrainType,
        distanceFromWater,
        project.location.coordinates?.elevation || 10,
        buildingType as any,
        terrainType === 'coastal-lowland' || terrainType === 'island-atoll'
      ),
    [province, terrainType, distanceFromWater, project.location.coordinates?.elevation, buildingType]
  );

  const filteredMaterials = useMemo(() => {
    if (materialSearch) {
      return searchMaterials(materialSearch);
    }
    return ALL_MATERIALS;
  }, [materialSearch]);

  return (
    <div className="png-analysis-panel">
      <div className="panel-header">
        <h2>PNG Analysis</h2>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'climate' ? 'active' : ''}`}
          onClick={() => setActiveTab('climate')}
        >
          Climate
        </button>
        <button
          className={`tab ${activeTab === 'seismic' ? 'active' : ''}`}
          onClick={() => setActiveTab('seismic')}
        >
          Seismic
        </button>
        <button
          className={`tab ${activeTab === 'flood' ? 'active' : ''}`}
          onClick={() => setActiveTab('flood')}
        >
          Flood
        </button>
        <button
          className={`tab ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          Materials
        </button>
        <button
          className={`tab ${activeTab === 'structural' ? 'active' : ''}`}
          onClick={() => setActiveTab('structural')}
        >
          Structural
        </button>
      </div>

      <div className="panel-content">
        {activeTab === 'climate' && (
          <ClimateTab report={climateReport} />
        )}
        {activeTab === 'seismic' && (
          <SeismicTab
            report={seismicReport}
            soilClass={soilClass}
            setSoilClass={setSoilClass}
            importance={importance}
            setImportance={setImportance}
            structuralSystem={structuralSystem}
            setStructuralSystem={setStructuralSystem}
            buildingHeight={buildingHeight}
            setBuildingHeight={setBuildingHeight}
            buildingWeight={buildingWeight}
            setBuildingWeight={setBuildingWeight}
            numberOfStoreys={numberOfStoreys}
            setNumberOfStoreys={setNumberOfStoreys}
          />
        )}
        {activeTab === 'flood' && (
          <FloodTab
            report={floodReport}
            distanceFromWater={distanceFromWater}
            setDistanceFromWater={setDistanceFromWater}
          />
        )}
        {activeTab === 'materials' && (
          <MaterialsTab
            materials={filteredMaterials}
            searchQuery={materialSearch}
            onSearchChange={setMaterialSearch}
            province={province}
          />
        )}
        {activeTab === 'structural' && (
          <StructuralTab report={seismicReport} climateReport={climateReport} />
        )}
      </div>
    </div>
  );
}

// Climate Tab Component
function ClimateTab({ report }: { report: ClimateReport }) {
  return (
    <div className="tab-content">
      <div className="info-section">
        <h3>Location</h3>
        <p>Province: {report.province}</p>
        <p>Climate Zone: {report.climateZone}</p>
      </div>

      <div className="info-section">
        <h3>Climate Data</h3>
        <div className="data-grid">
          <div className="data-item">
            <label>Temperature</label>
            <span>
              {report.climateData.averageTemperature.min}°C - {report.climateData.averageTemperature.max}°C
            </span>
          </div>
          <div className="data-item">
            <label>Humidity</label>
            <span>{report.climateData.humidity.annual}%</span>
          </div>
          <div className="data-item">
            <label>Annual Rainfall</label>
            <span>{report.climateData.rainfall.annual} mm</span>
          </div>
          <div className="data-item">
            <label>Max Daily Rainfall</label>
            <span>{report.climateData.rainfall.maxDaily} mm</span>
          </div>
          <div className="data-item">
            <label>Max Wind Gust</label>
            <span>{report.climateData.wind.maxGust} km/h</span>
          </div>
          <div className="data-item">
            <label>Cyclone Risk</label>
            <span className={`risk-${report.climateData.wind.cycloneRisk}`}>
              {report.climateData.wind.cycloneRisk}
            </span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Design Factors</h3>
        <ul className="design-factors">
          <li>Ventilation: {report.designFactors.ventilationRequired}</li>
          <li>Moisture Protection: {report.designFactors.moistureProtection}</li>
          <li>Minimum Roof Pitch: {report.designFactors.roofPitchMin}°</li>
          <li>Recommended Overhangs: {report.designFactors.overhangsRecommended}m</li>
          <li>Corrosion Protection: {report.designFactors.corrosionProtection}</li>
          <li>Termite Protection: {report.designFactors.termiteProtection}</li>
        </ul>
      </div>

      <div className="info-section">
        <h3>Thermal Comfort</h3>
        <p>Thermal Stress Level: <span className={`stress-${report.thermalComfort.thermalStress}`}>
          {report.thermalComfort.thermalStress}
        </span></p>
        <p>Natural Ventilation Viable: {report.thermalComfort.naturalVentilationViable ? 'Yes' : 'No'}</p>
        <p>Recommended Openings: {report.thermalComfort.recommendedOpeningPercentage}% of floor area</p>
      </div>

      <div className="info-section">
        <h3>Recommendations</h3>
        <ul className="recommendations">
          {report.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Seismic Tab Component
function SeismicTab({
  report,
  soilClass,
  setSoilClass,
  importance,
  setImportance,
  structuralSystem,
  setStructuralSystem,
  buildingHeight,
  setBuildingHeight,
  buildingWeight,
  setBuildingWeight,
  numberOfStoreys,
  setNumberOfStoreys,
}: {
  report: SeismicReport;
  soilClass: SoilClass;
  setSoilClass: (s: SoilClass) => void;
  importance: ImportanceCategory;
  setImportance: (i: ImportanceCategory) => void;
  structuralSystem: StructuralSystem;
  setStructuralSystem: (s: StructuralSystem) => void;
  buildingHeight: number;
  setBuildingHeight: (h: number) => void;
  buildingWeight: number;
  setBuildingWeight: (w: number) => void;
  numberOfStoreys: number;
  setNumberOfStoreys: (n: number) => void;
}) {
  return (
    <div className="tab-content">
      <div className="info-section">
        <h3>Seismic Zone</h3>
        <p className={`seismic-zone zone-${report.seismicData.zone}`}>
          {report.seismicData.zone.toUpperCase()}
        </p>
        <p>{report.seismicData.description}</p>
        <p>Hazard Factor (Z): {report.seismicData.hazardFactor}</p>
      </div>

      <div className="info-section">
        <h3>Design Parameters</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>Soil Class</label>
            <select value={soilClass} onChange={(e) => setSoilClass(e.target.value as SoilClass)}>
              <option value="A">A - Strong rock</option>
              <option value="B">B - Rock</option>
              <option value="C">C - Shallow soil</option>
              <option value="D">D - Deep/soft soil</option>
              <option value="E">E - Very soft soil</option>
            </select>
          </div>

          <div className="input-group">
            <label>Importance Category</label>
            <select
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value) as ImportanceCategory)}
            >
              <option value={1}>1 - Minor structures</option>
              <option value={2}>2 - Normal structures</option>
              <option value={3}>3 - Important structures</option>
              <option value={4}>4 - Essential facilities</option>
            </select>
          </div>

          <div className="input-group">
            <label>Structural System</label>
            <select
              value={structuralSystem}
              onChange={(e) => setStructuralSystem(e.target.value as StructuralSystem)}
            >
              <option value="timber-frame">Timber frame</option>
              <option value="light-steel-frame">Light steel frame</option>
              <option value="masonry-reinforced">Reinforced masonry</option>
              <option value="concrete-frame">Concrete frame</option>
              <option value="concrete-shear-wall">Concrete shear wall</option>
              <option value="steel-frame">Steel frame</option>
              <option value="traditional-haus-tambaran">Traditional (Haus Tambaran)</option>
            </select>
          </div>

          <div className="input-group">
            <label>Building Height (m)</label>
            <input
              type="number"
              value={buildingHeight}
              onChange={(e) => setBuildingHeight(Number(e.target.value))}
              min={3}
              max={100}
            />
          </div>

          <div className="input-group">
            <label>Building Weight (kN)</label>
            <input
              type="number"
              value={buildingWeight}
              onChange={(e) => setBuildingWeight(Number(e.target.value))}
              min={100}
            />
          </div>

          <div className="input-group">
            <label>Number of Storeys</label>
            <input
              type="number"
              value={numberOfStoreys}
              onChange={(e) => setNumberOfStoreys(Number(e.target.value))}
              min={1}
              max={20}
            />
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Design Results</h3>
        <div className="data-grid">
          <div className="data-item">
            <label>Base Shear</label>
            <span>{report.designResults.designBaseShear.toFixed(1)} kN</span>
          </div>
          <div className="data-item">
            <label>Base Shear Coefficient</label>
            <span>{(report.designResults.designBaseShearCoefficient * 100).toFixed(1)}%</span>
          </div>
          <div className="data-item">
            <label>Building Period</label>
            <span>{report.designResults.buildingPeriod.toFixed(2)} s</span>
          </div>
          <div className="data-item">
            <label>Spectral Acceleration</label>
            <span>{report.designResults.spectralAcceleration.toFixed(2)} g</span>
          </div>
        </div>
      </div>

      {report.designResults.warnings.length > 0 && (
        <div className="info-section warning">
          <h3>Warnings</h3>
          <ul>
            {report.designResults.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="info-section">
        <h3>Foundation Recommendations</h3>
        {report.foundationRecommendations.map((rec, i) => (
          <div key={i} className="foundation-rec">
            <h4>{rec.type}</h4>
            <p>{rec.description}</p>
            <p><em>{rec.suitability}</em></p>
            <ul>
              {rec.considerations.map((c, j) => (
                <li key={j}>{c}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// Flood Tab Component
function FloodTab({
  report,
  distanceFromWater,
  setDistanceFromWater,
}: {
  report: FloodReport;
  distanceFromWater: number;
  setDistanceFromWater: (d: number) => void;
}) {
  return (
    <div className="tab-content">
      <div className="info-section">
        <h3>Flood Zone</h3>
        <p className={`flood-zone zone-${report.floodZone}`}>
          {report.floodZone.toUpperCase()}
        </p>
        <p>{report.zoneData.description}</p>
        <p>Expected Frequency: {report.zoneData.expectedFrequency}</p>
      </div>

      <div className="info-section">
        <h3>Site Parameters</h3>
        <div className="input-group">
          <label>Distance from Water (m)</label>
          <input
            type="number"
            value={distanceFromWater}
            onChange={(e) => setDistanceFromWater(Number(e.target.value))}
            min={0}
          />
        </div>
      </div>

      {report.nearbyRivers.length > 0 && (
        <div className="info-section">
          <h3>Nearby Rivers</h3>
          {report.nearbyRivers.map((river, i) => (
            <div key={i} className="river-info">
              <h4>{river.name}</h4>
              <p>Length: {river.length} km | Catchment: {river.catchmentArea} km²</p>
              <p>Flood Risk: <span className={`risk-${river.floodRisk}`}>{river.floodRisk}</span></p>
            </div>
          ))}
        </div>
      )}

      <div className="info-section">
        <h3>Flood Level Estimates</h3>
        <table className="flood-table">
          <thead>
            <tr>
              <th>Return Period</th>
              <th>Flood Level</th>
              <th>Velocity</th>
              <th>Duration</th>
              <th>Debris Risk</th>
            </tr>
          </thead>
          <tbody>
            {report.floodEstimates.map((est, i) => (
              <tr key={i}>
                <td>{est.returnPeriod} years</td>
                <td>{est.floodLevel} m</td>
                <td>{est.velocity} m/s</td>
                <td>{est.duration} hrs</td>
                <td className={`risk-${est.debrisRisk}`}>{est.debrisRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="info-section">
        <h3>Design Requirements</h3>
        <ul>
          <li>Foundation Type: {report.designRequirements.foundationType}</li>
          <li>Minimum Floor Height: {report.designRequirements.minimumFloorHeight}m above ground</li>
          <li>Wall Construction: {report.designRequirements.wallConstruction}</li>
        </ul>

        <h4>Materials</h4>
        <ul>
          {report.designRequirements.materials.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        <h4>Emergency Features</h4>
        <ul>
          {report.designRequirements.emergencyFeatures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>

      <div className="info-section">
        <h3>Recommendations</h3>
        <ul className="recommendations">
          {report.recommendations.map((rec, i) => (
            <li key={i}>{rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Materials Tab Component
function MaterialsTab({
  materials,
  searchQuery,
  onSearchChange,
  province,
}: {
  materials: Material[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  province: PNGProvince;
}) {
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  return (
    <div className="tab-content materials-tab">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="materials-grid">
        {materials.map((material) => (
          <div
            key={material.id}
            className={`material-card ${selectedMaterial?.id === material.id ? 'selected' : ''}`}
            onClick={() => setSelectedMaterial(material)}
          >
            <h4>{material.name}</h4>
            {material.localName && <span className="local-name">{material.localName}</span>}
            <span className={`availability ${material.availability}`}>
              {material.availability}
            </span>
            <span className={`cost cost-${material.costIndicator}`}>
              {'$'.repeat(material.costIndicator)}
            </span>
          </div>
        ))}
      </div>

      {selectedMaterial && (
        <div className="material-details">
          <h3>{selectedMaterial.name}</h3>
          <p>{selectedMaterial.description}</p>

          <div className="detail-section">
            <h4>Properties</h4>
            <ul>
              {selectedMaterial.properties.density && (
                <li>Density: {selectedMaterial.properties.density} kg/m³</li>
              )}
              {selectedMaterial.properties.compressiveStrength && (
                <li>Compressive Strength: {selectedMaterial.properties.compressiveStrength} MPa</li>
              )}
              {selectedMaterial.properties.tensileStrength && (
                <li>Tensile Strength: {selectedMaterial.properties.tensileStrength} MPa</li>
              )}
            </ul>
          </div>

          <div className="detail-section">
            <h4>Durability</h4>
            <ul>
              <li>Expected Lifespan: {selectedMaterial.durability.lifespan} years</li>
              <li>Termite Resistance: {selectedMaterial.durability.termiteResistance}</li>
              <li>Weather Resistance: {selectedMaterial.durability.weatherResistance}</li>
            </ul>
          </div>

          <div className="detail-section">
            <h4>Applications</h4>
            <ul>
              {selectedMaterial.applications.map((app, i) => (
                <li key={i}>{app}</li>
              ))}
            </ul>
          </div>

          <div className="detail-section">
            <h4>Recommendations</h4>
            <ul>
              {selectedMaterial.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Structural Tab Component
function StructuralTab({
  report,
  climateReport,
}: {
  report: SeismicReport;
  climateReport: ClimateReport;
}) {
  return (
    <div className="tab-content">
      <div className="info-section">
        <h3>Structural Design Summary</h3>
        <p>
          Based on the climate and seismic conditions of {report.location}, the following
          structural considerations apply:
        </p>
      </div>

      <div className="info-section">
        <h3>Load Factors</h3>
        <ul>
          <li>Site Factor (soil): {report.designResults.siteFactor}</li>
          <li>Importance Factor: {report.designResults.importanceFactor}</li>
          <li>Ductility Factor: {report.designResults.ductilityFactor}</li>
        </ul>
      </div>

      <div className="info-section">
        <h3>Lateral Force Distribution</h3>
        <table>
          <thead>
            <tr>
              <th>Storey</th>
              <th>Force (kN)</th>
            </tr>
          </thead>
          <tbody>
            {report.designResults.lateralForceDistribution.map((item, i) => (
              <tr key={i}>
                <td>Level {item.storey}</td>
                <td>{item.force.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="info-section">
        <h3>Detailing Requirements</h3>
        <ul>
          {report.detailingRequirements.map((req, i) => (
            <li key={i}>{req}</li>
          ))}
        </ul>
      </div>

      <div className="info-section">
        <h3>Reference Standards</h3>
        <ul>
          {report.referenceStandards.map((std, i) => (
            <li key={i}>{std}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
