import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpToolbar } from 'ng-primitives/toolbar';
import { filter } from 'rxjs';
import { AuthSessionService } from './core/services/auth-session.service';
import { LoomWeaverStoreService } from './core/services/loomweaver-store.service';
import { WebAudioAmbienceService } from './features/assets/engine/web-audio-ambience.service';
import {
  LwAuthModalComponent,
  LwIconComponent,
  LwInspectorDrawerComponent,
  LwLoomLauncherComponent,
  LwScrollAreaComponent,
} from './shared/ui/public-api';

interface StudioPrimaryNavItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon?: string;
}

@Component({
  selector: 'lw-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgpButton,
    NgpInput,
    NgpAvatar,
    NgpAvatarFallback,
    NgpToolbar,
    LwAuthModalComponent,
    LwIconComponent,
    LwInspectorDrawerComponent,
    LwLoomLauncherComponent,
    LwScrollAreaComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly auth = inject(AuthSessionService);
  readonly audio = inject(WebAudioAmbienceService);
  private readonly router = inject(Router);

  readonly currentUrl = signal<string>(this.router.url || '/');
  readonly globalSearchText = signal<string>('');
  readonly showAllModules = signal<boolean>(true);

  readonly isLandingSurface = computed(() => {
    const clean = this.currentUrl().split('?')[0].split('#')[0];
    return (
      clean === '' ||
      clean === '/' ||
      clean === '/welcome' ||
      clean === '/marketing' ||
      clean === '/vtt' ||
      clean === '/campaign-manager' ||
      clean === '/battlemap-builder' ||
      clean === '/ai-campaign-assistant' ||
      clean === '/features' ||
      clean === '/login' ||
      clean === '/register' ||
      clean.startsWith('/features/')
    );
  });

  readonly primarySidebarNav: readonly StudioPrimaryNavItem[] = [
    { id: 'dashboard', label: 'Dashboard', route: '/home' },
    { id: 'world-lore', label: 'World & Lore', route: '/weave' },
    { id: 'quests-story', label: 'Quests & Story', route: '/campaigns' },
    { id: 'characters', label: 'Characters', route: '/characters' },
    { id: 'maps-scenes', label: 'Maps & Scenes', route: '/maps' },
    { id: 'session-log', label: 'Session Log', route: '/loom' },
    { id: 'handouts-clues', label: 'Handouts & Clues', route: '/assets' },
    { id: 'timelines', label: 'Timelines', route: '/statistics' },
  ];

  readonly engineSidebarNav: readonly StudioPrimaryNavItem[] = [
    { id: 'arcane-vtt', label: 'Arcane Screen VTT', route: '/arcane-screen' },
    { id: 'encounters', label: 'Encounters & Bestiary', route: '/encounters' },
    { id: 'dice-forge', label: '3D Dice Forge', route: '/dice' },
    { id: 'effects-rules', label: 'Actions & FX Studio', route: '/effects' },
    { id: 'marketplace', label: 'Creator Marketplace', route: '/marketplace' },
  ];

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      });
  }

  submitGlobalSearch(): void {
    const q = this.globalSearchText().trim();
    if (q) {
      this.store.setLoomSearchQuery(q);
    }
    this.store.toggleLoomDrawer(true);
  }
}
