import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TablePresenceSeatVm,
  TableRealtimeEventVm,
} from '../../../core/services/table-realtime-sync.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-live-table-presence',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './live-table-presence.component.html',
  styleUrl: './live-table-presence.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwLiveTablePresenceComponent {
  readonly seats = input.required<readonly TablePresenceSeatVm[]>();
  readonly events = input.required<readonly TableRealtimeEventVm[]>();
  readonly protocolLabel = input<string>('SignalR /hubs/table + BroadcastChannel Active');
  readonly broadcastPingRequested = output<void>();
}
