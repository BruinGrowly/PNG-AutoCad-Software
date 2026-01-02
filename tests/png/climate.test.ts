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
  type ClimateData,
  type DrainageDesignParams,
  type WindLoadParams,
} from '../../src/png/climate';
import type { PNGProvince, PNGClimateZone, PNGTerrainType } from '../../src/core/types';

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

    it('should return tropical-highland for all highland provinces', () => {
      const highlandProvinces: PNGProvince[] = [
        'Eastern Highlands',
        'Western Highlands',
        'Southern Highlands',
        'Enga',
        'Simbu',
        'Hela',
        'Jiwaka',
      ];

      highlandProvinces.forEach(province => {
        expect(getClimateZone(province)).toBe('tropical-highland');
      });
    });

    it('should return tropical-island for all island provinces', () => {
      const islandProvinces: PNGProvince[] = [
        'East New Britain',
        'West New Britain',
        'New Ireland',
        'Manus',
        'Milne Bay',
        'Autonomous Region of Bougainville',
      ];

      islandProvinces.forEach(province => {
        expect(getClimateZone(province)).toBe('tropical-island');
      });
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
      expect(data.wind.cycloneRisk).toBe('none');
    });

    it('should return high rainfall for monsoon zone', () => {
      const data = getClimateData('tropical-monsoon');

      expect(data.rainfall.annual).toBe(4000);
      expect(data.rainfall.maxDaily).toBe(200);
      expect(data.humidity.annual).toBe(87);
    });

    it('should return high cyclone risk for island zone', () => {
      const data = getClimateData('tropical-island');

      expect(data.wind.cycloneRisk).toBe('high');
      expect(data.wind.maxGust).toBe(120);
    });

    it('should include wet season months in all zones', () => {
      const zones: PNGClimateZone[] = [
        'tropical-coastal',
        'tropical-highland',
        'tropical-monsoon',
        'tropical-island',
      ];

      zones.forEach(zone => {
        const data = getClimateData(zone);
        expect(data.rainfall.wetSeasonMonths.length).toBeGreaterThan(0);
        expect(data.rainfall.wetSeasonMonths.every(m => m >= 1 && m <= 12)).toBe(true);
      });
    });
  });

  describe('getClimateDataForProvince', () => {
    it('should return correct climate data for a province', () => {
      const data = getClimateDataForProvince('Madang');

      expect(data.zone).toBe('tropical-coastal');
      expect(data.averageTemperature.annual).toBe(27);
    });

    it('should return highland climate for Enga', () => {
      const data = getClimateDataForProvince('Enga');

      expect(data.zone).toBe('tropical-highland');
      expect(data.averageTemperature.annual).toBeLessThan(25);
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

      expect(factors.moistureProtection).toBe('maximum');
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
      const islandFactors = getDesignFactors(climateData, 'island-atoll');

      expect(coastalFactors.corrosionProtection).toBe('marine-grade');
      expect(islandFactors.corrosionProtection).toBe('marine-grade');
    });

    it('should recommend minimum 25 degree roof pitch for high rainfall', () => {
      const monsoonData = getClimateData('tropical-monsoon');
      const factors = getDesignFactors(monsoonData, 'riverine-floodplain');

      expect(factors.roofPitchMin).toBeGreaterThanOrEqual(25);
    });

    it('should include mold prevention measures for humid conditions', () => {
      const monsoonData = getClimateData('tropical-monsoon');
      const factors = getDesignFactors(monsoonData, 'coastal-lowland');

      expect(factors.moldPreventionMeasures.length).toBeGreaterThan(0);
      expect(factors.moldPreventionMeasures).toContain('Ensure adequate ventilation in all spaces');
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

    it('should return higher intensity for shorter duration', () => {
      const climateData = getClimateData('tropical-monsoon');

      const intensity15min = calculateDesignRainfallIntensity(climateData, 50, 15);
      const intensity60min = calculateDesignRainfallIntensity(climateData, 50, 60);

      expect(intensity15min).toBeGreaterThan(intensity60min);
    });

    it('should return higher intensity for monsoon zone', () => {
      const coastalData = getClimateData('tropical-coastal');
      const monsoonData = getClimateData('tropical-monsoon');

      const coastalIntensity = calculateDesignRainfallIntensity(coastalData, 50, 30);
      const monsoonIntensity = calculateDesignRainfallIntensity(monsoonData, 50, 30);

      expect(monsoonIntensity).toBeGreaterThan(coastalIntensity);
    });
  });

  describe('calculateDrainageRequirements', () => {
    it('should calculate peak runoff using rational method', () => {
      const params: DrainageDesignParams = {
        catchmentArea: 1000,  // 1000 m²
        rainfallIntensity: 100,  // 100 mm/hr
        runoffCoefficient: 0.8,
        timeOfConcentration: 10,
      };

      const result = calculateDrainageRequirements(params);

      expect(result.peakRunoff).toBeGreaterThan(0);
      expect(result.pipeSize).toBeGreaterThan(0);
      expect(result.slope).toBe(1);  // Default 1%
    });

    it('should recommend standard pipe sizes', () => {
      const params: DrainageDesignParams = {
        catchmentArea: 500,
        rainfallIntensity: 80,
        runoffCoefficient: 0.6,
        timeOfConcentration: 15,
      };

      const result = calculateDrainageRequirements(params);

      const standardSizes = [100, 150, 200, 225, 300, 375, 450, 525, 600, 750, 900, 1050, 1200];
      expect(standardSizes).toContain(result.pipeSize);
    });

    it('should calculate channel dimensions for open drains', () => {
      const params: DrainageDesignParams = {
        catchmentArea: 2000,
        rainfallIntensity: 120,
        runoffCoefficient: 0.7,
        timeOfConcentration: 10,
      };

      const result = calculateDrainageRequirements(params);

      expect(result.channelWidth).toBeGreaterThan(0);
      expect(result.channelDepth).toBeGreaterThan(0);
    });

    it('should provide drainage recommendations', () => {
      const params: DrainageDesignParams = {
        catchmentArea: 5000,
        rainfallIntensity: 150,
        runoffCoefficient: 0.9,
        timeOfConcentration: 10,
      };

      const result = calculateDrainageRequirements(params);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Install sediment traps at drain inlets');
    });
  });
});

