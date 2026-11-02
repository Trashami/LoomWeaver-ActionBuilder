using LoomWeaver.Domain;

namespace LoomWeaver.Modules.ActionStudio.Domain;

public static class ActionResolutionStepBuilder
{
    private static readonly string[] PriorityRuleNames =
    [
        "Attack",
        "Cast a Spell",
        "Dash",
        "Disengage",
        "Dodge",
        "Opportunity Attack",
        "Shield",
        "Counterspell",
        "Fireball",
        "Healing Word",
        "Find Familiar",
        "Summon Elemental",
        "Wild Shape",
        "Polymorph",
        "Sneak Attack",
        "Concentration Saving Throw"
    ];

    public static int GetPriorityRank(CampaignActionRuleDto rule)
    {
        for (int i = 0; i < PriorityRuleNames.Length; i++)
        {
            if (string.Equals(rule.Name, PriorityRuleNames[i], StringComparison.OrdinalIgnoreCase))
            {
                return i;
            }
        }
        if (rule.IsCustomizedForCampaign && !rule.IsCoreEngineRule) return -10 + iRank(rule.Name);
        if (!string.Equals(rule.Category, "Spells", StringComparison.OrdinalIgnoreCase)) return 50;
        return 100;
    }

    private static int iRank(string name) => string.IsNullOrEmpty(name) ? 0 : 1;

    public static CampaignActionRuleDto EnsureResolutionSteps(CampaignActionRuleDto rule)
    {
        if (rule.ResolutionSteps is { Count: > 0 })
        {
            return rule;
        }
        return rule with { ResolutionSteps = BuildDefaultSteps(rule) };
    }

