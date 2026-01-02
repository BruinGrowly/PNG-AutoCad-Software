# PNG Civil Engineering CAD Software

A specialized Computer-Aided Design (CAD) software for Civil Engineering projects in Papua New Guinea, designed to address the unique challenges of the PNG environment.

## Key Features

### PNG-Specific Design Considerations
- **Climate Analysis**: Built-in tools for tropical climate design (high rainfall, humidity, cyclone zones)
- **Seismic Design**: Earthquake-resistant structural calculations (PNG is in the Pacific Ring of Fire)
- **Flood Analysis**: Terrain and drainage analysis for flood-prone areas
- **Material Database**: Local PNG materials with properties (timber species, coral aggregate, imported materials)
- **Terrain Modeling**: Support for PNG's diverse geography (highlands, coastal, riverine, island)

### Core CAD Functionality
- 2D drafting and design tools
- Layer management system
- Measurement and annotation tools
- DXF/DWG file import/export
- Grid and snap functionality
- Multiple viewport support

### Structural Engineering Tools
- Load calculations with PNG Building Board standards
- Foundation design for various soil conditions
- Drainage and stormwater design
- Road and bridge design templates
- Water supply and sanitation layouts

### Offline-First Architecture
- Full functionality without internet connection
- Local project storage with cloud sync when available
- Offline material and standards databases

## Platforms

- **Windows Desktop**: Native application with full feature set
- **Web Interface**: Browser-based access with offline PWA support

## Installation

### Windows Desktop
```bash
# Download the installer from releases
# Run PNG-CAD-Setup.exe
```

### Web Interface
```bash
npm install
npm run build
npm start
```

## Project Structure

```
├── src/
│   ├── core/           # Core CAD engine
│   ├── png/            # PNG-specific modules
│   ├── structural/     # Structural analysis
│   ├── ui/             # User interface components
│   ├── desktop/        # Windows desktop app (Electron)
│   └── web/            # Web interface (React)
├── data/
│   ├── materials/      # Material databases
│   ├── standards/      # Building standards
│   ├── templates/      # Project templates
│   └── climate/        # Climate zone data
└── docs/               # Documentation
```

## License

MIT License - See LICENSE file
