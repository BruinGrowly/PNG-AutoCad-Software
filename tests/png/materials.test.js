/**
 * PNG Materials Module Tests
 */

import { describe, it, expect } from 'vitest';
import {
  PNG_TIMBER,
  PNG_CONCRETE_MATERIALS,
  PNG_STEEL,
  PNG_MASONRY,
  ALL_MATERIALS,
  getMaterialById,
  getMaterialsByCategory,
  getMaterialsByAvailability,
  searchMaterials,
  getMaterialsForApplication,
  getTermiteResistantMaterials,
  getMarineGradeMaterials,
  estimateMaterialCost,
} from '../../src/png/materials.js';

describe('Material Database', () => {
  describe('PNG_TIMBER', () => {
    it('should contain major PNG timber species', () => {
      const timberIds = PNG_TIMBER.map(t => t.id);

      expect(timberIds).toContain('kwila');
      expect(timberIds).toContain('taun');
      expect(timberIds).toContain('rosewood-png');
      expect(timberIds).toContain('calophyllum');
      expect(timberIds).toContain('bamboo');
    });

    it('should have Kwila as highest durability', () => {
      const kwila = PNG_TIMBER.find(t => t.id === 'kwila');

      expect(kwila).toBeDefined();
      expect(kwila.durability.termiteResistance).toBe('high');
      expect(kwila.durability.lifespan).toBe(50);
      expect(kwila.properties.grade).toBe('Durability Class 1');
    });

    it('should mark bamboo as traditional material', () => {
      const bamboo = PNG_TIMBER.find(t => t.id === 'bamboo');

      expect(bamboo).toBeDefined();
      expect(bamboo.category).toBe('traditional');
      expect(bamboo.sustainability.renewable).toBe(true);
    });

    it('should require treatment for lower durability timbers', () => {
      const calophyllum = PNG_TIMBER.find(t => t.id === 'calophyllum');

      expect(calophyllum).toBeDefined();
      expect(calophyllum.durability.treatmentRequired).toBe(true);
    });

    it('should include local names for species', () => {
      const bamboo = PNG_TIMBER.find(t => t.id === 'bamboo');
      const kwila = PNG_TIMBER.find(t => t.id === 'kwila');

      expect(bamboo.localName).toBe('Mambu');
      expect(kwila.localName).toBe('Kwila');
    });
  });

  describe('PNG_CONCRETE_MATERIALS', () => {
    it('should include cement and aggregates', () => {
      const ids = PNG_CONCRETE_MATERIALS.map(m => m.id);

      expect(ids).toContain('portland-cement');
      expect(ids).toContain('river-aggregate');
      expect(ids).toContain('coral-aggregate');
    });

    it('should note coral aggregate limitations', () => {
      const coral = PNG_CONCRETE_MATERIALS.find(m => m.id === 'coral-aggregate');

      expect(coral).toBeDefined();
      expect(coral.limitations).toContain('NOT suitable for reinforced concrete');
      expect(coral.durability.corrosionResistance).toBe('low');
    });

    it('should indicate cement is imported', () => {
      const cement = PNG_CONCRETE_MATERIALS.find(m => m.id === 'portland-cement');

      expect(cement).toBeDefined();
      expect(cement.sustainability.locallySourced).toBe(false);
      expect(cement.sustainability.carbonFootprint).toBe('high');
    });
  });

  describe('PNG_STEEL', () => {
    it('should include reinforcing bar and roofing', () => {
      const ids = PNG_STEEL.map(m => m.id);

      expect(ids).toContain('reinforcing-bar');
      expect(ids).toContain('roofing-iron');
    });

    it('should specify minimum concrete cover for rebar', () => {
      const rebar = PNG_STEEL.find(m => m.id === 'reinforcing-bar');

      expect(rebar).toBeDefined();
      expect(rebar.recommendations.some(r => r.includes('50mm cover'))).toBe(true);
    });

    it('should recommend high zinc coating for roofing in PNG', () => {
      const roofing = PNG_STEEL.find(m => m.id === 'roofing-iron');

      expect(roofing).toBeDefined();
      expect(roofing.recommendations.some(r => r.includes('Z450'))).toBe(true);
    });
  });

  describe('PNG_MASONRY', () => {
    it('should include concrete blocks and clay bricks', () => {
      const ids = PNG_MASONRY.map(m => m.id);

      expect(ids).toContain('concrete-block');
      expect(ids).toContain('clay-brick');
    });

    it('should note clay brick limited availability', () => {
      const brick = PNG_MASONRY.find(m => m.id === 'clay-brick');

      expect(brick).toBeDefined();
      expect(brick.availability).toBe('limited');
      expect(brick.availableProvinces.length).toBeLessThan(22);
    });

    it('should require reinforcement for blocks in seismic zones', () => {
      const block = PNG_MASONRY.find(m => m.id === 'concrete-block');

      expect(block).toBeDefined();
      expect(block.recommendations.some(r => r.includes('reinforce'))).toBe(true);
    });
  });

  describe('ALL_MATERIALS', () => {
    it('should combine all material arrays', () => {
      const expectedCount = PNG_TIMBER.length + PNG_CONCRETE_MATERIALS.length +
        PNG_STEEL.length + PNG_MASONRY.length;

      expect(ALL_MATERIALS.length).toBe(expectedCount);
    });

    it('should have unique IDs', () => {
      const ids = ALL_MATERIALS.map(m => m.id);
      const uniqueIds = [...new Set(ids)];

      expect(ids.length).toBe(uniqueIds.length);
    });
  });
});

