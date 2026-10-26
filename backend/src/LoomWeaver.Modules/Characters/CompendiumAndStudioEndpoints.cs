using LoomWeaver.Domain;
using LoomWeaver.Modules.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Characters;

public static class CompendiumAndStudioEndpoints
{
    private static readonly List<CompendiumEntryContract> CompendiumEntries = new()
    {
        new(
            "srd-spell-sunbeam-luminary",
            "Luminary Sunbeam of the Anelith",
            "Spell",
            "dnd5e",
            "6th-Level Evocation",
            "1 Action · Concentration (1 min)",
            "Channels remnant Sidhe Ard creation weave into a 60-ft radiant beam; creatures make a CON save or take 6d8 Radiant damage and are blinded.",
            "6d8 Radiant · CON Save DC 17 · 60 ft Line"
        ),
        new(
            "srd-item-quiet-maw-pouch",
            "The Quiet Maw (Extradimensional Stasis Stitch)",
            "Equipment",
            "dnd5e",
            "Wondrous Item (Very Rare)",
            "Passive / Reaction",
            "Sewn by Kycius inside Dolly's mouth along the Cinth road; creatures swallowed enter a harmless pocket plane rather than suffering lethal bite damage.",
            "WIS Save DC 16 · Non-Lethal Extradimensional Containment"
        ),
        new(
            "srd-item-artificer-condenser",
            "Cinth Phosphor-Bronze Arc Condenser",
            "Equipment",
            "dnd5e",
            "Artificer Guild Relic (Rare)",
            "1 Bonus Action",
            "Post-Moonlight Wars non-magical defensive capacitor built by the Cinth Artificers Guild to counter unregistered wizardry and vampire thralls.",
            "+2 AC vs. Spell Attacks · 3d8 Lightning Counter-Arc"
        ),
        new(
            "srd-feat-stone-sense-scholar",
            "Kildrid's Deep-Mountain Stone Sense",
            "Feat",
            "dnd5e",
            "Dwarven Heritage Feat",
            "1 Bonus Action (60 ft Tremorsense)",
            "Allows the bearer to sense subterranean rune wards, hollow caverns, and ancient bound dragons clawing at bedrock up to half a league away.",
            "Advantage on History/Masonry · 60 ft Runic Tremorsense"
        ),
        new(
            "srd-spell-laksis-ignition",
            "Laksis Tandem Fire-Drake Volley",
            "Spell",
            "dnd5e",
            "3rd-Level Conjuration / Evocation",
            "1 Bonus Action (Familiar Command)",
            "Kycius's fire drake familiar Laksis exhales a concentrated cinder arc that ignites targets and illuminates fog-of-war tiles.",
            "4d6 Fire · DEX Save DC 16 · 15 ft Cone"
        ),
        new(
            "srd-feat-slingshot-tooth-crit",
            "Fivi's Improvised Fey Slingshot Mastery",
            "Feat",
            "dnd5e",
            "Feywild Outcast Trick",
            "1 Action (60/120 ft)",
            "Loads a tooth, pebble, or brass gear into a slingshot; critical hits bypass magical resistance and deal bonus force trauma to targets at 1 HP.",
            "1d8+4 Force/Bludgeoning · Crit Range 19-20"
        )
    };

    private static readonly List<ParticleEmitterCurveContract> EmitterPresets = new()
    {
        new(
            "emit-solar-supernova",
            "Anelith Luminary Supernova",
            420,
            1150,
            -1.2,
            38.0,
            0.35,
            2.40,
            "Additive",
            "#ffe299",
            "#ff6b4a"
        ),
        new(
            "emit-crimson-mist",
            "Cinth Vampire Blood-Mist",
            280,
            1600,
            0.4,
            65.0,
            0.50,
            1.85,
            "AlphaBlend",
            "#ff4d6d",
            "#2b0912"
        ),
        new(
            "emit-artificer-aether",
            "Artificer Phosphor-Bronze Spark",
            520,
            780,
            -3.8,
            24.0,
            0.22,
            1.15,
            "Additive",
            "#70d6ff",
            "#e5b85c"
        )
    };

    public static RouteGroupBuilder MapCompendiumAndStudioEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/compendium/search", (string? q, string? category) =>
        {
            var results = CompendiumEntries
                .Where(c =>
                    (string.IsNullOrWhiteSpace(category) ||
                     string.Equals(category, "All", StringComparison.OrdinalIgnoreCase) ||
                     string.Equals(c.Category, category, StringComparison.OrdinalIgnoreCase)) &&
                    (string.IsNullOrWhiteSpace(q) ||
                     c.Name.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                     c.Summary.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                     c.MechanicalPayload.Contains(q, StringComparison.OrdinalIgnoreCase)))
                .ToList();

            return Results.Ok(results);
        });

        api.MapPost("/campaigns/{campaignId:int}/maps/{sceneId}/sculpt-heightmap", (
            int campaignId,
            string sceneId,
            HeightmapSculptRequest req) =>
        {
            var biome = string.IsNullOrWhiteSpace(req.BiomePreset) ? "Gwaedhellain Poisoned Canopy" : req.BiomePreset.Trim();
            var radius = Math.Clamp(req.BrushRadiusMeters <= 0 ? 12.0 : req.BrushRadiusMeters, 2.0, 48.0);
            var delta = Math.Clamp(req.ElevationDelta, -15.0, 25.0);
            var water = Math.Clamp(req.WaterLevelMeters, -5.0, 12.0);
            var octaves = Math.Clamp(req.RoughnessOctaves <= 0 ? 4 : req.RoughnessOctaves, 1, 8);

            var summary =
                $"Sculpted '{biome}' heightmap (Radius={radius:F1}m, Elevation={delta:+0.0;-0.0;0.0}m, Octaves={octaves}, WaterTable={water:F1}m).";

            TableRealtimeEndpoints.RecordEvent(
                campaignId,
                "map_sculpted",
                "LoomMaps Sculptor",
                summary,
                "{}"
            );

            return Results.Ok(new HeightmapSculptResponse(
                sceneId,
                biome,
                radius,
                Math.Round(8.4 + Math.Max(0, delta), 2),
                water,
                4096,
                summary,
                DateTimeOffset.UtcNow
            ));
        });

        api.MapGet("/campaigns/{campaignId:int}/effects/emitter-presets", (int campaignId) =>
            Results.Ok(EmitterPresets));

        api.MapPost("/campaigns/{campaignId:int}/effects/emitter-presets", (
            int campaignId,
            ParticleEmitterCurveContract req) =>
        {
            var created = req with
            {
                Id = string.IsNullOrWhiteSpace(req.Id)
                    ? $"emit-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
                    : req.Id
            };
            EmitterPresets.Insert(0, created);
            return Results.Ok(created);
        });

        return api;
    }
}
