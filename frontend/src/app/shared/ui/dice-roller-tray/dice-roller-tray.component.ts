import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type LwRollMode = 'normal' | 'advantage' | 'disadvantage';

export interface LwDiceRollTrayEvent {
  readonly sides: number;
  readonly count: number;
  readonly modifier: number;
  readonly rollMode: LwRollMode;
  readonly label: string;
}

@Component({
  selector: 'lw-dice-roller-tray',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './dice-roller-tray.component.html',
  styleUrl: './dice-roller-tray.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDiceRollerTrayComponent {
  readonly activeSkinName = input<string>('Runed Obsidian & Molten Gold');
  readonly rollRequested = output<LwDiceRollTrayEvent>();

  readonly polyhedralSides = [4, 6, 8, 10, 12, 20, 100];
  readonly selectedSides = signal<number>(20);
  readonly dieCount = signal<number>(1);
  readonly modifier = signal<number>(5);
  readonly rollMode = signal<LwRollMode>('normal');
  readonly customLabel = signal<string>('Authoritative Polyhedral Roll');

  selectDie(sides: number): void {
    this.selectedSides.set(sides);
  }

  adjustCount(delta: number): void {
    this.dieCount.update((c) => Math.max(1, Math.min(12, c + delta)));
  }

  adjustModifier(delta: number): void {
    this.modifier.update((m) => Math.max(-10, Math.min(25, m + delta)));
  }

  setMode(mode: LwRollMode): void {
    this.rollMode.set(mode);
  }

  updateLabel(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.customLabel.set(target.value);
  }

  triggerRoll(overrideSides?: number, overrideCount?: number, overrideMod?: number, overrideLabel?: string): void {
    this.rollRequested.emit({
      sides: overrideSides ?? this.selectedSides(),
      count: overrideCount ?? this.dieCount(),
      modifier: overrideMod ?? this.modifier(),
      rollMode: this.rollMode(),
      label: overrideLabel ?? (this.customLabel().trim() || 'Authoritative Polyhedral Roll'),
    });
  }
}
