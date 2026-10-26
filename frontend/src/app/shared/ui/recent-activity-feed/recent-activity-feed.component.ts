import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { DashboardActivityItemVm } from '../../../core/models/dashboard.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-recent-activity-feed',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent],
  templateUrl: './recent-activity-feed.component.html',
  styleUrl: './recent-activity-feed.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRecentActivityFeedComponent {
  readonly items = input.required<readonly DashboardActivityItemVm[]>();
  readonly viewAllRoute = input<string>('/loom');

  readonly activitySelected = output<DashboardActivityItemVm>();

  iconForType(entityType: string): string {
    const normalized = entityType.toLowerCase();
    if (normalized.includes('npc')) return 'user';
    if (normalized.includes('map') || normalized.includes('scene')) return 'map';
    if (normalized.includes('encounter')) return 'swords';
    if (normalized.includes('note') || normalized.includes('clue')) return 'file-text';
    if (normalized.includes('character')) return 'users';
    return 'book-open';
  }

  toneForType(entityType: string): string {
    const normalized = entityType.toLowerCase();
    if (normalized.includes('encounter')) return 'crimson';
    if (normalized.includes('map') || normalized.includes('note')) return 'gold';
    if (normalized.includes('character')) return 'cyan';
    return 'emerald';
  }
}
