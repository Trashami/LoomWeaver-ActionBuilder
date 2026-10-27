using LoomWeaver.Domain;
using LoomWeaver.Modules.ActionStudio.Infrastructure;

namespace LoomWeaver.Modules.ActionStudio.Engine;

public sealed class EncounterReactionPipelineService(ActionStudioMySqlRepository repo)
{
    public async Task<EncounterAttackStepResponse> ExecuteAttackStepAsync(
        EncounterAttackStepRequest req,
        CancellationToken ct = default)
    {
        var campaignId = req.CampaignId > 0 ? req.CampaignId : 1;
        var allCampaignRules = await repo.GetRulesForCampaignAsync(campaignId, ct);

        // Effective rules: exclude any Core Engine rule that is currently bypassed by a Campaign Bypass rule
        var effectiveRules = allCampaignRules
            .Where(r => string.IsNullOrWhiteSpace(r.BypassedByRuleId))
            .ToList();

        var stepLogs = new List<string>
        {
            $"[Step 1 · Attack Roll ({req.RollMode.ToUpperInvariant()})] {req.AttackerName} uses '{req.ActionName}' against {req.TargetName} at {req.DistanceFeet} ft: rolled {req.AttackRollTotal} vs Base AC {req.TargetBaseAc} (Raw Damage: {req.RawDamage})."
        };

        var hitsBaseAc = req.AttackRollTotal >= req.TargetBaseAc;
        if (!hitsBaseAc)
        {
            stepLogs.Add($"[Step 2 · Resolution] Attack roll {req.AttackRollTotal} misses {req.TargetName}'s Base AC {req.TargetBaseAc}. No reaction needed.");
            return new EncounterAttackStepResponse(
                Phase: "Completed",
                RequiresReactionPrompt: false,
                PromptMessage: string.Empty,
                AvailableReactions: [],
                HitAfterReaction: false,
                EffectiveAc: req.TargetBaseAc,
                FinalDamage: 0,
                RetaliationDamage: 0,
                ReactionConsumed: false,
                AppliedReactionName: null,
                ConcentrationCheckTriggered: false,
                ConcentrationDc: 0,
                StepByStepLog: stepLogs,
                SummaryBanner: $"{req.AttackerName} missed {req.TargetName} ({req.AttackRollTotal} vs AC {req.TargetBaseAc}). 0 damage dealt."
            );
        }

        var reactionOptions = BuildEligibleReactions(effectiveRules, req);

        if (req.TargetReactionAvailable && !req.ReactionDecisionMade && reactionOptions.Count > 0)
        {
            stepLogs.Add($"[Step 2 · Reaction Window Open] {req.TargetName} is hit ({req.AttackRollTotal} vs AC {req.TargetBaseAc}) and has an unspent Reaction. Waiting for {req.TargetName} to select one of {reactionOptions.Count} eligible reactions or Decline.");
            return new EncounterAttackStepResponse(
                Phase: "ReactionPrompt",
                RequiresReactionPrompt: true,
                PromptMessage: $"{req.AttackerName} hit {req.TargetName} ({req.AttackRollTotal} vs AC {req.TargetBaseAc}) for {req.RawDamage} incoming damage! {req.TargetName} has 1 Reaction available — choose a reaction to apply to this attack:",
                AvailableReactions: reactionOptions,
                HitAfterReaction: true,
                EffectiveAc: req.TargetBaseAc,
                FinalDamage: req.RawDamage,
                RetaliationDamage: 0,
                ReactionConsumed: false,
                AppliedReactionName: null,
                ConcentrationCheckTriggered: false,
                ConcentrationDc: 0,
                StepByStepLog: stepLogs,
                SummaryBanner: $"Reaction Window Paused: Prompting {req.TargetName} to choose an available Reaction."
            );
        }

        int effectiveAc = req.TargetBaseAc;
        int finalDamage = req.RawDamage;
        int retaliationDamage = 0;
        bool reactionConsumed = false;
        string? appliedReactionName = null;

        var chosen = !string.IsNullOrWhiteSpace(req.SelectedReactionRuleId) &&
                     !string.Equals(req.SelectedReactionRuleId, "decline", StringComparison.OrdinalIgnoreCase)
            ? reactionOptions.FirstOrDefault(o => string.Equals(o.RuleId, req.SelectedReactionRuleId, StringComparison.OrdinalIgnoreCase))
            : null;

        if (chosen is not null && req.TargetReactionAvailable)
        {
            reactionConsumed = true;
            appliedReactionName = chosen.Name;
            effectiveAc += chosen.AcBonusDelta;

            var sourceTag = chosen.IsCampaignBypass ? "Campaign Bypass Rule" : "Core Engine Rule";
            stepLogs.Add($"[Step 2 · Reaction Triggered ({sourceTag})] {req.TargetName} spends 1 Reaction to use '{chosen.Name}'.");

            if (effectiveAc > req.AttackRollTotal)
            {
                finalDamage = 0;
                stepLogs.Add($"[Step 3 · Reaction Effect Applied] '{chosen.Name}' raises {req.TargetName}'s AC from {req.TargetBaseAc} to {effectiveAc}. Attack roll {req.AttackRollTotal} now MISSES! Incoming {req.RawDamage} damage reduced to 0.");
            }
            else
            {
                if (chosen.DamageReductionFlat > 0)
                {
                    var before = finalDamage;
                    finalDamage = Math.Max(0, finalDamage - chosen.DamageReductionFlat);
                    stepLogs.Add($"[Step 3 · Reaction Effect Applied] '{chosen.Name}' reduces incoming damage by {chosen.DamageReductionFlat} ({before} -> {finalDamage}).");
                }

                if (chosen.HalvesDamage)
                {
                    var before = finalDamage;
                    finalDamage = finalDamage / 2;
                    stepLogs.Add($"[Step 3 · Reaction Effect Applied] '{chosen.Name}' halves incoming damage ({before} -> {finalDamage}).");
                }

                if (chosen.RetaliationDamage > 0)
                {
                    retaliationDamage = chosen.RetaliationDamage;
                    stepLogs.Add($"[Step 3 · Reaction Effect Applied] '{chosen.Name}' inflicts {retaliationDamage} retaliatory damage back onto {req.AttackerName}!");
                }
            }
        }
        else if (!req.TargetReactionAvailable)
        {
            stepLogs.Add($"[Step 2 · Reaction Check] {req.TargetName} has already spent their Reaction this round. Proceeding directly to damage.");
        }
        else
        {
            stepLogs.Add($"[Step 2 · Reaction Declined] {req.TargetName} declines to use a Reaction (keeping Reaction available).");
        }

        bool hitAfterReaction = finalDamage > 0 || effectiveAc <= req.AttackRollTotal;
        if (effectiveAc > req.AttackRollTotal)
        {
            hitAfterReaction = false;
        }

        // Step 4: Complete remaining rules (Concentration Saving Throw, etc.)
        bool concentrationTriggered = false;
        int concentrationDc = 0;
        if (finalDamage > 0 && req.TargetIsConcentrating)
        {
            concentrationTriggered = true;
            concentrationDc = Math.Max(10, finalDamage / 2);
            stepLogs.Add($"[Step 4 · Remaining Rules (Concentration Save)] {req.TargetName} took {finalDamage} damage while concentrating -> must make a DC {concentrationDc} Constitution saving throw (max(10, floor({finalDamage}/2))).");
        }
        else
        {
            stepLogs.Add($"[Step 4 · Remaining Rules Completed] Final HP reduction applied to {req.TargetName}: {finalDamage} damage{(retaliationDamage > 0 ? $" ({req.AttackerName} takes {retaliationDamage} retaliation damage)" : string.Empty)}.");
        }

        var summary = appliedReactionName is not null
            ? (!hitAfterReaction
                ? $"{req.TargetName} used Reaction '{appliedReactionName}' (+{chosen!.AcBonusDelta} AC -> AC {effectiveAc}), turning {req.AttackerName}'s {req.AttackRollTotal} hit into a MISS (0 dmg)!"
                : $"{req.TargetName} used Reaction '{appliedReactionName}': incoming damage adjusted from {req.RawDamage} to {finalDamage} dmg{(retaliationDamage > 0 ? $" + {retaliationDamage} retaliation to {req.AttackerName}" : string.Empty)}.")
            : $"{req.AttackerName} hit {req.TargetName} ({req.AttackRollTotal} vs AC {effectiveAc}) for {finalDamage} damage.";

        return new EncounterAttackStepResponse(
            Phase: "Completed",
            RequiresReactionPrompt: false,
            PromptMessage: string.Empty,
            AvailableReactions: reactionOptions,
            HitAfterReaction: hitAfterReaction,
            EffectiveAc: effectiveAc,
            FinalDamage: finalDamage,
            RetaliationDamage: retaliationDamage,
            ReactionConsumed: reactionConsumed,
            AppliedReactionName: appliedReactionName,
            ConcentrationCheckTriggered: concentrationTriggered,
            ConcentrationDc: concentrationDc,
            StepByStepLog: stepLogs,
            SummaryBanner: summary
        );
    }

