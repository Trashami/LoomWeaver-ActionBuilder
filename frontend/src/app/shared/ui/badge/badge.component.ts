import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LwIconComponent } from '../icon/icon.component';

export type LwBadgeTone =
  | 'neutral'
  | 'gold'
  | 'emerald'
  | 'crimson'
  | 'violet'
  | 'gm'
  | 'players'
  | 'public'
  | 'free'
  | 'included'
  | 'purchased'
  | 'locked'
  | 'approved'
  | 'draft';

@Component({
  selector: 'lw-badge',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<LwBadgeTone>('neutral');
  readonly icon = input<string | null>(null);
}
