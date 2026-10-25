import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lw-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class LwIconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(16);
}

export { LwIconComponent as IconComponent };
