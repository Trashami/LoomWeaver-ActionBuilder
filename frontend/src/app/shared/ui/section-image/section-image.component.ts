import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'lw-section-image',
  standalone: true,
  templateUrl: './section-image.component.html',
  styleUrl: './section-image.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwSectionImageComponent {
  readonly src = input.required<string>();
  readonly alt = input.required<string>();
  readonly aspectRatio = input<string>('16 / 5');
}
