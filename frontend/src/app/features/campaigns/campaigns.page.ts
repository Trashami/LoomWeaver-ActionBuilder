import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  StoryBeatItemVm,
  StoryLoreClueFeedItemVm,
  StorySessionSequenceItemVm,
  TruthAssessmentStatus,
} from '../../core/models/connected-story.models';
import { AdventureGuideService } from '../../core/services/adventure-guide.service';
import { ConnectedStoryService } from '../../core/services/connected-story.service';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwEmptyStateComponent,
  LwEntityCardComponent,
  LwIconComponent,
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

export type StoryPageViewMode = 'story-acts' | 'evidence-chain' | 'quests-registry';

@Component({
  selector: 'lw-campaigns-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
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
  private readonly router = inject(Router);
  readonly store = inject(LoomWeaverStoreService);
  readonly story = inject(ConnectedStoryService);
  readonly advGuide = inject(AdventureGuideService);

  readonly generativeAiEnabled = input<boolean>(false);
  readonly isWeaveEnabled = computed(
    () => this.generativeAiEnabled() || this.store.weaveEnabled(),
  );

  readonly viewMode = signal<StoryPageViewMode>('story-acts');
  readonly showAddBeatModal = signal<boolean>(false);
  readonly targetActId = signal<string>('act-2');
  readonly newBeatTitle = signal<string>('');
  readonly newBeatKind = signal<string>('scene');
  readonly newBeatLocationKey = signal<string>('loc-ruined-chapel');

  readonly relFromKey = signal<string>('1:NPC:npc-malric');
  readonly relType = signal<string>('CURRENTLY_IN');
  readonly relToKey = signal<string>('1:Room:room-c3-crypt');
  readonly relWhyLabel = signal<string>('Brother Malric descended into Crypt C3 with the party');
  readonly relMarkHistorical = signal<boolean>(true);

  readonly selectedCategory = signal<string>('All');
  readonly categories = ['All', 'Quest', 'NPC', 'Location', 'Faction', 'Clue', 'Secret'];
  readonly quests = signal<readonly LwQuestTrackerItem[]>(DEFAULT_QUESTS);
  readonly questXpBanner = signal<string>(
    'Click any quest step below to toggle progress and trigger automated XP awards on completion.',
  );

  readonly filteredEntities = computed(() => {
    const cat = this.selectedCategory();
    const weaveOn = this.isWeaveEnabled();
    return this.store
      .authorizedEntities()
      .filter(
        (e) =>
          e.entityType !== 'Character' &&
          (weaveOn || e.canonStatus !== 'draft') &&
          (cat === 'All' || e.entityType === cat),
      );
  });

  readonly truthOptions: readonly TruthAssessmentStatus[] = [
    'confirmed',
    'unverified',
    'disputed',
    'disproven',
  ];

  constructor() {
    this.http.get<readonly LwQuestTrackerItem[]>('/api/v2/campaigns/1/quests').subscribe({
      next: (res) => {
        if (res?.length) this.quests.set(res);
      },
      error: () => {},
    });
  }

  openAddBeatForAct(actId: string): void {
    this.targetActId.set(actId);
    this.showAddBeatModal.set(true);
  }

  submitNewBeat(): void {
    const title = this.newBeatTitle().trim();
    if (!title) return;
    this.story.addBeat(this.targetActId(), title, this.newBeatKind(), this.newBeatLocationKey());
    this.newBeatTitle.set('');
    this.showAddBeatModal.set(false);
  }

  onBeatSelected(beat: StoryBeatItemVm): void {
    this.story.selectBeat(beat);
  }

  onSessionSelected(ses: StorySessionSequenceItemVm): void {
    if (ses.sessionId === 'session-14') {
      this.advGuide.selectScope('session', 'session-14');
    } else {
      this.advGuide.selectScope('session', 'session-15');
    }
  }

  onFeedItemSelected(item: StoryLoreClueFeedItemVm): void {
    this.story.navigateConnectedElement(item.compositeKey, item.routeLink, null, item.loreEntryId);
  }

  resumeCurrentSession(): void {
    this.advGuide.selectScope('session', 'session-15');
    this.router.navigateByUrl('/arcane-screen');
  }

  openStoryPlanner(): void {
    this.viewMode.set(this.viewMode() === 'evidence-chain' ? 'story-acts' : 'evidence-chain');
  }

  submitNewRelationship(): void {
    this.story.createRelationship(
      this.relFromKey(),
      this.relType(),
      this.relToKey(),
      this.relWhyLabel(),
      'players',
      this.relMarkHistorical(),
    );
  }

  beatIcon(kind: string): string {
    switch (kind) {
      case 'quest':
        return 'compass';
      case 'location':
        return 'map-pin';
      case 'clue':
        return 'search';
      case 'npc':
        return 'users';
      case 'lore':
        return 'book-open';
      case 'secret':
        return 'lock';
      case 'monster':
      case 'encounter':
        return 'swords';
      default:
        return 'flag';
    }
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
