export type MapRenderMode = '2D Blueprint' | '3D Tabletop' | 'Linked 2D <-> 3D';

export type WallDrawMode =
  | 'room'
  | 'hexagon'
  | 'octagon'
  | 'l_shape'
  | 'circle'
  | 'cave'
  | 'line'
  | 'triangle';

export type CutawayPerspectiveMode = 'topdown' | 'auto' | 'heavy';
export type CutawayProjectionMode = 'inward' | 'fixed-south';

export type WallOpeningType =
  | 'door'
  | 'door_open'
  | 'double_door'
  | 'archway'
  | 'window'
  | 'bars'
  | 'breach'
  | 'secret_door';

export type PathRibbonStyle =
  | 'cobble_path'
  | 'dirt_road'
  | 'cliff_ridge'
  | 'stone_stairs'
  | 'mine_tracks'
  | 'water_stream'
  | 'waterfall';

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
  readonly category: 'POI' | 'Prop' | 'Token' | 'Architecture' | 'DecalStamp';
  readonly entityCompositeKey?: string;
  readonly modelUrl?: string;
  readonly albedoUrl?: string;
  readonly normalUrl?: string;
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

export interface WallOpeningNode {
  readonly id: string;
  readonly type: WallOpeningType;
  readonly t: number;
  readonly widthMeters: number;
  readonly isOpen: boolean;
  readonly isSecret: boolean;
  readonly isRevealedToPlayers: boolean;
}

export interface MapWallSegmentNode {
  readonly id: string;
  readonly name: string;
  readonly drawMode: WallDrawMode;
  readonly material: string;
  readonly modelUrl?: string;
  readonly thicknessMeters: number;
  readonly heightMeters: number;
  readonly perspective: CutawayPerspectiveMode;
  readonly projection: CutawayProjectionMode;
  readonly hasCornerPosts: boolean;
  readonly levelIndex: number;
  readonly points: readonly (readonly [number, number])[];
  readonly openings: readonly WallOpeningNode[];
}

export interface MapPathRibbonNode {
  readonly id: string;
  readonly name: string;
  readonly style: PathRibbonStyle;
  readonly widthMeters: number;
  readonly curveAngleDeg: number;
  readonly cliffStrataBands: number;
  readonly colorHex: string;
  readonly levelIndex: number;
  readonly waypoints: readonly (readonly [number, number])[];
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
  readonly walls?: readonly MapWallSegmentNode[];
  readonly pathRibbons?: readonly MapPathRibbonNode[];
}

export const MAP_STUDIO_TOOLS: readonly MapToolDefinition[] = [
  { id: 'terrain', label: 'Floor & Biome Brush', icon: 'layers', description: 'Sculpt relief & blend multi-layer PBR stone, moss, and obsidian' },
  { id: 'walls', label: 'Cutaway Walls & Portals', icon: 'shield', description: 'Draw chambers, cutaway walls, fitted doors, and line-of-sight blockers' },
  { id: 'paths', label: 'Curved Paths & Cliffs', icon: 'compass', description: 'Trace curved cobblestone roads, limestone cliff ridges, and stairs' },
  { id: 'stamps', label: '2D/3D Linked Stamps', icon: 'map-pin', description: 'Click canvas to place linked 2D symbols & 3D tabletop meshes' },
  { id: 'scatter', label: 'Procedural Scatter', icon: 'book', description: 'Regenerate deterministic instanced foliage, rubble, and runes' },
  { id: 'water', label: 'Water & Lava Splines', icon: 'flame', description: 'Extend directional canal/river splines across the terrain' },
  { id: 'lighting', label: '2.5D Lighting & Fog', icon: 'eye', description: 'Click canvas to spawn dynamic point lights & shadow emitters' },
];
