import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwPanelComponent,
  LwStatRadarComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-statistics-page',
  standalone: true,
  imports: [RouterLink, LwPanelComponent, LwBadgeComponent, LwStatRadarComponent],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatisticsPageComponent {
  readonly store = inject(LoomWeaverStoreService);
}
