import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { LwIconComponent } from '../icon/icon.component';
import { LwMapMaterialPreset } from '../map-png-asset-browser/map-png-asset-browser.component';

export type LwMapInspectorTab = 'transform' | 'appearance' | 'advanced';

export interface LwSelectedSceneNode {
  readonly id: string;
  readonly name: string;
  readonly kind: 'wall' | 'room' | 'door' | 'prop' | 'terrain' | 'scatter' | 'water' | 'light' | 'token' | 'annotation';
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
  readonly scatterDensity = input<number>(68);
  readonly scatterSlopeMax = input<number>(35);
  readonly waterFlowSpeed = input<number>(1.4);
  readonly torchIntensity = input<number>(85);

  readonly materialChange = output<string>();
  readonly heightSquaresChange = output<number>();
  readonly thicknessChange = output<number>();
  readonly rotationChange = output<number>();
  readonly scaleChange = output<number>();
  readonly elevationChange = output<number>();
  readonly secretToggle = output<void>();
  readonly applyToSimilar = output<void>();
  readonly duplicateNode = output<void>();
  readonly deleteNode = output<void>();
  readonly scatterDensityChange = output<number>();
  readonly waterFlowChange = output<number>();
  readonly torchIntensityChange = output<number>();

  readonly activeTab = signal<LwMapInspectorTab>('appearance');

  selectTab(tab: LwMapInspectorTab): void {
    this.activeTab.set(tab);
  }

  onMaterialSelect(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (select?.value) {
      this.materialChange.emit(select.value);
    }
  }

  onHeightSelect(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    const parsed = Number(select?.value ?? 2);
    if (!Number.isNaN(parsed)) {
      this.heightSquaresChange.emit(parsed);
    }
  }

  onThicknessInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const parsed = Number(inputEl?.value ?? 1);
    if (!Number.isNaN(parsed)) {
      this.thicknessChange.emit(parsed);
    }
  }

  onRotationInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const parsed = Number(inputEl?.value ?? 0);
    if (!Number.isNaN(parsed)) {
      this.rotationChange.emit(parsed);
    }
  }

  onScaleInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const parsed = Number(inputEl?.value ?? 1);
    if (!Number.isNaN(parsed)) {
      this.scaleChange.emit(parsed);
    }
  }

  onElevationInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const parsed = Number(inputEl?.value ?? 0);
    if (!Number.isNaN(parsed)) {
      this.elevationChange.emit(parsed);
    }
  }

  onScatterDensityInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    this.scatterDensityChange.emit(Number(inputEl?.value ?? 68));
  }

  onWaterFlowInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    this.waterFlowChange.emit(Number(inputEl?.value ?? 1.4));
  }

  onTorchIntensityInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    this.torchIntensityChange.emit(Number(inputEl?.value ?? 85));
  }
}
