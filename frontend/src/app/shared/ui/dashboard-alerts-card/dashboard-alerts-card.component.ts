import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { DashboardAlertItemVm } from '../../../core/models/dashboard.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-dashboard-alerts-card',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent],
  templateUrl: './dashboard-alerts-card.component.html',
  styleUrl: './dashboard-alerts-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDashboardAlertsCardComponent {
  readonly alerts = input.required<readonly DashboardAlertItemVm[]>();
  readonly addAlertRoute = input<string>('/campaigns');

  readonly alertSelected = output<DashboardAlertItemVm>();

  iconForCategory(category: DashboardAlertItemVm['category']): string {
    switch (category) {
      case 'level-up':
        return 'arrow-up';
      case 'invite':
        return 'users';
      case 'reminder':
        return 'alert-circle';
      case 'asset':
      default:
        return 'check';
    }
  }
}