describe('Material Lookup Functions', () => {
  describe('getMaterialById', () => {
    it('should return material for valid ID', () => {
      const kwila = getMaterialById('kwila');

      expect(kwila).toBeDefined();
      expect(kwila.name).toBe('Kwila (Merbau)');
    });

    it('should return undefined for invalid ID', () => {
      const result = getMaterialById('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('getMaterialsByCategory', () => {
    it('should return all timber materials', () => {
      const timber = getMaterialsByCategory('timber');

      expect(timber.length).toBeGreaterThan(0);
      expect(timber.every(m => m.category === 'timber')).toBe(true);
    });

    it('should return all steel materials', () => {
      const steel = getMaterialsByCategory('steel');

      expect(steel.length).toBeGreaterThan(0);
      expect(steel.every(m => m.category === 'steel')).toBe(true);
    });

    it('should return empty array for unknown category', () => {
      const result = getMaterialsByCategory('unknown');

      expect(result).toEqual([]);
    });
  });

  describe('getMaterialsByAvailability', () => {
    it('should return all materials for NCD', () => {
      const materials = getMaterialsByAvailability('National Capital District');

      // NCD should have access to most materials
      expect(materials.length).toBeGreaterThan(5);
    });

    it('should include materials available in all provinces', () => {
      const materials = getMaterialsByAvailability('Western');
      const kwila = materials.find(m => m.id === 'kwila');

      expect(kwila).toBeDefined();
    });

    it('should filter province-specific materials', () => {
      const morobeMatls = getMaterialsByAvailability('Morobe');
      const manusMatls = getMaterialsByAvailability('Manus');

      // Both should have common materials
      expect(morobeMatls.find(m => m.id === 'portland-cement')).toBeDefined();
      expect(manusMatls.find(m => m.id === 'portland-cement')).toBeDefined();
    });
  });

  describe('searchMaterials', () => {
    it('should find materials by name', () => {
      const results = searchMaterials('kwila');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(m => m.id === 'kwila')).toBe(true);
    });

    it('should find materials by description', () => {
      const results = searchMaterials('termite');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should find materials by local name', () => {
      const results = searchMaterials('mambu');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(m => m.id === 'bamboo')).toBe(true);
    });

    it('should find materials by application', () => {
      const results = searchMaterials('flooring');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case insensitive', () => {
      const lowerResults = searchMaterials('cement');
      const upperResults = searchMaterials('CEMENT');

      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('should return empty for no matches', () => {
      const results = searchMaterials('xyznonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('getMaterialsForApplication', () => {
    it('should find materials for structural work', () => {
      const results = getMaterialsForApplication('structural');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(m => m.id === 'kwila')).toBe(true);
    });

    it('should find materials for roofing', () => {
      const results = getMaterialsForApplication('roofing');

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(m => m.id === 'roofing-iron')).toBe(true);
    });

    it('should find materials for foundation', () => {
      const results = getMaterialsForApplication('foundation');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getTermiteResistantMaterials', () => {
    it('should return materials with high termite resistance', () => {
      const results = getTermiteResistantMaterials();

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(m =>
        m.durability.termiteResistance === 'high' ||
        m.durability.termiteResistance === 'immune'
      )).toBe(true);
    });

    it('should include Kwila and steel/concrete products', () => {
      const results = getTermiteResistantMaterials();
      const ids = results.map(m => m.id);

      expect(ids).toContain('kwila');
      expect(ids).toContain('reinforcing-bar');
      expect(ids).toContain('concrete-block');
    });
  });

  describe('getMarineGradeMaterials', () => {
    it('should return materials suitable for marine environments', () => {
      const results = getMarineGradeMaterials();

      expect(results.length).toBeGreaterThan(0);
    });

    it('should include Kwila for marine use', () => {
      const results = getMarineGradeMaterials();

      expect(results.some(m => m.id === 'kwila')).toBe(true);
    });
  });
});

describe('Material Properties', () => {
  describe('Physical Properties', () => {
    it('should include density for all materials with weight', () => {
      const materialsWithDensity = ALL_MATERIALS.filter(m => m.properties.density);

      expect(materialsWithDensity.length).toBeGreaterThan(0);
      materialsWithDensity.forEach(m => {
        expect(m.properties.density).toBeGreaterThan(0);
      });
    });

    it('should include strength properties for structural materials', () => {
      const kwila = getMaterialById('kwila');

      expect(kwila.properties.compressiveStrength).toBeGreaterThan(0);
      expect(kwila.properties.tensileStrength).toBeGreaterThan(0);
      expect(kwila.properties.bendingStrength).toBeGreaterThan(0);
    });
  });

  describe('Durability Properties', () => {
    it('should include lifespan for all materials', () => {
      ALL_MATERIALS.forEach(m => {
        expect(m.durability.lifespan).toBeGreaterThan(0);
      });
    });

    it('should specify treatment requirements', () => {
      const taun = getMaterialById('taun');

      expect(taun.durability.treatmentRequired).toBe(true);
      expect(taun.durability.treatmentType).toBeDefined();
    });
  });

  describe('Sustainability Properties', () => {
    it('should mark timber as renewable', () => {
      PNG_TIMBER.forEach(t => {
        expect(t.sustainability.renewable).toBe(true);
      });
    });

    it('should mark locally sourced materials correctly', () => {
      const river = getMaterialById('river-aggregate');
      const cement = getMaterialById('portland-cement');

      expect(river.sustainability.locallySourced).toBe(true);
      expect(cement.sustainability.locallySourced).toBe(false);
    });
  });
});

describe('Material Cost Estimation', () => {
  describe('estimateMaterialCost', () => {
    it('should calculate cost for known materials', () => {
      const estimate = estimateMaterialCost('kwila', 10, 'National Capital District');

      expect(estimate).not.toBeNull();
      expect(estimate.totalCost).toBeGreaterThan(0);
      expect(estimate.unit).toBe('m³');
    });

    it('should return null for unknown materials', () => {
      const estimate = estimateMaterialCost('nonexistent', 10, 'Morobe');

      expect(estimate).toBeNull();
    });

    it('should include transport costs', () => {
      const estimate = estimateMaterialCost('portland-cement', 100, 'Enga');

      expect(estimate).not.toBeNull();
      expect(estimate.transportCost).toBeGreaterThan(0);
    });

    it('should have higher transport costs for remote provinces', () => {
      const ncdEstimate = estimateMaterialCost('portland-cement', 100, 'National Capital District');
      const westernEstimate = estimateMaterialCost('portland-cement', 100, 'Western');

      expect(westernEstimate.transportCost).toBeGreaterThan(ncdEstimate.transportCost);
    });

    it('should note limited availability', () => {
      const estimate = estimateMaterialCost('clay-brick', 1000, 'Morobe');

      expect(estimate).not.toBeNull();
      expect(estimate.notes).toContain('Limited availability');
    });

    it('should calculate correct total cost', () => {
      const estimate = estimateMaterialCost('concrete-block', 100, 'Central');

      expect(estimate).not.toBeNull();
      expect(estimate.totalCost).toBe(estimate.unitCost * estimate.quantity);
    });
  });
});

describe('Material Recommendations', () => {
  describe('Applications and Limitations', () => {
    it('should have applications for all materials', () => {
      ALL_MATERIALS.forEach(m => {
        expect(m.applications.length).toBeGreaterThan(0);
      });
    });

    it('should have limitations where appropriate', () => {
      const coral = getMaterialById('coral-aggregate');

      // Not all materials have this ID, but coral should have limitations
      if (coral) {
        expect(coral.limitations.length).toBeGreaterThan(0);
      }
    });

    it('should have recommendations for all materials', () => {
      ALL_MATERIALS.forEach(m => {
        expect(m.recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Skill Requirements', () => {
    it('should specify skill level for all materials', () => {
      ALL_MATERIALS.forEach(m => {
        expect(['basic', 'moderate', 'specialized']).toContain(m.skillRequired);
      });
    });

    it('should mark bamboo as specialized due to jointing', () => {
      const bamboo = getMaterialById('bamboo');

      expect(bamboo.skillRequired).toBe('specialized');
    });
  });
});
