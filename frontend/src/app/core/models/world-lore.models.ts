import { AudienceVisibility } from './loomweaver.models';

export type WorldLorePrimaryTab = 'atlas' | 'lore' | 'history' | 'relationships';

export type WorldHierarchyScope =
  | 'World'
  | 'Continent'
  | 'Region'
  | 'Settlement'
  | 'District'
  | 'Building';

export type LocationDiscoveryStatus = 'visited' | 'known' | 'rumor' | 'undiscovered';

export type MarkerLabelPosition = 'right' | 'top' | 'bottom' | 'left' | 'overlay' | 'hidden';

export type MarkerFontFamily =
  | 'Cinzel'
  | 'Cormorant Garamond'
  | 'Inter'
  | 'JetBrains Mono'
  | 'Georgia';

export type PlayerVisibilityMode = 'auto_lore_revealed' | 'manual_dm';

export type AtlasLayerFilterId =
  | 'Locations'
  | 'Settlements'
  | 'Regions'
  | 'NPCs'
  | 'Factions'
  | 'Quests'
  | 'Encounters'
  | 'Visited'
  | 'PartyPosition'
  | 'PlayerPath'
  | 'History'
  | 'Rumors'
  | 'Secrets';

export interface AtlasLayerFilterOption {
  readonly id: AtlasLayerFilterId;
  readonly label: string;
  readonly icon: string;
  readonly gmOnly?: boolean;
}

export interface OldWorldStampOption {
  readonly id: string;
  readonly label: string;
  readonly collection: 'Muller Old World' | 'Harrewyn Classic' | 'World Elements';
  readonly imageUrl: string;
}

export interface MarkerVisualStyleVm {
  readonly iconMode: 'default' | 'stamp';
  readonly defaultIconName: string;
  readonly stampImageUrl: string | null;
  readonly showIcon: boolean;
  readonly colorHex: string;
  readonly fontFamily: MarkerFontFamily;
  readonly labelPosition: MarkerLabelPosition;
  readonly iconScale: number;
}

export interface WorldMapSummaryVm {
  readonly mapId: string;
  readonly campaignId: number;
  readonly name: string;
  readonly scopeLevel: WorldHierarchyScope;
  readonly parentMapId: string | null;
  readonly parentLocationKey: string | null;
  readonly imageUrl: string;
  readonly linkedSceneKey: string | null;
  readonly scaleLabel: string;
  readonly compassOrientation: string;
  readonly widthUnits: number;
  readonly heightUnits: number;
  readonly visibility: AudienceVisibility;
}

export interface RegionPolygonPointVm {
  readonly x: number;
  readonly y: number;
}

export interface WorldMapRegionOverlayVm {
  readonly id: string;
  readonly mapId: string;
  readonly name: string;
  readonly overlayType: 'region' | 'territory';
  readonly factionKey: string | null;
  readonly colorHex: string;
  readonly labelX: number;
  readonly labelY: number;
  readonly svgPath: string;
  readonly visibility: AudienceVisibility;
  readonly subtitle?: string;
  readonly description?: string;
  readonly governanceAndRealm?: string;
  readonly linkedLoreId?: string | null;
  readonly points?: readonly RegionPolygonPointVm[];
}

export interface WorldMapMarkerVm {
  readonly markerId: string;
  readonly mapId: string;
  readonly locationKey: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly subtitle: string;
  readonly category: string;
  readonly hierarchyLevel: WorldHierarchyScope;
  readonly xPercent: number;
  readonly yPercent: number;
  readonly discoveryStatus: LocationDiscoveryStatus;
  readonly visibility: AudienceVisibility;
  readonly childMapId: string | null;
  readonly linkedSceneKey: string | null;
  readonly attachedSessionId?: string | number | null;
  readonly attachedSessionLabel?: string | null;
  readonly playerVisibilityPolicy?: PlayerVisibilityMode;
  readonly style?: MarkerVisualStyleVm;
  readonly questCount: number;
  readonly npcCount: number;
  readonly secretCount: number;
}

export interface PartyJourneyWaypointVm {
  readonly id: string;
  readonly mapId: string;
  readonly locationKey: string;
  readonly locationName: string;
  readonly sessionNumber: number;
  readonly worldDateLabel: string;
  readonly xPercent: number;
  readonly yPercent: number;
  readonly status: 'visited' | 'current' | 'known_unvisited' | 'gm_planned';
  readonly summary: string;
  readonly visibility: AudienceVisibility;
}

export interface LocationAttributeVm {
  readonly label: string;
  readonly value: string;
  readonly linkTargetKey?: string;
  readonly linkType?: 'location' | 'lore' | 'entity' | 'session';
}

