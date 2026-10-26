namespace LoomWeaver.Modules.Maps.Domain;

public sealed record MapStudioLayerDto(
    string Id,
    string Name,
    string Type,
    string Icon,
    bool Visible,
    bool Locked,
    int OpacityPercent,
    string BlendMode,
    int ZIndex
);

public sealed record MapLevelFloorDto(
    string Id,
    int LevelIndex,
    string Name,
    int ElevationMinFt,
    int ElevationMaxFt
);

public sealed record MapGridConfigDto(
    string GridType,
    int GridSizePx,
    int GridOpacityPercent,
    bool ShowGrid,
    bool SnapToGrid,
    string MapScope
);

public sealed record MapPresetTemplateDto(
    string Id,
    string Name,
    string Category,
    string MapScope,
    string Description,
    string Icon,
    int GridCols,
    int GridRows,
    string BaseBiome,
    string AmbientLighting,
    int AssetCount,
    string PreviewBadge
);

public sealed record MapCatalogAssetItemDto(
    string Id,
    string Name,
    string Category,
    string Subfolder,
    string AssetType,
    bool IsLightAware3D,
    bool IsScatterReady,
    double DefaultScale,
    int DefaultHeightFt,
    string PreviewPath
);

public sealed record SceneRevisionSnapshotDto(
    string SceneKey,
    int CampaignId,
    string Title,
    int Revision,
    int ActiveLevelIndex,
    bool GhostLowerFloors,
    bool TestTokenSandbox,
    MapGridConfigDto Grid,
    IReadOnlyList<MapLevelFloorDto> Levels,
    IReadOnlyList<MapStudioLayerDto> Layers,
    string UpdatedBy,
    DateTimeOffset UpdatedAtUtc
);
