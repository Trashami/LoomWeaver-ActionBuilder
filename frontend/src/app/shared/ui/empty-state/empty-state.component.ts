import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-empty-state',
  standalone: true,
  imports: [LwIconComponent, LwButtonComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEmptyStateComponent {
  readonly icon = input<string>('sparkles');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input<string | null>(null);
  readonly actionTriggered = output<void>();
}
