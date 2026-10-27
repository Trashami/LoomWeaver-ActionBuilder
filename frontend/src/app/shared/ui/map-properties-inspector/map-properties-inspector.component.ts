import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { WallDrawMode } from '../../../features/maps/engine/map-scene-contract';
import { LwIconComponent } from '../icon/icon.component';
import { LwMapMaterialPreset } from '../map-png-asset-browser/map-png-asset-browser.component';

export type LwMapInspectorTab = 'transform' | 'appearance' | 'lighting';
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
  readonly lightColorHex?: string;
  readonly lightRangeFt?: number;
  readonly lightIntensity?: number;
}

@Component({
  selector: 'lw-map-properties-inspector',
  imports: [NgpButton, LwIconComponent],
  templateUrl: './map-properties-inspector.component.html',
  styleUrl: './map-properties-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapPropertiesInspectorComponent {
  readonly selectedNode = input<LwSelectedSceneNode | null>(null);
  readonly materials = input<readonly LwMapMaterialPreset[]>([]);
  readonly wallDrawMode = input<WallDrawMode>('line');
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

  readonly scatterDensity = input<number>(68);
  readonly waterFlowSpeed = input<number>(1.4);

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

  readonly activeTab = signal<LwMapInspectorTab>('appearance');

  selectTab(tab: LwMapInspectorTab): void {
    this.activeTab.set(tab);
  }

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
