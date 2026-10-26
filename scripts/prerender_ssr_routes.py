#!/usr/bin/env python3
"""
Hybrid SSR + CSR Pre-Renderer for LoomWeaver V2.
Generates static Server-Side Rendered HTML documents for all SEO/marketing/auth routes
(/, /vtt, /campaign-manager, /battlemap-builder, /ai-campaign-assistant, /features,
/login, /register, /welcome, /features/*) with unique <title>, <meta name="description">,
<link rel="canonical">, <h1>, and semantic copy before JavaScript executes.
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
        "eyebrow": "LoomWeaver VTT · 2D, 2.5D & 3D Virtual Tabletop Engine",
        "h1": "Your World. Your Table.<br><em>One Living Adventure.</em>",
        "lead": "Explore <strong>LoomWeaver VTT</strong>, an integrated 2D &amp; 3D virtual tabletop for tabletop RPGs. Run tactical encounters, roll 3D physics dice, automate combat action economy, and connect every round of gameplay directly to your living campaign.",
    },
    {
        "route": "campaign-manager",
        "title": "LoomWeaver Campaign Manager | TTRPG Worldbuilding & Lore Graph",
        "description": "Manage tabletop RPG campaigns, NPCs, factions, quests, character sheets, and session logs in LoomWeaver. Built with Neo4j lore graphs and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/campaign-manager",
        "eyebrow": "LoomWeaver Campaign Manager · Polyglot MySQL + Neo4j World OS",
        "h1": "Your Campaign.<br><em>Connected in One Living World.</em>",
        "lead": "Stop juggling scattered wikis, spreadsheets, and chat logs. The <strong>LoomWeaver Campaign Manager</strong> links every NPC dossier, faction rivalry, quest chain, character sheet, and session recap into a living graph with strict GM secret boundaries.",
    },
    {
        "route": "battlemap-builder",
        "title": "LoomWeaver Battlemap Builder | 2D & 3D RPG Map Maker (LoomMaps)",
        "description": "Build 2D and 3D tabletop RPG battlemaps and regional world atlases with the LoomWeaver Battlemap Builder (LoomMaps). Sculpt cutaway walls, lighting, and quest markers.",
        "canonical": "https://loom-weaver.com/battlemap-builder",
        "eyebrow": "LoomWeaver Battlemap Builder · LoomMaps 2D/3D Cartography Studio",
        "h1": "Craft Tactical Battlemaps &amp;<br><em>Living World Atlases.</em>",
        "lead": "Draw pro battlemaps in 2D and explore tactical scenes in 2.5D/3D with the <strong>LoomWeaver Battlemap Builder</strong> (<em>LoomMaps</em>). Sculpt cutaway walls, place light-aware props, chart regional travel routes, and pin GM-only quest secrets.",
    },
    {
        "route": "ai-campaign-assistant",
        "title": "The Loom | Free TTRPG Campaign Memory & Lore Assistant | LoomWeaver",
        "description": "Search your tabletop RPG campaign canon in natural language with The Loom in LoomWeaver. 100% free for GMs and players, zero hallucination, and per-player secret isolation.",
        "canonical": "https://loom-weaver.com/ai-campaign-assistant",
        "eyebrow": "The Loom & The Weave · Ethical, GM-Authored Campaign Intelligence",
        "h1": "The Loom — Campaign Memory<br><em>That Never Invents Canon.</em>",
        "lead": "Ask natural-language questions across months of session notes, NPC dossiers, and quest clues. <strong>The Loom</strong> is 100% free for Game Masters and players, never generates unapproved fiction, and strictly protects unrevealed GM secrets.",
    },
    {
        "route": "features",
        "title": "LoomWeaver Features | Integrated VTT, Maps, Lore Graph & 3D Dice",
        "description": "Explore all LoomWeaver features: 2D & 3D Virtual Tabletop (VTT), The Loom campaign memory, The Weave worldbuilding, LoomMaps battlemap builder, and 3D physics dice.",
        "canonical": "https://loom-weaver.com/features",
        "eyebrow": "LoomWeaver Platform Overview · Built for Game Masters & Players",
        "h1": "Every Tool Your Tabletop<br><em>Campaign Needs in One Studio.</em>",
        "lead": "Discover how <strong>LoomWeaver</strong> replaces a dozen disconnected tabs with one cohesive platform: <strong>LoomWeaver VTT</strong>, <strong>LoomMaps</strong>, <strong>The Loom</strong> living memory, <strong>Character Studio</strong>, and the <strong>85/15 Creator Marketplace</strong>.",
    },
    {
        "route": "login",
        "title": "Sign In | LoomWeaver VTT & TTRPG Campaign Manager",
        "description": "Sign in to your LoomWeaver account to access LoomWeaver VTT, LoomMaps Battlemap Builder, Character Studio, The Loom campaign memory, and The Weave.",
        "canonical": "https://loom-weaver.com/login",
        "eyebrow": "LoomWeaver Studio Authentication",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Sign in to LoomWeaver to launch your 2D &amp; 3D Virtual Tabletop (VTT), campaign graph, character sheets, and LoomMaps studio.",
    },
    {
        "route": "register",
        "title": "Create Free Account | LoomWeaver VTT & TTRPG Campaign Manager",
        "description": "Create your free LoomWeaver account. Build living tabletop RPG worlds, run encounters on LoomWeaver VTT, and invite players 100% free.",
        "canonical": "https://loom-weaver.com/register",
        "eyebrow": "Start Your Free LoomWeaver Campaign",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Create a free LoomWeaver account and start building your campaign world with integrated VTT combat, LoomMaps, and The Loom memory.",
    },
    {
        "route": "welcome",
        "title": "LoomWeaver | VTT & TTRPG Campaign Manager",
        "description": "Build living tabletop RPG worlds with LoomWeaver. Create maps, run encounters, manage characters and campaigns, and play with an integrated virtual tabletop.",
        "canonical": "https://loom-weaver.com/",
        "eyebrow": "A new chapter in tabletop storytelling · Integrated VTT & Campaign OS",
        "h1": "Your Campaign.<br><em>One Living World.</em>",
        "lead": "Build living tabletop RPG worlds with <strong>LoomWeaver</strong>. Create maps, run encounters, manage characters and campaigns, and play with an integrated virtual tabletop.",
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
        "eyebrow": "The Loom & The Weave · Ethical, GM-Authored Campaign Intelligence",
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

        target_dir = os.path.join(BROWSER_DIST, *item["route"].split("/"))
        os.makedirs(target_dir, exist_ok=True)
        out_path = os.path.join(target_dir, "index.html")
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(html)

    print(f"Pre-rendered {len(SSR_ROUTES)} SSR marketing/SEO routes into {BROWSER_DIST}.")


if __name__ == "__main__":
    main()
