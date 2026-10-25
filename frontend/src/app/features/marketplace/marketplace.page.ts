import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-marketplace-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwAssetCardComponent,
  ],
  templateUrl: './marketplace.page.html',
  styleUrl: './marketplace.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplacePageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly activeTierCode = signal<string>('weaver');
}
