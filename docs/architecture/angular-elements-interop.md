# Optional Angular Elements / Browser Custom Elements

Use this document only if a LoomWeaver Angular UI component must be embedded outside the Angular application, for example a public creator-marketplace item widget or approved campaign sharing widget.

## Recommended implementation

1. Build and test the component normally as a standalone Angular component.
2. Expose stable typed inputs (`input` or compatible `@Input`) and outputs (`output` or compatible `@Output`).
3. Package a separate small entrypoint with `@angular/elements` and `createCustomElement`. Register a distinct public tag name such as `lw-marketplace-item` that is **not identical to the underlying Angular component selector**.
4. Verify runtime setup and dependency compatibility with the repo's installed Angular version. Keep Element bootstrapping separate from the normal Angular router bootstrap.
5. Avoid global side effects or injecting private session state. Server requests must use the public/authorized API.
6. Register the tag only once and avoid collisions with other applications on the page.

## Illustrative registration (adapt bootstrap/injector to installed Angular)

```ts
import { createCustomElement } from '@angular/elements';
import { Injector } from '@angular/core';
import { MarketplaceItemComponent } from './marketplace-item.component';

export function registerMarketplaceElement(injector: Injector): void {
  const tagName = 'lw-marketplace-item';
  if (!customElements.get(tagName)) {
    customElements.define(tagName, createCustomElement(MarketplaceItemComponent, { injector }));
  }
}
```

`MarketplaceItemComponent` should have a different Angular selector, for instance `lw-marketplace-item-view`.

## DOM API examples

```ts
const element = document.createElement('lw-marketplace-item');
// Object input: set DOM property, not JSON as an HTML attribute.
(element as any).item = authorizedItemData;
element.addEventListener('purchaseRequested', (event) => {
  const id = (event as CustomEvent<string>).detail;
  // Ask the authenticated backend to initiate the purchase flow.
});
document.body.append(element);
```

The actual Custom Event name is determined by your declared component output/alias; test it rather than assuming one. For primitive inputs, an Angular Element typically maps camelCase inputs to dash-case HTML attributes. Non-string types and property updates deserve an interoperability test.

## Styling

- Decide and document `ViewEncapsulation.ShadowDom` vs `Emulated` for the embedded package. Shadow DOM isolates styles but changes content projection and event behavior.
- Make fonts, color variables, focus states and icon assets available independently from the main LoomWeaver application.
- Provide supported theming hooks such as `--lw-color-accent`, not arbitrary mutation of internal markup.
- Don't inject campaign secrets into a public embed, even if the UI visually hides them.

## Reference

https://angular.dev/guide/elements
