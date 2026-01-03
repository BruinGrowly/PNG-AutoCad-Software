/**
 * PNG Climate Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getClimateZone,
  getClimateData,
  getClimateDataForProvince,
  getDesignFactors,
  calculateDesignRainfallIntensity,
  calculateDrainageRequirements,
  calculateWindLoad,
  analyzeThermalComfort,
  generateClimateReport,
} from '../../src/png/climate.js';

describe('Climate Zone Functions', () => {
  describe('getClimateZone', () => {
    it('should return tropical-coastal for Port Moresby (NCD)', () => {
      expect(getClimateZone('National Capital District')).toBe('tropical-coastal');
    });

    it('should return tropical-highland for Eastern Highlands', () => {
      expect(getClimateZone('Eastern Highlands')).toBe('tropical-highland');
    });

    it('should return tropical-monsoon for East Sepik', () => {
      expect(getClimateZone('East Sepik')).toBe('tropical-monsoon');
    });

    it('should return tropical-island for East New Britain', () => {
      expect(getClimateZone('East New Britain')).toBe('tropical-island');
    });
  });

  describe('getClimateData', () => {
    it('should return valid climate data for tropical-coastal zone', () => {
      const data = getClimateData('tropical-coastal');

      expect(data.zone).toBe('tropical-coastal');
      expect(data.averageTemperature.annual).toBe(27);
      expect(data.humidity.annual).toBe(82);
      expect(data.rainfall.annual).toBe(2500);
      expect(data.wind.cycloneRisk).toBe('low');
    });

    it('should return cooler temperatures for highland zone', () => {
      const data = getClimateData('tropical-highland');

      expect(data.averageTemperature.annual).toBe(18);
      expect(data.averageTemperature.min).toBe(12);
    });

    it('should return high rainfall for monsoon zone', () => {
      const data = getClimateData('tropical-monsoon');

      expect(data.rainfall.annual).toBe(4000);
      expect(data.rainfall.maxDaily).toBe(200);
    });

    it('should return high cyclone risk for island zone', () => {
      const data = getClimateData('tropical-island');

      expect(data.wind.cycloneRisk).toBe('high');
      expect(data.wind.maxGust).toBe(120);
    });
  });
});

describe('Design Factors', () => {
  describe('getDesignFactors', () => {
    it('should require extensive ventilation in high humidity zones', () => {
      const climateData = getClimateData('tropical-monsoon');
      const factors = getDesignFactors(climateData, 'coastal-lowland');

      expect(factors.ventilationRequired).toBe('extensive');
    });

    it('should require insulation only in highlands', () => {
      const highlandData = getClimateData('tropical-highland');
      const coastalData = getClimateData('tropical-coastal');

      expect(getDesignFactors(highlandData, 'highland-valley').insulationRequired).toBe(true);
      expect(getDesignFactors(coastalData, 'coastal-lowland').insulationRequired).toBe(false);
    });

    it('should recommend maximum moisture protection for high rainfall', () => {
      const monsoonData = getClimateData('tropical-monsoon');
      const factors = getDesignFactors(monsoonData, 'riverine-floodplain');

      expect(['enhanced', 'maximum']).toContain(factors.moistureProtection);
    });

    it('should require elevated floor in flood-prone terrain', () => {
      const climateData = getClimateData('tropical-coastal');

      const floodplainFactors = getDesignFactors(climateData, 'riverine-floodplain');
      const highlandFactors = getDesignFactors(climateData, 'highland-valley');

      expect(floodplainFactors.elevatedFloorRequired).toBe(true);
      expect(highlandFactors.elevatedFloorRequired).toBe(false);
    });

    it('should require marine-grade corrosion protection for coastal areas', () => {
      const climateData = getClimateData('tropical-coastal');

      const coastalFactors = getDesignFactors(climateData, 'coastal-lowland');
      expect(coastalFactors.corrosionProtection).toBe('marine-grade');
    });
  });
});

describe('Rainfall & Drainage Calculations', () => {
  describe('calculateDesignRainfallIntensity', () => {
    it('should calculate rainfall intensity for given return period', () => {
      const climateData = getClimateData('tropical-coastal');

      const intensity10yr = calculateDesignRainfallIntensity(climateData, 10, 30);
      const intensity100yr = calculateDesignRainfallIntensity(climateData, 100, 30);

      expect(intensity10yr).toBeGreaterThan(0);
      expect(intensity100yr).toBeGreaterThan(intensity10yr);
    });
  });

  describe('calculateDrainageRequirements', () => {
    it('should calculate peak runoff using rational method', () => {
      const params = {
        catchmentArea: 1000,
        rainfallIntensity: 100,
        runoffCoefficient: 0.8,
        timeOfConcentration: 10,
      };

      const result = calculateDrainageRequirements(params);

      expect(result.peakRunoff).toBeGreaterThan(0);
      expect(result.pipeSize).toBeGreaterThan(0);
    });

    it('should recommend standard pipe sizes', () => {
      const params = {
        catchmentArea: 500,
        rainfallIntensity: 80,
        runoffCoefficient: 0.6,
        timeOfConcentration: 15,
      };

      const result = calculateDrainageRequirements(params);

      const standardSizes = [100, 150, 200, 225, 300, 375, 450, 525, 600, 750, 900, 1050, 1200];
      expect(standardSizes).toContain(result.pipeSize);
    });
  });
});

describe('Wind Load Calculations', () => {
  describe('calculateWindLoad', () => {
    it('should calculate design wind speed from climate data', () => {
      const climateData = getClimateData('tropical-island');
      const params = {
        climateData,
        buildingHeight: 6,
        buildingWidth: 10,
        buildingLength: 15,
        terrainCategory: 2,
        importanceLevel: 2,
        topographyFactor: 1.0,
      };

      const result = calculateWindLoad(params);

      expect(result.designWindSpeed).toBeGreaterThan(0);
      expect(result.windPressure).toBeGreaterThan(0);
      expect(result.upliftForce).toBeGreaterThan(0);
    });

    it('should include cyclone recommendations for high-risk areas', () => {
      const climateData = getClimateData('tropical-island');
      const params = {
        climateData,
        buildingHeight: 8,
        buildingWidth: 12,
        buildingLength: 20,
        terrainCategory: 1,
        importanceLevel: 2,
        topographyFactor: 1.0,
      };

      const result = calculateWindLoad(params);

      expect(result.recommendations).toContain('Design for cyclonic wind conditions');
    });
  });
});

describe('Thermal Comfort Analysis', () => {
  describe('analyzeThermalComfort', () => {
    it('should identify thermal stress in hot humid conditions', () => {
      const monsoonData = getClimateData('tropical-monsoon');
      const result = analyzeThermalComfort(monsoonData, 'residential');

      expect(['mild', 'moderate', 'high']).toContain(result.thermalStress);
    });

    it('should not require heating in tropical lowlands', () => {
      const coastalData = getClimateData('tropical-coastal');
      const result = analyzeThermalComfort(coastalData, 'residential');

      expect(result.heatingRequired).toBe(false);
    });

    it('should require heating in highlands', () => {
      const highlandData = getClimateData('tropical-highland');
      const result = analyzeThermalComfort(highlandData, 'residential');

      expect(result.heatingRequired).toBe(true);
    });
  });
});

describe('Climate Report Generation', () => {
  describe('generateClimateReport', () => {
    it('should generate complete report for a province', () => {
      const report = generateClimateReport(
        'Morobe',
        'coastal-lowland',
        'residential'
      );

      expect(report.province).toBe('Morobe');
      expect(report.climateZone).toBe('tropical-coastal');
      expect(report.climateData).toBeDefined();
      expect(report.designFactors).toBeDefined();
      expect(report.thermalComfort).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should include terrain-specific recommendations', () => {
      const coastalReport = generateClimateReport(
        'Central',
        'coastal-lowland',
        'commercial'
      );

      expect(coastalReport.recommendations).toContain(
        'Use corrosion-resistant materials for coastal exposure'
      );
    });
  });
});
