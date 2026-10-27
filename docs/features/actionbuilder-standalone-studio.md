# ActionBuilder Standalone Studio (`actionbuilder.loom-weaver.com`)

## Overview
**LoomWeaver ActionBuilder** (`actionbuilder-studio`) is a standalone Angular 22 application served at `https://actionbuilder.loom-weaver.com` and powered by the unified `.NET 10` backend (`LoomWeaver.Api` -> `LoomWeaver.Modules.ActionStudio`).

It uses the standard LoomWeaver Header Bar (without a left app-navigation sidebar) and defaults to a **Guided Ability Builder ("Describe the rule")** organized around three workspace modes (`Build` | `Test` | `Advanced`) editing a single unified rule model.

## Workspace Modes (Single Rule Model)
1. **`1. Build` (Default — "Describe the rule")**:
   - **Three Collapsible Rule Groups (`<lw-guided-rule-groups>`)**:
     - **Trigger**: Plain-language triggers (e.g., *An attack hits you OR Magic Missile targets you*) with explicit `Match ANY (OR)` vs `Require ALL (AND)` selection and a single `+ Add trigger` contextual picker.
     - **Requirements**: Resource, casting, and spatial requirements (e.g., *Reaction available AND Appropriate 1st-level spell slot available AND Applicable casting requirements*) with explicit `Require ALL (AND)` vs `Match ANY (OR)` badges between conditions.
     - **Effects**: Ordered effects and numeric/formula adjusters (`AC Bonus`, `Outcome Formula`, `Duration`), plus optional fallback outcome.
   - **Ability Details & Interactions (`<lw-rule-parameters-editor>`)**: Plain-language fields (`Name`, `Type`, `Action Cost`, `Source`, `Description`, `Range`, `Target`, `Duration`, `Works With`, and `Conflicts With`).
2. **`2. Test` (`<lw-rule-test-sandbox>`)**:
   - Dedicated tabletop scenario sandbox that answers the tabletop question directly (e.g., *`Attack total 17 against AC 15. Shield raises AC to 20. The attack misses.`*) and verifies resource consumption (`Reaction` and `Spell Slot`).
   - Includes 1-click preset tests for success and failure cases: `Hit Turned Into Miss`, `Failure: No Reaction`, `Failure: No Spell Slot`, `Attack Still Hits (22 vs AC 15)`, `Magic Missile Targeted`, and `Unsupported Check ("Not evaluated")`.
3. **`3. Advanced` (`<lw-clause-sentence-editor>`)**:
   - Edits the same underlying `clauses` and engine bindings without losing data when switching modes.
   - Provides plain-language branch headings, single contextual `+ Add condition` pickers, diagnostics for unsupported checks, and a collapsed **Engine Details & C#/TS Symbol Bindings** drawer.

## Right-Hand Inspector (`<lw-rule-preview-inspector>`)
- **Concise Player / GM Ability Card**: Defaults to a concise player-facing ability card (`Preview (Player)` / `Preview (GM)` + `Sheet View`) without repeating raw technical clause lists.
- **Draft-to-Campaign Change Summary**: Diffs the working draft against the saved campaign baseline (`before -> after`), allowing the DM to `Save Draft` separately before clicking `Apply to <Campaign>`.
- **Scaling & Level Up Options**: Level `1-4`, `5-10`, `11-16`, `17-20` progression table.
- **Tags & Linking**: Quick tag management.
