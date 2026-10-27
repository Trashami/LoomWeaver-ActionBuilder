import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpCheckbox } from 'ng-primitives/checkbox';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import {
  AdventureGuideElementItemVm,
  AdventureProgressState,
  AdventureScopeKind,
} from '../../../core/models/adventure-guide.models';
import { LocationRelatedEntityVm } from '../../../core/models/world-lore.models';
import { AdventureGuideService } from '../../../core/services/adventure-guide.service';
import { ConnectedStoryService } from '../../../core/services/connected-story.service';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwLocationInspectorComponent } from '../location-inspector/location-inspector.component';
import {
  LwPartyMemberStatusVm,
  LwPartyRosterCardComponent,
} from '../party-roster-card/party-roster-card.component';
import { LwScrollAreaComponent } from '../scroll-area/scroll-area.component';
import { LwWorldOverviewComponent } from '../world-overview/world-overview.component';

export type LwInspectorTab = 'guide' | 'notes' | 'npcs' | 'places' | 'lore';

@Component({
  selector: 'lw-inspector-drawer',
  standalone: true,
  imports: [
    FormsModule,
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
    LwPartyRosterCardComponent,
    LwWorldOverviewComponent,
  ],
  templateUrl: './inspector-drawer.component.html',
  styleUrl: './inspector-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInspectorDrawerComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly worldLore = inject(WorldLoreFacadeService);
  readonly advGuide = inject(AdventureGuideService);
  readonly connectedStory = inject(ConnectedStoryService);
  private readonly router = inject(Router);

  readonly generativeAiEnabled = input<boolean>(false);
  readonly expandedWidth = input<string>('356px');
  readonly collapsedWidth = input<string>('16px');
  readonly collapsed = model<boolean>(true);
  readonly zoomPercent = model<number>(100);

  readonly isWeaveEnabled = computed(
    () => this.generativeAiEnabled() || this.store.weaveEnabled(),
  );

  readonly currentUrl = signal<string>(this.router.url || '/');
  readonly activeTab = signal<LwInspectorTab>('guide');

  readonly atTableExpanded = signal<boolean>(true);
  readonly summaryExpanded = signal<boolean>(true);
  readonly beatsExpanded = signal<boolean>(true);
  readonly keyNpcsExpanded = signal<boolean>(true);
  readonly encountersExpanded = signal<boolean>(true);
  readonly chainExpanded = signal<boolean>(true);
  readonly secretsExpanded = signal<boolean>(true);
  readonly showQuickNpcCreator = signal<boolean>(false);
  readonly revealedCheckOutcomeIds = signal<readonly string[]>(['blk-c1-check-malric']);

  readonly quickNpcName = signal<string>('');
  readonly quickNpcRole = signal<string>('Chapel Scout · Cautious');
  readonly quickNpcDisposition = signal<string>('Allied');

  readonly progressFilters: readonly { id: AdventureProgressState; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unresolved', label: 'Unresolved' },
    { id: 'discovered', label: 'Discovered' },
    { id: 'completed', label: 'Completed' },
    { id: 'optional', label: 'Optional' },
  ];

  readonly tabs: readonly { id: LwInspectorTab; label: string }[] = [
    { id: 'guide', label: 'Guide' },
    { id: 'notes', label: 'Notes' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'places', label: 'Places' },
    { id: 'lore', label: 'Lore' },
  ];

  readonly isWorldLoreRoute = computed(() => {
    const url = this.currentUrl();
    return url.startsWith('/weave') || url.startsWith('/world-lore');
  });

  readonly showWorldContext = computed(
    () => this.isWorldLoreRoute() && this.worldLore.inspectorContextMode() === 'world',
  );

  readonly guide = computed(() => this.advGuide.guide());

  readonly filteredTabItems = computed<readonly AdventureGuideElementItemVm[]>(() => {
    const tab = this.activeTab();
    const g = this.guide();
    const f = this.advGuide.activeProgressFilter();
    const source =
      tab === 'notes'
        ? g.notesTabItems
        : tab === 'places'
          ? g.placesTabItems
          : tab === 'lore'
            ? g.loreTabItems
            : [];
    return f === 'all' ? source : source.filter((item) => item.progressState === f);
  });

  constructor() {
    this.router.events
      .pipe(filter((ev): ev is NavigationEnd => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        this.currentUrl.set(ev.urlAfterRedirects || ev.url);
        if (
          ev.urlAfterRedirects.startsWith('/weave') ||
          ev.urlAfterRedirects.startsWith('/world-lore')
        ) {
          this.worldLore.inspectorContextMode.set(
            this.worldLore.selectedLocationKey() ? 'world' : 'session-guide',
          );
        }
      });
  }

  onLoreLinkSelected(loreId: string): void {
    this.worldLore.selectLoreEntry(loreId);
    this.worldLore.setPrimaryTab('lore');
  }

  toggleCollapsed(): void {
    this.collapsed.update((c) => !c);
  }

  adjustZoom(delta: number): void {
    this.zoomPercent.update((cur) => Math.max(80, Math.min(135, cur + delta)));
  }

  resetZoom(): void {
    this.zoomPercent.set(100);
  }

  selectScope(scopeKind: AdventureScopeKind, scopeId: string): void {
    this.advGuide.selectScope(scopeKind, scopeId);
  }

  toggleBeat(id: string): void {
    this.advGuide.toggleBeat(id);
  }

  toggleCheckOutcome(blockId: string): void {
    this.revealedCheckOutcomeIds.update((ids) =>
      ids.includes(blockId) ? ids.filter((i) => i !== blockId) : [...ids, blockId],
    );
    this.advGuide.updateNodeState(blockId, 'completed', 'Skill check resolved at the table');
  }

  isCheckRevealed(blockId: string): boolean {
    return this.revealedCheckOutcomeIds().includes(blockId);
  }

  inspectNpc(
    compositeKey: string,
    name?: string,
    role?: string,
    summary?: string,
    routeLink?: string,
  ): void {
    if (name && routeLink) {
      this.store.registerEntity({
        compositeKey,
        campaignId: this.store.activeCampaignId(),
        entityType: 'NPC',
        entityKey: compositeKey.split(':').pop() ?? compositeKey,
        name,
        subtitle: role ?? 'Adventure Cast',
        summary: summary ?? 'Linked to the active session and location.',
        visibility: 'players',
        canonStatus: 'approved',
        routeLink,
      });
    }
    this.store.inspectEntity(compositeKey);
  }

  inspectGuideElement(item: AdventureGuideElementItemVm): void {
    if (item.elementKind === 'room' || item.elementKind === 'location') {
      const kind: AdventureScopeKind = item.elementKind === 'room' ? 'room' : 'location';
      this.advGuide.selectScope(kind, item.nodeId);
      this.activeTab.set('guide');
    }
    this.store.inspectEntity(item.compositeKey);
  }

  submitQuickNpc(): void {
    const name = this.quickNpcName().trim();
    if (!name) return;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const compositeKey = `${this.store.activeCampaignId()}:NPC:npc-${slug}`;
    this.store.registerEntity({
      compositeKey,
      campaignId: this.store.activeCampaignId(),
      entityType: 'NPC',
      entityKey: `npc-${slug}`,
      name,
      subtitle: this.quickNpcRole(),
      summary: `Populated into ${this.guide().headerTitle}.`,
      visibility: 'players',
      canonStatus: 'approved',
      routeLink: `/campaigns?inspect=npc-${slug}`,
    });
    this.advGuide.populateCharacterOrNpc({
      name,
      role: this.quickNpcRole(),
      dispositionLabel: this.quickNpcDisposition(),
      locationNodeId: this.advGuide.activeScopeId(),
      sessionId: this.guide().activeSessionId,
      compositeKey,
      routeLink: `/campaigns?inspect=npc-${slug}`,
    });
    this.quickNpcName.set('');
    this.showQuickNpcCreator.set(false);
  }

  onRelatedEntitySelected(rel: LocationRelatedEntityVm): void {
    if (rel.entityType === 'Location') {
      const key = rel.compositeKey.split(':').pop() ?? rel.compositeKey;
      this.worldLore.selectLocation(key);
    } else {
      this.store.inspectEntity(rel.compositeKey);
    }
  }

  onPartyMemberSelected(member: LwPartyMemberStatusVm): void {
    this.store.inspectEntity(member.compositeKey);
    void this.router.navigateByUrl(member.routeLink || '/characters?mode=viewer');
  }

  openNewCharacterWizard(): void {
    void this.router.navigateByUrl('/characters?mode=creator');
  }
}