export interface LocationRelatedEntityVm {
  readonly compositeKey: string;
  readonly name: string;
  readonly subtitle: string;
  readonly entityType: string;
  readonly relationshipLabel: string;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
}

export interface LocationSecretVm {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly revealedToPlayers: boolean;
}

export interface LocationHistoryEventVm {
  readonly id: string;
  readonly title: string;
  readonly worldDateLabel: string;
  readonly sessionNumber: number | null;
  readonly category: string;
  readonly summary: string;
  readonly visibility: AudienceVisibility;
}

export interface LocationInspectorDetailVm {
  readonly locationKey: string;
  readonly compositeKey: string;
  readonly campaignId: number;
  readonly name: string;
  readonly locationType: string;
  readonly hierarchyLevel: WorldHierarchyScope;
  readonly parentLocationKey: string | null;
  readonly parentLocationName: string | null;
  readonly artworkUrl: string;
  readonly description: string;
  readonly discoveryStatus: LocationDiscoveryStatus;
  readonly coordinatesLabel: string;
  readonly mapId: string | null;
  readonly childMapId: string | null;
  readonly linkedSceneKey: string | null;
  readonly attachedSessionId?: string | number | null;
  readonly attachedSessionLabel?: string | null;
  readonly playerVisibilityPolicy?: PlayerVisibilityMode;
  readonly style?: MarkerVisualStyleVm;
  readonly visibility: AudienceVisibility;
  readonly attributes: readonly LocationAttributeVm[];
  readonly historicalBackground: string;
  readonly cultureAndTraditions: string;
  readonly localMyths: string;
  readonly tags: readonly string[];
  readonly linkedLoreIds: readonly string[];
  readonly relatedEntities: readonly LocationRelatedEntityVm[];
  readonly historyEvents: readonly LocationHistoryEventVm[];
  readonly secrets: readonly LocationSecretVm[];
}

export interface LoreEntryVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly campaignId: number;
  readonly title: string;
  readonly subtitle: string;
  readonly category: string;
  readonly excerpt: string;
  readonly content: string;
  readonly artworkUrl: string;
  readonly tags: readonly string[];
  readonly linkedEntityKeys: readonly string[];
  readonly resolvedLinks: readonly LocationRelatedEntityVm[];
  readonly visibility: AudienceVisibility;
  readonly archived: boolean;
  readonly createdAtLabel: string;
  readonly updatedAtLabel: string;
  readonly updatedAtUnixMs: number;
}

export interface WorldHistoryChronicleEventVm {
  readonly id: string;
  readonly campaignId: number;
  readonly title: string;
  readonly eraName: string;
  readonly worldDateLabel: string;
  readonly sortOrder: number;
  readonly sessionNumber: number | null;
  readonly realSessionDateLabel: string;
  readonly category: string;
  readonly summary: string;
  readonly locationKey: string | null;
  readonly locationName: string | null;
  readonly mapId: string | null;
  readonly linkedEntities: readonly LocationRelatedEntityVm[];
  readonly visibility: AudienceVisibility;
}

export interface RecentWorldDiscoveryVm {
  readonly id: string;
  readonly title: string;
  readonly eventSummary: string;
  readonly relativeTime: string;
  readonly artworkUrl: string;
  readonly targetType: 'location' | 'lore' | 'entity';
  readonly targetKey: string;
  readonly visibility: AudienceVisibility;
}

export interface WorldStatisticsSummaryVm {
  readonly regionCount: number;
  readonly locationCount: number;
  readonly npcCount: number;
  readonly factionCount: number;
  readonly activeQuestCount: number;
  readonly unresolvedMysteryCount: number;
}

export interface WorldLoreWorkspaceVm {
  readonly campaignId: number;
  readonly campaignName: string;
  readonly worldName: string;
  readonly worldOverviewSummary: string;
  readonly viewerRole: 'gm' | 'players';
  readonly weaveEnabled: boolean;
  readonly activeMapId: string | null;
  readonly maps: readonly WorldMapSummaryVm[];
  readonly regionOverlays: readonly WorldMapRegionOverlayVm[];
  readonly markers: readonly WorldMapMarkerVm[];
  readonly journeyWaypoints: readonly PartyJourneyWaypointVm[];
  readonly loreEntries: readonly LoreEntryVm[];
  readonly loreCategories: readonly string[];
  readonly historyEvents: readonly WorldHistoryChronicleEventVm[];
  readonly recentDiscoveries: readonly RecentWorldDiscoveryVm[];
  readonly statistics: WorldStatisticsSummaryVm;
}
