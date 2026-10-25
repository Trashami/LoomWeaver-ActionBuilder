# LoomWeaver Component System — Reuse by Configuration

> **Mandatory:** Every repeatable UI element is implemented once as a reusable Angular component and instantiated through a documented, typed public API. The page is a composer, not an alternate implementation of a card, control, inspector, modal, or tool.

## Interpret “Web Component” correctly

- **Inside the Angular application:** create **standalone Angular components** (`@Component`) and render each instance in Angular templates. These are reusable component instances, but are *not* browser Custom Elements by default.
- **For external embedding** (third-party websites, marketplace widgets, host pages using other frameworks): optionally package eligible Angular components as **Angular Elements / browser Custom Elements** using `@angular/elements` and `createCustomElement`.
- Do **not** wrap every internal Angular component in a Custom Element. The wrapper adds lifecycle, packaging, injection and runtime concerns with no benefit inside one Angular application.
- Every feature screen is assembled from components that own **their own markup, styles, documented Inputs/Outputs**, and scoped private behavior. The page may arrange them and bind configuration but may not reach into their DOM to alter their internals.
- Exception: a truly single-purpose feature shell may be one component; do not invent abstractions for a decorative span rendered once.

## Component taxonomy

1. **Design primitives** (`lw-button`, `lw-panel`, `lw-tabs`, `lw-dialog`, `lw-badge`, `lw-empty-state`): shared visual language and accessibility. Keep them domain-neutral.
2. **Domain presentation** (`lw-npc-card`, `lw-item-card`, `lw-quest-card`, `lw-stat-chart`, `lw-asset-card`, `lw-encounter-roster`): take **pre-authorized view models**, emit user intents, and never fetch sensitive data autonomously.
3. **Feature composites** (`lw-asset-browser`, `lw-campaign-inspector`, `lw-level-up-editor`, `lw-map-toolbox`, `lw-graph-explorer`): compose primitives and domain components with typed configuration.
4. **Smart/route containers**: load authorized DTOs, resolve errors and state, coordinate feature stores and pass bindings to children. **No copied UI implementations**.
5. **Renderer adapters**: Angular `lw-scene-canvas` wraps the Babylon renderer and handles lifecycle. Rendering/physics live in rendering engine classes, not the template component.
6. **True browser Custom Elements**: optional adapters around tested Angular components for non-Angular consumers. Provide separate docs for supported properties, attributes, events, styling and setup.

## Public contract for every reused component

Document the following in a small adjacent `README.md` or component API docs:

| Part | Requirement |
|---|---|
| Selector | `lw-` prefix; stable, specific, unique |
| Inputs | `input()` / `input.required()` with typed view models; sensible defaults for optional values |
| Editable value | `model()` only for genuine bidirectional UI state |
| Outputs | `output()` with semantic intent payloads: `selected`, `editRequested`, `removed`, `valueChanged` |
| Variants | Named design variants (`compact`, `standard`, `detailed`) instead of page-specific CSS hacks |
| Styling | Component-owned SCSS/CSS, shared design tokens, optional documented CSS custom properties |
| Slots | Use content projection (`ng-content`) only for real composition slots, not as a bypass for a weak API |
| Loading/error/empty | Defined behavior; avoid temporary broken layouts |
| Permissions | Only authorized DTOs; events express intent and are reauthorized by server |
| Accessibility | Semantics, label, focus, keyboard, reduced motion; control host metadata |
| Performance | OnPush, signals, stable tracking, virtualization where appropriate; clean up subscriptions/listeners |
| Tests | At least two distinct instances, optional/default inputs, output payloads, variant styles, keyboard behavior |

## Configurations, not forks

**Correct**: One `lw-asset-card` for all screens, instantiated with different inputs:

```html
<lw-asset-card
  [asset]="asset"
  [config]="marketplaceConfig"
  (previewRequested)="previewAsset($event)"
  (purchaseRequested)="purchaseAsset($event)" />
```

A map editor uses the same component with `editorConfig`; a Dice Forge screen uses `diceConfig`. The component itself determines the owned layout, style and affordances from its configuration and authorized asset model.

**Wrong**: A `MarketplaceAssetCard`, `MapAssetCard`, and `DiceAssetCard` copied with small changes; or page SCSS like `.marketplace-page lw-asset-card .internal-button { ... }` to override internals.

