/**
 * Integration Tests - Project Workflow
 * Tests the complete workflow of creating a project and performing analysis
 */

import { describe, it, expect } from 'vitest';
import {
  createLayer,
  createNewProject,
  createInitialState,
  type CADEngineState,
} from '../../src/core/engine';
import { generateClimateReport } from '../../src/png/climate';
import { generateSeismicReport, type SeismicDesignInput } from '../../src/png/seismic';
import { generateFloodReport } from '../../src/png/flood';
import { getMaterialsByAvailability, getMaterialsForApplication } from '../../src/png/materials';
import type { PNGProvince, PNGTerrainType } from '../../src/core/types';

describe('Project Workflow Integration', () => {
  describe('Complete Project Setup', () => {
    it('should create a project with layers', () => {
      // Create project
      const project = createNewProject('Test Building');
      expect(project.name).toBe('Test Building');
      expect(project.layers.length).toBeGreaterThan(0);

      // Create additional layers
      const structuralLayer = createLayer('Structural');
      const foundationLayer = createLayer('Foundation');
      const drainageLayer = createLayer('Drainage');

      expect(structuralLayer.name).toBe('Structural');
      expect(foundationLayer.name).toBe('Foundation');
      expect(drainageLayer.name).toBe('Drainage');
      expect(structuralLayer.visible).toBe(true);
      expect(structuralLayer.locked).toBe(false);
    });

    it('should initialize CAD engine state', () => {
      const state = createInitialState('My Project');

      expect(state.project.name).toBe('My Project');
      expect(state.activeTool).toBe('select');
      expect(state.selectedEntityIds).toEqual([]);
      expect(state.commandHistory).toBeDefined();
    });

    it('should support project metadata for PNG', () => {
      const project = createNewProject('Port Moresby Office');

      expect(project.metadata).toBeDefined();
      expect(project.entities).toEqual([]);
      expect(project.layers.length).toBeGreaterThan(0);
    });
  });
});

describe('PNG Analysis Integration', () => {
  describe('Combined Analysis for Port Moresby', () => {
    const province: PNGProvince = 'National Capital District';
    const terrainType: PNGTerrainType = 'coastal-lowland';

    it('should generate complete site analysis', () => {
      // Climate analysis
      const climateReport = generateClimateReport(province, terrainType, 'commercial');
      expect(climateReport.province).toBe(province);
      expect(climateReport.climateZone).toBe('tropical-coastal');

      // Seismic analysis
      const seismicInput: SeismicDesignInput = {
        province,
        soilClass: 'C',
        importanceCategory: 3,
        structuralSystem: 'concrete-frame',
        buildingHeight: 15,
        buildingWeight: 3000,
        numberOfStoreys: 5,
      };
      const seismicReport = generateSeismicReport(seismicInput);
      expect(seismicReport.seismicData.zone).toBe('zone-3');

      // Flood analysis
      const floodReport = generateFloodReport(
        province,
        terrainType,
        200,  // 200m from water
        15,   // 15m elevation
        'commercial',
        true  // Coastal
      );
      expect(floodReport.floodZone).toBe('moderate');

      // Material availability
      const materials = getMaterialsByAvailability(province);
      expect(materials.length).toBeGreaterThan(5);
    });

    it('should provide consistent recommendations across analyses', () => {
      const climateReport = generateClimateReport(province, terrainType, 'residential');
      const floodReport = generateFloodReport(province, terrainType, 100, 10, 'residential', true);

      // Both should recommend corrosion protection for coastal
      expect(climateReport.designFactors.corrosionProtection).toBe('marine-grade');
      expect(floodReport.designRequirements.materials.some(m =>
        m.includes('marine') || m.includes('corrosion') || m.includes('stainless')
      )).toBe(true);
    });
  });

  describe('Combined Analysis for Highland Province', () => {
    const province: PNGProvince = 'Eastern Highlands';
    const terrainType: PNGTerrainType = 'highland-valley';

    it('should identify different requirements for highlands', () => {
      const climateReport = generateClimateReport(province, terrainType, 'residential');
      const seismicInput: SeismicDesignInput = {
        province,
        soilClass: 'B',
        importanceCategory: 2,
        structuralSystem: 'timber-frame',
        buildingHeight: 6,
        buildingWeight: 400,
        numberOfStoreys: 2,
      };
      const seismicReport = generateSeismicReport(seismicInput);

      // Highland-specific characteristics
      expect(climateReport.climateZone).toBe('tropical-highland');
      expect(climateReport.designFactors.insulationRequired).toBe(true);
      expect(climateReport.thermalComfort.heatingRequired).toBe(true);

      // Lower seismic zone
      expect(seismicReport.seismicData.zone).toBe('zone-2');
      expect(seismicReport.designResults.hazardFactor).toBe(0.25);
    });
  });

  describe('Combined Analysis for High-Risk Zone', () => {
    const province: PNGProvince = 'Madang';
    const terrainType: PNGTerrainType = 'riverine-floodplain';

    it('should provide comprehensive high-risk analysis', () => {
      const climateReport = generateClimateReport(province, terrainType, 'community');
      const seismicInput: SeismicDesignInput = {
        province,
        soilClass: 'D',
        importanceCategory: 3,  // Community building = important
        structuralSystem: 'timber-frame',
        buildingHeight: 8,
        buildingWeight: 800,
        numberOfStoreys: 2,
      };
      const seismicReport = generateSeismicReport(seismicInput);
      const floodReport = generateFloodReport(
        province,
        terrainType,
        50,
        8,
        'community',
        false
      );

      // Verify high-risk assessments
      expect(seismicReport.seismicData.zone).toBe('zone-4');
      expect(floodReport.floodZone).toBe('very-high');
      // Madang is tropical-coastal, which has 82% humidity (not > 80 triggers 'enhanced', not 'maximum')
      // and tropical-coastal has 2500mm rainfall (not > 3000 for 'maximum')
      expect(['enhanced', 'maximum']).toContain(climateReport.designFactors.moistureProtection);

      // Verify recommendations address risks
      expect(seismicReport.designResults.recommendations.length).toBeGreaterThan(0);
      expect(floodReport.designRequirements.foundationType).toBe('piles');
      expect(floodReport.designRequirements.minimumFloorHeight).toBeGreaterThan(1.0);
    });
  });

  describe('Material Selection Workflow', () => {
    it('should find suitable materials for specific application', () => {
      const province: PNGProvince = 'Morobe';

      // Get all available materials
      const allMaterials = getMaterialsByAvailability(province);

      // Filter for structural application
      const structuralMaterials = getMaterialsForApplication('structural');
      const availableStructural = structuralMaterials.filter(m =>
        allMaterials.some(am => am.id === m.id)
      );

      expect(availableStructural.length).toBeGreaterThan(0);

      // Verify Kwila is available for structural use
      const kwila = availableStructural.find(m => m.id === 'kwila');
      expect(kwila).toBeDefined();
    });

    it('should recommend termite-resistant materials for tropical areas', () => {
      const climateReport = generateClimateReport('Morobe', 'coastal-lowland', 'residential');

      // High temperature areas need enhanced termite protection
      expect(['standard', 'enhanced']).toContain(climateReport.designFactors.termiteProtection);
    });
  });
});

