/**
 * PNG Flood Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getFloodZoneData,
  getTerrainFloodRisk,
  getRiverSystemsForProvince,
  estimateFloodLevels,
  designForFloodZone,
  generateFloodReport,
  PNG_RIVER_SYSTEMS,
  TRADITIONAL_FLOOD_HOUSING,
} from '../../src/png/flood.js';

describe('Flood Zone Data', () => {
  describe('getFloodZoneData', () => {
    it('should return correct data for minimal flood zone', () => {
      const data = getFloodZoneData('minimal');

      expect(data.zone).toBe('minimal');
      expect(data.returnPeriod).toBe(500);
      expect(data.minimumFloorElevation).toBe(0.3);
      expect(data.insuranceCategory).toBe('standard');
    });

    it('should return higher floor elevation for higher risk zones', () => {
      const minimal = getFloodZoneData('minimal');
      const moderate = getFloodZoneData('moderate');
      const high = getFloodZoneData('high');
      const veryHigh = getFloodZoneData('very-high');

      expect(minimal.minimumFloorElevation).toBeLessThan(moderate.minimumFloorElevation);
      expect(moderate.minimumFloorElevation).toBeLessThan(high.minimumFloorElevation);
      expect(high.minimumFloorElevation).toBeLessThan(veryHigh.minimumFloorElevation);
    });

    it('should include construction restrictions for high-risk zones', () => {
      const minimal = getFloodZoneData('minimal');
      const veryHigh = getFloodZoneData('very-high');

      expect(minimal.constructionRestrictions.length).toBe(0);
      expect(veryHigh.constructionRestrictions.length).toBeGreaterThan(0);
    });

    it('should restrict insurance for high-risk zones', () => {
      const high = getFloodZoneData('high');
      const veryHigh = getFloodZoneData('very-high');

      expect(high.insuranceCategory).toBe('restricted');
      expect(veryHigh.insuranceCategory).toBe('restricted');
    });

    it('should have shorter return periods for higher risk zones', () => {
      const zones = ['minimal', 'moderate', 'high', 'very-high'];
      const returnPeriods = zones.map(z => getFloodZoneData(z).returnPeriod);

      for (let i = 1; i < returnPeriods.length; i++) {
        expect(returnPeriods[i]).toBeLessThan(returnPeriods[i - 1]);
      }
    });
  });

  describe('getTerrainFloodRisk', () => {
    it('should return minimal risk for mountainous terrain', () => {
      expect(getTerrainFloodRisk('mountainous')).toBe('minimal');
    });

    it('should return very-high risk for floodplains', () => {
      expect(getTerrainFloodRisk('riverine-floodplain')).toBe('very-high');
    });

    it('should return very-high risk for swamp/wetland', () => {
      expect(getTerrainFloodRisk('swamp-wetland')).toBe('very-high');
    });

    it('should return moderate risk for coastal lowland', () => {
      expect(getTerrainFloodRisk('coastal-lowland')).toBe('moderate');
    });

    it('should return moderate risk for highland valley', () => {
      expect(getTerrainFloodRisk('highland-valley')).toBe('moderate');
    });
  });
});

describe('River Systems Database', () => {
  describe('PNG_RIVER_SYSTEMS', () => {
    it('should include major PNG rivers', () => {
      const riverNames = PNG_RIVER_SYSTEMS.map(r => r.name);

      expect(riverNames).toContain('Sepik River');
      expect(riverNames).toContain('Fly River');
      expect(riverNames).toContain('Markham River');
      expect(riverNames).toContain('Ramu River');
      expect(riverNames).toContain('Purari River');
    });

    it('should have Fly River as highest discharge', () => {
      const flyRiver = PNG_RIVER_SYSTEMS.find(r => r.name === 'Fly River');
      const otherRivers = PNG_RIVER_SYSTEMS.filter(r => r.name !== 'Fly River');

      expect(flyRiver).toBeDefined();
      otherRivers.forEach(r => {
        expect(flyRiver.averageDischarge).toBeGreaterThanOrEqual(r.averageDischarge);
      });
    });

    it('should have Sepik as longest river', () => {
      const sepikRiver = PNG_RIVER_SYSTEMS.find(r => r.name === 'Sepik River');

      expect(sepikRiver).toBeDefined();
      expect(sepikRiver.length).toBe(1126);
    });

    it('should include flood season months', () => {
      PNG_RIVER_SYSTEMS.forEach(river => {
        expect(river.floodSeason.length).toBeGreaterThan(0);
        expect(river.floodSeason.every(m => m >= 1 && m <= 12)).toBe(true);
      });
    });

    it('should list provinces for each river', () => {
      PNG_RIVER_SYSTEMS.forEach(river => {
        expect(river.provinces.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getRiverSystemsForProvince', () => {
    it('should return Sepik River for East Sepik', () => {
      const rivers = getRiverSystemsForProvince('East Sepik');

      expect(rivers.some(r => r.name === 'Sepik River')).toBe(true);
    });

    it('should return Fly River for Western Province', () => {
      const rivers = getRiverSystemsForProvince('Western');

      expect(rivers.some(r => r.name === 'Fly River')).toBe(true);
    });

    it('should return Markham River for Morobe', () => {
      const rivers = getRiverSystemsForProvince('Morobe');

      expect(rivers.some(r => r.name === 'Markham River')).toBe(true);
    });

    it('should return empty for provinces without major rivers', () => {
      const rivers = getRiverSystemsForProvince('Manus');

      expect(rivers.length).toBe(0);
    });

    it('should return multiple rivers for Gulf Province', () => {
      const rivers = getRiverSystemsForProvince('Gulf');

      expect(rivers.length).toBeGreaterThan(1);
    });
  });
});

describe('Flood Level Estimation', () => {
  describe('estimateFloodLevels', () => {
    it('should return estimates for standard return periods', () => {
      const estimates = estimateFloodLevels('riverine-floodplain', 100, 50, false);
      const periods = estimates.map(e => e.returnPeriod);

      expect(periods).toContain(10);
      expect(periods).toContain(50);
      expect(periods).toContain(100);
      expect(periods).toContain(500);
    });

    it('should return higher levels for longer return periods', () => {
      const estimates = estimateFloodLevels('coastal-lowland', 50, 20, true);

      for (let i = 1; i < estimates.length; i++) {
        expect(estimates[i].floodLevel).toBeGreaterThan(estimates[i - 1].floodLevel);
      }
    });

    it('should return higher levels for floodplain terrain', () => {
      const floodplainEst = estimateFloodLevels('riverine-floodplain', 50, 30, false);
      const mountainEst = estimateFloodLevels('mountainous', 50, 30, false);

      expect(floodplainEst[0].floodLevel).toBeGreaterThan(mountainEst[0].floodLevel);
    });

    it('should decrease flood levels with distance from water', () => {
      const nearEst = estimateFloodLevels('coastal-lowland', 10, 20, false);
      const farEst = estimateFloodLevels('coastal-lowland', 400, 20, false);

      expect(nearEst[0].floodLevel).toBeGreaterThan(farEst[0].floodLevel);
    });

    it('should estimate higher velocity in steep terrain', () => {
      const mountainEst = estimateFloodLevels('mountainous', 50, 500, false);
      const swampEst = estimateFloodLevels('swamp-wetland', 50, 10, false);

      expect(mountainEst[0].velocity).toBeGreaterThan(swampEst[0].velocity);
    });

    it('should estimate longer duration in floodplains', () => {
      const floodplainEst = estimateFloodLevels('riverine-floodplain', 50, 10, false);
      const mountainEst = estimateFloodLevels('mountainous', 50, 500, false);

      expect(floodplainEst[0].duration).toBeGreaterThan(mountainEst[0].duration);
    });

    it('should include recommendations for elevated construction', () => {
      const estimates = estimateFloodLevels('riverine-floodplain', 50, 10, false);
      const highReturnPeriod = estimates.find(e => e.returnPeriod === 100);

      expect(highReturnPeriod.recommendations.some(r => r.includes('Elevated'))).toBe(true);
    });

    it('should include coastal-specific recommendations', () => {
      const estimates = estimateFloodLevels('coastal-lowland', 50, 5, true);

      expect(estimates[0].recommendations.some(r => r.includes('storm surge'))).toBe(true);
    });

    it('should assess debris risk based on velocity', () => {
      const estimates = estimateFloodLevels('mountainous', 50, 50, false);

      expect(['low', 'moderate', 'high']).toContain(estimates[0].debrisRisk);
    });
  });
});

describe('Flood-Resistant Design', () => {
  describe('designForFloodZone', () => {
    it('should recommend pile foundation for very-high flood zone', () => {
      const design = designForFloodZone('very-high', 'residential', 2.0);

      expect(design.foundationType).toBe('piles');
    });

    it('should recommend elevated slab for minimal flood zone', () => {
      const design = designForFloodZone('minimal', 'commercial', 0.3);

      expect(design.foundationType).toBe('elevated-slab');
    });

    it('should add freeboard to minimum floor height', () => {
      const design = designForFloodZone('moderate', 'residential', 1.0);

      expect(design.minimumFloorHeight).toBeGreaterThanOrEqual(1.3);  // 1.0 + 0.3 freeboard
    });

    it('should require flood openings for non-minimal zones', () => {
      const minimalDesign = designForFloodZone('minimal', 'residential', 0.3);
      const moderateDesign = designForFloodZone('moderate', 'residential', 0.8);

      expect(minimalDesign.floodOpenings).toBe(false);
      expect(moderateDesign.floodOpenings).toBe(true);
    });

    it('should specify flood vents for enclosed foundations', () => {
      const design = designForFloodZone('moderate', 'commercial', 0.8);

      if (design.foundationType !== 'piles') {
        expect(design.floodVents).not.toBeNull();
        expect(design.floodVents.quantity).toBeGreaterThan(0);
      }
    });

    it('should include flood-resistant materials', () => {
      const design = designForFloodZone('high', 'residential', 1.5);

      expect(design.materials.length).toBeGreaterThan(0);
      expect(design.materials.some(m => m.includes('treated timber'))).toBe(true);
    });

    it('should specify service locations above flood level', () => {
      const design = designForFloodZone('high', 'commercial', 1.5);

      expect(design.serviceLocations.length).toBeGreaterThan(0);
      expect(design.serviceLocations.some(s => s.includes('Electrical'))).toBe(true);
    });

    it('should require stairs for elevated floors', () => {
      const design = designForFloodZone('high', 'residential', 1.5);

      expect(design.accessRequirements.some(a => a.includes('Stairs'))).toBe(true);
    });

    it('should require boat access for very-high zones', () => {
      const design = designForFloodZone('very-high', 'residential', 2.0);

      expect(design.accessRequirements.some(a => a.includes('Boat') || a.includes('Alternative access'))).toBe(true);
    });

    it('should include emergency features for high-risk zones', () => {
      const design = designForFloodZone('very-high', 'community', 2.5);

      expect(design.emergencyFeatures.length).toBeGreaterThan(0);
      expect(design.emergencyFeatures.some(f => f.includes('Evacuation'))).toBe(true);
    });
  });
});

describe('Traditional Flood Housing', () => {
  describe('TRADITIONAL_FLOOD_HOUSING', () => {
    it('should include Haus Win (stilt house)', () => {
      const hausWin = TRADITIONAL_FLOOD_HOUSING.find(h => h.type.includes('Haus Win'));

      expect(hausWin).toBeDefined();
      expect(hausWin.keyFeatures.some(f => f.includes('Raised floor'))).toBe(true);
    });

    it('should include floating house design', () => {
      const floating = TRADITIONAL_FLOOD_HOUSING.find(h => h.type.includes('Floating'));

      expect(floating).toBeDefined();
      expect(floating.regions.some(r => r.includes('Sepik'))).toBe(true);
    });

    it('should include swamp house design', () => {
      const swamp = TRADITIONAL_FLOOD_HOUSING.find(h => h.type.includes('Warawara'));

      expect(swamp).toBeDefined();
      expect(swamp.keyFeatures.some(f => f.includes('Very high'))).toBe(true);
    });

    it('should describe modern integration options', () => {
      TRADITIONAL_FLOOD_HOUSING.forEach(housing => {
        expect(housing.modernIntegration.length).toBeGreaterThan(0);
      });
    });

    it('should list regions for each housing type', () => {
      TRADITIONAL_FLOOD_HOUSING.forEach(housing => {
        expect(housing.regions.length).toBeGreaterThan(0);
      });
    });

    it('should describe key features and adaptations', () => {
      TRADITIONAL_FLOOD_HOUSING.forEach(housing => {
        expect(housing.keyFeatures.length).toBeGreaterThan(0);
        expect(housing.adaptations.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Flood Report Generation', () => {
  describe('generateFloodReport', () => {
    it('should generate complete flood report', () => {
      const report = generateFloodReport(
        'East Sepik',
        'riverine-floodplain',
        50,
        15,
        'residential',
        false
      );

      expect(report.location).toBe('East Sepik');
      expect(report.terrainType).toBe('riverine-floodplain');
      expect(report.floodZone).toBe('very-high');
      expect(report.zoneData).toBeDefined();
      expect(report.nearbyRivers.length).toBeGreaterThan(0);
      expect(report.floodEstimates.length).toBeGreaterThan(0);
      expect(report.designRequirements).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should include nearby river information', () => {
      const report = generateFloodReport(
        'Morobe',
        'riverine-floodplain',
        100,
        20,
        'commercial',
        false
      );

      expect(report.nearbyRivers.some(r => r.name === 'Markham River')).toBe(true);
      expect(report.recommendations.some(r => r.includes('Markham'))).toBe(true);
    });

    it('should include flood season information', () => {
      const report = generateFloodReport(
        'Gulf',
        'riverine-floodplain',
        50,
        10,
        'residential',
        false
      );

      expect(report.recommendations.some(r => r.includes('flood season'))).toBe(true);
    });

    it('should recommend traditional design for very-high zones', () => {
      const report = generateFloodReport(
        'Western',
        'swamp-wetland',
        20,
        5,
        'residential',
        false
      );

      expect(report.recommendations.some(r => r.includes('traditional') || r.includes('stilt'))).toBe(true);
    });

    it('should include coastal considerations', () => {
      const report = generateFloodReport(
        'Milne Bay',
        'coastal-lowland',
        100,
        10,
        'community',
        true
      );

      expect(report.recommendations.some(r => r.includes('tidal') || r.includes('storm surge'))).toBe(true);
    });

    it('should include design floor level in recommendations', () => {
      const report = generateFloodReport(
        'Central',
        'coastal-lowland',
        80,
        25,
        'residential',
        false
      );

      expect(report.recommendations.some(r => r.includes('floor level'))).toBe(true);
    });

    it('should include traditional approaches for flood-prone terrain', () => {
      const floodplainReport = generateFloodReport(
        'East Sepik',
        'riverine-floodplain',
        30,
        10,
        'residential',
        false
      );

      const mountainReport = generateFloodReport(
        'Eastern Highlands',
        'mountainous',
        100,
        1000,
        'residential',
        false
      );

      expect(floodplainReport.traditionalApproaches.length).toBeGreaterThan(
        mountainReport.traditionalApproaches.length
      );
    });

    it('should work for all building types', () => {
      const buildingTypes = [
        'residential',
        'commercial',
        'community',
        'industrial',
      ];

      buildingTypes.forEach(type => {
        const report = generateFloodReport('Central', 'coastal-lowland', 50, 20, type, false);
        expect(report.designRequirements).toBeDefined();
      });
    });
  });
});
