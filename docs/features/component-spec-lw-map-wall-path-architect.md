# Reusable Component Specification: Map Wall & Path Architect (`lw-map-wall-path-architect`)

- **Selector:** `lw-map-wall-path-architect`
- **Classification:** Feature composite (`shared/ui/map-wall-path-architect`)
- **Shared consumers:** `MapsPageComponent` (`/maps`) and future Dungeon/Encounter Architect drawers
- **Owned module:** `frontend/src/app/shared/ui/map-wall-path-architect/`
- **Status:** Verified
- **Existing reusable alternatives inspected:** `lw-map-tool-panel` (handles basic brush radius/intensity/seed), `lw-map-layers-drawer` (handles layer stack and stamp transforms). Neither owns chamber shape generation, cutaway wall projection, fitted portal openings, or curved path ribbons.

## Responsibility

Renders the interactive architectural builder for:
1. Chamber & Wall Draw Modes (`room`, `hexagon`, `octagon`, `l_shape`, `circle`, `cave`, `line`), wall materials (`Obsidian Ashlar`, `Cinth Gilded Marble`, `Dwarven Runic Basalt`, `Castle Timber`, `Sewer Brickwork`), cutaway perspective (`topdown`, `auto`, `heavy`), and projection (`inward`, `fixed-south`).
2. Fitted Door & Portal Openings (`door`, `door_open`, `double_door`, `archway`, `window`, `bars`, `breach`, `secret_door`) along existing walls with normalized position `t` (`0.15` to `0.85`).
3. Curved Path & Cliff Escarpment Ribbons (`cobble_path`, `dirt_road`, `cliff_ridge`, `stone_stairs`, `mine_tracks`, `water_stream`, `waterfall`) with curvature angle (`-120 deg` to `+120 deg`), width, and cliff strata bands.

It must **not** directly mutate Babylon.js meshes or bypass server authorization; it emits typed intent payloads to its parent container.

## Public API

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `walls` | `readonly MapWallSegmentNode[]` | No | `[]` | Authorized wall segments & chambers in the active scene |
| `paths` | `readonly MapPathRibbonNode[]` | No | `[]` | Authorized curved path & cliff ribbons in the active scene |
| `config` | `MapWallPathArchitectConfig` | No | `DEFAULT_WALL_PATH_ARCHITECT_CONFIG` | Controls `variant` (`compact \| standard \| detailed`), `allowSecretDoors`, and `showPathBuilder` |

| Output | Payload | When emitted |
|---|---|---|
| `chamberBuildRequested` | `ChamberBuildIntent` | User clicks **Generate Chamber / Wall** |
| `openingInsertRequested` | `WallOpeningInsertIntent` | User clicks **Fit Opening Into Wall** |
| `pathRibbonBuildRequested` | `PathRibbonBuildIntent` | User clicks **Trace Curved Path / Cliff** |
| `wallDeleted` | `string` | User removes a wall segment by ID |
| `pathDeleted` | `string` | User removes a path ribbon by ID |

## Acceptance tests

- [x] Two simultaneous instances with different inputs and variants work independently.
- [x] Parent page contains *no* selectors reaching into component internals.
- [x] Different data updates do not leak cross-instance state.
- [x] Inputs are typed, outputs are semantic and documented.
- [x] Accessible with keyboard, screen reader and reduced-motion preferences.
- [x] Sensitive inputs (`secret_door`) authorized and filtered server-side; no GM secret leak.
- [x] Separate `.ts`, `.html`, `.scss`, `.config.ts`, and `README.md` files under 500 lines.
