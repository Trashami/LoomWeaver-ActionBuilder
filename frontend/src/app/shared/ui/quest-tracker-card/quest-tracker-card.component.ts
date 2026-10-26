import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { NgpCheckbox } from 'ng-primitives/checkbox';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export interface LwQuestStepItem {
  readonly stepId: string;
  readonly description: string;
  readonly locationName: string;
  readonly completed: boolean;
}

export interface LwQuestTrackerItem {
  readonly id: string;
  readonly title: string;
  readonly summary?: string;
  readonly icon?: string;
  readonly categoryBadge?: string;
  readonly badgeTone?: 'gold' | 'emerald' | 'gm' | 'crimson';
  readonly questGiver: string;
  readonly originLocation: string;
  readonly completionLocation: string;
  readonly prerequisites: string;
  readonly xpReward: number;
  readonly status: 'active' | 'completed' | string;
  readonly clueKeys: readonly string[];
  readonly steps: readonly LwQuestStepItem[];
}

export interface LwQuestStepToggleEvent {
  readonly questId: string;
  readonly stepId: string;
}

@Component({
  selector: 'lw-quest-tracker-card',
  standalone: true,
  imports: [NgpButton, NgpCheckbox, LwBadgeComponent, LwIconComponent],
  templateUrl: './quest-tracker-card.component.html',
  styleUrl: './quest-tracker-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwQuestTrackerCardComponent {
  readonly quest = input.required<LwQuestTrackerItem>();
  readonly variant = input<'compact-row' | 'detailed'>('detailed');
  readonly selected = input<boolean>(false);

  readonly questSelected = output<LwQuestTrackerItem>();
  readonly stepToggled = output<LwQuestStepToggleEvent>();
  readonly clueInspected = output<string>();

  readonly completedCount = computed(
    () => this.quest().steps.filter((s) => s.completed).length,
  );

  readonly primarySubtitle = computed(() => {
    const q = this.quest();
    if (q.summary) return q.summary;
    const nextStep = q.steps.find((s) => !s.completed) ?? q.steps[0];
    return nextStep ? nextStep.description : `${q.originLocation} to ${q.completionLocation}`;
  });
}
