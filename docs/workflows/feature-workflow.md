# One Feature at a Time: AI Implementation Workflow

**Purpose:** Make an AI assistant productive on a small LoomWeaver module without silently rebuilding the entire app or breaking an established feature.

## Phase 0: Discovery

- Read root `AGENTS.md`, nested instructions (if present), relevant architecture/standards docs and feature brief.
- Inspect only pertinent source/solution, schemas, dependencies and tests. Find established patterns first.
- State what is implemented, what is missing and any incompatibility with the target design.
- Choose a **vertical slice** that can be verified, not an expansive "build all of maps" prompt.

## Phase 1: Contract and design

For the selected slice write in the feature Markdown brief:

1. User-facing behavior and GM vs player behavior.
2. File list (new and modified), module boundaries and one responsibility per file.
3. Request/response DTOs, JSON package contract, domain commands/events where necessary.
4. Database schema/migration and any Neo4j projector or object storage change.
5. Security requirements and exact negative tests (especially role, campaign and revelation).
6. Test plan and measurable acceptance criteria.
7. Dependencies on existing slices. Do not implement speculative future modules in this slice.

## Phase 2: Implementation order

Recommended order for a server-owned feature:

`domain model -> request/response contract -> authorization -> handler/rules -> persistence/outbox -> API -> Angular API client/store -> small UI -> tests -> docs`.

Recommended order for a visual editor feature:

`scene contract -> pure algorithm -> editor command/undo -> renderer integration -> save/reload API -> input tools -> visual UI -> 2D/3D tests -> authorization tests`.

Make each change buildable. Keep migrations controlled. Avoid broad refactors and dependency changes without need.

## Phase 3: Verify

- Unit tests on affected pure code.
- Integration tests where storage/API is changed.
- E2E/manual acceptance of specific user behavior.
- Confirm no secret leakage in unauthorized queries, logs, notifications, file delivery and screenshots.
- Run lint/typecheck/build and source line check, or say exactly why not.
- Re-read diff for oversized files, repeated logic, ghost code and unrelated changes.

## Phase 4: Handoff

Update the feature brief:

- Status: proposed -> in progress -> implemented -> verified.
- Existing vs added APIs/data/migrations.
- Which acceptance criteria passed and commands executed.
- Remaining known gaps; one recommended next slice.

## Example slice sequence: Map Builder

1. Render empty 2D and 3D scenes from common scene contract.
2. Place, transform and remove one GLB instance with undo.
3. Persist map edits and enforce GM-only editing permissions.
4. Add rectangular room and snapped wall edges.
5. Add material painting and terrain elevation chunks.
6. Add deterministic weighted scatter collections.
7. Add river spline mesh and animated water presets.
8. Add local lights/weather and quality profiles.
9. Add player-safe 2D exports and device-specific 2D fallback.

Each slice has a real acceptance test and does not depend on unimplemented advanced effects.

## Reusable component gate for UI changes

Before implementation, audit shared UI. Prefer an existing Angular component and pass typed properties; if absent, create one with owned TS/HTML/SCSS, documented config/variants, semantic output events and tests. Parent pages compose components and own layout, not child internals. Verify two simultaneous instances with different data, no CSS overrides and no cross-instance state bleed. Use actual Angular Elements only for an explicit external embed use case. See `docs/architecture/component-system.md` and `docs/workflows/component-spec-template.md`.

For each UI slice, consult `docs/architecture/component-catalog-and-instances.md`; for engine work, consult `docs/architecture/engine-placement-and-ownership.md`. Do not treat a reusable DOM component as a replacement for thousands of Babylon render instances.
