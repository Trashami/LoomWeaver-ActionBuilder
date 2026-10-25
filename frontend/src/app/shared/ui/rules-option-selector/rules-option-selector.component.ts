import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export interface RulesOptionItem {
  readonly id: string;
  readonly label: string;
  readonly subtitle?: string;
  readonly badge?: string;
  readonly badgeTone?: LwBadgeTone;
  readonly icon?: string;
}

@Component({
  selector: 'lw-rules-option-selector',
  standalone: true,
  imports: [LwBadgeComponent, LwIconComponent],
  templateUrl: './rules-option-selector.component.html',
  styleUrl: './rules-option-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRulesOptionSelectorComponent {
  readonly title = input<string>('');
  readonly options = input.required<readonly RulesOptionItem[]>();
  readonly selectedId = input.required<string>();
  readonly variant = input<'pills' | 'cards'>('cards');

  readonly selectionChanged = output<string>();
}
