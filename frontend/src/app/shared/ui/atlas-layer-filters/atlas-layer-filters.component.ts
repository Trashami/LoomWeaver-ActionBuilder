import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import {
  AtlasLayerFilterId,
  AtlasLayerFilterOption,
  PlayerVisibilityMode,
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
  readonly playerVisibilityMode = input<PlayerVisibilityMode>('auto_lore_revealed');

  readonly layerToggled = output<AtlasLayerFilterId>();
  readonly showAllRequested = output<void>();
  readonly clearAllRequested = output<void>();
  readonly resetRequested = output<void>();
  readonly mapSelected = output<string>();
  readonly sessionFilterChanged = output<number | 'all'>();
  readonly playerVisibilityModeChanged = output<PlayerVisibilityMode>();
  readonly createLocationRequested = output<void>();
  readonly editMapRequested = output<void>();

  readonly filterMenuOpen = signal<boolean>(false);

  isLayerActive(id: AtlasLayerFilterId): boolean {
    return this.activeLayerIds().includes(id);
  }

  onSessionSelect(value: string): void {
    this.sessionFilterChanged.emit(value === 'all' ? 'all' : Number(value));
  }

  onVisibilityPolicyChange(value: string): void {
    this.playerVisibilityModeChanged.emit(
      value === 'manual_dm' ? 'manual_dm' : 'auto_lore_revealed',
    );
  }
}
