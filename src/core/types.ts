/**
 * Core type definitions for PNG Civil Engineering CAD
 */

// ============================================
// Geometric Types
// ============================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Transform {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // in radians
}

// ============================================
// Drawing Entity Types
// ============================================

export type EntityType =
  | 'line'
  | 'polyline'
  | 'circle'
  | 'arc'
  | 'rectangle'
  | 'polygon'
  | 'text'
  | 'dimension'
  | 'hatch'
  | 'block'
  | 'image';

export interface BaseEntity {
  id: string;
  type: EntityType;
  layerId: string;
  visible: boolean;
  locked: boolean;
  style: EntityStyle;
  metadata?: Record<string, unknown>;
}

export interface EntityStyle {
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
  opacity: number;
  lineType: LineType;
}

export type LineType =
  | 'continuous'
  | 'dashed'
  | 'dotted'
  | 'dashdot'
  | 'center'
  | 'hidden'
  | 'phantom';

export interface LineEntity extends BaseEntity {
  type: 'line';
  startPoint: Point2D;
  endPoint: Point2D;
}

export interface PolylineEntity extends BaseEntity {
  type: 'polyline';
  points: Point2D[];
  closed: boolean;
}

export interface CircleEntity extends BaseEntity {
  type: 'circle';
  center: Point2D;
  radius: number;
}

export interface ArcEntity extends BaseEntity {
  type: 'arc';
  center: Point2D;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface RectangleEntity extends BaseEntity {
  type: 'rectangle';
  topLeft: Point2D;
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface PolygonEntity extends BaseEntity {
  type: 'polygon';
  center: Point2D;
  radius: number;
  sides: number;
  rotation: number;
}

export interface TextEntity extends BaseEntity {
  type: 'text';
  position: Point2D;
  content: string;
  fontSize: number;
  fontFamily: string;
  alignment: 'left' | 'center' | 'right';
  rotation: number;
}

export interface DimensionEntity extends BaseEntity {
  type: 'dimension';
  dimensionType: 'linear' | 'angular' | 'radial' | 'diameter';
  startPoint: Point2D;
  endPoint: Point2D;
  textPosition: Point2D;
  value: number;
  unit: MeasurementUnit;
  prefix?: string;
  suffix?: string;
}

export interface HatchEntity extends BaseEntity {
  type: 'hatch';
  boundary: Point2D[];
  pattern: HatchPattern;
  scale: number;
  angle: number;
}

export type HatchPattern =
  | 'solid'
  | 'ansi31' // Steel
  | 'ansi32' // Brass/Bronze
  | 'ansi33' // Rubber
  | 'ansi34' // Plastic
  | 'ansi35' // Fire brick
  | 'ansi36' // Marble
  | 'ansi37' // Lead
  | 'ansi38' // Zinc
  | 'concrete'
  | 'earth'
  | 'gravel'
  | 'sand'
  | 'water'
  | 'grass'
  | 'timber'; // PNG timber patterns

export interface BlockEntity extends BaseEntity {
  type: 'block';
  blockId: string;
  insertionPoint: Point2D;
  scale: Point2D;
  rotation: number;
}

export type Entity =
  | LineEntity
  | PolylineEntity
  | CircleEntity
  | ArcEntity
  | RectangleEntity
  | PolygonEntity
  | TextEntity
  | DimensionEntity
  | HatchEntity
  | BlockEntity;

// ============================================
// Layer Types
// ============================================

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  lineType: LineType;
  lineWeight: number;
  order: number;
}

// ============================================
// Block Definition Types
// ============================================

export interface BlockDefinition {
  id: string;
  name: string;
  description: string;
  category: BlockCategory;
  entities: Entity[];
  basePoint: Point2D;
  attributes: BlockAttribute[];
}

export type BlockCategory =
  | 'structural'
  | 'electrical'
  | 'plumbing'
  | 'furniture'
  | 'landscaping'
  | 'civil'
  | 'annotation'
  | 'png-specific';

export interface BlockAttribute {
  id: string;
  name: string;
  prompt: string;
  defaultValue: string;
  visible: boolean;
}

// ============================================
// Measurement & Units
// ============================================

export type MeasurementUnit =
  | 'mm'
  | 'm'
  | 'km'
  | 'inches'
  | 'feet';

export interface UnitSettings {
  lengthUnit: MeasurementUnit;
  areaUnit: 'sqm' | 'sqft' | 'hectares' | 'acres';
  angleUnit: 'degrees' | 'radians' | 'gradians';
  precision: number;
}

// ============================================
// Grid & Snap Settings
// ============================================

export interface GridSettings {
  visible: boolean;
  spacing: number;
  majorLineEvery: number;
  color: string;
  majorColor: string;
  opacity: number;
}

export interface SnapSettings {
  enabled: boolean;
  gridSnap: boolean;
  endpointSnap: boolean;
  midpointSnap: boolean;
  centerSnap: boolean;
  intersectionSnap: boolean;
  perpendicularSnap: boolean;
  tangentSnap: boolean;
  nearestSnap: boolean;
  snapDistance: number;
}

// ============================================
// Viewport Types
// ============================================

export interface Viewport {
  id: string;
  name: string;
  bounds: BoundingBox;
  zoom: number;
  pan: Point2D;
  rotation: number;
  isActive: boolean;
}

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  modifiedAt: Date;
  author: string;
  location: PNGLocation;
  projectType: ProjectType;
  units: UnitSettings;
  layers: Layer[];
  entities: Entity[];
  blocks: BlockDefinition[];
  viewports: Viewport[];
  metadata: ProjectMetadata;
}

