import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwIconComponent,
  LwInitiativeTokenVm,
  LwNpcCardComponent,
  LwPartyMemberStatusVm,
  LwPartyRosterCardComponent,
  LwQuestTrackerCardComponent,
  LwQuestTrackerItem,
  LwSessionLogComposerComponent,
  LwSessionRecapCardComponent,
  LwSessionRecapItem,
  LwTacticalStageCardComponent,
  NpcCardVm,
  SessionLogEntry,
  SessionLogTab,
} from '../../shared/ui/public-api';

const DASHBOARD_COMBATANTS: readonly LwInitiativeTokenVm[] = [
  {
    id: 'init-lira',
    compositeKey: '1:Character:char-fivi',
    name: 'Lira',
    initiative: 18,
    allegiance: 'party',
    initials: 'LI',
    xPercent: 52,
    yPercent: 48,
    ringColor: '#49e892',
    hpLabel: '24/24 HP',
  },
  {
    id: 'init-kael',
    compositeKey: '1:Character:char-dal',
    name: 'Kael',
    initiative: 15,
    allegiance: 'party',
    initials: 'KA',
    xPercent: 44,
    yPercent: 54,
    ringColor: '#d9b77a',
    hpLabel: '32/38 HP',
  },
  {
    id: 'init-goblin-1',
    compositeKey: '1:NPC:npc-goblin-scout',
    name: 'Goblin Scout',
    initiative: 14,
    allegiance: 'hostile',
    initials: 'GS',
    xPercent: 61,
    yPercent: 43,
    ringColor: '#e25c5c',
    hpLabel: '11/14 HP',
  },
  {
    id: 'init-stonehide',
    compositeKey: '1:Character:char-kildrid',
    name: 'Stonehide',
    initiative: 11,
    allegiance: 'party',
    initials: 'ST',
    xPercent: 48,
    yPercent: 62,
    ringColor: '#e2a85c',
    hpLabel: '41/45 HP',
  },
  {
    id: 'init-goblin-2',
    compositeKey: '1:NPC:npc-goblin-archer',
    name: 'Goblin Archer',
    initiative: 9,
    allegiance: 'hostile',
    initials: 'GA',
    xPercent: 67,
    yPercent: 53,
    ringColor: '#e25c5c',
    hpLabel: '9/12 HP',
  },
  {
    id: 'init-seraphine',
    compositeKey: '1:Character:char-kycius',
    name: 'Seraphine',
    initiative: 7,
    allegiance: 'party',
    initials: 'SE',
    xPercent: 39,
    yPercent: 60,
    ringColor: '#5ec2e8',
    hpLabel: '27/27 HP',
  },
];

const DASHBOARD_QUESTS: readonly LwQuestTrackerItem[] = [
  {
    id: 'quest-shadows-stone',
    title: 'Shadows in the Stone',
    summary: 'Investigate the ruined chapel',
    icon: 'swords',
    questGiver: 'Brother Malric',
    originLocation: 'Whispering Woods Edge',
    completionLocation: 'Ruined Chapel Crypt',
    prerequisites: 'Act I Arrival',
    xpReward: 1200,
    status: 'active',
    clueKeys: ['1:Clue:clue-chokrah-manifest'],
    steps: [
      {
        stepId: 'step-1',
        description: 'Investigate the ruined chapel',
        locationName: 'Ruined Chapel',
        completed: false,
      },
    ],
  },
  {
    id: 'quest-missing-caravan',
    title: 'The Missing Caravan',
    summary: 'Search the old road for survivors',
    icon: 'compass',
    questGiver: 'Merchant Guild of Cinth',
    originLocation: 'Vandia Road',
    completionLocation: 'Plains of Red',
    prerequisites: 'None',
    xpReward: 950,
    status: 'active',
    clueKeys: [],
    steps: [
      {
        stepId: 'step-2',
        description: 'Search the old road for survivors',
        locationName: 'Old Road',
        completed: false,
      },
    ],
  },
  {
    id: 'quest-whispers-woods',
    title: 'Whispers in the Woods',
    summary: 'Speak to the hermit of Elderwood',
    icon: 'sparkles',
    questGiver: 'Sister Elowen',
    originLocation: 'Ruined Chapel',
    completionLocation: 'Elderwood Hollow',
    prerequisites: 'Gain chapel keeper trust',
    xpReward: 1100,
    status: 'active',
    clueKeys: [],
    steps: [
      {
        stepId: 'step-3',
        description: 'Speak to the hermit of Elderwood',
        locationName: 'Elderwood',
        completed: false,
      },
    ],
  },
  {
    id: 'quest-debt-iron',
    title: 'A Debt of Iron',
    summary: 'Deliver the forged blade to Varik',
    icon: 'shield',
    questGiver: 'Cinth Artificers Guild',
    originLocation: 'Cinth Foundry',
    completionLocation: 'Watchtower Outpost',
    prerequisites: 'Forged Phosphor Blade',
    xpReward: 850,
    status: 'active',
    clueKeys: [],
    steps: [
      {
        stepId: 'step-4',
        description: 'Deliver the forged blade to Varik',
        locationName: 'Cinth Outpost',
        completed: false,
      },
    ],
  },
];

