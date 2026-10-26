import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MapCatalogAssetItem,
  MapPresetTemplate,
} from '../../../features/maps/application/map-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

@Component({
  selector: 'lw-map-preset-browser',
  standalone: true,
  imports: [FormsModule, LwBadgeComponent, LwButtonComponent],
  templateUrl: './map-preset-browser.component.html',
  styleUrl: './map-preset-browser.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapPresetBrowserComponent {
  readonly presets = input<readonly MapPresetTemplate[]>([]);
  readonly catalogAssets = input<readonly MapCatalogAssetItem[]>([]);
  readonly activePresetId = input<string>('preset-cinth-ballroom');
  readonly activeCatalogAssetId = input<string>('cat-gothic-pillar');

  readonly activeCategoryFilter = signal<string>('all');
  readonly searchQuery = signal<string>('');

  readonly categoryPills = [
    { id: 'all', label: 'All Assets' },
    { id: 'bump', label: '3D Light Aware' },
    { id: 'scatterable', label: 'Scatter Ready' },
    { id: 'walls', label: 'Walls & Portals' },
    { id: 'furniture', label: 'Furniture & Decor' },
    { id: 'cliffs', label: 'Cliffs & Strata' },
    { id: 'trees', label: 'Canopy & Trees' },
    { id: 'ruins', label: 'Ruins & Obelisks' },
    { id: 'dungeon', label: 'Dungeon & Bosses' },
  ];

  readonly filteredCatalog = computed(() => {
    const cat = this.activeCategoryFilter();
    const q = this.searchQuery().trim().toLowerCase();
    return this.catalogAssets().filter((item) => {
      const catMatch =
        cat === 'all' ||
        (cat === 'bump' && item.isLightAware3D) ||
        (cat === 'scatterable' && item.isScatterReady) ||
        item.category.toLowerCase() === cat;
      const qMatch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.subfolder.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  });

  readonly presetSelected = output<MapPresetTemplate>();
  readonly catalogAssetSelected = output<MapCatalogAssetItem>();
}
