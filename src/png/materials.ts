/**
 * PNG Materials Database
 * Comprehensive database of construction materials available in Papua New Guinea
 */

// ============================================
// Material Type Definitions
// ============================================

export type MaterialCategory =
  | 'timber'
  | 'concrete'
  | 'steel'
  | 'masonry'
  | 'roofing'
  | 'aggregate'
  | 'soil'
  | 'traditional'
  | 'imported';

export type AvailabilityLevel =
  | 'abundant'      // Locally available, low cost
  | 'moderate'      // Available but may need transport
  | 'limited'       // Available in major centers only
  | 'import-only';  // Must be imported

export interface Material {
  id: string;
  name: string;
  localName?: string;
  category: MaterialCategory;
  description: string;
  availability: AvailabilityLevel;
  availableProvinces: string[];  // 'all' or specific provinces

  properties: MaterialProperties;
  durability: DurabilityProperties;
  sustainability: SustainabilityProperties;

  costIndicator: 1 | 2 | 3 | 4 | 5;  // 1=cheapest, 5=most expensive
  skillRequired: 'basic' | 'moderate' | 'specialized';

  applications: string[];
  limitations: string[];
  recommendations: string[];
}

export interface MaterialProperties {
  density?: number;           // kg/m³
  compressiveStrength?: number;  // MPa
  tensileStrength?: number;   // MPa
  bendingStrength?: number;   // MPa
  elasticModulus?: number;    // GPa
  thermalConductivity?: number; // W/m·K
  moistureContent?: number;   // %
  grainType?: string;         // For timber
  grade?: string;             // Standard grade designation
}

export interface DurabilityProperties {
  lifespan: number;           // years (expected)
  termiteResistance: 'none' | 'low' | 'moderate' | 'high' | 'immune';
  rotResistance: 'none' | 'low' | 'moderate' | 'high';
  corrosionResistance: 'none' | 'low' | 'moderate' | 'high';
  weatherResistance: 'poor' | 'fair' | 'good' | 'excellent';
  maintenanceFrequency: 'annual' | 'biannual' | '5-year' | '10-year' | 'minimal';
  treatmentRequired: boolean;
  treatmentType?: string;
}

export interface SustainabilityProperties {
  renewable: boolean;
  locallySourced: boolean;
  embodiedEnergy: 'low' | 'medium' | 'high';
  recyclable: boolean;
  carbonFootprint: 'low' | 'medium' | 'high';
  environmentalImpact: string;
}

// ============================================
// PNG Timber Species Database
// ============================================

