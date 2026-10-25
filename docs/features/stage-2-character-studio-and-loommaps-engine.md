# Feature: Stage 2 — Character Studio (Server-Side Rules Engine) & LoomMaps (Babylon.js 2D/3D Engine)

- **Slug:** `stage-2-character-studio-and-loommaps-engine`
- **Status:** Verified
- **Module owner:** `features/characters` + `features/maps` / `LoomWeaver.GameSystems` + `LoomWeaver.Modules`
- **System support:** D&D 5e (`dnd5e`), Pathfinder 2e (`pf2e`), Vampire: The Masquerade V5 (`vampire_v5`)
- **First written / Last updated:** 2026-10-25
- **Authoritative code paths:**
  - `frontend/src/app/shared/ui/rules-option-selector/`
  - `frontend/src/app/shared/ui/map-tool-panel/`
  - `frontend/src/app/shared/ui/asset-picker/`
  - `frontend/src/app/features/characters/`
  - `frontend/src/app/features/maps/`
  - `backend/src/LoomWeaver.GameSystems/CharacterCalculationEngine.cs`
  - `backend/src/LoomWeaver.Modules/Characters/CharacterStudioEndpoints.cs`
  - `backend/src/LoomWeaver.Modules/Maps/LoomMapsEndpoints.cs`
- **Architecture docs:** `../architecture/module-roadmap.md`, `../architecture/component-catalog-and-instances.md`, `../architecture/engine-placement-and-ownership.md`

## User story

As a GM or Player, I want a full **Character Studio** backed by a server-side character/rules engine (supporting character creation, ability scores, equipment loadouts, derived combat stats, and level-up advancement across D&D 5e, PF2e, and Vampire V5) and a live **LoomMaps** 2D/3D Babylon.js map engine (supporting procedural terrain, water splines, 2D/3D stamping, deterministic scatter brushes, and 2.5D lighting) inside our single Angular workspace and modular .NET solution.

## Boundaries and non-goals

**In scope:**
- Three new reusable catalog components from `component-catalog-and-instances.md`: `lw-rules-option-selector`, `lw-map-tool-panel`, and `lw-asset-picker`.
- Server-side `CharacterCalculationEngine` and REST endpoints for character sheets, creation, equipment changes, and level-up advancement.
- Full Character Studio UI with interactive sheet editor, equipment picker, level-up workflow, and character creation builder.
- Modular Babylon.js map engine (`terrain`, `water`, `scatter`, `lighting`, `rendering`) with live `<canvas>` interaction in `2D Blueprint`, `3D Tabletop`, and `Linked 2D <-> 3D` modes.
- Server-side LoomMaps scene graph & command endpoint (`/api/v1/campaigns/{campaignId}/maps/{sceneKey}/commands`).

## Reusable component audit (required for UI slices)

- **Existing components reused:** `lw-panel`, `lw-button`, `lw-badge`, `lw-icon`, `lw-entity-card`, `lw-asset-card`, `lw-stat-radar`, `lw-empty-state`.
- **New components created once and reused across routes:**
  - `lw-rules-option-selector`: Typed `options`, `selectedId`, `label`, `variant` (`pills | cards`); emits `selectionChanged`. Used in Character Studio (system, class/archetype, level-up perk) and LoomMaps (biome preset, camera/render mode).
  - `lw-map-tool-panel`: Typed `tools`, `activeToolId`, `brushRadius`, `brushIntensity`, `deterministicSeed`; emits `toolChanged`, `brushUpdated`, `commandRequested`. Used in LoomMaps 2D and 3D editors.
  - `lw-asset-picker`: Typed `assets`, `selectedAssetId`, `categoryFilter`, `compact`; emits `assetPicked`, `unlockRequested`. Reused across LoomMaps (stamp/scatter palette), Character Studio (equipment vault), and Dice Forge.
- **Confirmation no page-level CSS reaches into child internals:** Verified; pages use only CSS Grid/Flex layout and public component inputs/outputs.

## Acceptance criteria

- [x] `lw-rules-option-selector`, `lw-map-tool-panel`, and `lw-asset-picker` built with separate `.ts`, `.html`, `.scss` files.
- [x] Character Studio supports viewing full character sheets, toggling equipped gear with live AC/attack recalculation, executing XP level-ups, and creating new characters.
- [x] LoomMaps renders an interactive Babylon.js 3D/2D scene with terrain height/color, water river spline, instanced scatter props, placed stamps, and dynamic point lighting.
- [x] Backend .NET 10 endpoints validate permissions and compute authoritative character & map state.
- [x] All hand-written files stay under 500 lines (`check_source_limits.py`) and both `dotnet build` and `npm run build` succeed with zero errors.
