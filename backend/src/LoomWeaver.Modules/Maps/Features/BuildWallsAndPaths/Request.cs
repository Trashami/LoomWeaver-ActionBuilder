namespace LoomWeaver.Modules.Maps.Features.BuildWallsAndPaths;

public sealed record WallPoint2D(double X, double Z);

public sealed record WallOpeningDto(
    string Id,
    string Type,
    double T,
    double WidthMeters,
    bool IsOpen,
    bool IsSecret,
    bool IsRevealedToPlayers
);

public sealed record MapWallChamberDto(
    string Id,
    string Name,
    string DrawMode,
    string Material,
    double ThicknessMeters,
    double HeightMeters,
    string Perspective,
    string Projection,
    bool HasCornerPosts,
    int LevelIndex,
    IReadOnlyList<WallPoint2D> Points,
    IReadOnlyList<WallOpeningDto> Openings
);

public sealed record MapPathRibbonDto(
    string Id,
    string Name,
    string Style,
    double WidthMeters,
    double CurveAngleDeg,
    int CliffStrataBands,
    string ColorHex,
    int LevelIndex,
    IReadOnlyList<WallPoint2D> Waypoints
);

public sealed record CreateWallChamberRequest(
    string ViewerRole,
    string Name,
    string DrawMode,
    string Material,
    double CenterX,
    double CenterZ,
    double WidthMeters,
    double DepthMeters,
    double ThicknessMeters,
    double HeightMeters,
    string Perspective,
    string Projection,
    bool HasCornerPosts,
    int LevelIndex,
    IReadOnlyList<WallOpeningDto>? Openings
);

public sealed record CreatePathRibbonRequest(
    string ViewerRole,
    string Name,
    string Style,
    double WidthMeters,
    double CurveAngleDeg,
    int CliffStrataBands,
    string ColorHex,
    int LevelIndex,
    IReadOnlyList<WallPoint2D> Waypoints
);

public sealed record SceneArchitectureStateDto(
    string SceneKey,
    int Revision,
    IReadOnlyList<MapWallChamberDto> Walls,
    IReadOnlyList<MapPathRibbonDto> Paths,
    string LastOutboxEventId
);
