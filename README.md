# LoomWeaver AI Build Kit

This is a repository-ready, Markdown-first instruction system for AI coding agents building LoomWeaver **one feature at a time**.

## Installation

1. Unzip this kit at the **root of your LoomWeaver repository** (where your frontend and backend projects live). Merge directories rather than deleting existing files.
2. Keep `AGENTS.md` in the repository root. For Claude Code, `CLAUDE.md` points to it; for GitHub Copilot, `.github/copilot-instructions.md` points to it. Some agents load `AGENTS.md` automatically; explicitly ask your tool to read it if needed.
3. Replace illustrative folder and build-command assumptions in the docs with **your actual repo layout**. If your frontend or backend paths differ, move the nested `AGENTS.md` files to those actual roots.
4. For UI features, read `docs/architecture/component-system.md` before creating a new component; Angular component instantiation is configured through props, not duplicated page HTML/SCSS. Build browser Custom Elements only where non-Angular embedding is required.
5. Create one feature brief per feature using `docs/workflows/feature-template.md`. Use `docs/workflows/ai-task-prompt.md` when instructing an agent.
6. Run `python scripts/check_source_limits.py` locally and in CI; adapt its scan paths if your repo differs.

## Documents

- `AGENTS.md`: canonical AI implementation rules, always relevant.
- `docs/architecture/`: ownership boundaries for SQL, Neo4j, rules, media, mapping and The Loom; `engine-placement-and-ownership.md` explains client/server split; `component-catalog-and-instances.md` provides reusable UI contract inventory; `engine-placement-and-ownership.md` explains client/server split; `component-catalog-and-instances.md` provides reusable UI contract inventory; `component-system.md` establishes **configure instances, never fork page-specific UI**.
- `docs/standards/reusable-angular-components.md`: Angular component contracts, props/events, style ownership, variants and tests.
- `docs/workflows/component-spec-template.md` and `component-task-prompt.md`: reusable component build workflow.
- `docs/features/example-configurable-asset-card.md`: fully worked multi-instance Angular example.
- `docs/standards/`: Angular, .NET, and source-size standards.
- `docs/workflows/`: how to break a major feature into safe, finished slices; incremental roadmap and reusable AI prompt.
- `docs/features/`: one evolving Markdown brief per feature; start with `example-map-scatter.md`.
- `docs/adr/`: decisions that change architectural boundaries.
- `scripts/`: size-check automation, zero external dependencies.

## Best way to prompt your AI assistant

> Read `AGENTS.md`, `docs/workflows/feature-workflow.md`, and `docs/features/<feature>.md` before coding. Inspect the current implementation, identify one vertical slice, reuse Angular components via typed inputs/outputs and component-owned styling, implement it without unrelated refactoring, enforce GM/player permissions on the server, add tests, run available checks, then update the feature brief and report files changed and what remains.

These files define **target architecture**, not a claim that the features exist in the current repo. Document actual implementation status honestly.
