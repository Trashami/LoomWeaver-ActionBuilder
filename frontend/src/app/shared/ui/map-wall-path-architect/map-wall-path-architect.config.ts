import {
  CutawayPerspectiveMode,
  CutawayProjectionMode,
  PathRibbonStyle,
  WallDrawMode,
  WallOpeningType,
} from '../../../features/maps/engine/map-scene-contract';

export type WallPathArchitectVariant = 'compact' | 'standard' | 'detailed';

export interface MapWallPathArchitectConfig {
  readonly variant: WallPathArchitectVariant;
  readonly allowSecretDoors?: boolean;
  readonly showPathBuilder?: boolean;
}

export const DEFAULT_WALL_PATH_ARCHITECT_CONFIG: MapWallPathArchitectConfig = {
  variant: 'standard',
  allowSecretDoors: true,
  showPathBuilder: true,
};

export interface ChamberBuildIntent {
  readonly name: string;
  readonly drawMode: WallDrawMode;
  readonly material: string;
  readonly widthMeters: number;
  readonly depthMeters: number;
  readonly thicknessMeters: number;
  readonly heightMeters: number;
  readonly perspective: CutawayPerspectiveMode;
  readonly projection: CutawayProjectionMode;
  readonly hasCornerPosts: boolean;
}

export interface WallOpeningInsertIntent {
  readonly wallId: string;
  readonly openingType: WallOpeningType;
  readonly normalizedT: number;
  readonly widthMeters: number;
  readonly isOpen: boolean;
  readonly isSecret: boolean;
}

export interface PathRibbonBuildIntent {
  readonly name: string;
  readonly style: PathRibbonStyle;
  readonly widthMeters: number;
  readonly curveAngleDeg: number;
  readonly cliffStrataBands: number;
  readonly colorHex: string;
}
