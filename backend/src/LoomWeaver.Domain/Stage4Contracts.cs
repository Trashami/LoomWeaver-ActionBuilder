namespace LoomWeaver.Domain;

public sealed record DiceSkinPresetContract(
    string Id,
    string Name,
    string MaterialType,
    string BaseColorHex,
    string RuneColorHex,
    double Metallic,
    double Roughness,
    string Nat20ShaderName,
    string Nat1ShaderName,
    string UnlockTier
);

public sealed record DiceRollRequestContract(
    int Sides,
    int Count,
    int Modifier,
    string RollMode,
    string? Label,
    string? SkinId,
    string? ActorName,
    string? DamageType
);

public sealed record DiceRollResponseContract(
    string Id,
    string Formula,
    string Label,
    int Sides,
    int Count,
    string RollMode,
    IReadOnlyList<int> RawRolls,
    IReadOnlyList<int> KeptRolls,
    int Modifier,
    int Total,
    bool IsNat20,
    bool IsNat1,
    string SkinId,
    string ShaderTriggered,
    string VerificationDigest,
    DateTimeOffset Timestamp
);

public sealed record AudioStemContract(
    string Id,
    string Name,
    string Role,
    string Waveform,
    double BaseFrequencyHz,
    double DefaultGain
);

public sealed record AudioScenePresetContract(
    string Id,
    string Name,
    string Mood,
    int Bpm,
    string KeySignature,
    string Description,
    double CrossfadeSeconds,
    IReadOnlyDictionary<string, double> StemGains
);

public sealed record AudioStateResponseContract(
    int CampaignId,
    string ActivePresetId,
    double MasterVolume,
    IReadOnlyList<AudioStemContract> Stems,
    IReadOnlyList<AudioScenePresetContract> Presets
);

public sealed record AudioTransitionRequestContract(
    string PresetId,
    double CrossfadeSeconds,
    string? Role
);

public sealed record RadarMetricContract(
    string Label,
    int Value
);

public sealed record CharacterTelemetryContract(
    string CharacterId,
    string Name,
    string ClassTitle,
    int TotalDamageDealt,
    int DamageMitigated,
    int SupportAndHealing,
    int CriticalHits,
    int ActionsExecuted,
    int CluesDiscovered,
    IReadOnlyList<RadarMetricContract> RadarProfile
);

public sealed record DamageTypeBreakdownContract(
    string DamageType,
    string ColorHex,
    int TotalDamage,
    int SharePercent,
    int PeakSingleHit,
    string SignatureSource
);

public sealed record CampaignAchievementContract(
    string Id,
    string Title,
    string Description,
    string Category,
    string Rarity,
    string Icon,
    int CurrentValue,
    int TargetValue,
    bool Unlocked,
    string AwardedTo,
    int XpBonus
);

public sealed record CampaignAnalyticsDashboardContract(
    int CampaignId,
    string CampaignName,
    int SessionsCompleted,
    int EncountersCleared,
    int TotalXpEarned,
    int TotalDiceRolled,
    int Nat20Count,
    int Nat1Count,
    double AverageD20Roll,
    IReadOnlyList<RadarMetricContract> PartyRadar,
    IReadOnlyList<CharacterTelemetryContract> CharacterTelemetry,
    IReadOnlyList<DamageTypeBreakdownContract> DamageBreakdown,
    IReadOnlyList<CampaignAchievementContract> Achievements,
    IReadOnlyList<DiceRollResponseContract> RecentRolls
);
