import { LANDING_ASSET_PATHS } from './landing.data';

export interface SeoLandingPageConfig {
  readonly slug: string;
  readonly path: string;
  readonly navLabel: string;
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly eyebrow: string;
  readonly h1Line1: string;
  readonly h1Highlight: string;
  readonly leadHtml: string;
  readonly spotlightTitle: string;
  readonly spotlightSubtitle: string;
  readonly spotlightDescription: string;
  readonly screenshot: string;
  readonly screenshotAlt: string;
  readonly availableToday: readonly string[];
  readonly plannedNext: readonly string[];
  readonly studioRoute: string;
  readonly primaryCtaLabel: string;
  readonly subdomainUrl?: string;
  readonly subdomainLabel?: string;
}

export const SEO_LANDING_PAGES: Record<string, SeoLandingPageConfig> = {
  home: {
    slug: 'home',
    path: '/',
    navLabel: 'Home',
    title: 'LoomWeaver | VTT & TTRPG Campaign Manager',
    description:
      'Build living tabletop RPG worlds with LoomWeaver. Create maps, run encounters, manage characters and campaigns, and play with an integrated virtual tabletop.',
    canonical: 'https://loom-weaver.com/',
    eyebrow: 'A new chapter in tabletop storytelling · Integrated VTT & Campaign OS',
    h1Line1: 'Your Campaign.',
    h1Highlight: 'One Living World.',
    leadHtml:
      'Build living tabletop RPG worlds with <strong>LoomWeaver</strong>. Create maps, run tactical encounters on an integrated <strong>2D &amp; 3D Virtual Tabletop (VTT)</strong>, manage characters and campaigns, and keep every secret connected with <strong>The Loom</strong>.',
    spotlightTitle: 'LoomWeaver — Unified VTT & TTRPG Campaign Studio',
    spotlightSubtitle: 'Integrated Virtual Tabletop · Living Lore Graph · 100% Free Player Seats',
    spotlightDescription:
      'LoomWeaver connects your battlemaps, combat tracker, 3D dice, character sheets, and witness-scoped campaign memory into a single dark-fantasy workspace.',
    screenshot: LANDING_ASSET_PATHS.engineVttCombat,
    screenshotAlt: 'LoomWeaver VTT and TTRPG Campaign Manager interface showing tactical combat and lore graph',
    availableToday: [
      'Integrated 2D & 2.5D Virtual Tabletop (VTT) with gradual lighting, line-of-sight fog of war, and token elevation',
      'Per-turn Action, Bonus Action, Reaction, and Movement tracking with automated AC/DC hit and save resolution',
      'The Loom: Free natural-language campaign memory with strict per-player witness isolation and zero hallucination',
      'LoomMaps: 2D/3D battlemap and World Atlas builder with cutaway walls, portals, spline ribbons, and POI secrets',
      '3D rigid-body polyhedral dice forge, Character Studio sheets, and 100% free player seats via invite links',
    ],
    plannedNext: [
      'Expanded multi-system ruleset automation packs beyond D&D 5e, Pathfinder 2e, and Vampire V5',
      'Live browser video/voice spatial audio rooms synchronized with VTT token proximity',
      'Community Workshop automatic shader and 3D miniature kitbashing pipelines',
    ],
    studioRoute: '/home',
    primaryCtaLabel: 'Begin Your Story — Free',
  },
  vtt: {
    slug: 'vtt',
    path: '/vtt',
    navLabel: 'LoomWeaver VTT',
    title: 'LoomWeaver VTT | 2D & 3D Virtual Tabletop',
    description:
      'Explore LoomWeaver VTT, an integrated virtual tabletop for tabletop RPGs. Run encounters, roll 3D dice, manage combat, and connect gameplay to your living campaign.',
    canonical: 'https://loom-weaver.com/vtt',
    eyebrow: 'LoomWeaver VTT · 2D, 2.5D & 3D Virtual Tabletop Engine',
    h1Line1: 'Your World. Your Table.',
    h1Highlight: 'One Living Adventure.',
    leadHtml:
      'Explore <strong>LoomWeaver VTT</strong>, an integrated 2D &amp; 3D virtual tabletop for tabletop RPGs. Run tactical encounters, roll 3D physics dice, automate combat action economy, and connect every round of gameplay directly to your living campaign.',
    spotlightTitle: 'Inside LoomWeaver VTT — Tactical Combat Connected to Canon',
    spotlightSubtitle: '2.5D Gradual Lighting · Line-of-Sight Fog of War · 3D Dice · Automated XP',
    spotlightDescription:
      'Unlike standalone virtual tabletops that isolate your battlemap from your story notes, LoomWeaver VTT runs directly atop your campaign graph—linking every token, boss lair, trap, and quest consequence in real time.',
    screenshot: LANDING_ASSET_PATHS.engineVttCombat,
    screenshotAlt: 'LoomWeaver VTT showing 2.5D dynamic lighting, token line-of-sight, and tactical initiative tracker',
    availableToday: [
      '2D & 2.5D WebGL Virtual Tabletop with real-time gradual lighting, torch falloff, and line-of-sight fog of war',
      'Full combat tracker with per-turn Action, Bonus Action, Reaction, and Movement economy pips for every combatant',
      'Target-in-range verification, automated AC/DC attack & saving throw calculations, and WebGL spell particle shaders',
      'Shared 3D rigid-body polyhedral physics dice tray with instant roll telemetry and automated post-combat XP awards',
      '100% free player access via table invite links—players never need a paid subscription to join LoomWeaver VTT',
    ],
    plannedNext: [
      'Dynamic multi-floor vertical combat camera transitions with animated elevator and stair token handoffs',
      'Programmable boss-phase environmental hazard timelines triggered automatically by HP thresholds',
      'Downloadable offline session replay exports with synchronized dice roll and turn logs',
    ],
    studioRoute: '/arcane-screen',
    primaryCtaLabel: 'Launch LoomWeaver VTT — Free',
    subdomainUrl: 'https://vtt.loom-weaver.com',
    subdomainLabel: 'vtt.loom-weaver.com',
  },
  'campaign-manager': {
    slug: 'campaign-manager',
    path: '/campaign-manager',
    navLabel: 'Campaign Manager',
    title: 'LoomWeaver Campaign Manager | TTRPG Worldbuilding & Lore Graph',
    description:
      'Manage tabletop RPG campaigns, NPCs, factions, quests, character sheets, and session logs in LoomWeaver. Built with Neo4j lore graphs and per-player secret isolation.',
    canonical: 'https://loom-weaver.com/campaign-manager',
    eyebrow: 'LoomWeaver Campaign Manager · Polyglot MySQL + Neo4j World OS',
    h1Line1: 'Your Campaign.',
    h1Highlight: 'Connected in One Living World.',
    leadHtml:
      'Stop juggling scattered wikis, spreadsheets, and chat logs. The <strong>LoomWeaver Campaign Manager</strong> links every NPC dossier, faction rivalry, quest chain, character sheet, and session recap into a living graph with strict GM secret boundaries.',
    spotlightTitle: 'Living Campaign Management & Witness-Scoped Lore Graph',
    spotlightSubtitle: 'NPC & Faction Web · Multi-Step Quest Chains · Per-Player Privacy Scopes',
    spotlightDescription:
      'Every note and entity in LoomWeaver carries explicit visibility permissions (Private to Player, Shared with GM Only, or Revealed to Party), ensuring players only see what their characters have actually discovered.',
    screenshot: LANDING_ASSET_PATHS.engineLoomWeaveGraph,
    screenshotAlt: 'LoomWeaver Campaign Manager Neo4j relationship graph connecting NPCs, factions, quests, and locations',
    availableToday: [
      'Interactive Neo4j campaign relationship graph linking NPCs, factions, locations, artifacts, and session recaps',
      'Multi-step RPG quest tracker with quest givers, origin/completion locations, prerequisites, and clue checklists',
      'Integrated Character Studio for D&D 5e, Pathfinder 2e, and Vampire V5 with live inventory and spellbook sync',
      'Note scoping enforced at the database query layer: Private to Player, Shared with GM Only, or Shared with Party',
      'Optional Weave AI drafting assistant with 100% Game Master authorship—edit, re-weave, or reject every draft',
    ],
    plannedNext: [
      'Interactive chronological world timeline sliders showing faction territory shifts across campaign eras',
      'One-click PDF and hardcover-layout campaign sourcebook export from your canon graph',
    ],
    studioRoute: '/campaigns',
    primaryCtaLabel: 'Start Managing Your Campaign — Free',
  },
  'battlemap-builder': {
    slug: 'battlemap-builder',
    path: '/battlemap-builder',
    navLabel: 'Battlemap Builder',
    title: 'LoomWeaver Battlemap Builder | 2D & 3D RPG Map Maker (LoomMaps)',
    description:
      'Build 2D and 3D tabletop RPG battlemaps and regional world atlases with the LoomWeaver Battlemap Builder (LoomMaps). Sculpt cutaway walls, lighting, and quest markers.',
    canonical: 'https://loom-weaver.com/battlemap-builder',
    eyebrow: 'LoomWeaver Battlemap Builder · LoomMaps 2D/3D Cartography Studio',
    h1Line1: 'Craft Tactical Battlemaps &',
    h1Highlight: 'Living World Atlases.',
    leadHtml:
      'Draw pro battlemaps in 2D and explore tactical scenes in 2.5D/3D with the <strong>LoomWeaver Battlemap Builder</strong> (<em>LoomMaps</em>). Sculpt cutaway walls, place light-aware props, chart regional travel routes, and pin GM-only quest secrets.',
    spotlightTitle: 'LoomMaps — Hybrid 2D/3D Battlemap & World Atlas Studio',
    spotlightSubtitle: 'Cutaway Wall Architecture · Smart Portal Cutouts · Regional Travel Paths',
    spotlightDescription:
      'Author dungeon encounters and continental overland maps in one unified tool. Every battlemap and regional atlas pin links directly to your encounters, NPCs, and quest stages.',
    screenshot: LANDING_ASSET_PATHS.engineLoomMapsAtlas,
    screenshotAlt: 'LoomWeaver Battlemap Builder showing cutaway dungeon walls, biome brushes, and world atlas pins',
    availableToday: [
      'Hybrid 2D top-down drafting canvas and synchronized 2.5D/3D tactical camera viewport',
      'Procedural cutaway wall extrusion with automatic door/window portal boolean cutouts',
      'Curated multi-layer stamp library, organic biome terrain brushes, and spline path ribbons (rivers, roads, cliffs)',
      'World Atlas mode with party travel markers, fog-of-discovery regions, and GM-only POI secret notes',
      'Strict creator asset privacy: personal uploaded stamps and textures remain isolated to your account',
    ],
    plannedNext: [
      'Real-time weather particle layers (rain, embers, arcane mist, blizzard) baked into VTT scene presets',
      'Multi-GM collaborative cartography sessions for co-authoring mega-dungeons simultaneously',
    ],
    studioRoute: '/maps',
    primaryCtaLabel: 'Open Battlemap Builder — Free',
    subdomainUrl: 'https://maps.loom-weaver.com',
    subdomainLabel: 'maps.loom-weaver.com',
  },
  'effect-builder': {
    slug: 'effect-builder',
    path: '/effect-builder',
    navLabel: 'Effect Builder',
    title: 'LoomWeaver Effect Builder | TTRPG Spell Animation & Shader Studio',
    description:
      'Build custom TTRPG spell animations, particle effects, and combat shaders with the LoomWeaver Effect Builder (effectbuilder.loom-weaver.com) for LoomWeaver VTT.',
    canonical: 'https://loom-weaver.com/effect-builder',
    eyebrow: 'LoomWeaver Effect Builder · effectbuilder.loom-weaver.com Shader Studio',
    h1Line1: 'Craft Custom Spell Animations &',
    h1Highlight: 'VTT Particle Shaders.',
    leadHtml:
      'Design layered spell animations, projectile arcs, impact shockwaves, and persistent auras in the <strong>LoomWeaver Effect Builder</strong> (<em>effectbuilder.loom-weaver.com</em>) and trigger them live during combat on <strong>LoomWeaver VTT</strong>.',
    spotlightTitle: 'Effect Builder Studio — 35+ Shader Styles & Timeline Composition',
    spotlightSubtitle: 'Layered Particle Emitters · Projectile & Impact Timelines · Live VTT Binding',
    spotlightDescription:
      'Bind custom visual effects directly to D&D 5e spells, homebrew monster abilities, and environmental hazards across your entire LoomWeaver campaign.',
    screenshot: LANDING_ASSET_PATHS.engineDiceShaderFx,
    screenshotAlt: 'LoomWeaver Effect Builder Studio showing layered spell particle emitters and shader timeline',
    availableToday: [
      '35+ procedural WebGL shader and particle styles for beams, projectiles, cones, bursts, and auras',
      'Multi-track draggable composition timeline with cast, travel, impact, and lingering phases',
      'Custom color palettes, bloom intensity, turbulence, and audio cue synchronization',
      'Direct action binding so spells and attacks automatically trigger your custom effect on LoomWeaver VTT',
      'Shared Single Sign-On across loom-weaver.com and effectbuilder.loom-weaver.com',
    ],
    plannedNext: [
      'Node-based custom GLSL shader graph editor for advanced Creator Marketplace publishers',
      'Reactive lighting coupling that tints surrounding 2.5D VTT walls with your spell’s emission color',
    ],
    studioRoute: '/effects',
    primaryCtaLabel: 'Open Effect Builder — Free',
    subdomainUrl: 'https://effectbuilder.loom-weaver.com',
    subdomainLabel: 'effectbuilder.loom-weaver.com',
  },
  'encounter-builder': {
    slug: 'encounter-builder',
    path: '/encounter-builder',
    navLabel: 'Encounter Builder',
    title: 'LoomWeaver Encounter & Action Builder | D&D 5e & TTRPG Combat Designer',
    description:
      'Design tactical TTRPG encounters, custom monster actions, and automated AC/DC saving throws with the LoomWeaver Action & Encounter Builder (actionbuilder.loom-weaver.com).',
    canonical: 'https://loom-weaver.com/encounter-builder',
    eyebrow: 'LoomWeaver Action & Encounter Builder · actionbuilder.loom-weaver.com',
    h1Line1: 'Design Tactical Encounters &',
    h1Highlight: 'Automated Boss Actions.',
    leadHtml:
      'Build balanced D&amp;D 5e and custom TTRPG combat encounters in the <strong>LoomWeaver Action &amp; Encounter Builder</strong> (<em>actionbuilder.loom-weaver.com</em>). Configure multi-attack routines, saving throw DCs, spell shaders, and automated XP rewards.',
    spotlightTitle: 'Action & Encounter Studio — From Statblock to Live VTT Combat',
    spotlightSubtitle: 'Custom Monster Actions · Automated AC/DC Resolution · Post-Combat XP',
    spotlightDescription:
      'Every monster, trap, and boss action you author links directly to your LoomMaps battlemaps, Effect Builder spell shaders, and Arcane Screen initiative tracker.',
    screenshot: LANDING_ASSET_PATHS.engineVttCombat,
    screenshotAlt: 'LoomWeaver Action and Encounter Builder showing monster statblocks, action economy, and VTT deployment',
    availableToday: [
      'Complete monster & NPC action designer with attack bonuses, damage dice, range checks, and saving throw DCs',
      'Per-turn Action, Bonus Action, Reaction, Legendary Action, and Lair Action economy configuration',
      'Encounter difficulty balancing against your active campaign party roster and character levels',
      'One-click deployment to LoomWeaver VTT with pre-placed tokens, initiative order, and XP rewards',
      'Direct integration with Effect Builder animations for every attack and spell action',
    ],
    plannedNext: [
      'Conditional boss-phase triggers that swap monster action sets and map lighting at 50% HP',
      'Exportable statblock cards formatted for print and Creator Marketplace adventure modules',
    ],
    studioRoute: '/encounters',
    primaryCtaLabel: 'Open Encounter Builder — Free',
    subdomainUrl: 'https://actionbuilder.loom-weaver.com',
    subdomainLabel: 'actionbuilder.loom-weaver.com',
  },
  '3d-assets': {
    slug: '3d-assets',
    path: '/3d-assets',
    navLabel: '3D Assets & Dice',
    title: 'LoomWeaver 3D Assets & Dice Forge | TTRPG Miniatures, Props & 3D Dice',
    description:
      'Explore the LoomWeaver 3D Asset Studio (3dassets.loom-weaver.com & generator.loom-weaver.com) and 3D Polyhedral Dice Forge for tabletop RPG miniatures, dungeon props, and physics dice.',
    canonical: 'https://loom-weaver.com/3d-assets',
    eyebrow: 'LoomWeaver 3D Asset Studio & Dice Forge · 3dassets.loom-weaver.com',
    h1Line1: '3D Tabletop Miniatures,',
    h1Highlight: 'Props & Physics Dice.',
    leadHtml:
      'Populate your virtual tabletop with GLB 3D miniatures, light-aware dungeon architecture, and weighted-fair 3D polyhedral physics dice across <strong>LoomWeaver</strong>, <em>3dassets.loom-weaver.com</em>, and <em>generator.loom-weaver.com</em>.',
    spotlightTitle: '3D Asset Vault, Miniature Generator & Polyhedral Dice Forge',
    spotlightSubtitle: 'GLB Miniatures · Cutaway Dungeon Props · Custom 3D Rigid-Body Dice',
    spotlightDescription:
      'Manage your personal 3D miniature library, inspect materials and lighting in real time, and customize shared 3D dice sets for your entire tabletop party.',
    screenshot: LANDING_ASSET_PATHS.engineDiceShaderFx,
    screenshotAlt: 'LoomWeaver 3D Asset Studio and 3D Polyhedral Dice Forge preview',
    availableToday: [
      'Curated 3D object library (GLB miniatures, furniture, pillars, portals, and light-aware dungeon props)',
      '3D Polyhedral Dice Forge (d4, d6, d8, d10, d12, d20, d100) with custom materials, engravings, and roll telemetry',
      'Paired 2D top-down stamps and 3D models that switch seamlessly between 2D drafting and 2.5D/3D VTT views',
      'Strict creator asset privacy: personal uploaded and generated 3D assets remain isolated to your account',
      'Unified access via loom-weaver.com/assets, 3dassets.loom-weaver.com, and generator.loom-weaver.com',
    ],
    plannedNext: [
      'In-browser hero miniature pose and equipment kitbashing studio',
      'Custom metallic, gemstone, and liquid-core shader presets for party-wide commemorative dice',
    ],
    studioRoute: '/assets',
    primaryCtaLabel: 'Explore 3D Assets & Dice — Free',
    subdomainUrl: 'https://3dassets.loom-weaver.com',
    subdomainLabel: '3dassets.loom-weaver.com',
  },
  'ai-campaign-assistant': {
    slug: 'ai-campaign-assistant',
    path: '/ai-campaign-assistant',
    navLabel: 'The Loom Assistant',
    title: 'The Loom | Free TTRPG Campaign Memory & Lore Assistant | LoomWeaver',
    description:
      'Search your tabletop RPG campaign canon in natural language with The Loom in LoomWeaver. 100% free for GMs and players, zero hallucination, and per-player secret isolation.',
    canonical: 'https://loom-weaver.com/ai-campaign-assistant',
    eyebrow: 'The Loom & The Weave · Ethical, GM-Authored Campaign Intelligence',
    h1Line1: 'The Loom — Campaign Memory',
    h1Highlight: 'That Never Invents Canon.',
    leadHtml:
      'Ask natural-language questions across months of session notes, NPC dossiers, and quest clues. <strong>The Loom</strong> is 100% free for Game Masters and players, never generates unapproved fiction, and strictly protects unrevealed GM secrets.',
    spotlightTitle: 'The Loom (Zero-Generation Memory) vs. The Weave (Optional Drafting)',
    spotlightSubtitle: '100% Free Memory Search · Per-Player Witness Isolation · 100% GM Review Gate',
    spotlightDescription:
      'LoomWeaver separates campaign memory from creative generation so your table gets instant recall without ever surrendering narrative authorship to an algorithm.',
    screenshot: LANDING_ASSET_PATHS.engineLoomWeaveGraph,
    screenshotAlt: 'The Loom campaign memory assistant displaying witness-scoped answers and deep-linked session citations',
    availableToday: [
      'The Loom (100% Free): Searches and synthesizes only established campaign canon with clickable in-app deep links',
      'Per-Player Witness Isolation: A player querying The Loom only receives answers grounded in what their character witnessed',
      'Zero Hallucination Guarantee: If a detail is not in your canon or is GM-restricted, The Loom never fabricates an answer',
      'The Weave (100% Optional): Drafts NPCs, monsters, quests, items, and loot tables grounded in your world context',
      'Mandatory GM Authorship Gate: Every Weave draft must be reviewed, edited, re-woven, or rejected by the GM before saving',
    ],
    plannedNext: [
      'Post-session audio transcript ingestion with GM-curated canon extraction checklists',
      'Player-side private journal summarization with one-click sharing to the Game Master',
    ],
    studioRoute: '/loom',
    primaryCtaLabel: 'Try The Loom Memory — Free',
  },
  features: {
    slug: 'features',
    path: '/features',
    navLabel: 'Features',
    title: 'LoomWeaver Features | Integrated VTT, Maps, Lore Graph & 3D Dice',
    description:
      'Explore all LoomWeaver features: 2D & 3D Virtual Tabletop (VTT), The Loom campaign memory, The Weave worldbuilding, LoomMaps battlemap builder, and 3D physics dice.',
    canonical: 'https://loom-weaver.com/features',
    eyebrow: 'LoomWeaver Platform Overview · Built for Game Masters & Players',
    h1Line1: 'Every Tool Your Tabletop',
    h1Highlight: 'Campaign Needs in One Studio.',
    leadHtml:
      'Discover how <strong>LoomWeaver</strong> replaces a dozen disconnected tabs with one cohesive platform: <strong>LoomWeaver VTT</strong>, <strong>LoomMaps</strong>, <strong>The Loom</strong> living memory, <strong>Character Studio</strong>, and the <strong>85/15 Creator Marketplace</strong>.',
    spotlightTitle: 'Complete LoomWeaver Feature Matrix — Live Today vs. Upcoming',
    spotlightSubtitle: 'VTT · Battlemaps · Campaign Graph · 3D Dice · Creator Marketplace',
    spotlightDescription:
      'Every feature in LoomWeaver shares one unified account, one campaign graph, and 100% free player access.',
    screenshot: LANDING_ASSET_PATHS.engineDiceShaderFx,
    screenshotAlt: 'LoomWeaver features showcase including 3D physics dice, spell shaders, and VTT combat',
    availableToday: [
      'LoomWeaver VTT: 2.5D lighting, line-of-sight fog of war, action economy tracking, targeting FX, and automated XP',
      'The Loom: Free, zero-generation campaign memory search with per-player witness isolation and deep links',
      'The Weave: Optional creative worldbuilding companion with 100% GM review and approval control',
      'LoomMaps & World Atlas: 2D/3D battlemaps, cutaway walls, spline ribbons, travel paths, and multi-step quests',
      'Creator Marketplace: Publish custom modules, maps, and encounters with an 85/15 creator-first revenue split',
    ],
    plannedNext: [
      'Dedicated tablet companion HUD mode for in-person tabletop sessions around a physical TV map',
      'Expanded SDK for community ruleset and custom character sheet authors',
    ],
    studioRoute: '/home',
    primaryCtaLabel: 'Create Your Free Account',
  },
};
