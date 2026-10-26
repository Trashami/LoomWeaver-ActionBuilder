import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import {
  AtlasLayerFilterId,
  AtlasLayerFilterOption,
  WorldMapSummaryVm,
} from '../../../core/models/world-lore.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-atlas-layer-filters',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  templateUrl: './atlas-layer-filters.component.html',
  styleUrl: './atlas-layer-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAtlasLayerFiltersComponent {
  readonly filters = input.required<readonly AtlasLayerFilterOption[]>();
  readonly activeLayerIds = input.required<readonly AtlasLayerFilterId[]>();
  readonly maps = input<readonly WorldMapSummaryVm[]>([]);
  readonly activeMapId = input<string | null>(null);
  readonly breadcrumbs = input<readonly WorldMapSummaryVm[]>([]);
  readonly isGm = input<boolean>(false);
  readonly journeySessionFilter = input<number | 'all'>('all');

  readonly layerToggled = output<AtlasLayerFilterId>();
  readonly showAllRequested = output<void>();
  readonly clearAllRequested = output<void>();
  readonly resetRequested = output<void>();
  readonly mapSelected = output<string>();
  readonly sessionFilterChanged = output<number | 'all'>();
  readonly createLocationRequested = output<void>();

  readonly showExtendedFilters = signal<boolean>(false);

  isLayerActive(id: AtlasLayerFilterId): boolean {
    return this.activeLayerIds().includes(id);
  }

  onSessionSelect(value: string): void {
    this.sessionFilterChanged.emit(value === 'all' ? 'all' : Number(value));
  }
}
