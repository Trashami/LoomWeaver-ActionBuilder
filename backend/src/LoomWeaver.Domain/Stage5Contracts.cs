namespace LoomWeaver.Domain;

public sealed record ScopedCampaignNoteContract(
    string Id,
    int CampaignId,
    string Title,
    string Content,
    string Scope,
    string AuthorName,
    string WitnessCharacter,
    int SessionNumber,
    string DeepLinkRoute,
    IReadOnlyList<string> LinkedEntityKeys,
    DateTimeOffset CreatedAt
);

public sealed record CreateScopedNoteRequest(
    string Title,
    string Content,
    string Scope,
    string AuthorName,
    string WitnessCharacter,
    int SessionNumber,
    string? DeepLinkRoute,
    IReadOnlyList<string>? LinkedEntityKeys
);

public sealed record LoomGraphRagRequest(
    string Query,
    string Role,
    string? WitnessCharacter,
    bool IncludePrivateNotes = true
);

public sealed record LoomGraphPathDto(
    string PathSummary,
    string SourceKey,
    string RelationshipType,
    string TargetKey,
    string Visibility
);

public sealed record LoomGraphRagResponse(
    int CampaignId,
    string Query,
    string ViewerRole,
    string WitnessCharacter,
    string Synthesis,
    IReadOnlyList<LoomCitationDto> Citations,
    IReadOnlyList<LoomGraphPathDto> GraphPaths,
    IReadOnlyList<ScopedCampaignNoteContract> MatchingNotes
);

public sealed record WeaveDraftContract(
    string Id,
    string CompositeKey,
    string Category,
    string Name,
    string Subtitle,
    string Summary,
    string GroundedContext,
    IReadOnlyList<string> SuggestedEdges,
    string Status,
    string Visibility
);

public sealed record WeaveGenerateRequest(
    string Category,
    string Prompt,
    string? GroundedLocation,
    string? Visibility
);

public sealed record WeaveReviewRequest(
    string Action,
    string? UpdatedName,
    string? UpdatedSummary,
    string? RefinementNote
);

public sealed record QuestStepContract(
    string StepId,
    string Description,
    string LocationName,
    bool Completed
);

public sealed record MultiStepQuestContract(
    string Id,
    string Title,
    string QuestGiver,
    string OriginLocation,
    string CompletionLocation,
    string Prerequisites,
    int XpReward,
    string Status,
    IReadOnlyList<string> ClueKeys,
    IReadOnlyList<QuestStepContract> Steps
);

public sealed record MarketplaceCreatorModuleContract(
    string Id,
    string Title,
    string CreatorHandle,
    string Category,
    double PriceUsd,
    double CreatorShareUsd,
    double PlatformShareUsd,
    string RoyaltySplitLabel,
    int PopularityImports,
    double Rating,
    string Summary,
    IReadOnlyList<string> IncludedItems,
    bool Installed
);

public sealed record SessionDeepLinkContract(
    string Label,
    string Route,
    string EntityKey
);

public sealed record SessionRecapContract(
    string Id,
    int CampaignId,
    int SessionNumber,
    string Title,
    string LocationName,
    string DateLabel,
    int XpAwarded,
    string Summary,
    IReadOnlyList<string> Highlights,
    IReadOnlyList<SessionDeepLinkContract> DeepLinks
);

public sealed record CreateSessionRecapRequest(
    int SessionNumber,
    string Title,
    string LocationName,
    int XpAwarded,
    string Summary,
    IReadOnlyList<string>? Highlights
);

