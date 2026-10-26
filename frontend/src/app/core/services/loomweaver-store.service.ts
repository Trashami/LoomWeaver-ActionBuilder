import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AssetCardVm,
  CampaignVm,
  CombatTelemetryVm,
  EntityCardVm,
  GraphEdgeVm,
  LoomCitationVm,
  NavDestination,
  QualityProfile,
  SceneVm,
  SubscriptionTierVm,
  ViewerRole,
} from '../models/loomweaver.models';
import {
  LW_ASSETS,
  LW_GRAPH_EDGES,
  LW_SCENES,
  LW_SUBSCRIPTION_TIERS,
  LW_TELEMETRY,
} from './loomweaver-catalog.data';
import { LW_CAMPAIGNS, LW_ENTITIES, LW_NAVIGATION } from './loomweaver-seed.data';

@Injectable({ providedIn: 'root' })
export class LoomWeaverStoreService {
  private readonly http = inject(HttpClient);

  readonly navigationItems = signal<readonly NavDestination[]>(LW_NAVIGATION);
  readonly campaigns = signal<readonly CampaignVm[]>(LW_CAMPAIGNS);
  readonly activeCampaignId = signal<number>(1);
  readonly viewerRole = signal<ViewerRole>('gm');
  readonly weaveEnabled = signal<boolean>(true);
  readonly loomDrawerOpen = signal<boolean>(false);
  readonly loomQuery = signal<string>(
    'What did Kildrid sense beneath the mountain on the road to Cinth?',
  );
  readonly qualityProfile = signal<QualityProfile>('Balanced');
  readonly inspectedEntityKey = signal<string | null>('1:NPC:npc-emrys');
  readonly backendOnline = signal<boolean>(true);
  readonly quickRollBanner = signal<string>('1d20 Ready');

  private readonly rawEntities = signal<readonly EntityCardVm[]>(LW_ENTITIES);
  private readonly rawAssets = signal<readonly AssetCardVm[]>(LW_ASSETS);
  private readonly rawScenes = signal<readonly SceneVm[]>(LW_SCENES);
  private readonly rawEdges = signal<readonly GraphEdgeVm[]>(LW_GRAPH_EDGES);
  readonly telemetry = signal<readonly CombatTelemetryVm[]>(LW_TELEMETRY);
  readonly subscriptionTiers = signal<readonly SubscriptionTierVm[]>(LW_SUBSCRIPTION_TIERS);

  constructor() {
    this.verifyPolyglotHealth();
  }

  readonly activeCampaign = computed<CampaignVm>(() => {
    const id = this.activeCampaignId();
    return this.campaigns().find((c) => c.id === id) ?? this.campaigns()[0];
  });

  readonly visibleNavigation = computed<readonly NavDestination[]>(() => {
    const weaveOn = this.weaveEnabled();
    return this.navigationItems().filter((item) => !item.requiresWeave || weaveOn);
  });

  readonly authorizedEntities = computed<readonly EntityCardVm[]>(() => {
    const isGm = this.viewerRole() === 'gm';
    return this.rawEntities().filter(
      (e) => isGm || e.visibility === 'public' || e.visibility === 'players',
    );
  });

  readonly authorizedScenes = computed<readonly SceneVm[]>(() => {
    const isGm = this.viewerRole() === 'gm';
    return this.rawScenes().filter(
      (s) => isGm || s.visibility === 'public' || s.visibility === 'players',
    );
  });

  readonly authorizedGraphEdges = computed<readonly GraphEdgeVm[]>(() => {
    const isGm = this.viewerRole() === 'gm';
    return this.rawEdges().filter(
      (edge) => isGm || edge.visibility === 'public' || edge.visibility === 'players',
    );
  });

  readonly assets = computed<readonly AssetCardVm[]>(() => this.rawAssets());

  readonly inspectedEntity = computed<EntityCardVm | null>(() => {
    const key = this.inspectedEntityKey();
    if (!key) return null;
    return (
      this.authorizedEntities().find(
        (e) => e.compositeKey === key || e.entityKey === key,
      ) ?? null
    );
  });

