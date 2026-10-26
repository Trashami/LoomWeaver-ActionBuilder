import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export interface LwSessionDeepLink {
  readonly label: string;
  readonly route: string;
  readonly entityKey: string;
}

export interface LwSessionRecapItem {
  readonly id: string;
  readonly campaignId: number;
  readonly sessionNumber: number;
  readonly title: string;
  readonly locationName: string;
  readonly dateLabel: string;
  readonly xpAwarded: number;
  readonly summary: string;
  readonly highlights: readonly string[];
  readonly deepLinks: readonly LwSessionDeepLink[];
}

@Component({
  selector: 'lw-session-recap-card',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwIconComponent],
  templateUrl: './session-recap-card.component.html',
  styleUrl: './session-recap-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwSessionRecapCardComponent {
  readonly session = input.required<LwSessionRecapItem>();
  readonly inspectEntityRequested = output<string>();
}
