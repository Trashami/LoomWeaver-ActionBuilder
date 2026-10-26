import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MapGridConfig,
  MapLayerBlendMode,
  MapStudioLayer,
  StampOcclusionMode,
} from '../../../features/maps/application/map-studio.models';
import { LightSourceNode, MapStampNode } from '../../../features/maps/engine/map-scene-contract';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

@Component({
  selector: 'lw-map-layers-drawer',
  standalone: true,
  imports: [FormsModule, LwBadgeComponent, LwButtonComponent],
  templateUrl: './map-layers-drawer.component.html',
  styleUrl: './map-layers-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapLayersDrawerComponent {
  readonly layers = input<readonly MapStudioLayer[]>([]);
  readonly activeLayerId = input<string>('layer-objects');
  readonly stamps = input<readonly MapStampNode[]>([]);
  readonly lights = input<readonly LightSourceNode[]>([]);
  readonly selectedStampId = input<string>('st-emrys');
  readonly selectedOcclusionMode = input<StampOcclusionMode>('fade');
  readonly gridConfig = input<MapGridConfig>({
    gridType: 'square',
    gridSizePx: 50,
    gridOpacityPercent: 40,
    showGrid: true,
    snapToGrid: true,
    mapScope: 'battlemap',
  });

  readonly activeTab = signal<'layers' | 'objects' | 'grid'>('layers');
  readonly objectSearch = signal<string>('');
  readonly blendModes: readonly MapLayerBlendMode[] = ['normal', 'multiply', 'screen', 'overlay'];
  readonly occlusionModes: readonly StampOcclusionMode[] = ['fade', 'radial', 'hide'];

  readonly filteredStamps = computed(() => {
    const q = this.objectSearch().trim().toLowerCase();
    if (!q) return this.stamps();
    return this.stamps().filter(
      (s) => s.label.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  });

  readonly selectedStamp = computed(
    () => this.stamps().find((s) => s.id === this.selectedStampId()) ?? this.stamps()[0],
  );

  readonly layerSelected = output<string>();
  readonly layerVisibilityToggled = output<string>();
  readonly layerLockToggled = output<string>();
  readonly layerOpacityChanged = output<{ layerId: string; opacityPercent: number }>();
  readonly layerBlendChanged = output<{ layerId: string; blendMode: MapLayerBlendMode }>();
  readonly addCustomLayerRequested = output<void>();
  readonly stampSelected = output<string>();
  readonly stampTransformChanged = output<{ stampId: string; scale: number; rotationY: number }>();
  readonly stampDeleted = output<string>();
  readonly occlusionModeChanged = output<StampOcclusionMode>();
  readonly gridConfigChanged = output<MapGridConfig>();

  updateGridPatch(patch: Partial<MapGridConfig>): void {
    this.gridConfigChanged.emit({ ...this.gridConfig(), ...patch });
  }
}
