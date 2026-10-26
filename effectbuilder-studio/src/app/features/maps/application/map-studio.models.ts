import { MapSceneGraphState } from '../engine/map-scene-contract';

export type MapGridType = 'square' | 'hex' | 'isometric';
export type MapScopeMode = 'battlemap' | 'world_map';
export type MapLayerBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';
export type StampOcclusionMode = 'fade' | 'radial' | 'hide';

export interface MapStudioLayer {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly icon: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacityPercent: number;
  readonly blendMode: MapLayerBlendMode;
  readonly zIndex: number;
}

export interface MapLevelFloor {
  readonly id: string;
  readonly levelIndex: number;
  readonly name: string;
  readonly elevationMinFt: number;
  readonly elevationMaxFt: number;
}

export interface MapGridConfig {
  readonly gridType: MapGridType;
  readonly gridSizePx: number;
  readonly gridOpacityPercent: number;
  readonly showGrid: boolean;
  readonly snapToGrid: boolean;
  readonly mapScope: MapScopeMode;
}

export interface MapPresetTemplate {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly mapScope: MapScopeMode;
  readonly description: string;
  readonly icon: string;
  readonly gridCols: number;
  readonly gridRows: number;
  readonly baseBiome: string;
  readonly ambientLighting: string;
  readonly assetCount: number;
  readonly previewBadge: string;
}

export interface MapCatalogAssetItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly subfolder: string;
  readonly assetType: string;
  readonly isLightAware3D: boolean;
  readonly isScatterReady: boolean;
  readonly defaultScale: number;
  readonly defaultHeightFt: number;
  readonly previewPath: string;
}

export interface MapStudioSnapshot {
  readonly label: string;
  readonly timestamp: string;
  readonly sceneGraph: MapSceneGraphState;
  readonly layers: readonly MapStudioLayer[];
  readonly activeLevelIndex: number;
}
