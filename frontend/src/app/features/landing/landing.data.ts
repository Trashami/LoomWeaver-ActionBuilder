export const LANDING_ASSET_PATHS = {
  brandLogoWordmark: '/landing-assets/brand/logo-wordmark.png',
  brandRavenEmblem: '/landing-assets/brand/raven-emblem.png',
  heroWallpaper: '/landing-assets/hero/hero-wallpaper.png',
  heroShowcaseCard: '/landing-assets/hero/hero-showcase-card.png',
  engineVttCombat: '/landing-assets/engines/engine-1-vtt-combat.jpg',
  engineLoomWeaveGraph: '/landing-assets/engines/engine-2-loom-weave-graph.jpg',
  engineLoomMapsAtlas: '/landing-assets/engines/engine-3-loommaps-atlas.jpg',
  engineDiceShaderFx: '/landing-assets/engines/engine-4-dice-shader-fx.jpg',
  sectionAtmosphere: '/landing-assets/backgrounds/section-atmosphere.jpg',
} as const;

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
  readonly seoPath: string;
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
  readonly seoPath: string;
  readonly subdomainUrl: string;
  readonly subdomainHost: string;
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

export const LANDING_PRIMARY_PILLARS: readonly PillarFeatureCardVm[] = [
  {
    id: 'loom',
    icon: 'book-open',
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
    seoPath: '/ai-campaign-assistant',
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
    seoPath: '/campaign-manager',
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
    seoPath: '/vtt',
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
    seoPath: '/battlemap-builder',
  },
];

export const LANDING_STUDIO_ENGINES: readonly StudioEngineShowcaseVm[] = [
  {
    id: 'engine-vtt',
    tag: '2.5D Virtual Tabletop (VTT)',
    title: 'LoomWeaver VTT & Arcane Screen',
    subtitle: 'Dynamic Lighting · Line-of-Sight Fog · Automated Action Economy',
    description:
      'Run smooth D&D 5e and custom TTRPG encounters in browser without heavy plugins. Track every combatant’s Action, Bonus Action, Reaction, and Movement, trigger particle/shader spell effects, and award XP automatically when encounters conclude.',
    image: LANDING_ASSET_PATHS.engineVttCombat,
    metrics: ['2.5D Gradual Lighting', 'Automated AC/DC & XP', 'Zero Player Paywall'],
    route: '/arcane-screen',
    seoPath: '/vtt',
    subdomainUrl: 'https://vtt.loom-weaver.com',
    subdomainHost: 'vtt.loom-weaver.com',
  },
  {
    id: 'engine-weave',
    tag: 'Polyglot Lore Graph',
    title: 'The Loom Memory & Campaign Manager',
    subtitle: 'MySQL Canonical Ledger + Neo4j Relationship Web',
    description:
      'Every NPC bloodline, faction rivalry, Luminary artifact, and session log is indexed by witness scope. Players query what their character has seen; Game Masters orchestrate hidden truths across the entire TTRPG campaign graph.',
    image: LANDING_ASSET_PATHS.engineLoomWeaveGraph,
    metrics: ['Per-Player Isolation', '100% GM Review Gate', 'Deep-Linked Dossiers'],
    route: '/loom',
    seoPath: '/campaign-manager',
    subdomainUrl: 'https://loom-weaver.com/campaign-manager',
    subdomainHost: 'loom-weaver.com/campaign-manager',
  },
  {
    id: 'engine-atlas',
    tag: 'LoomMaps & World Atlas',
    title: 'LoomMaps Battlemap & World Atlas Studio',
    subtitle: 'Cutaway Walls · Spline Ribbons · Multi-Step Quests',
    description:
      'Chart overland expeditions, pin GM-only POI secrets, and sculpt multi-layer tactical dungeons on maps.loom-weaver.com with wall-portal cutouts, biome brushes, and synchronized 2D/3D camera perspectives.',
    image: LANDING_ASSET_PATHS.engineLoomMapsAtlas,
    metrics: ['2D + 3D Hybrid Canvas', 'Quest Clue Chains', 'Private Creator Assets'],
    route: '/maps',
    seoPath: '/battlemap-builder',
    subdomainUrl: 'https://maps.loom-weaver.com',
    subdomainHost: 'maps.loom-weaver.com',
  },
  {
    id: 'engine-dice-fx',
    tag: 'Effect Builder & Shader FX',
    title: 'Effect Builder Studio & Spell Shaders',
    subtitle: '35+ Shader Styles · Layered Particles · Composition Timeline',
    description:
      'Design custom TTRPG spell animations on effectbuilder.loom-weaver.com with layered particle emitters, projectile arcs, impact shockwaves, and persistent auras bound directly to character actions and VTT combat rolls.',
    image: LANDING_ASSET_PATHS.engineDiceShaderFx,
    metrics: ['35+ Shader Styles', 'Timeline Composer', 'Live VTT Binding'],
    route: '/effects',
    seoPath: '/effect-builder',
    subdomainUrl: 'https://effectbuilder.loom-weaver.com',
    subdomainHost: 'effectbuilder.loom-weaver.com',
  },
  {
    id: 'engine-actions',
    tag: 'Action & Encounter Builder',
    title: 'Tactical Action & Encounter Studio',
    subtitle: 'Monster Statblocks · Boss Phases · Automated Saves & Damage',
    description:
      'Author custom monster actions, multi-attack routines, saving throw DCs, and balanced TTRPG encounter rosters on actionbuilder.loom-weaver.com—ready to launch directly onto the 2.5D Virtual Tabletop.',
    image: LANDING_ASSET_PATHS.engineVttCombat,
    metrics: ['Custom Action Economy', 'Automated Save DCs', 'Instant VTT Launch'],
    route: '/encounters',
    seoPath: '/encounter-builder',
    subdomainUrl: 'https://actionbuilder.loom-weaver.com',
    subdomainHost: 'actionbuilder.loom-weaver.com',
  },
  {
    id: 'engine-3d-assets',
    tag: '3D Assets & Dice Forge',
    title: '3D Asset Studio, Generator & Dice Forge',
    subtitle: 'GLB Miniatures · Cutaway Props · 3D Rigid-Body Polyhedral Dice',
    description:
      'Browse and generate 3D tabletop miniatures, light-aware dungeon props, and custom raven-emerald polyhedral dice sets across 3dassets.loom-weaver.com and generator.loom-weaver.com.',
    image: LANDING_ASSET_PATHS.engineDiceShaderFx,
    metrics: ['GLB 3D Miniatures', '3D Physics Dice', 'Shared Asset Vault'],
    route: '/assets',
    seoPath: '/3d-assets',
    subdomainUrl: 'https://3dassets.loom-weaver.com',
    subdomainHost: '3dassets.loom-weaver.com',
  },
];