export const PNG_TIMBER: Material[] = [
  {
    id: 'kwila',
    name: 'Kwila (Merbau)',
    localName: 'Kwila',
    category: 'timber',
    description: 'Premium hardwood, highly durable, natural termite resistance. PNG\'s most valued timber for construction.',
    availability: 'moderate',
    availableProvinces: ['all'],

    properties: {
      density: 830,
      compressiveStrength: 70,
      tensileStrength: 120,
      bendingStrength: 130,
      elasticModulus: 18,
      grainType: 'Interlocked',
      grade: 'Durability Class 1',
    },
    durability: {
      lifespan: 50,
      termiteResistance: 'high',
      rotResistance: 'high',
      corrosionResistance: 'moderate',
      weatherResistance: 'excellent',
      maintenanceFrequency: '10-year',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: true,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Sustainable if from certified sources. Slow growing - ensure FSC certification.',
    },

    costIndicator: 4,
    skillRequired: 'moderate',

    applications: [
      'Structural framing',
      'Flooring',
      'Decking',
      'Marine construction',
      'External cladding',
      'Posts and poles',
    ],
    limitations: [
      'Heavy - difficult to handle',
      'Blunts tools quickly',
      'Tannin can stain concrete',
    ],
    recommendations: [
      'Pre-drill for fasteners',
      'Use stainless steel fixings',
      'Allow for tannin runoff during construction',
    ],
  },

  {
    id: 'rosewood-png',
    name: 'PNG Rosewood',
    localName: 'Diwai Retpela',
    category: 'timber',
    description: 'High-quality hardwood with attractive grain, good durability.',
    availability: 'moderate',
    availableProvinces: ['all'],

    properties: {
      density: 750,
      compressiveStrength: 55,
      tensileStrength: 95,
      bendingStrength: 100,
      elasticModulus: 14,
      grainType: 'Straight to interlocked',
      grade: 'Durability Class 2',
    },
    durability: {
      lifespan: 35,
      termiteResistance: 'moderate',
      rotResistance: 'moderate',
      corrosionResistance: 'moderate',
      weatherResistance: 'good',
      maintenanceFrequency: '5-year',
      treatmentRequired: true,
      treatmentType: 'CCA or equivalent for ground contact',
    },
    sustainability: {
      renewable: true,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Generally sustainable, check harvesting permits',
    },

    costIndicator: 3,
    skillRequired: 'moderate',

    applications: [
      'Internal framing',
      'Flooring',
      'Joinery',
      'Furniture',
      'Decorative work',
    ],
    limitations: [
      'Requires treatment for external use',
      'Less durable than Kwila',
    ],
    recommendations: [
      'Treat before ground contact use',
      'Apply protective coating for external use',
    ],
  },

  {
    id: 'taun',
    name: 'Taun',
    localName: 'Taun',
    category: 'timber',
    description: 'Durable hardwood commonly used in PNG construction. Good all-round timber.',
    availability: 'abundant',
    availableProvinces: ['all'],

    properties: {
      density: 720,
      compressiveStrength: 50,
      tensileStrength: 85,
      bendingStrength: 95,
      elasticModulus: 13,
      grainType: 'Straight',
      grade: 'Durability Class 2',
    },
    durability: {
      lifespan: 30,
      termiteResistance: 'moderate',
      rotResistance: 'moderate',
      corrosionResistance: 'low',
      weatherResistance: 'good',
      maintenanceFrequency: '5-year',
      treatmentRequired: true,
      treatmentType: 'CCA treatment recommended',
    },
    sustainability: {
      renewable: true,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Sustainable, commonly available',
    },

    costIndicator: 2,
    skillRequired: 'basic',

    applications: [
      'General construction',
      'House framing',
      'Fencing',
      'Formwork',
      'Light structural work',
    ],
    limitations: [
      'Needs treatment for durability',
      'Not suitable for marine use',
    ],
    recommendations: [
      'Always treat before external use',
      'Protect end grain',
    ],
  },

  {
    id: 'calophyllum',
    name: 'Calophyllum',
    localName: 'Calophyllum',
    category: 'timber',
    description: 'Versatile medium-density hardwood, good workability.',
    availability: 'abundant',
    availableProvinces: ['all'],

    properties: {
      density: 580,
      compressiveStrength: 40,
      tensileStrength: 70,
      bendingStrength: 80,
      elasticModulus: 11,
      grainType: 'Interlocked',
      grade: 'Durability Class 3',
    },
    durability: {
      lifespan: 20,
      termiteResistance: 'low',
      rotResistance: 'low',
      corrosionResistance: 'low',
      weatherResistance: 'fair',
      maintenanceFrequency: 'biannual',
      treatmentRequired: true,
      treatmentType: 'Essential for any external use',
    },
    sustainability: {
      renewable: true,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Abundant, sustainable harvesting possible',
    },

    costIndicator: 1,
    skillRequired: 'basic',

    applications: [
      'Internal construction',
      'Formwork',
      'Temporary structures',
      'Furniture',
      'Plywood manufacture',
    ],
    limitations: [
      'Low natural durability',
      'Must be treated for any weather exposure',
    ],
    recommendations: [
      'Use only for internal or treated applications',
      'Regular maintenance required',
    ],
  },

  {
    id: 'bamboo',
    name: 'Bamboo',
    localName: 'Mambu',
    category: 'traditional',
    description: 'Fast-growing, sustainable, traditional building material. Excellent strength-to-weight ratio.',
    availability: 'abundant',
    availableProvinces: ['all'],

    properties: {
      density: 600,
      compressiveStrength: 45,
      tensileStrength: 200,
      bendingStrength: 100,
      elasticModulus: 15,
      grainType: 'Fibrous',
    },
    durability: {
      lifespan: 15,
      termiteResistance: 'low',
      rotResistance: 'low',
      corrosionResistance: 'high',
      weatherResistance: 'fair',
      maintenanceFrequency: 'annual',
      treatmentRequired: true,
      treatmentType: 'Borax treatment essential',
    },
    sustainability: {
      renewable: true,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Highly sustainable - rapid growth, no replanting needed',
    },

    costIndicator: 1,
    skillRequired: 'specialized',

    applications: [
      'Traditional houses',
      'Scaffolding',
      'Temporary structures',
      'Fencing',
      'Reinforcement',
      'Furniture',
    ],
    limitations: [
      'Requires specialized jointing',
      'Susceptible to insects without treatment',
      'Fire hazard if not treated',
    ],
    recommendations: [
      'Harvest at correct maturity (3-5 years)',
      'Treat with borax solution',
      'Protect from direct ground contact',
      'Traditional jointing methods preferred',
    ],
  },
];

