#!/usr/bin/env python3
"""
Hybrid SSR + CSR Pre-Renderer for LoomWeaver V2.
Generates static Server-Side Rendered HTML documents for all SEO/marketing/auth routes
(/, /login, /register, /welcome, /features/*) while keeping Babylon.js / WebGL studio
routes (/maps, /encounters, /arcane-screen, /dice, /effects, /characters, /loom, /weave)
Client-Side Rendered (CSR) for optimal GPU memory and routing performance.
"""

import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BROWSER_DIST = os.path.join(ROOT, "frontend", "dist", "loomweaver-v2", "browser")

SSR_ROUTES = [
    {
        "route": "login",
        "title": "Sign In to LoomWeaver (Loom-Weaver) — 2.5D Virtual Tabletop (VTT) & Campaign Studio",
        "description": "Sign in to your LoomWeaver (Loom-Weaver) account to access the 2.5D Virtual Tabletop (VTT), LoomMaps, Character Studio, The Loom campaign memory, and The Weave.",
        "canonical": "https://loom-weaver.com/login",
    },
    {
        "route": "register",
        "title": "Create Free Account | LoomWeaver (Loom-Weaver) 2.5D Virtual Tabletop (VTT)",
        "description": "Create your free LoomWeaver account. Start a D&D 5e or custom RPG campaign, invite players 100% free, and use The Loom living campaign memory and 2.5D VTT.",
        "canonical": "https://loom-weaver.com/register",
    },
    {
        "route": "welcome",
        "title": "Welcome to LoomWeaver (Loom-Weaver) — Your Campaign. One Living World.",
        "description": "Discover how LoomWeaver unifies 2.5D Virtual Tabletop (VTT) combat, witness-scoped campaign memory, and optional GM-authored worldbuilding.",
        "canonical": "https://loom-weaver.com/welcome",
    },
    {
        "route": "features/virtual-tabletop",
        "title": "LoomWeaver 2.5D Virtual Tabletop (VTT) — Dynamic Lighting, 3D Dice & Action Economy",
        "description": "Run D&D 5e and custom tabletop RPG combat on the LoomWeaver 2.5D Virtual Tabletop (VTT). Includes gradual lighting, line-of-sight fog of war, 3D physics dice, and 100% free player seats.",
        "canonical": "https://loom-weaver.com/features/virtual-tabletop",
    },
    {
        "route": "features/campaign-memory",
        "title": "The Loom — Free TTRPG Campaign Memory & Witness-Scoped Lore Search | LoomWeaver",
        "description": "Search your campaign notes, session recaps, and NPC dossiers in natural language. Zero hallucination and strict per-player secret isolation.",
        "canonical": "https://loom-weaver.com/features/campaign-memory",
    },
    {
        "route": "features/worldbuilding-ai",
        "title": "The Weave — GM-Authored Worldbuilding & Neo4j Lore Graph | LoomWeaver",
        "description": "Draft context-aware NPCs, monsters, quests, and battlemaps grounded in your Neo4j campaign graph with 100% Game Master review control.",
        "canonical": "https://loom-weaver.com/features/worldbuilding-ai",
    },
    {
        "route": "features/world-atlas-quests",
        "title": "LoomMaps — 2D/3D VTT Battlemap Maker, Cutaway Walls & World Atlas | LoomWeaver",
        "description": "Author pro battlemaps and regional world atlases with cutaway wall portals, spline ribbons, travel paths, and multi-step quest tracking.",
        "canonical": "https://loom-weaver.com/features/world-atlas-quests",
    },
    {
        "route": "features/creator-marketplace",
        "title": "TTRPG & VTT Creator Marketplace — 85/15 Revenue Split | LoomWeaver",
        "description": "Publish and monetize custom campaigns, adventure modules, and VTT battlemaps with a creator-first 85/15 revenue split and one-click GM imports.",
        "canonical": "https://loom-weaver.com/features/creator-marketplace",
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

        target_dir = os.path.join(BROWSER_DIST, *item["route"].split("/"))
        os.makedirs(target_dir, exist_ok=True)
        out_path = os.path.join(target_dir, "index.html")
        with open(out_path, "w", encoding="utf-8") as out_f:
            out_f.write(html)

    print(f"Pre-rendered {len(SSR_ROUTES)} SSR marketing/SEO routes into {BROWSER_DIST}.")


if __name__ == "__main__":
    main()
