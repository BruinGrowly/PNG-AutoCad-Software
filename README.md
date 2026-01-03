# PNG Civil Engineering CAD Software

A browser-based Computer-Aided Design (CAD) software for Civil Engineering projects in Papua New Guinea. Built with safety, local context, and longevity as core principles.

## Quick Start

### For End Users
Once deployed, just open the application URL in any modern browser - no software installation needed.

### For Developers

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Design Philosophy

This software embeds **engineering intelligence specific to PNG conditions**:

- **Safety First**: Modern 475-year return period seismic hazards, cyclone wind loads, flood resilience
- **Context Focused**: Local materials, tropical climate, PNG Building Board standards
- **Longevity**: Lifecycle cost analysis, durability in tropical conditions, maintenance planning
- **Appropriate Standards**: Low-volume road design, not over-engineered solutions

## Key Capabilities

### Terrain & Drainage (Tropical)
```javascript
import { createTerrainModel, calculateDesignDischarge, designDrainageChannel } from './src/png/terrain.js';

// Create terrain from survey points
const terrain = createTerrainModel(elevationPoints, { gridSpacing: 10 });

// Design drainage for tropical rainfall (PNG IDF curves built-in)
const discharge = calculateDesignDischarge(catchment, {
  region: 'coastal',      // coastal, highlands, islands, momase
  returnPeriod: 25,       // years
  landUse: 'village',
});

// Size the channel
const channel = designDrainageChannel(discharge, {
  channelType: 'trapezoidal',
  material: 'earth',
});
```

### Road Design (Low-Volume Appropriate)
```javascript
import { createAlignment, assessRoadStandard, calculateGravelThickness } from './src/png/roads.js';

// Assess appropriate road standard (not over-designed)
const standard = assessRoadStandard({
  estimatedADT: 150,
  percentHeavyVehicles: 10,
  terrain: 'rolling',
  rainfallZone: 'high',
});
// Returns: district class, gravel surface, 40 km/h design speed

// Design horizontal alignment
const alignment = createAlignment('Village Access Road', points, {
  roadClass: 'district',
  terrain: 'rolling',
});

// Calculate gravel pavement thickness
const pavement = calculateGravelThickness({
  designESA: 0.15,
  subgradeStrength: 'medium',
  rainfallZone: 'high',
});
```

### Seismic Design (Modern Standards)
```javascript
import { getSeismicHazard475, calculateCombinedLoads } from './src/png/safety.js';

// Get modern 475-year hazard (supersedes 1982 PNG code)
const hazard = getSeismicHazard475('East New Britain');
// Returns: Z = 0.55, nearFault: true

// Combined seismic + wind analysis
const loads = calculateCombinedLoads({
  province: 'East New Britain',
  buildingWeight: 2000,
  buildingHeight: 12,
  soilClass: 'C',
  structuralSystem: 'concrete-frame',
});
// Returns: governing load case, design base shear, recommendations
```

### Wind/Cyclone Loading
```javascript
import { calculateWindLoads } from './src/png/safety.js';

const wind = calculateWindLoads({
  province: 'Manus',           // Region D - severe cyclonic
  buildingWidth: 10,
  buildingHeight: 8,
  roofType: 'hip',
  importanceCategory: 3,       // School
});
// Returns: design pressures, forces, cyclone-specific requirements
```

### Design Validation
```javascript
import { validateDesign, estimateLifecycleCost } from './src/png/safety.js';

// Automated safety checks
const validation = validateDesign({
  province: 'Madang',
  structuralSystem: 'masonry-unreinforced',  // Will flag as not permitted
  soilClass: 'D',
  floorLevel: 2.5,
  floodLevel: 2.3,
});
// Returns: pass/fail, issues with code references, recommendations

// Lifecycle cost (Pacific Quality Infrastructure principles)
const lifecycle = estimateLifecycleCost({
  constructionCost: 500000,
  assetType: 'road',
  designLife: 15,
  province: 'Western',   // Remote - higher maintenance
  quality: 'standard',
});
```

### Foundation Design
```javascript
import { getFoundationDesign } from './src/png/safety.js';

const foundation = getFoundationDesign({
  province: 'Morobe',
  soilClass: 'D',
  numberOfStoreys: 2,
  floodZone: true,
  nearCoast: true,
});
// Returns: ranked foundation options, warnings, inspection points
```

## Project Structure

```
src/
├── core/                 # CAD Engine
│   ├── engine.js         # Project, layer, entity management
│   ├── geometry.js       # Geometric calculations
│   ├── dimensions.js     # Measurement and annotation
│   ├── blocks.js         # Reusable symbols (doors, columns, PNG haus)
│   ├── hatch.js          # Fill patterns (concrete, earth, gravel)
│   └── dxf.js            # AutoCAD DXF export/import
│
├── png/                  # PNG Engineering Modules
│   ├── climate.js        # Climate zones, design recommendations
│   ├── seismic.js        # Seismic analysis (AS/NZS 1170.4)
│   ├── flood.js          # Flood risk assessment
│   ├── materials.js      # PNG materials database
│   ├── structural.js     # Structural calculations
│   ├── terrain.js        # Terrain modeling, drainage design
│   ├── roads.js          # Road alignment, low-volume standards
│   └── safety.js         # Wind loads, validation, lifecycle costs
```

## PNG Data Coverage

### All 22 Provinces
Seismic, wind, climate, and flood data for every province.

### Seismic Hazard (475-year return period)

| Region | Hazard Factor (Z) | Example Provinces |
|--------|-------------------|-------------------|
| Zone 4 | 0.45 - 0.55 | East New Britain, Madang, Morobe |
| Zone 3 | 0.35 - 0.40 | Central, Milne Bay, Oro |
| Zone 2 | 0.28 - 0.30 | Highlands provinces |
| Zone 1 | 0.15 | Western |

### Wind Regions

| Region | Description | Design Speed (Cat 2) |
|--------|-------------|---------------------|
| A | Non-cyclonic (Highlands) | 41 m/s |
| B | Intermediate (South coast) | 50 m/s |
| C | Cyclonic (North coast) | 60 m/s |
| D | Severe cyclonic (Islands) | 67 m/s |

### Road Classes

| Class | Traffic (ADT) | Design Speed | Surface |
|-------|---------------|--------------|---------|
| National | >1000 | 80 km/h | Sealed |
| Provincial | 200-1000 | 60 km/h | Sealed |
| District | 50-200 | 40 km/h | Gravel |
| Access | 10-50 | 30 km/h | Gravel |
| Track | <20 | 20 km/h | Earth |

## Standards Referenced

- **AS/NZS 1170.4**: Earthquake actions
- **AS/NZS 1170.2**: Wind actions
- **AS 2870**: Residential slabs and footings
- **AS 3600**: Concrete structures
- **ASCE 24**: Flood resistant design
- **ReCAP Rural Road Notes**: Low-volume road design
- **Pacific Quality Infrastructure Principles**: Lifecycle approach

## Testing

```bash
npm test           # Watch mode
npm run test:run   # Single run (CI)
```

341 tests covering all modules.

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## License

MIT License
