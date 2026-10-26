import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export interface LwAchievementCardData {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly rarity: string;
  readonly icon: string;
  readonly currentValue: number;
  readonly targetValue: number;
  readonly unlocked: boolean;
  readonly awardedTo: string;
  readonly xpBonus: number;
}

@Component({
  selector: 'lw-achievement-card',
  standalone: true,
  imports: [LwBadgeComponent, LwIconComponent],
  templateUrl: './achievement-card.component.html',
  styleUrl: './achievement-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAchievementCardComponent {
  readonly achievement = input.required<LwAchievementCardData>();

  readonly progressPercent = computed(() => {
    const item = this.achievement();
    if (item.targetValue <= 0) return 100;
    return Math.min(100, Math.round((item.currentValue / item.targetValue) * 100));
  });

  readonly badgeTone = computed<LwBadgeTone>(() => {
    const item = this.achievement();
    if (!item.unlocked) return 'neutral';
    return item.rarity === 'Mythic' ? 'gold' : item.rarity === 'Arcane' ? 'emerald' : 'gold';
  });
}
