namespace LoomWeaver.Domain;

public sealed record WorldMapSummaryDto(
    string MapId,
    int CampaignId,
    string Name,
    string ScopeLevel,
    string? ParentMapId,
    string? ParentLocationKey,
    string ImageUrl,
    string? LinkedSceneKey,
    string ScaleLabel,
    string CompassOrientation,
    int WidthUnits,
    int HeightUnits,
    string Visibility
);

public sealed record WorldMapRegionOverlayDto(
    string Id,
    string MapId,
    string Name,
    string OverlayType,
    string? FactionKey,
    string ColorHex,
    double LabelX,
    double LabelY,
    string SvgPath,
    string Visibility
);

public sealed record MarkerVisualStyleDto(
    string IconMode = "default",
    string DefaultIconName = "landmark",
    string? StampImageUrl = null,
    bool ShowIcon = true,
    string ColorHex = "#d9b77a",
    string FontFamily = "Cinzel",
    string LabelPosition = "right",
    double IconScale = 1.0
);

public sealed record WorldMapMarkerDto(
    string MarkerId,
    string MapId,
    string LocationKey,
    string CompositeKey,
    string Name,
    string Subtitle,
    string Category,
    string HierarchyLevel,
    double XPercent,
    double YPercent,
    string DiscoveryStatus,
    string Visibility,
    string? ChildMapId,
    string? LinkedSceneKey,
    int QuestCount,
    int NpcCount,
    int SecretCount,
    string? AttachedSessionId = null,
    string? AttachedSessionLabel = null,
    string? PlayerVisibilityPolicy = "auto_lore_revealed",
    MarkerVisualStyleDto? Style = null
);

public sealed record PartyJourneyWaypointDto(
    string Id,
    string MapId,
    string LocationKey,
    string LocationName,
    int SessionNumber,
    string WorldDateLabel,
    double XPercent,
    double YPercent,
    string Status,
    string Summary,
    string Visibility
);

public sealed record LocationAttributeDto(
    string Label,
    string Value,
    string? LinkTargetKey = null,
    string? LinkType = null
);

public sealed record LocationRelatedEntityDto(
    string CompositeKey,
    string Name,
    string Subtitle,
    string EntityType,
    string RelationshipLabel,
    string RouteLink,
    string Visibility
);

public sealed record LocationSecretDto(
    string Id,
    string Title,
    string Summary,
    bool RevealedToPlayers
);

public sealed record LocationHistoryEventDto(
    string Id,
    string Title,
    string WorldDateLabel,
    int? SessionNumber,
    string Category,
    string Summary,
    string Visibility
);

public sealed record LocationInspectorDetailDto(
    string LocationKey,
    string CompositeKey,
    int CampaignId,
    string Name,
    string LocationType,
    string HierarchyLevel,
    string? ParentLocationKey,
    string? ParentLocationName,
    string ArtworkUrl,
    string Description,
    string DiscoveryStatus,
    string CoordinatesLabel,
    string? MapId,
    string? ChildMapId,
    string? LinkedSceneKey,
    string Visibility,
    IReadOnlyList<LocationAttributeDto> Attributes,
    string HistoricalBackground,
    string CultureAndTraditions,
    string LocalMyths,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> LinkedLoreIds,
    IReadOnlyList<LocationRelatedEntityDto> RelatedEntities,
    IReadOnlyList<LocationHistoryEventDto> HistoryEvents,
    IReadOnlyList<LocationSecretDto> Secrets,
    string? AttachedSessionId = null,
    string? AttachedSessionLabel = null,
    string? PlayerVisibilityPolicy = "auto_lore_revealed",
    MarkerVisualStyleDto? Style = null
);

public sealed record LoreEntryDto(
    string Id,
    string CompositeKey,
    int CampaignId,
    string Title,
    string Subtitle,
    string Category,
    string Excerpt,
    string Content,
    string ArtworkUrl,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> LinkedEntityKeys,
    IReadOnlyList<LocationRelatedEntityDto> ResolvedLinks,
    string Visibility,
    bool Archived,
    string CreatedAtLabel,
    string UpdatedAtLabel,
    long UpdatedAtUnixMs
);

public sealed record WorldHistoryChronicleEventDto(
    string Id,
    int CampaignId,
    string Title,
    string EraName,
    string WorldDateLabel,
    int SortOrder,
    int? SessionNumber,
    string RealSessionDateLabel,
    string Category,
    string Summary,
    string? LocationKey,
    string? LocationName,
    string? MapId,
    IReadOnlyList<LocationRelatedEntityDto> LinkedEntities,
    string Visibility
);

public sealed record RecentWorldDiscoveryDto(
    string Id,
    string Title,
    string EventSummary,
    string RelativeTime,
    string ArtworkUrl,
    string TargetType,
    string TargetKey,
    string Visibility
);

public sealed record WorldStatisticsSummaryDto(
    int RegionCount,
    int LocationCount,
    int NpcCount,
    int FactionCount,
    int ActiveQuestCount,
    int UnresolvedMysteryCount
);

public sealed record WorldLoreWorkspaceDto(
    int CampaignId,
    string CampaignName,
    string WorldName,
    string WorldOverviewSummary,
    string ViewerRole,
    bool WeaveEnabled,
    string? ActiveMapId,
    IReadOnlyList<WorldMapSummaryDto> Maps,
    IReadOnlyList<WorldMapRegionOverlayDto> RegionOverlays,
    IReadOnlyList<WorldMapMarkerDto> Markers,
    IReadOnlyList<PartyJourneyWaypointDto> JourneyWaypoints,
    IReadOnlyList<LoreEntryDto> LoreEntries,
    IReadOnlyList<string> LoreCategories,
    IReadOnlyList<WorldHistoryChronicleEventDto> HistoryEvents,
    IReadOnlyList<RecentWorldDiscoveryDto> RecentDiscoveries,
    WorldStatisticsSummaryDto Statistics
);

public sealed record UpsertLocationRequest(
    string? LocationKey,
    string Name,
    string LocationType,
    string HierarchyLevel,
    string? ParentLocationKey,
    string? MapId,
    string? ChildMapId,
    string? LinkedSceneKey,
    double XPercent,
    double YPercent,
    string DiscoveryStatus,
    string Visibility,
    string? ArtworkUrl,
    string Description,
    string? HistoricalBackground,
    string? CultureAndTraditions,
    string? LocalMyths,
    IReadOnlyList<LocationAttributeDto>? Attributes,
    IReadOnlyList<string>? Tags,
    string? AttachedSessionId = null,
    string? AttachedSessionLabel = null,
    string? PlayerVisibilityPolicy = null,
    MarkerVisualStyleDto? Style = null
);

public sealed record LinkEntityToLocationRequest(
    string TargetCompositeKey,
    string TargetName,
    string TargetSubtitle,
    string EntityType,
    string RelationshipLabel,
    string Visibility
);

public sealed record UpsertLoreEntryRequest(
    string? Id,
    string Title,
    string Category,
    string? Subtitle,
    string? Excerpt,
    string? Content,
    string? ArtworkUrl,
    IReadOnlyList<string>? Tags,
    IReadOnlyList<string>? LinkedEntityKeys,
    string Visibility,
    bool Archived = false
);

public sealed record CreateWorldHistoryEventRequest(
    string Title,
    string EraName,
    string WorldDateLabel,
    string Category,
    string Summary,
    int? SessionNumber,
    string? LocationKey,
    string Visibility
);
