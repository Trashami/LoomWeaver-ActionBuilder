import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface StatRadarAxis {
  readonly label: string;
  readonly value: number;
}

@Component({
  selector: 'lw-stat-radar',
  standalone: true,
  templateUrl: './stat-radar.component.html',
  styleUrl: './stat-radar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwStatRadarComponent {
  readonly axes = input.required<readonly StatRadarAxis[]>();
  readonly title = input<string>('');
  readonly subtitle = input<string>('');

  readonly polygonPoints = computed<string>(() => {
    const items = this.axes();
    if (!items.length) return '';
    const cx = 110;
    const cy = 110;
    const maxRadius = 72;
    return items
      .map((item, idx) => {
        const angle = (Math.PI * 2 * idx) / items.length - Math.PI / 2;
        const r = (Math.max(10, Math.min(100, item.value)) / 100) * maxRadius;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  readonly axisLabels = computed(() => {
    const items = this.axes();
    const cx = 110;
    const cy = 110;
    const labelRadius = 92;
    return items.map((item, idx) => {
      const angle = (Math.PI * 2 * idx) / items.length - Math.PI / 2;
      return {
        label: item.label,
        value: item.value,
        x: cx + labelRadius * Math.cos(angle),
        y: cy + labelRadius * Math.sin(angle),
      };
    });
  });
}
