# PNG Civil CAD - User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [User Interface Overview](#user-interface-overview)
5. [Drawing Tools](#drawing-tools)
6. [Layer Management](#layer-management)
7. [PNG Analysis Tools](#png-analysis-tools)
8. [File Operations](#file-operations)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

PNG Civil CAD is a specialized Computer-Aided Design (CAD) software developed specifically for civil engineering projects in Papua New Guinea. The software addresses the unique challenges of the PNG environment, including:

- **Tropical Climate**: High rainfall, humidity, and cyclone considerations
- **Seismic Activity**: PNG is located on the Pacific Ring of Fire
- **Flood Risks**: Many areas experience regular flooding
- **Material Availability**: Limited access to certain materials in remote areas
- **Offline Capability**: Full functionality without internet connection

### System Requirements

#### Windows Desktop Application
- Windows 10 or later (64-bit)
- 4GB RAM minimum (8GB recommended)
- 500MB available disk space
- 1920x1080 display resolution recommended

#### Web Application
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- 2GB RAM minimum

---

## Installation

### Windows Desktop Installation

1. Download the installer from the releases page
2. Run `PNG-CAD-Setup.exe`
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Web Application

Access the web application at your organization's deployment URL, or run locally:

```bash
# Clone the repository
git clone https://github.com/your-org/png-civil-cad.git
cd png-civil-cad

# Install dependencies
npm install

# Start development server
npm run start

# Build for production
npm run build
```

---

## Getting Started

### Creating a New Project

1. Launch PNG Civil CAD
2. Click **New Project** or press `Ctrl+N`
3. Fill in project details:
   - **Project Name**: Descriptive name for your project
   - **Description**: Brief project description
   - **Author**: Your name or organization
   - **Project Type**: Select from Building, Road, Bridge, etc.
4. Set PNG Location:
   - **Province**: Select the project's province
   - **Terrain Type**: Select terrain (Coastal, Highland, etc.)
5. Click **Create Project**

### Opening an Existing Project

1. Click **Open Project** tab in the project dialog
2. Select from recent projects, or
3. Click **Import** to open a file:
   - `.pngcad` - Native project format
   - `.dxf` - AutoCAD DXF format
   - `.json` - JSON project format

### Quick Start Templates

For common project types, use the quick start templates:

| Template | Description |
|----------|-------------|
| 🏠 Residential House | Single/multi-story residential buildings |
| 🏛 Community Building | Churches, schools, community halls |
| 🛣 Road | Road design with drainage |
| 🌉 Bridge | Bridge and culvert design |
| 💧 Water Supply | Water supply systems |
| 🌊 Drainage | Stormwater drainage systems |

---

## User Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  Menu Bar (File, Edit, View, Draw, PNG Analysis, Help)          │
├──────┬──────────────────────────────────────────────┬───────────┤
│      │                                              │           │
│  T   │                                              │  Props    │
│  o   │                                              │           │
│  o   │              Drawing Canvas                  │  Panel    │
│  l   │                                              │           │
│  b   │                                              ├───────────┤
│  a   │                                              │           │
│  r   │                                              │  PNG      │
│      │                                              │  Analysis │
├──────┴──────────────────────────────────────────────┴───────────┤
│  Status Bar (Tool, Coordinates, Zoom, Snap Status)              │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Menu Bar**: Access all application functions
2. **Toolbar**: Quick access to drawing and modification tools
3. **Layer Panel**: Manage drawing layers
4. **Drawing Canvas**: Main drawing area
5. **Properties Panel**: View/edit selected object properties
6. **PNG Analysis Panel**: Access PNG-specific analysis tools
7. **Status Bar**: Current tool, coordinates, zoom level

---

## Drawing Tools

### Navigation Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Select | `V` or `Esc` | Select and move objects |
| Pan | `H` | Pan/scroll the drawing view |
| Zoom | `Z` | Zoom in/out (scroll wheel also works) |

### Drawing Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Line | `L` | Draw straight lines |
| Polyline | `P` | Draw connected line segments |
| Circle | `C` | Draw circles (center + radius) |
| Arc | `A` | Draw arcs |
| Rectangle | `R` | Draw rectangles |
| Polygon | `G` | Draw regular polygons |

### Annotation Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Text | `T` | Add text annotations |
| Dimension | `D` | Add dimensions |
| Measure | `M` | Measure distances and areas |
| Hatch | `HA` | Fill closed areas with patterns |

### Modification Tools

| Tool | Shortcut | Description |
|------|----------|-------------|
| Trim | `TR` | Trim objects at intersections |
| Extend | `EX` | Extend objects to boundaries |
| Offset | `O` | Create parallel copies |
| Mirror | `MI` | Mirror objects |
| Rotate | `RO` | Rotate objects |
| Scale | `SC` | Scale objects |
| Array | `AR` | Create rectangular/polar arrays |

### Using Drawing Tools

#### Drawing a Line
1. Press `L` or click Line tool
2. Click to set start point
3. Click to set end point
4. Press `Esc` to finish or continue drawing

#### Drawing a Polyline
1. Press `P` or click Polyline tool
2. Click to add points
3. Double-click or press `Enter` to finish
4. Right-click to cancel last point

#### Drawing a Circle
1. Press `C` or click Circle tool
2. Click to set center point
3. Move mouse and click to set radius
4. Or type radius value and press `Enter`

#### Drawing a Rectangle
1. Press `R` or click Rectangle tool
2. Click first corner
3. Click opposite corner

---

## Layer Management

### Understanding Layers

Layers organize your drawing into logical groups:
- **Structural**: Structural elements (beams, columns)
- **Foundation**: Foundation elements
- **Drainage**: Stormwater and drainage
- **Electrical**: Electrical systems
- **Plumbing**: Water and sanitation
- **Site**: Site boundaries and features

### Layer Operations

#### Creating a New Layer
1. Click the `+` button in the Layer Panel
2. Enter layer name
3. Press `Enter` or click **Add**

#### Layer Controls
| Icon | Function |
|------|----------|
| 👁 | Toggle visibility |
| 🔒 | Toggle lock (prevent editing) |
| 🎨 | Change layer color |
| × | Delete layer |

#### Setting Active Layer
- Click a layer to make it active
- New objects are drawn on the active layer

---

## PNG Analysis Tools

### Climate Analysis

Access via **PNG Analysis > Climate** or the PNG Analysis Panel.

#### Information Provided
- **Temperature Range**: Min/max/average temperatures
- **Humidity**: Annual humidity levels
- **Rainfall**: Annual rainfall, wet season, max daily
- **Wind**: Average speed, max gusts, cyclone risk
- **UV Index**: Sun exposure levels

#### Design Recommendations
- Ventilation requirements
- Moisture protection level
- Minimum roof pitch
- Overhang recommendations
- Corrosion protection requirements
- Termite protection requirements

### Seismic Analysis

Access via **PNG Analysis > Seismic**.

#### Input Parameters
| Parameter | Description |
|-----------|-------------|
| Soil Class | A (rock) to E (very soft) |
| Importance Category | 1-4 (minor to essential) |
| Structural System | Frame type selection |
| Building Height | Total height in meters |
| Building Weight | Estimated weight in kN |
| Number of Storeys | Floor count |

#### Output Results
- Seismic zone classification (1-4)
- Design base shear
- Lateral force distribution
- Foundation recommendations
- Structural detailing requirements

### Flood Analysis

Access via **PNG Analysis > Flood**.

#### Flood Zone Classification
| Zone | Description | Return Period |
|------|-------------|---------------|
| Minimal | Low flood risk | 500 years |
| Moderate | 100-year flood zone | 100 years |
| High | 50-year flood zone | 50 years |
| Very High | Annual flooding | 10 years |

#### Design Output
- Minimum floor elevation
- Foundation type recommendation
- Material requirements
- Emergency features
- Traditional design integration options

### Material Database

Access via **PNG Analysis > Materials**.

#### Search and Filter
- Search by name or application
- Filter by category (timber, concrete, steel, etc.)
- Filter by availability in your province

#### Material Information
- Physical properties (density, strength)
- Durability characteristics
- Sustainability information
- Cost indicators
- Application recommendations
- Treatment requirements

---

## File Operations

### Save Project
- **Ctrl+S**: Save to current location
- **Ctrl+Shift+S**: Save As (choose new location)

### Auto-Save
Projects are automatically saved every 60 seconds to local storage.

### Export Options
| Format | Description |
|--------|-------------|
| DXF | AutoCAD interchange format |
| PDF | Print-ready document |
| PNG | Raster image |

### Import Options
| Format | Description |
|--------|-------------|
| .pngcad | Native project format |
| .dxf | AutoCAD DXF files |
| .json | JSON project files |

---

## Keyboard Shortcuts

### File Operations
| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Project |
| Ctrl+O | Open Project |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+P | Print |

### Edit Operations
| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+X | Cut |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+A | Select All |
| Delete | Delete Selected |
| Escape | Cancel/Deselect |

### View Operations
| Shortcut | Action |
|----------|--------|
| Ctrl+0 | Zoom to Fit |
| Ctrl+1 | Zoom 100% |
| Scroll | Zoom In/Out |
| G | Toggle Grid |
| S | Toggle Snap |

### Drawing Tools
| Shortcut | Tool |
|----------|------|
| V | Select |
| L | Line |
| P | Polyline |
| C | Circle |
| A | Arc |
| R | Rectangle |
| T | Text |
| D | Dimension |
| M | Measure |

---

## Troubleshooting

### Common Issues

#### Drawing Not Visible
1. Check layer visibility (👁 icon should be visible)
2. Check zoom level (Ctrl+0 to fit all)
3. Verify objects are not on a hidden layer

#### Cannot Edit Objects
1. Check if layer is locked (🔒 icon)
2. Check if object is locked (Properties panel)
3. Verify you have the correct layer selected

#### Snap Not Working
1. Press `S` to toggle snap
2. Check snap settings in View menu
3. Ensure grid is visible for grid snap

#### Offline Mode Issues
1. Ensure project was saved before going offline
2. Check local storage is not full
3. Projects sync automatically when online

### Performance Tips

1. **Use Layers**: Organize objects into layers and hide unused layers
2. **Reduce Detail**: Use lower detail for distant views
3. **Clear Undo History**: Large undo history uses memory
4. **Close Unused Panels**: Minimize panels you're not using

### Getting Help

- **Documentation**: Access from Help menu
- **PNG Building Standards**: Links to official standards
- **Community Forum**: Ask questions and share knowledge
- **Report Issues**: GitHub issues page

---

## Appendix A: PNG Province Reference

| Province | Climate Zone | Seismic Zone |
|----------|--------------|--------------|
| Central | Tropical Coastal | Zone 3 |
| National Capital District | Tropical Coastal | Zone 3 |
| Morobe | Tropical Coastal | Zone 4 |
| Eastern Highlands | Tropical Highland | Zone 2 |
| Western Highlands | Tropical Highland | Zone 2 |
| Southern Highlands | Tropical Highland | Zone 2 |
| Enga | Tropical Highland | Zone 2 |
| Madang | Tropical Coastal | Zone 4 |
| East Sepik | Tropical Monsoon | Zone 4 |
| Sandaun | Tropical Monsoon | Zone 4 |
| East New Britain | Tropical Island | Zone 4 |
| West New Britain | Tropical Island | Zone 4 |
| New Ireland | Tropical Island | Zone 4 |
| Manus | Tropical Island | Zone 4 |
| Milne Bay | Tropical Island | Zone 3 |
| Gulf | Tropical Monsoon | Zone 3 |
| Western | Tropical Monsoon | Zone 1 |
| Oro | Tropical Monsoon | Zone 3 |
| Simbu | Tropical Highland | Zone 2 |
| Hela | Tropical Highland | Zone 2 |
| Jiwaka | Tropical Highland | Zone 2 |
| Bougainville | Tropical Island | Zone 4 |

---

## Appendix B: Material Quick Reference

### Timber Species (PNG)

| Species | Durability | Termite Resistance | Best Use |
|---------|------------|-------------------|----------|
| Kwila | Class 1 | High | Structural, Marine |
| Taun | Class 2 | Moderate | General Construction |
| Rosewood | Class 2 | Moderate | Flooring, Joinery |
| Calophyllum | Class 3 | Low | Internal, Formwork |
| Bamboo | - | Low (untreated) | Traditional, Temporary |

### Concrete Mix Recommendations

| Application | Strength | Cement:Sand:Aggregate |
|-------------|----------|----------------------|
| Blinding | 15 MPa | 1:3:6 |
| Footings | 20 MPa | 1:2:4 |
| Structural | 25 MPa | 1:1.5:3 |
| High-strength | 32 MPa | 1:1:2 |

### Minimum Concrete Cover (PNG Conditions)

| Exposure | Cover (mm) |
|----------|-----------|
| Internal | 25 |
| External | 40 |
| In ground | 50 |
| Coastal | 65 |
| Marine | 75 |

---

*PNG Civil CAD v1.0 - Civil Engineering Design for Papua New Guinea*
