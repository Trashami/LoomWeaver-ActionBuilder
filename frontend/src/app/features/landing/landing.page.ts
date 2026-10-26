import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { LwBadgeComponent, LwButtonComponent, LwIconComponent } from '../../shared/ui/public-api';

export interface StorySlideVm {
  readonly id: 'world' | 'battlemap' | 'desk' | 'portrait';
  readonly badge: string;
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly prompt: string;
  readonly tags: readonly string[];
}

export interface LoomDemoPromptVm {
  readonly id: string;
  readonly question: string;
  readonly roleScope: string;
  readonly answer: string;
  readonly citations: readonly { readonly label: string; readonly route: string; readonly kind: string }[];
}

export interface LandingFaqItemVm {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

@Component({
  selector: 'lw-landing-page',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit {
  readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);

  readonly activeStorySlide = signal<StorySlideVm['id']>('world');
  readonly activeLoomPromptId = signal<string>('emrys-cinth');
  readonly openFaqId = signal<string>('faq-gm-authorship');

  readonly storySlides: readonly StorySlideVm[] = [
    {
      id: 'world',
      badge: 'World Atlas & Canon',
      title: 'Icrandor Continental Cartography & Multi-Step Quests',
      description:
        'Plot travel routes from Vandia to Cinth across the Plains of Red, attach GM-only POI secrets, and link regional lore directly to active party quests.',
      image: '/icrandor_world_dashboard.jpg',
      prompt: 'Atlas Layer: Southern Icrandor · Route: Vandia Cliff House to Cinth Masquerade',
      tags: ['Interactive Travel Paths', 'POI Secret Scoping', 'Quest Clue Chains'],
    },
    {
      id: 'battlemap',
      badge: 'LoomMaps & 2.5D VTT',
      title: 'Cutaway Wall Architecture & Dynamic 2.5D Lighting',
      description:
        'Author multi-layer battlemaps with smart portal cutouts, ribbon splines, and ambient occlusion shadows, then launch straight into 2.5D line-of-sight combat.',
      image: '/tactical-combat-live-ui.jpg',
      prompt: 'Scene: Runic Cavern Beneath the Mountain · Lighting: Ritual Torchlight + LoS Fog',
      tags: ['Cutaway Walls', '3D Physics Dice', 'Action Economy Tracker'],
    },
    {
      id: 'desk',
      badge: 'The Weave Graph Engine',
      title: 'Campaign Knowledge Graph with 100% GM Authorship',
      description:
        'Visualize every faction, Luminary relic, NPC bloodline, and session consequence in Neo4j. Draft new lore with The Weave and review, edit, or reject before committing.',
      image: '/the-weave-graph-engine.jpg',
      prompt: 'Graph Cluster: Council of Magic · Priors of Ekkos · Artificers Guild of Cinth',
      tags: ['Neo4j Lore Graph', '100% GM Review Gate', 'Zero Unapproved Canon'],
    },
    {
      id: 'portrait',
      badge: 'Witness-Scoped Dossiers',
      title: 'Per-Player Knowledge Isolation & Character Chronicles',
      description:
        'Separate what Fivi, Dal, Kildrid, Kycius, and Munk have personally witnessed from party-wide knowledge and GM-only secrets.',
      image: '/uploads/characters/fivi.jpg',
      prompt: 'Witness Filter: Fivi · Feywild Outcast · Private Note Scope Enabled',
      tags: ['Per-Player Isolation', '100% Free Player Seats', 'Deep-Linked Recaps'],
    },
  ];

  readonly currentStorySlide = computed(
    () => this.storySlides.find((s) => s.id === this.activeStorySlide()) ?? this.storySlides[0],
  );

  readonly loomPrompts: readonly LoomDemoPromptVm[] = [
    {
      id: 'emrys-cinth',
      question: 'What did the party learn about Emrys and the Priors at the Cinth Masquerade?',
      roleScope: 'Party Canon (Session 14)',
      answer:
        'At Lord Vaelen’s masquerade in Cinth, Emrys presented himself as a reformer claiming the new Council of Magic protects all spellcasters. Kycius and Dal cross-referenced Captain Kutler’s Chokrah manifest with the Artificers Guild ledger, confirming the Priors of Ekkos secretly siphon innate magic from street-born students.',
      citations: [
        { label: 'Session 14 Recap: Cinth Masquerade', route: '/campaigns', kind: 'Recap' },
        { label: 'NPC Dossier: Emrys of the Sidhe Ard', route: '/campaigns', kind: 'NPC' },
        { label: 'Location: Cinth Artificer District', route: '/maps', kind: 'Atlas' },
      ],
    },
    {
      id: 'kildrid-stone',
      question: 'What did Kildrid sense beneath the southern mountain on the road to Cinth?',
      roleScope: 'Witness Scoped: Kildrid',
      answer:
        'Passing the southern mountain forest along the northeast road from Vandia, Kildrid felt ancient containment runes vibrating through the bedrock—an immortal dragon clawing endlessly at a prison bound to three stolen Luminaries.',
      citations: [
        { label: 'Kildrid Private Stone-Sense Note', route: '/loom', kind: 'Scoped Note' },
        { label: 'Quest: Shadow of the Mountain', route: '/campaigns', kind: 'Quest' },
      ],
    },
    {
      id: 'dolly-pocket',
      question: 'How did Kycius modify Dolly on the road to Cinth?',
      roleScope: 'Party Canon (Session 11)',
      answer:
        'During camp near the Plains of Red, Kycius stitched an extradimensional Maw-Vault pocket inside Dolly’s jaws so Fivi’s companion could swallow contraptions and foes non-lethally without actually killing bystanders.',
      citations: [
        { label: 'Item & Companion Log: Dolly Maw-Vault', route: '/characters', kind: 'Inventory' },
        { label: 'Character Sheet: Fivi & Kycius', route: '/characters', kind: 'Party' },
      ],
    },
  ];

  readonly currentLoomPrompt = computed(
    () => this.loomPrompts.find((p) => p.id === this.activeLoomPromptId()) ?? this.loomPrompts[0],
  );

  readonly faqs: readonly LandingFaqItemVm[] = [
    {
      id: 'faq-gm-authorship',
      question: 'Does LoomWeaver write my story or replace the Game Master?',
      answer:
        'Never. The Loom has a strict Zero Generation policy: it only searches and synthesizes your established canon and session history with clickable citations. When you optionally use The Weave to draft NPCs, encounters, or lore, every output is held in a staging buffer requiring 100% GM review to edit, re-weave, or reject.',
    },
    {
      id: 'faq-free-players',
      question: 'Do my players have to pay for a subscription to join my table?',
      answer:
        'No. Table accessibility is a core promise: players join via frictionless invite links for 100% free forever. Players get full access to character sheets, the 2.5D Virtual Tabletop, 3D dice, and witness-scoped Loom campaign memory without any paywall.',
    },
    {
      id: 'faq-player-isolation',
      question: 'How does LoomWeaver protect GM secrets from players?',
      answer:
        'Every note, NPC dossier, map stamp, and session entry enforces three-tier privacy scoping: Private to Player, Shared with GM Only, or Revealed to Party. Queries run through The Loom automatically filter the graph by the asking player’s witness scope.',
    },
    {
      id: 'faq-marketplace',
      question: 'How does the 85/15 Creator Marketplace revenue split work?',
      answer:
        'Creators keep 85% of every sale on custom campaigns, LoomMaps battlemap packs, adventure modules, and encounters via automated Stripe Connect split settlement, with one-click module importing directly into GM workspaces.',
    },
  ];

  ngOnInit(): void {
    this.titleSvc.setTitle(
      'LoomWeaver | AI-Assisted TTRPG Campaign Management, Living Lore Memory & Virtual Tabletop',
    );
    this.metaSvc.updateTag({
      name: 'description',
      content:
        'LoomWeaver is the living world platform for D&D 5e and tabletop RPGs. Search your campaign canon with The Loom (free), draft lore with The Weave under 100% GM authorship, and play on a 2.5D Virtual Tabletop.',
    });

    const currentPath = this.router.url.split('?')[0];
    if (currentPath === '/login') {
      this.auth.openAuthModal('login');
    } else if (currentPath === '/register') {
      this.auth.openAuthModal('register');
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.applyFeatureSeo(slug);
    }
  }

  enterStudioAsDemoGm(): void {
    this.auth.loginAsAccount('acc-gm-trashami', true);
  }

  enterStudioAsFreePlayer(): void {
    this.auth.loginAsAccount('acc-player-fivi', true);
  }

  toggleFaq(id: string): void {
    this.openFaqId.update((curr) => (curr === id ? '' : id));
  }

  private applyFeatureSeo(slug: string): void {
    const seoMap: Record<string, { title: string; desc: string }> = {
      'campaign-memory': {
        title: 'The Loom — Free TTRPG Campaign Memory & Lore Search | LoomWeaver',
        desc: 'Search your D&D 5e campaign notes, session recaps, and NPC dossiers in natural language with zero hallucination and per-player secret isolation.',
      },
      'worldbuilding-ai': {
        title: 'The Weave — GM-Authored Worldbuilding & Lore Graph | LoomWeaver',
        desc: 'Draft context-aware NPCs, monsters, quests, and battlemaps grounded in your Neo4j campaign graph with 100% Game Master review control.',
      },
      'virtual-tabletop': {
        title: 'Arcane Screen — 2.5D Virtual Tabletop, Lighting & 3D Dice | LoomWeaver',
        desc: 'Run tactical tabletop RPG combat with 2.5D gradual lighting, line-of-sight fog of war, 3D physics dice, action economy tracking, and automated XP.',
      },
      'world-atlas-quests': {
        title: 'LoomMaps — World Atlas, Cutaway Walls & Quest Tracking | LoomWeaver',
        desc: 'Build interactive regional maps and multi-layer tactical battlemaps with cutaway walls, spline ribbons, party travel markers, and POI secrets.',
      },
      'creator-marketplace': {
        title: 'TTRPG Creator Marketplace — 85/15 Revenue Split | LoomWeaver',
        desc: 'Publish and monetize custom campaigns, adventure modules, and battlemaps with a creator-first 85/15 revenue split and one-click GM imports.',
      },
    };
    const found = seoMap[slug];
    if (found) {
      this.titleSvc.setTitle(found.title);
      this.metaSvc.updateTag({ name: 'description', content: found.desc });
    }
  }
}
