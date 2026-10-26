import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { LwIconComponent, LwIconTone } from '../icon/icon.component';

export type LwButtonVariant =
  | 'primary'
  | 'emerald'
  | 'gold'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'guide-pill'
  | 'guide-chip';

export type LwButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type LwButtonShape = 'default' | 'pill' | 'square';

@Component({
  selector: 'lw-button',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class LwButtonComponent {
  readonly label = input<string>('');
  readonly sublabel = input<string>('');
  readonly variant = input<LwButtonVariant>('emerald');
  readonly size = input<LwButtonSize>('md');
  readonly shape = input<LwButtonShape>('default');
  readonly active = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);
  readonly icon = input<string | null>(null);
  readonly trailingIcon = input<string | null>(null);
  readonly iconTone = input<LwIconTone>('inherit');
  readonly iconSize = input<number | null>(null);
  readonly iconOnly = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly title = input<string>('');

  readonly pressed = output<void>();

  readonly resolvedIconSize = computed<number>(() => {
    const explicit = this.iconSize();
    if (explicit !== null) return explicit;
    switch (this.size()) {
      case 'xs':
        return 13;
      case 'sm':
        return 14;
      case 'lg':
        return 18;
      default:
        return 16;
    }
  });
}
