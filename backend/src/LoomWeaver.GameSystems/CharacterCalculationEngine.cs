using LoomWeaver.Domain;

namespace LoomWeaver.GameSystems;

public sealed class CharacterCalculationEngine
{
    public static int ComputeModifier(string systemCode, int score) =>
        systemCode == "vampire_v5"
            ? Math.Clamp(score, 1, 5)
            : (int)Math.Floor((score - 10) / 2.0);

    public static int ComputeProficiencyBonus(string systemCode, int level) =>
        systemCode switch
        {
            "pf2e" => level + 2,
            "vampire_v5" => Math.Clamp(1 + (level / 3), 1, 5),
            _ => 2 + ((Math.Max(1, level) - 1) / 4)
        };

    public CharacterSheetDto RecalculateSheet(CharacterSheetDto sheet)
    {
        var abilities = sheet.Abilities
            .Select(a => a with { Modifier = ComputeModifier(sheet.SystemCode, a.Score) })
            .ToList();

        var conMod = abilities.FirstOrDefault(a => a.Code == "CON")?.Modifier ?? 2;
        var dexMod = abilities.FirstOrDefault(a => a.Code == "DEX")?.Modifier ?? 2;
        var prof = ComputeProficiencyBonus(sheet.SystemCode, sheet.Level);

        var equippedAcBonus = sheet.Equipment
            .Where(e => e.Equipped)
            .Sum(e => e.AcBonus);

        var baseAc = sheet.SystemCode == "pf2e" ? 10 + prof : 12;
        var armorClass = baseAc + Math.Min(dexMod, 3) + equippedAcBonus;

        var hitDieAvg = sheet.ClassOrArchetype.Contains("Vanguard", StringComparison.OrdinalIgnoreCase)
            || sheet.ClassOrArchetype.Contains("Fighter", StringComparison.OrdinalIgnoreCase)
            ? 8
            : 6;

        var maxHp = (hitDieAvg + conMod) * sheet.Level + 10;
        var currentHp = Math.Min(sheet.CurrentHp <= 0 ? maxHp : sheet.CurrentHp, maxHp);

        var economy = sheet.SystemCode switch
        {
            "pf2e" => "3 Actions · 1 Reaction · Focus Pool (2)",
            "vampire_v5" => "1 Turn Action · Rouse Check · Willpower Reroll",
            _ => "1 Action · 1 Bonus Action · 1 Reaction · 30ft Move"
        };

        return sheet with
        {
            Abilities = abilities,
            ProficiencyBonus = prof,
            ArmorClass = armorClass,
            MaxHp = maxHp,
            CurrentHp = currentHp,
            InitiativeBonus = dexMod + (sheet.SystemCode == "pf2e" ? prof : 0),
            ActionEconomySummary = economy,
            LevelUpEligible = sheet.CurrentXp >= sheet.NextLevelXp
        };
    }

    public CharacterSheetDto ApplyLevelUp(
        CharacterSheetDto sheet,
        string selectedFeature,
        string abilityIncreaseCode)
    {
        var nextLevel = sheet.Level + 1;
        var updatedAbilities = sheet.Abilities
            .Select(a =>
                string.Equals(a.Code, abilityIncreaseCode, StringComparison.OrdinalIgnoreCase)
                    ? a with { Score = a.Score + 1 }
                    : a)
            .ToList();

        var updatedFeatures = sheet.Features.Append($"Lv.{nextLevel}: {selectedFeature}").ToList();
        var nextThreshold = sheet.NextLevelXp + (sheet.SystemCode == "pf2e" ? 1000 : 11000);

        return RecalculateSheet(sheet with
        {
            Level = nextLevel,
            NextLevelXp = nextThreshold,
            Abilities = updatedAbilities,
            Features = updatedFeatures,
            CurrentHp = sheet.MaxHp + 8
        });
    }
}