export type ProjectType =
  | 'building'
  | 'road'
  | 'bridge'
  | 'water-supply'
  | 'drainage'
  | 'sanitation'
  | 'site-plan'
  | 'survey'
  | 'general';

export interface ProjectMetadata {
  client?: string;
  projectNumber?: string;
  phase?: string;
  standards: string[];
  climateZone?: PNGClimateZone;
  seismicZone?: PNGSeismicZone;
  floodZone?: PNGFloodZone;
  customFields?: Record<string, string>;
}

// ============================================
// PNG-Specific Types
// ============================================

export interface PNGLocation {
  province: PNGProvince;
  district?: string;
  village?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  };
  terrainType: PNGTerrainType;
}

export type PNGProvince =
  | 'Central'
  | 'East New Britain'
  | 'East Sepik'
  | 'Eastern Highlands'
  | 'Enga'
  | 'Gulf'
  | 'Hela'
  | 'Jiwaka'
  | 'Madang'
  | 'Manus'
  | 'Milne Bay'
  | 'Morobe'
  | 'National Capital District'
  | 'New Ireland'
  | 'Oro'
  | 'Sandaun'
  | 'Simbu'
  | 'Southern Highlands'
  | 'West New Britain'
  | 'Western'
  | 'Western Highlands'
  | 'Autonomous Region of Bougainville';

export type PNGTerrainType =
  | 'coastal-lowland'
  | 'riverine-floodplain'
  | 'highland-valley'
  | 'mountainous'
  | 'island-atoll'
  | 'swamp-wetland';

export type PNGClimateZone =
  | 'tropical-coastal'      // Hot, humid, high rainfall
  | 'tropical-highland'     // Cooler, moderate rainfall
  | 'tropical-monsoon'      // Seasonal heavy rainfall
  | 'tropical-island';      // Marine influenced

export type PNGSeismicZone =
  | 'zone-1'  // Low seismic hazard
  | 'zone-2'  // Moderate seismic hazard
  | 'zone-3'  // High seismic hazard
  | 'zone-4'; // Very high seismic hazard (near plate boundaries)

export type PNGFloodZone =
  | 'minimal'      // Minimal flood risk
  | 'moderate'     // 100-year flood zone
  | 'high'         // 50-year flood zone
  | 'very-high';   // Annual flood zone

// ============================================
// Tool Types
// ============================================

export type DrawingTool =
  | 'select'
  | 'pan'
  | 'zoom'
  | 'line'
  | 'polyline'
  | 'circle'
  | 'arc'
  | 'rectangle'
  | 'polygon'
  | 'text'
  | 'dimension'
  | 'hatch'
  | 'block'
  | 'measure'
  | 'trim'
  | 'extend'
  | 'offset'
  | 'mirror'
  | 'rotate'
  | 'scale'
  | 'array';

export interface ToolState {
  activeTool: DrawingTool;
  isDrawing: boolean;
  currentPoints: Point2D[];
  previewEntity?: Entity;
  selectedEntities: string[];
  clipboard: Entity[];
}

// ============================================
// Application State
// ============================================

export interface AppState {
  project: Project | null;
  tool: ToolState;
  grid: GridSettings;
  snap: SnapSettings;
  activeLayerId: string;
  activeViewportId: string;
  commandHistory: Command[];
  undoStack: Command[];
  redoStack: Command[];
  isModified: boolean;
  isSaving: boolean;
  isOffline: boolean;
}

export interface Command {
  id: string;
  type: string;
  timestamp: Date;
  data: unknown;
  undo: () => void;
  redo: () => void;
}
