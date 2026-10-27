#!/usr/bin/env python3
"""
Hybrid SSR + CSR Pre-Renderer for LoomWeaver V2.
Generates static Server-Side Rendered HTML documents for all SEO/marketing/auth routes
(/, /vtt, /campaign-manager, /battlemap-builder, /effect-builder, /encounter-builder,
/3d-assets, /ai-campaign-assistant, /features, /login, /register, /welcome, /features/*)
with unique <title>, <meta name="description">, <link rel="canonical">, <h1>, <h2>,
and route-specific semantic body copy before JavaScript executes.
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BROWSER_DIST = os.path.join(ROOT, "frontend", "dist", "loomweaver-v2", "browser")

SSR_ROUTES = [
    {
        "route": "vtt",
        "title": "LoomWeaver VTT | 2D & 3D Virtual Tabletop",
        "description": "Explore LoomWeaver VTT, an integrated virtual tabletop for tabletop RPGs. Run encounters, roll 3D dice, manage combat, and connect gameplay to your living campaign.",
        "canonical": "https://loom-weaver.com/vtt",
        "eyebrow": "LoomWeaver VTT · 2D, 2.5D & 3D Fantasy Virtual Tabletop (Virtual Table Top)",
        "h1": "Your World. Your Table.<br><em>One Living Adventure.</em>",
        "lead": "Explore <strong>LoomWeaver VTT</strong>, an integrated 2D &amp; 3D <strong>virtual tabletop (virtual table top)</strong> for <strong>fantasy TTRPGs</strong> and <strong>tabletop role playing games (table top role playing games)</strong>. Run tactical encounters, roll 3D physics dice, automate combat action economy, and connect every round of gameplay directly to your living campaign.",
        "h2": "LoomWeaver VTT — 2D &amp; 3D Fantasy Virtual Tabletop (Virtual Table Top) Connected to Your TTRPG Campaign",
        "spotlight_desc": "Unlike standalone virtual tabletops (VTTs) that isolate your fantasy table top battlemap from your story notes, <strong>LoomWeaver VTT</strong> (<a href=\"https://loom-weaver.com/vtt\">loom-weaver.com/vtt</a> &amp; <a href=\"https://vtt.loom-weaver.com\">vtt.loom-weaver.com</a>) runs directly atop your TTRPG campaign graph—linking every token, boss lair, spell shader, trap, and quest consequence in real time.",
        "available": [
            "LoomWeaver VTT 2D, 2.5D &amp; 3D WebGL Virtual Tabletop (virtual table top) with real-time gradual lighting, torch falloff, and line-of-sight fog of war",
            "Fantasy TTRPG combat tracker with per-turn Action, Bonus Action, Reaction, and Movement economy pips for every combatant",
            "Target-in-range verification, automated AC/DC attack &amp; saving throw calculations, and WebGL spell particle shaders",
            "Shared 3D rigid-body polyhedral physics dice tray with instant roll telemetry and automated post-combat XP awards",
            "100% free player access via table invite links—players never need a paid subscription to join LoomWeaver VTT for any table top role playing game",
        ],
        "planned": [
            "Dynamic multi-floor vertical VTT combat camera transitions with animated elevator and stair token handoffs",
            "Programmable boss-phase environmental hazard timelines triggered automatically by HP thresholds",
            "Downloadable offline session replay exports with synchronized 3D dice roll and turn logs",
        ],
    },
    {
        "route": "campaign-manager",
        "title": "LoomWeaver Campaign Manager | TTRPG Worldbuilding & Lore Graph",
        "description": "Manage tabletop RPG campaigns, NPCs, factions, quests, character sheets, and session logs in LoomWeaver. Built with Neo4j lore graphs and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/campaign-manager",
        "eyebrow": "LoomWeaver Campaign Manager · Polyglot MySQL + Neo4j Fantasy TTRPG World OS",
        "h1": "Your Campaign.<br><em>Connected in One Living World.</em>",
        "lead": "Stop juggling scattered wikis, spreadsheets, and chat logs. The <strong>LoomWeaver Campaign Manager</strong> links every NPC dossier, faction rivalry, quest chain, character sheet, and session recap for your <strong>fantasy TTRPG</strong> and <strong>table top role playing game</strong> into a living graph with strict GM secret boundaries.",
        "h2": "LoomWeaver Campaign Manager — Fantasy TTRPG Worldbuilding, Character Sheets &amp; Witness-Scoped Lore Graph",
        "spotlight_desc": "Every note and entity in the <strong>LoomWeaver Campaign Manager</strong> carries explicit visibility permissions (Private to Player, Shared with GM Only, or Revealed to Party), ensuring players in your tabletop role playing game only see what their characters have actually discovered.",
        "available": [
            "Interactive Neo4j campaign relationship graph linking NPCs, factions, locations, artifacts, and session recaps",
            "Multi-step fantasy TTRPG quest tracker with quest givers, origin/completion locations, prerequisites, and clue checklists",
            "Integrated Character Studio for D&amp;D 5e, Pathfinder 2e, and Vampire V5 with live inventory and spellbook sync to LoomWeaver VTT",
            "Note scoping enforced at the database query layer: Private to Player, Shared with GM Only, or Shared with Party",
            "Optional Weave drafting assistant with 100% Game Master authorship—edit, re-weave, or reject every draft",
        ],
        "planned": [
            "Interactive chronological world timeline sliders showing faction territory shifts across campaign eras",
            "One-click PDF and hardcover-layout campaign sourcebook export from your canon graph",
        ],
    },
    {
        "route": "battlemap-builder",
        "title": "LoomWeaver Battlemap Builder | 2D & 3D RPG Map Maker (LoomMaps)",
        "description": "Build 2D and 3D tabletop RPG battlemaps and regional world atlases with the LoomWeaver Battlemap Builder (LoomMaps). Sculpt cutaway walls, lighting, and quest markers.",
        "canonical": "https://loom-weaver.com/battlemap-builder",
        "eyebrow": "LoomWeaver Battlemap Builder · LoomMaps 2D/3D Fantasy Tabletop Cartography Studio",
        "h1": "Craft Tactical Battlemaps &amp;<br><em>Living World Atlases.</em>",
        "lead": "Draw pro battlemaps in 2D and explore tactical scenes in 2.5D/3D with the <strong>LoomWeaver Battlemap Builder</strong> (<em>LoomMaps</em> on <a href=\"https://maps.loom-weaver.com\">maps.loom-weaver.com</a>). Sculpt cutaway walls, place light-aware props, chart regional travel routes, and deploy directly to <strong>LoomWeaver VTT</strong>.",
        "h2": "LoomMaps Battlemap Builder — Hybrid 2D/3D Fantasy Tabletop Map Maker &amp; World Atlas Studio",
        "spotlight_desc": "Author dungeon encounters and continental overland maps in one unified cartography tool (<a href=\"https://maps.loom-weaver.com\">maps.loom-weaver.com</a>). Every battlemap and regional atlas pin links directly to your LoomWeaver VTT encounters, NPCs, and quest stages.",
        "available": [
            "Hybrid 2D top-down drafting canvas and synchronized 2.5D/3D Virtual Tabletop camera viewport",
            "Procedural cutaway wall extrusion with automatic door/window portal boolean cutouts",
            "Curated multi-layer stamp library, organic biome terrain brushes, and spline path ribbons (rivers, roads, cliffs)",
            "World Atlas mode with party travel markers, fog-of-discovery regions, and GM-only POI secret notes",
            "Strict creator asset privacy: personal uploaded stamps and textures remain isolated to your account",
        ],
        "planned": [
            "Real-time weather particle layers (rain, embers, arcane mist, blizzard) baked into LoomWeaver VTT scene presets",
            "Multi-GM collaborative cartography sessions for co-authoring mega-dungeons simultaneously",
        ],
    },
    {
        "route": "effect-builder",
        "title": "LoomWeaver Effect Builder | TTRPG Spell Animation & Shader Studio",
        "description": "Build custom TTRPG spell animations, particle effects, and combat shaders with the LoomWeaver Effect Builder (effectbuilder.loom-weaver.com) for LoomWeaver VTT.",
        "canonical": "https://loom-weaver.com/effect-builder",
        "eyebrow": "LoomWeaver Effect Builder · effectbuilder.loom-weaver.com VTT Shader Studio",
        "h1": "Craft Custom Spell Animations &amp;<br><em>VTT Particle Shaders.</em>",
        "lead": "Design layered spell animations, projectile arcs, impact shockwaves, and persistent auras in the <strong>LoomWeaver Effect Builder</strong> (<a href=\"https://effectbuilder.loom-weaver.com\">effectbuilder.loom-weaver.com</a>) and trigger them live during combat on <strong>LoomWeaver VTT</strong>.",
        "h2": "LoomWeaver Effect Builder Studio — 35+ WebGL Spell Shader Styles &amp; VTT Particle Timeline Composer",
        "spotlight_desc": "Bind custom visual effects directly to D&amp;D 5e spells, homebrew monster abilities, and environmental hazards across your entire fantasy tabletop role playing game campaign.",
        "available": [
            "35+ procedural WebGL shader and particle styles for beams, projectiles, cones, bursts, and auras",
            "Multi-track draggable composition timeline with cast, travel, impact, and lingering phases",
            "Custom color palettes, bloom intensity, turbulence, and audio cue synchronization",
            "Direct action binding so spells and attacks automatically trigger your custom effect on LoomWeaver VTT",
            "Shared Single Sign-On across loom-weaver.com and effectbuilder.loom-weaver.com",
        ],
        "planned": [
            "Node-based custom GLSL shader graph editor for advanced Creator Marketplace publishers",
            "Reactive lighting coupling that tints surrounding 2.5D VTT walls with your spell’s emission color",
        ],
    },
    {
        "route": "encounter-builder",
        "title": "LoomWeaver Encounter & Action Builder | D&D 5e & TTRPG Combat Designer",
        "description": "Design tactical TTRPG encounters, custom monster actions, and automated AC/DC saving throws with the LoomWeaver Action & Encounter Builder (actionbuilder.loom-weaver.com).",
        "canonical": "https://loom-weaver.com/encounter-builder",
        "eyebrow": "LoomWeaver Action & Encounter Builder · actionbuilder.loom-weaver.com",
        "h1": "Design Tactical Encounters &amp;<br><em>Automated Boss Actions.</em>",
        "lead": "Build balanced D&amp;D 5e and custom fantasy TTRPG combat encounters in the <strong>LoomWeaver Action &amp; Encounter Builder</strong> (<a href=\"https://actionbuilder.loom-weaver.com\">actionbuilder.loom-weaver.com</a>). Configure multi-attack routines, saving throw DCs, spell shaders, and automated XP rewards for <strong>LoomWeaver VTT</strong>.",
        "h2": "LoomWeaver Action &amp; Encounter Studio — From Monster Statblock to Live Virtual Tabletop Combat",
        "spotlight_desc": "Every monster, trap, and boss action you author links directly to your LoomMaps battlemaps, Effect Builder spell shaders, and LoomWeaver VTT initiative tracker.",
        "available": [
            "Complete monster &amp; NPC action designer with attack bonuses, damage dice, range checks, and saving throw DCs",
            "Per-turn Action, Bonus Action, Reaction, Legendary Action, and Lair Action economy configuration",
            "Encounter difficulty balancing against your active campaign party roster and character levels",
            "One-click deployment to LoomWeaver VTT with pre-placed tokens, initiative order, and XP rewards",
            "Direct integration with Effect Builder animations for every attack and spell action",
        ],
        "planned": [
            "Conditional boss-phase triggers that swap monster action sets and map lighting at 50% HP",
            "Exportable statblock cards formatted for print and Creator Marketplace adventure modules",
        ],
    },
    {
        "route": "3d-assets",
        "title": "LoomWeaver 3D Assets & Dice Forge | TTRPG Miniatures, Props & 3D Dice",
        "description": "Explore the LoomWeaver 3D Asset Studio (3dassets.loom-weaver.com & generator.loom-weaver.com) and 3D Polyhedral Dice Forge for tabletop RPG miniatures, dungeon props, and physics dice.",
        "canonical": "https://loom-weaver.com/3d-assets",
        "eyebrow": "LoomWeaver 3D Asset Studio & Dice Forge · 3dassets.loom-weaver.com",
        "h1": "3D Tabletop Miniatures,<br><em>Props &amp; Physics Dice.</em>",
        "lead": "Populate your <strong>virtual tabletop (virtual table top)</strong> with GLB 3D miniatures, light-aware dungeon architecture, and weighted-fair 3D polyhedral physics dice across <strong>LoomWeaver VTT</strong>, <a href=\"https://3dassets.loom-weaver.com\">3dassets.loom-weaver.com</a>, and <a href=\"https://generator.loom-weaver.com\">generator.loom-weaver.com</a>.",
        "h2": "LoomWeaver 3D Asset Vault, Miniature Generator &amp; Polyhedral Dice Forge for Fantasy Tabletop RPGs",
        "spotlight_desc": "Manage your personal 3D miniature library, inspect materials and lighting in real time, and customize shared 3D dice sets for your entire table top role playing game party.",
        "available": [
            "Curated 3D object library (GLB miniatures, furniture, pillars, portals, and light-aware dungeon props)",
            "3D Polyhedral Dice Forge (d4, d6, d8, d10, d12, d20, d100) with custom materials, engravings, and roll telemetry",
            "Paired 2D top-down stamps and 3D models that switch seamlessly between 2D drafting and 2.5D/3D LoomWeaver VTT views",
            "Strict creator asset privacy: personal uploaded and generated 3D assets remain isolated to your account",
            "Unified access via loom-weaver.com/assets, 3dassets.loom-weaver.com, and generator.loom-weaver.com",
        ],
        "planned": [
            "In-browser hero miniature pose and equipment kitbashing studio",
            "Custom metallic, gemstone, and liquid-core shader presets for party-wide commemorative dice",
        ],
    },
    {
        "route": "ai-campaign-assistant",
        "title": "The Loom | Free TTRPG Campaign Memory & Lore Assistant | LoomWeaver",
        "description": "Search your tabletop RPG campaign canon in natural language with The Loom in LoomWeaver. 100% free for GMs and players, zero hallucination, and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/ai-campaign-assistant",
        "eyebrow": "The Loom · Ethical, GM-Authored Fantasy TTRPG Campaign Memory",
        "h1": "The Loom — Campaign Memory<br><em>That Never Invents Canon.</em>",
        "lead": "Ask natural-language questions across months of session notes, NPC dossiers, and quest clues in your <strong>tabletop role playing game (TTRPG)</strong>. <strong>The Loom</strong> is 100% free for Game Masters and players, never generates unapproved fiction, and strictly protects unrevealed GM secrets.",
        "h2": "The Loom — 100% Free Zero-Generation TTRPG Campaign Memory with Per-Player Witness Isolation",
        "spotlight_desc": "LoomWeaver separates campaign memory from creative generation so your fantasy tabletop group gets instant recall without ever surrendering narrative authorship to an algorithm.",
        "available": [
            "The Loom (100% Free): Searches and synthesizes only established campaign canon with clickable in-app deep links",
            "Per-Player Witness Isolation: A player querying The Loom only receives answers grounded in what their character witnessed",
            "Zero Hallucination Guarantee: If a detail is not in your canon or is GM-restricted, The Loom never fabricates an answer",
            "The Weave (100% Optional &amp; Opt-In): Drafts NPCs, monsters, quests, items, and loot tables grounded in your world context",
            "Mandatory GM Authorship Gate: Every draft must be reviewed, edited, re-woven, or rejected by the GM before saving",
        ],
        "planned": [
            "Post-session audio transcript ingestion with GM-curated canon extraction checklists",
            "Player-side private journal summarization with one-click sharing to the Game Master",
        ],
    },
    {
        "route": "features",
        "title": "LoomWeaver Features | Integrated VTT, Maps, Lore Graph & 3D Dice",
        "description": "Explore all LoomWeaver features: 2D & 3D Virtual Tabletop (VTT), The Loom campaign memory, The Weave worldbuilding, LoomMaps battlemap builder, and 3D physics dice.",
        "canonical": "https://loom-weaver.com/features",
        "eyebrow": "LoomWeaver Platform Overview · Built for Fantasy TTRPG Game Masters & Players",
        "h1": "Every Tool Your Tabletop<br><em>Campaign Needs in One Studio.</em>",
        "lead": "Discover how <strong>LoomWeaver</strong> replaces a dozen disconnected tabs for your <strong>table top role playing game</strong> with one cohesive platform: <strong>LoomWeaver VTT</strong> (2D &amp; 3D virtual tabletop), <strong>LoomMaps</strong>, <strong>Effect Builder</strong>, <strong>The Loom</strong> living memory, <strong>Character Studio</strong>, and the <strong>85/15 Creator Marketplace</strong>.",
        "h2": "Complete LoomWeaver VTT &amp; Fantasy Tabletop Role Playing Game Feature Matrix",
        "spotlight_desc": "Every feature in LoomWeaver shares one unified account, one Neo4j campaign graph, and 100% free player seats across every subdomain.",
        "available": [
            "LoomWeaver VTT (vtt.loom-weaver.com): 2.5D lighting, line-of-sight fog of war, action economy tracking, targeting FX, and automated XP",
            "The Loom: Free, zero-generation campaign memory search with per-player witness isolation and deep links",
            "LoomMaps &amp; World Atlas (maps.loom-weaver.com): 2D/3D battlemaps, cutaway walls, spline ribbons, travel paths, and multi-step quests",
            "Effect Builder &amp; Action Builder (effectbuilder.loom-weaver.com &amp; actionbuilder.loom-weaver.com): Custom spell shaders and monster statblocks",
            "Creator Marketplace: Publish custom modules, maps, and encounters with an 85/15 creator-first revenue split",
        ],
        "planned": [
            "Dedicated tablet companion HUD mode for in-person fantasy tabletop sessions around a physical TV map",
            "Expanded SDK for community ruleset and custom character sheet authors",
        ],
    },
    {
        "route": "login",
        "title": "Sign In | LoomWeaver VTT & TTRPG Campaign Manager",
        "description": "Sign in to your LoomWeaver account to access LoomWeaver VTT, LoomMaps Battlemap Builder, Character Studio, The Loom campaign memory, and Effect Builder.",
        "canonical": "https://loom-weaver.com/login",
        "eyebrow": "LoomWeaver Studio Authentication",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Sign in to LoomWeaver to launch your 2D &amp; 3D Virtual Tabletop (LoomWeaver VTT), fantasy TTRPG campaign graph, character sheets, and LoomMaps studio.",
    },
    {
        "route": "register",
        "title": "Create Free Account | LoomWeaver VTT & TTRPG Campaign Manager",
        "description": "Create your free LoomWeaver account. Build living tabletop RPG worlds, run encounters on LoomWeaver VTT, and invite players 100% free.",
        "canonical": "https://loom-weaver.com/register",
        "eyebrow": "Start Your Free LoomWeaver Campaign",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Create a free LoomWeaver account and start building your fantasy tabletop role playing game campaign world with integrated LoomWeaver VTT combat, LoomMaps, and The Loom memory.",
    },
    {
        "route": "welcome",
        "title": "LoomWeaver | VTT & TTRPG Campaign Manager",
        "description": "Build living tabletop RPG worlds with LoomWeaver. Create maps, run encounters, manage characters and campaigns, and play with an integrated virtual tabletop.",
        "canonical": "https://loom-weaver.com/",
        "eyebrow": "LoomWeaver VTT & Fantasy TTRPG Studio · 2D & 3D Virtual Tabletop",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Build living tabletop RPG worlds with <strong>LoomWeaver</strong>. Create maps, run encounters on <strong>LoomWeaver VTT</strong>, manage characters and campaigns, and play with an integrated virtual tabletop.",
    },
    {
        "route": "features/virtual-tabletop",
        "title": "LoomWeaver VTT | 2D & 3D Virtual Tabletop",
        "description": "Explore LoomWeaver VTT, an integrated virtual tabletop for tabletop RPGs. Run encounters, roll 3D dice, manage combat, and connect gameplay to your living campaign.",
        "canonical": "https://loom-weaver.com/vtt",
        "eyebrow": "LoomWeaver VTT · 2D, 2.5D & 3D Virtual Tabletop Engine",
        "h1": "Your World. Your Table.<br><em>One Living Adventure.</em>",
        "lead": "Explore <strong>LoomWeaver VTT</strong>, an integrated 2D &amp; 3D virtual tabletop for tabletop RPGs.",
    },
    {
        "route": "features/campaign-memory",
        "title": "The Loom | Free TTRPG Campaign Memory & Lore Assistant | LoomWeaver",
        "description": "Search your tabletop RPG campaign canon in natural language with The Loom in LoomWeaver. 100% free for GMs and players, zero hallucination, and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/ai-campaign-assistant",
        "eyebrow": "The Loom · Ethical, GM-Authored Campaign Intelligence",
        "h1": "The Loom — Campaign Memory<br><em>That Never Invents Canon.</em>",
        "lead": "Ask natural-language questions across months of session notes, NPC dossiers, and quest clues with The Loom.",
    },
    {
        "route": "features/worldbuilding-ai",
        "title": "LoomWeaver Campaign Manager | TTRPG Worldbuilding & Lore Graph",
        "description": "Manage tabletop RPG campaigns, NPCs, factions, quests, character sheets, and session logs in LoomWeaver. Built with Neo4j lore graphs and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/campaign-manager",
        "eyebrow": "LoomWeaver Campaign Manager · Polyglot MySQL + Neo4j World OS",
        "h1": "Your Campaign.<br><em>Connected in One Living World.</em>",
        "lead": "The LoomWeaver Campaign Manager links every NPC dossier, faction rivalry, quest chain, and session recap into a living graph.",
    },
    {
        "route": "features/world-atlas-quests",
        "title": "LoomWeaver Battlemap Builder | 2D & 3D RPG Map Maker (LoomMaps)",
        "description": "Build 2D and 3D tabletop RPG battlemaps and regional world atlases with the LoomWeaver Battlemap Builder (LoomMaps). Sculpt cutaway walls, lighting, and quest markers.",
        "canonical": "https://loom-weaver.com/battlemap-builder",
        "eyebrow": "LoomWeaver Battlemap Builder · LoomMaps 2D/3D Cartography Studio",
        "h1": "Craft Tactical Battlemaps &amp;<br><em>Living World Atlases.</em>",
        "lead": "Draw pro battlemaps in 2D and explore tactical scenes in 2.5D/3D with the LoomWeaver Battlemap Builder.",
    },
]


def build_spotlight_html(item: dict) -> str:
    if "h2" not in item:
        return ""
    avail_li = "".join(f"<li>{x}</li>" for x in item.get("available", []))
    plan_li = "".join(f"<li>{x}</li>" for x in item.get("planned", []))
    return (
        '<section id="ssr-route-spotlight" class="ssr-wrap" style="padding:48px 34px 12px;">'
        '<div class="ssr-card" style="padding:28px;">'
        f'<h2 style="font:28px Cinzel,Georgia,serif;color:#f5efe2;margin:0 0 12px;">{item["h2"]}</h2>'
        f'<p style="font-size:14px;color:#bdd1c5;line-height:1.7;margin:0 0 18px;">{item["spotlight_desc"]}</p>'
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">'
        '<div>'
        '<h3 style="font-size:15px;color:#49e892;margin:0 0 8px;">Available Today in LoomWeaver</h3>'
        f'<ul style="margin:0;padding-left:18px;color:#c0d4c9;font-size:13px;line-height:1.65;">{avail_li}</ul>'
        '</div>'
        '<div>'
        '<h3 style="font-size:15px;color:#d9b77a;margin:0 0 8px;">Planned on the Roadmap</h3>'
        f'<ul style="margin:0;padding-left:18px;color:#c0d4c9;font-size:13px;line-height:1.65;">{plan_li}</ul>'
        '</div>'
        '</div>'
        '</div>'
        '</section>'
    )


def main() -> None:
    base_index = os.path.join(BROWSER_DIST, "index.html")
    if not os.path.exists(base_index):
        print(f"Skipping SSR pre-render: {base_index} not found.")
        return

    with open(base_index, "r", encoding="utf-8") as f:
        root_html = f.read()

    for item in SSR_ROUTES:
        html = root_html
        html = re.sub(
            r"<title>.*?</title>",
            f"<title>{item['title']}</title>",
            html,
            flags=re.DOTALL,
        )
        html = re.sub(
            r'<meta name="description" content="[^"]*">',
            f'<meta name="description" content="{item["description"]}">',
            html,
        )
        html = re.sub(
            r'<link rel="canonical" href="[^"]*">',
            f'<link rel="canonical" href="{item["canonical"]}">',
            html,
        )
        html = re.sub(
            r'<meta property="og:title" content="[^"]*">',
            f'<meta property="og:title" content="{item["title"]}">',
            html,
        )
        html = re.sub(
            r'<meta property="og:description" content="[^"]*">',
            f'<meta property="og:description" content="{item["description"]}">',
            html,
        )
        html = re.sub(
            r'<meta property="og:url" content="[^"]*">',
            f'<meta property="og:url" content="{item["canonical"]}">',
            html,
        )
        html = re.sub(
            r'<meta name="twitter:title" content="[^"]*">',
            f'<meta name="twitter:title" content="{item["title"]}">',
            html,
        )
        html = re.sub(
            r'<meta name="twitter:description" content="[^"]*">',
            f'<meta name="twitter:description" content="{item["description"]}">',
            html,
        )
        html = re.sub(
            r'<span class="ssr-eyebrow">.*?</span>',
            f'<span class="ssr-eyebrow">{item["eyebrow"]}</span>',
            html,
            flags=re.DOTALL,
        )
        html = re.sub(
            r'<h1 class="ssr-h1">.*?</h1>',
            f'<h1 class="ssr-h1">{item["h1"]}</h1>',
            html,
            flags=re.DOTALL,
        )
        html = re.sub(
            r'<p class="ssr-lead">.*?</p>',
            f'<p class="ssr-lead">{item["lead"]}</p>',
            html,
            flags=re.DOTALL,
        )
        spotlight_replacement = build_spotlight_html(item)
        if spotlight_replacement:
            html = re.sub(
                r'<section id="ssr-route-spotlight".*?</section>',
                spotlight_replacement,
                html,
                flags=re.DOTALL,
            )

        target_dir = os.path.join(BROWSER_DIST, *item["route"].split("/"))
        os.makedirs(target_dir, exist_ok=True)
        out_path = os.path.join(target_dir, "index.html")
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(html)

    print(f"Pre-rendered {len(SSR_ROUTES)} SSR marketing/SEO routes into {BROWSER_DIST}.")


if __name__ == "__main__":
    main()
