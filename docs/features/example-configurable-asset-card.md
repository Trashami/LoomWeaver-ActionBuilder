# Feature Example: One Asset Card, Many Instances

**Status:** Instructional sample (not production app code)

## User story

As a GM or player, I can see the same LoomWeaver asset card across marketplace, map editor and Dice Forge, with its layout/actions driven by inputs rather than duplicated markup or page overrides.

## Requirements

- The `AssetCard` owns its image/empty image, label, entitlement indicator, preview action and buy intent.
- `AssetCardConfig` selects `compact | standard | detailed`, optional price and preview affordance.
- A parent binds an already-authorized `AssetCardVm` and listens to semantic events.
- A locked asset shows only a permissible teaser; it never downloads the paid GLB or GM-only asset.
- Every card is independently focusable and supports keyboard interaction.
- Component stylesheet owns internal styling; parent pages style only cards' arrangement.

## Files

```text
shared/ui/asset-card/
  asset-card.config.ts
  asset-card.component.ts
  asset-card.component.html
  asset-card.component.scss
  asset-card.component.spec.ts
  README.md
```

## Example Angular implementation

`asset-card.config.ts`:

```ts
export type AssetCardVariant = 'compact' | 'standard' | 'detailed';

export interface AssetCardConfig {
  readonly variant: AssetCardVariant;
  readonly showPrice?: boolean;
}

export interface AssetCardVm {
  readonly id: string;
  readonly name: string;
  readonly previewUrl: string | null;
  readonly entitlement: 'free' | 'included' | 'purchased' | 'locked';
  readonly priceLabel?: string;
}
```

`asset-card.component.ts`:

```ts
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AssetCardConfig, AssetCardVm } from './asset-card.config';

@Component({
  selector: 'lw-asset-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-card.component.html',
  styleUrl: './asset-card.component.scss',
})
export class AssetCardComponent {
  readonly asset = input.required<AssetCardVm>();
  readonly config = input<AssetCardConfig>({ variant: 'standard' });

  readonly previewRequested = output<string>();
  readonly purchaseRequested = output<string>();
}
```

`asset-card.component.html`:

```html
<article class="card" [class.card--compact]="config().variant === 'compact'"
  [class.card--detailed]="config().variant === 'detailed'">
  @if (asset().previewUrl; as imageUrl) {
    <img [src]="imageUrl" [alt]="asset().name" loading="lazy" />
  } @else {
    <div class="placeholder" aria-hidden="true">✦</div>
  }
  <div class="details">
    <h3>{{ asset().name }}</h3>
    <span class="entitlement">{{ asset().entitlement }}</span>
    @if (config().showPrice && asset().priceLabel) {
      <span class="price">{{ asset().priceLabel }}</span>
    }
    <div class="actions">
      <button type="button" (click)="previewRequested.emit(asset().id)">Preview</button>
      @if (asset().entitlement === 'locked') {
        <button type="button" (click)="purchaseRequested.emit(asset().id)">Unlock</button>
      }
    </div>
  </div>
</article>
```

`asset-card.component.scss`:

```scss
:host { display: block; min-width: 0; }
.card {
  color: var(--lw-color-text, #e8eee8);
  background: var(--lw-color-surface, #0d211b);
  border: 1px solid var(--lw-color-border, #365f4b);
  border-radius: var(--lw-radius-md, 8px);
  padding: var(--lw-space-card, 12px);
  display: grid;
  gap: 8px;
}
.card img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.card h3 { font: 600 1rem/1.3 Georgia, serif; margin: 0; }
.card--compact { grid-template-columns: 64px 1fr; align-items: center; }
.card--compact img { width: 64px; height: 64px; }
.card--detailed { padding: 18px; gap: 14px; }
.actions { display: flex; gap: 8px; }
.actions button { border: 1px solid var(--lw-color-emerald, #55c993); }
:host(:focus-within) { outline: 2px solid var(--lw-color-focus, #7ddebd); }
```

Page usage:

```html
<section class="asset-grid">
  @for (item of authorizedAssets(); track item.id) {
    <lw-asset-card
      [asset]="item"
      [config]="cardConfig"
      (previewRequested)="onPreview($event)"
      (purchaseRequested)="onPurchase($event)" />
  }
</section>
```

Only `.asset-grid` layout may be customized by the page. Do not write page CSS targeting `.card`, `.actions`, or `.price` inside `<lw-asset-card>`.

## Acceptance tests

- Render two cards simultaneously, one free and one locked, with different variants and titles.
- Change inputs and verify card markup changes without recreating a page-specific implementation.
- Confirm preview and purchase outputs emit the correct asset ID.
- No unrevealed GM or unlicensed original URL appears in player DTOs or network responses.
- Keyboard accessibility and component-scoped styles verified.