    public static IReadOnlyList<ActionResolutionStepDto> BuildDefaultSteps(CampaignActionRuleDto rule)
    {
        var nameLower = (rule.Name ?? string.Empty).Trim().ToLowerInvariant();
        var summaryLower = (rule.Summary ?? string.Empty).ToLowerInvariant();
        var costLower = (rule.ActionCost ?? string.Empty).ToLowerInvariant();
        var isReaction = costLower.Contains("reaction");
        var isSpell = string.Equals(rule.Category, "Spells", StringComparison.OrdinalIgnoreCase) ||
                      (rule.ActionType ?? string.Empty).Contains("Spell", StringComparison.OrdinalIgnoreCase) ||
                      (rule.ActionType ?? string.Empty).Contains("Level", StringComparison.OrdinalIgnoreCase) ||
                      (rule.ActionType ?? string.Empty).Contains("Cantrip", StringComparison.OrdinalIgnoreCase);

        // 1. Standard Weapon / Unarmed Attack (matches Image 1 step-for-step!)
        if (nameLower is "attack" or "melee attack" or "ranged attack" || rule.Id.Equals("rule-attack-action", StringComparison.OrdinalIgnoreCase))
        {
            return
            [
                new(
                    Id: $"{rule.Id}-step-1",
                    Order: 1,
                    StepType: "CHECK",
                    Title: "Check requirements",
                    Subtitle: "Weapon equipped · Target in range · Attacker can act",
                    CheckMode: "ALL",
                    Requirements: ["Weapon equipped", "Target in range", "Attacker can act"]
                ),
                new(
                    Id: $"{rule.Id}-step-2",
                    Order: 2,
                    StepType: "PROMPT",
                    Title: "Choose target",
                    Subtitle: "Ask the player to select one creature.",
                    PromptTarget: "Caster / Attacker",
                    PromptTrigger: "When attacking",
                    PromptMessage: "Ask the player to select one creature within weapon range.",
                    ContinueMode: "Immediately after selection",
                    PromptOptions: ["Select creature in weapon range", "Declare attack mode (Standard / Two-Handed / Off-Hand)"]
                ),
                new(
                    Id: $"{rule.Id}-step-3",
                    Order: 3,
                    StepType: "ROLL",
                    Title: "Roll attack",
                    Subtitle: "d20 + attack modifier vs. target AC",
                    RollActor: "Caster / Attacker",
                    RollType: "Attack Roll vs Target AC",
                    RollFormula: "d20 + attack modifier vs. target AC"
                ),
                new(
                    Id: $"{rule.Id}-step-4",
                    Order: 4,
                    StepType: "BRANCH",
                    Title: "On a hit: offer reactions",
                    Subtitle: "Pause for eligible reactions before applying damage.",
                    PromptTarget: "Eligible creatures",
                    PromptTrigger: "On a hit: before applying damage",
                    PromptMessage: "Attack hits! Prompt target or eligible creatures to use an available Reaction (e.g. Shield, Parry, Deflect Attacks, Uncanny Dodge).",
                    ContinueMode: "After responses or timeout",
                    PromptOptions: ["Shield (+5 AC)", "Deflect Attacks / Parry (Reduce damage)", "Uncanny Dodge (Halve damage)", "Decline reaction"]
                ),
                new(
                    Id: $"{rule.Id}-step-5",
                    Order: 5,
                    StepType: "EFFECT",
                    Title: "Resolve result",
                    Subtitle: "Apply weapon damage on hit or no damage on miss.",
                    IfCondition: "On Hit (Attack >= Target AC)",
                    ThenEffects:
                    [
                        new("eff-hit-1", "Roll weapon damage", "Caster / Attacker", string.IsNullOrWhiteSpace(rule.DamageOrEffectFormula) ? "1d8 + STR/DEX" : rule.DamageOrEffectFormula, "Weapon damage"),
                        new("eff-hit-2", "Apply damage", "Target(s)", string.IsNullOrWhiteSpace(rule.DamageOrEffectFormula) ? "1d8 + STR/DEX" : rule.DamageOrEffectFormula, "Weapon damage")
                    ],
                    ElseCondition: "On Miss",
                    ElseEffects:
                    [
                        new("eff-miss-1", "No damage", "Target(s)", "0", "None")
                    ]
                )
            ];
        }

        // 2. Summoning Spells (Find Familiar, Summon Elemental, Summon Fey, Spiritual Weapon, Conjure *, Find Steed, Animate Dead)
        bool isSummonSpell = nameLower.Contains("familiar") || nameLower.Contains("summon ") ||
                             nameLower.Contains("conjure ") || nameLower.Contains("spiritual weapon") ||
                             nameLower.Contains("find steed") || nameLower.Contains("unseen servant") ||
                             nameLower.Contains("faithful hound") || nameLower.Contains("animate dead") ||
                             summaryLower.Contains("summon") && summaryLower.Contains("unoccupied space");

        if (isSummonSpell)
        {
            var tokenLabel = nameLower.Contains("familiar")
                ? "Familiar Token (Owl, Cat, Imp, or Fey Spirit)"
                : nameLower.Contains("elemental")
                    ? "Elemental Spirit Token (Air, Earth, Fire, or Water)"
                    : nameLower.Contains("spiritual weapon")
                        ? "Spectral Weapon Token"
                        : $"{rule.Name} Summoned Token";

            return
            [
                new(
                    Id: $"{rule.Id}-step-1",
                    Order: 1,
                    StepType: "CHECK",
                    Title: "Check casting requirements",
                    Subtitle: $"{rule.ActionCost} · Spell slot & components available · Unoccupied space in {rule.RangeLabel}",
                    CheckMode: "ALL",
                    Requirements: [$"{rule.ActionCost} available", "Spell slot or ritual available", $"Unoccupied space within {rule.RangeLabel}"]
                ),
                new(
                    Id: $"{rule.Id}-step-2",
                    Order: 2,
                    StepType: "PROMPT",
                    Title: "Prompt caster for summon form & placement",
                    Subtitle: $"Ask caster to choose token form and placement within {rule.RangeLabel}.",
                    PromptTarget: "Caster / Attacker",
                    PromptTrigger: "When casting",
                    PromptMessage: $"Choose summoned creature form and select an unoccupied space within {rule.RangeLabel} to place the token.",
                    ContinueMode: "Immediately after selection",
                    PromptOptions: [tokenLabel, $"Place within {rule.RangeLabel}", "Place adjacent to Caster (5 ft)"]
                ),
                new(
                    Id: $"{rule.Id}-step-3",
                    Order: 3,
                    StepType: "SPAWN_TOKEN",
                    Title: "Spawn token on map",
                    Subtitle: $"Prompt caster to place '{tokenLabel}' within {rule.RangeLabel} (or next to caster).",
                    SpawnTokenName: tokenLabel,
                    SpawnPlacementMode: "Prompt caster to place token within spell range",
                    SpawnRange: string.IsNullOrWhiteSpace(rule.RangeLabel) ? "Within 30 ft" : rule.RangeLabel,
                    SpawnController: "Caster / Attacker"
                ),
                new(
                    Id: $"{rule.Id}-step-4",
                    Order: 4,
                    StepType: "EFFECT",
                    Title: "Resolve summon state",
                    Subtitle: $"Spend casting resources and link summoned token for {rule.DurationLabel}.",
                    IfCondition: "When Token Placed on Map",
                    ThenEffects:
                    [
                        new("eff-sum-1", "Spend casting resources", "Caster / Attacker", rule.ActionCost, "Resource"),
                        new("eff-sum-2", "Activate summoned token on initiative", "Summoned Token", rule.DurationLabel, "Summon")
                    ],
                    ElseCondition: "If Interrupted (Counterspell)",
                    ElseEffects:
                    [
                        new("eff-sum-else", "Cancel summon placement", "Caster / Attacker", "0", "None")
                    ]
                )
            ];
        }

        // 3. Shapeshift / Token Transform Spells & Features (Wild Shape, Polymorph, True Polymorph, Shapechange, Alter Self, Disguise Self, Animal Shapes)
        bool isTransformRule = nameLower.Contains("wild shape") || nameLower.Contains("shapeshift") ||
                               nameLower.Contains("polymorph") || nameLower.Contains("shapechange") ||
                               nameLower.Contains("alter self") || nameLower.Contains("disguise self") ||
                               nameLower.Contains("animal shapes") || nameLower.Contains("gaseous form");

        if (isTransformRule)
        {
            bool targetsOther = nameLower.Contains("polymorph") || nameLower.Contains("animal shapes");
            var subject = targetsOther ? "Target(s)" : "Caster / Attacker";
            var formLabel = nameLower.Contains("wild shape")
                ? "Beast Form Token (Dire Wolf / Brown Bear / Giant Eagle)"
                : nameLower.Contains("polymorph")
                    ? "Polymorphed Creature Token (Beast Form)"
                    : $"{rule.Name} Transformed Token";

            var steps = new List<ActionResolutionStepDto>
            {
                new(
                    Id: $"{rule.Id}-step-1",
                    Order: 1,
                    StepType: "CHECK",
                    Title: "Check requirements",
                    Subtitle: $"{rule.ActionCost} · Resource available · {rule.RangeLabel}",
                    CheckMode: "ALL",
                    Requirements: [$"{rule.ActionCost} available", "Uses / Spell slot available", $"Target within {rule.RangeLabel}"]
                ),
                new(
                    Id: $"{rule.Id}-step-2",
                    Order: 2,
                    StepType: "PROMPT",
                    Title: "Choose transformation token form",
                    Subtitle: $"Ask player to select the new token appearance and creature form.",
                    PromptTarget: "Caster / Attacker",
                    PromptTrigger: "When casting",
                    PromptMessage: $"Select the new token form and size to apply to {subject}.",
                    ContinueMode: "Immediately after selection",
                    PromptOptions: [formLabel, "Large Beast Token", "Medium Beast Token", "Tiny Scout Token"]
                )
            };

            if (targetsOther && rule.SaveDc > 0)
            {
                steps.Add(new(
                    Id: $"{rule.Id}-step-3",
                    Order: 3,
                    StepType: "ROLL",
                    Title: "Roll Wisdom saving throw (unwilling target)",
                    Subtitle: $"d20 + WIS save vs. Caster Spell Save DC ({rule.SaveDc})",
                    RollActor: "Target(s)",
                    RollType: "Saving Throw vs Spell Save DC",
                    RollFormula: $"d20 + WIS save vs. DC {rule.SaveDc}"
                ));
            }

            steps.Add(new(
                Id: $"{rule.Id}-step-{steps.Count + 1}",
                Order: steps.Count + 1,
                StepType: "CHANGE_TOKEN",
                Title: "Change token on map (Shapeshift)",
                Subtitle: $"Replace {subject} token with '{formLabel}' ({rule.DurationLabel}).",
                TransformSubject: subject,
                TransformFormName: formLabel,
                TransformSize: "Match new form size",
                TransformHpMode: "Grant form's HP as Temporary HP (revert at 0 HP)"
            ));

            steps.Add(new(
                Id: $"{rule.Id}-step-{steps.Count + 1}",
                Order: steps.Count + 1,
                StepType: "EFFECT",
                Title: "Resolve transformation effect",
                Subtitle: $"Apply new form stats and Temporary HP to {subject}.",
                IfCondition: targetsOther ? "If Willing or Target Fails Save" : "When Activated",
                ThenEffects:
                [
                    new("eff-tr-1", "Swap map token & size", subject, formLabel, "Token Transform"),
                    new("eff-tr-2", "Grant Temporary HP & form statistics", subject, rule.DamageOrEffectFormula, "Temp HP")
                ],
                ElseCondition: "If Unwilling Target Succeeds Save",
                ElseEffects:
                [
                    new("eff-tr-else", "Keep original token (No effect)", subject, "0", "None")
                ]
            ));

            return steps;
        }

        // 4. Reaction Rules (Shield, Counterspell, Opportunity Attack, Absorb Elements, Uncanny Dodge, Deflect Attacks)
        if (isReaction)
        {
            var trigTokens = rule.Clauses.FirstOrDefault(c => c.Keyword.Equals("When", StringComparison.OrdinalIgnoreCase))?.Tokens
                             ?? ["Triggering attack or spell occurs"];
            var reqTokens = rule.Clauses.FirstOrDefault(c => c.Keyword.Equals("Has", StringComparison.OrdinalIgnoreCase))?.Tokens
                            ?? ["Reaction available"];

            return
            [
                new(
                    Id: $"{rule.Id}-step-1",
                    Order: 1,
                    StepType: "CHECK",
                    Title: "Check trigger & reaction requirements",
                    Subtitle: $"{string.Join(" · ", trigTokens)} · {string.Join(" · ", reqTokens)}",
                    CheckMode: "ALL",
                    Requirements: trigTokens.Concat(reqTokens).ToList()
                ),
                new(
                    Id: $"{rule.Id}-step-2",
                    Order: 2,
                    StepType: "PROMPT",
                    Title: $"Prompt target to use {rule.Name}",
                    Subtitle: $"Ask {rule.TargetLabel} whether to spend 1 Reaction.",
                    PromptTarget: "Target(s)",
                    PromptTrigger: "On a hit: before applying damage",
                    PromptMessage: $"Trigger matched for {rule.Name}! Spend 1 Reaction to apply '{rule.DamageOrEffectFormula}'?",
                    ContinueMode: "After responses or timeout",
                    PromptOptions: [$"Use {rule.Name} ({rule.DamageOrEffectFormula})", "Decline reaction (Keep Reaction)"]
                ),
                new(
                    Id: $"{rule.Id}-step-3",
                    Order: 3,
                    StepType: "EFFECT",
                    Title: "Resolve reaction interrupt",
                    Subtitle: $"Spend 1 Reaction and apply {rule.DamageOrEffectFormula}.",
                    IfCondition: $"If Reaction Used ({rule.Name})",
                    ThenEffects:
                    [
                        new("eff-rx-1", "Spend 1 Reaction" + (isSpell ? " + Spell Slot" : ""), "Caster / Attacker", rule.ActionCost, "Resource"),
                        new("eff-rx-2", rule.AcBonus > 0 ? $"Grant +{rule.AcBonus} AC against attack" : "Modify incoming damage / effect", "Caster / Attacker", rule.DamageOrEffectFormula, rule.AcBonus > 0 ? "AC Bonus" : "Damage Reduction")
                    ],
                    ElseCondition: "If Reaction Declined",
                    ElseEffects:
                    [
                        new("eff-rx-else", "Continue normal attack / spell resolution", "Target(s)", "Unmodified", "None")
                    ]
                )
            ];
        }

        // 5. General Spells, Class Features & Combat Actions
        var hasSave = rule.SaveDc > 0 || (rule.AttackOrSaveLabel ?? string.Empty).Contains("Save", StringComparison.OrdinalIgnoreCase);
        var hasAttackRoll = (rule.AttackOrSaveLabel ?? string.Empty).Contains("Attack", StringComparison.OrdinalIgnoreCase);

        var genSteps = new List<ActionResolutionStepDto>
        {
            new(
                Id: $"{rule.Id}-step-1",
                Order: 1,
                StepType: "CHECK",
                Title: "Check requirements",
                Subtitle: $"{rule.ActionCost} · Range {rule.RangeLabel}" + (isSpell ? " · Spell slot & components" : ""),
                CheckMode: "ALL",
                Requirements: isSpell
                    ? [$"{rule.ActionCost} available", "Spell slot & components available", $"Target / point within {rule.RangeLabel}"]
                    : [$"{rule.ActionCost} available", $"Target within {rule.RangeLabel}", "Actor can act"]
            ),
            new(
                Id: $"{rule.Id}-step-2",
                Order: 2,
                StepType: "PROMPT",
                Title: isSpell ? "Prompt casting & target selection" : "Choose target / option",
                Subtitle: $"Ask caster to select {rule.TargetLabel} within {rule.RangeLabel}.",
                PromptTarget: "Caster / Attacker",
                PromptTrigger: isSpell ? "When casting" : "When attacking",
                PromptMessage: $"Select {rule.TargetLabel} within {rule.RangeLabel}" + (isSpell ? " and confirm spell slot level." : "."),
                ContinueMode: "Immediately after selection",
                PromptOptions: [$"Select {rule.TargetLabel}", $"Confirm {rule.RangeLabel}"]
            )
        };

        if (hasSave || hasAttackRoll)
        {
            genSteps.Add(new(
                Id: $"{rule.Id}-step-3",
                Order: 3,
                StepType: "ROLL",
                Title: hasSave ? $"Roll saving throw ({rule.AttackOrSaveLabel})" : "Roll spell / weapon attack",
                Subtitle: hasSave ? $"{rule.AttackOrSaveLabel} vs. Caster Spell Save DC" : "d20 + attack modifier vs. target AC",
                RollActor: hasSave ? "Target(s)" : "Caster / Attacker",
                RollType: hasSave ? "Saving Throw vs Spell Save DC" : "Attack Roll vs Target AC",
                RollFormula: hasSave ? $"d20 + save modifier vs. DC {(rule.SaveDc > 0 ? rule.SaveDc : 15)}" : "d20 + attack modifier vs. target AC"
            ));
        }

        if (isSpell || hasAttackRoll)
        {
            genSteps.Add(new(
                Id: $"{rule.Id}-step-{genSteps.Count + 1}",
                Order: genSteps.Count + 1,
                StepType: "BRANCH",
                Title: isSpell ? "Offer eligible reactions (Counterspell / Absorb Elements / Shield)" : "On a hit: offer reactions",
                Subtitle: "Pause for eligible reactions before applying final effect.",
                PromptTarget: "Eligible creatures",
                PromptTrigger: isSpell ? "When casting" : "On a hit: before applying damage",
                PromptMessage: $"Prompt eligible creatures to use an available Reaction against {rule.Name}.",
                ContinueMode: "After responses or timeout",
                PromptOptions: isSpell
                    ? ["Counterspell", "Absorb Elements", "Shield", "Decline reaction"]
                    : ["Shield", "Parry / Deflect", "Uncanny Dodge", "Decline reaction"]
            ));
        }

        var isHealing = nameLower.Contains("heal") || nameLower.Contains("cure ") ||
                        (rule.DamageOrEffectFormula ?? string.Empty).Contains("Heal", StringComparison.OrdinalIgnoreCase) ||
                        (rule.DamageOrEffectFormula ?? string.Empty).Contains("HP", StringComparison.OrdinalIgnoreCase) && !nameLower.Contains("armor");

        genSteps.Add(new(
            Id: $"{rule.Id}-step-{genSteps.Count + 1}",
            Order: genSteps.Count + 1,
            StepType: "EFFECT",
            Title: "Resolve result",
            Subtitle: $"Apply {rule.DamageOrEffectFormula} to {(rule.RangeLabel.Equals("Self", StringComparison.OrdinalIgnoreCase) ? "Caster / Attacker" : "Target(s)")}.",
            IfCondition: hasSave ? "If Target Fails Saving Throw" : (hasAttackRoll ? "On Hit (Attack >= Target AC)" : "When Action Resolves"),
            ThenEffects:
            [
                new(
                    "eff-main-1",
                    isHealing ? "Restore HP (Heal)" : "Apply damage / effect",
                    rule.RangeLabel.Equals("Self", StringComparison.OrdinalIgnoreCase) ? "Caster / Attacker" : "Target(s)",
                    string.IsNullOrWhiteSpace(rule.DamageOrEffectFormula) ? "Effect applied" : rule.DamageOrEffectFormula,
                    isHealing ? "Healing" : "Spell / Action effect"
                )
            ],
            ElseCondition: hasSave ? "If Target Succeeds Saving Throw" : (hasAttackRoll ? "On Miss" : "If Prevented"),
            ElseEffects:
            [
                new(
                    "eff-else-1",
                    hasSave ? "Apply half damage or negate" : "No damage",
                    "Target(s)",
                    hasSave ? "Half damage / Negated" : "0",
                    "None"
                )
            ]
        ));

        return genSteps;
    }
}
