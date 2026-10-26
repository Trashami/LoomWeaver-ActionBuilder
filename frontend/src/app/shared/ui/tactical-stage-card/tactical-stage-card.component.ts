import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwIconComponent } from '../icon/icon.component';

export interface LwInitiativeTokenVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly initiative: number;
  readonly allegiance: 'party' | 'hostile' | 'neutral';
  readonly initials: string;
  readonly xPercent: number;
  readonly yPercent: number;
  readonly ringColor: string;
  readonly hpLabel: string;
}

@Component({
  selector: 'lw-tactical-stage-card',
  standalone: true,
  imports: [LwIconComponent],
  templateUrl: './tactical-stage-card.component.html',
  styleUrl: './tactical-stage-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwTacticalStageCardComponent {
  readonly sceneName = input<string>('Ruined Chapel');
  readonly modeLabel = input<string>('Encounter');
  readonly mapImageUrl = input<string>('/landing-assets/engines/engine-1-vtt-combat.jpg');
  readonly combatants = input.required<readonly LwInitiativeTokenVm[]>();

  readonly tokenSelected = output<LwInitiativeTokenVm>();
  readonly rollDiceRequested = output<void>();
  readonly expandRequested = output<void>();

  readonly roundNumber = signal<number>(2);
  readonly activeCombatantIndex = signal<number>(1);
  readonly showInitiativePanel = signal<boolean>(true);
  readonly fogEnabled = signal<boolean>(false);
  readonly gridEnabled = signal<boolean>(true);
  readonly measureEnabled = signal<boolean>(false);
  readonly activeTool = signal<'select' | 'draw' | 'aoe' | 'note' | 'dice'>('select');
  readonly zoomScale = signal<number>(1);

  readonly activeCombatant = computed(() => {
    const list = this.combatants();
    if (!list.length) return null;
    return list[this.activeCombatantIndex() % list.length];
  });

  advanceTurn(): void {
    const list = this.combatants();
    if (!list.length) return;
    const nextIdx = this.activeCombatantIndex() + 1;
    if (nextIdx >= list.length) {
      this.activeCombatantIndex.set(0);
      this.roundNumber.update((r) => r + 1);
    } else {
      this.activeCombatantIndex.set(nextIdx);
    }
    const current = list[this.activeCombatantIndex()];
    if (current) {
      this.tokenSelected.emit(current);
    }
  }

  selectToken(token: LwInitiativeTokenVm, index: number): void {
    this.activeCombatantIndex.set(index);
    this.tokenSelected.emit(token);
  }

  adjustZoom(delta: number): void {
    this.zoomScale.update((z) => Math.max(0.85, Math.min(1.45, +(z + delta).toFixed(2))));
  }
}
