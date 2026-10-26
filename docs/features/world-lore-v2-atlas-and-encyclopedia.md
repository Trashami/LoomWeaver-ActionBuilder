# Feature Specification: World & Lore V2 — Interactive Atlas & Living Encyclopedia

- **Slug:** `world-lore-v2-atlas-and-encyclopedia`
- **Status:** In Progress (Slices A–H)
- **Routes:** `/weave`, `/world-lore`
- **Modules:** `LoomWeaver.Domain`, `LoomWeaver.Infrastructure`, `LoomWeaver.Modules.Knowledge`, `frontend/src/app/features/weave`, `frontend/src/app/shared/ui`

## 1. Phase 1 Assessment Summary

### Existing Components Reused
- `LwAppHeaderBarComponent`, `LwLoomLauncherComponent`, `LwScrollAreaComponent`, `LwPanelComponent`, `LwBadgeComponent`, `LwButtonComponent`, `LwIconComponent`, `LwEmptyStateComponent`, `LwEntityCardComponent`
- `LwInspectorDrawerComponent` (enhanced to provide World & Lore contextual inspection and default World Overview when on `/weave` or `/world-lore`, while keeping Session Adventure Guide accessible via a compact mode toggle)
- `LoomWeaverStoreService` (active campaign, viewer role, Weave toggle, authorized entities/scenes/graph edges)
- `LoomWeaverMySqlRepository` and `LoomWeaverNeo4jService`

### Components & Services Added / Modified
- `WorldLoreFacadeService` (`frontend/src/app/features/weave/services/world-lore-facade.service.ts`) — coordinates Atlas, Lore Library, World History, Relationships, layer filter persistence, location inspector state, and server synchronization.
- `LwAtlasLayerFiltersComponent` (`frontend/src/app/shared/ui/atlas-layer-filters/`) — configurable filter bar for Atlas layers with `Show All`, `Clear`, `Reset`, and per-campaign persistence.
- `LwWorldAtlasComponent` (`frontend/src/app/shared/ui/world-atlas/`) — interactive pan/zoom campaign world atlas with hierarchy breadcrumbs (`World → Continent → Region → Settlement → District → Building`), territory polygons, party journey path with session filtering, markers, legend, scale bar, and empty-map state.
- `LwLocationInspectorComponent` (`frontend/src/app/shared/ui/location-inspector/`) — right-hand contextual inspector with `Overview`, `Lore`, `Connections`, `History`, and `Secrets` (GM-only) tabs, inline GM editing, entity linking, sublocation creation, map assignment, and secret revelation.
- `LwWorldOverviewComponent` (`frontend/src/app/shared/ui/world-overview/`) — default right-hand panel when no location or lore entry is selected.
- `LwLoreLibraryComponent` (`frontend/src/app/shared/ui/lore-library/`) — searchable encyclopedia with extensible system-agnostic taxonomy, list/card toggle, quick creation (title + category), rich text editor with `@` mention autocomplete, and GM visibility controls.
- `LwWorldHistoryComponent` (`frontend/src/app/shared/ui/world-history/`) — historical chronicle separating fictional world dates from real-world session timestamps, linked to locations, factions, and NPCs.
- `LwWeaveRelationshipsGraphComponent` (`frontend/src/app/shared/ui/weave-relationships-graph/`) — extracted Neo4j relationship graph exposed under the optional `Relationships` tab when The Weave is enabled.

### Security & Visibility Rules
- All endpoints in `WorldLoreEndpoints` filter by `viewerRole` (`gm` vs `players`) on the server before returning any DTO.
- GM-only locations, secret markers, actual unrevealed NPC positions, draft/GM-only lore entries, and GM secrets are stripped server-side and excluded from statistics counts, search, and `@` mention autocomplete.