    private static IReadOnlyList<EncounterReactionOptionDto> BuildEligibleReactions(
        IReadOnlyList<CampaignActionRuleDto> effectiveRules,
        EncounterAttackStepRequest req)
    {
        var list = new List<EncounterReactionOptionDto>();

        foreach (var rule in effectiveRules)
        {
            var isReaction = rule.ActionCost.Contains("Reaction", StringComparison.OrdinalIgnoreCase) ||
                             rule.Tags.Any(t => t.Equals("Reaction", StringComparison.OrdinalIgnoreCase));
            if (!isReaction) continue;

            // Skip movement-only opportunity attacks or spell-only counterspells when resolving a standard attack hit
            if (rule.RuleCode.Contains("OpportunityAttack", StringComparison.OrdinalIgnoreCase) ||
                rule.RuleCode.Contains("Sentinel", StringComparison.OrdinalIgnoreCase) ||
                rule.RuleCode.Contains("Counterspell", StringComparison.OrdinalIgnoreCase) ||
                rule.RuleCode.Contains("ReadyAction", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var textBlob = $"{rule.Name} {rule.DamageOrEffectFormula} {rule.Summary} {string.Join(' ', rule.Clauses.SelectMany(c => c.Tokens))}";
            int acDelta = Math.Max(0, rule.AcBonus);
            bool halves = textBlob.Contains("halve", StringComparison.OrdinalIgnoreCase) ||
                          textBlob.Contains("floor(", StringComparison.OrdinalIgnoreCase) ||
                          textBlob.Contains("Resistance", StringComparison.OrdinalIgnoreCase);

            int flatRed = 0;
            if (rule.RuleCode.Contains("Deflect", StringComparison.OrdinalIgnoreCase) ||
                textBlob.Contains("Reduce Damage by 10", StringComparison.OrdinalIgnoreCase) ||
                textBlob.Contains("1d10 + DEX", StringComparison.OrdinalIgnoreCase))
            {
                flatRed = 10;
            }

            int retaliation = 0;
            if (rule.RuleCode.Contains("HellishRebuke", StringComparison.OrdinalIgnoreCase) ||
                textBlob.Contains("Retaliation", StringComparison.OrdinalIgnoreCase))
            {
                retaliation = 11;
            }

            bool turnsIntoMiss = acDelta > 0 && (req.TargetBaseAc + acDelta) > req.AttackRollTotal;
            int previewDmg = req.RawDamage;
            if (turnsIntoMiss)
            {
                previewDmg = 0;
            }
            else
            {
                if (flatRed > 0) previewDmg = Math.Max(0, previewDmg - flatRed);
                if (halves) previewDmg /= 2;
            }

            var effectParts = new List<string>();
            if (acDelta > 0)
            {
                effectParts.Add(turnsIntoMiss
                    ? $"+{acDelta} AC -> AC {req.TargetBaseAc + acDelta} (Turns Hit into MISS!)"
                    : $"+{acDelta} AC -> AC {req.TargetBaseAc + acDelta} (Still Hits)");
            }
            if (flatRed > 0 && !turnsIntoMiss)
            {
                effectParts.Add($"Reduce dmg by {flatRed} ({req.RawDamage} -> {previewDmg})");
            }
            if (halves && !turnsIntoMiss)
            {
                effectParts.Add($"Halve dmg ({req.RawDamage} -> {previewDmg})");
            }
            if (retaliation > 0)
            {
                effectParts.Add($"Deal {retaliation} Fire dmg to {req.AttackerName}");
            }
            if (effectParts.Count == 0)
            {
                effectParts.Add(rule.DamageOrEffectFormula);
            }

            list.Add(new EncounterReactionOptionDto(
                RuleId: rule.Id,
                RuleCode: rule.RuleCode,
                Name: rule.Name,
                SourceLabel: rule.SourceLabel,
                IsCampaignBypass: !rule.IsCoreEngineRule && rule.IsCustomizedForCampaign,
                TriggerSummary: "When an attack hits you",
                EffectPreviewLabel: string.Join(" · ", effectParts),
                AcBonusDelta: acDelta,
                DamageReductionFlat: flatRed,
                HalvesDamage: halves,
                RetaliationDamage: retaliation,
                TurnsHitIntoMiss: turnsIntoMiss
            ));
        }

        return list;
    }
}
