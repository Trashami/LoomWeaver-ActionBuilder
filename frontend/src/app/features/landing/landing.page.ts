import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  isSubdomainHost,
  resolveDefaultStudioRouteForHost,
} from '../../core/services/cookie-sso.helper';
import { LwIconComponent } from '../../shared/ui/public-api';

export interface PillarFeatureCardVm {
  readonly id: string;
  readonly icon: string;
  readonly title: string;
  readonly flag?: string;
  readonly accent: 'emerald' | 'gold';
  readonly description: string;
  readonly bullets: readonly string[];
  readonly route: string;
  readonly seoSlug: string;
}

export interface StudioEngineShowcaseVm {
  readonly id: string;
  readonly tag: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly image: string;
  readonly metrics: readonly string[];
  readonly route: string;
}

export interface SessionIntelItemVm {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly scope: string;
  readonly detail: string;
  readonly citations: readonly string[];
}

export interface PricingPlanVm {
  readonly id: string;
  readonly tier: string;
  readonly subtitle: string;
  readonly monthlyPrice: number;
  readonly yearlyMonthlyEquivalent: number;
  readonly yearlyTotal: number;
  readonly billedDefault: string;
  readonly ctaLabel: string;
  readonly popular?: boolean;
  readonly popularLabel?: string;
  readonly features: readonly string[];
}

