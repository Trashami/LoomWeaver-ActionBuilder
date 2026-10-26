using LoomWeaver.Modules.Maps.Domain;

namespace LoomWeaver.Modules.Maps.Features.SaveScene;

public static class SaveSceneValidator
{
    public static (bool IsValid, string? ErrorMessage) Validate(SaveSceneRevisionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length < 3)
        {
            return (false, "Map title must be at least 3 characters long.");
        }

        if (request.Grid is null || request.Grid.GridSizePx < 10 || request.Grid.GridSizePx > 256)
        {
            return (false, "Grid cell size must be between 10px and 256px.");
        }

        if (request.Layers is null || request.Layers.Count == 0)
        {
            return (false, "Scene revision must contain at least one studio layer.");
        }

        return (true, null);
    }
}
