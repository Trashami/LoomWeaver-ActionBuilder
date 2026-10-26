import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

export interface EncounterCardVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly actLabel: string;
  readonly sceneKey: string;
  readonly sceneName: string;
  readonly difficulty: 'Moderate' | 'Hard' | 'Deadly' | 'Mythic';
  readonly totalXp: number;
  readonly enemyCount: number;
  readonly summary: string;
  readonly completed?: boolean;
}

@Component({
  selector: 'lw-encounter-card',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwButtonComponent],
  templateUrl: './encounter-card.component.html',
  styleUrl: './encounter-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEncounterCardComponent {
  readonly encounter = input.required<EncounterCardVm>();
  readonly active = input<boolean>(false);

  readonly encounterSelected = output<EncounterCardVm>();
  readonly startRequested = output<EncounterCardVm>();

  readonly difficultyTone = computed<LwBadgeTone>(() => {
    const d = this.encounter().difficulty;
    if (d === 'Mythic' || d === 'Deadly') return 'crimson';
    if (d === 'Hard') return 'gold';
    return 'emerald';
  });
}
