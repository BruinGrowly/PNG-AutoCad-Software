# PNG Civil Engineering CAD Software

<div align="center">

**A free, browser-based CAD application for Civil Engineers in Papua New Guinea** 🇵🇬

[![Tests](https://img.shields.io/badge/tests-529%20passing-brightgreen)]()
[![Version](https://img.shields.io/badge/version-2.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

### 🌐 **[Launch PNG Civil CAD »](https://gilded-daffodil-c52a76.netlify.app/)**

*No installation required • Works on any device • 100% free*

</div>

---

## 🎯 What is This?

PNG Civil CAD is a **free CAD tool** designed specifically for civil engineers working in Papua New Guinea. Unlike expensive commercial software, this is:

- **Free** - No license fees, ever
- **Browser-based** - Works on any computer with a web browser
- **PNG-specific** - Built-in data for all 22 provinces

### Who is it for?

- Civil engineers in PNG
- Drafters and technicians
- Engineering students
- Anyone doing construction design in PNG

---

## ✨ Key Features

### CAD Tools (17 Total)
| Drawing | Modify | Annotation |
|---------|--------|------------|
| Line | Trim | Text |
| Circle | Extend | Dimension |
| Rectangle | Offset | Measure |
| Polyline | Mirror | Hatch |
| Arc | Rotate | |
| Polygon | Scale | |
| | Array | |

### PNG-Specific Features
- **22 Provinces** - Seismic zones, climate data, flood risk for every province
- **Structural Calculations** - Beam, column, footing sizing for PNG conditions
- **Material Costs** - Prices in PNG Kina
- **Construction Sequences** - Step-by-step builder guidance
- **Design Validation** - Code compliance checking

### Professional Features
- **DXF Import/Export** - Works with AutoCAD files
- **Project Explorer** - See all objects organized by layer
- **Keyboard Shortcuts** - Press ? for full list
- **Feedback System** - Built-in bug reporting

---

## 🚀 Get Started

### Option 1: Use Online (Recommended) 🌐

**Just open the link and start designing — no installation needed!**

### **➤ [https://gilded-daffodil-c52a76.netlify.app/](https://gilded-daffodil-c52a76.netlify.app/)**

✅ Works on any device (Windows, Mac, Linux, tablets)  
✅ No downloads or setup  
✅ Always up-to-date  
✅ 100% free

---

### Option 2: Run Locally (For Developers)

If you want to modify the code or run it offline:

**Requirements:**
- Node.js 20+ ([Download here](https://nodejs.org/))
- Git ([Download here](https://git-scm.com/))

**Installation:**

```bash
# Clone the repository
git clone https://github.com/BruinGrowly/PNG-AutoCad-Software.git

# Go into the folder
cd PNG-AutoCad-Software

# Install dependencies
npm install

# Start the app
npm run dev
```

Then open http://localhost:5173 in your browser.

> 📖 **First time using Git?** See [docs/QUICK_START_GUIDE.md](docs/QUICK_START_GUIDE.md) for step-by-step instructions.

---

### Option 3: Deploy Your Own Copy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/BruinGrowly/PNG-AutoCad-Software)

Want your own deployment? Click the button above or see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Quick Start Guide](docs/QUICK_START_GUIDE.md) | Installation & basic usage |
| [Deployment Guide](docs/DEPLOYMENT.md) | Deploy to Netlify |
| [User Manual](docs/USER_MANUAL.md) | Complete user guide (630+ lines) |
| [Legal](LEGAL.md) | Disclaimers & liability |
| [Data Sources](docs/DATA_SOURCES.md) | Where our data comes from |

---

## 🧪 Testing

```bash
npm test           # Watch mode
npm run test:run   # Single run
npm run test:coverage
npm run verify     # Tests + production build
```

**529 tests** covering all modules.

---

## 📁 Project Structure

```
src/
├── core/                 # CAD Engine
│   ├── engine.js         # Project, layer, entity management
│   ├── geometry.js       # Geometric calculations
│   ├── dimensions.js     # Measurement and annotation
│   ├── blocks.js         # Reusable symbols
│   └── dxf.js            # AutoCAD DXF export/import
│
├── png/                  # PNG Engineering Modules
│   ├── provinces.js      # All 22 provinces
│   ├── seismic.js        # Seismic analysis
│   ├── climate.js        # Climate zones
│   ├── flood.js          # Flood risk assessment
│   ├── materials.js      # PNG materials database
│   ├── structural.js     # Structural calculations
│   └── constructionSequence.js  # Builder guidance
│
└── ui/                   # User Interface (React)
    ├── App.jsx           # Main application
    ├── components/       # UI components
    └── store/            # State management
```

---

## 🔧 Recent Changes (v2.0)

### New Features
- ✅ **17 CAD Tools** - All drawing and modify tools now working
- ✅ **Project Explorer** - Press E to see all objects
- ✅ **Keyboard Shortcuts** - Press ? for help overlay
- ✅ **Context Menu** - Right-click for quick actions
- ✅ **Feedback System** - Click 📣 to report bugs
- ✅ **Construction Sequences** - Step-by-step builder guidance
- ✅ **Enhanced Status Bar** - Entity count, quick toggles

### PNG Data
- ✅ All 22 provinces with seismic zones
- ✅ Climate data (rainfall, temperature, cyclone risk)
- ✅ Flood risk assessment
- ✅ Material costs in Kina

### Technical
- ✅ 529 passing tests
- ✅ DXF import/export
- ✅ Offline capability
- ✅ Auto-save

---

## 📊 PNG Data Coverage

### Seismic Hazard (475-year return period)

| Zone | Hazard Factor | Provinces |
|------|---------------|-----------|
| 4 | 0.45 - 0.55 | East New Britain, Madang, Morobe |
| 3 | 0.35 - 0.40 | Central, Milne Bay, Oro |
| 2 | 0.28 - 0.30 | Highlands provinces |
| 1 | 0.15 | Western |

### Wind Regions

| Region | Description | Design Speed |
|--------|-------------|--------------|
| A | Non-cyclonic (Highlands) | 41 m/s |
| B | Intermediate (South coast) | 50 m/s |
| C | Cyclonic (North coast) | 60 m/s |
| D | Severe cyclonic (Islands) | 67 m/s |

---

## ⚠️ Important Disclaimer

> This software provides calculations as a **GUIDE ONLY**. All designs must be verified and certified by a licensed Professional Engineer before construction. See [LEGAL.md](LEGAL.md) for full details.

---

## 📣 Feedback & Support

Found a bug? Have a suggestion? 

1. Click the **📣 button** in the app (bottom-right)
2. Or email: **bruinnecessities@gmail.com**

---

## 📜 Standards Referenced

- AS/NZS 1170.4 - Earthquake actions
- AS/NZS 1170.2 - Wind actions
- AS 2870 - Residential slabs and footings
- AS 3600 - Concrete structures
- ReCAP Rural Road Notes - Low-volume road design

---

## 🌐 Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 📄 License

MIT License - Free to use, modify, and distribute.

---

<div align="center">

**Made with ❤️ for Papua New Guinea** 🇵🇬

### 🌐 **[Launch PNG Civil CAD](https://gilded-daffodil-c52a76.netlify.app/)**

[GitHub](https://github.com/BruinGrowly/PNG-AutoCad-Software) • [Report Bug](mailto:bruinnecessities@gmail.com) • [Request Feature](mailto:bruinnecessities@gmail.com)

</div>

