import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import {
  LoreEntryVm,
  WorldLoreWorkspaceVm,
  WorldMapMarkerVm,
} from '../../../core/models/world-lore.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-world-overview',
  standalone: true,
  imports: [NgpButton, LwBadgeComponent, LwIconComponent],
  templateUrl: './world-overview.component.html',
  styleUrl: './world-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorldOverviewComponent {
  readonly workspace = input.required<WorldLoreWorkspaceVm>();
  readonly selectedLore = input<LoreEntryVm | null>(null);

  readonly locationSelected = output<string>();
  readonly loreCleared = output<void>();
}
