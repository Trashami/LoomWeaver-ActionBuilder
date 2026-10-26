import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

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

  readonly normalizedName = computed(() =>
    (this.name() || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase(),
  );
}

export { LwIconComponent as IconComponent };
