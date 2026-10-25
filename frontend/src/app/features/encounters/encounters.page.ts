import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwEntityCardComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-encounters-page',
  standalone: true,
  imports: [RouterLink, LwPanelComponent, LwBadgeComponent, LwEntityCardComponent],
  templateUrl: './encounters.page.html',
  styleUrl: './encounters.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncountersPageComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly encounters = computed(() =>
    this.store
      .authorizedEntities()
      .filter((e) => e.entityType === 'Encounter' || e.entityType === 'NPC'),
  );
}
