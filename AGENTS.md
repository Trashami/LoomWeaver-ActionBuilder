# LoomWeaver V2 — Agent Architecture, SEO & Brand Authority Rules

## 1. SEO & Brand Authority Strategy (Outranking `loomweaver.app`)
- **Preferred Brand Name**: `LoomWeaver`
- **Brand Tagline**: `LoomWeaver — Your Campaign. One Living World.`
- **Alternate Search Names**: `LoomWeaver TTRPG`, `LoomWeaver VTT`, `Loom-Weaver`, `Loom Weaver`
- **Homepage Metadata (`/`)**:
  - `<title>LoomWeaver | VTT & TTRPG Campaign Manager</title>`
  - `<meta name="description" content="Build living tabletop RPG worlds with LoomWeaver. Create maps, run encounters, manage characters and campaigns, and play with an integrated virtual tabletop.">`
- **Dedicated Public Pre-Rendered Landing Routes**:
  - `/` -> Target: `LoomWeaver` (`H1: Your Campaign. One Living World.`)
  - `/vtt` -> Target: `LoomWeaver VTT` (`Title: LoomWeaver VTT | 2D & 3D Virtual Tabletop`, `H1: Your World. Your Table. One Living Adventure.`, `Description: Explore LoomWeaver VTT, an integrated virtual tabletop for tabletop RPGs. Run encounters, roll 3D dice, manage combat, and connect gameplay to your living campaign.`)
  - `/campaign-manager` -> Target: `LoomWeaver campaign manager` (`Title: LoomWeaver Campaign Manager | TTRPG Worldbuilding & Lore Graph`, `H1: Your Campaign. Connected in One Living World.`)
  - `/battlemap-builder` -> Target: `LoomWeaver battlemap builder` (`Title: LoomWeaver Battlemap Builder | 2D & 3D RPG Map Maker`, `H1: Craft Tactical Battlemaps & Living World Atlases.`)
  - `/ai-campaign-assistant` -> Target: `The Loom AI assistant` (`Title: The Loom | Free TTRPG Campaign Memory & Lore Assistant | LoomWeaver`, `H1: The Loom — Campaign Memory That Never Invents Canon.`)
  - `/features` -> Target: `LoomWeaver features` (`Title: LoomWeaver Features | Integrated VTT, Maps, Lore Graph & 3D Dice`, `H1: Every Tool Your Tabletop Campaign Needs in One Studio.`)
- **Pre-Rendering Requirement**:
  - Always run `python scripts/prerender_ssr_routes.py` after `npm run build` so every public route (`/`, `/vtt`, `/campaign-manager`, `/battlemap-builder`, `/ai-campaign-assistant`, `/features`, `/login`, `/register`) has its own static `index.html` with unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and route-specific `<h1>` and spotlight HTML before JavaScript executes.
- **Visual Identity**:
  - Never alter the Raven & Emerald-Green (`#05100c`, `#49e892`, `#2ee66b`) + Gold (`#d9b77a`) dark-fantasy visual design.

## 2. File Length & Icon Rules
- Every hand-written source file must stay under 500 lines (`python scripts/check_source_limits.py`).
- Zero raw unicode emojis anywhere in templates, TypeScript, CSS, or backend responses. Always use `<lw-icon name="...">`.
