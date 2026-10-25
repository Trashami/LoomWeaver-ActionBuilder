import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwEmptyStateComponent,
  LwEntityCardComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-campaigns-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwEntityCardComponent,
    LwEmptyStateComponent,
  ],
  templateUrl: './campaigns.page.html',
  styleUrl: './campaigns.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly selectedCategory = signal<string>('All');

  readonly categories = ['All', 'Quest', 'NPC', 'Location', 'Faction', 'Clue', 'Secret'];

  readonly filteredEntities = computed(() => {
    const cat = this.selectedCategory();
    return this.store
      .authorizedEntities()
      .filter((e) => e.entityType !== 'Character' && (cat === 'All' || e.entityType === cat));
  });
}
