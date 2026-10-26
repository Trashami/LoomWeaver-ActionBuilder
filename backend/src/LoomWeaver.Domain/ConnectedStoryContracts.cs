namespace LoomWeaver.Domain;

public sealed record EntityRelationshipDto(
    long Id,
    int CampaignId,
    string FromCompositeKey,
    string FromName,
    string FromType,
    string RelationshipType,
    string ToCompositeKey,
    string ToName,
    string ToType,
    string WhyIncludedLabel,
    string Visibility,
    string? SourceRecordId,
    long? ValidFromEventId,
    long? ValidUntilEventId,
    int Revision,
    bool IsHistorical
);

public sealed record StoryClaimDto(
    string Id,
    int CampaignId,
    string CompositeKey,
    string Title,
    string Statement,
    string TruthAssessment,
    string? GmCanonicalTruth,
    string? SupportingSourceKey,
    string SupportingSourceLabel,
    string? ContradictingSourceKey,
    string ContradictingSourceLabel,
    string? DocumentedLoreId,
    string DocumentedLoreTitle,
    string? ImplicatedEntityKey,
    string ImplicatedEntityName,
    string Visibility,
    IReadOnlyList<string> KnownByCharacters,
    int Revision
);

public sealed record ConnectedChainStepDto(
    string StepId,
    string StepRole,
    string CompositeKey,
    string Title,
    string Subtitle,
    string QuestionAnswered,
    string RelationLabel,
    string? TruthAssessment,
    string RouteLink,
    string Visibility,
    IReadOnlyList<string> KnownByCharacters
);

public sealed record ConnectedStoryChainDto(
    string ChainId,
    string Title,
    string Subtitle,
    string ScopeNodeId,
    IReadOnlyList<ConnectedChainStepDto> Steps,
    IReadOnlyList<StoryClaimDto> Claims,
    IReadOnlyList<EntityRelationshipDto> Relationships,
    int PendingOutboxCount,
    int ProjectedRelationshipCount
);

public sealed record StoryBeatItemDto(
    string Id,
    string ActId,
    string Code,
    string Title,
    string Kind,
    string Status,
    string ScopeKind,
    string ScopeNodeId,
    string LinkedLocationKey,
    string RouteLink,
    string Visibility
);

public sealed record StoryActColumnDto(
    string Id,
    string RomanNumeral,
    string Title,
    string Subtitle,
    string Status,
    string Synopsis,
    int CompletedCount,
    int TotalCount,
    IReadOnlyList<StoryBeatItemDto> Beats
);

public sealed record StorySessionSequenceItemDto(
    string SessionId,
    int SessionNumber,
    string Title,
    string LocationLabel,
    string DateLabel,
    string Status,
    string ArtworkUrl,
    string ScopeNodeId
);

public sealed record StoryLoreClueFeedItemDto(
    string Id,
    string CompositeKey,
    string Title,
    string KindLabel,
    string KindTone,
    string Summary,
    string RelativeTime,
    string? TruthAssessment,
    string RouteLink,
    string? LoreEntryId
);

public sealed record StoryConnectedLinkItemDto(
    string CompositeKey,
    string Title,
    string Subtitle,
    string RouteLink,
    string? LocationKey
);

public sealed record StoryConnectedGroupDto(
    string Category,
    string IconName,
    string Tone,
    IReadOnlyList<StoryConnectedLinkItemDto> Items
);

public sealed record CampaignStoryWorkspaceDto(
    int CampaignId,
    string CampaignTitle,
    string CampaignSubtitle,
    string HeroArtworkUrl,
    string CurrentActLabel,
    string CurrentActSub,
    string NextSessionLabel,
    string NextSessionSub,
    string TotalSessionsLabel,
    string TotalSessionsSub,
    string ActiveBeatId,
    string ActiveBeatTitle,
    IReadOnlyList<StoryActColumnDto> Acts,
    IReadOnlyList<StorySessionSequenceItemDto> SessionSequence,
    IReadOnlyList<StoryLoreClueFeedItemDto> LoreAndClues,
    IReadOnlyList<StoryConnectedGroupDto> ConnectedGroups,
    ConnectedStoryChainDto ActiveStoryChain
);

public sealed record UpdateClaimTruthRequest(
    string TruthAssessment,
    string? GmCanonicalTruth,
    string? Statement
);

public sealed record CreateStoryRelationshipRequest(
    string FromCompositeKey,
    string RelationshipType,
    string ToCompositeKey,
    string? WhyIncludedLabel,
    string? Visibility,
    string? SourceRecordId,
    bool MarkPreviousHistorical = false
);

public sealed record CreateStoryBeatRequest(
    string ActId,
    string Title,
    string? Kind,
    string? Status,
    string? LinkedLocationKey
);

public sealed record ToggleStoryBeatStatusRequest(
    string? NextStatus
);
