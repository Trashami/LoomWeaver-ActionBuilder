import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  ActionStudioAccountOption,
  DmCampaignOption,
} from '../../../core/models/action-studio.models';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-action-top-navbar',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent, LwButtonComponent],
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
  readonly activeCategory = input<string>('All');
  readonly totalRuleCount = input<number>(0);
  readonly searchQuery = model<string>('');

  readonly campaignSelected = output<number>();
  readonly accountSwitched = output<string>();
  readonly categorySelected = output<string>();
  readonly createNewRule = output<void>();
  readonly exportRuleJson = output<void>();
  readonly openEncounterRunner = output<void>();

  readonly appSwitcherOpen = signal<boolean>(false);
  readonly accountMenuOpen = signal<boolean>(false);
  readonly devRoleDrawerOpen = signal<boolean>(false);

  readonly categories: string[] = [
    'All',
    'Actions',
    'Spells',
    'Conditions',
    'Class Features',
    'Campaign Custom',
  ];

  readonly initials = computed(() => {
    const name = this.currentUsername() || 'DM';
    return name.slice(0, 2).toUpperCase();
  });

  readonly headerDisplayName = computed(() => {
    const raw = this.currentDisplayName() || this.currentUsername();
    if (raw.includes('·')) {
      const beforeDot = raw.split('·')[0].trim();
      return beforeDot.endsWith(')') ? beforeDot : `${beforeDot})`;
    }
    return raw;
  });

  onCampaignChange(rawValue: string | number): void {
    const id = Number(rawValue);
    if (!Number.isNaN(id) && id > 0) {
      this.campaignSelected.emit(id);
    }
  }

  onAccountChange(accountId: string): void {
    if (accountId) {
      this.accountSwitched.emit(accountId);
      this.accountMenuOpen.set(false);
    }
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((v) => !v);
    this.appSwitcherOpen.set(false);
  }

  toggleAppSwitcher(): void {
    this.appSwitcherOpen.update((v) => !v);
    this.accountMenuOpen.set(false);
  }
}
