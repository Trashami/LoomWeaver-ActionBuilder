namespace LoomWeaver.Domain;

public enum AudienceVisibility
{
    Public,
    Players,
    Gm
}

public enum CanonStatus
{
    Approved,
    Draft
}

public enum AssetEntitlement
{
    Free,
    Included,
    Purchased,
    Locked
}

public sealed record CompositeEntityKey(int CampaignId, string EntityType, string EntityKey)
{
    public override string ToString() => $"{CampaignId}:{EntityType}:{EntityKey}";

    public static bool TryParse(string value, out CompositeEntityKey? parsed)
    {
        parsed = null;
        if (string.IsNullOrWhiteSpace(value)) return false;
        var parts = value.Split(':', 3, StringSplitOptions.TrimEntries);
        if (parts.Length != 3 || !int.TryParse(parts[0], out var cid)) return false;
        parsed = new CompositeEntityKey(cid, parts[1], parts[2]);
        return true;
    }
}

public sealed record CampaignDto(
    int Id,
    string Slug,
    string Name,
    string Subtitle,
    string SystemCode,
    string WorldName,
    string CurrentAct,
    int CurrentSessionNumber,
    string CurrentLocationName,
    bool WeaveEnabled
);

public sealed record EntitySummaryDto(
    string CompositeKey,
    int CampaignId,
    string EntityType,
    string EntityKey,
    string Name,
    string Subtitle,
    string Summary,
    string Visibility,
    string CanonStatus,
    string RouteLink
);

public sealed record GraphEdgeDto(
    string SourceKey,
    string TargetKey,
    string RelationshipType,
    string Visibility,
    string? Label
);

public sealed record GraphSubgraphDto(
    int CampaignId,
    string Namespace,
    string ViewerRole,
    IReadOnlyList<EntitySummaryDto> Nodes,
    IReadOnlyList<GraphEdgeDto> Edges
);

public sealed record LoomCitationDto(
    string CompositeKey,
    string Title,
    string EntityType,
    string Excerpt,
    string RouteLink,
    string Visibility
);

public sealed record LoomQueryResponseDto(
    int CampaignId,
    string Query,
    string ViewerRole,
    string SynthesizedAnswer,
    IReadOnlyList<LoomCitationDto> Citations
);

public sealed record AssetCardDto(
    string Id,
    string Name,
    string Category,
    string CreatorName,
    string Entitlement,
    string PriceLabel,
    int PriceCents,
    string? PreviewUrl,
    string Summary,
    string SystemCode
);

public sealed record SceneSummaryDto(
    string SceneKey,
    int CampaignId,
    string Name,
    string RegionName,
    string ModeSupport,
    int GridCols,
    int GridRows,
    string Biome,
    string WeatherPreset,
    string LightingProfile,
    string Visibility,
    int Revision
);

public sealed record CombatTelemetryDto(
    string CharacterKey,
    string CharacterName,
    string ClassSummary,
    int TotalDamageDealt,
    int DamageVsDragons,
    int DamageVsUndead,
    int DamageVsConstructs,
    int LastHits,
    int Natural20Count,
    int Natural1Count,
    int HealingDone,
    int CluesDiscovered,
    IReadOnlyDictionary<string, int> RadarScores
);

public sealed record SubscriptionTierDto(
    string Code,
    string Name,
    int MonthlyCents,
    int AnnualCents,
    int MaxActiveCampaigns,
    int StorageLimitMb,
    bool IncludesWeaveAi,
    int CreatorRoyaltyPct,
    string Summary
);