describe('Wind Load Calculations', () => {
  describe('calculateWindLoad', () => {
    it('should calculate design wind speed from climate data', () => {
      const climateData = getClimateData('tropical-island');
      const params: WindLoadParams = {
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

    it('should return higher wind pressure for taller buildings', () => {
      const climateData = getClimateData('tropical-coastal');

      const lowRiseParams: WindLoadParams = {
        climateData,
        buildingHeight: 5,
        buildingWidth: 10,
        buildingLength: 15,
        terrainCategory: 2,
        importanceLevel: 2,
        topographyFactor: 1.0,
      };

      const highRiseParams: WindLoadParams = {
        ...lowRiseParams,
        buildingHeight: 20,
      };

      const lowRiseResult = calculateWindLoad(lowRiseParams);
      const highRiseResult = calculateWindLoad(highRiseParams);

      expect(highRiseResult.designWindSpeed).toBeGreaterThan(lowRiseResult.designWindSpeed);
    });

    it('should include cyclone recommendations for high-risk areas', () => {
      const climateData = getClimateData('tropical-island');
      const params: WindLoadParams = {
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
      expect(result.recommendations).toContain('Use cyclone-rated fasteners and tie-downs');
    });

    it('should reduce wind speed in sheltered terrain', () => {
      const climateData = getClimateData('tropical-coastal');

      const openParams: WindLoadParams = {
        climateData,
        buildingHeight: 10,
        buildingWidth: 10,
        buildingLength: 15,
        terrainCategory: 1,  // Open
        importanceLevel: 2,
        topographyFactor: 1.0,
      };

      const cityParams: WindLoadParams = {
        ...openParams,
        terrainCategory: 4,  // City center
      };

      const openResult = calculateWindLoad(openParams);
      const cityResult = calculateWindLoad(cityParams);

      expect(openResult.designWindSpeed).toBeGreaterThan(cityResult.designWindSpeed);
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

    it('should provide cooling strategies for warm climates', () => {
      const coastalData = getClimateData('tropical-coastal');
      const result = analyzeThermalComfort(coastalData, 'commercial');

      expect(result.coolingStrategy.length).toBeGreaterThan(0);
    });

    it('should recommend higher opening percentage for high thermal stress', () => {
      const monsoonData = getClimateData('tropical-monsoon');
      const highlandData = getClimateData('tropical-highland');

      const monsoonResult = analyzeThermalComfort(monsoonData, 'residential');
      const highlandResult = analyzeThermalComfort(highlandData, 'residential');

      expect(monsoonResult.recommendedOpeningPercentage).toBeGreaterThan(
        highlandResult.recommendedOpeningPercentage
      );
    });

    it('should assess natural ventilation viability', () => {
      const islandData = getClimateData('tropical-island');
      const result = analyzeThermalComfort(islandData, 'residential');

      expect(typeof result.naturalVentilationViable).toBe('boolean');
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

    it('should include flood recommendations for riverine terrain', () => {
      const report = generateClimateReport(
        'Gulf',
        'riverine-floodplain',
        'residential'
      );

      expect(report.recommendations).toContain('Elevate building above flood level');
    });

    it('should avoid duplicate recommendations', () => {
      const report = generateClimateReport(
        'East Sepik',
        'swamp-wetland',
        'community'
      );

      const uniqueRecommendations = [...new Set(report.recommendations)];
      expect(report.recommendations.length).toBe(uniqueRecommendations.length);
    });

    it('should work for all provinces', () => {
      const provinces: PNGProvince[] = [
        'Central',
        'Eastern Highlands',
        'Madang',
        'Manus',
      ];

      provinces.forEach(province => {
        const report = generateClimateReport(province, 'coastal-lowland', 'residential');
        expect(report.province).toBe(province);
        expect(report.climateData).toBeDefined();
      });
    });
  });
});
