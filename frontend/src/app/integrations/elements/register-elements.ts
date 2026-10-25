import { Injector } from '@angular/core';
import { LwAssetCardComponent } from '../../shared/ui/asset-card/asset-card.component';
import { LwStatRadarComponent } from '../../shared/ui/stat-radar/stat-radar.component';

/**
 * Optional Angular Elements interop boundary per docs/architecture/angular-elements-interop.md.
 * Registers curated LoomWeaver components as Custom Elements ONLY for external embeds or canvas overlays.
 */
export interface CustomElementDescriptor {
  readonly tagName: string;
  readonly component: unknown;
}

export const LOOMWEAVER_EMBEDDABLE_ELEMENTS: readonly CustomElementDescriptor[] = [
  { tagName: 'lw-embed-asset-card', component: LwAssetCardComponent },
  { tagName: 'lw-embed-stat-radar', component: LwStatRadarComponent },
];

export function describeRegisteredElements(_injector?: Injector): readonly CustomElementDescriptor[] {
  return LOOMWEAVER_EMBEDDABLE_ELEMENTS;
}