export interface LandingFaqItemVm {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

@Component({
  selector: 'lw-landing-page',
  standalone: true,
  imports: [RouterLink, LwIconComponent],
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

  readonly mobileMenuOpen = signal<boolean>(false);
  readonly billingAnnual = signal<boolean>(false);
  readonly activeIntelId = signal<string>('cult-presence');
  readonly activeExperienceMode = signal<'memory' | 'vtt' | 'guides' | 'dice'>('vtt');
  readonly openFaqId = signal<string>('faq-what-is-loomweaver-vtt');

  readonly primaryPillars: readonly PillarFeatureCardVm[] = [
    {
      id: 'loom',
      icon: 'sparkles',
      title: 'The Loom',
      accent: 'emerald',
      description:
        'Your campaign-aware living memory companion. Recall decisions, find a forgotten NPC name, and explore campaign canon with role-aware answers that keep unrevealed secrets GM-only.',
      bullets: [
        '100% Free for both Game Masters and Players',
        'Strict Zero-Generation policy: cites established canon only',
        'Per-player witness isolation and deep-linked citations',
      ],
      route: '/loom',
      seoSlug: 'campaign-memory',
    },
    {
      id: 'weave',
      icon: 'network',
      title: 'The Weave',
      flag: 'OPTIONAL',
      accent: 'gold',
      description:
        'Connect NPCs, factions, lore, quests, and locations into a living Neo4j web. Draft grounded worldbuilding assets when you want inspiration; switch it off when you do not.',
      bullets: [
        '100% GM Authorship: edit, re-weave, or reject every draft',
        'Grounded in your campaign graph and faction histories',
        'Generates NPCs, monsters, quests, items, and loot tables',
      ],
      route: '/weave',
      seoSlug: 'worldbuilding-ai',
    },
    {
      id: 'arcane-screen',
      icon: 'swords',
      title: 'Arcane Screen & VTT',
      accent: 'emerald',
      description:
        'One command center for your live tabletop sessions: 2.5D Virtual Tabletop combat, initiative, action economy tracking, hidden GM notes, consequences, and automated XP awards.',
      bullets: [
        '2.5D gradual lighting and real-time line-of-sight fog of war',
        'Per-turn Action, Bonus Action, Reaction, and Movement tracking',
        'Automated AC/DC hit and save calculations with spell FX',
      ],
      route: '/arcane-screen',
      seoSlug: 'virtual-tabletop',
    },
    {
      id: 'maps-scenes',
      icon: 'map',
      title: 'LoomMaps & Scenes',
      accent: 'emerald',
      description:
        'Draw pro battlemaps in 2D, explore tactical scenes in 2.5D/3D, place light-aware tokens and cutaway walls, and link every regional atlas marker directly to your story.',
      bullets: [
        'Cutaway wall architecture with smart portal cutouts',
        'Multi-step quest tracking, travel paths, and POI secrets',
        'High-resolution top-down stamps and ambient occlusion',
      ],
      route: '/maps',
      seoSlug: 'world-atlas-quests',
    },
  ];

  readonly studioEngines: readonly StudioEngineShowcaseVm[] = [
    {
      id: 'engine-vtt',
      tag: '2.5D Virtual Tabletop (VTT)',
      title: 'Tactical Combat Engine & Arcane Screen',
      subtitle: 'Dynamic Lighting · Line-of-Sight Fog · Automated Action Economy',
      description:
        'Run smooth D&D 5e and custom RPG encounters in browser without heavy plugins. Track every combatant’s Action, Bonus Action, Reaction, and Movement, trigger particle/shader spell effects, and award XP automatically when encounters conclude.',
      image: '/tactical-combat-live-ui.jpg',
      metrics: ['2.5D Gradual Lighting', 'Automated AC/DC & XP', 'Zero Player Paywall'],
      route: '/encounters',
    },
    {
      id: 'engine-weave',
      tag: 'Polyglot Lore Graph',
      title: 'The Loom Memory & The Weave Graph Studio',
      subtitle: 'MySQL Canonical Ledger + Neo4j Relationship Web',
      description:
        'Every NPC bloodline, faction rivalry, Luminary artifact, and session log is indexed by witness scope. Players query what their character has seen; Game Masters orchestrate hidden truths across the entire campaign graph.',
      image: '/the-weave-graph-engine.jpg',
      metrics: ['Per-Player Isolation', '100% GM Review Gate', 'Deep-Linked Dossiers'],
      route: '/loom',
    },
    {
      id: 'engine-atlas',
      tag: 'LoomMaps & World Atlas',
      title: 'Continental Cartography & Battlemap Authoring',
      subtitle: 'Cutaway Walls · Spline Ribbons · Multi-Step Quests',
      description:
        'Chart overland expeditions from Vandia to Cinth, pin GM-only POI secrets, and sculpt multi-layer tactical dungeons with wall-portal cutouts, biome brushes, and synchronized 2D/3D camera perspectives.',
      image: '/icrandor_world_dashboard.jpg',
      metrics: ['2D + 3D Hybrid Canvas', 'Quest Clue Chains', 'Private Creator Assets'],
      route: '/maps',
    },
    {
      id: 'engine-dice-fx',
      tag: 'Physics Dice & Shader FX',
      title: '3D Polyhedral Dice Forge & Visual Effect Builder',
      subtitle: 'Custom Materials · Roll Telemetry · Spell Particle Shaders',
      description:
        'Roll weighted-fair 3D physics dice across shared table trays, customize raven-emerald and arcane-gold dice sets, and bind custom projectile, aura, and impact shaders directly to character actions.',
      image: '/dice-physics-engine.jpg',
      metrics: ['3D Rigid-Body Dice', 'Live Roll Telemetry', 'Custom Spell Shaders'],
      route: '/dice',
    },
  ];

  readonly sessionIntelItems: readonly SessionIntelItemVm[] = [
    {
      id: 'cult-presence',
      icon: 'check',
      label: 'Reveal cult presence in the nave',
      scope: 'GM Encounter Trigger · Act I',
      detail:
        'Three Priors acolytes are concealed behind the shattered pillars (Stealth DC 15). Triggering the ambush illuminates ritual braziers on the 2.5D VTT and rolls initiative for 5 combatants.',
      citations: ['Encounter: Ruined Chapel Ambush', 'VTT Lighting Preset: Eldritch Brazier'],
    },
    {
      id: 'brother-malric',
      icon: 'users',
      label: 'Brother Malric nearby (Witness Scoped)',
      scope: 'NPC Dossier · Known to Dal & Kycius',
      detail:
        'Malric fled Cinth after discovering the Chokrah shipping ledgers. Only Dal and Kycius recognize his signet ring from Session 11; other players see "Hooded Chapel Keeper" until revealed.',
      citations: ['NPC Dossier: Brother Malric', 'Session 11 Recap: Plains of Red'],
    },
    {
      id: 'hidden-crypt',
      icon: 'lock',
      label: 'Hidden crypt beneath the obsidian altar',
      scope: 'GM Secret POI · Stone-Sense DC 16',
      detail:
        'Kildrid’s stone-sense detects hollow runic masonry beneath the altar stairs leading to the subterranean containment vault.',
      citations: ['LoomMaps Layer: Lower Crypt Cutaway', 'Quest Clue: Shadow of the Mountain'],
    },
    {
      id: 'ask-the-loom',
      icon: 'sparkles',
      label: 'Ask The Loom: "What was promised at the Chapel?"',
      scope: 'Instant Canon Synthesis · Zero Generation',
      detail:
        'The Loom synthesizes Session 8 and Session 14 notes: Captain Kutler swore to deliver the skyship manifest here if the Artificers Guild of Cinth verified the stolen magic.',
      citations: ['Session 8 Log: Vandia Cliff House', 'Faction: Artificers Guild of Cinth'],
    },
  ];

  readonly currentIntel = computed(
    () =>
      this.sessionIntelItems.find((item) => item.id === this.activeIntelId()) ??
      this.sessionIntelItems[0],
  );

  readonly pricingPlans: readonly PricingPlanVm[] = [
    {
      id: 'spark',
      tier: 'The Spark',
      subtitle: 'The beginning of every legend.',
      monthlyPrice: 0,
      yearlyMonthlyEquivalent: 0,
      yearlyTotal: 0,
      billedDefault: 'Free forever · No credit card required',
      ctaLabel: 'Begin Free',
      features: [
        'Create your first living campaign world',
        'The Loom campaign memory search (100% free)',
        'Character Studio sheets, notes, and session logs',
        'Core 2.5D Virtual Tabletop (VTT) & 3D physics dice',
        '100% Free player participation via invite links',
      ],
    },
    {
      id: 'threadkeeper',
      tier: 'The Threadkeeper',
      subtitle: 'Keep your adventures close.',
      monthlyPrice: 6,
      yearlyMonthlyEquivalent: 5,
      yearlyTotal: 60,
      billedDefault: 'Billed monthly',
      ctaLabel: 'Choose Threadkeeper',
      features: [
        'Everything in The Spark',
        'Expanded campaign worlds & Neo4j lore graph',
        'The Loom with extended witness-scoped threads',
        'LoomMaps battlemap studio & expanded scene storage',
        'Unlimited free player seats at every table',
      ],
    },
    {
      id: 'weaver',
      tier: 'The Weaver',
      subtitle: 'Bring your world to life.',
      monthlyPrice: 12,
      yearlyMonthlyEquivalent: 10,
      yearlyTotal: 120,
      billedDefault: 'Billed monthly',
      ctaLabel: 'Become a Weaver',
      popular: true,
      popularLabel: 'For devoted GMs',
      features: [
        'Everything in Threadkeeper',
        'Full 2.5D/3D VTT dynamic lighting & cutaway walls',
        'The Weave optional AI companion (100% GM authorship)',
        'Advanced World Atlas travel paths & quest chains',
        'Custom spell shader FX & ambience soundscapes',
      ],
    },
    {
      id: 'archweaver',
      tier: 'The Archweaver',
      subtitle: 'For boundless storytellers & creators.',
      monthlyPrice: 24,
      yearlyMonthlyEquivalent: 20,
      yearlyTotal: 240,
      billedDefault: 'Billed monthly',
      ctaLabel: 'Choose Archweaver',
      features: [
        'Everything in The Weaver',
        'Maximum worldbuilding, asset, and 3D model capacity',
        'Priority Weave synthesis & multi-campaign universe linking',
        'Creator Marketplace publishing with 85/15 revenue split',
        'One-click adventure module packaging & export tools',
      ],
    },
  ];

  readonly faqs: readonly LandingFaqItemVm[] = [
    {
      id: 'faq-what-is-loomweaver-vtt',
      question: 'What is LoomWeaver (Loom-Weaver) and how does it compare to a traditional VTT?',
      answer:
        'LoomWeaver (accessible at loom-weaver.com) is an all-in-one Tabletop RPG Operating System and 2.5D Virtual Tabletop (VTT). Unlike standalone VTTs that separate your battlemaps from your campaign wiki, LoomWeaver connects your 2.5D tactical combat map, 3D physics dice, Character Studio, World Atlas, and living campaign memory (The Loom) into one unified dark-fantasy workspace.',
    },
    {
      id: 'faq-gm-authorship',
      question: 'Does LoomWeaver write my story or replace the Game Master?',
      answer:
        'Never. The Loom has a strict Zero-Generation policy: it only searches and synthesizes your established campaign canon and session history with clickable citations. When you optionally enable The Weave to draft NPCs, monsters, quests, or battlemaps, every single output is a draft requiring 100% GM review—edit, re-weave, or reject before anything enters your world.',
    },
    {
      id: 'faq-free-players',
      question: 'Do my players have to pay for a subscription to join my Virtual Tabletop?',
      answer:
        'No. Players join your table for 100% free via frictionless invite links. Players never need a subscription to use Character Studio sheets, move tokens on the 2.5D VTT, roll 3D dice, or query The Loom for memories their character has witnessed.',
    },
    {
      id: 'faq-player-isolation',
      question: 'How does LoomWeaver protect GM secrets and per-player knowledge?',
      answer:
        'Every note, NPC dossier, map POI, and session entry enforces permission boundaries at retrieval time: Private to Player, Shared with GM Only, or Revealed to Party. When a player asks The Loom a question, the engine filters the knowledge graph so unrevealed GM twists stay strictly hidden.',
    },
    {
      id: 'faq-marketplace',
      question: 'How does the 85/15 Creator Marketplace revenue split work?',
      answer:
        'Independent creators keep 85% of revenue on custom campaigns, adventure modules, LoomMaps asset packs, and ready-to-run VTT encounters—with one-click module importing directly into any Game Master account.',
    },
  ];

  ngOnInit(): void {
    this.titleSvc.setTitle(
      'LoomWeaver (Loom-Weaver) — 2.5D Virtual Tabletop (VTT), Living Campaign Memory & TTRPG Studio',
    );
    this.metaSvc.updateTag({
      name: 'description',
      content:
        'LoomWeaver (loom-weaver.com) is the unified 2.5D Virtual Tabletop (VTT) and TTRPG campaign manager for D&D 5e and custom worlds. Free living campaign memory (The Loom), optional GM-authored worldbuilding (The Weave), LoomMaps cartography, and 100% free player seats.',
    });

    const currentPath = this.router.url.split('?')[0];
    const queryAuth = this.route.snapshot.queryParamMap.get('auth');
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || resolveDefaultStudioRouteForHost();

    if (isSubdomainHost()) {
      if (this.auth.isAuthenticated()) {
        void this.router.navigateByUrl(resolveDefaultStudioRouteForHost());
        return;
      }
      this.auth.openAuthModal('login', resolveDefaultStudioRouteForHost());
    } else if (currentPath === '/login' || queryAuth === 'login') {
      this.auth.openAuthModal('login', returnUrl);
    } else if (currentPath === '/register' || queryAuth === 'register') {
      this.auth.openAuthModal('register', returnUrl);
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.applyFeatureSeo(slug);
    }
  }

  openAuth(mode: 'login' | 'register', targetRoute?: string): void {
    this.mobileMenuOpen.set(false);
    const dest = targetRoute || resolveDefaultStudioRouteForHost();
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(dest);
      return;
    }
    this.auth.openAuthModal(mode, dest);
  }

  enterStudioOrSignIn(targetRoute?: string): void {
    this.openAuth('login', targetRoute);
  }

  setBilling(annual: boolean): void {
    this.billingAnnual.set(annual);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.mobileMenuOpen.set(false);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  toggleFaq(id: string): void {
    this.openFaqId.update((curr) => (curr === id ? '' : id));
  }

  private applyFeatureSeo(slug: string): void {
    const seoMap: Record<string, { title: string; desc: string }> = {
      'campaign-memory': {
        title: 'The Loom — Free TTRPG Campaign Memory & Lore Search | LoomWeaver VTT',
        desc: 'Search your D&D 5e campaign notes, session recaps, and NPC dossiers in natural language with zero hallucination and per-player secret isolation on LoomWeaver.',
      },
      'worldbuilding-ai': {
        title: 'The Weave — GM-Authored Worldbuilding & Lore Graph | LoomWeaver',
        desc: 'Draft context-aware NPCs, monsters, quests, and battlemaps grounded in your Neo4j campaign graph with 100% Game Master review control.',
      },
      'virtual-tabletop': {
        title: 'LoomWeaver VTT — 2.5D Virtual Tabletop, Lighting, Action Economy & 3D Dice',
        desc: 'Run tactical tabletop RPG combat on the LoomWeaver 2.5D Virtual Tabletop (VTT) with gradual lighting, line-of-sight fog of war, 3D physics dice, and automated XP.',
      },
      'world-atlas-quests': {
        title: 'LoomMaps — VTT Battlemap Maker, Cutaway Walls & World Atlas | LoomWeaver',
        desc: 'Build interactive regional maps and multi-layer tactical VTT battlemaps with cutaway walls, spline ribbons, party travel markers, and POI secrets.',
      },
      'creator-marketplace': {
        title: 'TTRPG & VTT Creator Marketplace — 85/15 Revenue Split | LoomWeaver',
        desc: 'Publish and monetize custom campaigns, adventure modules, and VTT battlemaps with a creator-first 85/15 revenue split and one-click GM imports.',
      },
    };
    const found = seoMap[slug];
    if (found) {
      this.titleSvc.setTitle(found.title);
      this.metaSvc.updateTag({ name: 'description', content: found.desc });
    }
  }
}
