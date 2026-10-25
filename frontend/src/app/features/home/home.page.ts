import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwEntityCardComponent,
  LwIconComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-home-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwEntityCardComponent,
    LwAssetCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly featuredEntities = computed(() => this.store.authorizedEntities().slice(0, 4));
  readonly featuredAssets = computed(() => this.store.assets().slice(0, 3));
}