// ============================================
// Concrete and Aggregates
// ============================================

export const PNG_CONCRETE_MATERIALS: Material[] = [
  {
    id: 'portland-cement',
    name: 'Portland Cement',
    category: 'concrete',
    description: 'Standard Portland cement, mostly imported. Main binding material for concrete.',
    availability: 'moderate',
    availableProvinces: ['all'],

    properties: {
      density: 1440,
      compressiveStrength: 42.5,  // MPa at 28 days (Grade 42.5)
      grade: 'Type GP',
    },
    durability: {
      lifespan: 100,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'moderate',
      weatherResistance: 'good',
      maintenanceFrequency: 'minimal',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: false,
      embodiedEnergy: 'high',
      recyclable: false,
      carbonFootprint: 'high',
      environmentalImpact: 'High CO2 in production. Consider supplementary materials.',
    },

    costIndicator: 3,
    skillRequired: 'moderate',

    applications: [
      'Structural concrete',
      'Foundations',
      'Slabs',
      'Columns and beams',
    ],
    limitations: [
      'Imported - supply chain issues possible',
      'Price fluctuations',
      'Storage sensitive to moisture',
    ],
    recommendations: [
      'Store in dry conditions',
      'Use within 3 months of manufacture',
      'Consider blended cements for durability',
    ],
  },

  {
    id: 'river-aggregate',
    name: 'River Aggregate',
    category: 'aggregate',
    description: 'Locally sourced river gravel and sand. Main aggregate source in PNG.',
    availability: 'abundant',
    availableProvinces: ['all'],

    properties: {
      density: 2400,
      grade: 'Variable - test required',
    },
    durability: {
      lifespan: 100,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'high',
      weatherResistance: 'excellent',
      maintenanceFrequency: 'minimal',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Extraction can affect river ecosystems. Ensure permits.',
    },

    costIndicator: 1,
    skillRequired: 'basic',

    applications: [
      'Concrete production',
      'Road base',
      'Drainage',
      'Landscaping',
    ],
    limitations: [
      'Quality varies by source',
      'May contain organic matter',
      'Transport costs in remote areas',
    ],
    recommendations: [
      'Always test for silt content',
      'Wash if silt content > 3%',
      'Test for reactive aggregite (alkali-silica reaction)',
    ],
  },

  {
    id: 'coral-aggregate',
    name: 'Coral Aggregate',
    localName: 'Koral',
    category: 'aggregate',
    description: 'Dead coral used in coastal areas where river aggregate unavailable. Traditional in island communities.',
    availability: 'moderate',
    availableProvinces: ['Manus', 'Milne Bay', 'East New Britain', 'West New Britain', 'New Ireland', 'Autonomous Region of Bougainville'],

    properties: {
      density: 1800,
      compressiveStrength: 15,
      grade: 'Non-structural only',
    },
    durability: {
      lifespan: 30,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'low',  // Can accelerate steel corrosion
      weatherResistance: 'fair',
      maintenanceFrequency: '5-year',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: true,
      embodiedEnergy: 'low',
      recyclable: true,
      carbonFootprint: 'low',
      environmentalImpact: 'Only use dead coral. Live coral harvesting prohibited.',
    },

    costIndicator: 1,
    skillRequired: 'basic',

    applications: [
      'Non-structural concrete',
      'Road base',
      'Drainage fill',
      'Landscaping',
    ],
    limitations: [
      'NOT suitable for reinforced concrete',
      'High chloride content',
      'Lower strength than river aggregate',
      'Accelerates steel corrosion',
    ],
    recommendations: [
      'Never use for structural concrete',
      'Never use with steel reinforcement',
      'Adequate for footpaths, non-structural slabs',
      'Use lime mortar, not cement, traditionally',
    ],
  },
];

// ============================================
// Steel Products
// ============================================

