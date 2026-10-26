import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpSwitch, NgpSwitchThumb } from 'ng-primitives/switch';
import { ViewerRole } from '../../../core/models/loomweaver.models';
import { LwExperienceMode } from '../../../core/services/loomweaver-store.service';
import { LwIconComponent } from '../icon/icon.component';
import { LwScrollAreaComponent } from '../scroll-area/scroll-area.component';

@Component({
  selector: 'lw-user-menu',
  standalone: true,
  imports: [
    NgpButton,
    NgpAvatar,
    NgpAvatarFallback,
    NgpSwitch,
    NgpSwitchThumb,
    LwIconComponent,
    LwScrollAreaComponent,
  ],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwUserMenuComponent {
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly userDisplayName = input<string>('Dungeon Master');
  readonly userEmail = input<string>('gm@loom-weaver.com');
  readonly userTierCode = input<string>('weaver');
  readonly viewerRole = input<ViewerRole>('gm');
  readonly generativeAiEnabled = input<boolean>(false);
  readonly hideAiContent = input<boolean>(true);
  readonly experienceMode = input<LwExperienceMode>('advanced');
  readonly panelWidth = input<string>('24.5rem');
  readonly activeCampaignsLimit = input<string>('10 Max');
  readonly storageLimitLabel = input<string>('10 GB');
  readonly weaveThreadsCount = input<number>(250);

  readonly generativeAiToggled = output<boolean>();
  readonly hideAiContentToggled = output<boolean>();
  readonly experienceModeChanged = output<LwExperienceMode>();
  readonly viewerRoleToggled = output<void>();
  readonly syncProfileRequested = output<void>();
  readonly logoutRequested = output<void>();

  readonly isOpen = signal<boolean>(false);

  readonly isGm = computed(() => this.viewerRole() === 'gm');

  readonly tierBadgeLabel = computed(() => {
    const code = (this.userTierCode() || '').toLowerCase();
    if (code === 'archweaver' || code === 'legendary') return 'ARCHWEAVER';
    if (code === 'weaver' || code === 'worldsmith') return 'WORLDSMITH';
    if (code === 'threadkeeper' || code === 'adventurer') return 'THREADKEEPER';
    return this.isGm() ? 'DUNGEON MASTER' : 'PLAYER';
  });

  readonly userInitials = computed(() => {
    const name = (this.userDisplayName() || 'LW').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  });

  toggleDropdown(event?: Event): void {
    event?.stopPropagation();
    this.isOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  setGenerativeAi(enabled: boolean): void {
    if (this.generativeAiEnabled() !== enabled) {
      this.generativeAiToggled.emit(enabled);
    }
  }

  setHideAi(hide: boolean): void {
    if (this.hideAiContent() !== hide) {
      this.hideAiContentToggled.emit(hide);
    }
  }

  setMode(mode: LwExperienceMode): void {
    const prev = this.experienceMode();
    this.experienceModeChanged.emit(mode);
    if (prev !== 'guided' && mode === 'guided') {
      this.closeDropdown();
      void this.router.navigateByUrl('/home');
    }
  }

  navigateTo(route: string): void {
    this.closeDropdown();
    void this.router.navigateByUrl(route);
  }

  onSyncProfile(): void {
    this.syncProfileRequested.emit();
  }

  onSignOut(): void {
    this.closeDropdown();
    this.logoutRequested.emit();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeDropdown();
    }
  }
}
