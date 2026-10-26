import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwPanelComponent } from '../panel/panel.component';

@Component({
  selector: 'lw-dm-access-gate',
  standalone: true,
  imports: [FormsModule, LwPanelComponent, LwButtonComponent, LwBadgeComponent, LwIconComponent],
  templateUrl: './dm-access-gate.component.html',
  styleUrl: './dm-access-gate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwDmAccessGateComponent {
  readonly displayName = input<string>('Player');
  readonly accessDeniedReason = input<string>(
    'Players in a campaign cannot view or modify that campaign\'s ActionBuilder rules unless they have their own DM campaign.'
  );
  readonly playerOnlyCampaigns = input<string[]>(['Shadow of the Mountain (DM: GeoJason)']);
  readonly creatingCampaign = input<boolean>(false);

  readonly newCampaignName = model<string>('My Homebrew Campaign');
  readonly newCampaignRuleset = model<string>('D&D 5e (2024 + Campaign Rules)');

  readonly createOwnCampaign = output<{ name: string; rulesetLabel: string }>();
  readonly switchToPrimaryDm = output<void>();

  submitCreateCampaign(): void {
    const cleanName = (this.newCampaignName() || '').trim() || 'My Homebrew Campaign';
    const cleanRuleset = (this.newCampaignRuleset() || '').trim() || 'D&D 5e (2024 + Campaign Rules)';
    this.createOwnCampaign.emit({ name: cleanName, rulesetLabel: cleanRuleset });
  }
}
