# Feature Specification: LoomMaps Stage 1 — Studio Foundation, Multi-Level Layers, Undo/Redo History & Authoritative Save Slice

## 1. Goal & Scope
Stage 1 of the dedicated **LoomMaps Mapping Tool** rebuilds the core studio architecture cleanly inside `LoomWeaverV2` (replacing the legacy 25,845-line monolithic `map-studio.component.ts` with focused, modular services, vertical backend slices, and reusable Angular components under 500 lines per file):

1. **LoomMaps Studio Application Layer (`frontend/src/app/features/maps/application/`)**:
   - `MapHistoryEngineService`: 40-step Undo/Redo snapshot stack (`canUndo`, `canRedo`, `pushSnapshot`, `undo`, `redo`) tracking stamps, walls, lights, water splines, layers, and terrain parameters.
   - `MapStudioStoreService`: Manages active map title, `battlemap` vs. `world_map` scope, grid settings (`square`, `hex`, `isometric`, snap-to-grid, grid opacity), multi-level floors (`L0 Crypt`, `L1 Ground`, `L2 Balcony`, `+ Add Level`), Ghost Lower Floors mode (`22% opacity`), Test Token occlusion sandbox, and ordered `StudioLayer` stack (`floors`, `terrain`, `water`, `walls`, `objects`, `lights`, `notes`, `overlays`).
2. **Reusable Studio UI Components (`frontend/src/app/shared/ui/`)**:
   - `LwMapStudioRibbonComponent` (`<lw-map-studio-ribbon>`): Studio header & control ribbon with inline map title editor, Undo/Redo controls, Multi-Level floor pills, Ghost Floor toggle, Test Token Sandbox toggle, Linked `2D / Split / 3D` mode selector, quick transform controls, and `Presets / Asset Catalog / Save Revision / Send to VTT` triggers.
   - `LwMapLayersDrawerComponent` (`<lw-map-layers-drawer>`): 3-tab studio inspector (`Layers`, `Objects`, `Grid & Post-FX`) with layer visibility, lock, opacity, blend mode, add-layer support, scene object filtering, and selected stamp transform & canopy/roof occlusion controls (`fade`, `radial`, `hide`).
   - `LwMapPresetBrowserComponent` (`<lw-map-preset-browser>`): Starting environment basemap preset picker and live `/map-assets` catalog browser (`models-3d`, `stamps-2d`, `terrain-textures`, `lighting-and-overlays`) with `3D Light Aware` and `Scatter Ready` badges.
3. **Backend Vertical Slice (`backend/src/LoomWeaver.Modules/Maps/`)**:
   - Follows `docs/architecture/engine-placement-and-ownership.md`:
     - `Domain/SceneRevision.cs` and `Domain/SceneCommand.cs`
     - `Infrastructure/SceneRepository.cs` and `Infrastructure/SceneOutboxWriter.cs`
     - `Features/SaveScene/MapPermissionPolicy.cs`, `Validator.cs`, `Handler.cs`, and `Endpoint.cs`

## 2. Ownership & Guardrails
- **Client (Angular + Babylon.js)**: Owns real-time camera, 2D/3D viewport rendering, undo/redo history snapshots, layer visibility/opacity preview, and grid snapping.
- **Server (.NET 10)**: Owns GM edit authorization (`MapPermissionPolicy`), scene revision validation (`Validator`), durable scene revision persistence (`SceneRepository`), and Neo4j/SignalR outbox projection (`SceneOutboxWriter`).
- **Strict File Size Ceiling**: Every hand-written source file stays well below 500 lines (`python scripts/check_source_limits.py`).
- **Zero-Emoji Policy**: All icons use `<lw-icon>`.
