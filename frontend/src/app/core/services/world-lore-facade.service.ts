import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  AtlasLayerFilterId,
  LocationInspectorDetailVm,
  LoreEntryVm,
  WorldHistoryChronicleEventVm,
  WorldLorePrimaryTab,
  WorldLoreWorkspaceVm,
  WorldMapMarkerVm,
  WorldMapSummaryVm,
} from '../models/world-lore.models';
import { LoomWeaverStoreService } from './loomweaver-store.service';
import { ATLAS_LAYER_FILTERS, getSeedLocationsForCampaign } from './world-lore-seed.data';
import { buildSeedWorldLoreWorkspace } from './world-lore-workspace-seed.data';
import {
  DEFAULT_ACTIVE_LAYERS,
  DEFAULT_LORE_CATEGORIES,
  buildFallbackHistoryEventVm,
  buildFallbackLocationVm,
  buildFallbackLoreEntryVm,
  buildMarkerFromLocation,
  readSavedLayers,
  readSavedPrimaryTab,
} from './world-lore-facade.helpers';

@Injectable({ providedIn: 'root' })
export class WorldLoreFacadeService {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);

  readonly activePrimaryTab = signal<WorldLorePrimaryTab>('atlas');
  readonly activeMapId = signal<string | null>('map-icrandor-world');
  readonly selectedLocationKey = signal<string | null>('loc-cinth');
  readonly selectedLoreId = signal<string | null>(null);
  readonly activeLayers = signal<readonly AtlasLayerFilterId[]>(DEFAULT_ACTIVE_LAYERS);
  readonly journeySessionFilter = signal<number | 'all'>('all');
  readonly inspectorContextMode = signal<'world' | 'session-guide'>('world');

  readonly loreSearchQuery = signal<string>('');
  readonly loreCategoryFilter = signal<string>('All');
  readonly loreTagFilter = signal<string>('All');
  readonly loreSortBy = signal<'updated' | 'created' | 'name'>('updated');
  readonly lorePresentationMode = signal<'cards' | 'list'>('cards');
  readonly historyCategoryFilter = signal<string>('All');

  readonly loading = signal<boolean>(false);
  readonly errorBanner = signal<string | null>(null);
  readonly statusBanner = signal<string | null>(null);

  readonly workspace = signal<WorldLoreWorkspaceVm>(
    buildSeedWorldLoreWorkspace(1, 'gm', true),
  );

  readonly locationsState = signal<readonly LocationInspectorDetailVm[]>(
    getSeedLocationsForCampaign(1, 'gm'),
  );

  readonly isGm = computed(() => this.store.viewerRole() === 'gm');

  constructor() {
    effect(() => {
      const campaignId = this.store.activeCampaignId();
      const role = this.store.viewerRole();
      const weaveOn = this.store.weaveEnabled();

      this.activePrimaryTab.set(readSavedPrimaryTab(campaignId, weaveOn));
      this.activeLayers.set(readSavedLayers(campaignId, role));
      this.loadWorkspaceForCampaign(campaignId, role, weaveOn);
    });
  }

  readonly availableLayerFilters = computed(() => {
    const isGm = this.isGm();
    return ATLAS_LAYER_FILTERS.filter((f) => isGm || !f.gmOnly);
  });

  readonly activeMap = computed<WorldMapSummaryVm | null>(() => {
    const maps = this.workspace().maps;
    if (maps.length === 0) return null;
    const requested = this.activeMapId();
    return maps.find((m) => m.mapId === requested) ?? maps[0];
  });

  readonly mapHierarchyBreadcrumbs = computed<readonly WorldMapSummaryVm[]>(() => {
    const current = this.activeMap();
    if (!current) return [];
    const allMaps = this.workspace().maps;
    const chain: WorldMapSummaryVm[] = [current];
    let parentId = current.parentMapId;
    let guard = 0;
    while (parentId && guard < 6) {
      const parent = allMaps.find((m) => m.mapId === parentId);
      if (!parent) break;
      chain.unshift(parent);
      parentId = parent.parentMapId;
      guard++;
    }
    return chain;
  });

  readonly visibleMapOverlays = computed(() => {
    const map = this.activeMap();
    if (!map) return [];
    const layers = new Set(this.activeLayers());
    const isGm = this.isGm();
    return this.workspace()
      .regionOverlays.filter((o) => o.mapId === map.mapId)
      .filter((o) => isGm || o.visibility !== 'gm')
      .filter((o) =>
        o.overlayType === 'region' ? layers.has('Regions') : layers.has('Factions'),
      );
  });

  readonly visibleMapMarkers = computed<readonly WorldMapMarkerVm[]>(() => {
    const map = this.activeMap();
    if (!map) return [];
    const layers = new Set(this.activeLayers());
    const isGm = this.isGm();

    return this.workspace()
      .markers.filter((m) => m.mapId === map.mapId)
      .filter((m) => isGm || (m.visibility !== 'gm' && m.discoveryStatus !== 'undiscovered'))
      .filter((m) => {
        if (m.visibility === 'gm' && !layers.has('Secrets')) return false;
        if (m.discoveryStatus === 'rumor' && !layers.has('Rumors')) return false;
        if (m.discoveryStatus === 'visited' && layers.has('Visited')) return true;
        return layers.has(m.category as AtlasLayerFilterId) || layers.has('Locations');
      });
  });

  readonly visibleJourneyWaypoints = computed(() => {
    const map = this.activeMap();
    if (!map) return [];
    const layers = new Set(this.activeLayers());
    if (!layers.has('PlayerPath') && !layers.has('PartyPosition')) return [];
    const isGm = this.isGm();
    const sessionFilter = this.journeySessionFilter();

    return this.workspace()
      .journeyWaypoints.filter((w) => w.mapId === map.mapId)
      .filter((w) => isGm || (w.visibility !== 'gm' && w.status !== 'gm_planned'))
      .filter((w) => sessionFilter === 'all' || w.sessionNumber <= sessionFilter);
  });

  readonly selectedLocation = computed<LocationInspectorDetailVm | null>(() => {
    const key = this.selectedLocationKey();
    if (!key) return null;
    const isGm = this.isGm();
    const found = this.locationsState().find(
      (l) => l.locationKey === key || l.compositeKey === key,
    );
    if (!found) return null;
    if (!isGm && (found.visibility === 'gm' || found.discoveryStatus === 'undiscovered')) {
      return null;
    }
    return found;
  });

  readonly selectedLoreEntry = computed<LoreEntryVm | null>(() => {
    const id = this.selectedLoreId();
    if (!id) return null;
    const isGm = this.isGm();
    const found = this.workspace().loreEntries.find((l) => l.id === id);
    if (!found || (!isGm && found.visibility === 'gm')) return null;
    return found;
  });

  readonly loreCategories = computed<readonly string[]>(() => {
    const merged = new Set<string>(DEFAULT_LORE_CATEGORIES);
    for (const c of this.workspace().loreCategories) {
      merged.add(c);
    }
    for (const entry of this.workspace().loreEntries) {
      merged.add(entry.category);
    }
    return Array.from(merged);
  });

  readonly allLoreTags = computed<readonly string[]>(() => {
    const tags = new Set<string>();
    const isGm = this.isGm();
    for (const entry of this.workspace().loreEntries) {
      if (!entry.archived && (isGm || entry.visibility !== 'gm')) {
        for (const t of entry.tags) {
          tags.add(t);
        }
      }
    }
    return Array.from(tags);
  });

  readonly filteredLoreEntries = computed<readonly LoreEntryVm[]>(() => {
    const isGm = this.isGm();
    const query = this.loreSearchQuery().trim().toLowerCase();
    const cat = this.loreCategoryFilter();
    const tag = this.loreTagFilter();
    const sortBy = this.loreSortBy();

    const list = this.workspace()
      .loreEntries.filter((e) => !e.archived)
      .filter((e) => isGm || e.visibility !== 'gm')
      .filter((e) => {
        if (cat === 'All') return true;
        if (cat === 'Factions') return e.category.toLowerCase().includes('faction');
        if (cat === 'Regions')
          return (
            e.category.toLowerCase().includes('region') ||
            e.category.toLowerCase().includes('world')
          );
        if (cat === 'History') return e.category.toLowerCase().includes('histor');
        if (cat === 'Deities & Myths')
          return (
            e.category.toLowerCase().includes('relig') ||
            e.category.toLowerCase().includes('myth')
          );
        if (cat === 'Rumors') return e.tags.some((t) => t.toLowerCase().includes('rumor'));
        return e.category === cat;
      })
      .filter((e) => (tag === 'All' ? true : e.tags.includes(tag)))
      .filter((e) =>
        !query
          ? true
          : e.title.toLowerCase().includes(query) ||
            e.excerpt.toLowerCase().includes(query) ||
            e.content.toLowerCase().includes(query) ||
            e.tags.some((t) => t.toLowerCase().includes(query)),
      );

    return [...list].sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return b.updatedAtUnixMs - a.updatedAtUnixMs;
    });
  });

  readonly filteredHistoryEvents = computed<readonly WorldHistoryChronicleEventVm[]>(() => {
    const isGm = this.isGm();
    const cat = this.historyCategoryFilter();
    return this.workspace()
      .historyEvents.filter((ev) => isGm || ev.visibility !== 'gm')
      .filter((ev) => (cat === 'All' ? true : ev.category === cat))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  });

  searchMentionCandidates(
    query: string,
  ): Array<{ id: string; label: string; kind: string }> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const isGm = this.isGm();
    const results: Array<{ id: string; label: string; kind: string }> = [];
    for (const loc of this.locationsState()) {
      if ((isGm || loc.visibility !== 'gm') && loc.name.toLowerCase().includes(q)) {
        results.push({ id: loc.locationKey, label: loc.name, kind: 'Location' });
      }
    }
    for (const ent of this.store.authorizedEntities()) {
      if (ent.name.toLowerCase().includes(q)) {
        results.push({ id: ent.compositeKey, label: ent.name, kind: ent.entityType });
      }
    }
    return results.slice(0, 6);
  }

  setPrimaryTab(tab: WorldLorePrimaryTab): void {
    if (tab === 'relationships' && !this.store.weaveEnabled()) {
      this.activePrimaryTab.set('atlas');
      return;
    }
    this.activePrimaryTab.set(tab);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          `lw_world_lore_tab_v2_${this.store.activeCampaignId()}`,
          tab,
        );
      }
    } catch {}
  }

  selectMap(mapId: string): void {
    const allowed = this.workspace().maps.find((m) => m.mapId === mapId);
    if (!allowed) {
      this.errorBanner.set('Map is not available or unauthorized for the current viewer.');
      return;
    }
    this.activeMapId.set(mapId);
    this.errorBanner.set(null);
  }

  selectLocation(locationKey: string | null): void {
    this.errorBanner.set(null);
    if (!locationKey) {
      this.selectedLocationKey.set(null);
      return;
    }
    this.inspectorContextMode.set('world');
    const isGm = this.isGm();
    const local = this.locationsState().find(
      (l) => l.locationKey === locationKey || l.compositeKey === locationKey,
    );
    if (local && !isGm && local.visibility === 'gm') {
      this.selectedLocationKey.set(null);
      this.errorBanner.set('Location is unrevealed or restricted to the Game Master.');
      return;
    }

    this.selectedLocationKey.set(local?.locationKey ?? locationKey);
    const cid = this.store.activeCampaignId();
    const role = this.store.viewerRole();

    this.http
      .get<LocationInspectorDetailVm>(
        `/api/v2/campaigns/${cid}/world-lore/locations/${locationKey}?role=${role}`,
      )
      .subscribe({
        next: (detail) => {
          if (detail && detail.campaignId === this.store.activeCampaignId()) {
            this.locationsState.update((list) => {
              const exists = list.some((l) => l.locationKey === detail.locationKey);
              return exists
                ? list.map((l) => (l.locationKey === detail.locationKey ? detail : l))
                : [detail, ...list];
            });
          }
        },
        error: (err) => {
          if (err?.status === 404 && !local) {
            this.selectedLocationKey.set(null);
            this.errorBanner.set('Location not found or not yet revealed to players.');
          }
        },
      });
  }

  selectLoreEntry(loreId: string | null): void {
    this.selectedLoreId.set(loreId);
    if (loreId) {
      this.inspectorContextMode.set('world');
    }
  }

  toggleLayer(layerId: AtlasLayerFilterId): void {
    this.activeLayers.update((cur) =>
      cur.includes(layerId) ? cur.filter((x) => x !== layerId) : [...cur, layerId],
    );
    this.persistLayers();
  }

  showAllLayers(): void {
    this.activeLayers.set(this.availableLayerFilters().map((f) => f.id));
    this.persistLayers();
  }

  clearAllLayers(): void {
    this.activeLayers.set([]);
    this.persistLayers();
  }

  resetDefaultLayers(): void {
    this.activeLayers.set(
      DEFAULT_ACTIVE_LAYERS.filter((id) => this.isGm() || id !== 'Secrets'),
    );
    this.persistLayers();
  }

  saveLocation(payload: {
    locationKey?: string;
    name: string;
    locationType: string;
    hierarchyLevel: string;
    parentLocationKey?: string | null;
    mapId?: string | null;
    childMapId?: string | null;
    linkedSceneKey?: string | null;
    xPercent: number;
    yPercent: number;
    discoveryStatus: string;
    visibility: 'players' | 'gm' | 'public';
    artworkUrl?: string;
    description: string;
    historicalBackground?: string;
    cultureAndTraditions?: string;
    localMyths?: string;
  }): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();
    const mapId = payload.mapId ?? this.activeMap()?.mapId ?? 'map-icrandor-world';

    this.http
      .post<LocationInspectorDetailVm>(
        `/api/v2/campaigns/${cid}/world-lore/locations?role=gm`,
        { ...payload, mapId },
      )
      .subscribe({
        next: (saved) => {
          this.applySavedLocationLocally(saved, payload.xPercent, payload.yPercent);
          this.statusBanner.set(`Saved location "${saved.name}".`);
        },
        error: () => {
          const fallback = buildFallbackLocationVm(cid, mapId, payload);
          this.applySavedLocationLocally(fallback, payload.xPercent, payload.yPercent);
          this.statusBanner.set(`Saved location "${fallback.name}".`);
        },
      });
  }

  linkEntityToLocation(
    locationKey: string,
    req: {
      targetCompositeKey: string;
      targetName: string;
      targetSubtitle: string;
      entityType: string;
      relationshipLabel: string;
      visibility: 'players' | 'gm';
    },
  ): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();

    this.http
      .post<LocationInspectorDetailVm>(
        `/api/v2/campaigns/${cid}/world-lore/locations/${locationKey}/links?role=gm`,
        req,
      )
      .subscribe({
        next: (updated) => {
          this.locationsState.update((list) =>
            list.map((l) => (l.locationKey === updated.locationKey ? updated : l)),
          );
          this.statusBanner.set(`Linked "${req.targetName}" to ${updated.name}.`);
        },
        error: () => {
          this.locationsState.update((list) =>
            list.map((l) =>
              l.locationKey === locationKey
                ? {
                    ...l,
                    relatedEntities: [
                      {
                        compositeKey: req.targetCompositeKey,
                        name: req.targetName,
                        subtitle: req.targetSubtitle,
                        entityType: req.entityType,
                        relationshipLabel: req.relationshipLabel,
                        routeLink: '/campaigns',
                        visibility: req.visibility,
                      },
                      ...l.relatedEntities,
                    ],
                  }
                : l,
            ),
          );
          this.statusBanner.set(`Linked "${req.targetName}".`);
        },
      });
  }

  revealLocationSecret(locationKey: string, secretId: string): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();

    this.http
      .post<LocationInspectorDetailVm>(
        `/api/v2/campaigns/${cid}/world-lore/locations/${locationKey}/secrets/${secretId}/reveal?role=gm`,
        {},
      )
      .subscribe({
        next: (updated) => {
          this.locationsState.update((list) =>
            list.map((l) => (l.locationKey === updated.locationKey ? updated : l)),
          );
          this.statusBanner.set(`Updated player revelation state for ${updated.name}.`);
        },
        error: () => {
          this.locationsState.update((list) =>
            list.map((l) =>
              l.locationKey === locationKey
                ? {
                    ...l,
                    visibility: 'players',
                    secrets: l.secrets.map((s) =>
                      s.id === secretId
                        ? { ...s, revealedToPlayers: !s.revealedToPlayers }
                        : s,
                    ),
                  }
                : l,
            ),
          );
        },
      });
  }

  assignWorldMap(map: {
    name: string;
    scopeLevel: 'World' | 'Continent' | 'Region' | 'Settlement' | 'District' | 'Building';
    imageUrl: string;
    linkedSceneKey?: string | null;
  }): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();
    const dto: WorldMapSummaryVm = {
      mapId: `map-${cid}-${Date.now().toString().slice(-4)}`,
      campaignId: cid,
      name: map.name,
      scopeLevel: map.scopeLevel,
      parentMapId: null,
      parentLocationKey: null,
      imageUrl: map.imageUrl || '/icrandor_world_dashboard.jpg',
      linkedSceneKey: map.linkedSceneKey ?? null,
      scaleLabel: '0 — 100 — 200 Miles',
      compassOrientation: 'Top-Right North',
      widthUnits: 1000,
      heightUnits: 560,
      visibility: 'players',
    };

    this.http
      .post<WorldLoreWorkspaceVm>(
        `/api/v2/campaigns/${cid}/world-lore/maps/assign?role=gm`,
        dto,
      )
      .subscribe({
        next: (ws) => {
          this.workspace.set(ws);
          this.activeMapId.set(ws.activeMapId);
          this.statusBanner.set(`Initialized world atlas "${dto.name}".`);
        },
        error: () => {
          this.workspace.update((cur) => ({
            ...cur,
            activeMapId: dto.mapId,
            maps: [dto, ...cur.maps],
          }));
          this.activeMapId.set(dto.mapId);
        },
      });
  }

  saveLoreEntry(req: {
    id?: string;
    title: string;
    category: string;
    subtitle?: string;
    excerpt?: string;
    content?: string;
    artworkUrl?: string;
    tags?: readonly string[];
    linkedEntityKeys?: readonly string[];
    visibility: 'players' | 'gm' | 'public';
    archived?: boolean;
  }): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();

    this.http
      .post<LoreEntryVm>(`/api/v2/campaigns/${cid}/world-lore/lore?role=gm`, req)
      .subscribe({
        next: (saved) => {
          this.upsertLoreLocally(saved);
          this.statusBanner.set(`Saved lore article "${saved.title}".`);
        },
        error: () => {
          const fallback = buildFallbackLoreEntryVm(cid, req);
          this.upsertLoreLocally(fallback);
          this.statusBanner.set(`Saved lore article "${fallback.title}".`);
        },
      });
  }

  createHistoryEvent(req: {
    title: string;
    eraName: string;
    worldDateLabel: string;
    category: string;
    summary: string;
    sessionNumber: number | null;
    locationKey: string | null;
    visibility: 'players' | 'gm';
  }): void {
    if (!this.isGm()) return;
    const cid = this.store.activeCampaignId();

    this.http
      .post<WorldHistoryChronicleEventVm>(
        `/api/v2/campaigns/${cid}/world-lore/history?role=gm`,
        req,
      )
      .subscribe({
        next: (created) => {
          this.workspace.update((cur) => ({
            ...cur,
            historyEvents: [...cur.historyEvents, created],
          }));
          this.statusBanner.set(`Added historical milestone "${created.title}".`);
        },
        error: () => {
          const fallback = buildFallbackHistoryEventVm(
            cid,
            this.workspace().historyEvents.length * 10 + 10,
            this.activeMap()?.mapId ?? null,
            req,
          );
          this.workspace.update((cur) => ({
            ...cur,
            historyEvents: [...cur.historyEvents, fallback],
          }));
        },
      });
  }

  private loadWorkspaceForCampaign(
    campaignId: number,
    role: 'gm' | 'players',
    weaveEnabled: boolean,
  ): void {
    const seedWs = buildSeedWorldLoreWorkspace(campaignId, role, weaveEnabled);
    const seedLocs = getSeedLocationsForCampaign(campaignId, role);

    this.workspace.set(seedWs);
    this.locationsState.set(seedLocs);
    this.activeMapId.set(seedWs.activeMapId);
    this.selectedLocationKey.set(seedLocs[0]?.locationKey ?? null);
    this.selectedLoreId.set(null);
    this.errorBanner.set(null);

    this.loading.set(true);
    this.http
      .get<WorldLoreWorkspaceVm>(
        `/api/v2/campaigns/${campaignId}/world-lore?role=${role}`,
      )
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res && res.campaignId === this.store.activeCampaignId()) {
            this.workspace.set(res);
            this.activeMapId.set(res.activeMapId);
          }
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private applySavedLocationLocally(
    saved: LocationInspectorDetailVm,
    xPercent: number,
    yPercent: number,
  ): void {
    this.locationsState.update((list) => {
      const exists = list.some((l) => l.locationKey === saved.locationKey);
      return exists
        ? list.map((l) => (l.locationKey === saved.locationKey ? saved : l))
        : [saved, ...list];
    });
    const marker = buildMarkerFromLocation(
      saved,
      this.activeMap()?.mapId ?? 'map-icrandor-world',
      xPercent,
      yPercent,
    );
    this.workspace.update((cur) => {
      const exists = cur.markers.some((m) => m.locationKey === saved.locationKey);
      return {
        ...cur,
        markers: exists
          ? cur.markers.map((m) => (m.locationKey === saved.locationKey ? marker : m))
          : [...cur.markers, marker],
      };
    });
    this.selectedLocationKey.set(saved.locationKey);
  }

  private upsertLoreLocally(saved: LoreEntryVm): void {
    this.workspace.update((cur) => {
      const exists = cur.loreEntries.some((l) => l.id === saved.id);
      const nextEntries = saved.archived
        ? cur.loreEntries.filter((l) => l.id !== saved.id)
        : exists
          ? cur.loreEntries.map((l) => (l.id === saved.id ? saved : l))
          : [saved, ...cur.loreEntries];
      const nextCats = cur.loreCategories.includes(saved.category)
        ? cur.loreCategories
        : [...cur.loreCategories, saved.category];
      return {
        ...cur,
        loreEntries: nextEntries,
        loreCategories: nextCats,
      };
    });
    this.selectedLoreId.set(saved.archived ? null : saved.id);
  }

  private persistLayers(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const cid = this.store.activeCampaignId();
      const role = this.store.viewerRole();
      localStorage.setItem(
        `lw_world_lore_layers_v2_${cid}_${role}`,
        JSON.stringify(this.activeLayers()),
      );
    } catch {}
  }
}
