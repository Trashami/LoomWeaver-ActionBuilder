import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type LwBadgeTone =
  | 'neutral'
  | 'gold'
  | 'emerald'
  | 'crimson'
  | 'violet'
  | 'cyan';

@Component({
  selector: 'lw-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<LwBadgeTone>('neutral');
}
