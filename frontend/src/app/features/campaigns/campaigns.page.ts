import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwEmptyStateComponent,
  LwEntityCardComponent,
  LwPanelComponent,
  LwQuestStepToggleEvent,
  LwQuestTrackerCardComponent,
  LwQuestTrackerItem,
} from '../../shared/ui/public-api';

const DEFAULT_QUESTS: readonly LwQuestTrackerItem[] = [
  {
    id: 'quest-cinth-masquerade',
    title: 'Velvet & Fangs at the Cinth Masquerade',
    questGiver: 'Lord of Cinth & Artificers Guild Liaison',
    originLocation: 'Vandia Cliff-House & Plains of Red',
    completionLocation: 'Grand Ballroom of Cinth',
    prerequisites: 'Arrive in Cinth with the two Well of Life Luminaries concealed',
    xpReward: 2400,
    status: 'active',
    clueKeys: ['1:Clue:clue-chokrah-manifest', '1:NPC:npc-emrys'],
    steps: [
      {
        stepId: 'step-1',
        description: 'Travel northeast from Vandia across the Plains of Red to Cinth',
        locationName: 'Plains of Red',
        completed: true,
      },
      {
        stepId: 'step-2',
        description: 'Befriend the Cinth Artificers Guild and inspect their non-magical defenses',
        locationName: 'Cinth Guildhall',
        completed: true,
      },
      {
        stepId: 'step-3',
        description: "Attend the Lord of Cinth's masquerade and converse with Lord Emrys",
        locationName: 'Cinth Ballroom',
        completed: true,
      },
      {
        stepId: 'step-4',
        description: 'Repel the Crimson Covenant vampire ambush before the nobles are turned',
        locationName: 'Cinth Ballroom',
        completed: false,
      },
    ],
  },
  {
    id: 'quest-shadow-mountain',
    title: 'Shadow Beneath the Mountain',
    questGiver: "Lord Emrys (Deceptive Diversion) & Kildrid's Stone Sense",
    originLocation: 'Cinth South Gate',
    completionLocation: 'Runic Containment Cavern Beneath the Mountain',
    prerequisites: 'Complete the Cinth Masquerade and begin the return road toward Vandia',
    xpReward: 4500,
    status: 'active',
    clueKeys: ['1:Location:loc-mountain-cavern', '1:Character:char-fivi'],
    steps: [
      {
        stepId: 'step-m1',
        description: 'Trace the poisoned forest roots above the hundred-year runic prison',
        locationName: 'Gwaedhellain Forest',
        completed: true,
      },
      {
        stepId: 'step-m2',
        description: "Survive the bound dragon's desperation assault inside the rune cavern",
        locationName: 'Subterranean Vault',
        completed: true,
      },
      {
        stepId: 'step-m3',
        description: "Deliver the final tooth-loaded slingshot strike and witness Emrys's betrayal",
        locationName: 'Runic Altar',
        completed: false,
      },
    ],
  },
  {
    id: 'quest-edhellain-crown',
    title: 'Book Two: The Skyship Crash & Pages of Edhellain',
    questGiver: "Captain Kutler & Munk's Village Mentor",
    originLocation: 'Vandia Sky-Dock',
    completionLocation: 'Royal Archives of Edhellain',
    prerequisites: "Claim Kutler's skyship after the Lost Isles Chokrah briefing",
    xpReward: 3600,
    status: 'active',
    clueKeys: ['1:Character:char-munk', '1:Character:char-dal'],
    steps: [
      {
        stepId: 'step-b1',
        description: "Board Kutler's skyship (which Fivi immediately claims as hers)",
        locationName: 'Vandia Sky-Dock',
        completed: true,
      },
      {
        stepId: 'step-b2',
        description:
          "Survive the mysterious skyship crash near Munk's childhood village and repel the full-blood orc siege",
        locationName: 'Borderland Village',
        completed: false,
      },
      {
        stepId: 'step-b3',
        description: "Recover the missing pages in Edhellain confirming Dal's true royal lineage",
        locationName: 'Edhellain Archives',
        completed: false,
      },
    ],
  },
];

@Component({
  selector: 'lw-campaigns-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwEntityCardComponent,
    LwEmptyStateComponent,
    LwQuestTrackerCardComponent,
  ],
  templateUrl: './campaigns.page.html',
  styleUrl: './campaigns.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsPageComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);

  readonly selectedCategory = signal<string>('All');
  readonly categories = ['All', 'Quest', 'NPC', 'Location', 'Faction', 'Clue', 'Secret'];
  readonly quests = signal<readonly LwQuestTrackerItem[]>(DEFAULT_QUESTS);
  readonly questXpBanner = signal<string>(
    'Click any quest step below to toggle progress and trigger automated XP awards on completion.',
  );

  readonly filteredEntities = computed(() => {
    const cat = this.selectedCategory();
    return this.store
      .authorizedEntities()
      .filter((e) => e.entityType !== 'Character' && (cat === 'All' || e.entityType === cat));
  });

  constructor() {
    this.http.get<readonly LwQuestTrackerItem[]>('/api/v2/campaigns/1/quests').subscribe({
      next: (res) => {
        if (res?.length) this.quests.set(res);
      },
      error: () => {},
    });
  }

  handleStepToggle(event: LwQuestStepToggleEvent): void {
    this.http
      .post<{ quest: LwQuestTrackerItem; awardedXp: number; message: string }>(
        `/api/v2/campaigns/1/quests/${event.questId}/steps/${event.stepId}/toggle`,
        {},
      )
      .subscribe({
        next: (res) => {
          if (res?.quest) {
            this.quests.update((list) =>
              list.map((q) => (q.id === event.questId ? res.quest : q)),
            );
          }
          if (res?.message) this.questXpBanner.set(res.message);
        },
        error: () => {
          this.quests.update((list) =>
            list.map((q) => {
              if (q.id !== event.questId) return q;
              const steps = q.steps.map((s) =>
                s.stepId === event.stepId ? { ...s, completed: !s.completed } : s,
              );
              const allDone = steps.every((s) => s.completed);
              if (allDone) {
                this.questXpBanner.set(
                  `Quest "${q.title}" completed! +${q.xpReward} XP automatically awarded to the party.`,
                );
              }
              return { ...q, steps, status: allDone ? 'completed' : 'active' };
            }),
          );
        },
      });
  }
}
