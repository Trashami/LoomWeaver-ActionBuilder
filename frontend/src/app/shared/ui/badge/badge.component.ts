import { ChangeDetectionStrategy, Component, input } from '@angular/core';

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
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwBadgeComponent {
  readonly label = input<string>('');
  readonly tone = input<LwBadgeTone>('neutral');
  readonly icon = input<string | null>(null);
}