export const PNG_STEEL: Material[] = [
  {
    id: 'reinforcing-bar',
    name: 'Reinforcing Steel Bar (Rebar)',
    category: 'steel',
    description: 'Deformed steel bar for concrete reinforcement. Imported from Australia/Asia.',
    availability: 'moderate',
    availableProvinces: ['all'],

    properties: {
      density: 7850,
      tensileStrength: 500,  // N500 grade
      elasticModulus: 200,
      grade: 'N500',
    },
    durability: {
      lifespan: 75,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'low',
      weatherResistance: 'poor',
      maintenanceFrequency: 'minimal',
      treatmentRequired: true,
      treatmentType: 'Concrete cover protection',
    },
    sustainability: {
      renewable: false,
      locallySourced: false,
      embodiedEnergy: 'high',
      recyclable: true,
      carbonFootprint: 'high',
      environmentalImpact: 'High production energy but highly recyclable',
    },

    costIndicator: 3,
    skillRequired: 'specialized',

    applications: [
      'Concrete reinforcement',
      'Foundations',
      'Structural elements',
    ],
    limitations: [
      'Corrosion risk in PNG climate',
      'Supply chain dependent on imports',
      'Storage requires protection',
    ],
    recommendations: [
      'Minimum 50mm cover in PNG climate',
      '75mm cover in coastal areas',
      'Store under cover',
      'Use epoxy-coated rebar in marine environments',
    ],
  },

  {
    id: 'roofing-iron',
    name: 'Corrugated Roofing Iron',
    localName: 'Kapa',
    category: 'roofing',
    description: 'Galvanized corrugated steel roofing. Most common roofing material in PNG.',
    availability: 'abundant',
    availableProvinces: ['all'],

    properties: {
      density: 7850,
      grade: 'G550 Z450 (recommended for PNG)',
    },
    durability: {
      lifespan: 25,  // Higher zinc coating recommended
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'moderate',
      weatherResistance: 'good',
      maintenanceFrequency: '5-year',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: false,
      embodiedEnergy: 'high',
      recyclable: true,
      carbonFootprint: 'high',
      environmentalImpact: 'Long-lasting if maintained, recyclable',
    },

    costIndicator: 2,
    skillRequired: 'basic',

    applications: [
      'Roofing',
      'Wall cladding',
      'Fencing',
      'Temporary structures',
    ],
    limitations: [
      'Noise in heavy rain',
      'Heat conduction',
      'Condensation issues',
    ],
    recommendations: [
      'Use minimum Z450 coating for PNG',
      'Paint underside to reduce condensation',
      'Install with adequate ventilation',
      'Use anti-condensation foam if possible',
      'Minimum 15-degree pitch for PNG rainfall',
    ],
  },
];

// ============================================
// Masonry Materials
// ============================================

export const PNG_MASONRY: Material[] = [
  {
    id: 'concrete-block',
    name: 'Concrete Block',
    category: 'masonry',
    description: 'Hollow concrete masonry units. Locally manufactured in major centers.',
    availability: 'moderate',
    availableProvinces: ['all'],

    properties: {
      density: 2000,
      compressiveStrength: 7,  // MPa minimum
      thermalConductivity: 1.0,
      grade: '7.0 MPa minimum',
    },
    durability: {
      lifespan: 50,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'high',
      weatherResistance: 'good',
      maintenanceFrequency: '10-year',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: true,
      embodiedEnergy: 'medium',
      recyclable: true,
      carbonFootprint: 'medium',
      environmentalImpact: 'Moderate impact, long lifespan offsets production',
    },

    costIndicator: 2,
    skillRequired: 'moderate',

    applications: [
      'Wall construction',
      'Retaining walls',
      'Fencing',
      'Foundations',
    ],
    limitations: [
      'Heavy - transport costs',
      'Quality varies by manufacturer',
      'Requires reinforcement in seismic zones',
    ],
    recommendations: [
      'Verify compressive strength before use',
      'Grout and reinforce in seismic areas',
      'Apply waterproof render externally',
      'Core-fill with concrete for structural walls',
    ],
  },

  {
    id: 'clay-brick',
    name: 'Clay Brick',
    category: 'masonry',
    description: 'Fired clay bricks. Limited local production, mostly imported.',
    availability: 'limited',
    availableProvinces: ['National Capital District', 'Morobe', 'East New Britain'],

    properties: {
      density: 1800,
      compressiveStrength: 15,
      thermalConductivity: 0.8,
      grade: 'Standard facing brick',
    },
    durability: {
      lifespan: 100,
      termiteResistance: 'immune',
      rotResistance: 'high',
      corrosionResistance: 'high',
      weatherResistance: 'excellent',
      maintenanceFrequency: 'minimal',
      treatmentRequired: false,
    },
    sustainability: {
      renewable: false,
      locallySourced: false,
      embodiedEnergy: 'high',
      recyclable: true,
      carbonFootprint: 'high',
      environmentalImpact: 'High firing energy, but very long lifespan',
    },

    costIndicator: 4,
    skillRequired: 'specialized',

    applications: [
      'Quality construction',
      'Feature walls',
      'Paving',
    ],
    limitations: [
      'Expensive',
      'Limited availability',
      'Skilled labor required',
    ],
    recommendations: [
      'Use for feature work where budget allows',
      'Combine with concrete block for economy',
    ],
  },
];

