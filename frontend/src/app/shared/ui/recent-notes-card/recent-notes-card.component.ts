import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { DashboardNoteItemVm } from '../../../core/models/dashboard.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-recent-notes-card',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent],
  templateUrl: './recent-notes-card.component.html',
  styleUrl: './recent-notes-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRecentNotesCardComponent {
  readonly notes = input.required<readonly DashboardNoteItemVm[]>();
  readonly addNoteRoute = input<string>('/loom');

  readonly noteSelected = output<DashboardNoteItemVm>();
}
