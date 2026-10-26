# ActionBuilder Standalone Studio (`actionbuilder.loom-weaver.com`)

## Overview
**LoomWeaver ActionBuilder** (`actionbuilder-studio`) is a standalone Angular 22 application served at `https://actionbuilder.loom-weaver.com` and powered by the unified `.NET 10` backend (`LoomWeaver.Api` -> `LoomWeaver.Modules.ActionStudio`).

It replaces the legacy monolithic ActionBuilder interface with a clean, campaign-scoped 3-column workbench that lets Dungeon Masters select a rule or reaction, edit its `When / If / Contains / Has / Has Not / Where / And / Or / With / Then / Else` clauses bound to real classes and methods in the LoomWeaver Rules Engine, test it in a live combat sandbox, and apply it **exclusively to their own campaign**.

## Campaign & Role Authorization Matrix
| User Scenario | Campaign Ownership | ActionBuilder Behavior |
|---|---|---|
| **Primary DM** (`GeoJason`, `trashami`, `GregMeinert`) | DM of `Shadow of the Mountain` (or their own campaigns) | Full access to select, edit, test, and apply rules to their own DM campaign(s). |
| **Player in Campaign A who ALSO has their own DM Campaign B** (`ScottBrogan`, `StickHazen`) | Player in `Shadow of the Mountain` (`#1`), DM of their own campaign (`#103` / `#104`) | Cannot see or modify `Shadow of the Mountain` (`#1`). Even if navigated with `?campaignId=1`, ActionBuilder filters out `#1` and **automatically defaults to their own DM campaign** (`#103` / `#104`). |
| **Pure Player with No DM Campaign** (`DallasCrow`, `RyanIssak`, `PeteHigano`) | Player in `Shadow of the Mountain` (`#1`), owns `0` DM campaigns | Editor is hidden and replaced by `<lw-dm-access-gate>` (`403` Player Access Restricted). Allows 1-click creation of their own DM campaign if they wish to DM. |

## Reusable Component Audit (`actionbuilder-studio/src/app/shared/ui`)
- `<lw-icon>`: Angular Material Icons (`MatIconModule`) wrapper with strict Zero-Emoji and Zero-Star/Sparkles enforcement.
- `<lw-button>`: `ng-primitives/button` (`NgpButton`) action primitive with `emerald`, `gold`, `secondary`, `ghost`, `danger`, `guide-pill`, and `guide-chip` variants.
- `<lw-badge>`: Status pill component (`gold`, `emerald`, `crimson`, `violet`, `cyan`, `neutral`).
- `<lw-panel>`: Framed surface container with header eyebrow, title, subtitle, and `panelActions` slot.
- `<lw-action-top-navbar>`: Top studio bar with DM-scoped campaign selector, role verification switcher, and primary `Apply to <Campaign>` CTA.
- `<lw-rule-catalog-sidebar>`: Searchable, filterable catalog of Core SRD and Campaign Modified rules (`Shield`, `Counterspell`, `Opportunity Attack`, `Concentration`, `Action Economy Budget`, `Diagonal Movement`, `Sneak Attack`, `Fivi's Tooth Slingshot`, `Chokrah Overchannel Surge`).
- `<lw-clause-sentence-editor>`: Interactive `When / If / Contains / Has / Has Not / Where / And / Or / With / Then / Else` clause editor with context-aware token suggestions and direct C#/TS class & method bindings (`CombatRuleInterpreter`, `MidiCombatAutomationService`, `CombatSessionStateService`, `CharacterCalculationEngine`).
- `<lw-rule-parameters-editor>`: Form for Action Cost, Range, Formula, AC Bonus, Save DC, Duration, and Level 1–20 Scaling Tiers.
- `<lw-rule-preview-inspector>`: Live Player Sheet vs. GM Engine View card and 1-click Combat Rule Test Runner (`POST /api/v2/actions/evaluate-logic`).
- `<lw-dm-access-gate>`: Role-enforced gate blocking players from viewing or editing another DM's campaign rules while offering a 1-click form to create their own DM campaign.
