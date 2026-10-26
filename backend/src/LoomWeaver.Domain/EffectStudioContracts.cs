namespace LoomWeaver.Domain;

public sealed record EffectEmitterCardDto(
    string Id,
    string Name,
    string Category,
    string EmitterType,
    string Shape,
    double Radius,
    double Height,
    int EmissionRate,
    double LifetimeSeconds,
    double Speed,
    double SpreadDegrees,
    string MaterialName,
    string ColorPrimaryHex,
    string ColorSecondaryHex,
    double SizeMin,
    double SizeMax,
    int OpacityPercent,
    string BlendMode,
    bool CastLight,
    double LightIntensity,
    bool ReceiveShadows,
    string PreviewAccentHex
);

public sealed record EffectTimelineTrackDto(
    string Id,
    string Label,
    string TrackType,
    bool Visible,
    bool Expanded,
    double StartTimeSeconds,
    double EndTimeSeconds,
    string ColorHex,
    string AccentHex,
    string EmitterId
);

public sealed record EffectMotionForceConfigDto(
    double GravityY,
    double VortexStrength,
    double SpiralFrequency,
    double DragCoefficient,
    bool EnableCollision,
    double BounceRestitution,
    string AttachedModelKey,
    string SoundCueId,
    int SoundVolumePercent
);

public sealed record EffectStudioDocumentDto(
    string Id,
    int CampaignId,
    string Name,
    string Subtitle,
    string StatusLabel,
    string ActiveCameraPreset,
    double TotalDurationSeconds,
    string ActiveEmitterId,
    EffectEmitterCardDto ActiveProperties,
    EffectMotionForceConfigDto MotionAndForces,
    IReadOnlyList<EffectTimelineTrackDto> Tracks,
    string CanonStatus,
    string UpdatedAt
);

public sealed record SaveEffectStudioDocumentRequest(
    string? Id,
    int CampaignId,
    string Name,
    string Subtitle,
    string ActiveCameraPreset,
    double TotalDurationSeconds,
    string ActiveEmitterId,
    EffectEmitterCardDto ActiveProperties,
    EffectMotionForceConfigDto MotionAndForces,
    IReadOnlyList<EffectTimelineTrackDto> Tracks,
    string ViewerRole
);

public sealed record EffectExportBundleDto(
    string BundleFormat,
    string Version,
    string ExportedAt,
    EffectStudioDocumentDto Effect,
    string Checksum
);

public sealed record EffectInGameTestRequest(
    string EffectId,
    string CasterTokenKey,
    string TargetTokenKey,
    double TargetX,
    double TargetZ,
    bool ReducedMotion
);

public sealed record EffectInGameTestResultDto(
    string EffectId,
    string EffectName,
    string CasterTokenKey,
    string TargetTokenKey,
    double DistanceFeet,
    int SimulatedParticlesSpawned,
    double DynamicLightPeakLux,
    IReadOnlyList<string> TriggeredTrackLabels,
    string CombatLogSummary,
    string Timestamp
);
