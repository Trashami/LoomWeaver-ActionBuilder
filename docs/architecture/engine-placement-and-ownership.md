# Engine Placement, Ownership and Module Size

> Status: **target design**, not proof that these engines are already implemented. Adapt file paths to the real repository.

## Engines can be large; individual files should be small

An engine is a collection of cohesive modules, algorithms, contracts and tests. It **does not** have a 500-line total limit. Target 100–300 lines per hand-written file; 500 is the reviewed default ceiling. A 10,000-line terrain engine composed of focused classes is fine. A `TerrainEngine.ts` with 10,000 lines is not.

Split on **responsibility and independent reasons to change**, not arbitrary line counts. One class per hand-maintained file is the default, not a prohibition on closely related trivial types.

## Ownership matrix

| Engine | Client (Angular/TypeScript/Babylon) | Server (.NET) |
| --- | --- | --- |
| Map rendering | Cameras, materials, 2D/3D renderers, render quality, scene graph | Only authorized scene content/metadata; optional offline export worker |
| Terrain/scatter/water/weather | Brushes, local preview, deterministic seeds, GPU effects | Edit permission, asset licensing, revision acceptance, durable scene operations |
| Action and Effect Builder | Reusable editors, typed effects/graph UI, particle preview | Validate allowed action operations, authoritative rule results and storage |
| Dice | GLB rendering and visible physics/animation | Secure random results, visibility, roll audit |
| Combat and advancement | Interactions, range previews, state display | Rule evaluation, turns, damage, HP, XP, feats, level-up approval/alerts |
| Audio and triggers | Mix, play, pause, crossfade, per-player volume | Authorized audio cues, encounter events and audience-safe dispatch |
| Marketplace and assets | Browsing, previews, creator uploader | Purchases, entitlements, royalties, protected file delivery |
| Knowledge / The Loom | Global, screen-aware assistant component | GM/player-specific safe retrieval, GraphRAG, disclosure, citation permissions |
| The Weave | Optional graph visualization | Authorized graph projection independent of whether UI is enabled |
| Statistics | Chart and radar visualization | Event aggregation and authorization-safe results |

## One command, one source of truth

1. UI fires an intent/command via typed input/output contract.
2. Client may preview edits before persistence, but never authorizes their own privileged operation.
3. .NET verifies user, campaign, asset rights, target and version; commits authoritative events in MySQL.
4. Transactional outbox projects approved changes to Neo4j; SignalR sends audience-scoped updates.
5. Clients reconcile accepted revision; adjust render quality locally and never receive unrevealed scene objects.

## Example frontend module layout

```text
features/maps/
  components/         # Angular UI with HTML, SCSS and typed APIs
  application/        # editor state, commands, undo/redo
  engine/terrain/     # chunks, brushes and geometry
  engine/scatter/     # collection, deterministic placement and instancing
  engine/water/       # spline river generator and shaders
  engine/rendering/   # Babylon lifecycle, quality and 2D fallback
  data-access/        # HTTP and SignalR adapters
```

## Example backend vertical slice

```text
Modules/Maps/Features/SaveScene/
  Endpoint.cs
  Request.cs
  Validator.cs
  Handler.cs
  MapPermissionPolicy.cs
Modules/Maps/Domain/
  SceneRevision.cs
  SceneCommand.cs
Modules/Maps/Infrastructure/
  SceneRepository.cs
  SceneOutboxWriter.cs
```

## Rules for AI edits

- Do not create a god-engine file, leak server logic into a component, or build duplicate local authoritative rules.
- Place shared contracts in versioned schemas/DTOs; consumers must depend on module public interfaces.
- For every slice, trace the lifecycle: UI intent → authorized API → domain change → persistence → event → UI state.
- Test at least one authorization denial and failure path for durable state changes.
- Test responsive/reduced-motion behavior when rendering effects or audio animations.
- Measure performance rather than assume a native wrapper is faster than browser rendering.
