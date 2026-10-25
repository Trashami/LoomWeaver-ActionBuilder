# Copy/Paste Prompt for an AI Coding Assistant

Use this with Codex, Claude Code, Copilot or another coding agent **inside the LoomWeaver repository**. Replace only the brackets; the agent should inspect the actual repository rather than assume files exist.

---

## Prompt

You are implementing LoomWeaver, a web-first Angular/Babylon.js and .NET multi-system TTRPG platform. **Before writing code, read** root `AGENTS.md`, any applicable nested `AGENTS.md`, `docs/workflows/feature-workflow.md`, and the architecture/standard documents relevant to the task.

**Feature:** `[FEATURE]`

**Current slice:** `[ONE SMALL, VERIFIABLE USER BEHAVIOR]`

**Feature brief:** `docs/features/[SLUG].md` (create from `docs/workflows/feature-template.md` if absent).

**Hard requirements:**

1. Inspect existing implementation and dependencies. Preserve working code and current conventions; no speculative whole-app rewrite.
2. Plan a cohesive vertical slice and list each file you will create/modify with its single responsibility.
3. Before building any UI, inspect existing reusable Angular components. Use new standalone components only where needed, with typed Inputs/Outputs, explicit config/variants, separate TS/HTML/SCSS, component-owned styles, and tests covering two independent instances. Pages must compose via properties/events without copied markup or child CSS overrides. Real browser Custom Elements only for non-Angular hosts. See `docs/architecture/component-system.md`.
4. Keep hand-written files generally 100–300 lines; no file over 500 without a documented approved exception; keep classes/services focused and methods short.
5. Angular owns UI and Babylon rendering/editing. .NET owns authority, permissions, combat/rules, durable events and state. Shared contracts are typed and versioned.
6. Do not expose unrevealed GM content to players by **any** API, query, AI retrieval, search suggestion, graph relation, notification, file URL, export, analytics or realtime update.
7. The Loom is available on every page, and does not require The Weave. The Weave is independently optional.
8. Game rules must be game-system/version aware. Do not hardcode D&D logic in system-neutral components.
9. SQL is authoritative and normalized; JSON is for validated import/export and bounded configuration; binary assets in private object storage; Neo4j receives trusted event/knowledge projections.
10. Add positive and negative automated tests. Run all appropriate existing lint, typecheck, builds and tests, plus source-size check. Do not claim checks pass without execution.
11. Update the feature brief, contracts/architecture notes and status; end with concise summary, exact files, tests executed, known limitations, and next slice.

**Acceptance criteria:**
`[CLEAR BULLET OR GIVEN/WHEN/THEN CONDITIONS]`

Proceed with this slice without expanding scope to unrelated features. If the current codebase prevents this implementation, document the blocker and complete the largest safe partial slice possible.

---

## Example task, filled in

**Feature:** Map Scatter Brush

**Current slice:** When a GM selects a Wildflower collection and drags a brush over terrain, create reproducible random asset placements aligned to terrain height; support undo and persist the operation. No water or full biome system yet.

**Acceptance criteria:**

- GM can select a collection and adjust density, rotation and scale range.
- Same stroke seed produces same placements on the same terrain revision.
- Trees/rocks reject slopes/exclusion zones as configured; collisions don't overwrite locked items.
- Unauthorized players cannot persist editor changes or download GM-only assets.
- Reload and 2D/3D switching preserve scene placement.
- Tests cover deterministic placement and permission denial.