  readonly inspectedEntityEdges = computed(() => {
    const entity = this.inspectedEntity();
    if (!entity) return [];
    const entities = this.authorizedEntities();
    return this.authorizedGraphEdges()
      .filter(
        (edge) =>
          edge.sourceKey === entity.compositeKey || edge.targetKey === entity.compositeKey,
      )
      .map((edge) => {
        const isOutgoing = edge.sourceKey === entity.compositeKey;
        const peerKey = isOutgoing ? edge.targetKey : edge.sourceKey;
        const peer = entities.find((e) => e.compositeKey === peerKey);
        return {
          relationshipType: edge.relationshipType,
          direction: isOutgoing ? ('outgoing' as const) : ('incoming' as const),
          peerKey,
          peerName: peer?.name ?? peerKey,
          peerType: peer?.entityType ?? 'Entity',
          peerRoute: peer?.routeLink ?? '/weave',
        };
      });
  });

  readonly loomCitations = computed<readonly LoomCitationVm[]>(() => {
    const q = this.loomQuery().trim().toLowerCase();
    const pool = this.authorizedEntities();
    const matched = pool.filter(
      (e) =>
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q),
    );
    const results = matched.length > 0 ? matched.slice(0, 5) : pool.slice(0, 4);
    return results.map((e) => ({
      compositeKey: e.compositeKey,
      title: e.name,
      entityType: e.entityType,
      excerpt: e.summary,
      routeLink: e.routeLink,
      visibility: e.visibility,
    }));
  });

  setCampaign(id: number): void {
    this.activeCampaignId.set(Number(id));
    const found = this.campaigns().find((c) => c.id === Number(id));
    if (found) {
      this.weaveEnabled.set(found.weaveEnabled);
    }
  }

  setViewerRole(role: ViewerRole): void {
    this.viewerRole.set(role);
  }

  toggleWeave(): void {
    this.weaveEnabled.update((v) => !v);
  }

  toggleLoomDrawer(open?: boolean): void {
    this.loomDrawerOpen.update((cur) => (open !== undefined ? open : !cur));
  }

  setLoomSearchQuery(query: string): void {
    this.loomQuery.set(query);
  }

  inspectEntity(keyOrComposite: string | null): void {
    this.inspectedEntityKey.set(keyOrComposite);
  }

  approveDraftEntity(compositeKey: string): void {
    if (this.viewerRole() !== 'gm') return;
    this.rawEntities.update((list) =>
      list.map((e) =>
        e.compositeKey === compositeKey
          ? { ...e, canonStatus: 'approved', visibility: 'players' }
          : e,
      ),
    );
  }

  unlockAsset(assetId: string): void {
    this.rawAssets.update((list) =>
      list.map((a) =>
        a.id === assetId
          ? { ...a, entitlement: 'purchased', priceLabel: 'Owned (Unlocked)' }
          : a,
      ),
    );
  }

  rollGlobalQuickD20(): void {
    this.http
      .post<{ total: number; isNat20: boolean; isNat1: boolean }>(
        '/api/v2/campaigns/1/dice/roll',
        {
          sides: 20,
          count: 1,
          modifier: 0,
          rollMode: 'normal',
          label: 'Core Shell Quick d20',
          skinId: 'skin-obsidian-gold',
        },
      )
      .subscribe({
        next: (res) => {
          const suffix = res.isNat20 ? ' (NAT 20!)' : res.isNat1 ? ' (NAT 1)' : '';
          this.quickRollBanner.set(`d20: ${res.total}${suffix}`);
        },
        error: () => {
          const v = Math.floor(Math.random() * 20) + 1;
          this.quickRollBanner.set(`d20: ${v}${v === 20 ? ' (NAT 20!)' : ''}`);
        },
      });
  }

  private verifyPolyglotHealth(): void {
    this.http.get<{ status: string }>('/api/v2/health').subscribe({
      next: (res) => {
        this.backendOnline.set(res?.status === 'healthy');
      },
      error: () => {
        this.backendOnline.set(true);
      },
    });
  }
}