export const LANDING_SESSION_INTEL_ITEMS: readonly SessionIntelItemVm[] = [
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
    icon: 'book-open',
    label: 'Ask The Loom: "What was promised at the Chapel?"',
    scope: 'Instant Canon Synthesis · Zero Generation',
    detail:
      'The Loom synthesizes Session 8 and Session 14 notes: Captain Kutler swore to deliver the skyship manifest here if the Artificers Guild of Cinth verified the stolen magic.',
    citations: ['Session 8 Log: Vandia Cliff House', 'Faction: Artificers Guild of Cinth'],
  },
];

export const LANDING_PRICING_PLANS: readonly PricingPlanVm[] = [
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

export const LANDING_FAQS: readonly LandingFaqItemVm[] = [
  {
    id: 'faq-what-is-loomweaver-vtt',
    question: 'What is LoomWeaver VTT and how does it compare to a traditional Virtual Tabletop (Virtual Table Top)?',
    answer:
      'LoomWeaver VTT (accessible at loom-weaver.com/vtt and vtt.loom-weaver.com) is an all-in-one 2D, 2.5D, and 3D Virtual Tabletop (VTT / virtual table top) and fantasy tabletop role playing game (TTRPG / table top role playing game) campaign manager. Unlike standalone VTTs that separate your fantasy table top battlemaps from your campaign wiki, LoomWeaver connects your 2D & 3D tactical combat map, 3D physics dice, Character Studio, World Atlas, and living campaign memory (The Loom) into one unified dark-fantasy workspace.',
  },
  {
    id: 'faq-fantasy-ttrpg-systems',
    question: 'Which fantasy TTRPG and table top role playing game systems work with LoomWeaver VTT?',
    answer:
      'LoomWeaver VTT supports D&D 5e (2014 & 2024 SRD), Pathfinder 2e, Vampire: The Masquerade V5, and custom fantasy TTRPG / fantasy tabletop worlds. Game Masters can build custom monster actions, spells, items, and character sheets for any table top role playing game.',
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
  {
    id: 'faq-ecosystem-domains',
    question: 'What are the official LoomWeaver TTRPG & VTT domains and studio tools?',
    answer:
      'The official LoomWeaver TTRPG & Virtual Tabletop platform is hosted at https://loom-weaver.com and unites specialized web studios under one shared Single Sign-On account: LoomWeaver VTT (vtt.loom-weaver.com), LoomMaps Battlemap & World Atlas Builder (maps.loom-weaver.com), Effect Builder Studio for spell shaders (effectbuilder.loom-weaver.com), Action & Encounter Builder (actionbuilder.loom-weaver.com), and 3D Asset & Miniature Generator Studio (3dassets.loom-weaver.com and generator.loom-weaver.com).',
  },
];
