namespace LoomWeaver.Domain;

public sealed record AdventureBreadcrumbDto(
    string NodeId,
    string ScopeKind,
    string Label,
    string? AreaKey
);

public sealed record AdventureRoomExitDto(
    string TargetNodeId,
    string TargetTitle,
    string? TargetAreaKey,
    string DirectionLabel,
    string Visibility
);

public sealed record AdventureReadAloudBlockDto(
    string BlockId,
    string NodeId,
    string Title,
    string Content,
    string Audience,
    bool Shareable,
    bool SharedWithPlayers
);

public sealed record AdventureSkillCheckDto(
    string BlockId,
    string NodeId,
    string Title,
    string SkillLabel,
    int Dc,
    string PassOutcome,
    string FailOutcome,
    string ResolutionState
);

public sealed record AdventureMapRegionChipDto(
    string RegionId,
    string RoomNodeId,
    string AreaKey,
    string Title,
    string LinkedSceneKey,
    string RouteLink,
    string Visibility
);

public sealed record AdventureAssignedBattlemapDto(
    string SceneKey,
    string Title,
    string SessionId,
    string SessionTitle,
    string LocationNodeId,
    string LocationTitle,
    string? AreaKey,
    string ArtworkUrl,
    string RouteLink,
    string VttRouteLink,
    IReadOnlyList<AdventureMapRegionChipDto> ClickableRegions
);

public sealed record AdventureGuideNpcItemDto(
    string NodeId,
    string CompositeKey,
    string Name,
    string Role,
    string DispositionLabel,
    string DispositionTone,
    string Initials,
    string RingColor,
    string ArtworkUrl,
    string Motive,
    string DialogueExcerpt,
    string WhyIncluded,
    string ProgressState,
    string RouteLink,
    string Visibility
);

public sealed record AdventureGuideEncounterItemDto(
    string NodeId,
    string CompositeKey,
    string Title,
    string Subtitle,
    string Difficulty,
    int XpReward,
    string Trigger,
    string TerrainNotes,
    string TacticsSummary,
    string AssignedSceneKey,
    string WhyIncluded,
    string ProgressState,
    string RouteLink,
    string VttRouteLink,
    string Visibility
);

public sealed record AdventureGuideElementItemDto(
    string NodeId,
    string CompositeKey,
    string ElementKind,
    string? AreaKey,
    string Title,
    string Subtitle,
    string Summary,
    string ArtworkUrl,
    string WhyIncluded,
    string ProgressState,
    string RouteLink,
    string Visibility,
    int XpReward = 0,
    string CurrencyOrItemLabel = "",
    bool RewardAwarded = false
);

public sealed record AdventureSessionBeatItemDto(
    string Id,
    string NodeId,
    string Label,
    bool Done,
    string ProgressState,
    string OutcomeNotes,
    string? LinkedRoomNodeId
);

public sealed record AdventureScopeOptionDto(
    string Id,
    string ScopeKind,
    string? AreaKey,
    string Title,
    string Subtitle,
    string? ParentId
);

public sealed record AdventurePlayEventDto(
    string Id,
    string EventKind,
    string ActorLabel,
    string Summary,
    string RelativeTime
);

public sealed record ContextualAdventureGuideDto(
    int CampaignId,
    string AdventureId,
    string AdventureVersionId,
    string AdventureTitle,
    string ActiveScopeKind,
    string ActiveScopeId,
    string ActiveSessionId,
    int ActiveSessionNumber,
    string HeaderTitle,
    string HeaderSubtitle,
    string ArtworkUrl,
    string Epigraph,
    string Summary,
    string ImmediateSituation,
    string SensoryDescription,
    string? ActiveAreaKey,
    IReadOnlyList<AdventureBreadcrumbDto> Breadcrumbs,
    IReadOnlyList<AdventureScopeOptionDto> AvailableSessions,
    IReadOnlyList<AdventureScopeOptionDto> AvailableLocations,
    IReadOnlyList<AdventureScopeOptionDto> AvailableRooms,
    IReadOnlyList<AdventureReadAloudBlockDto> ReadAloudBlocks,
    IReadOnlyList<AdventureRoomExitDto> Exits,
    IReadOnlyList<AdventureSkillCheckDto> SkillChecks,
    AdventureAssignedBattlemapDto AssignedBattlemap,
    IReadOnlyList<AdventureSessionBeatItemDto> Beats,
    IReadOnlyList<AdventureGuideNpcItemDto> KeyNpcs,
    IReadOnlyList<AdventureGuideEncounterItemDto> Encounters,
    IReadOnlyList<AdventureGuideElementItemDto> CluesAndHazards,
    IReadOnlyList<AdventureGuideElementItemDto> TreasuresAndRewards,
    IReadOnlyList<string> Secrets,
    IReadOnlyList<AdventureGuideElementItemDto> NotesTabItems,
    IReadOnlyList<AdventureGuideNpcItemDto> NpcsTabItems,
    IReadOnlyList<AdventureGuideElementItemDto> PlacesTabItems,
    IReadOnlyList<AdventureGuideElementItemDto> LoreTabItems,
    IReadOnlyList<AdventurePlayEventDto> RecentPlayEvents
);

public sealed record UpdateNodeProgressStateRequest(
    string ProgressState,
    string? OutcomeNotes,
    string? Role
);

public sealed record GrantAdventureKnowledgeRequest(
    string TargetId,
    string TargetTitle,
    string GrantedToScope,
    string? CharacterKey
);

public sealed record AwardAdventureRewardRequest(
    string NodeId,
    string IdempotencyKey,
    int XpAmount,
    string CurrencyOrItemLabel
);

public sealed record CreateAdventureNpcRequest(
    string Name,
    string Role,
    string DispositionLabel,
    string? Motive,
    string? DialogueExcerpt,
    string? ArtworkUrl,
    string? SessionId,
    string? LocationNodeId,
    string? Visibility
);

public sealed record AssignBattlemapToAdventureRequest(
    string SceneKey,
    string SceneTitle,
    string SessionId,
    string LocationNodeId,
    string? ArtworkUrl,
    string? Biome
);
