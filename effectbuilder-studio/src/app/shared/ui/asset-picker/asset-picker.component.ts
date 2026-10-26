import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface PickableAssetItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly summary: string;
  readonly bonusLabel?: string;
  readonly entitlement: 'free' | 'included' | 'purchased' | 'locked';
  readonly equippedOrActive?: boolean;
}

@Component({
  selector: 'lw-asset-picker',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './asset-picker.component.html',
  styleUrl: './asset-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAssetPickerComponent {
  readonly title = input<string>('Select Asset');
  readonly items = input.required<readonly PickableAssetItem[]>();
  readonly selectedId = input<string | null>(null);
  readonly actionLabel = input<string>('Select');

  readonly itemPicked = output<PickableAssetItem>();
  readonly unlockRequested = output<PickableAssetItem>();

  toneFor(entitlement: PickableAssetItem['entitlement']): LwBadgeTone {
    if (entitlement === 'locked') return 'locked';
    if (entitlement === 'included') return 'gold';
    return 'emerald';
  }
}
