using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using LoomWeaver.Domain;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Dice;

public static class DiceForgeEndpoints
{
    private static readonly ConcurrentQueue<DiceRollResponseContract> RecentCampaignRolls = new(new[]
    {
        new DiceRollResponseContract(
            "roll-seed-201",
            "1d20 + 8 (ADV)",
            "Fivi Slingshot Tooth Strike",
            20,
            1,
            "advantage",
            new[] { 14, 20 },
            new[] { 20 },
            8,
            28,
            true,
            false,
            "skin-obsidian-gold",
            "Solar Supernova Burst",
            "SHA256:9F4A2C8E1B77D03E",
            DateTimeOffset.UtcNow.AddMinutes(-12)
        ),
        new DiceRollResponseContract(
            "roll-seed-200",
            "2d6 + 5",
            "Munk Runed Greatsword Cleave",
            6,
            2,
            "normal",
            new[] { 6, 5 },
            new[] { 6, 5 },
            5,
            16,
            false,
            false,
            "skin-obsidian-gold",
            "Standard Impact",
            "SHA256:3D81B60A44E91C20",
            DateTimeOffset.UtcNow.AddMinutes(-18)
        ),
        new DiceRollResponseContract(
            "roll-seed-199",
            "1d20 + 7",
            "Dal Shadow-Step Perception Check",
            20,
            1,
            "normal",
            new[] { 18 },
            new[] { 18 },
            7,
            25,
            false,
            false,
            "skin-astral-glass",
            "Standard Impact",
            "SHA256:7C12E88FA0514B9B",
            DateTimeOffset.UtcNow.AddMinutes(-26)
        )
    });

    public static IReadOnlyList<DiceRollResponseContract> GetRecentRolls() =>
        RecentCampaignRolls.Reverse().Take(12).ToList();

    public static IReadOnlyList<DiceSkinPresetContract> GetCuratedSkins() => new[]
    {
        new DiceSkinPresetContract(
            "skin-obsidian-gold",
            "Runed Obsidian & Molten Gold",
            "Volcanic Glass + Gold Inlay",
            "#17151c",
            "#e5b85c",
            0.82,
            0.22,
            "Solar Supernova Burst",
            "Basalt Shatter Decal",
            "Core Set"
        ),
        new DiceSkinPresetContract(
            "skin-astral-glass",
            "Astral Glass & Starlight",
            "Refractive Aether Crystal",
            "#1d2842",
            "#70d6ff",
            0.35,
            0.12,
            "Astral Singularity",
            "Void Fracture",
            "Weave Tier"
        ),
        new DiceSkinPresetContract(
            "skin-vampire-bloodstone",
            "Cinth Bloodstone & Silver",
            "Polished Crimson Jasper",
            "#3a1219",
            "#ff5c77",
            0.64,
            0.28,
            "Crimson Blood Nova",
            "Ash Crumble",
            "Campaign Unlock"
        ),
        new DiceSkinPresetContract(
            "skin-clockwork-brass",
            "Artificer Clockwork Brass",
            "Brushed Cinth Phosphor Bronze",
            "#3d2e1e",
            "#ffae52",
            0.92,
            0.18,
            "Aether Overclock",
            "Gear Jam Spark",
            "Guild Reward"
        ),
        new DiceSkinPresetContract(
            "skin-fey-emerald",
            "Feywild Emerald & Thorn",
            "Living Verdigris Quartz",
            "#132e26",
            "#5ce5a0",
            0.48,
            0.24,
            "Sylvan Bloom",
            "Withered Bramble",
            "Character Studio"
        )
    };

    public static RouteGroupBuilder MapDiceForgeEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/campaigns/{campaignId:int}/dice-skins", (int campaignId) =>
            Results.Ok(GetCuratedSkins()));

        api.MapPost("/campaigns/{campaignId:int}/dice/roll", (int campaignId, DiceRollRequestContract req) =>
        {
            var sides = Math.Clamp(req.Sides <= 0 ? 20 : req.Sides, 2, 100);
            var count = Math.Clamp(req.Count <= 0 ? 1 : req.Count, 1, 20);
            var mode = NormalizeRollMode(req.RollMode);
            var skins = GetCuratedSkins();
            var skin = skins.FirstOrDefault(s => s.Id == req.SkinId) ?? skins[0];

            List<int> rawRolls = new();
            List<int> keptRolls = new();

            if (sides == 20 && count == 1 && (mode == "advantage" || mode == "disadvantage"))
            {
                var first = RandomNumberGenerator.GetInt32(1, 21);
                var second = RandomNumberGenerator.GetInt32(1, 21);
                rawRolls.Add(first);
                rawRolls.Add(second);
                keptRolls.Add(mode == "advantage" ? Math.Max(first, second) : Math.Min(first, second));
            }
            else
            {
                for (var i = 0; i < count; i++)
                {
                    var val = RandomNumberGenerator.GetInt32(1, sides + 1);
                    rawRolls.Add(val);
                    keptRolls.Add(val);
                }
            }

            var total = keptRolls.Sum() + req.Modifier;
            var isNat20 = sides == 20 && keptRolls.Contains(20);
            var isNat1 = sides == 20 && keptRolls.Contains(1);

            var modeTag = mode == "advantage" ? " (ADV)" : mode == "disadvantage" ? " (DIS)" : "";
            var modTag = req.Modifier > 0 ? $" + {req.Modifier}" : req.Modifier < 0 ? $" - {Math.Abs(req.Modifier)}" : "";
            var formula = $"{count}d{sides}{modTag}{modeTag}";
            var label = string.IsNullOrWhiteSpace(req.Label) ? "Authoritative Polyhedral Roll" : req.Label.Trim();
            var shader = isNat20 ? skin.Nat20ShaderName : isNat1 ? skin.Nat1ShaderName : "Standard Impact";

            var timestamp = DateTimeOffset.UtcNow;
            var payload = $"{campaignId}:{formula}:{string.Join(',', rawRolls)}:{timestamp.ToUnixTimeMilliseconds()}";
            var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            var digest = "SHA256:" + Convert.ToHexString(hashBytes)[..16];

            var response = new DiceRollResponseContract(
                $"roll-{timestamp.ToUnixTimeMilliseconds()}",
                formula,
                label,
                sides,
                count,
                mode,
                rawRolls,
                keptRolls,
                req.Modifier,
                total,
                isNat20,
                isNat1,
                skin.Id,
                shader,
                digest,
                timestamp
            );

            RecentCampaignRolls.Enqueue(response);
            while (RecentCampaignRolls.Count > 25)
            {
                RecentCampaignRolls.TryDequeue(out _);
            }

            return Results.Ok(response);
        });

        return api;
    }

    private static string NormalizeRollMode(string? mode) =>
        mode?.Trim().ToLowerInvariant() switch
        {
            "advantage" => "advantage",
            "disadvantage" => "disadvantage",
            _ => "normal"
        };
}
