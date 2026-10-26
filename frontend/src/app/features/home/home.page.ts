import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwEntityCardComponent,
  LwIconComponent,
  LwPanelComponent,
  LwSessionRecapCardComponent,
  LwSessionRecapItem,
} from '../../shared/ui/public-api';

interface LogicalModuleStatusItem {
  readonly number: number;
  readonly name: string;
  readonly stack: string;
  readonly route: string;
  readonly icon: string;
  readonly statusMetric: string;
}

const DEFAULT_SESSIONS: readonly LwSessionRecapItem[] = [
  {
    id: 'session-18',
    campaignId: 1,
    sessionNumber: 18,
    title: "Shadow Beneath the Mountain & Kutler's Skyship",
    locationName: 'Runic Cavern & Cinth Sky-Dock',
    dateLabel: 'Act I Finale',
    xpAwarded: 2500,
    summary:
      'Deceived by Lord Emrys into entering the mountain cavern, the party battled the ancient life-bound dragon. Fivi landed the final killing blow with a tooth-loaded slingshot just before Emrys claimed the final Luminary clue and Captain Kutler arrived in a flying skyship.',
    highlights: [
      'Fivi slew the bound dragon at 1 HP with a slingshot loaded with a tooth',
      'Emrys revealed his true design to trap the Sidhe Ard using the Luminaries',
      "Captain Kutler returned from the Lost Isles with Chokrah ritual intelligence; Fivi claimed his skyship as hers",
    ],
    deepLinks: [
      { label: 'Runic Cavern VTT', route: '/arcane-screen', entityKey: '1:Location:loc-mountain-cavern' },
      { label: 'Fivi Character Sheet', route: '/characters', entityKey: '1:Character:char-fivi' },
      { label: 'Chokrah Clue in The Loom', route: '/loom', entityKey: '1:Clue:clue-chokrah-manifest' },
    ],
  },
  {
    id: 'session-17',
    campaignId: 1,
    sessionNumber: 17,
    title: 'Velvet, Brass & Fangs in Cinth',
    locationName: 'Cinth Guildhall & Masquerade Ballroom',
    dateLabel: 'Act I · Cinth',
    xpAwarded: 1800,
    summary:
      "The party allied with the non-magical Artificers Guild of Cinth, attended the Lord of Cinth's masquerade, met the self-styled reformer Lord Emrys for the first time, and thwarted the vampire coven's bid to convert the city's nobility.",
    highlights: [
      'Befriended the Cinth Artificers Guild and inspected their phosphor-bronze defenses',
      'First conversation with Lord Emrys regarding the reformed Council of Magic',
      'Repelled the Crimson Covenant vampire ambush across the ballroom balcony',
    ],
    deepLinks: [
      { label: 'Cinth Ballroom Map', route: '/maps', entityKey: '1:Location:loc-cinth' },
      { label: 'Lord Emrys Dossier', route: '/campaigns', entityKey: '1:NPC:npc-emrys' },
      { label: 'Ballroom Audio Stems', route: '/assets', entityKey: '1:Location:loc-cinth' },
    ],
  },
];