- Prefer a **small, typed configuration object** to a dozen tangled `@Input` booleans. Name mutually exclusive variants explicitly.
- Keep **behavior inputs** separate from **appearance inputs**. Do not pass arbitrary HTML strings, CSS selectors, code, or database queries.
- `readonly` inputs and `output` events should avoid child mutation of parent-owned models.
- Use `TrackBy`/`@for (...; track ...)` when rendering many instances; stable identity is essential for maps and real-time state.
- Do not make components secretly depend on which route/page instantiated them. An explicit `context`/`displayMode` input is preferable when behavior truly differs.

## State ownership

- A visual instance owns local transient UI state (expanded, selected tab, hover).
- A page/feature store owns cross-component UI state (selected NPC, filters, current map edit command).
- A campaign store owns explicitly shared, identity-scoped state; **never** leak campaign/user state between component instances through accidental singleton services.
- The server owns permissions, published knowledge, market entitlements, dice outcomes, combat and durable state.
- A component's `isGM`, `isSecret`, `isPremium` inputs can influence presentation only; they cannot authorize disclosure or downloads.

## Styling and theming

- Define the canonical palette, typography, spacing, surface and border tokens in shared theme CSS, e.g. `--lw-color-bg`, `--lw-color-surface`, `--lw-color-gold`, `--lw-color-emerald`, `--lw-radius-md`.
- Each component owns its `.scss`/`.css`, uses `:host` and documented variants/host classes. Use `ViewEncapsulation.Emulated` normally; choose `ShadowDom` for isolated embedded Custom Elements when tested.
- **Allowed overrides:** typed `variant`, `density`, `tone`, `size`, CSS custom properties or documented style hooks. Do not reach into child internals using `::ng-deep`, brittle descendants or random inline styles.
- Page SCSS defines **layout and spacing between instances**, never the inner appearance/behavior of a child component.
- Theme dark/contrast/responsive behavior should be tested once in the reusable component and consumed consistently across pages.

## Dynamic UI and content-driven instantiation

Use an allowlisted, typed registry for content-driven widgets (for example entity kind -> component), with a discriminated input model. For Angular-owned dynamic children, use Angular's programmatic component rendering / `NgComponentOutlet` as appropriate. Do **not** accept arbitrary component names, script URLs or HTML from an imported adventure or marketplace package.

```text
content type -> allowlisted component type -> authorized DTO -> typed inputs -> semantic outputs
```

For 3D assets, the Angular `AssetCard` is reusable UI, while the renderer creates multiple Babylon mesh instances. A GLB mesh instance is **not** an Angular Web Component.

## Angular Elements interoperability boundary

- Register a distinct custom-element tag such as `<lw-public-character-card>`; do not register the same selector as the underlying Angular component (to avoid double-instantiation/conflicts).
- Verify installed Angular version, compiler options and `@angular/elements` package compatibility before use.
- Map component inputs to Custom Element attributes for primitive data; set structured objects as **DOM properties**, not serialized object strings in HTML attributes.
- Outputs become browser `CustomEvent`s; the consumer reads `.detail`. Document event names and payloads.
- Give the custom element isolated CSS and access to necessary theme variables/fonts; test without the Angular parent app.
- Never accept a caller-provided `isGM=true` or untrusted campaign ID as authorization.
- Prefer exporting a small curated widget library; don't ship the entire private campaign app as one custom element bundle.

## Review gate for every new component

Before creating a new component, the agent must answer:

1. Does an existing component already meet this need with additional typed properties?
2. Is this a primitive, domain view, feature composite, route container or external Custom Element adapter?
3. What are the public inputs, outputs, variants, default values and accessibility requirements?
4. Can two instances coexist independently and render different data/appearance without page-specific CSS or duplicate logic?
5. Does any sensitive data arrive at the client before server authorization?
6. What tests and stories prove reusability and no visual regression?

## References

- Angular Custom Elements: https://angular.dev/guide/elements
- Angular Inputs/Models: https://angular.dev/guide/components/inputs
- Angular Styling and encapsulation: https://angular.dev/guide/components/styling
- Angular programmatic components: https://angular.dev/guide/components/programmatic-rendering