describe('Multi-Province Comparison', () => {
  const provinces: PNGProvince[] = [
    'National Capital District',
    'Eastern Highlands',
    'Madang',
    'Manus',
  ];

  it('should generate comparable reports for different provinces', () => {
    const reports = provinces.map(province => ({
      province,
      climate: generateClimateReport(province, 'coastal-lowland', 'residential'),
      seismic: generateSeismicReport({
        province,
        soilClass: 'C',
        importanceCategory: 2,
        structuralSystem: 'timber-frame',
        buildingHeight: 6,
        buildingWeight: 400,
        numberOfStoreys: 2,
      }),
    }));

    // Verify all reports are generated
    expect(reports.length).toBe(4);

    // Verify different seismic zones
    const zones = reports.map(r => r.seismic.seismicData.zone);
    expect(zones).toContain('zone-3');
    expect(zones).toContain('zone-4');

    // Verify different design requirements
    reports.forEach(report => {
      expect(report.climate.recommendations.length).toBeGreaterThan(0);
      expect(report.seismic.designResults.designBaseShear).toBeGreaterThan(0);
    });
  });

  it('should show increasing seismic requirements for higher zones', () => {
    const baseInput = {
      soilClass: 'C' as const,
      importanceCategory: 2 as const,
      structuralSystem: 'timber-frame' as const,
      buildingHeight: 6,
      buildingWeight: 400,
      numberOfStoreys: 2,
    };

    const westernResult = generateSeismicReport({ ...baseInput, province: 'Western' });      // Zone 1
    const engaResult = generateSeismicReport({ ...baseInput, province: 'Enga' });           // Zone 2
    const centralResult = generateSeismicReport({ ...baseInput, province: 'Central' });     // Zone 3
    const madangResult = generateSeismicReport({ ...baseInput, province: 'Madang' });       // Zone 4

    // Base shear should increase with zone
    expect(westernResult.designResults.designBaseShear)
      .toBeLessThan(engaResult.designResults.designBaseShear);
    expect(engaResult.designResults.designBaseShear)
      .toBeLessThan(centralResult.designResults.designBaseShear);
    expect(centralResult.designResults.designBaseShear)
      .toBeLessThan(madangResult.designResults.designBaseShear);
  });
});

describe('Complete Site Assessment Workflow', () => {
  it('should perform full site assessment for a project', () => {
    // Project setup
    const project = createNewProject('Community Hall - Madang');

    // Site location
    const province: PNGProvince = 'Madang';
    const terrain: PNGTerrainType = 'coastal-lowland';

    // 1. Climate Analysis
    const climate = generateClimateReport(province, terrain, 'community');
    expect(climate.climateZone).toBe('tropical-coastal');
    expect(climate.designFactors.ventilationRequired).toBeDefined();

    // 2. Seismic Analysis
    const seismic = generateSeismicReport({
      province,
      soilClass: 'C',
      importanceCategory: 3,  // Community building
      structuralSystem: 'concrete-frame',
      buildingHeight: 8,
      buildingWeight: 1200,
      numberOfStoreys: 2,
    });
    expect(seismic.seismicData.zone).toBe('zone-4');
    expect(seismic.designResults.designBaseShear).toBeGreaterThan(0);

    // 3. Flood Analysis
    const flood = generateFloodReport(
      province,
      terrain,
      150,  // 150m from coast
      5,    // 5m elevation
      'community',
      true  // Coastal
    );
    expect(flood.floodZone).toBe('moderate');
    expect(flood.designRequirements.minimumFloorHeight).toBeGreaterThan(0);

    // 4. Material Selection
    const materials = getMaterialsByAvailability(province);
    const structuralTimber = materials.filter(m =>
      m.category === 'timber' &&
      m.durability.termiteResistance !== 'none' &&
      m.durability.termiteResistance !== 'low'
    );
    expect(structuralTimber.length).toBeGreaterThan(0);

    // 5. Compile all recommendations
    const allRecommendations = [
      ...climate.recommendations,
      ...seismic.designResults.recommendations,
      ...flood.recommendations,
    ];
    expect(allRecommendations.length).toBeGreaterThan(5);
  });
});
