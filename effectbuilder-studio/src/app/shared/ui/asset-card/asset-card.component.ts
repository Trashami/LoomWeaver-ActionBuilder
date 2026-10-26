import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AssetCardVm } from '../../../core/models/loomweaver.models';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { AssetCardConfig, DEFAULT_ASSET_CARD_CONFIG } from './asset-card.config';

@Component({
  selector: 'lw-asset-card',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './asset-card.component.html',
  styleUrl: './asset-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAssetCardComponent {
  readonly asset = input.required<AssetCardVm>();
  readonly config = input<Partial<AssetCardConfig>>({});
  readonly selected = input<boolean>(false);
  readonly primaryActionLabel = input<string>('Apply');

  readonly assetSelected = output<AssetCardVm>();
  readonly previewRequested = output<AssetCardVm>();
  readonly unlockRequested = output<AssetCardVm>();

  readonly resolvedConfig = computed<AssetCardConfig>(() => ({
    ...DEFAULT_ASSET_CARD_CONFIG,
    ...this.config(),
  }));

  readonly isLocked = computed(() => this.asset().entitlement === 'locked');

  readonly badgeTone = computed<LwBadgeTone>(() => {
    const ent = this.asset().entitlement;
    if (ent === 'free' || ent === 'purchased') return 'emerald';
    if (ent === 'included') return 'gold';
    return 'locked';
  });
}
