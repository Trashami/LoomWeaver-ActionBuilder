import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

export interface LwCreatorModuleItem {
  readonly id: string;
  readonly title: string;
  readonly creatorHandle: string;
  readonly category: string;
  readonly priceUsd: number;
  readonly creatorShareUsd: number;
  readonly platformShareUsd: number;
  readonly royaltySplitLabel: string;
  readonly popularityImports: number;
  readonly rating: number;
  readonly summary: string;
  readonly includedItems: readonly string[];
  readonly installed: boolean;
}

@Component({
  selector: 'lw-creator-module-card',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent],
  templateUrl: './creator-module-card.component.html',
  styleUrl: './creator-module-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCreatorModuleCardComponent {
  readonly module = input.required<LwCreatorModuleItem>();
  readonly importRequested = output<string>();
}
