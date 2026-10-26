import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActionStudioAccountOption,
  DmCampaignOption,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-action-top-navbar',
  standalone: true,
  imports: [FormsModule, LwIconComponent, LwButtonComponent, LwBadgeComponent],
  templateUrl: './action-top-navbar.component.html',
  styleUrl: './action-top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwActionTopNavbarComponent {
  readonly dmCampaigns = input<DmCampaignOption[]>([]);
  readonly activeCampaign = input<DmCampaignOption | null>(null);
  readonly canAccess = input<boolean>(true);
  readonly currentUsername = input<string>('GeoJason');
  readonly currentDisplayName = input<string>('Jason (GeoJason)');
  readonly demoAccounts = input<ActionStudioAccountOption[]>([]);
  readonly selectedAccountId = input<string>('acc-gm-geojason');
  readonly saving = input<boolean>(false);
  readonly hasUnsavedChanges = input<boolean>(false);

  readonly campaignSelected = output<number>();
  readonly accountSwitched = output<string>();
  readonly createNewRule = output<void>();
  readonly resetCurrentRule = output<void>();
  readonly applyToCampaign = output<void>();

  onCampaignChange(rawValue: string): void {
    const id = Number(rawValue);
    if (!Number.isNaN(id) && id > 0) {
      this.campaignSelected.emit(id);
    }
  }

  onAccountChange(accountId: string): void {
    if (accountId) {
      this.accountSwitched.emit(accountId);
    }
  }
}
