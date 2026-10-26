import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { CampaignSessionState } from '../../../core/models/dashboard.models';
import { ViewerRole } from '../../../core/models/loomweaver.models';
import { LwIconComponent } from '../icon/icon.component';

export interface LwResumeActionVm {
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'lw-campaign-resume-card',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent],
  templateUrl: './campaign-resume-card.component.html',
  styleUrl: './campaign-resume-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCampaignResumeCardComponent {
  readonly campaignName = input.required<string>();
  readonly narrativeSummary = input.required<string>();
  readonly actTitle = input.required<string>();
  readonly actSubtitle = input.required<string>();
  readonly sessionBadgeLabel = input.required<string>();
  readonly sessionBadgeSubtitle = input.required<string>();
  readonly lastActivityLabel = input.required<string>();
  readonly artworkUrl = input<string>('/landing-assets/features/feature-1-living-memory.jpg');
  readonly sessionState = input<CampaignSessionState>('live');
  readonly viewerRole = input<ViewerRole>('gm');

  readonly primaryActionTriggered = output<string>();
  readonly secondaryActionTriggered = output<string>();

  readonly primaryAction = computed<LwResumeActionVm>(() => {
    const state = this.sessionState();
    const isGm = this.viewerRole() === 'gm';

    if (state === 'live') {
      return {
        label: 'Resume Current Session',
        route: '/arcane-screen',
        icon: 'play',
      };
    }
    if (state === 'planned') {
      return {
        label: isGm ? 'Open Next Session Planning' : 'View Upcoming Session',
        route: '/campaigns',
        icon: 'play',
      };
    }
    if (state === 'completed_no_next') {
      return {
        label: isGm ? 'Plan Next Session' : 'View Latest Session Recap',
        route: isGm ? '/campaigns' : '/loom',
        icon: 'play',
      };
    }
    return {
      label: isGm ? 'Prepare First Session' : 'Campaign Welcome',
      route: '/campaigns',
      icon: 'play',
    };
  });

  readonly secondaryAction = computed<LwResumeActionVm>(() => {
    const state = this.sessionState();
    const isGm = this.viewerRole() === 'gm';

    if (state === 'live') {
      return {
        label: isGm ? 'Open Session Planning' : 'View Session Log',
        route: isGm ? '/campaigns' : '/loom',
        icon: 'file-text',
      };
    }
    if (state === 'planned') {
      return {
        label: isGm ? 'Open Arcane Screen VTT' : 'Review Party Chronicle',
        route: isGm ? '/arcane-screen' : '/loom',
        icon: 'file-text',
      };
    }
    return {
      label: 'Open Session Chronicle',
      route: '/loom',
      icon: 'file-text',
    };
  });
}
