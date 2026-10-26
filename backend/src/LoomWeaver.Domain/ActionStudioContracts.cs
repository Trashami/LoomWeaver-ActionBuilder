namespace LoomWeaver.Domain;

public sealed record RuleEngineMethodDescriptorDto(
    string MethodName,
    string Signature,
    string ReturnType,
    string Summary,
    IReadOnlyList<string> DefaultTokens
);

public sealed record RuleEngineSymbolDescriptorDto(
    string ClassName,
    string FilePath,
    string LayerLabel,
    string Summary,
    IReadOnlyList<RuleEngineMethodDescriptorDto> Methods
);

public sealed record RuleLogicClauseDto(
    string Id,
    string Keyword,
    IReadOnlyList<string> Tokens,
    string BoundClass,
    string BoundMethod,
    string Notes
);

public sealed record ActionScalingTierDto(
    string LevelRange,
    string DiceOrValue,
    string Label,
    string Summary
);

public sealed record CampaignActionRuleDto(
    string Id,
    string RuleCode,
    string Name,
    string Category,
    string SourceLabel,
    string RulesetCode,
    string Summary,
    string ActionCost,
    string ActionType,
    string RangeLabel,
    string TargetLabel,
    string AttackOrSaveLabel,
    string DamageOrEffectFormula,
    int SaveDc,
    int AcBonus,
    string DurationLabel,
    bool RequiresConcentration,
    string PrimaryClassName,
    string PrimaryMethodName,
    string SourceFilePath,
    IReadOnlyList<RuleLogicClauseDto> Clauses,
    IReadOnlyList<ActionScalingTierDto> ScalingTiers,
    IReadOnlyList<string> WorksWith,
    IReadOnlyList<string> ConflictsWith,
    IReadOnlyList<string> Tags,
    bool IsCustomizedForCampaign,
    string UpdatedByUsername,
    string UpdatedAt
);

public sealed record DmCampaignOptionDto(
    int Id,
    string Slug,
    string Name,
    string SystemCode,
    string RulesetLabel,
    long DmUserId,
    string DmUsername,
    string MyRole,
    int CustomizedRuleCount
);

public sealed record ActionStudioAccountOptionDto(
    long UserId,
    string AccountId,
    string Username,
    string DisplayName,
    string Email,
    string RoleSummary,
    bool OwnsDmCampaign,
    int DefaultDmCampaignId
);

public sealed record ActionStudioContextDto(
    long UserId,
    string Username,
    string DisplayName,
    string AccountRole,
    bool CanAccessActionBuilder,
    string? AccessDeniedReason,
    string? SwitchedFromPlayerCampaignNotice,
    DmCampaignOptionDto? ActiveCampaign,
    IReadOnlyList<DmCampaignOptionDto> DmCampaigns,
    IReadOnlyList<string> PlayerOnlyCampaignNames,
    IReadOnlyList<CampaignActionRuleDto> Rules,
    IReadOnlyList<RuleEngineSymbolDescriptorDto> EngineSymbols,
    IReadOnlyList<string> ClauseKeywords,
    IReadOnlyDictionary<string, IReadOnlyList<string>> TokenSuggestionsByKeyword,
    IReadOnlyList<ActionStudioAccountOptionDto> DemoAccounts
);

public sealed record ApplyCampaignRuleRequest(
    int CampaignId,
    CampaignActionRuleDto Rule
);

public sealed record ApplyCampaignRuleResponse(
    bool Success,
    string Message,
    int CampaignId,
    string CampaignName,
    CampaignActionRuleDto Rule,
    int CustomizedRuleCount
);

public sealed record ResetCampaignRuleRequest(
    int CampaignId,
    string RuleId
);

public sealed record CreateDmCampaignQuickRequest(
    string Name,
    string RulesetLabel
);

public sealed record EvaluateRuleLogicRequest(
    int CampaignId,
    string RuleId,
    string RuleName,
    string PrimaryClassName,
    string PrimaryMethodName,
    IReadOnlyList<RuleLogicClauseDto> Clauses,
    string ActionCost,
    string DamageOrEffectFormula,
    int SaveDc,
    int AcBonus,
    string AttackerName,
    string DefenderName,
    int AttackRollTotal,
    int TargetAc,
    int DistanceFeet,
    bool ReactionAvailable,
    bool HasSpellSlot,
    int DamageRolled
);

public sealed record RuleClauseTraceStepDto(
    int StepNumber,
    string Keyword,
    string ExpressionText,
    string BoundSymbol,
    bool Passed,
    string OutcomeDetail
);

public sealed record EvaluateRuleLogicResponse(
    string RuleId,
    string RuleName,
    bool Triggered,
    bool ConditionsPassed,
    string FinalResolutionSummary,
    string CombatLogPreview,
    int ComputedAcAfterRule,
    int ComputedDamageAfterRule,
    IReadOnlyList<RuleClauseTraceStepDto> TraceSteps,
    string Timestamp
);
