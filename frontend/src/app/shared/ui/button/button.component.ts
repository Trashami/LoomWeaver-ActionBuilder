import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  imports: [RouterLink, LwIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class LwButtonComponent {
  readonly label = input<string>('');
  readonly variant = input<LwButtonVariant>('emerald');
  readonly size = input<LwButtonSize>('md');
  readonly icon = input<string | null>(null);
  readonly routerLink = input<string | null>(null);
  readonly disabled = input<boolean>(false);

  readonly pressed = output<void>();
}

export { LwButtonComponent as ButtonComponent };
