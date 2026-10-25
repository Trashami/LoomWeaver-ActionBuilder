import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LoomWeaverStoreService } from './core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwInspectorDrawerComponent,
  LwLoomLauncherComponent,
} from './shared/ui/public-api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
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

  readonly coreNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Core'),
  );

  readonly playNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Play & Engines'),
  );

  readonly platformNav = computed(() =>
    this.store.visibleNavigation().filter((n) => n.group === 'Platform'),
  );
}
