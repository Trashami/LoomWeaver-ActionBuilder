import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { WallDrawMode } from '../../../features/maps/engine/map-scene-contract';
import { LwIconComponent } from '../icon/icon.component';
import { LwMapMaterialPreset } from '../map-png-asset-browser/map-png-asset-browser.component';

export type LwTerrainSculptOp = 'raise' | 'lower' | 'flatten';
export type LwCelestialBodyMode = 'sun' | 'moon';
export type LwCustomLightKind = 'point' | 'directional' | 'torch';

export interface LwSelectedSceneNode {
  readonly id: string;
  readonly name: string;
  readonly kind:
    | 'wall'
    | 'room'
    | 'door'
    | 'prop'
    | 'terrain'
    | 'scatter'
    | 'water'
    | 'light'
    | 'token'
    | 'annotation';
  readonly subtitle: string;
  readonly thumbnailUrl: string;
  readonly modelUrl?: string;
  readonly albedoUrl?: string;
  readonly normalUrl?: string;
  readonly isFloor?: boolean;
  readonly materialId: string;
  readonly heightSquares: number;
  readonly thickness: number;
  readonly gridX: number;
  readonly gridZ: number;
  readonly elevationY: number;
  readonly rotationDeg: number;
  readonly scale: number;
  readonly gmSecretOnly: boolean;
  readonly blocksMovement: boolean;
  readonly blocksVision: boolean;
}

@Component({
  selector: 'lw-map-properties-inspector',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  templateUrl: './map-properties-inspector.component.html',
  styleUrl: './map-properties-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapPropertiesInspectorComponent {
  readonly activeToolId = input<string>('select');
  readonly selectedNode = input<LwSelectedSceneNode | null>(null);
  readonly hasPlacedSelection = input<boolean>(false);
  readonly wallInProgress = input<boolean>(false);
  readonly materials = input<readonly LwMapMaterialPreset[]>([]);
  readonly wallDrawMode = input<WallDrawMode>('line');
  readonly floorTilingScale = input<number>(10);
  readonly terrainSculptOp = input<LwTerrainSculptOp>('raise');
  readonly terrainBrushRadius = input<number>(4.5);
  readonly terrainBrushDelta = input<number>(1.4);

  readonly celestialMode = input<LwCelestialBodyMode>('sun');
  readonly celestialAzimuthDeg = input<number>(135);
  readonly celestialAltitudeDeg = input<number>(42);
  readonly shadowDarkness = input<number>(72);
  readonly customLightKind = input<LwCustomLightKind>('point');
  readonly customLightColor = input<string>('#ffae52');
  readonly customLightRange = input<number>(25);
  readonly torchIntensity = input<number>(115);

  readonly scatterDensity = input<number>(0);
  readonly waterFlowSpeed = input<number>(1.4);

  readonly openAssetModal = output<void>();
  readonly cancelPlacement = output<void>();
  readonly resetTerrain = output<void>();
  readonly floorTilingChange = output<number>();
  readonly materialChange = output<string>();
  readonly heightSquaresChange = output<number>();
  readonly thicknessChange = output<number>();
  readonly positionXChange = output<number>();
  readonly positionZChange = output<number>();
  readonly rotationChange = output<number>();
  readonly scaleChange = output<number>();
  readonly elevationChange = output<number>();
  readonly wallDrawModeChange = output<WallDrawMode>();
  readonly terrainSculptOpChange = output<LwTerrainSculptOp>();
  readonly terrainRadiusChange = output<number>();
  readonly terrainDeltaChange = output<number>();
  readonly celestialModeChange = output<LwCelestialBodyMode>();
  readonly celestialAzimuthChange = output<number>();
  readonly celestialAltitudeChange = output<number>();
  readonly shadowDarknessChange = output<number>();
  readonly customLightKindChange = output<LwCustomLightKind>();
  readonly customLightColorChange = output<string>();
  readonly customLightRangeChange = output<number>();
  readonly torchIntensityChange = output<number>();
  readonly spawnCustomLight = output<void>();
  readonly secretToggle = output<void>();
  readonly applyToSimilar = output<void>();
  readonly duplicateNode = output<void>();
  readonly deleteNode = output<void>();
  readonly scatterDensityChange = output<number>();
  readonly waterFlowChange = output<number>();

  readonly toolHeading = computed<string>(() => {
    const map: Record<string, string> = {
      select: 'Scene Selection Inspector',
      'floor-bump': 'Flooring Bump/Height Setup',
      terrain: 'Raise / Lower Terrain Brush',
      wall: '3D Wall Line Placement',
      room: '3D Wall Shape Placement',
      door: 'Door & Portal Placement',
      objects: '3D Object & Floor Stamp Setup',
      lighting: 'Custom Scene Lights',
      'sun-moon': 'Sun / Moon & Shadow Position',
      water: 'Water Spline Settings',
      scatter: '3D Scatter Brush Setup',
      annotate: 'Map Annotation Setup',
    };
    return map[this.activeToolId()] ?? 'Tool Settings';
  });

  readonly usesAssetPicker = computed<boolean>(() => {
    const t = this.activeToolId();
    return (
      t === 'floor-bump' ||
      t === 'wall' ||
      t === 'room' ||
      t === 'door' ||
      t === 'objects' ||
      t === 'scatter' ||
      t === 'annotate'
    );
  });

  onNumInput(event: Event, emitter: { emit: (v: number) => void }): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement | null;
    const parsed = Number(el?.value ?? 0);
    if (!Number.isNaN(parsed)) {
      emitter.emit(parsed);
    }
  }

  onStrInput<T extends string = string>(event: Event, emitter: { emit: (v: T) => void }): void {
    const el = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (el?.value !== undefined) {
      emitter.emit(el.value as T);
    }
  }

  onWallModeSelect(event: Event): void {
    const el = event.target as HTMLSelectElement | null;
    if (el?.value) {
      this.wallDrawModeChange.emit(el.value as WallDrawMode);
    }
  }
}
