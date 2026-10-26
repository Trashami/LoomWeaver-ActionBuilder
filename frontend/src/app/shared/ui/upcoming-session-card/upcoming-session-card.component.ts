import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { NgpCheckbox } from 'ng-primitives/checkbox';
import { NgpProgress, NgpProgressIndicator, NgpProgressTrack } from 'ng-primitives/progress';
import { DashboardPrepItemVm, DashboardUpcomingSessionVm } from '../../../core/models/dashboard.models';
import { ViewerRole } from '../../../core/models/loomweaver.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-upcoming-session-card',
  standalone: true,
  imports: [
    RouterLink,
    NgpButton,
    NgpCheckbox,
    NgpProgress,
    NgpProgressTrack,
    NgpProgressIndicator,
    LwIconComponent,
  ],
  templateUrl: './upcoming-session-card.component.html',
  styleUrl: './upcoming-session-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwUpcomingSessionCardComponent {
  readonly session = input.required<DashboardUpcomingSessionVm>();
  readonly viewerRole = input<ViewerRole>('gm');

  readonly prepItemToggled = output<string>();
  readonly addSessionRequested = output<void>();

  readonly progressPercent = computed(() => {
    const s = this.session();
    if (!s.totalPrepCount || s.totalPrepCount <= 0) return 0;
    return Math.round((s.completedPrepCount / s.totalPrepCount) * 100);
  });

  onToggleItem(item: DashboardPrepItemVm): void {
    if (this.viewerRole() !== 'gm') return;
    this.prepItemToggled.emit(item.id);
  }
}
