import {
  AtlasLayerFilterId,
  LocationInspectorDetailVm,
  LoreEntryVm,
  MarkerVisualStyleVm,
  PlayerVisibilityMode,
  WorldHistoryChronicleEventVm,
  WorldLorePrimaryTab,
  WorldMapMarkerVm,
  WorldMapSummaryVm,
} from '../models/world-lore.models';

export const DEFAULT_ACTIVE_LAYERS: readonly AtlasLayerFilterId[] = [
  'Locations',
  'Settlements',
  'Regions',
  'NPCs',
  'Quests',
  'Factions',
  'Encounters',
  'Secrets',
  'PlayerPath',
  'Visited',
  'PartyPosition',
  'History',
  'Rumors',
];

export const DEFAULT_LORE_CATEGORIES: readonly string[] = [
  'Worlds & Regions',
  'Kingdoms & Settlements',
  'Geography',
  'Cultures & Civilizations',
  'Factions & Organizations',
  'Religions & Deities',
  'Historical Events',
  'Languages',
  'Magic & Technology',
  'Myths & Legends',
  'Important Documents',
];

export function computeMapBreadcrumbs(
  current: WorldMapSummaryVm | null,
  allMaps: readonly WorldMapSummaryVm[],
): readonly WorldMapSummaryVm[] {
  if (!current) return [];
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
}

export function filterLoreEntriesList(
  entries: readonly LoreEntryVm[],
  isGm: boolean,
  query: string,
  cat: string,
  tag: string,
  sortBy: 'updated' | 'created' | 'name',
): readonly LoreEntryVm[] {
  const q = query.trim().toLowerCase();
  const list = entries
    .filter((e) => !e.archived && (isGm || e.visibility !== 'gm'))
    .filter((e) => {
      if (cat === 'All') return true;
      const lower = e.category.toLowerCase();
      if (cat === 'Factions') return lower.includes('faction');
      if (cat === 'Regions') return lower.includes('region') || lower.includes('world');
      if (cat === 'History') return lower.includes('histor');
      if (cat === 'Deities & Myths') return lower.includes('relig') || lower.includes('myth');
      if (cat === 'Rumors') return e.tags.some((t) => t.toLowerCase().includes('rumor'));
      return e.category === cat;
    })
    .filter((e) => (tag === 'All' ? true : e.tags.includes(tag)))
    .filter((e) =>
      !q
        ? true
        : e.title.toLowerCase().includes(q) ||
          e.excerpt.toLowerCase().includes(q) ||
          e.content.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
    );

  return [...list].sort((a, b) =>
    sortBy === 'name' ? a.title.localeCompare(b.title) : b.updatedAtUnixMs - a.updatedAtUnixMs,
  );
}

export function buildFallbackLocationVm(
  cid: number,
  mapId: string,
  payload: {
    locationKey?: string;
    name: string;
    locationType: string;
    hierarchyLevel: string;
    parentLocationKey?: string | null;
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
    attachedSessionId?: string | number | null;
    attachedSessionLabel?: string | null;
    playerVisibilityPolicy?: PlayerVisibilityMode;
    style?: MarkerVisualStyleVm;
  },
  existing?: LocationInspectorDetailVm | null,
): LocationInspectorDetailVm {
  const fallbackKey = payload.locationKey ?? existing?.locationKey ?? `loc-${Date.now().toString().slice(-5)}`;
  return {
    locationKey: fallbackKey,
    compositeKey: existing?.compositeKey ?? `${cid}:Location:${fallbackKey}`,
    campaignId: cid,
    name: payload.name,
    locationType: payload.locationType,
    hierarchyLevel: (payload.hierarchyLevel as never) || existing?.hierarchyLevel || 'Settlement',
    parentLocationKey: payload.parentLocationKey !== undefined ? payload.parentLocationKey : (existing?.parentLocationKey ?? null),
    parentLocationName: existing?.parentLocationName ?? 'Campaign Realm',
    artworkUrl: payload.artworkUrl || existing?.artworkUrl || '/icrandor_world_dashboard.jpg',
    description: payload.description || existing?.description || 'Recorded in the campaign world atlas.',
    discoveryStatus: (payload.discoveryStatus as never) || existing?.discoveryStatus || 'known',
    coordinatesLabel: `${payload.yPercent.toFixed(1)}° N, ${payload.xPercent.toFixed(1)}° E`,
    mapId,
    childMapId: payload.childMapId !== undefined ? payload.childMapId : (existing?.childMapId ?? null),
    linkedSceneKey: payload.linkedSceneKey !== undefined ? payload.linkedSceneKey : (existing?.linkedSceneKey ?? null),
    attachedSessionId: payload.attachedSessionId !== undefined ? payload.attachedSessionId : (existing?.attachedSessionId ?? null),
    attachedSessionLabel: payload.attachedSessionLabel !== undefined ? payload.attachedSessionLabel : (existing?.attachedSessionLabel ?? null),
    playerVisibilityPolicy: payload.playerVisibilityPolicy ?? existing?.playerVisibilityPolicy ?? 'auto_lore_revealed',
    style: payload.style ?? existing?.style,
    visibility: payload.visibility,
    attributes: existing?.attributes ?? [{ label: 'Region', value: 'Charted Realm' }],
    historicalBackground: payload.historicalBackground || existing?.historicalBackground || 'Chronicled by the GM.',
    cultureAndTraditions: payload.cultureAndTraditions || existing?.cultureAndTraditions || 'Recorded in campaign lore.',
    localMyths: payload.localMyths || existing?.localMyths || 'Local legends endure.',
    tags: existing?.tags ?? [payload.locationType],
    linkedLoreIds: existing?.linkedLoreIds ?? [],
    relatedEntities: existing?.relatedEntities ?? [],
    historyEvents: existing?.historyEvents ?? [],
    secrets: existing?.secrets ?? [],
  };
}

