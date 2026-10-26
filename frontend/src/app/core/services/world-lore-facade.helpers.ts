import {
  AtlasLayerFilterId,
  LocationInspectorDetailVm,
  LoreEntryVm,
  WorldHistoryChronicleEventVm,
  WorldLorePrimaryTab,
  WorldMapMarkerVm,
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
  },
): LocationInspectorDetailVm {
  const fallbackKey = payload.locationKey ?? `loc-${Date.now().toString().slice(-5)}`;
  return {
    locationKey: fallbackKey,
    compositeKey: `${cid}:Location:${fallbackKey}`,
    campaignId: cid,
    name: payload.name,
    locationType: payload.locationType,
    hierarchyLevel: (payload.hierarchyLevel as never) || 'Settlement',
    parentLocationKey: payload.parentLocationKey ?? null,
    parentLocationName: 'Campaign Realm',
    artworkUrl: payload.artworkUrl || '/icrandor_world_dashboard.jpg',
    description: payload.description,
    discoveryStatus: (payload.discoveryStatus as never) || 'known',
    coordinatesLabel: `${payload.yPercent.toFixed(1)}° N, ${payload.xPercent.toFixed(1)}° E`,
    mapId,
    childMapId: payload.childMapId ?? null,
    linkedSceneKey: payload.linkedSceneKey ?? null,
    visibility: payload.visibility,
    attributes: [{ label: 'Region', value: 'Charted Realm' }],
    historicalBackground: payload.historicalBackground || 'Chronicled by the GM.',
    cultureAndTraditions: payload.cultureAndTraditions || 'Recorded in campaign lore.',
    localMyths: payload.localMyths || 'Local legends endure.',
    tags: [payload.locationType],
    linkedLoreIds: [],
    relatedEntities: [],
    historyEvents: [],
    secrets: [],
  };
}

export function buildMarkerFromLocation(
  saved: LocationInspectorDetailVm,
  mapId: string,
  xPercent: number,
  yPercent: number,
): WorldMapMarkerVm {
  return {
    markerId: `m-${saved.locationKey}`,
    mapId: saved.mapId ?? mapId,
    locationKey: saved.locationKey,
    compositeKey: saved.compositeKey,
    name: saved.name,
    subtitle: saved.locationType,
    category: saved.visibility === 'gm' ? 'Secrets' : 'Settlements',
    hierarchyLevel: saved.hierarchyLevel,
    xPercent,
    yPercent,
    discoveryStatus: saved.discoveryStatus,
    visibility: saved.visibility,
    childMapId: saved.childMapId,
    linkedSceneKey: saved.linkedSceneKey,
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
    if (saved === 'atlas' || saved === 'lore' || saved === 'history') {
      return saved;
    }
    if (saved === 'relationships' && weaveEnabled) {
      return 'relationships';
    }
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
