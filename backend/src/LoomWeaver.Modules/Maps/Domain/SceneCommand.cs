namespace LoomWeaver.Modules.Maps.Domain;

public sealed record SaveSceneRevisionRequest(
    string ViewerRole,
    string AuthorName,
    string Title,
    int ExpectedRevision,
    int ActiveLevelIndex,
    bool GhostLowerFloors,
    bool TestTokenSandbox,
    MapGridConfigDto Grid,
    IReadOnlyList<MapLevelFloorDto> Levels,
    IReadOnlyList<MapStudioLayerDto> Layers,
    string ChangeSummary
);

public sealed record SaveSceneRevisionResponse(
    bool Accepted,
    int NewRevision,
    string OutboxEventId,
    string Summary,
    SceneRevisionSnapshotDto Snapshot
);