export function buildMarkerFromLocation(
  saved: LocationInspectorDetailVm,
  mapId: string,
  xPercent: number,
  yPercent: number,
  existingMarker?: WorldMapMarkerVm,
): WorldMapMarkerVm {
  return {
    markerId: existingMarker?.markerId ?? `m-${saved.locationKey}`,
    mapId: saved.mapId ?? mapId,
    locationKey: saved.locationKey,
    compositeKey: saved.compositeKey,
    name: saved.name,
    subtitle: saved.locationType,
    category: existingMarker?.category ?? (saved.visibility === 'gm' ? 'Secrets' : 'Settlements'),
    hierarchyLevel: saved.hierarchyLevel,
    xPercent,
    yPercent,
    discoveryStatus: saved.discoveryStatus,
    visibility: saved.visibility,
    childMapId: saved.childMapId,
    linkedSceneKey: saved.linkedSceneKey,
    attachedSessionId: saved.attachedSessionId ?? existingMarker?.attachedSessionId ?? null,
    attachedSessionLabel: saved.attachedSessionLabel ?? existingMarker?.attachedSessionLabel ?? null,
    playerVisibilityPolicy: saved.playerVisibilityPolicy ?? existingMarker?.playerVisibilityPolicy ?? 'auto_lore_revealed',
    style: saved.style ?? existingMarker?.style,
    questCount: saved.relatedEntities.filter((r) => r.entityType === 'Quest').length,
    npcCount: saved.relatedEntities.filter((r) => r.entityType === 'NPC').length,
    secretCount: saved.secrets.length,
  };
}

export function buildFallbackLoreEntryVm(
  cid: number,
  req: {
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
  },
): LoreEntryVm {
  const id = req.id ?? `lore-${Date.now().toString().slice(-5)}`;
  const content = req.content || req.excerpt || `${req.title} (${req.category})`;
  return {
    id,
    compositeKey: `${cid}:Lore:${id}`,
    campaignId: cid,
    title: req.title,
    subtitle: req.subtitle || req.category,
    category: req.category,
    excerpt: req.excerpt || content.slice(0, 140),
    content,
    artworkUrl: req.artworkUrl || '/icrandor_world_dashboard.jpg',
    tags: req.tags ?? [req.category],
    linkedEntityKeys: req.linkedEntityKeys ?? [],
    resolvedLinks: [],
    visibility: req.visibility,
    archived: Boolean(req.archived),
    createdAtLabel: 'Just now',
    updatedAtLabel: 'Just now',
    updatedAtUnixMs: Date.now(),
  };
}

export function buildFallbackHistoryEventVm(
  cid: number,
  sortOrder: number,
  mapId: string | null,
  req: {
    title: string;
    eraName: string;
    worldDateLabel: string;
    category: string;
    summary: string;
    sessionNumber: number | null;
    locationKey: string | null;
    visibility: 'players' | 'gm';
  },
): WorldHistoryChronicleEventVm {
  return {
    id: `ev-${Date.now()}`,
    campaignId: cid,
    title: req.title,
    eraName: req.eraName,
    worldDateLabel: req.worldDateLabel,
    sortOrder,
    sessionNumber: req.sessionNumber,
    realSessionDateLabel: req.sessionNumber ? `Session ${req.sessionNumber}` : 'World Lore Record',
    category: req.category,
    summary: req.summary,
    locationKey: req.locationKey,
    locationName: req.locationKey,
    mapId,
    linkedEntities: [],
    visibility: req.visibility,
  };
}

export function readSavedPrimaryTab(
  campaignId: number,
  weaveEnabled: boolean,
): WorldLorePrimaryTab {
  try {
    if (typeof localStorage === 'undefined') return 'atlas';
    const saved = localStorage.getItem(
      `lw_world_lore_tab_v2_${campaignId}`,
    ) as WorldLorePrimaryTab | null;
    if (saved === 'atlas' || saved === 'lore' || saved === 'history') return saved;
    if (saved === 'relationships' && weaveEnabled) return 'relationships';
  } catch {}
  return 'atlas';
}

export function readSavedLayers(
  campaignId: number,
  role: string,
): readonly AtlasLayerFilterId[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`lw_world_lore_layers_v2_${campaignId}_${role}`);
      if (raw) {
        const parsed = JSON.parse(raw) as AtlasLayerFilterId[];
        if (Array.isArray(parsed)) {
          return parsed.filter((id) => role === 'gm' || id !== 'Secrets');
        }
      }
    }
  } catch {}
  return DEFAULT_ACTIVE_LAYERS.filter((id) => role === 'gm' || id !== 'Secrets');
}
