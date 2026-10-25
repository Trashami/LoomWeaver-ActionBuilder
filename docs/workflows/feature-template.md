# Feature: <Feature Name>

- **Slug:** `<feature-slug>`
- **Status:** Proposed | In Progress | Implemented | Verified
- **Module owner:** Frontend / Backend module
- **System support:** D&D 5e / PF2e / Vampire V5 / system-neutral
- **First written / Last updated:** YYYY-MM-DD
- **Authoritative code paths:** (fill after repository inspection)
- **Architecture docs:** (links relative to this note)

## User story

As a `<GM/player/creator>`, I want `<behavior>` so that `<outcome>`.

## Boundaries and non-goals

**In scope:** ...

**Explicitly out of scope this slice:** ...

**Existing behavior not to break:** ...

## Current implementation audit

| Relevant file/service | Existing behavior | Changes required |
| --- | --- | --- |
| (inspect first) | ... | ... |

## Reusable component audit (required for UI slices)

- Existing components inspected/reused:
- New component(s), selectors and owning module:
- For each new component: public typed Inputs/Outputs, config/variants, default/loading/empty states, style tokens and accessibility:
- Pages consuming the component(s) and example instantiations:
- Proof that two instances can coexist without shared-state bleed:
- Confirmation no page-level CSS reaches into child internals:
- Need for actual browser Custom Element export (only for non-Angular hosts): Yes / No; why?
- Component contract: `docs/workflows/component-spec-template.md` (if creating a shared component).

## Proposed files (keep one responsibility per file)

| File | Owner | Responsibility | Estimated lines |
| --- | --- | --- | ---: |
| ... | ... | ... | ... |

## Contracts and data

- API routes / typed DTOs:
- Domain rules/commands/events:
- MySQL tables/migrations:
- Neo4j projection changes:
- Asset/object storage changes:
- JSON import/export revision:
- Idempotency/concurrency considerations:

## Security, role and visibility matrix

| Scenario | GM | Authorized player | Unauthorized player |
| --- | --- | --- | --- |
| Read | ... | ... | Denied |
| Modify | ... | ... | Denied |
| Search/AI/export | ... | ... | Denied |

## Acceptance criteria

- [ ] Main user path works.
- [ ] Reusable Angular components are configured using public typed properties and events; no duplicated UI or internal page overrides.
- [ ] Two instances with different props coexist independently (for UI changes).
- [ ] System-specific rules are versioned/validated as applicable.
- [ ] Read/write permissions are enforced server-side.
- [ ] Exports, graph retrieval, media and realtime do not leak secrets.
- [ ] Relevant existing behaviors unaffected.
- [ ] Tests and build run or limitations reported.
- [ ] File limits checked.

## Implementation slices

- [ ] Slice 1: ...
- [ ] Slice 2: ...

## Tests performed

| Command/test | Result | Notes |
| --- | --- | --- |
| (actual output only) | ... | ... |

## Decisions, open issues, next slice

- Decision:
- Open issue:
- Next narrow task:
