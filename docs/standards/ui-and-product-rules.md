# LoomWeaver UI and Product Standards

## Consistent application shell

Use the existing LoomWeaver design reference: dark charcoal/forest-green canvas, subtle emerald accents, restrained antique-gold highlights, legible fantasy serif headings and practical sans-serif controls. Preserve page layouts and spacing rules rather than recreating a different design system for each feature.

Primary shell: global left navigation + campaign header + main feature workspace + contextual sidebar when useful. The Loom launcher belongs in the **persistent header** and must remain accessible on every feature page for GM and players. The Loom drawer should reflow content or reserve space on desktop instead of obscuring map controls; support modal/fullscreen on mobile.

## Component-first design contract

Every reusable card, dropdown, statistics chart, NPC inspector, map tool, modal, and marketplace preview must be a standalone Angular component with a documented public API. Each visual instance is configured through typed inputs and semantic outputs; the component owns its layout and styles. Parent pages control placement and authorized data sources, not internal styling. Reuse the same underlying components across GM/player pages with server-filtered data. See `component-system.md` and `../standards/reusable-angular-components.md`.

## Shared UI primitives

- Campaign selector, breadcrumb, route-level loading/error states, icon navigation and keyboard focus.
- Search/list/detail inspector pattern for NPCs, creatures, items, quests, lore and encounters.
- Right-hand optional contextual Act / Location / Session inspector where appropriate.
- Shared `PermissionAwareLink`, `AudienceMarker`, `AssetEntitlement`, `ConfirmationDialog`, `UnauthorizedView` components. These components display authorized server data but **do not decide authorization**.
- Clear GM/Player preview switch only for users explicitly authorized to simulate that role. Do not expose GM facts to the player client.

## Plan and marketplace UX

- Proposed tiers: Spark Free, Threadkeeper $6/mo, Weaver $12/mo, Archweaver $24/mo, with year billing two months free. Treat tier capabilities as config/entitlement data, not hardcoded in UI. The free tier provides meaningful usable play and basic export.
- Asset library distinguishes Free, Included with subscription, Purchased, and Creator Licensed. Show approved premium thumbnails and nonintrusive purchase/upgrade pathways in relevant editing/asset screens.
- Never interrupt a live combat flow with an upgrade blocker and never show locked original binaries in a preview.
- Players can join the GM's campaign without paying; licensed playback of GM assets follows entitlements/creator license policy.

## Feature-level experience constraints

- **Campaign:** acts, sessions, story beats, secrets, GM drag-and-connect planning, relations and provenance.
- **Maps:** place stamps/structures, draw walls, sculpt height, brush plants/rocks, water/weather/time, 2D/3D mode and player-safe 2D export.
- **Dice Forge:** visual cosmetic customization, roll sounds, natural-20 and natural-1 effects; actual rolls remain server-authoritative.
- **Arcane Screen:** active encounter, map, initiative, party/creature state, quests, quick notes, contextual story guide.
- **Characters:** configurable system/GM rules for creation/advancement, player alerts when eligible/approved for leveling.
- **Music:** uploaded/library tracks, location ambience, encounter automation and GM override; respect browser audio activation.
- **Statistics:** radar/ability charts, event-backed damage by enemy type, last hits, session histories, player styles; no hidden NPC/encounter counts leak.

## Accessibility and performance

- Keyboard navigable menus/dialogs, visible focus, usable contrast, descriptive control labels, reduced motion and sensible screen-reader alternatives for charts/maps.
- Quality modes Auto/Cinematic/Balanced/Performance 3D/Classic 2D; preserve rule outcomes and scene state regardless of graphics profile.
- Do not use imagery that contains sensitive GM-only notes as the player-facing map background.

## UI review checklist

- Matches established shell/tokens, not a one-off redesign.
- No permanently overlapping Loom popover blocking play.
- No confusing hidden/unauthorized content hints or counts.
- Loading/error/empty states included.
- Small display, keyboard and reduced-motion behavior accounted for.
