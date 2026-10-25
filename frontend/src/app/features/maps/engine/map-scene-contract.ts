export type MapRenderMode = '2D Blueprint' | '3D Tabletop' | 'Linked 2D <-> 3D';

export interface MapToolDefinition {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

export interface MapCommandEntry {
  readonly id: string;
  readonly timestamp: string;
  readonly toolId: string;
  readonly summary: string;
}

export interface MapStampNode {
  readonly id: string;
  readonly label: string;
  readonly category: 'POI' | 'Prop' | 'Token' | 'Architecture';
  readonly entityCompositeKey?: string;
  readonly x: number;
  readonly z: number;
  readonly scale: number;
  readonly rotationY: number;
  readonly colorHex: string;
}

export interface WaterSplineNode {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly colorHex: string;
  readonly points: readonly (readonly [number, number, number])[];
}

export interface LightSourceNode {
  readonly id: string;
  readonly label: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly range: number;
  readonly intensity: number;
  readonly colorHex: string;
}

export interface MapSceneGraphState {
  readonly sceneKey: string;
  readonly name: string;
  readonly biome: string;
  readonly revision: number;
  readonly scatterSeed: number;
  readonly scatterDensity: number;
  readonly terrainRelief: number;
  readonly stamps: readonly MapStampNode[];
  readonly waterSplines: readonly WaterSplineNode[];
  readonly lights: readonly LightSourceNode[];
}

export const MAP_STUDIO_TOOLS: readonly MapToolDefinition[] = [
  { id: 'terrain', label: 'Floor & Biome Brush', icon: 'layers', description: 'Sculpt relief & blend multi-layer PBR stone, moss, and obsidian' },
  { id: 'walls', label: 'Walls & Portals', icon: 'shield', description: 'Place line-of-sight blockers, gothic arches, and secret doors' },
  { id: 'stamps', label: '2D/3D Linked Stamps', icon: 'map-pin', description: 'Click canvas to place linked 2D symbols & 3D tabletop meshes' },
  { id: 'scatter', label: 'Procedural Scatter', icon: 'sparkles', description: 'Regenerate deterministic instanced foliage, rubble, and runes' },
  { id: 'water', label: 'Water & Lava Splines', icon: 'flame', description: 'Extend directional canal/river splines across the terrain' },
  { id: 'lighting', label: '2.5D Lighting & Fog', icon: 'eye', description: 'Click canvas to spawn dynamic point lights & shadow emitters' },
];
