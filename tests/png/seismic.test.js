/**
 * PNG Seismic Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  getSeismicZone,
  getSeismicZoneData,
  getSeismicDataForProvince,
  getSoilClassData,
  getImportanceFactor,
  getStructuralSystemData,
  getRecommendedSystems,
  calculateSeismicDesign,
  getFoundationRecommendations,
  generateSeismicReport,
} from '../../src/png/seismic.js';

describe('Seismic Zone Functions', () => {
  describe('getSeismicZone', () => {
    it('should return zone-4 for high-risk northern coastal provinces', () => {
      const zone4Provinces = [
        'Madang',
        'East Sepik',
        'Sandaun',
        'Morobe',
        'East New Britain',
        'West New Britain',
        'New Ireland',
        'Manus',
        'Autonomous Region of Bougainville',
      ];

      zone4Provinces.forEach(province => {
        expect(getSeismicZone(province)).toBe('zone-4');
      });
    });

    it('should return zone-3 for southern coastal provinces', () => {
      const zone3Provinces = [
        'Milne Bay',
        'Oro',
        'Gulf',
        'Central',
        'National Capital District',
      ];

      zone3Provinces.forEach(province => {
        expect(getSeismicZone(province)).toBe('zone-3');
      });
    });

    it('should return zone-2 for highland provinces', () => {
      const zone2Provinces = [
        'Eastern Highlands',
        'Western Highlands',
        'Southern Highlands',
        'Enga',
        'Simbu',
        'Hela',
        'Jiwaka',
      ];

      zone2Provinces.forEach(province => {
        expect(getSeismicZone(province)).toBe('zone-2');
      });
    });

    it('should return zone-1 for Western Province', () => {
      expect(getSeismicZone('Western')).toBe('zone-1');
    });
  });

  describe('getSeismicZoneData', () => {
    it('should return increasing hazard factors by zone', () => {
      const zone1 = getSeismicZoneData('zone-1');
      const zone2 = getSeismicZoneData('zone-2');
      const zone3 = getSeismicZoneData('zone-3');
      const zone4 = getSeismicZoneData('zone-4');

      expect(zone1.hazardFactor).toBeLessThan(zone2.hazardFactor);
      expect(zone2.hazardFactor).toBeLessThan(zone3.hazardFactor);
      expect(zone3.hazardFactor).toBeLessThan(zone4.hazardFactor);
    });

    it('should return correct hazard factor for zone-4', () => {
      const data = getSeismicZoneData('zone-4');
      expect(data.hazardFactor).toBe(0.5);
      expect(data.faultProximity).toBe('near-fault');
      expect(data.liquidationRisk).toBe('high');
    });

    it('should include design spectrum data', () => {
      const data = getSeismicZoneData('zone-3');

      expect(data.designSpectrum).toBeDefined();
      expect(data.designSpectrum.T0).toBeGreaterThan(0);
      expect(data.designSpectrum.T1).toBeGreaterThan(data.designSpectrum.T0);
      expect(data.designSpectrum.Sa1).toBeGreaterThan(data.designSpectrum.Sa0);
    });
  });

  describe('getSeismicDataForProvince', () => {
    it('should combine zone lookup with zone data', () => {
      const data = getSeismicDataForProvince('Madang');

      expect(data.zone).toBe('zone-4');
      expect(data.hazardFactor).toBe(0.5);
    });
  });
});

describe('Soil Classification', () => {
  describe('getSoilClassData', () => {
    it('should return correct data for rock (Class A)', () => {
      const data = getSoilClassData('A');

      expect(data.description).toBe('Strong rock');
      expect(data.siteFactor).toBe(0.8);
      expect(data.liquidationPotential).toBe('none');
    });

    it('should return increasing site factors for softer soils', () => {
      const classA = getSoilClassData('A');
      const classB = getSoilClassData('B');
      const classC = getSoilClassData('C');
      const classD = getSoilClassData('D');
      const classE = getSoilClassData('E');

      expect(classA.siteFactor).toBeLessThan(classB.siteFactor);
      expect(classB.siteFactor).toBeLessThan(classC.siteFactor);
      expect(classC.siteFactor).toBeLessThan(classD.siteFactor);
      expect(classD.siteFactor).toBeLessThan(classE.siteFactor);
    });

    it('should indicate high liquefaction potential for Class E', () => {
      const data = getSoilClassData('E');

      expect(data.liquidationPotential).toBe('high');
      expect(data.siteFactor).toBe(2.0);
    });

    it('should include shear wave velocity ranges', () => {
      const classes = ['A', 'B', 'C', 'D', 'E'];

      classes.forEach(cls => {
        const data = getSoilClassData(cls);
        expect(data.shearWaveVelocity.max).toBeGreaterThan(data.shearWaveVelocity.min);
      });
    });
  });
});

describe('Importance Categories', () => {
  describe('getImportanceFactor', () => {
    it('should return 0.9 for minor structures (Category 1)', () => {
      expect(getImportanceFactor(1)).toBe(0.9);
    });

    it('should return 1.0 for normal structures (Category 2)', () => {
      expect(getImportanceFactor(2)).toBe(1.0);
    });

    it('should return 1.3 for important structures (Category 3)', () => {
      expect(getImportanceFactor(3)).toBe(1.3);
    });

    it('should return 1.5 for essential facilities (Category 4)', () => {
      expect(getImportanceFactor(4)).toBe(1.5);
    });
  });
});

describe('Structural Systems', () => {
  describe('getStructuralSystemData', () => {
    it('should return data for timber-frame system', () => {
      const data = getStructuralSystemData('timber-frame');

      expect(data.ductilityFactor).toBe(3.0);
      expect(data.heightLimit).toBe(10);
      expect(data.suitability).toContain('zone-4');
    });

    it('should indicate unreinforced masonry not suitable for high zones', () => {
      const data = getStructuralSystemData('masonry-unreinforced');

      expect(data.suitability).toEqual(['zone-1']);
      expect(data.recommendations).toContain('NOT RECOMMENDED - use reinforced masonry');
    });

    it('should show steel frame has highest ductility', () => {
      const steelFrame = getStructuralSystemData('steel-frame');
      const timberFrame = getStructuralSystemData('timber-frame');
      const concreteFrame = getStructuralSystemData('concrete-frame');

      expect(steelFrame.ductilityFactor).toBeGreaterThan(timberFrame.ductilityFactor);
      expect(steelFrame.ductilityFactor).toBeGreaterThan(concreteFrame.ductilityFactor);
    });

    it('should include traditional construction method', () => {
      const data = getStructuralSystemData('traditional-haus-tambaran');

      expect(data.ductilityFactor).toBeGreaterThan(0);
      expect(data.suitability).toContain('zone-4');
      expect(data.recommendations).toContain('Traditional lashing provides good ductility');
    });
  });

  describe('getRecommendedSystems', () => {
    it('should recommend more systems for lower seismic zones', () => {
      const zone1Systems = getRecommendedSystems('zone-1');
      const zone4Systems = getRecommendedSystems('zone-4');

      expect(zone1Systems.length).toBeGreaterThanOrEqual(zone4Systems.length);
    });

    it('should not recommend unreinforced masonry for zone-4', () => {
      const systems = getRecommendedSystems('zone-4');

      expect(systems).not.toContain('masonry-unreinforced');
    });

    it('should recommend timber-frame for all zones', () => {
      const zones = ['zone-1', 'zone-2', 'zone-3', 'zone-4'];

      zones.forEach(zone => {
        const systems = getRecommendedSystems(zone);
        expect(systems).toContain('timber-frame');
      });
    });
  });
});

describe('Seismic Design Calculations', () => {
  describe('calculateSeismicDesign', () => {
    const baseInput = {
      province: 'Madang',
      soilClass: 'C',
      importanceCategory: 2,
      structuralSystem: 'timber-frame',
      buildingHeight: 6,
      buildingWeight: 500,
      numberOfStoreys: 2,
    };

    it('should calculate design base shear', () => {
      const result = calculateSeismicDesign(baseInput);

      expect(result.designBaseShear).toBeGreaterThan(0);
      expect(result.designBaseShearCoefficient).toBeGreaterThan(0);
    });

    it('should return correct seismic zone', () => {
      const result = calculateSeismicDesign(baseInput);

      expect(result.seismicZone).toBe('zone-4');
      expect(result.hazardFactor).toBe(0.5);
    });

    it('should estimate building period if not provided', () => {
      const result = calculateSeismicDesign(baseInput);

      expect(result.buildingPeriod).toBeGreaterThan(0);
    });

    it('should use provided building period', () => {
      const inputWithPeriod = { ...baseInput, buildingPeriod: 0.5 };
      const result = calculateSeismicDesign(inputWithPeriod);

      expect(result.buildingPeriod).toBe(0.5);
    });

    it('should calculate lateral force distribution', () => {
      const result = calculateSeismicDesign(baseInput);

      expect(result.lateralForceDistribution.length).toBe(baseInput.numberOfStoreys);

      // Higher forces at upper storeys
      const forces = result.lateralForceDistribution.map(d => d.force);
      for (let i = 1; i < forces.length; i++) {
        expect(forces[i]).toBeGreaterThan(forces[i - 1]);
      }
    });

    it('should warn if building exceeds height limit', () => {
      const tallInput = {
        ...baseInput,
        buildingHeight: 15,  // Exceeds 10m limit for timber
        numberOfStoreys: 5,
      };

      const result = calculateSeismicDesign(tallInput);

      expect(result.warnings.some(w => w.includes('exceeds recommended limit'))).toBe(true);
    });

    it('should warn if system not suitable for zone', () => {
      const unsuitableInput = {
        ...baseInput,
        structuralSystem: 'masonry-unreinforced',
      };

      const result = calculateSeismicDesign(unsuitableInput);

      expect(result.warnings.some(w => w.includes('NOT recommended'))).toBe(true);
    });

    it('should recommend ground improvement for soft soils', () => {
      const softSoilInput = {
        ...baseInput,
        soilClass: 'E',
      };

      const result = calculateSeismicDesign(softSoilInput);

      expect(result.warnings.some(w => w.includes('liquefaction'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('geotechnical'))).toBe(true);
    });

    it('should include seismic isolation recommendation for zone-4', () => {
      const result = calculateSeismicDesign(baseInput);

      expect(result.recommendations.some(r => r.includes('seismic isolation') || r.includes('structural engineer'))).toBe(true);
    });
  });
});

describe('Foundation Recommendations', () => {
  describe('getFoundationRecommendations', () => {
    it('should recommend traditional posts for lightweight buildings', () => {
      const recommendations = getFoundationRecommendations('zone-2', 'C', 300, 1);

      expect(recommendations.some(r => r.type === 'traditional-post')).toBe(true);
    });

    it('should recommend piles for very soft soils', () => {
      const recommendations = getFoundationRecommendations('zone-3', 'E', 1000, 2);

      expect(recommendations.some(r => r.type === 'piles')).toBe(true);
    });

    it('should recommend raft for poor soils', () => {
      const recommendations = getFoundationRecommendations('zone-2', 'D', 800, 3);

      expect(recommendations.some(r => r.type === 'raft')).toBe(true);
    });

    it('should require tie beams in zone-4 for pad footings', () => {
      const recommendations = getFoundationRecommendations('zone-4', 'C', 600, 2);
      const padFooting = recommendations.find(r => r.type === 'pad-footing');

      if (padFooting) {
        expect(padFooting.considerations.some(c => c.includes('tie beams'))).toBe(true);
      }
    });

    it('should include considerations for each foundation type', () => {
      const recommendations = getFoundationRecommendations('zone-3', 'C', 800, 2);

      recommendations.forEach(rec => {
        expect(rec.considerations.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Seismic Report Generation', () => {
  describe('generateSeismicReport', () => {
    const input = {
      province: 'East New Britain',
      soilClass: 'C',
      importanceCategory: 3,
      structuralSystem: 'concrete-frame',
      buildingHeight: 12,
      buildingWeight: 2000,
      numberOfStoreys: 4,
    };

    it('should generate complete seismic report', () => {
      const report = generateSeismicReport(input);

      expect(report.location).toBe('East New Britain');
      expect(report.seismicData).toBeDefined();
      expect(report.designResults).toBeDefined();
      expect(report.foundationRecommendations.length).toBeGreaterThan(0);
      expect(report.detailingRequirements.length).toBeGreaterThan(0);
      expect(report.referenceStandards.length).toBeGreaterThan(0);
    });

    it('should include ductile detailing for high zones', () => {
      const report = generateSeismicReport(input);

      expect(report.detailingRequirements.some(r => r.includes('Ductile detailing'))).toBe(true);
    });

    it('should reference PNG and Australian/NZ standards', () => {
      const report = generateSeismicReport(input);

      expect(report.referenceStandards).toContain('PNG Building Board Requirements');
      expect(report.referenceStandards.some(s => s.includes('AS/NZS'))).toBe(true);
    });

    it('should work for all importance categories', () => {
      const categories = [1, 2, 3, 4];

      categories.forEach(cat => {
        const modifiedInput = { ...input, importanceCategory: cat };
        const report = generateSeismicReport(modifiedInput);
        expect(report.designResults.importanceFactor).toBeDefined();
      });
    });
  });
});