const DASHBOARD_PARTY: readonly LwPartyMemberStatusVm[] = [
  {
    id: 'party-kael',
    compositeKey: '1:Character:char-dal',
    name: 'Kael',
    classAndAncestry: 'Human Ranger',
    hpCurrent: 32,
    hpMax: 38,
    ac: 16,
    online: true,
    avatarInitials: 'KA',
    ringColor: '#d9b77a',
  },
  {
    id: 'party-lira',
    compositeKey: '1:Character:char-fivi',
    name: 'Lira',
    classAndAncestry: 'Elf Sorcerer',
    hpCurrent: 24,
    hpMax: 24,
    ac: 15,
    online: true,
    avatarInitials: 'LI',
    ringColor: '#49e892',
  },
  {
    id: 'party-stonehide',
    compositeKey: '1:Character:char-kildrid',
    name: 'Stonehide',
    classAndAncestry: 'Goliath Barbarian',
    hpCurrent: 41,
    hpMax: 45,
    ac: 17,
    online: true,
    avatarInitials: 'ST',
    ringColor: '#e2a85c',
  },
  {
    id: 'party-seraphine',
    compositeKey: '1:Character:char-kycius',
    name: 'Seraphine',
    classAndAncestry: 'Tiefling Cleric',
    hpCurrent: 27,
    hpMax: 27,
    ac: 18,
    online: true,
    avatarInitials: 'SE',
    ringColor: '#5ec2e8',
  },
];

const DASHBOARD_NPCS: readonly NpcCardVm[] = [
  {
    compositeKey: 'campaign_vaelgard:npc:malric',
    name: 'Brother Malric',
    title: 'Chapel Keeper',
    faction: 'Chapel of the Stone',
    locationName: 'Ruined Chapel',
    disposition: 'Guarded',
    attitudeLabel: 'Neutral · Cautious',
    summary: 'Keeper of the crumbling chapel who guards the sealed crypt beneath the altar.',
    gmSecret: 'Knows the sealed crypt beneath the altar holds an ancient relic.',
    visibility: 'players',
  },
  {
    compositeKey: 'campaign_vaelgard:npc:elowen',
    name: 'Sister Elowen',
    title: 'Healer',
    faction: 'Order of Ekkos',
    locationName: 'Ruined Chapel',
    disposition: 'Guarded',
    attitudeLabel: 'Neutral · Guarded',
    summary: 'Tends to injured travelers along the Whispering Woods border.',
    gmSecret: 'Suspects the Priors of siphoning magic from apprentice wards.',
    visibility: 'players',
  },
  {
    compositeKey: '1:NPC:npc-goblin-scout',
    name: 'Goblin Scout',
    title: 'Ruin Stalker',
    faction: 'Broken Fang Warband',
    locationName: 'Chapel Courtyard',
    disposition: 'Hostile',
    attitudeLabel: 'Hostile',
    summary: 'Skirmisher prowling the shattered arches of the ruined chapel.',
    visibility: 'players',
  },
];

@Component({
  selector: 'lw-home-page',
  standalone: true,
  imports: [
    RouterLink,
    LwIconComponent,
    LwTacticalStageCardComponent,
    LwQuestTrackerCardComponent,
    LwPartyRosterCardComponent,
    LwNpcCardComponent,
    LwSessionLogComposerComponent,
    LwSessionRecapCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly store = inject(LoomWeaverStoreService);
  readonly auth = inject(AuthSessionService);

  readonly combatants = signal<readonly LwInitiativeTokenVm[]>(DASHBOARD_COMBATANTS);
  readonly activeQuests = signal<readonly LwQuestTrackerItem[]>(DASHBOARD_QUESTS);
  readonly selectedQuestId = signal<string>('quest-shadows-stone');
  readonly partyMembers = signal<readonly LwPartyMemberStatusVm[]>(DASHBOARD_PARTY);
  readonly nearbyNpcs = signal<readonly NpcCardVm[]>(DASHBOARD_NPCS);
  readonly showChronicleDrawer = signal<boolean>(false);

  readonly logEntries = signal<SessionLogEntry[]>([
    {
      id: 'log-1',
      tab: 'session-log',
      text: 'The party arrived at the Ruined Chapel and questioned Brother Malric about the sealed crypt.',
      timestamp: '21:14',
      scope: 'party',
    },
  ]);

  readonly sessions = signal<readonly LwSessionRecapItem[]>([]);

  constructor() {
    this.http.get<readonly LwSessionRecapItem[]>('/api/v2/campaigns/1/sessions').subscribe({
      next: (res) => {
        if (res?.length) this.sessions.set(res);
      },
      error: () => {},
    });
  }

  onTokenSelected(token: LwInitiativeTokenVm): void {
    this.store.inspectEntity(token.compositeKey);
  }

  onQuestSelected(quest: LwQuestTrackerItem): void {
    this.selectedQuestId.set(quest.id);
    if (quest.clueKeys.length > 0) {
      this.store.inspectEntity(quest.clueKeys[0]);
    }
  }

  onMemberSelected(member: LwPartyMemberStatusVm): void {
    this.store.inspectEntity(member.compositeKey);
  }

  onNpcSelected(npc: NpcCardVm): void {
    this.store.inspectEntity(npc.compositeKey);
  }

  openFullVtt(): void {
    void this.router.navigate(['/arcane-screen']);
  }

  onSaveSessionNote(event: { tab: SessionLogTab; text: string; scope: 'party' | 'gm' | 'private' }): void {
    const now = new Date();
    const timeLabel = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.logEntries.update((prev) => [
      {
        id: `log-${Date.now()}`,
        tab: event.tab,
        text: event.text,
        timestamp: timeLabel,
        scope: event.scope,
      },
      ...prev,
    ]);
  }

  onAskLoomWithDraft(draft: string): void {
    if (draft.trim()) {
      this.store.setLoomSearchQuery(draft.trim());
    }
    this.store.toggleLoomDrawer(true);
  }
}
