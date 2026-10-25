import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-assets-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwAssetCardComponent,
  ],
  templateUrl: './assets.page.html',
  styleUrl: './assets.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetsPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly selectedCategory = signal<string>('All');
  readonly activeTrack = signal<string>('Cinth Ballroom Waltz (Tension Layer)');
  readonly categories = ['All', 'Map Pack', 'Dice Skin', 'Spell FX', 'Audio Pack', 'Module'];

  readonly filteredAssets = computed(() => {
    const cat = this.selectedCategory();
    return this.store.assets().filter((a) => cat === 'All' || a.category === cat);
  });

  readonly audioStems = [
    { name: 'Cinth Ballroom Waltz (Tension Layer)', mood: 'Exploration / Intrigue', bpm: '108 BPM' },
    { name: 'Vampire Coven Ambush Percussion', mood: 'Combat / Boss', bpm: '142 BPM' },
    { name: 'Shadow of the Mountain Sub-Bass Drone', mood: 'Ominous / Sanctum', bpm: '64 BPM' },
  ];
}
