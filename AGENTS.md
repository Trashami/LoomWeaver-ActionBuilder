# LoomWeaver V2 — Canonical AI Implementation Rules

## 1. Core Architectural Boundaries
- **Polyglot Persistence under `loomweaver` (never `jane`)**:
  - **MySQL 8.0 (`loomweaver` schema)**: Authoritative system of record for normalized relational data (`lw_users`, `lw_subscription_tiers`, `lw_campaigns`, `lw_campaign_members`, `lw_acts`, `lw_sessions`, `lw_characters`, `lw_npcs`, `lw_creatures`, `lw_locations`, `lw_factions`, `lw_quests`, `lw_encounters`, `lw_scenes`, `lw_assets`, `lw_marketplace_listings`, `lw_domain_events`, `lw_outbox_messages`).
  - **Neo4j 5.x (`loomweaver` graph)**: Semantic knowledge graph and story memory (`:Entity:Campaign`, `:World`, `:Location`, `:PlayerCharacter`, `:NPC`, `:Monster`, `:Faction`, `:Quest`, `:Artifact`, `:Encounter`, `:Session`, `:Event`, `:Secret`, `:Clue`, `:Party`, `:Claim`, `:SourceRecord`). Bridged via composite key `{campaignId}:{entityType}:{entityId}`.
- **Client vs. Server Ownership**:
  - **Angular + Babylon.js (`frontend/`)**: Owns presentation, reusable standalone components (`lw-*`), editor state/commands, and 2D/3D rendering.
  - **.NET 10 (`backend/`)**: Owns authorization, role filtering (`gm` vs. `players` vs. `public`), rule evaluation, dice outcomes, transactional outbox, and GraphRAG retrieval.
  - **Zero Secret Leakage**: Never send `visibility = 'gm'` secrets, unrevealed clues, or locked asset binaries to player-scoped DTOs, graph queries, or The Loom citations.

## 2. Reusable Component Contract ("Configure, Never Fork")
- Read `docs/architecture/component-system.md`, `docs/architecture/component-catalog-and-instances.md`, and `docs/standards/reusable-angular-components.md`.
- Every repeatable UI widget (`lw-button`, `lw-badge`, `lw-panel`, `lw-empty-state`, `lw-asset-card`, `lw-entity-card`, `lw-stat-radar`, `lw-inspector-drawer`, `lw-loom-launcher`) is implemented once as a standalone Angular component with separate `.ts`, `.html`, and `.scss` files.
- Route pages only compose and bind typed `input()` / `output()` contracts. Route pages must never duplicate child markup or override child internals via `::ng-deep` or descendant selectors.
- **Strict Zero-Emoji Policy**: Never use unicode emoji characters anywhere in templates, UI labels, or logs. Render all icons exclusively through `<lw-icon [name]="..." />`.
- **Official Brand Logo**: Always use `/LoomWeaver.png` for the LoomWeaver brand mark in the global shell and landing headers.

## 3. Product Promises
- **The Loom (Living Campaign Memory)**: Globally available from the persistent header on every route, even when The Weave is toggled off. Searches and synthesizes established canon with clickable deep-link citations; never invents lore.
- **The Weave (Optional Creative AI & Graph Companion)**: Independently toggleable per campaign/user. Every generation is a draft (`canonStatus: 'draft'`) requiring explicit GM approval before entering canon.
- **Subscription Tiers & Marketplace**: Spark Free ($0), Threadkeeper ($6/mo), Weaver ($12/mo), Archweaver ($24/mo), plus 85/15 creator revenue split. Players always join a GM's table for free.

## 4. Source File Size & Verification Rules
- Target **100–300 lines** per hand-written file; **500 lines** is the maximum ceiling.
- Always run `python scripts/check_source_limits.py`, `dotnet build`, and `npm run build` before completing a slice.
