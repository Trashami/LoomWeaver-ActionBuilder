import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthSessionService } from './core/services/auth-session.service';
import { LoomWeaverStoreService } from './core/services/loomweaver-store.service';
import { WebAudioAmbienceService } from './features/assets/engine/web-audio-ambience.service';
import {
  LwAuthModalComponent,
  LwIconComponent,
  LwInspectorDrawerComponent,
  LwLoomLauncherComponent,
} from './shared/ui/public-api';

interface StudioPrimaryNavItem {
  readonly id: string;
  readonly label: string;
  readonly route: string;
  readonly icon: string;
}

@Component({
  selector: 'lw-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LwAuthModalComponent,
    LwIconComponent,
    LwInspectorDrawerComponent,
    LwLoomLauncherComponent,
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
    { id: 'dashboard', label: 'Dashboard', route: '/home', icon: 'home' },
    { id: 'world-lore', label: 'World & Lore', route: '/weave', icon: 'globe' },
    { id: 'quests-story', label: 'Quests & Story', route: '/campaigns', icon: 'scroll' },
    { id: 'characters', label: 'Characters', route: '/characters', icon: 'users' },
    { id: 'maps-scenes', label: 'Maps & Scenes', route: '/maps', icon: 'map' },
    { id: 'session-log', label: 'Session Log', route: '/loom', icon: 'book' },
    { id: 'handouts-clues', label: 'Handouts & Clues', route: '/assets', icon: 'sparkles' },
    { id: 'timelines', label: 'Timelines', route: '/statistics', icon: 'chart' },
  ];

  readonly engineSidebarNav: readonly StudioPrimaryNavItem[] = [
    { id: 'arcane-vtt', label: 'Arcane Screen VTT', route: '/arcane-screen', icon: 'shield' },
    { id: 'encounters', label: 'Encounters & Bestiary', route: '/encounters', icon: 'swords' },
    { id: 'dice-forge', label: '3D Dice Forge', route: '/dice', icon: 'dices' },
    { id: 'effects-rules', label: 'Actions & FX Studio', route: '/effects', icon: 'wand' },
    { id: 'marketplace', label: 'Creator Marketplace', route: '/marketplace', icon: 'store' },
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
