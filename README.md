# PNG Civil Engineering CAD Software

A browser-based Computer-Aided Design (CAD) software for Civil Engineering projects in Papua New Guinea. **Runs entirely in the browser - no installation required.**

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Then open `http://localhost:3000` in any modern browser.

## Key Features

### Browser-Based - Works Anywhere
- **No installation required** - runs in Chrome, Firefox, Safari, Edge
- **Works offline** - save projects locally in browser storage
- **Cross-platform** - Windows, Mac, Linux, tablets
- **Pure JavaScript** - no TypeScript compilation needed

### PNG-Specific Design Considerations
- **Climate Analysis**: Built-in tools for tropical climate design (high rainfall, humidity, cyclone zones)
- **Seismic Design**: Earthquake-resistant structural calculations (PNG is in the Pacific Ring of Fire)
- **Flood Analysis**: Terrain and drainage analysis for flood-prone areas
- **Material Database**: Local PNG materials with properties (Kwila, Taun, bamboo, coral aggregate)
- **Terrain Modeling**: Support for PNG's diverse geography (highlands, coastal, riverine, island)

### Core CAD Functionality
- 2D drafting and design tools (line, polyline, circle, rectangle, arc)
- Layer management system
- Measurement and annotation tools
- Grid and snap functionality
- Undo/redo support
- Project save/load with browser storage

### Structural Engineering Tools
- Load calculations with PNG Building Board standards
- Foundation design for various soil conditions
- Seismic base shear calculations
- Lateral force distribution analysis
- Reference to AS/NZS and PNG standards

## Using the Analysis Modules Directly

You can use the PNG analysis modules directly in any JavaScript environment:

```javascript
import { generateClimateReport } from './src/png/climate.js';
import { generateSeismicReport } from './src/png/seismic.js';
import { generateFloodReport } from './src/png/flood.js';
import { getMaterialById, searchMaterials } from './src/png/materials.js';

// Get climate analysis for a location
const climate = generateClimateReport('Madang', 'coastal-lowland', 'residential');
console.log(climate.recommendations);

// Calculate seismic design requirements
const seismic = generateSeismicReport({
  province: 'East New Britain',
  soilClass: 'C',
  importanceCategory: 3,
  structuralSystem: 'concrete-frame',
  buildingHeight: 12,
  buildingWeight: 2000,
  numberOfStoreys: 4,
});
console.log(`Base Shear: ${seismic.designResults.designBaseShear} kN`);

// Get flood assessment
const flood = generateFloodReport(
  'Gulf',
  'riverine-floodplain',
  50, // distance from water in meters
  10, // elevation
  'residential',
  false // not coastal
);
console.log(`Minimum floor height: ${flood.designRequirements.minimumFloorHeight}m`);

// Search materials database
const timbers = searchMaterials('termite resistant');
console.log(timbers.map(m => m.name));
```

## Project Structure

```
├── src/
│   ├── core/           # Core CAD engine (JavaScript)
│   │   ├── engine.js   # Project, layer, entity management
│   │   ├── geometry.js # Geometric calculations
│   │   └── types.js    # Type definitions and constants
│   ├── png/            # PNG-specific analysis modules
│   │   ├── climate.js  # Climate zone analysis
│   │   ├── seismic.js  # Seismic design calculations
│   │   ├── flood.js    # Flood risk assessment
│   │   ├── materials.js# PNG materials database
│   │   └── structural.js# Structural calculations
│   ├── ui/             # React UI components
│   │   ├── App.jsx     # Main application
│   │   ├── components/ # UI components
│   │   ├── hooks/      # React hooks
│   │   └── store/      # State management (Zustand)
│   ├── index.js        # Main module exports
│   └── main.jsx        # Application entry point
├── tests/              # Test suites
├── index.html          # HTML entry point
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

## PNG Provinces Supported

All 22 PNG provinces with specific climate, seismic, and flood data:
- Central, East New Britain, East Sepik, Eastern Highlands
- Enga, Gulf, Hela, Jiwaka, Madang, Manus
- Milne Bay, Morobe, National Capital District, New Ireland
- Oro, Sandaun, Simbu, Southern Highlands
- West New Britain, Western, Western Highlands
- Autonomous Region of Bougainville

## Seismic Zones

| Zone | Hazard Factor | Provinces |
|------|--------------|-----------|
| Zone 1 | 0.1 | Western |
| Zone 2 | 0.25 | Highland provinces |
| Zone 3 | 0.35 | Southern coastal |
| Zone 4 | 0.5 | Northern coastal, islands |

## Testing

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run
```

## Browser Requirements

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See LICENSE file

## Contributing

Contributions welcome! Please submit issues and pull requests to the GitHub repository.
