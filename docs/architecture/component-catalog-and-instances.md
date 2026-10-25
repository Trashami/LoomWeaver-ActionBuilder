# Configurable Component Catalog and Instantiation Policy

> This catalog is a **planned set of reusable contracts**, not an inventory of implemented components. Discover actual code first.

## Always configure, never fork

**An Angular page owns composition and placement; a reusable component owns its markup, styles, interaction states and documented visual variants.**

Build one standalone Angular component per reusable **UI concern**, not one Custom Element per data object or per insertion on a page. If a map contains 2,000 grass models, Babylon.js creates asset instances; Angular must not create 2,000 Web Components for grass.

| Suggested component | Key inputs | Outputs | Possible consumers |
| --- | --- | --- | --- |
| `lw-asset-card` | `asset`, `config`, `entitlement` | `previewRequested`, `purchaseRequested` | Marketplace, Dice Forge, Map asset panel |
| `lw-npc-card` | authorized `npc`, `variant`, `actions` | `selected`, `editRequested` | NPC directory, Story, Arcane Screen |
| `lw-creature-card` | authorized `creature`, `mode` | `selected`, `spawnRequested` | Creature library, Encounter editor |
| `lw-quest-card` | `quest`, `variant` | `selected` | Quests, Campaign overview |
| `lw-encounter-card` | `encounter`, `config` | `selected`, `startRequested` | Encounters, Arcane Screen |
| `lw-stat-radar` | `axes`, `values`, `scale` | `pointSelected` | Character stats, Party analytics |
| `lw-loom-launcher` | authorized `screenContext`, `state` | `opened`, `closed` | Global header on every page |
| `lw-map-tool-panel` | selected tool, config, permitted controls | `toolChanged`, `commandRequested` | 2D and 3D editors |
| `lw-asset-picker` | collection, filters, entitlements | `assetSelected` | Scatter brush, Dice Forge, Character creator |
| `lw-rules-option-selector` | system, options, current value | `selectionChanged` | GM rules settings, character creation |

## UI and contracts

- Prefer `input()` and `output()` for typed Angular bindings; use `model()` only for a true editable value contract.
- A `config` interface should define meaningful, documented variants such as `compact | standard | detailed`, visible actions, size/density, and defaults. Avoid a giant configuration object with unbounded arbitrary CSS.
- Keep TS/HTML/SCSS/tests in separate colocated files; use shared design tokens, component-scoped styles and responsive layout.
- A page must not override a child component's internal CSS or use `::ng-deep` to change behavior.
- A component accepts **only authorized view models** from the page's data-access layer. `isGM` and `isPremium` are display hints, never permission grants.
- Components own loading, empty, error, keyboard accessibility and reduced-motion handling.
- Multiple instances must remain independent; share only intentional feature state scoped by campaign/user.

## Example instantiations

```html
<lw-npc-card [npc]="malric()" [config]="compactNpc" (selected)="selectNpc($event)" />
<lw-npc-card [npc]="scribe()" [config]="detailedNpc" (selected)="selectNpc($event)" />
```

The two instances reuse the same implementation. The page's SCSS may position the elements inside a grid; it must not set inner `.portrait`, `.actions` or `.card` styles.

## Actual browser Custom Elements are an interoperability tool

Within the Angular app, use standalone Angular components. For external embedding (websites, other apps, sanctioned partner widgets), create a separately bundled Angular Element with `@angular/elements`, a distinct custom element tag, documented attribute/property/event contract, self-contained styles and permission-safe API. Do **not** publish an internal GM feature merely by wrapping it as a Custom Element.

## Review checklist

- [ ] Existing matching component inspected and reused when suitable.
- [ ] Component has one responsibility and documented inputs/outputs/defaults.
- [ ] All reusable styling lives in component CSS/SCSS; page controls only layout.
- [ ] Two concurrent instances render distinct data/variants correctly.
- [ ] Test keyboard navigation, mobile/desktop sizes, loading/error states and reduced motion.
- [ ] Unauthorized player inputs cannot trigger server-approved privileged actions.
- [ ] Dynamic component registry is allowlisted: imported JSON may not name arbitrary executable UI classes.
