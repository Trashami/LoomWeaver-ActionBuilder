using LoomWeaver.Domain;

namespace LoomWeaver.Modules.ActionStudio.Domain;

public static class ActionRuleCatalog
{
    private static readonly IReadOnlyList<CampaignActionRuleDto> DefaultRules =
    [
        new(
            Id: "rule-shield-reaction",
            RuleCode: "Reaction.ShieldSpell",
            Name: "Shield (Reaction Spell)",
            Category: "Reactions & Interrupts",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "An invisible barrier of magical force appears and protects you. Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack, and you take no damage from Magic Missile.",
            ActionCost: "1 Reaction",
            ActionType: "Abjuration Reaction Spell",
            RangeLabel: "Self",
            TargetLabel: "Self (Triggering Attack or Magic Missile)",
            AttackOrSaveLabel: "Interrupts Attack Roll vs AC",
            DamageOrEffectFormula: "+5 AC & Negate Magic Missile",
            SaveDc: 0,
            AcBonus: 5,
            DurationLabel: "Until start of your next turn (1 Round)",
            RequiresConcentration: false,
            PrimaryClassName: "CombatRuleInterpreter",
            PrimaryMethodName: "ResolveShieldReactionWindow",
            SourceFilePath: "LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs",
            Clauses:
            [
                new("c-sh-1", "When", ["Attack Roll Hits Self", "Magic Missile Targets Self"], "MidiCombatAutomationService", "openReactionWindow", "Opens reaction prompt before damage is applied."),
                new("c-sh-2", "Contains", ["Action.Tags Contains 'Reaction'", "Spell.Components Contains 'Somatic'"], "CombatRuleInterpreter", "ResolveShieldReactionWindow", "Verifies spell tags and casting requirements."),
                new("c-sh-3", "Has", ["Defender Has Reaction Available", "Caster Has 1st-Level Spell Slot"], "CombatSessionStateService", "consumeActionResource", "Requires unspent reaction and a 1st+ level slot."),
                new("c-sh-4", "If", ["AttackTotal >= TargetAC"], "CombatRuleInterpreter", "ResolveShieldReactionWindow", "Checks if the incoming roll would hit current AC."),
                new("c-sh-5", "With", ["AC Bonus +5 Until Start Of Next Turn"], "CharacterCalculationEngine", "ComputeSpellSaveDc", "Applies temporary +5 AC modifier."),
                new("c-sh-6", "Then", ["Consume Reaction & Grant +5 AC", "Recheck Hit Outcome & Negate Magic Missile"], "CombatRuleInterpreter", "ResolveShieldReactionWindow", "Turns hits below (AC + 5) into misses."),
                new("c-sh-7", "Else", ["Allow Attack To Resolve Normally"], "MidiCombatAutomationService", "executeWorkflow", "Proceeds to standard damage roll if declined.")
            ],
            ScalingTiers:
            [
                new("Levels 1-4", "+5 AC", "Standard Arcane Barrier", "Blocks Magic Missile and grants +5 AC until start of next turn."),
                new("Levels 5-10", "+5 AC", "Ward Resonance", "Compatible with Abjuration Arcane Ward charges."),
                new("Levels 11-16", "+5 AC", "Spell Mastery Eligible", "Can be designated for at-will casting at high Wizard levels."),
                new("Levels 17-20", "+5 AC", "Archmage Aegis", "Full reaction interrupt with zero slot cost when mastered.")
            ],
            WorksWith: ["Mage Armor", "Bladesong", "Arcane Ward", "War Caster"],
            ConflictsWith: ["Incapacitated", "Shocking Grasp (No Reactions)", "Silence (Verbal Component)"],
            Tags: ["Reaction", "Abjuration", "AC Bonus", "Interrupt"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-counterspell-interrupt",
            RuleCode: "Reaction.Counterspell",
            Name: "Counterspell (Spell Interrupt)",
            Category: "Reactions & Interrupts",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "You attempt to interrupt a creature in the process of casting a spell within 60 feet. Automatically interrupts spells of 3rd level or lower, or requires a spellcasting ability check (DC 10 + spell level).",
            ActionCost: "1 Reaction",
            ActionType: "Abjuration Interrupt Spell",
            RangeLabel: "60 ft",
            TargetLabel: "1 Creature Casting a Spell in Sight",
            AttackOrSaveLabel: "Auto <= Slot Level or Ability Check DC 10 + Spell Level",
            DamageOrEffectFormula: "Negate Enemy Spell Cast",
            SaveDc: 14,
            AcBonus: 0,
            DurationLabel: "Instantaneous",
            RequiresConcentration: false,
            PrimaryClassName: "CombatRuleInterpreter",
            PrimaryMethodName: "ResolveCounterspellInterrupt",
            SourceFilePath: "LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs",
            Clauses:
            [
                new("c-cs-1", "When", ["Hostile Creature Casts Spell Within 60 ft"], "MidiCombatAutomationService", "openReactionWindow", "Triggered on enemy spell preamble."),
                new("c-cs-2", "Where", ["Distance(Attacker, Target) <= 60 ft"], "CombatRuleInterpreter", "ResolveCounterspellInterrupt", "Enforces 60 ft reaction range."),
                new("c-cs-3", "Has", ["Defender Has Reaction Available", "Caster Has 3rd-Level Spell Slot"], "CombatSessionStateService", "consumeActionResource", "Spends reaction and 3rd+ level slot."),
                new("c-cs-4", "If", ["Spell.Level <= CounterspellSlotLevel"], "CombatRuleInterpreter", "ResolveCounterspellInterrupt", "Compares cast slot level against enemy spell level."),
                new("c-cs-5", "Then", ["Interrupt Spell Cast & Negate Effect"], "CombatRuleInterpreter", "ResolveCounterspellInterrupt", "Spell fails and has no effect."),
                new("c-cs-6", "Else", ["Roll Spellcasting Ability Check vs DC 10 + Spell Level"], "CombatRuleInterpreter", "ResolveCounterspellInterrupt", "On success, interrupts higher-level spell.")
            ],
            ScalingTiers:
            [
                new("3rd-Level Slot", "Auto <= 3rd Level", "Base Interrupt", "Automatically negates spells of 3rd level or lower."),
                new("4th-5th Slot", "Auto <= 5th Level", "Upcast Interrupt", "Automatically negates spells up to the expended slot level."),
                new("6th-9th Slot", "Auto <= 9th Level", "High-Arcana Denial", "Negates archmage-tier spells without an ability check.")
            ],
            WorksWith: ["Abjuration Savant", "Jack of All Trades", "Tactical Wit"],
            ConflictsWith: ["Subtle Spell (No Perceivable Components)", "Blindness", "Out of 60 ft Range"],
            Tags: ["Reaction", "Interrupt", "Spell Denial", "60 ft"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-opportunity-attack",
            RuleCode: "Combat.OpportunityAttack",
            Name: "Opportunity Attack (Reach Exit)",
            Category: "Reactions & Interrupts",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "When a hostile creature that you can see moves out of your reach without taking the Disengage action, you can use your Reaction to make one melee attack against the provoking creature.",
            ActionCost: "1 Reaction",
            ActionType: "Melee Reaction Strike",
            RangeLabel: "5 ft (or Weapon Reach)",
            TargetLabel: "1 Hostile Creature Leaving Reach",
            AttackOrSaveLabel: "Melee Attack Roll vs Target AC",
            DamageOrEffectFormula: "1d8 + STR/DEX Weapon Damage",
            SaveDc: 0,
            AcBonus: 0,
            DurationLabel: "Instantaneous (Before Target Leaves Reach)",
            RequiresConcentration: false,
            PrimaryClassName: "CombatRuleInterpreter",
            PrimaryMethodName: "ResolveOpportunityAttackTrigger",
            SourceFilePath: "LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs",
            Clauses:
            [
                new("c-oa-1", "When", ["Hostile Leaves Reach Without Disengage"], "CombatRuleInterpreter", "ResolveOpportunityAttackTrigger", "Monitors token movement path across reach boundary."),
                new("c-oa-2", "Has Not", ["Target Has Not Taken Disengage Action", "Defender Has Not Used Reaction This Round"], "CombatSessionStateService", "consumeActionResource", "Cancelled if target disengaged or teleports."),
                new("c-oa-3", "Where", ["Distance(Attacker, Target) <= 5 ft"], "CombatRuleInterpreter", "ResolveOpportunityAttackTrigger", "Evaluated at the tile before exiting reach."),
                new("c-oa-4", "Then", ["Pause Movement & Execute 1 Melee Attack"], "MidiCombatAutomationService", "executeWorkflow", "Resolves melee strike before movement completes.")
            ],
            ScalingTiers:
            [
                new("Levels 1-4", "1 Melee Strike", "Standard Reach Guard", "Single melee weapon attack on reach exit."),
                new("Sentinel Feat", "Speed -> 0 ft", "Lockdown Strike", "Reduces target speed to 0 ft for the rest of the turn on hit."),
                new("War Caster Feat", "1 Single-Target Spell", "Arcane Opportunity", "Allows casting a 1-action spell in place of the melee attack.")
            ],
            WorksWith: ["Sentinel", "Polearm Master", "War Caster", "Sneak Attack (Off-Turn)"],
            ConflictsWith: ["Disengage Action", "Misty Step / Teleportation", "Forced Push Movement"],
            Tags: ["Reaction", "Melee", "Movement", "Reach"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-concentration-save",
            RuleCode: "SavingThrows.Concentration",
            Name: "Concentration Saving Throw",
            Category: "Saving Throws & Vitals",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "Whenever you take damage while concentrating on a spell, you must make a Constitution saving throw to maintain concentration. The DC equals 10 or half the damage you take, whichever number is higher.",
            ActionCost: "Free (Triggered on Damage)",
            ActionType: "Constitution Saving Throw",
            RangeLabel: "Self",
            TargetLabel: "Concentrating Spellcaster",
            AttackOrSaveLabel: "CON Save vs max(10, floor(Damage / 2))",
            DamageOrEffectFormula: "DC = max(10, floor(Damage / 2))",
            SaveDc: 10,
            AcBonus: 0,
            DurationLabel: "Active Concentration Duration",
            RequiresConcentration: true,
            PrimaryClassName: "CombatRuleInterpreter",
            PrimaryMethodName: "EvaluateConcentrationSaveDc",
            SourceFilePath: "LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs",
            Clauses:
            [
                new("c-cn-1", "When", ["Creature Takes Damage While Concentrating"], "CombatRuleInterpreter", "EvaluateConcentrationSaveDc", "Hooks into post-damage HP reduction."),
                new("c-cn-2", "Has", ["Target Has Concentration Active"], "CombatSessionStateService", "consumeActionResource", "Checks active concentration state on token."),
                new("c-cn-3", "With", ["Save DC = max(10, floor(Damage / 2))"], "CombatRuleInterpreter", "EvaluateConcentrationSaveDc", "Calculates dynamic Constitution save threshold."),
                new("c-cn-4", "If", ["Constitution Save >= max(10, floor(Damage / 2))"], "CombatRuleInterpreter", "EvaluateConcentrationSaveDc", "Compares d20 + CON save bonus against DC."),
                new("c-cn-5", "Then", ["Maintain Active Concentration Effects"], "CombatRuleInterpreter", "EvaluateConcentrationSaveDc", "Keeps active buff/debuff/aura on the map."),
                new("c-cn-6", "Else", ["Drop Concentration & Clear Linked Aura"], "CombatRuleInterpreter", "EvaluateConcentrationSaveDc", "Removes linked spell template and conditions.")
            ],
            ScalingTiers:
            [
                new("Damage 1-21", "DC 10", "Minimum Threshold", "Any hit up to 21 damage requires a flat DC 10 CON save."),
                new("Damage 22-40", "DC 11-20", "Heavy Strike Threshold", "DC scales at half of damage taken (rounded down)."),
                new("Damage 41+", "DC 21+", "Catastrophic Impact", "High-tier boss strikes test high-level CON saves.")
            ],
            WorksWith: ["War Caster (Advantage)", "Resilient (CON)", "Aura of Protection", "Bladesong (+INT to CON Save)"],
            ConflictsWith: ["Casting Another Concentration Spell", "Unconscious / 0 HP"],
            Tags: ["Saving Throw", "Concentration", "Spellcasting", "Constitution"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-action-economy-budget",
            RuleCode: "Core.ActionEconomyBudget",
            Name: "Turn Action Economy Budget",
            Category: "Core Rules",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "Defines the per-turn resource budget restored at the start of each combatant's turn: 1 Action, 1 Bonus Action, 1 Reaction, 1 Free Object Interaction, and full Movement speed.",
            ActionCost: "Turn Start Refresh",
            ActionType: "Core Turn Resource Rule",
            RangeLabel: "Table-Wide",
            TargetLabel: "Active Turn Combatant",
            AttackOrSaveLabel: "Deterministic Resource Refresh",
            DamageOrEffectFormula: "1 Action · 1 Bonus · 1 Reaction · Speed ft",
            SaveDc: 0,
            AcBonus: 0,
            DurationLabel: "1 Combat Round",
            RequiresConcentration: false,
            PrimaryClassName: "CombatSessionStateService",
            PrimaryMethodName: "resetTurnResources",
            SourceFilePath: "frontend/src/app/services/combat-session-state.service.ts",
            Clauses:
            [
                new("c-ae-1", "When", ["Turn Starts"], "CombatSessionStateService", "resetTurnResources", "Fires when initiative advances to combatant."),
                new("c-ae-2", "With", ["Action Budget (1 Action, 1 Bonus, 1 Reaction)"], "CombatSessionStateService", "resetTurnResources", "Restores standard 5e action economy slots."),
                new("c-ae-3", "Then", ["Maintain Active Concentration Effects"], "CombatSessionStateService", "resetTurnResources", "Broadcasts refreshed turn pips to VTT HUD.")
            ],
            ScalingTiers:
            [
                new("Standard Turn", "1A / 1BA / 1R", "Core 5e Budget", "Standard turn economy for all creatures."),
                new("Action Surge", "+1 Action", "Fighter Burst", "Adds 1 additional Action on the current turn."),
                new("Haste Spell", "+1 Hasted Action", "Arcane Acceleration", "Doubles speed, +2 AC, and +1 weapon/dash/disengage action.")
            ],
            WorksWith: ["Action Surge", "Haste", "Cunning Action"],
            ConflictsWith: ["Slow Spell (Action OR Bonus Action only)", "Stunned", "Paralyzed"],
            Tags: ["Core Rules", "Turn Order", "Action Economy"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-diagonal-movement",
            RuleCode: "Movement.DiagonalCost",
            Name: "Tactical Diagonal Movement (5-10-5)",
            Category: "Movement & Terrain",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "Configures how diagonal grid steps cost movement on the battlemap: alternating 5 ft / 10 ft / 5 ft tactical Euclidean approximation or uniform 5 ft per square.",
            ActionCost: "Movement Budget",
            ActionType: "Grid Movement Rule",
            RangeLabel: "5 ft / 10 ft Alternating",
            TargetLabel: "Moving Token on Square Grid",
            AttackOrSaveLabel: "Pathfinding Cost Calculation",
            DamageOrEffectFormula: "1st Diagonal = 5 ft, 2nd Diagonal = 10 ft",
            SaveDc: 0,
            AcBonus: 0,
            DurationLabel: "Per Turn Movement",
            RequiresConcentration: false,
            PrimaryClassName: "CombatRuleInterpreter",
            PrimaryMethodName: "ComputeDiagonalStepCost",
            SourceFilePath: "LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs",
            Clauses:
            [
                new("c-dm-1", "When", ["Turn Starts"], "CombatRuleInterpreter", "ComputeDiagonalStepCost", "Resets diagonal step counter at start of turn."),
                new("c-dm-2", "Where", ["Every 2nd Diagonal Tile Costs 10 ft"], "CombatRuleInterpreter", "ComputeDiagonalStepCost", "Applies 5-10-5 alternating diagonal cost."),
                new("c-dm-3", "Else", ["Keep Standard 5 ft Movement Cost"], "CombatRuleInterpreter", "ComputeDiagonalStepCost", "Optional simplified 5 ft diagonal rule.")
            ],
            ScalingTiers:
            [
                new("5-10-5 Tactical", "5 ft / 10 ft", "Realistic Range Circles", "Prevents diagonal speed exploits and preserves circular AoEs."),
                new("Uniform 5 ft", "5 ft Flat", "Fast Arcade Grid", "Every square costs 5 ft regardless of angle.")
            ],
            WorksWith: ["Difficult Terrain (+5 ft per tile)", "Dash Action", "Misty Step"],
            ConflictsWith: ["Grappled (Speed 0)"],
            Tags: ["Movement", "Grid", "Tactical", "5-10-5"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-sneak-attack",
            RuleCode: "Class.RogueSneakAttack",
            Name: "Sneak Attack (Precision Strike)",
            Category: "Class & Party Actions",
            SourceLabel: "Core SRD",
            RulesetCode: "dnd5e-2024",
            Summary: "Once per turn, you can deal extra precision damage to one creature you hit with an attack if you have Advantage on the attack roll, or if another enemy of the target is within 5 feet of it and you don't have Disadvantage.",
            ActionCost: "Free (1/Turn on Hit)",
            ActionType: "Class Feature Rider",
            RangeLabel: "Weapon Range",
            TargetLabel: "1 Creature Hit by Finesse or Ranged Weapon",
            AttackOrSaveLabel: "Triggers on Hit with Advantage or Flanking Ally",
            DamageOrEffectFormula: "+3d6 Precision Damage (Scales 1d6-10d6)",
            SaveDc: 0,
            AcBonus: 0,
            DurationLabel: "Once Per Turn",
            RequiresConcentration: false,
            PrimaryClassName: "MidiCombatAutomationService",
            PrimaryMethodName: "evaluateSneakAttackEligibility",
            SourceFilePath: "frontend/src/app/services/midi-combat-automation.service.ts",
            Clauses:
            [
                new("c-sa-1", "When", ["Ranged Or Finesse Weapon Attack Hits"], "MidiCombatAutomationService", "evaluateSneakAttackEligibility", "Evaluated on weapon hit before damage roll."),
                new("c-sa-2", "Contains", ["Weapon.Properties Contains 'Finesse'", "Weapon.Properties Contains 'Ranged'"], "MidiCombatAutomationService", "evaluateSneakAttackEligibility", "Requires a Finesse or Ranged weapon."),
                new("c-sa-3", "Has Not", ["Attacker Has Not Used Sneak Attack This Turn", "Attacker Has Not Disadvantage"], "MidiCombatAutomationService", "evaluateSneakAttackEligibility", "Cannot trigger if attacker has Disadvantage."),
                new("c-sa-4", "If", ["Attack Has Advantage", "Ally Within 5 ft Of Target"], "MidiCombatAutomationService", "evaluateSneakAttackEligibility", "Requires Advantage or an active ally within 5 ft."),
                new("c-sa-5", "Then", ["Add Sneak Attack Dice To Damage Roll"], "CharacterCalculationEngine", "EvaluateLevelScalingTier", "Adds level-scaled d6 dice to weapon damage.")
            ],
            ScalingTiers:
            [
                new("Levels 1-4", "1d6 - 2d6", "Initiate Precision", "Base rogue precision dice."),
                new("Levels 5-10", "3d6 - 5d6", "Veteran Ambush", "Mid-tier rogue precision dice."),
                new("Levels 11-16", "6d6 - 8d6", "Master Assassin", "High-tier precision dice."),
                new("Levels 17-20", "9d6 - 10d6", "Mythic Vital Strike", "Maximum 10d6 precision damage.")
            ],
            WorksWith: ["Fivi's Tooth Slingshot", "Opportunity Attack (Off-Turn)", "Steady Aim"],
            ConflictsWith: ["Disadvantage on Attack Roll", "Heavy Non-Finesse Weapons"],
            Tags: ["Rogue", "Precision", "Contains", "Finesse"],
            IsCustomizedForCampaign: false,
            UpdatedByUsername: "System SRD",
            UpdatedAt: "2026-10-26T00:00:00Z"
        ),
        new(
            Id: "rule-fivi-tooth-slingshot",
            RuleCode: "Campaign.FiviToothSlingshot",
            Name: "Fivi's Tooth Slingshot Ricochet",
            Category: "Campaign Custom",
            SourceLabel: "Campaign Modified",
            RulesetCode: "dnd5e-2024",
            Summary: "Fivi's signature fey-tuned slingshot loaded with an ancient tooth. Deals piercing damage and ricochets with a lethal final-sliver finisher against mythic targets.",
            ActionCost: "1 Action",
            ActionType: "Ranged Weapon Attack (Finesse / Fey)",
            RangeLabel: "60 / 120 ft",
            TargetLabel: "1 Creature in Line of Sight",
            AttackOrSaveLabel: "+9 to Hit vs Target AC",
            DamageOrEffectFormula: "3d8 + 5 Piercing + Fey Gold Ricochet",
            SaveDc: 16,
            AcBonus: 0,
            DurationLabel: "Instantaneous",
            RequiresConcentration: false,
            PrimaryClassName: "MidiCombatAutomationService",
            PrimaryMethodName: "executeWorkflow",
            SourceFilePath: "frontend/src/app/services/midi-combat-automation.service.ts",
            Clauses:
            [
                new("c-fv-1", "When", ["Ranged Slingshot Attack Declared"], "MidiCombatAutomationService", "executeWorkflow", "Initiates Fivi's ranged attack workflow."),
                new("c-fv-2", "Contains", ["Weapon.Properties Contains 'Ranged'", "Action.Tags Contains 'Spell'"], "MidiCombatAutomationService", "evaluateSneakAttackEligibility", "Eligible for Sneak Attack and Fey ricochet."),
                new("c-fv-3", "Where", ["Distance(Attacker, Target) <= 60 ft"], "MidiCombatAutomationService", "executeWorkflow", "Normal range 60 ft without disadvantage."),
                new("c-fv-4", "If", ["AttackTotal >= TargetAC", "Target HP <= 15"], "CombatRuleInterpreter", "ResolveShieldReactionWindow", "Checks hit and final-sliver execution threshold."),
                new("c-fv-5", "Then", ["Deal 3d8+5 Piercing & Trigger Ricochet Arc"], "MidiCombatAutomationService", "executeWorkflow", "Deals 3d8+5 piercing and spawns fx-projectile-arc.")
            ],
            ScalingTiers:
            [
                new("Levels 1-4", "1d8 + 4", "Scrap Tooth Shot", "Single ricochet pebble or tooth."),
                new("Levels 5-10", "3d8 + 5", "Runic Dragon-Tooth Shot", "Pierces runic hide and triggers Fey Gold Ricochet."),
                new("Levels 11-20", "4d8 + 6", "Mountain-Slayer Slingshot", "Guaranteed critical finisher when target is at its last sliver of HP.")
            ],
            WorksWith: ["Sneak Attack", "Dolly Pocket-Maw Ammo Pouch", "Laksis Ember Assist"],
            ConflictsWith: ["Wind Wall"],
            Tags: ["Campaign Custom", "Fivi", "Ranged", "Slingshot"],
            IsCustomizedForCampaign: true,
            UpdatedByUsername: "GeoJason",
            UpdatedAt: "2026-10-26T15:00:00Z"
        ),
        new(
            Id: "rule-chokrah-overchannel",
            RuleCode: "Campaign.ChokrahOverchannel",
            Name: "Chokrah Ritual Overchannel Surge",
            Category: "Campaign Custom",
            SourceLabel: "Campaign Modified",
            RulesetCode: "dnd5e-2024",
            Summary: "Consumes refined Chokrah ritual reagent during spellcasting to amplify spell damage by +2d8 Radiant/Necrotic and raise Spell Save DC by +2 for the cast.",
            ActionCost: "1 Bonus Action (With Spell)",
            ActionType: "Campaign Ritual Augmentation",
            RangeLabel: "Self (Augments Active Spell)",
            TargetLabel: "Active Spell Cast",
            AttackOrSaveLabel: "Increases Spell Save DC by +2",
            DamageOrEffectFormula: "+2d8 Radiant/Necrotic & +2 Save DC",
            SaveDc: 18,
            AcBonus: 0,
            DurationLabel: "1 Turn",
            RequiresConcentration: false,
            PrimaryClassName: "CharacterCalculationEngine",
            PrimaryMethodName: "ComputeSpellSaveDc",
            SourceFilePath: "LoomWeaver.GameSystems/Dnd5eSystemRules.cs",
            Clauses:
            [
                new("c-ck-1", "When", ["Chokrah Ritual Overchannel Declared"], "MidiCombatAutomationService", "executeWorkflow", "Declared alongside a leveled spell cast."),
                new("c-ck-2", "Contains", ["Inventory.Reagents Contains 'Chokrah'", "Action.Tags Contains 'Spell'"], "CharacterCalculationEngine", "ComputeSpellSaveDc", "Verifies Chokrah reagent in caster inventory."),
                new("c-ck-3", "With", ["VFX Preset 'fx-ground-sigil'"], "CharacterCalculationEngine", "ComputeSpellSaveDc", "Triggers hexagonal Anelith ground sigil."),
                new("c-ck-4", "Then", ["Apply Chokrah +2d8 Necrotic/Radiant Surge"], "CharacterCalculationEngine", "ComputeSpellSaveDc", "Adds +2d8 damage and +2 Save DC.")
            ],
            ScalingTiers:
            [
                new("1 Vial Chokrah", "+2d8 / +2 DC", "Refined Chokrah Dose", "Safe ritual surge used in Cinth."),
                new("2 Vials Chokrah", "+4d8 / +3 DC", "Prior Overdraw", "Requires DC 15 CON save or 1 level of exhaustion.")
            ],
            WorksWith: ["Kycius Thread-Seer Hex", "Kildrid Anelith Binding Pulse"],
            ConflictsWith: ["Antimagic Field"],
            Tags: ["Campaign Custom", "Chokrah", "Spell Augmentation"],
            IsCustomizedForCampaign: true,
            UpdatedByUsername: "GeoJason",
            UpdatedAt: "2026-10-26T15:30:00Z"
        )
    ];

    public static IReadOnlyList<CampaignActionRuleDto> GetDefaultRules() => DefaultRules;
}
