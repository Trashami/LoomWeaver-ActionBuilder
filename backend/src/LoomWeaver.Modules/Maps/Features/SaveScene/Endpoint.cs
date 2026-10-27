using LoomWeaver.Modules.Maps.Domain;
using LoomWeaver.Modules.Maps.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Maps.Features.SaveScene;

public static class SaveSceneEndpoint
{
    public static void MapLoomMapsStudioStage1Endpoints(this IEndpointRouteBuilder group)
    {
        group.MapGet("/maps/presets", () =>
            Results.Ok(SceneRepository.GetPresets()));

        group.MapGet("/maps/catalog-assets", (string? category, string? q) =>
            Results.Ok(SceneRepository.GetCatalogAssets(category, q)));

        group.MapGet("/maps/assets/thumbnails", (string? category, string? q) =>
            Results.Ok(PythonThumbnailProcessRunner.GetThumbnails(category, q)));

        group.MapPost("/maps/assets/render-batch", async (BatchRenderThumbnailsRequest? req) =>
        {
            var result = await PythonThumbnailProcessRunner.RunBatchAsync(req?.ForceReRender ?? false);
            return Results.Ok(result);
        });

        group.MapPost("/maps/assets/upload-3d", async (SingleUpload3dAssetRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.FileName))
            {
                return Results.BadRequest(new { error = "A valid .glb fileName is required for single-upload PNG processing." });
            }

            var result = await PythonThumbnailProcessRunner.RunSingleUploadAsync(req);
            return Results.Ok(result);
        });

        group.MapGet("/campaigns/{campaignId:int}/maps/{sceneKey}/studio-snapshot", (
            int campaignId,
            string sceneKey,
            string? role) =>
        {
            var isGm = MapPermissionPolicy.CanSaveSceneRevision(role ?? "gm");
            var snapshot = SceneRepository.GetOrCreateSnapshot(campaignId, sceneKey);
            if (!isGm)
            {
                var visibleLayers = snapshot.Layers
                    .Where(l => !string.Equals(l.Type, "notes", StringComparison.OrdinalIgnoreCase))
                    .ToList();
                return Results.Ok(snapshot with { Layers = visibleLayers });
            }

            return Results.Ok(snapshot);
        });

        group.MapPost("/campaigns/{campaignId:int}/maps/{sceneKey}/save-revision", (
            int campaignId,
            string sceneKey,
            SaveSceneRevisionRequest request) =>
        {
            if (!MapPermissionPolicy.CanSaveSceneRevision(request.ViewerRole))
            {
                return Results.Json(
                    new { error = MapPermissionPolicy.DenialMessage },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var (isValid, errorMessage) = SaveSceneValidator.Validate(request);
            if (!isValid)
            {
                return Results.BadRequest(new { error = errorMessage });
            }

            var response = SaveSceneHandler.Execute(campaignId, sceneKey, request);
            return Results.Ok(response);
        });
    }
}
