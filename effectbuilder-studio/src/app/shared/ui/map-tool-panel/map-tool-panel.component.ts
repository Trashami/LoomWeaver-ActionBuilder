import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface MapToolItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly description: string;
}

export interface BrushParameterState {
  readonly radius: number;
  readonly intensity: number;
  readonly seed: number;
}

@Component({
  selector: 'lw-map-tool-panel',
  standalone: true,
  imports: [FormsModule, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './map-tool-panel.component.html',
  styleUrl: './map-tool-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapToolPanelComponent {
  readonly tools = input.required<readonly MapToolItem[]>();
  readonly activeToolId = input.required<string>();
  readonly brushRadius = input<number>(4);
  readonly brushIntensity = input<number>(75);
  readonly deterministicSeed = input<number>(1042);

  readonly toolChanged = output<string>();
  readonly brushChanged = output<BrushParameterState>();
  readonly commandRequested = output<string>();

  emitBrush(radius: number, intensity: number, seed: number): void {
    this.brushChanged.emit({
      radius: Number(radius),
      intensity: Number(intensity),
      seed: Number(seed),
    });
  }
}
