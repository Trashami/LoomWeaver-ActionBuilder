using LoomWeaver.Domain;
using LoomWeaver.GameSystems;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules.Actions;
using LoomWeaver.Modules.Adventures;
using LoomWeaver.Modules.Audio;
using LoomWeaver.Modules.Auth;
using LoomWeaver.Modules.Characters;
using LoomWeaver.Modules.Dice;
using LoomWeaver.Modules.EffectStudio;
using LoomWeaver.Modules.Encounters;
using LoomWeaver.Modules.Knowledge;
using LoomWeaver.Modules.Maps;
using LoomWeaver.Modules.Marketplace;
using LoomWeaver.Modules.Realtime;
using LoomWeaver.Modules.Sessions;
using LoomWeaver.Modules.Statistics;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules;

public static class LoomWeaverEndpoints
{
    public static IEndpointRouteBuilder MapLoomWeaverModules(this IEndpointRouteBuilder app)
    {
        foreach (var prefix in new[] { "/api/v2", "/api/v1", "/api" })
        {
            var api = app.MapGroup(prefix);
            api.MapCharacterStudioEndpoints();
            api.MapLoomMapsEndpoints();
            api.MapCombatEncounterEndpoints();
            api.MapActionAndEffectEndpoints();
            api.MapEffectStudioEndpoints();
            api.MapDiceForgeEndpoints();
            api.MapAudioAmbienceEndpoints();
            api.MapCampaignAnalyticsEndpoints();
            api.MapLoomAndWeaveEndpoints();
            api.MapWorldLoreEndpoints();
            api.MapMarketplaceAndQuestEndpoints();
            api.MapSessionChronicleEndpoints();
            api.MapCampaignDashboardEndpoints();
            api.MapAdventureGuideEndpoints();
            api.MapTableRealtimeEndpoints();
            api.MapAuthAndCheckoutEndpoints();
            api.MapCompendiumAndStudioEndpoints();
            MapCoreEndpoints(api);
        }

        return app;
    }

    private static void MapCoreEndpoints(RouteGroupBuilder api)
    {

        api.MapGet("/health", () => Results.Ok(new
        {
            status = "healthy",
            application = "LoomWeaverV2",
            mysqlDatabase = "loomweaver",
            neo4jNamespace = "loomweaver",
            timestamp = DateTimeOffset.UtcNow
        }));

        api.MapGet("/campaigns", async (LoomWeaverMySqlRepository repo, CancellationToken ct) =>
        {
            var campaigns = await repo.GetCampaignsAsync(ct);
            return Results.Ok(campaigns);
        });

        api.MapGet("/campaigns/{campaignId:int}/entities", async (
            int campaignId,
            string? role,
            string? type,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            var viewerRole = NormalizeRole(role);
            var entities = await repo.GetAuthorizedEntitiesAsync(campaignId, viewerRole, type, ct);
            return Results.Ok(entities);
        });

        api.MapGet("/campaigns/{campaignId:int}/scenes", async (
            int campaignId,
            string? role,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            var viewerRole = NormalizeRole(role);
            var scenes = await repo.GetAuthorizedScenesAsync(campaignId, viewerRole, ct);
            return Results.Ok(scenes);
        });

        api.MapGet("/campaigns/{campaignId:int}/graph", async (
            int campaignId,
            string? role,
            LoomWeaverNeo4jService graph,
            CancellationToken ct) =>
        {
            var viewerRole = NormalizeRole(role);
            var subgraph = await graph.GetAuthorizedSubgraphAsync(campaignId, viewerRole, ct);
            return Results.Ok(subgraph);
        });

        api.MapGet("/campaigns/{campaignId:int}/loom", async (
            int campaignId,
            string? q,
            string? role,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            var viewerRole = NormalizeRole(role);
            var queryText = string.IsNullOrWhiteSpace(q) ? "What is happening in Cinth?" : q.Trim();
            var entities = await repo.GetAuthorizedEntitiesAsync(campaignId, viewerRole, null, ct);
            var matches = entities
                .Where(e =>
                    e.Name.Contains(queryText, StringComparison.OrdinalIgnoreCase) ||
                    e.Summary.Contains(queryText, StringComparison.OrdinalIgnoreCase) ||
                    e.Subtitle.Contains(queryText, StringComparison.OrdinalIgnoreCase))
                .Take(5)
                .ToList();

            if (matches.Count == 0)
            {
                matches = entities.Take(4).ToList();
            }

            var citations = matches
                .Select(m => new LoomCitationDto(
                    m.CompositeKey,
                    m.Name,
                    m.EntityType,
                    m.Summary,
                    m.RouteLink,
                    m.Visibility))
                .ToList();

            var synthesis = $"[The Loom · Role-Scoped ({viewerRole.ToUpperInvariant()}) Canon Synthesis]: Grounded in {citations.Count} authorized campaign record(s) from the 'loomweaver' database and graph. Zero invented lore.";
            return Results.Ok(new LoomQueryResponseDto(campaignId, queryText, viewerRole, synthesis, citations));
        });

        api.MapGet("/assets", async (string? category, LoomWeaverMySqlRepository repo, CancellationToken ct) =>
        {
            var assets = await repo.GetAssetsAsync(category, ct);
            return Results.Ok(assets);
        });

        api.MapPost("/dice/roll", (int sides, int count, int modifier, string? label) =>
        {
            var clampedSides = Math.Clamp(sides, 2, 100);
            var clampedCount = Math.Clamp(count, 1, 20);
            var rolls = Enumerable.Range(0, clampedCount)
                .Select(_ => Random.Shared.Next(1, clampedSides + 1))
                .ToArray();
            var rawSum = rolls.Sum();
            return Results.Ok(new
            {
                label = string.IsNullOrWhiteSpace(label) ? $"{clampedCount}d{clampedSides}" : label,
                sides = clampedSides,
                count = clampedCount,
                rolls,
                modifier,
                total = rawSum + modifier,
                isNat20 = clampedSides == 20 && rolls.Contains(20),
                isNat1 = clampedSides == 20 && rolls.Contains(1),
                serverAuthoritative = true,
                timestamp = DateTimeOffset.UtcNow
            });
        });
    }

    private static string NormalizeRole(string? role) =>
        string.Equals(role, "gm", StringComparison.OrdinalIgnoreCase) ? "gm" : "players";
}
