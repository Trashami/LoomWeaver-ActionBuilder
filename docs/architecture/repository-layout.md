# Proposed Repository Layout

> Adapt these names to the **existing** repository. Do not move everything without a migration plan. These are logical ownership locations, not a demand to create empty directories.

```text
LoomWeaver/
├─ AGENTS.md                         # Canonical AI rules
├─ CLAUDE.md                         # Tool-specific pointer
├─ frontend/
│  ├─ AGENTS.md
│  └─ src/app/
│     ├─ core/                        # auth, API transport, global shell
│     ├─ shared/                      # reusable UI primitives (not business logic)
│     │  └─ ui/asset-card/            # TS + HTML + SCSS + config + test for each reusable widget
│     ├─ integrations/elements/      # optional Angular Elements adapters for external hosts
│     └─ features/
│        ├─ campaigns/
│        ├─ characters/
│        ├─ maps/
│        │  ├─ editor/                # Angular UI, store, tools
│        │  ├─ engine/
│        │  │  ├─ terrain/
│        │  │  ├─ scatter/
│        │  │  ├─ water/
│        │  │  ├─ lighting/
│        │  │  ├─ rendering/
│        │  │  ├─ interaction/
│        │  │  └─ commands/
│        │  └─ api/
│        ├─ arcane-screen/
│        ├─ encounters/
│        ├─ dice/
│        ├─ effects/
│        ├─ assets/
│        ├─ marketplace/
│        ├─ statistics/
│        ├─ loom/                     # globally available shell UI
│        └─ weave/                    # independently toggleable optional UI
├─ backend/
│  ├─ AGENTS.md
│  ├─ src/
│  │  ├─ LoomWeaver.Api/              # auth middleware and endpoint registration
│  │  ├─ LoomWeaver.Domain/           # domain contracts + shared primitives
│  │  ├─ LoomWeaver.Modules/
│  │  │  ├─ Campaigns/Features/CreateCampaign/
│  │  │  ├─ Characters/Features/LevelUp/
│  │  │  ├─ Maps/Features/SaveScene/
│  │  │  ├─ Assets/Features/Upload/
│  │  │  ├─ Encounters/
│  │  │  ├─ Knowledge/
│  │  │  ├─ Marketplace/
│  │  │  └─ Statistics/
│  │  ├─ LoomWeaver.GameSystems/
│  │  │  ├─ Abstractions/
│  │  │  ├─ Dnd5e/
│  │  │  ├─ Pathfinder2e/
│  │  │  └─ VampireV5/
│  │  └─ LoomWeaver.Infrastructure/
│  │     ├─ MySql/
│  │     ├─ Neo4j/
│  │     ├─ Storage/
│  │     ├─ Messaging/
│  │     └─ AI/
│  └─ tests/                           # organize tests by module and layer
├─ contracts/                         # shared OpenAPI, JSON Schema, package schemas
├─ docs/
│  ├─ architecture/
│  ├─ standards/
│  ├─ workflows/
│  ├─ features/                        # active feature specs, per slice
│  └─ adr/
└─ scripts/
   └─ check_source_limits.py
```

## Component-first composition

Each reusable visual component is defined once, even when instantiated on many pages. A route page binds its authorized view model and typed config to the component and handles its semantic outputs. A route page does not change child internals with route-level CSS; each component owns its styles. Read `component-system.md` and `../standards/reusable-angular-components.md` before adding a new UI element.

## File organization examples

**Angular scatter brush:** `scatter-brush.service.ts` orchestrates strokes; `weighted-asset-selection.ts` chooses templates; `seeded-placement.ts` generates positions; `scatter-command.ts` represents an undoable edit; `scatter-settings.html` handles presentation.

**.NET level up:** `Characters/Features/LevelUp/Endpoint.cs`, `Request.cs`, `Handler.cs`, `Validator.cs`, `LevelUpAuthorization.cs`, then `GameSystems/<system>/Advancement/*` for rule-specific calculations.

**.NET secret reveal:** `Knowledge/Features/RevealFact/Endpoint.cs`, `Handler.cs`, `KnowledgePolicy.cs` (shared module policy), `PublicationProjector.cs` (worker). Never embed AI prompts, DB access and role logic in one handler.

## Practical boundaries

- Co-locate tests with Angular features. Organize .NET tests by matching module and feature.
- Avoid root-level generic `Services` or `Utils` dumps. Shared code earns its location only after multiple genuine consumers.
- Do not let modules import each other's internals; use public interfaces/events/contract DTOs.
- Use explicit module registration and small configuration files. No monolithic `Program.cs` full of rules.
