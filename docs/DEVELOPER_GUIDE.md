# PNG Civil CAD - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Modules](#core-modules)
4. [PNG Modules](#png-modules)
5. [UI Components](#ui-components)
6. [State Management](#state-management)
7. [Extending the Application](#extending-the-application)
8. [Testing](#testing)
9. [Building and Deployment](#building-and-deployment)

---

## Architecture Overview

PNG Civil CAD follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Canvas  │ │ Toolbar  │ │  Panels  │ │ PNG Analysis UI  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                 │             │
│  ┌────┴────────────┴────────────┴─────────────────┴──────────┐  │
│  │                    State Management (Zustand)              │  │
│  └────┬────────────────────────────────────────────┬─────────┘  │
├───────┴────────────────────────────────────────────┴────────────┤
│                         Core Layer                              │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────────┐  │
│  │  CAD Engine  │ │   Geometry   │ │    Type Definitions    │  │
│  └──────────────┘ └──────────────┘ └────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                       PNG Modules                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Climate │ │ Seismic │ │  Flood  │ │Materials│ │Structural│  │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └──────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Data Layer                                 │
│  ┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐  │
│  │  Local Storage   │ │    IndexedDB     │ │  File System   │  │
│  └──────────────────┘ └──────────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Offline-First**: All functionality works without internet
2. **Type Safety**: Full TypeScript coverage
3. **Modularity**: Independent modules with clear interfaces
4. **Extensibility**: Easy to add new tools and analysis modules
5. **PNG-Centric**: Design decisions prioritize PNG requirements

---

## Project Structure

```
png-civil-cad/
├── src/
│   ├── core/                 # Core CAD functionality
│   │   ├── types.ts          # Type definitions
│   │   ├── geometry.ts       # Geometric calculations
│   │   ├── engine.ts         # CAD engine
│   │   └── index.ts          # Module exports
│   │
│   ├── png/                  # PNG-specific modules
│   │   ├── climate.ts        # Climate analysis
│   │   ├── seismic.ts        # Seismic design
│   │   ├── flood.ts          # Flood assessment
│   │   ├── materials.ts      # Material database
│   │   ├── structural.ts     # Structural analysis
│   │   └── index.ts          # Module exports
│   │
│   ├── ui/                   # User interface
│   │   ├── components/       # React components
│   │   ├── store/            # State management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── styles/           # CSS styles
│   │   └── App.tsx           # Main application
│   │
│   ├── desktop/              # Electron desktop app
│   │   ├── main.ts           # Main process
│   │   └── preload.ts        # Preload script
│   │
│   └── main.tsx              # Web entry point
│
├── docs/                     # Documentation
├── tests/                    # Test files
├── data/                     # Static data files
└── public/                   # Static assets
```

---

## Core Modules

### Types (`src/core/types.ts`)

Central type definitions for the entire application.

#### Entity Types

```typescript
// Base entity interface
interface BaseEntity {
  id: string;
  type: EntityType;
  layerId: string;
  visible: boolean;
  locked: boolean;
  style: EntityStyle;
  metadata?: Record<string, unknown>;
}

// Entity types
type EntityType =
  | 'line'
  | 'polyline'
  | 'circle'
  | 'arc'
  | 'rectangle'
  | 'polygon'
  | 'text'
  | 'dimension'
  | 'hatch'
  | 'block';

// Specific entity interfaces
interface LineEntity extends BaseEntity {
  type: 'line';
  startPoint: Point2D;
  endPoint: Point2D;
}

interface CircleEntity extends BaseEntity {
  type: 'circle';
  center: Point2D;
  radius: number;
}
```

#### PNG-Specific Types

```typescript
type PNGProvince =
  | 'Central'
  | 'East New Britain'
  | 'Morobe'
  // ... all 22 provinces

type PNGTerrainType =
  | 'coastal-lowland'
  | 'riverine-floodplain'
  | 'highland-valley'
  | 'mountainous'
  | 'island-atoll'
  | 'swamp-wetland';

type PNGClimateZone =
  | 'tropical-coastal'
  | 'tropical-highland'
  | 'tropical-monsoon'
  | 'tropical-island';

type PNGSeismicZone =
  | 'zone-1'  // Low
  | 'zone-2'  // Moderate
  | 'zone-3'  // High
  | 'zone-4'; // Very high
```

### Geometry (`src/core/geometry.ts`)

Mathematical functions for CAD operations.

#### Point Operations

```typescript
// Create points
function createPoint(x: number, y: number): Point2D;
function createPoint3D(x: number, y: number, z: number): Point3D;

// Distance calculations
function distance(p1: Point2D, p2: Point2D): number;
function distance3D(p1: Point3D, p2: Point3D): number;

// Point transformations
function rotatePoint(p: Point2D, center: Point2D, angle: number): Point2D;
function scalePoint(p: Point2D, factor: number): Point2D;
function midpoint(p1: Point2D, p2: Point2D): Point2D;
```

#### Line Operations

```typescript
// Line calculations
function lineLength(line: LineEntity): number;
function distanceToLine(point: Point2D, lineStart: Point2D, lineEnd: Point2D): number;
function lineIntersection(l1Start, l1End, l2Start, l2End): Point2D | null;
function perpendicularPoint(lineStart, lineEnd, point): Point2D;
```

#### Circle Operations

```typescript
function circleArea(radius: number): number;
function circleCircumference(radius: number): number;
function circleLineIntersection(center, radius, lineStart, lineEnd): Point2D[];
function circleCircleIntersection(c1, r1, c2, r2): Point2D[];
```

#### Polygon Operations

```typescript
function polygonArea(points: Point2D[]): number;
function polygonPerimeter(points: Point2D[]): number;
function polygonCentroid(points: Point2D[]): Point2D;
function isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean;
```

#### Coordinate Transformations

```typescript
// PNG uses UTM zones 54-56
function latLongToUTM(lat: number, lon: number): {
  easting: number;
  northing: number;
  zone: number;
};
```

### Engine (`src/core/engine.ts`)

Core CAD engine functionality.

#### Layer Management

```typescript
// Create a new layer
function createLayer(name: string, color?: string): Layer;

// Default layers for PNG civil engineering
const DEFAULT_LAYERS: Layer[] = [
  { id: 'layer-0', name: '0', ... },
  { id: 'layer-structural', name: 'Structural', ... },
  { id: 'layer-foundation', name: 'Foundation', ... },
  { id: 'layer-drainage', name: 'Drainage', ... },
  // ...
];
```

#### Entity Operations

```typescript
// Create entity with defaults
function createEntity<T extends Entity>(
  type: T['type'],
  properties: Omit<T, 'id' | 'type' | 'visible' | 'locked' | 'style'>,
  layerId?: string,
  style?: Partial<EntityStyle>
): T;

// Selection
function isPointNearEntity(point: Point2D, entity: Entity, tolerance?: number): boolean;
function selectEntitiesInBox(entities: Entity[], box: BoundingBox): Entity[];
```

#### Snap System

```typescript
interface SnapPoint {
  point: Point2D;
  type: 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'grid';
}

function getSnapPoints(entities: Entity[], settings: SnapSettings): SnapPoint[];
function findNearestSnapPoint(point: Point2D, snapPoints: SnapPoint[], maxDistance: number): SnapPoint | null;
function snapToGrid(point: Point2D, gridSpacing: number): Point2D;
```

#### Command History

```typescript
class CommandHistory {
  execute(command: Command): void;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  clear(): void;
}

// Command factory functions
function createAddEntityCommand(entities, newEntity, setEntities): Command;
function createDeleteEntityCommand(entities, entityId, setEntities): Command;
function createModifyEntityCommand(entities, entityId, newProperties, setEntities): Command;
```

---

## PNG Modules

### Climate Module (`src/png/climate.ts`)

#### API

```typescript
// Get climate zone for a province
function getClimateZone(province: PNGProvince): PNGClimateZone;

// Get climate data for a zone
function getClimateData(zone: PNGClimateZone): ClimateData;

// Get design factors based on climate and terrain
function getDesignFactors(climateData: ClimateData, terrainType: PNGTerrainType): ClimateDesignFactors;

// Calculate design rainfall intensity
function calculateDesignRainfallIntensity(
  climateData: ClimateData,
  returnPeriod: number,
  duration: number
): number;

// Calculate drainage requirements
function calculateDrainageRequirements(params: DrainageDesignParams): DrainageResult;

// Calculate wind load
function calculateWindLoad(params: WindLoadParams): WindLoadResult;

// Generate comprehensive climate report
function generateClimateReport(
  province: PNGProvince,
  terrainType: PNGTerrainType,
  buildingType: string
): ClimateReport;
```

#### Data Structures

```typescript
interface ClimateData {
  zone: PNGClimateZone;
  averageTemperature: { min: number; max: number; annual: number };
  humidity: { min: number; max: number; annual: number };
  rainfall: {
    annual: number;
    wetSeasonMonths: number[];
    maxMonthly: number;
    maxDaily: number;
  };
  wind: {
    averageSpeed: number;
    maxGust: number;
    predominantDirection: string;
    cycloneRisk: 'none' | 'low' | 'moderate' | 'high';
  };
  sunExposure: { averageDailyHours: number; uvIndex: number };
}

interface ClimateDesignFactors {
  ventilationRequired: 'minimal' | 'moderate' | 'extensive';
  insulationRequired: boolean;
  moistureProtection: 'standard' | 'enhanced' | 'maximum';
  roofPitchMin: number;
  overhangsRecommended: number;
  crossVentilationRequired: boolean;
  elevatedFloorRequired: boolean;
  corrosionProtection: 'standard' | 'enhanced' | 'marine-grade';
  termiteProtection: 'standard' | 'enhanced';
  moldPreventionMeasures: string[];
}
```

### Seismic Module (`src/png/seismic.ts`)

#### API

```typescript
// Get seismic zone for province
function getSeismicZone(province: PNGProvince): PNGSeismicZone;

// Get seismic zone data
function getSeismicZoneData(zone: PNGSeismicZone): SeismicZoneData;

// Get soil class data
function getSoilClassData(soilClass: SoilClass): SoilClassData;

// Get structural system data
function getStructuralSystemData(system: StructuralSystem): StructuralSystemData;

// Get recommended systems for a zone
function getRecommendedSystems(zone: PNGSeismicZone): StructuralSystem[];

// Calculate seismic design
function calculateSeismicDesign(input: SeismicDesignInput): SeismicDesignResult;

// Get foundation recommendations
function getFoundationRecommendations(
  zone: PNGSeismicZone,
  soilClass: SoilClass,
  buildingWeight: number,
  numberOfStoreys: number
): FoundationRecommendation[];

// Generate seismic report
function generateSeismicReport(input: SeismicDesignInput): SeismicReport;
```

#### Data Structures

```typescript
interface SeismicDesignInput {
  province: PNGProvince;
  soilClass: SoilClass;
  importanceCategory: ImportanceCategory;
  structuralSystem: StructuralSystem;
  buildingHeight: number;
  buildingPeriod?: number;
  buildingWeight: number;
  numberOfStoreys: number;
}

interface SeismicDesignResult {
  seismicZone: PNGSeismicZone;
  hazardFactor: number;
  siteFactor: number;
  importanceFactor: number;
  ductilityFactor: number;
  buildingPeriod: number;
  spectralAcceleration: number;
  designBaseShear: number;
  designBaseShearCoefficient: number;
  lateralForceDistribution: { storey: number; force: number }[];
  recommendations: string[];
  warnings: string[];
}
```

### Materials Module (`src/png/materials.ts`)

#### API

```typescript
// Get material by ID
function getMaterialById(id: string): Material | undefined;

// Get materials by category
function getMaterialsByCategory(category: MaterialCategory): Material[];

// Get materials available in a province
function getMaterialsByAvailability(province: string): Material[];

// Search materials
function searchMaterials(query: string): Material[];

// Get materials for specific application
function getMaterialsForApplication(application: string): Material[];

// Get termite-resistant materials
function getTermiteResistantMaterials(): Material[];

// Get marine-grade materials
function getMarineGradeMaterials(): Material[];

// Estimate material cost
function estimateMaterialCost(
  materialId: string,
  quantity: number,
  province: string
): MaterialCostEstimate | null;
```

#### Data Structures

```typescript
interface Material {
  id: string;
  name: string;
  localName?: string;
  category: MaterialCategory;
  description: string;
  availability: AvailabilityLevel;
  availableProvinces: string[];
  properties: MaterialProperties;
  durability: DurabilityProperties;
  sustainability: SustainabilityProperties;
  costIndicator: 1 | 2 | 3 | 4 | 5;
  skillRequired: 'basic' | 'moderate' | 'specialized';
  applications: string[];
  limitations: string[];
  recommendations: string[];
}
```

### Flood Module (`src/png/flood.ts`)

#### API

```typescript
// Get flood zone data
function getFloodZoneData(zone: PNGFloodZone): FloodZoneData;

// Get terrain flood risk
function getTerrainFloodRisk(terrainType: PNGTerrainType): PNGFloodZone;

// Get river systems for province
function getRiverSystemsForProvince(province: PNGProvince): RiverSystemData[];

// Estimate flood levels
function estimateFloodLevels(
  terrainType: PNGTerrainType,
  distanceFromWater: number,
  groundElevation: number,
  isCoastal: boolean
): FloodLevelEstimate[];

// Design for flood zone
function designForFloodZone(
  floodZone: PNGFloodZone,
  buildingType: string,
  designFloodLevel: number
): FloodResistantDesign;

// Generate flood report
function generateFloodReport(
  province: PNGProvince,
  terrainType: PNGTerrainType,
  distanceFromWater: number,
  groundElevation: number,
  buildingType: string,
  isCoastal: boolean
): FloodReport;
```

### Structural Module (`src/png/structural.ts`)

#### API

```typescript
// Design timber beam
function designTimberBeam(
  span: number,
  tributaryWidth: number,
  deadLoad: number,
  liveLoad: number,
  timberGrade: string,
  climateZone: PNGClimateZone
): TimberMemberDesign;

// Design concrete footing
function designConcreteFooting(
  columnLoad: number,
  soilBearingCapacity: number,
  province: string,
  isCoastal: boolean
): ConcreteDesign;

// Design roof for PNG
function designRoofForPNG(
  span: number,
  roofType: 'gable' | 'hip' | 'skillion' | 'flat',
  climateZone: PNGClimateZone,
  seismicZone: PNGSeismicZone,
  windRegion: 'standard' | 'cyclonic'
): RoofDesignResult;

// Generate load combinations
function generateLoadCombinations(
  hasWind: boolean,
  hasSeismic: boolean,
  hasFlood: boolean
): LoadCombination[];

// Generate structural report
function generateStructuralReport(
  projectName: string,
  location: string,
  climateZone: PNGClimateZone,
  seismicZone: PNGSeismicZone,
  memberDesigns: (TimberMemberDesign | ConcreteDesign)[]
): StructuralReport;
```

---

## UI Components

### Component Hierarchy

```
App
├── MenuBar
├── Toolbar
├── LayerPanel
├── Canvas
├── PropertiesPanel
├── PNGAnalysisPanel
│   ├── ClimateTab
│   ├── SeismicTab
│   ├── FloodTab
│   ├── MaterialsTab
│   └── StructuralTab
├── StatusBar
└── ProjectDialog
```

### Canvas Component

The main drawing canvas using HTML5 Canvas.

```typescript
interface CanvasProps {
  project: Project | null;
  activeTool: DrawingTool;
  activeLayerId: string;
}

// Key hooks used
const { isDrawing, currentPoints, ... } = useCADStore();
const toWorld = useCallback((screenPoint) => screenToWorld(...), [...]);
const toScreen = useCallback((worldPoint) => worldToScreen(...), [...]);
```

### State Management Store

Using Zustand for state management:

```typescript
interface CADState {
  // Project state
  project: Project | null;
  isModified: boolean;

  // Tool state
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentPoints: Point2D[];

  // Selection
  selectedEntityIds: string[];
  activeLayerId: string;

  // Settings
  gridSettings: GridSettings;
  snapSettings: SnapSettings;

  // Actions
  setProject: (project: Project) => void;
  addEntity: (entity: Entity) => void;
  selectEntity: (id: string, addToSelection?: boolean) => void;
  // ... more actions
}

// Usage
const { project, addEntity, selectEntity } = useCADStore();
```

---

## State Management

### Store Structure

```typescript
// src/ui/store/cadStore.ts
export const useCADStore = create<CADState>()(
  persist(
    (set, get) => ({
      // Initial state
      project: null,
      activeTool: 'select',
      selectedEntityIds: [],
      // ...

      // Actions
      setProject: (project) => set({ project }),
      addEntity: (entity) => set((state) => ({
        project: {
          ...state.project,
          entities: [...state.project.entities, entity],
        },
      })),
      // ...
    }),
    {
      name: 'png-cad-store',
      partialize: (state) => ({
        gridSettings: state.gridSettings,
        snapSettings: state.snapSettings,
      }),
    }
  )
);
```

### Offline Storage

```typescript
// src/ui/hooks/useOfflineStorage.ts
export function useOfflineStorage() {
  const saveProject = useCallback(async (project: Project) => {
    // Save to localStorage
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    projects[project.id] = { ... };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    const projects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return projects[projectId] ? JSON.parse(projects[projectId].data) : null;
  }, []);

  return { saveProject, loadProject, getRecentProjects, ... };
}
```

---

## Extending the Application

### Adding a New Drawing Tool

1. Add tool type to `DrawingTool` in `types.ts`:

```typescript
type DrawingTool = ... | 'my-new-tool';
```

2. Add tool definition in `Toolbar.tsx`:

```typescript
const TOOLS: ToolDefinition[] = [
  // ...
  { id: 'my-new-tool', name: 'My Tool', icon: '🔧', shortcut: 'MT', group: 'draw' },
];
```

3. Handle tool in `Canvas.tsx`:

```typescript
case 'my-new-tool':
  // Handle mouse events for new tool
  break;
```

4. Add keyboard shortcut in `App.tsx`:

```typescript
case 'mt':
  setActiveTool('my-new-tool');
  break;
```

### Adding a New PNG Analysis Module

1. Create new module file in `src/png/`:

```typescript
// src/png/my-analysis.ts
export interface MyAnalysisInput { ... }
export interface MyAnalysisResult { ... }

export function performMyAnalysis(input: MyAnalysisInput): MyAnalysisResult {
  // Analysis logic
}
```

2. Export from `src/png/index.ts`:

```typescript
export * from './my-analysis';
```

3. Create UI component:

```typescript
// src/ui/components/MyAnalysisTab.tsx
function MyAnalysisTab({ project }: { project: Project }) {
  const result = useMemo(() => performMyAnalysis({ ... }), [project]);
  return <div>...</div>;
}
```

4. Add tab to `PNGAnalysisPanel.tsx`

### Adding New Entity Type

1. Define entity interface in `types.ts`:

```typescript
interface MyEntityEntity extends BaseEntity {
  type: 'my-entity';
  // entity-specific properties
}
```

2. Add to Entity union type:

```typescript
type Entity = ... | MyEntityEntity;
```

3. Handle in `getEntityBoundingBox`:

```typescript
case 'my-entity':
  return { ... };
```

4. Handle rendering in Canvas `drawEntity`:

```typescript
case 'my-entity':
  // Draw entity
  break;
```

---

## Testing

### Test Structure

```
tests/
├── core/
│   ├── geometry.test.ts
│   ├── engine.test.ts
│   └── types.test.ts
├── png/
│   ├── climate.test.ts
│   ├── seismic.test.ts
│   ├── flood.test.ts
│   ├── materials.test.ts
│   └── structural.test.ts
├── ui/
│   ├── components/
│   └── store/
└── integration/
    └── project.test.ts
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- geometry.test.ts

# Watch mode
npm run test:watch
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { distance, midpoint } from '../src/core/geometry';

describe('Geometry', () => {
  describe('distance', () => {
    it('should calculate distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(distance(p1, p2)).toBe(5);
    });
  });
});
```

---

## Building and Deployment

### Development

```bash
# Install dependencies
npm install

# Start development server (web)
npm run start:web

# Start Electron development
npm run start:desktop
```

### Production Build

```bash
# Build web application
npm run build:web

# Build desktop application
npm run build:desktop

# Build both
npm run build
```

### Deployment

#### Web Application

Deploy the `dist/` folder to any static hosting:
- Nginx
- Apache
- AWS S3 + CloudFront
- Vercel
- Netlify

#### Desktop Application

The Electron builder creates installers for:
- Windows: `.exe` installer
- macOS: `.dmg` (requires macOS build machine)
- Linux: `.AppImage`, `.deb`

---

## Code Style

### TypeScript Guidelines

1. Use explicit types for function parameters and returns
2. Prefer interfaces over type aliases for objects
3. Use union types for enumerations
4. Document public APIs with JSDoc comments

### React Guidelines

1. Use functional components with hooks
2. Memoize expensive calculations with `useMemo`
3. Use `useCallback` for event handlers passed to children
4. Keep components focused and small

### Naming Conventions

- `PascalCase`: Types, interfaces, components
- `camelCase`: Functions, variables, methods
- `SCREAMING_SNAKE_CASE`: Constants
- `kebab-case`: File names (CSS, HTML)

---

*PNG Civil CAD Developer Guide v1.0*
