namespace LoomWeaver.Domain;

public sealed record AbilityScoreDto(
    string Code,
    string Label,
    int Score,
    int Modifier
);

public sealed record EquipmentItemDto(
    string Id,
    string Name,
    string Slot,
    string BonusSummary,
    int AcBonus,
    int AttackBonus,
    bool Equipped
);

public sealed record CharacterSheetDto(
    string CompositeKey,
    string CharacterKey,
    int CampaignId,
    string Name,
    string AncestryOrClan,
    string ClassOrArchetype,
    string SystemCode,
    int Level,
    int CurrentXp,
    int NextLevelXp,
    bool LevelUpEligible,
    int MaxHp,
    int CurrentHp,
    int ArmorClass,
    int InitiativeBonus,
    int SpeedFeet,
    int ProficiencyBonus,
    string ActionEconomySummary,
    IReadOnlyList<AbilityScoreDto> Abilities,
    IReadOnlyList<EquipmentItemDto> Equipment,
    IReadOnlyList<string> Features
);

public sealed record CreateCharacterRequest(
    string Name,
    string AncestryOrClan,
    string ClassOrArchetype,
    string SystemCode,
    int Level,
    Dictionary<string, int> AbilityScores
);

public sealed record LevelUpCharacterRequest(
    string SelectedFeature,
    string AbilityIncreaseCode,
    string ViewerRole
);

public sealed record ToggleEquipmentRequest(
    string EquipmentId,
    bool Equipped
);

public sealed record MapStampNodeDto(
    string Id,
    string Label,
    string Category,
    double X,
    double Z,
    double Scale,
    double RotationY,
    string ColorHex,
    string Visibility
);

public sealed record WaterSplineDto(
    string Id,
    string Name,
    double Width,
    string FlowColorHex,
    IReadOnlyList<double[]> Points
);

public sealed record LightNodeDto(
    string Id,
    string Label,
    double X,
    double Y,
    double Z,
    double Range,
    double Intensity,
    string ColorHex
);

public sealed record MapSceneGraphDto(
    string SceneKey,
    int CampaignId,
    string Name,
    string Biome,
    string WeatherPreset,
    string LightingProfile,
    int GridCols,
    int GridRows,
    int Revision,
    int ScatterSeed,
    int ScatterDensity,
    IReadOnlyList<MapStampNodeDto> Stamps,
    IReadOnlyList<WaterSplineDto> WaterSplines,
    IReadOnlyList<LightNodeDto> Lights
);

public sealed record MapSceneCommandRequest(
    string ToolId,
    string ActionType,
    double X,
    double Z,
    int Radius,
    int Intensity,
    int Seed,
    string? AssetName,
    string ViewerRole
);
