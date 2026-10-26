# Feature: LoomMaps Stage 2 — Cutaway Walls, Chamber Shapes, Fitted Portals & Curved Path Ribbons

- **Slug:** `loommaps-stage-2-cutaway-walls-portals-and-path-ribbons`
- **Status:** Implemented & Verified
- **Module owner:** `frontend/src/app/features/maps/` + `backend/src/LoomWeaver.Modules/Maps/`
- **System support:** System-neutral tactical battlemaps & world cartography (D&D 5e / PF2e / Vampire V5 compatible)
- **First written / Last updated:** 2026-10-26
- **Authoritative code paths:**
  - `frontend/src/app/features/maps/engine/walls/wall-polygon.builder.ts`
  - `frontend/src/app/features/maps/engine/walls/cutaway-wall.engine.ts`
  - `frontend/src/app/features/maps/engine/walls/wall-mesh.builder.ts`
  - `frontend/src/app/features/maps/engine/paths/path-ribbon.engine.ts`
  - `frontend/src/app/shared/ui/map-wall-path-architect/`
  - `backend/src/LoomWeaver.Modules/Maps/Features/BuildWallsAndPaths/`
- **Architecture docs:**
  - `../architecture/engine-placement-and-ownership.md`
  - `../architecture/component-system.md`
  - `../standards/reusable-angular-components.md`
  - `../workflows/feature-workflow.md`

## User story

As a **GM or Map Creator**, I want to draw procedural chambers (`room`, `circle`, `hexagon`, `octagon`, `l_shape`, `cave`), configure cutaway wall projection (`inward` vs `fixed-south`), insert fitted doors/portals (`door`, `double_door`, `archway`, `window`, `bars`, `breach`, `secret_door`), and trace curved path/cliff ribbons (`cobble_path`, `cliff_ridge`, `stone_stairs`, `water_stream`) so that both 2D blueprints and 3D tabletop scenes update with line-of-sight geometry and player-safe visibility.

## Boundaries and non-goals

**In scope:**
- Pure geometry builders for multi-shape chambers, Chaikin-smoothed cave walls, cutaway depth/normal calculation, and fitted door/window openings along wall edges (`t` in `[0, 1]`).
- Curved path/cliff ribbon geometry (`generateArcPoints`, cliff strata bands, taper/cap styles) rendered in Babylon.js.
- Reusable standalone Angular component `<lw-map-wall-path-architect>` with separated `.ts`, `.html`, `.scss`, `.config.ts`, and `README.md`.
- Backend vertical slice (`BuildWallsAndPaths`) enforcing GM edit permissions and filtering `secret_door` portals from player responses.

**Explicitly out of scope this slice:**
- Photorealistic offline PNG export worker and UV texture-wrapping shader editor (scheduled for LoomMaps Stage 3).

**Existing behavior not to break:**
- Stage 1 studio ribbon, 40-step Undo/Redo snapshot stack, 8-layer compositor, multi-level floor switcher, and `/map-assets` catalog browser.

## Current implementation audit

| Relevant file/service | Existing behavior | Changes required |
| --- | --- | --- |
| `features/maps/engine/map-scene-contract.ts` | Defines `MapStampNode`, `WaterSplineNode`, `LightSourceNode` | Add `MapWallSegmentNode`, `WallOpeningNode`, and `MapPathRibbonNode` to `MapSceneGraphState` |
| `features/maps/engine/rendering/babylon-map-stage.service.ts` | Renders terrain, water splines, lights, scatter, and stamps | Delegate wall/door mesh construction to `WallMeshBuilder` and path ribbon meshes to `PathRibbonEngine` |
| `features/maps/maps.page.ts` | Composes Stage 1 studio ribbon, canvas, and layers drawer | Extract initial scene seed to `map-scene-seed.ts` (reducing line count) and compose `<lw-map-wall-path-architect>` |
| `LoomWeaver.Modules/Maps/` | `SaveScene` vertical slice | Add `BuildWallsAndPaths` vertical slice with role-filtered `secret_door` portal protection |

## Reusable component audit (required for UI slices)

