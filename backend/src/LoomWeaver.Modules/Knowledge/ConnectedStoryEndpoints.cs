using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules.Auth;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Knowledge;

public static class ConnectedStoryEndpoints
{
    public static RouteGroupBuilder MapConnectedStoryEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/campaigns/{campaignId:int}/story-overview", (
            int campaignId,
            string? role,
            string? beatId,
            HttpContext httpContext) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            return Results.Ok(ConnectedStoryEngine.BuildStoryWorkspace(campaignId, access, beatId));
        });

        api.MapGet("/campaigns/{campaignId:int}/story-chain", (
            int campaignId,
            string? role,
            string? scopeNodeId,
            HttpContext httpContext) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            return Results.Ok(ConnectedStoryEngine.BuildConnectedChain(campaignId, access, scopeNodeId));
        });

        api.MapPost("/campaigns/{campaignId:int}/story-overview/beats", (
            int campaignId,
            string? role,
            CreateStoryBeatRequest req,
            HttpContext httpContext) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            if (!access.IsAccountGm)
            {
                return Results.Json(new { message = "GM authorization required to add story beats." }, statusCode: 403);
            }

            lock (ConnectedStorySeedStore.SyncLock)
            {
                var targetActId = string.IsNullOrWhiteSpace(req.ActId) ? "act-2" : req.ActId.Trim();
                var actIdx = ConnectedStorySeedStore.Acts.FindIndex(a => a.Id == targetActId);
                if (actIdx < 0) actIdx = 1;

                var act = ConnectedStorySeedStore.Acts[actIdx];
                var nextNum = act.Beats.Count + 1;
                var actNumber = actIdx + 1;
                var code = $"{actNumber}.{nextNum}";
                var cleanTitle = string.IsNullOrWhiteSpace(req.Title) ? $"{code} New Story Chapter" : req.Title.Trim();
                if (!char.IsDigit(cleanTitle[0]) && actIdx != 1)
                {
                    cleanTitle = $"{code} {cleanTitle}";
                }

                var newBeat = new StoryBeatItemDto(
                    $"beat-{actNumber}-{nextNum}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000}",
                    act.Id,
                    code,
                    cleanTitle,
                    string.IsNullOrWhiteSpace(req.Kind) ? "scene" : req.Kind.Trim(),
                    string.IsNullOrWhiteSpace(req.Status) ? "Planned" : req.Status.Trim(),
                    "location",
                    "node-loc-ruined-chapel",
                    string.IsNullOrWhiteSpace(req.LinkedLocationKey) ? "loc-ruined-chapel" : req.LinkedLocationKey.Trim(),
                    "/campaigns",
                    "players"
                );

                var beats = act.Beats.ToList();
                beats.Add(newBeat);
                var completed = beats.Count(b => b.Status == "Complete");
                ConnectedStorySeedStore.Acts[actIdx] = act with
                {
                    Beats = beats,
                    CompletedCount = completed,
                    TotalCount = beats.Count,
                    Status = act.Status == "Unwritten" ? "Planned" : act.Status
                };
                ConnectedStorySeedStore.ActiveBeatId = newBeat.Id;
            }

            return Results.Ok(ConnectedStoryEngine.BuildStoryWorkspace(campaignId, access));
        });

        api.MapPost("/campaigns/{campaignId:int}/story-overview/beats/{beatId}/status", (
            int campaignId,
            string beatId,
            string? role,
            ToggleStoryBeatStatusRequest? req,
            HttpContext httpContext) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            if (!access.IsAccountGm)
            {
                return Results.Json(new { message = "GM authorization required to update story beat progress." }, statusCode: 403);
            }

            lock (ConnectedStorySeedStore.SyncLock)
            {
                for (var aIdx = 0; aIdx < ConnectedStorySeedStore.Acts.Count; aIdx++)
                {
                    var act = ConnectedStorySeedStore.Acts[aIdx];
                    var beats = act.Beats.ToList();
                    var bIdx = beats.FindIndex(b => b.Id == beatId);
                    if (bIdx < 0) continue;

                    var cur = beats[bIdx];
                    var nextStatus = !string.IsNullOrWhiteSpace(req?.NextStatus)
                        ? req.NextStatus.Trim()
                        : cur.Status switch
                        {
                            "Planned" => "In Progress",
                            "In Progress" => "Complete",
                            _ => "Planned"
                        };

                    beats[bIdx] = cur with { Status = nextStatus };
                    var completed = beats.Count(b => b.Status == "Complete");
                    var actStatus = completed == beats.Count && beats.Count > 0
                        ? "Complete"
                        : beats.Any(b => b.Status is "In Progress" or "Complete")
                            ? "In Progress"
                            : "Planned";

                    ConnectedStorySeedStore.Acts[aIdx] = act with
                    {
                        Beats = beats,
                        CompletedCount = completed,
                        TotalCount = beats.Count,
                        Status = actStatus
                    };
                    ConnectedStorySeedStore.ActiveBeatId = beatId;
                    break;
                }
            }

            return Results.Ok(ConnectedStoryEngine.BuildStoryWorkspace(campaignId, access, beatId));
        });

        api.MapPost("/campaigns/{campaignId:int}/story-chain/claims/{claimId}/truth", (
            int campaignId,
            string claimId,
            string? role,
            UpdateClaimTruthRequest req,
            HttpContext httpContext) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            if (!access.IsAccountGm)
            {
                return Results.Json(new { message = "GM authorization required to assess canonical truth." }, statusCode: 403);
            }

            lock (ConnectedStorySeedStore.SyncLock)
            {
                var idx = ConnectedStorySeedStore.Claims.FindIndex(c => c.Id == claimId || c.CompositeKey == claimId);
                if (idx < 0) return Results.NotFound(new { message = "Claim not found." });

                var cur = ConnectedStorySeedStore.Claims[idx];
                var normTruth = (req.TruthAssessment ?? "confirmed").Trim().ToLowerInvariant() switch
                {
                    "unverified" => "unverified",
                    "disputed" => "disputed",
                    "disproven" => "disproven",
                    _ => "confirmed"
                };

                ConnectedStorySeedStore.Claims[idx] = cur with
                {
                    TruthAssessment = normTruth,
                    GmCanonicalTruth = string.IsNullOrWhiteSpace(req.GmCanonicalTruth) ? cur.GmCanonicalTruth : req.GmCanonicalTruth.Trim(),
                    Statement = string.IsNullOrWhiteSpace(req.Statement) ? cur.Statement : req.Statement.Trim(),
                    Revision = cur.Revision + 1
                };
            }

            return Results.Ok(ConnectedStoryEngine.BuildConnectedChain(campaignId, access));
        });

        api.MapPost("/campaigns/{campaignId:int}/story-chain/relationships", async (
            int campaignId,
            string? role,
            CreateStoryRelationshipRequest req,
            LoomWeaverMySqlRepository repo,
            LoomWeaverNeo4jService graph,
            HttpContext httpContext,
            CancellationToken ct) =>
        {
            var access = CampaignAccessResolver.Resolve(httpContext, campaignId, role);
            if (!access.IsAccountGm)
            {
                return Results.Json(new { message = "GM authorization required to modify story relationships." }, statusCode: 403);
            }

            await ConnectedStoryEngine.SaveRelationshipAndProjectAsync(campaignId, req, repo, graph, ct);
            return Results.Ok(ConnectedStoryEngine.BuildConnectedChain(campaignId, access));
        });

        return api;
    }
}
