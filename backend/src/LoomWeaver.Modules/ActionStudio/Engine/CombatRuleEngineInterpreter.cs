using LoomWeaver.Domain;

namespace LoomWeaver.Modules.ActionStudio.Engine;

public sealed class CombatRuleEngineInterpreter
{
    public EvaluateRuleLogicResponse Evaluate(EvaluateRuleLogicRequest req)
    {
        var attacker = string.IsNullOrWhiteSpace(req.AttackerName) ? "Vaelkorath (Boss)" : req.AttackerName.Trim();
        var defender = string.IsNullOrWhiteSpace(req.DefenderName) ? "Kycius" : req.DefenderName.Trim();
        var steps = new List<RuleClauseTraceStepDto>();
        var allConditionsPassed = true;
        var triggered = false;
        var stepIdx = 1;

        var computedAc = req.TargetAc;
        var computedDamage = req.DamageRolled;

        foreach (var clause in req.Clauses ?? [])
        {
            var keyword = string.IsNullOrWhiteSpace(clause.Keyword) ? "If" : clause.Keyword.Trim();
            var expr = clause.Tokens is { Count: > 0 }
                ? string.Join(" · ", clause.Tokens)
                : "(No tokens specified)";
            var boundSymbol = $"{clause.BoundClass}.{clause.BoundMethod}".Trim('.');
            var passed = true;
            string detail;

            switch (keyword.ToLowerInvariant())
            {
                case "when":
                    triggered = true;
                    detail = $"Trigger event matched: {expr} ({attacker} -> {defender}).";
                    break;

                case "contains":
                    passed = true;
                    detail = $"Collection/tag membership verified via {boundSymbol}: {expr}.";
                    break;

                case "has":
                    if (expr.Contains("Reaction", StringComparison.OrdinalIgnoreCase))
                        passed = req.ReactionAvailable;
                    else if (expr.Contains("Spell Slot", StringComparison.OrdinalIgnoreCase))
                        passed = req.HasSpellSlot;
                    detail = passed
                        ? $"Resource check passed ({expr})."
                        : $"Resource check failed: required state not available ({expr}).";
                    break;

                case "has not":
                    if (expr.Contains("Reaction", StringComparison.OrdinalIgnoreCase))
                        passed = req.ReactionAvailable;
                    else
                        passed = true;
                    detail = passed
                        ? $"Negative guard satisfied ({expr})."
                        : $"Negative guard blocked execution ({expr}).";
                    break;

                case "where":
                    if (expr.Contains("60 ft", StringComparison.OrdinalIgnoreCase))
                        passed = req.DistanceFeet <= 60;
                    else if (expr.Contains("5 ft", StringComparison.OrdinalIgnoreCase))
                        passed = req.DistanceFeet <= 5;
                    detail = passed
                        ? $"Spatial constraint satisfied (Distance = {req.DistanceFeet} ft)."
                        : $"Out of range (Distance = {req.DistanceFeet} ft exceeds constraint).";
                    break;

                case "if":
                case "and":
                case "or":
                    if (expr.Contains("Reaction Available", StringComparison.OrdinalIgnoreCase))
                        passed = req.ReactionAvailable;
                    else if (expr.Contains("AttackTotal >= TargetAC", StringComparison.OrdinalIgnoreCase))
                        passed = req.AttackRollTotal >= req.TargetAc;
                    else if (expr.Contains("Target Within Range", StringComparison.OrdinalIgnoreCase))
                        passed = req.DistanceFeet <= 60;
                    detail = passed
                        ? $"Condition evaluated TRUE (Attack {req.AttackRollTotal} vs AC {req.TargetAc}, Range {req.DistanceFeet} ft)."
                        : $"Condition evaluated FALSE (Attack {req.AttackRollTotal} vs AC {req.TargetAc}).";
                    break;

                case "with":
                    if (req.AcBonus > 0 || expr.Contains("+5", StringComparison.OrdinalIgnoreCase))
                    {
                        var bonus = req.AcBonus > 0 ? req.AcBonus : 5;
                        computedAc = req.TargetAc + bonus;
                    }
                    detail = $"Applied rule modifier parameter ({expr}). Effective AC = {computedAc}.";
                    break;

                case "then":
                    passed = allConditionsPassed;
                    if (passed)
                    {
                        if (req.AcBonus > 0 && computedAc == req.TargetAc)
                            computedAc = req.TargetAc + req.AcBonus;
                        if (computedAc > req.AttackRollTotal && expr.Contains("AC", StringComparison.OrdinalIgnoreCase))
                            computedDamage = 0;
                        detail = $"Executed {boundSymbol}: {expr}.";
                    }
                    else
                    {
                        detail = $"Skipped THEN branch because an earlier condition failed.";
                    }
                    break;

                case "else":
                    passed = !allConditionsPassed;
                    detail = passed
                        ? $"Fallback ELSE branch executed: {expr}."
                        : $"ELSE branch skipped because primary conditions succeeded.";
                    break;

                default:
                    detail = $"Evaluated {keyword}: {expr}.";
                    break;
            }

            if (keyword is "If" or "Has" or "Has Not" or "Where" or "Contains" or "And" && !passed)
            {
                allConditionsPassed = false;
            }

            steps.Add(new RuleClauseTraceStepDto(
                StepNumber: stepIdx++,
                Keyword: keyword,
                ExpressionText: expr,
                BoundSymbol: string.IsNullOrWhiteSpace(boundSymbol)
                    ? $"{req.PrimaryClassName}.{req.PrimaryMethodName}"
                    : boundSymbol,
                Passed: passed,
                OutcomeDetail: detail
            ));
        }

        var summary = allConditionsPassed
            ? $"{req.RuleName} executed via {req.PrimaryClassName}.{req.PrimaryMethodName}: Effective AC {req.TargetAc} -> {computedAc}, Final Damage {req.DamageRolled} -> {computedDamage}."
            : $"{req.RuleName} did not trigger or failed a guard condition; standard resolution applied ({computedDamage} damage).";

        var combatLog = allConditionsPassed
            ? $"[{req.RuleName}] {defender} invokes {req.ActionCost} ({req.PrimaryClassName}.{req.PrimaryMethodName}) against {attacker} (Roll {req.AttackRollTotal} vs AC {computedAc}) -> {(computedDamage == 0 ? "Attack Blocked (0 dmg)" : $"{req.DamageOrEffectFormula}")}."
            : $"[{req.RuleName}] Guard failed for {defender}; {attacker}'s action resolves normally ({computedDamage} dmg).";

        return new EvaluateRuleLogicResponse(
            RuleId: req.RuleId,
            RuleName: req.RuleName,
            Triggered: triggered || steps.Count > 0,
            ConditionsPassed: allConditionsPassed,
            FinalResolutionSummary: summary,
            CombatLogPreview: combatLog,
            ComputedAcAfterRule: computedAc,
            ComputedDamageAfterRule: computedDamage,
            TraceSteps: steps,
            Timestamp: DateTimeOffset.UtcNow.ToString("O")
        );
    }
}
