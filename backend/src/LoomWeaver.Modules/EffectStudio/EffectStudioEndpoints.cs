using LoomWeaver.Domain;
using LoomWeaver.Modules.EffectStudio.Domain;
using LoomWeaver.Modules.EffectStudio.Engine;
using LoomWeaver.Modules.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.EffectStudio;

public static class EffectStudioEndpoints
{
    private static readonly EffectTimelineValidationEngine Engine = new();

    public static RouteGroupBuilder MapEffectStudioEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/effects/health", () => Results.Ok(new
        {
            status = "healthy",
            service = "LoomWeaver.EffectStudio",
            emittersLoaded = EffectEmitterCatalog.GetAllEmitters().Count,
            timestamp = DateTimeOffset.UtcNow
        }));

        api.MapGet("/effects/studio", (int? campaignId, string? effectId) =>
        {
            var cid = campaignId.GetValueOrDefault(1);
            var emitters = EffectEmitterCatalog.GetAllEmitters();
            var documents = Engine.GetDocumentsForCampaign(cid);
            var activeDoc = Engine.GetOrDefaultDocument(effectId);

            return Results.Ok(new
            {
                emitters,
                documents,
                activeDocument = activeDoc
            });
        });

        api.MapGet("/effects/emitters", (string? category, string? q) =>
        {
            var all = EffectEmitterCatalog.GetAllEmitters();
            var filtered = all.Where(e =>
                (string.IsNullOrWhiteSpace(category) ||
                 string.Equals(category, "All Categories", StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(e.Category, category, StringComparison.OrdinalIgnoreCase)) &&
                (string.IsNullOrWhiteSpace(q) ||
                 e.Name.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase) ||
                 e.Category.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase) ||
                 e.MaterialName.Contains(q.Trim(), StringComparison.OrdinalIgnoreCase))
            ).ToList();

            return Results.Ok(filtered);
        });

        api.MapPost("/effects/save", (SaveEffectStudioDocumentRequest req) =>
        {
            var saved = Engine.ValidateAndSave(req);
            TableRealtimeEndpoints.RecordEvent(
                saved.CampaignId,
                "effect_saved",
                "EffectBuilder Studio",
                $"Saved visual effect '{saved.Name}' ({saved.Tracks.Count} tracks, {saved.ActiveProperties.EmissionRate} pts/s).",
                "{}"
            );
            return Results.Ok(saved);
        });

        api.MapPost("/effects/test-in-game", (EffectInGameTestRequest req) =>
        {
            var result = Engine.SimulateInGameTest(req);
            TableRealtimeEndpoints.RecordEvent(
                1,
                "effect_tested",
                "EffectBuilder In-Game Test",
                result.CombatLogSummary,
                "{}"
            );
            return Results.Ok(result);
        });

        api.MapGet("/effects/{effectId}/export", (string effectId) =>
        {
            var bundle = Engine.BuildExportBundle(effectId);
            return Results.Ok(bundle);
        });

        return api;
    }
}
