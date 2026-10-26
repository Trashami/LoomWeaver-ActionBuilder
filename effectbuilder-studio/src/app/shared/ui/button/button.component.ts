import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { LwIconComponent } from '../icon/icon.component';

export type LwButtonVariant =
  | 'primary'
  | 'emerald'
  | 'gold'
  | 'secondary'
  | 'ghost'
  | 'danger';
export type LwButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'lw-button',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class LwButtonComponent {
  readonly label = input<string>('');
  readonly variant = input<LwButtonVariant>('emerald');
  readonly size = input<LwButtonSize>('md');
  readonly icon = input<string | null>(null);
  readonly iconOnly = input<boolean>(false);
  readonly routerLink = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  readonly pressed = output<void>();
}

export { LwButtonComponent as ButtonComponent };
