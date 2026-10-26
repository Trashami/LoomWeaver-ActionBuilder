# Feature: Stage 5 — The Loom GraphRAG, The Weave GM Authorship Studio, Marketplace 85/15 Engine & Multi-Step Quest Tracker

- **Slug:** `stage-5-loom-weave-marketplace-and-quests`
- **Status:** Verified
- **Module owner:** `features/loom`, `features/weave`, `features/marketplace`, `features/campaigns` / `LoomWeaver.Modules.Knowledge`, `LoomWeaver.Modules.Marketplace`
- **System support:** D&D 5e (`dnd5e`), Pathfinder 2e (`pf2e`), Vampire V5 (`vampire_v5`)
- **First written / Last updated:** 2026-10-25
- **Authoritative code paths:**
  - `frontend/src/app/shared/ui/scoped-note-card/`
  - `frontend/src/app/shared/ui/quest-tracker-card/`
  - `frontend/src/app/shared/ui/creator-module-card/`
  - `frontend/src/app/features/loom/`
  - `frontend/src/app/features/weave/`
  - `frontend/src/app/features/marketplace/`
  - `frontend/src/app/features/campaigns/`
  - `backend/src/LoomWeaver.Domain/Stage5Contracts.cs`
  - `backend/src/LoomWeaver.Modules/Knowledge/LoomAndWeaveEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Marketplace/MarketplaceAndQuestEndpoints.cs`
- **Architecture docs:** `../architecture/module-roadmap.md`

## User story

As a GM, Player, or Creator, I want:
1. **The Loom (Module 8)**: A 100% free, zero-generation campaign memory and GraphRAG search assistant that enforces per-player knowledge isolation, note privacy scoping (`private_player`, `gm_only`, `party_shared`), multi-hop Neo4j relationship paths, and clickable deep links across the app.
2. **The Weave (Module 9)**: An optional Creative AI companion and interactive Neo4j world graph renderer where every generated character, monster, faction, quest, item, spell, or loot table is a draft requiring 100% GM authorship (Approve into canon, Edit/Re-Weave, or Reject).
3. **Marketplace & Point of Sale (Module 10)**: A creator-first storefront enforcing an **85/15 revenue split**, one-click module importing into GM campaigns, popularity tracking, external campaign package JSON export, and frictionless 100% free player invite links.
4. **World Atlas & Multi-Step Quests**: Multi-step RPG quest tracking with quest givers, origin/completion locations, prerequisites, clue investigations, and automated XP awards upon quest completion.

## Reusable component audit (required for UI slices)

- **Existing components reused:** `lw-panel`, `lw-button`, `lw-badge`, `lw-icon`, `lw-entity-card`, `lw-asset-card`, `lw-empty-state`.
- **New components created once and reused across routes:**
  - `lw-scoped-note-card`: Displays campaign and session notes with privacy scope (`private_player`, `gm_only`, `party_shared`), witness character badge, and deep links.
  - `lw-quest-tracker-card`: Displays multi-step quests with quest giver, origin/destination locations, prerequisites, step-by-step objective toggles, clue citations, and XP completion action.
  - `lw-creator-module-card`: Displays Marketplace campaign modules with 85/15 creator payout math, import popularity count, included assets summary, and one-click GM import trigger.

## Security, role and visibility matrix

| Scenario | GM (`role = 'gm'`) | Authorized Player (`role = 'players'`) |
| --- | --- | --- |
| Query The Loom & author scoped notes | Full canon + `gm_only` + `party_shared` | Player-safe canon + own `private_player` + `party_shared` |
| Approve / Re-Weave / Reject Weave AI drafts | Allowed (`100% GM Authorship`) | Read-only once approved; drafts hidden |
| Import module into campaign or export campaign package | Allowed | Free table join via invite link |

## Acceptance criteria

- [x] `lw-scoped-note-card`, `lw-quest-tracker-card`, and `lw-creator-module-card` implemented with separate `.ts`, `.html`, `.scss` files and exported in `shared/ui/public-api.ts`.
- [x] Backend .NET 10 endpoints implement GraphRAG query synthesis with per-player knowledge isolation, Weave draft generation/re-weave/approval/rejection, multi-step quest progression, 85/15 Marketplace module import, and portable campaign package export.
- [x] All files remain under 500 lines (`check_source_limits.py`) and both `dotnet build` and `npm run build` succeed with zero warnings and zero errors.
