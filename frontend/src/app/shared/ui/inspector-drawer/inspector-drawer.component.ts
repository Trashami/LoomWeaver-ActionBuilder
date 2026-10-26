import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpCheckbox } from 'ng-primitives/checkbox';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import { LocationRelatedEntityVm } from '../../../core/models/world-lore.models';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwLocationInspectorComponent } from '../location-inspector/location-inspector.component';
import { LwScrollAreaComponent } from '../scroll-area/scroll-area.component';
import { LwWorldOverviewComponent } from '../world-overview/world-overview.component';

export type LwInspectorTab = 'guide' | 'notes' | 'npcs' | 'places' | 'lore';

@Component({
  selector: 'lw-inspector-drawer',
  standalone: true,
  imports: [
    RouterLink,
    NgpButton,
    NgpCheckbox,
    NgpAvatar,
    NgpAvatarFallback,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwScrollAreaComponent,
    LwLocationInspectorComponent,
    LwWorldOverviewComponent,
  ],
  templateUrl: './inspector-drawer.component.html',
  styleUrl: './inspector-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInspectorDrawerComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly worldLore = inject(WorldLoreFacadeService);
  private readonly router = inject(Router);

  readonly currentUrl = signal<string>(this.router.url || '/');
  readonly activeTab = signal<LwInspectorTab>('guide');
  readonly summaryExpanded = signal<boolean>(true);
  readonly beatsExpanded = signal<boolean>(true);
  readonly keyNpcsExpanded = signal<boolean>(true);
  readonly secretsExpanded = signal<boolean>(true);

  readonly isWorldLoreRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/weave') || url.startsWith('/world-lore');
  });

  readonly showWorldContext = computed(
    () => this.isWorldLoreRoute() && this.worldLore.inspectorContextMode() === 'world',
  );

  constructor() {
    this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        this.currentUrl.set(ev.urlAfterRedirects || ev.url);
        if (ev.urlAfterRedirects.startsWith('/weave') || ev.urlAfterRedirects.startsWith('/world-lore')) {
          this.worldLore.inspectorContextMode.set('world');
        }
      });
  }

  readonly tabs: { id: LwInspectorTab; label: string }[] = [
    { id: 'guide', label: 'Guide' },
    { id: 'notes', label: 'Notes' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'places', label: 'Places' },
    { id: 'lore', label: 'Lore' },
  ];

  readonly guide = computed(() => this.store.campaignDashboard().sessionGuide);

  readonly tabEntities = computed(() => {
    const tab = this.activeTab();
    const all = this.store.authorizedEntities();
    if (tab === 'npcs') {
      return all.filter((e) => e.entityType === 'NPC' || e.entityType === 'PlayerCharacter');
    }
    if (tab === 'places') {
      return all.filter((e) => e.entityType === 'Location' || e.entityType === 'Encounter');
    }
    if (tab === 'notes') {
      return all.filter((e) => e.entityType === 'Clue' || e.entityType === 'Quest');
    }
    return all;
  });

  toggleBeat(id: string): void {
    this.store.toggleSessionBeat(id);
  }

  inspectNpc(compositeKey: string): void {
    this.store.inspectEntity(compositeKey);
  }

  onRelatedEntitySelected(rel: LocationRelatedEntityVm): void {
    if (rel.entityType === 'Location') {
      const key = rel.compositeKey.split(':').pop() ?? rel.compositeKey;
      this.worldLore.selectLocation(key);
    } else {
      this.store.inspectEntity(rel.compositeKey);
    }
  }
}
