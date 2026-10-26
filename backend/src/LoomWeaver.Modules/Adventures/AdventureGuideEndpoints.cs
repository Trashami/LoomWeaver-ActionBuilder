using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.Neo4j;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Adventures;

public static class AdventureGuideEndpoints
{
    public static RouteGroupBuilder MapAdventureGuideEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/campaigns/{campaignId:int}/adventure-guide", (
            int campaignId,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            var guide = AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter);
            return Results.Ok(guide);
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/beats/{beatId}/toggle", (
            int campaignId,
            string beatId,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            AdventureGuideStateStore.ToggleBeat(beatId);
            return Results.Ok(AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter));
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/nodes/{nodeId}/state", (
            int campaignId,
            string nodeId,
            UpdateNodeProgressStateRequest req,
            string? scopeKind,
            string? scopeId,
            string? filter) =>
        {
            var isGm = string.Equals(req.Role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            AdventureGuideStateStore.UpdateNodeState(nodeId, req.ProgressState, req.OutcomeNotes);
            return Results.Ok(AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter));
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/grants", (
            int campaignId,
            GrantAdventureKnowledgeRequest req,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            AdventureGuideStateStore.GrantKnowledge(req);
            return Results.Ok(AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter));
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/rewards/award", (
            int campaignId,
            AwardAdventureRewardRequest req,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            var (newlyAwarded, xpAwarded, message) = AdventureGuideStateStore.AwardReward(req);
            var guide = AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter);
            return Results.Ok(new
            {
                newlyAwarded,
                xpAwarded,
                message,
                guide
            });
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/npcs", async (
            int campaignId,
            CreateAdventureNpcRequest req,
            LoomWeaverNeo4jService graph,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter,
            CancellationToken ct) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            var cleanName = string.IsNullOrWhiteSpace(req.Name) ? "Wandering Chapel Pilgrim" : req.Name.Trim();
            var slug = cleanName.ToLowerInvariant().Replace(' ', '-');
            var nodeId = $"node-npc-{slug}";
            var compositeKey = $"{campaignId}:NPC:npc-{slug}";
            var disp = string.IsNullOrWhiteSpace(req.DispositionLabel) ? "Cautious" : req.DispositionLabel.Trim();
            var tone = disp.Equals("Hostile", StringComparison.OrdinalIgnoreCase)
                ? "crimson"
                : disp.Equals("Allied", StringComparison.OrdinalIgnoreCase) || disp.Equals("Guarded", StringComparison.OrdinalIgnoreCase)
                    ? "emerald"
                    : "gold";
            var locNode = string.IsNullOrWhiteSpace(req.LocationNodeId) ? "node-room-c1-nave" : req.LocationNodeId;
            var sesId = string.IsNullOrWhiteSpace(req.SessionId) ? "session-15" : req.SessionId;
            var vis = string.Equals(req.Visibility, "gm", StringComparison.OrdinalIgnoreCase) ? "gm" : "players";

            var item = AdventureGuideStateStore.RegisterCharacterOrNpc(
                campaignId,
                nodeId,
                compositeKey,
                cleanName,
                string.IsNullOrWhiteSpace(req.Role) ? $"Chapel Envoy · {disp}" : req.Role.Trim(),
                disp,
                tone,
                string.IsNullOrWhiteSpace(req.ArtworkUrl) ? "/icrandor_world_dashboard.jpg" : req.ArtworkUrl.Trim(),
                string.IsNullOrWhiteSpace(req.Motive) ? "Investigate the tremors beneath the Ruined Chapel." : req.Motive.Trim(),
                string.IsNullOrWhiteSpace(req.DialogueExcerpt) ? $"\"The lantern light in {locNode} does not reach the crypt steps.\"" : req.DialogueExcerpt.Trim(),
                $"Present in {locNode.Replace("node-room-", "").ToUpperInvariant()} · Linked to {sesId}",
                $"/campaigns?inspect=npc-{slug}",
                vis);

            await graph.ProjectCharacterOrNpcNodeAsync(
                campaignId,
                new EntitySummaryDto(
                    compositeKey,
                    campaignId,
                    "NPC",
                    $"npc-{slug}",
                    item.Name,
                    item.Role,
                    item.Motive,
                    vis,
                    "approved",
                    item.RouteLink),
                sesId,
                $"{campaignId}:Location:{locNode}",
                ct);

            return Results.Ok(AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter));
        });

        api.MapPost("/campaigns/{campaignId:int}/adventure-guide/assign-map", async (
            int campaignId,
            AssignBattlemapToAdventureRequest req,
            LoomWeaverNeo4jService graph,
            string? role,
            string? scopeKind,
            string? scopeId,
            string? filter,
            CancellationToken ct) =>
        {
            var isGm = string.Equals(role ?? "gm", "gm", StringComparison.OrdinalIgnoreCase);
            var assigned = AdventureGuideStateStore.AssignBattlemap(req);

            await graph.ProjectBattlemapAssignmentAsync(
                campaignId,
                assigned.SceneKey,
                assigned.Title,
                assigned.SessionId,
                $"{campaignId}:Location:{assigned.LocationNodeId}",
                ct);

            return Results.Ok(AdventureGuideStateStore.BuildGuide(campaignId, isGm, scopeKind, scopeId, filter));
        });

        return api;
    }
}
