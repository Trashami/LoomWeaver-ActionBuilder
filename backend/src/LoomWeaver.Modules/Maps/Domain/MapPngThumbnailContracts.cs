namespace LoomWeaver.Modules.Maps.Domain;

public sealed record Map3dAssetThumbnailDto(
    string Id,
    string Name,
    string Category,
    string SourceFile,
    string SourceHash,
    long Bytes,
    int Triangles,
    string PngPreviewUrl,
    string GlbUrl,
    double WidthSq,
    double DepthSq,
    double HeightSq,
    int DefaultWidthFt,
    string DefaultMaterial
);

public sealed record BatchRenderThumbnailsRequest(
    bool ForceReRender = false
);

public sealed record BatchRenderThumbnailsResponse(
    bool Accepted,
    string Mode,
    int TotalAssets,
    int RenderedCount,
    int CachedCount,
    IReadOnlyDictionary<string, int> Categories,
    string Summary
);

public sealed record SingleUpload3dAssetRequest(
    string FileName,
    string? DisplayName,
    string? Category,
    string? Base64GlbPayload
);

public sealed record SingleUpload3dAssetResponse(
    bool Accepted,
    string Mode,
    string Summary,
    Map3dAssetThumbnailDto Asset
);

public sealed record WorldOverlayMarkerDto(
    string Id,
    string Label,
    string OverlayKind,
    double X,
    double Z,
    string FactionOrQuestTag,
    string Visibility,
    string? LinkedEntityKey
);

public sealed record BattleRoomFloorDto(
    string Id,
    string Name,
    int GridX,
    int GridZ,
    int WidthSq,
    int DepthSq,
    double HeightSq,
    double WallThicknessSq,
    string FloorMaterial,
    string WallMaterial,
    int LevelIndex,
    string Visibility
);

public sealed record ScatterBrushStrokeDto(
    string Id,
    string CollectionName,
    int Seed,
    double X,
    double Z,
    double RadiusMeters,
    int DensityPercent,
    double MaxSlopeDegrees,
    IReadOnlyList<string> AssetIds,
    IReadOnlyList<double> Weights
);

public sealed record AtmosphereSettingsDto(
    string ThemePreset,
    double SunAzimuthDeg,
    double SunElevationDeg,
    string TimeOfDay,
    string WeatherType,
    int FogDensityPercent,
    bool ShadowsEnabled,
    bool FeyWispsEnabled,
    bool FirefliesEnabled,
    bool RuneGlowEnabled
);
