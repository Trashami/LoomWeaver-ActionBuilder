# Angular Component APIs, Styling & Instantiation Standards

**Mandatory companion to:** `docs/architecture/component-system.md` and `docs/standards/angular.md`.

## Rules for an AI coding agent

1. **Search existing components first**. Do not create a second implementation of a card, panel, dialog, list item, inspector, chart, editor tool, or selection widget when an existing component can be extended without overcoupling.
2. Create or update a **standalone Angular component** for each distinct reusable UI element. Split its class, template and styles into separate files. Co-locate spec/tests and model/config types.
3. Instantiate through public **typed signal inputs**, optional `model()` and semantic `output()` events. If the installed Angular version doesn't support a requested API, follow the existing project's compatible pattern rather than forcing an upgrade.
4. **Keep customization inside the component**: visual variants, sizes, icons, density, label placement, actions, empty/loading states, and responsive behavior live in its code and styles, selected by inputs.
5. **Route components only compose and bind**. They may arrange components with CSS grid/flex and load data, but must not override nested CSS or implement the child's business/display behavior.
6. Use design tokens for colors, typography and sizing. Treat component CSS custom properties as intentional APIs and document them.
7. Scope CSS. Avoid `ViewEncapsulation.None` for ordinary components, `::ng-deep`, globally targeting component internals, and inline template styles that implement substantial design logic.
8. Use `ChangeDetectionStrategy.OnPush` and signals where compatible. Component outputs are user intents; data persistence, permission enforcement and domain rules are handled elsewhere.
9. Avoid excessive inputs; after about 7–10 unrelated configuration options, examine whether you're mixing two responsibilities or should use an immutable typed config object.
10. No UI-only role flag provides authorization. Bind the component only to role-filtered DTOs supplied by an authorized API.
11. Every component API must work with **two different simultaneous instances** and distinct bindings. Confirm cleanup works when one instance unmounts.
12. **Use browser Web Components only for integration across framework boundaries**; Angular components already offer reusable instances natively.

## Layout responsibilities

| Responsible part | Owns |
|---|---|
| Shared theme | Color, type, spacing, elevation, focus indicators, motion tokens |
| Reusable component | Its own internal markup, events, visual states, responsiveness and CSS |
| Composite component | Composition/relative layout of its child components |
| Route page | Feature layout, data loading, subscriptions, feature-level state and routing |
| API/domain | Permissions, persistence, validation, authoritative logic |

## Recommended file layout

```text
frontend/src/app/
  shared/ui/
    asset-card/
      asset-card.component.ts
      asset-card.component.html
      asset-card.component.scss
      asset-card.config.ts
      asset-card.component.spec.ts
      README.md
  features/marketplace/
    marketplace.page.ts
    marketplace.page.html
    marketplace.page.scss
  integrations/elements/
    register-elements.ts       # create only if non-Angular embedding is required
  styles/
    _loomweaver-tokens.scss
```

Feature-specific components should stay in their feature until a genuine second consumer appears; when shared, promote deliberately with an explicit API and migration tests.

## Example typed API

```ts
export type AssetCardVariant = 'compact' | 'standard' | 'detailed';
export type AssetCardTone = 'default' | 'featured';

export interface AssetCardConfig {
  readonly variant: AssetCardVariant;
  readonly tone?: AssetCardTone;
  readonly showOwner?: boolean;
  readonly showPrice?: boolean;
  readonly showPreview?: boolean;
}

export interface AssetCardVm {
  readonly id: string;
  readonly title: string;
  readonly previewUrl: string | null; // already authorized or public teaser URL
  readonly entitlement: 'free' | 'included' | 'purchased' | 'locked';
  readonly displayPrice?: string;
}
```

Prefer allowing the component to derive UI labels/buttons from the typed model and config rather than pushing pre-built HTML from pages. A `locked` asset has only a public/authorized preview, never a secret or unlicensed original URL.

## Example multiple instantiations

```html
<!-- No per-page styling of internals -->
<lw-asset-card [asset]="selectedMapAsset" [config]="mapEditorConfig"
  (previewRequested)="preview($event)"
  (purchaseRequested)="beginPurchase($event)" />

<lw-asset-card [asset]="selectedDiceAsset" [config]="diceForgeConfig"
  (previewRequested)="preview($event)"
  (purchaseRequested)="beginPurchase($event)" />
```

## QA scenarios required

- Default, compact and detailed variants with both long and short names.
- Two instances of the same component with different props render correctly simultaneously.
- Runtime change to input updates that instance only; no shared-state bleed.
- Disabled/loading/empty/error state, selected/focus/hover and reduced motion.
- Keyboard and screen reader interaction; mobile, desktop, zoom, high contrast.
- Public locked asset preview vs owned asset behavior; no restricted URLs in HTML or JavaScript objects.
- Integration of outputs with the parent without bypassing server authorization.
- No route-level CSS selectors depending on child component's internal class names.
- If exported as Angular Element: embedding in plain HTML page, property changes, CustomEvent.detail, theme variables and teardown.

## Security caveat

Custom elements and encapsulated CSS are **not security boundaries**. Authorization is always performed before sending content to the browser.
