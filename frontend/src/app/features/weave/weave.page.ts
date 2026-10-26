import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RecentWorldDiscoveryVm,
  WorldHierarchyScope,
  WorldMapMarkerVm,
} from '../../core/models/world-lore.models';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../core/services/world-lore-facade.service';
import {
  LwAtlasLayerFiltersComponent,
  LwIconComponent,
  LwLoreLibraryComponent,
  LwWeaveRelationshipsGraphComponent,
  LwWorldAtlasComponent,
  LwWorldHistoryComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'app-weave-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LwIconComponent,
    LwAtlasLayerFiltersComponent,
    LwWorldAtlasComponent,
    LwLoreLibraryComponent,
    LwWorldHistoryComponent,
    LwWeaveRelationshipsGraphComponent,
  ],
  templateUrl: './weave.page.html',
  styleUrl: './weave.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeavePageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly worldLore = inject(WorldLoreFacadeService);

  readonly createLocationModalOpen = signal<boolean>(false);
  readonly newLocName = signal<string>('');
  readonly newLocType = signal<string>('Settlement');
  readonly newLocHierarchy = signal<WorldHierarchyScope>('Settlement');
  readonly newLocStatus = signal<'visited' | 'known' | 'rumor' | 'undiscovered'>('known');
  readonly newLocVisibility = signal<'players' | 'gm'>('players');
  readonly newLocX = signal<number>(54);
  readonly newLocY = signal<number>(46);
  readonly newLocDescription = signal<string>('');

  onMarkerSelected(marker: WorldMapMarkerVm): void {
    this.worldLore.selectLocation(marker.locationKey);
  }

  onInspectLocationFromChild(locationKey: string): void {
    this.worldLore.selectLocation(locationKey);
    this.worldLore.setPrimaryTab('atlas');
  }

  onDiscoverySelected(disc: RecentWorldDiscoveryVm): void {
    if (disc.targetType === 'location') {
      this.worldLore.selectLocation(disc.targetKey);
    } else if (disc.targetType === 'lore') {
      this.worldLore.selectLoreEntry(disc.targetKey);
      this.worldLore.setPrimaryTab('lore');
    } else {
      this.store.inspectEntity(disc.targetKey);
    }
  }

  openAddLocationModal(coords?: { xPercent: number; yPercent: number }): void {
    this.newLocName.set('');
    this.newLocType.set('Settlement');
    this.newLocHierarchy.set('Settlement');
    this.newLocStatus.set('known');
    this.newLocVisibility.set('players');
    this.newLocX.set(coords?.xPercent ?? 52);
    this.newLocY.set(coords?.yPercent ?? 48);
    this.newLocDescription.set('');
    this.createLocationModalOpen.set(true);
  }

  submitCreateLocation(): void {
    const name = this.newLocName().trim();
    if (!name) return;
    this.worldLore.saveLocation({
      name,
      locationType: this.newLocType().trim() || 'Settlement',
      hierarchyLevel: this.newLocHierarchy(),
      discoveryStatus: this.newLocStatus(),
      visibility: this.newLocVisibility(),
      xPercent: this.newLocX(),
      yPercent: this.newLocY(),
      description:
        this.newLocDescription().trim() ||
        `Charted ${this.newLocType()} in ${this.worldLore.workspace().worldName}.`,
    });
    this.createLocationModalOpen.set(false);
  }
}
