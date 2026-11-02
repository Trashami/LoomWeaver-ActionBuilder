import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpToolbar } from 'ng-primitives/toolbar';
import { CampaignSessionVm, CampaignVm, ViewerRole } from '../../../core/models/loomweaver.models';
import { LoomWeaverStoreService, LwExperienceMode } from '../../../core/services/loomweaver-store.service';
import { LwIconComponent } from '../icon/icon.component';
import { LwUserMenuComponent } from '../user-menu/user-menu.component';

@Component({
  selector: 'lw-app-header-bar',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgpButton,
    NgpInput,
    NgpToolbar,
    LwIconComponent,
    LwUserMenuComponent,
  ],
  templateUrl: './app-header-bar.component.html',
  styleUrl: './app-header-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAppHeaderBarComponent {
  readonly store = inject(LoomWeaverStoreService, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variant = input<'studio' | 'public'>('studio');
  readonly campaigns = input<readonly CampaignVm[]>([]);
  readonly activeCampaign = input<CampaignVm | null>(null);
  readonly activeCampaignId = input<number>(0);
  readonly viewerRole = input<ViewerRole>('gm');
  readonly isCampaignGm = input<boolean>(true);
  readonly audioPlaying = input<boolean>(false);
  readonly quickRollBanner = input<string>('1d20 Ready');
  readonly loomOpen = input<boolean>(false);
  readonly userDisplayName = input<string>('Dungeon Master');
  readonly userEmail = input<string>('gm@loom-weaver.com');
  readonly userTierCode = input<string>('weaver');
  readonly generativeAiEnabled = input<boolean>(false);
  readonly hideAiContent = input<boolean>(true);
  readonly experienceMode = input<LwExperienceMode>('advanced');
  readonly navCollapsed = input<boolean>(false);
  readonly collapseIcon = input<'apps' | 'menu'>('apps');

  // Component dimension properties (width/height + min/max)
  readonly width = input<string>('100%');
  readonly minWidth = input<string>('0');
  readonly maxWidth = input<string>('100%');
  readonly height = input<string>('auto');
  readonly minHeight = input<string>('62px');
  readonly maxHeight = input<string>('none');

  // Logo customization properties
  readonly logoSrc = input<string>('/landing-assets/brand/logo-wordmark.png');
  readonly logoAlt = input<string>('LoomWeaver Crest');
  readonly logoShowBorder = input<boolean>(false);
  readonly logoBorder = input<string>('none');
  readonly logoWidth = input<string>('136px');
  readonly logoMinWidth = input<string>('112px');
  readonly logoMaxWidth = input<string>('180px');
  readonly logoHeight = input<string>('42px');
  readonly logoMinHeight = input<string>('32px');
  readonly logoMaxHeight = input<string>('54px');

  readonly searchText = model<string>('');

  readonly navToggleRequested = output<void>();
  readonly campaignSelected = output<number>();
  readonly searchSubmitted = output<string>();
  readonly audioToggled = output<void>();
  readonly quickRollRequested = output<void>();
  readonly viewerRoleToggled = output<void>();
  readonly loomToggled = output<void>();
  readonly generativeAiToggled = output<boolean>();
  readonly hideAiContentToggled = output<boolean>();
  readonly experienceModeChanged = output<LwExperienceMode>();
  readonly syncProfileRequested = output<void>();
  readonly logoutRequested = output<void>();

  readonly campaignDropdownOpen = signal<boolean>(false);
  readonly sessionDropdownOpen = signal<boolean>(false);

  readonly resolvedCampaigns = computed<readonly CampaignVm[]>(() => {
    const inputList = this.campaigns();
    const storeList = this.store?.campaigns() ?? [];
    const list = inputList.length > 0 ? inputList : storeList;
    return list;
  });

  readonly resolvedSessions = computed<readonly CampaignSessionVm[]>(() => {
    return this.store?.sessions() ?? [];
  });

  toggleCampaignDropdown(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const next = !this.campaignDropdownOpen();
    this.sessionDropdownOpen.set(false);
    this.campaignDropdownOpen.set(next);
  }

  selectCampaignOption(campaignId: number, event: Event): void {
    event.stopPropagation();
    this.campaignDropdownOpen.set(false);
    this.campaignSelected.emit(campaignId);
    if (this.store && this.store.activeCampaignId() !== campaignId) {
      this.store.setCampaign(campaignId);
    }
  }

  toggleSessionDropdown(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const next = !this.sessionDropdownOpen();
    this.campaignDropdownOpen.set(false);
    this.sessionDropdownOpen.set(next);
  }

  selectSessionOption(sessionId: string, event: Event): void {
    event.stopPropagation();
    this.sessionDropdownOpen.set(false);
    this.store?.setActiveSession(sessionId);
  }

  navigateAndClose(route: string, event: MouseEvent): void {
    event.stopPropagation();
    this.campaignDropdownOpen.set(false);
    this.sessionDropdownOpen.set(false);
    void this.router?.navigateByUrl(route);
  }

  openAdventureGuideFromDropdown(scope: 'session' | 'adventure', event: MouseEvent): void {
    event.stopPropagation();
    this.sessionDropdownOpen.set(false);
    this.store?.openAdventureGuideModal(scope);
  }

  onSubmitSearch(): void {
    this.searchSubmitted.emit(this.searchText().trim());
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.campaignDropdownOpen.set(false);
      this.sessionDropdownOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.campaignDropdownOpen.set(false);
    this.sessionDropdownOpen.set(false);
  }
}
