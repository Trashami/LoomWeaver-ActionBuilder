import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpProgress, NgpProgressIndicator, NgpProgressTrack } from 'ng-primitives/progress';
import { LwIconComponent } from '../icon/icon.component';

export interface LwPartyMemberStatusVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly classAndAncestry: string;
  readonly hpCurrent: number;
  readonly hpMax: number;
  readonly resourceLabel?: string;
  readonly ac: number;
  readonly online: boolean;
  readonly avatarInitials: string;
  readonly ringColor?: string;
  readonly levelUpEligible?: boolean;
  readonly routeLink?: string;
}

@Component({
  selector: 'lw-party-roster-card',
  standalone: true,
  imports: [
    NgpButton,
    NgpAvatar,
    NgpAvatarFallback,
    NgpProgress,
    NgpProgressTrack,
    NgpProgressIndicator,
    LwIconComponent,
  ],
  templateUrl: './party-roster-card.component.html',
  styleUrl: './party-roster-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwPartyRosterCardComponent {
  readonly members = input.required<readonly LwPartyMemberStatusVm[]>();
  readonly selectedKey = input<string>('');
  readonly title = input<string>('PARTY SNAPSHOT');
  readonly healthTitle = input<string>('All party members are healthy');
  readonly healthSubtitle = input<string>('No critical conditions or exhaustion.');

  readonly memberSelected = output<LwPartyMemberStatusVm>();
  readonly addMemberRequested = output<void>();

  hpPercent(member: LwPartyMemberStatusVm): number {
    if (!member.hpMax || member.hpMax <= 0) return 100;
    return Math.max(8, Math.min(100, Math.round((member.hpCurrent / member.hpMax) * 100)));
  }
}
