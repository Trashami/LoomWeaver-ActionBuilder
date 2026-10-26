using LoomWeaver.Modules.Maps.Features.SaveScene;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Maps.Features.BuildWallsAndPaths;

public static class BuildWallsAndPathsEndpoint
{
    public static void MapBuildWallsAndPathsEndpoints(this IEndpointRouteBuilder group)
    {
        group.MapGet("/campaigns/{campaignId:int}/maps/{sceneKey}/architecture", (
            int campaignId,
            string sceneKey,
            string? role) =>
        {
            var state = BuildWallsAndPathsHandler.GetArchitectureForRole(sceneKey, role);
            return Results.Ok(state);
        });

        group.MapPost("/campaigns/{campaignId:int}/maps/{sceneKey}/walls", (
            int campaignId,
            string sceneKey,
            CreateWallChamberRequest request) =>
        {
            if (!MapPermissionPolicy.CanSaveSceneRevision(request.ViewerRole))
            {
                return Results.Json(
                    new { error = MapPermissionPolicy.DenialMessage },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var (isValid, errorMessage) = BuildWallsAndPathsValidator.ValidateWall(request);
            if (!isValid)
            {
                return Results.BadRequest(new { error = errorMessage });
            }

            var updated = BuildWallsAndPathsHandler.AddWallChamber(campaignId, sceneKey, request);
            return Results.Ok(updated);
        });

        group.MapPost("/campaigns/{campaignId:int}/maps/{sceneKey}/paths", (
            int campaignId,
            string sceneKey,
            CreatePathRibbonRequest request) =>
        {
            if (!MapPermissionPolicy.CanSaveSceneRevision(request.ViewerRole))
            {
                return Results.Json(
                    new { error = MapPermissionPolicy.DenialMessage },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var (isValid, errorMessage) = BuildWallsAndPathsValidator.ValidatePath(request);
            if (!isValid)
            {
                return Results.BadRequest(new { error = errorMessage });
            }

            var updated = BuildWallsAndPathsHandler.AddPathRibbon(campaignId, sceneKey, request);
            return Results.Ok(updated);
        });
    }
}
