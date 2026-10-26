import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LwScrollOrientation = 'vertical' | 'horizontal' | 'both';
export type LwScrollTone = 'emerald' | 'gold' | 'subtle';

@Component({
  selector: 'lw-scroll-area',
  standalone: true,
  templateUrl: './scroll-area.component.html',
  styleUrl: './scroll-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScrollAreaComponent {
  readonly tone = input<LwScrollTone>('emerald');
  readonly orientation = input<LwScrollOrientation>('vertical');
  readonly scrollbarWidth = input<number>(4);
  readonly thumbColor = input<string>('');
  readonly thumbHoverColor = input<string>('');
  readonly trackColor = input<string>('');
  readonly trackBorderColor = input<string>('');
  readonly maxHeight = input<string>('100%');
  readonly padding = input<string>('0');

  readonly resolvedThumbColor = computed(() => {
    if (this.thumbColor()) return this.thumbColor();
    if (this.tone() === 'gold') return '#d9b77a';
    if (this.tone() === 'subtle') return 'rgba(122, 184, 152, 0.55)';
    return '#49e892';
  });

  readonly resolvedThumbHoverColor = computed(() => {
    if (this.thumbHoverColor()) return this.thumbHoverColor();
    if (this.tone() === 'gold') return '#f2d79e';
    return '#79f6b2';
  });

  readonly resolvedTrackColor = computed(() => {
    if (this.trackColor()) return this.trackColor();
    return 'rgba(6, 22, 16, 0.78)';
  });

  readonly resolvedTrackBorderColor = computed(() => {
    if (this.trackBorderColor()) return this.trackBorderColor();
    if (this.tone() === 'gold') return 'rgba(217, 183, 122, 0.22)';
    return 'rgba(55, 118, 88, 0.28)';
  });
}
