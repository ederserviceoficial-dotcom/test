

export enum View {
  HOME = 'HOME',
  EDITOR = 'EDITOR',
  LENSES = 'LENSES',
  EXPORT = 'EXPORT'
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | 'Custom';

// Added CurvePoint interface for tonal curves and exported it to fix import error in LensesView
export interface CurvePoint {
  x: number;
  y: number;
}

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'adjustment';
  visible: boolean;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light';
  content: string; 
  x: number;
  y: number;
  scale: number;
  rotation: number;
  settings?: Partial<ProjectSettings>;
  // Added optional properties for text and stylized layers to fix "property does not exist" errors
  fontSize?: number;
  color?: string;
}

export interface HistoryItem {
  id: string;
  label: string;
  timestamp: number;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  // --- Basic Adjustment Stack ---
  brightness: number;
  contrast: number;
  exposure: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
  saturation: number;
  vibrance: number;
  temperature: number;
  tint: number;
  sharpness: number;
  clarity: number;
  noiseReduction: number;
  dehaze: number;
  
  // --- Advanced Effects & Optics ---
  sepia: number;
  blur: number;
  vignette: number;
  grain: number;
  glow: number;
  bloom: number;
  chromaticAberration: number;
  hue: number;
  
  // --- Transform Matrix ---
  aspectRatio: AspectRatio;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  skewX: number;
  skewY: number;
  
  // --- AI & Logic Layers ---
  layers: Layer[];
  activeFilter: string;
  filterIntensity: number;
  maskBase64?: string;
  
  // --- Color Grading (Instructional) ---
  // Updated to use the exported CurvePoint interface instead of an inline type
  curves: CurvePoint[];
  hsl: Record<string, {h: number, s: number, l: number}>;
  // Added cropRect property which is utilized in ExportView.tsx for final rendering
  cropRect?: { x: number; y: number; width: number; height: number };
}

export interface Project {
  id: string;
  title: string;
  thumbnail: string;
  type: 'photo' | 'video';
  lastEdited: string;
  settings: ProjectSettings;
}