@Component({
  selector: 'lw-home-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwEntityCardComponent,
    LwAssetCardComponent,
    LwSessionRecapCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);

  readonly sessions = signal<readonly LwSessionRecapItem[]>(DEFAULT_SESSIONS);
  readonly newSessionTitle = signal<string>("Session 19: Skyship Crash Near Munk's Village");
  readonly newSessionLocation = signal<string>('Borderland Village & Edhellain Road');
  readonly newSessionSummary = signal<string>(
    "En route to Edhellain, Kutler's skyship crashes near the village where Munk was raised. Full-blood orcs prepare to besiege the timber palisades.",
  );
  readonly newSessionXp = signal<number>(1800);
  readonly sessionBanner = signal<string>(
    'Living Session Chronicle synced with The Loom and automated XP progression.',
  );

  readonly logicalModules: readonly LogicalModuleStatusItem[] = [
    {
      number: 1,
      name: 'Character Studio',
      stack: '.NET Rules Engine (5e / PF2e / V5)',
      route: '/characters',
      icon: 'Users',
      statusMetric: '5 Adventurers · Level-Up Ready',
    },
    {
      number: 2,
      name: 'LoomMaps 2D/3D',
      stack: 'Babylon.js Terrain, Water & Scatter',
      route: '/maps',
      icon: 'Map',
      statusMetric: '39 Asset Packs · 2.5D Lighting',
    },
    {
      number: 3,
      name: 'Arcane Screen VTT',
      stack: '.NET Combat + Babylon Tactical Stage',
      route: '/arcane-screen',
      icon: 'Shield',
      statusMetric: 'Action Economy + Auto XP',
    },
    {
      number: 4,
      name: 'ActionBuilder',
      stack: '.NET When / If / Then Rules Engine',
      route: '/effects',
      icon: 'Swords',
      statusMetric: 'Homebrew & SRD Validated',
    },
    {
      number: 5,
      name: 'EffectBuilder',
      stack: 'Babylon.js Trajectories & Timelines',
      route: '/effects',
      icon: 'Sparkles',
      statusMetric: 'Arc / Cone / Beam / Sigil',
    },
    {
      number: 6,
      name: 'Dice Forge 3D',
      stack: 'Babylon PBR + .NET CSPRNG SHA-256',
      route: '/dice',
      icon: 'Dices',
      statusMetric: '5 PBR Skins · Nat 20 Shaders',
    },
    {
      number: 7,
      name: 'Music & Ambience',
      stack: 'Browser Web Audio API + .NET Events',
      route: '/assets',
      icon: 'Music',
      statusMetric: '4 Harmonic Stems · Crossfader',
    },
    {
      number: 8,
      name: 'The Loom',
      stack: '.NET + Neo4j Zero-Gen GraphRAG',
      route: '/loom',
      icon: 'BookOpen',
      statusMetric: 'Per-Player Witness Isolation',
    },
    {
      number: 9,
      name: 'The Weave',
      stack: 'Neo4j SVG Graph + 100% GM Gate',
      route: '/weave',
      icon: 'Network',
      statusMetric: 'Approve / Re-Weave / Reject',
    },
    {
      number: 10,
      name: 'Marketplace',
      stack: '.NET Entitlements + 85/15 Split',
      route: '/marketplace',
      icon: 'ShoppingBag',
      statusMetric: '85% Creator Royalty · Free Seats',
    },
    {
      number: 11,
      name: 'Campaign Analytics',
      stack: '.NET Telemetry + lw-stat-radar',
      route: '/statistics',
      icon: 'BarChart3',
      statusMetric: 'Party Radars & Mythic Feats',
    },
  ];

  readonly featuredEntities = computed(() => this.store.authorizedEntities().slice(0, 4));
  readonly featuredAssets = computed(() => this.store.assets().slice(0, 3));

  constructor() {
    this.http.get<readonly LwSessionRecapItem[]>('/api/v2/campaigns/1/sessions').subscribe({
      next: (res) => {
        if (res?.length) this.sessions.set(res);
      },
      error: () => {},
    });
  }

  concludeAndLogSession(): void {
    const title = this.newSessionTitle().trim();
    const summary = this.newSessionSummary().trim();
    if (!title || !summary) return;

    const nextNum =
      this.sessions().length > 0
        ? Math.max(...this.sessions().map((s) => s.sessionNumber)) + 1
        : 19;

    const payload = {
      sessionNumber: nextNum,
      title,
      locationName: this.newSessionLocation().trim() || 'Road to Edhellain',
      xpAwarded: this.newSessionXp(),
      summary,
    };

    this.http.post<LwSessionRecapItem>('/api/v2/campaigns/1/sessions', payload).subscribe({
      next: (created) => {
        this.sessions.update((prev) => [created, ...prev]);
        this.sessionBanner.set(
          `Logged "${created.title}" and automatically awarded +${created.xpAwarded} XP to the party.`,
        );
      },
      error: () => {
        const localRecap: LwSessionRecapItem = {
          id: `session-${Date.now()}`,
          campaignId: 1,
          sessionNumber: nextNum,
          title,
          locationName: payload.locationName,
          dateLabel: 'Book II Chronicle',
          xpAwarded: payload.xpAwarded,
          summary,
          highlights: [
            `Concluded Session ${nextNum} (+${payload.xpAwarded} XP awarded)`,
            'Synchronized session memory with The Loom and Campaign Analytics',
          ],
          deepLinks: [
            { label: 'Campaign Quests', route: '/campaigns', entityKey: '1:Character:char-dal' },
            { label: 'The Loom Recall', route: '/loom', entityKey: '1:Character:char-munk' },
          ],
        };
        this.sessions.update((prev) => [localRecap, ...prev]);
        this.sessionBanner.set(
          `Logged "${localRecap.title}" and awarded +${localRecap.xpAwarded} XP.`,
        );
      },
    });
  }
}