- **Existing components inspected/reused:** `lw-panel`, `lw-badge`, `lw-button`, `lw-icon`, `lw-map-studio-ribbon`, `lw-map-layers-drawer`.
- **New component, selector and owning module:** `LwMapWallPathArchitectComponent` (`<lw-map-wall-path-architect>`) in `frontend/src/app/shared/ui/map-wall-path-architect/`.
- **Public typed Inputs/Outputs & Config:**
  - `walls`: `input<readonly MapWallSegmentNode[]>([])`
  - `paths`: `input<readonly MapPathRibbonNode[]>([])`
  - `config`: `input<MapWallPathArchitectConfig>(DEFAULT_WALL_PATH_ARCHITECT_CONFIG)` (`variant: 'compact' | 'standard' | 'detailed'`, `allowSecretDoors`, `showPathBuilder`)
  - Outputs: `chamberBuildRequested`, `openingInsertRequested`, `pathRibbonBuildRequested`, `wallDeleted`, `pathDeleted`
- **Pages consuming the component:** `MapsPageComponent` (`/maps`).
- **Proof two instances can coexist:** All transient UI state (`selectedDrawMode`, `selectedMaterial`, `selectedPerspective`, `selectedOpeningType`, `selectedPathStyle`) is stored in instance-scoped signals, and styling uses `ViewEncapsulation.Emulated` with `:host` CSS variables.
- **No page-level CSS reaches into child internals:** Verified in `maps.page.scss`.
- **Need for actual browser Custom Element export:** No; used inside the unified Angular workspace.
- **Component contract:** `docs/features/component-spec-lw-map-wall-path-architect.md`.

## Proposed files (keep one responsibility per file)

| File | Owner | Responsibility | Estimated lines |
| --- | --- | --- | ---: |
| `frontend/src/app/features/maps/engine/map-scene-seed.ts` | Maps Engine | Default Cinth Ballroom scene seed (walls, doors, paths, stamps, lights) | 135 |
| `frontend/src/app/features/maps/engine/walls/wall-polygon.builder.ts` | Maps Engine | Pure polygon vertices (`room`, `hexagon`, `octagon`, `l_shape`, `circle`, Chaikin `cave`) | 115 |
| `frontend/src/app/features/maps/engine/walls/cutaway-wall.engine.ts` | Maps Engine | Cutaway depth, interior side, and fitted polyline door/window opening solver | 110 |
| `frontend/src/app/features/maps/engine/walls/wall-mesh.builder.ts` | Maps Engine | Babylon.js 3D/2.5D wall segments, corner posts, and portal frame meshes | 125 |
| `frontend/src/app/features/maps/engine/paths/path-ribbon.engine.ts` | Maps Engine | Arc waypoint sampler and Babylon.js road/cliff/stair ribbon mesh builder | 120 |
| `frontend/src/app/shared/ui/map-wall-path-architect/map-wall-path-architect.config.ts` | Shared UI | Typed config and intent payload contracts | 65 |
| `frontend/src/app/shared/ui/map-wall-path-architect/map-wall-path-architect.component.ts` | Shared UI | Standalone OnPush component class | 115 |
| `frontend/src/app/shared/ui/map-wall-path-architect/map-wall-path-architect.component.html` | Shared UI | Template for chamber, cutaway wall, portal, and path ribbon controls | 185 |
| `frontend/src/app/shared/ui/map-wall-path-architect/map-wall-path-architect.component.scss` | Shared UI | Scoped component styles using LoomWeaver tokens | 120 |
| `backend/src/LoomWeaver.Modules/Maps/Features/BuildWallsAndPaths/Request.cs` | Backend Maps | DTOs for wall chambers, fitted openings, and path ribbons | 75 |
| `backend/src/LoomWeaver.Modules/Maps/Features/BuildWallsAndPaths/Validator.cs` | Backend Maps | Validation for wall geometry, thickness, and path waypoints | 55 |
| `backend/src/LoomWeaver.Modules/Maps/Features/BuildWallsAndPaths/Handler.cs` | Backend Maps | Commits walls/paths and filters unrevealed `secret_door` openings for players | 95 |
| `backend/src/LoomWeaver.Modules/Maps/Features/BuildWallsAndPaths/Endpoint.cs` | Backend Maps | Minimal API endpoints for `/architecture`, `/walls`, and `/paths` | 75 |

## Security, role and visibility matrix

| Scenario | GM | Authorized player | Unauthorized player |
| --- | --- | --- | --- |
| Read `/architecture` | Receives all walls, paths, and `secret_door` openings | Receives walls, paths, and public doors; `secret_door` openings stripped unless revealed | Denied |
| Modify `/walls` or `/paths` | Allowed (`200 OK` + new revision & outbox event) | Denied (`403 Forbidden` via `MapPermissionPolicy`) | Denied (`403 Forbidden`) |