// ============================================
// Material Database Functions
// ============================================

export const ALL_MATERIALS: Material[] = [
  ...PNG_TIMBER,
  ...PNG_CONCRETE_MATERIALS,
  ...PNG_STEEL,
  ...PNG_MASONRY,
];

export function getMaterialById(id: string): Material | undefined {
  return ALL_MATERIALS.find(m => m.id === id);
}

export function getMaterialsByCategory(category: MaterialCategory): Material[] {
  return ALL_MATERIALS.filter(m => m.category === category);
}

export function getMaterialsByAvailability(province: string): Material[] {
  return ALL_MATERIALS.filter(m =>
    m.availableProvinces.includes('all') ||
    m.availableProvinces.includes(province)
  );
}

export function searchMaterials(query: string): Material[] {
  const lowerQuery = query.toLowerCase();
  return ALL_MATERIALS.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery) ||
    m.localName?.toLowerCase().includes(lowerQuery) ||
    m.applications.some(a => a.toLowerCase().includes(lowerQuery))
  );
}

export function getMaterialsForApplication(application: string): Material[] {
  const lowerApp = application.toLowerCase();
  return ALL_MATERIALS.filter(m =>
    m.applications.some(a => a.toLowerCase().includes(lowerApp))
  );
}

export function getTermiteResistantMaterials(): Material[] {
  return ALL_MATERIALS.filter(m =>
    m.durability.termiteResistance === 'high' ||
    m.durability.termiteResistance === 'immune'
  );
}

export function getMarineGradeMaterials(): Material[] {
  return ALL_MATERIALS.filter(m =>
    m.durability.corrosionResistance === 'high' ||
    m.durability.weatherResistance === 'excellent'
  );
}

// ============================================
// Material Cost Estimation
// ============================================

export interface MaterialCostEstimate {
  materialId: string;
  quantity: number;
  unit: string;
  unitCost: number;  // PGK
  totalCost: number;
  transportCost: number;
  notes: string;
}

// Indicative costs in PGK (2024 estimates)
const MATERIAL_UNIT_COSTS: Record<string, { cost: number; unit: string }> = {
  'kwila': { cost: 3500, unit: 'm³' },
  'rosewood-png': { cost: 2500, unit: 'm³' },
  'taun': { cost: 1800, unit: 'm³' },
  'calophyllum': { cost: 1200, unit: 'm³' },
  'bamboo': { cost: 5, unit: 'pole' },
  'portland-cement': { cost: 35, unit: 'bag (40kg)' },
  'river-aggregate': { cost: 150, unit: 'm³' },
  'coral-aggregate': { cost: 80, unit: 'm³' },
  'reinforcing-bar': { cost: 12, unit: 'kg' },
  'roofing-iron': { cost: 45, unit: 'sheet (3m)' },
  'concrete-block': { cost: 4.5, unit: 'block' },
  'clay-brick': { cost: 2.5, unit: 'brick' },
};

export function estimateMaterialCost(
  materialId: string,
  quantity: number,
  province: string
): MaterialCostEstimate | null {
  const costData = MATERIAL_UNIT_COSTS[materialId];
  if (!costData) return null;

  const material = getMaterialById(materialId);
  if (!material) return null;

  // Transport cost factor based on province remoteness
  const transportFactor = getTransportFactor(province);
  const transportCost = costData.cost * quantity * transportFactor * 0.1;

  return {
    materialId,
    quantity,
    unit: costData.unit,
    unitCost: costData.cost,
    totalCost: costData.cost * quantity,
    transportCost,
    notes: material.availability === 'limited'
      ? 'Limited availability - confirm stock before ordering'
      : '',
  };
}

function getTransportFactor(province: string): number {
  const remotenessFactors: Record<string, number> = {
    'National Capital District': 1.0,
    'Central': 1.1,
    'Morobe': 1.2,
    'East New Britain': 1.5,
    'West New Britain': 1.6,
    'Madang': 1.4,
    'Eastern Highlands': 1.5,
    'Western Highlands': 1.6,
    'Southern Highlands': 1.8,
    'Enga': 1.9,
    'Simbu': 1.7,
    'Hela': 2.0,
    'Jiwaka': 1.7,
    'East Sepik': 2.0,
    'Sandaun': 2.2,
    'Gulf': 1.8,
    'Western': 2.5,
    'Milne Bay': 1.8,
    'Oro': 1.6,
    'New Ireland': 1.7,
    'Manus': 2.0,
    'Autonomous Region of Bougainville': 2.2,
  };

  return remotenessFactors[province] || 1.5;
}
