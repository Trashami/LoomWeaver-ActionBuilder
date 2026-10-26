import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthSessionService } from './core/services/auth-session.service';
import { LoomWeaverStoreService } from './core/services/loomweaver-store.service';
import { WebAudioAmbienceService } from './features/assets/engine/web-audio-ambience.service';
import {
  LwAuthModalComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwInspectorDrawerComponent,
  LwLoomLauncherComponent,
} from './shared/ui/public-api';

@Component({
  selector: 'lw-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LwAuthModalComponent,
    LwBadgeComponent,
    LwButtonComponent,
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

  readonly isLandingSurface = computed(() => {
    const clean = this.currentUrl().split('?')[0].split('#')[0];
    return (
      clean === '' ||
      clean === '/' ||
      clean === '/welcome' ||
      clean === '/marketing' ||
      clean === '/login' ||
      clean === '/register' ||
      clean.startsWith('/features/')
    );
  });

  readonly coreNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Core'),
  );

  readonly playNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Play & Engines'),
  );

  readonly platformNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Platform'),
  );

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url);
      });
  }
}
