namespace LoomWeaver.Modules.Maps.Features.BuildWallsAndPaths;

public static class BuildWallsAndPathsValidator
{
    private static readonly HashSet<string> AllowedDrawModes = new(StringComparer.OrdinalIgnoreCase)
    {
        "room", "hexagon", "octagon", "l_shape", "circle", "cave", "line", "triangle"
    };

    public static (bool IsValid, string? ErrorMessage) ValidateWall(CreateWallChamberRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return (false, "Chamber or wall name is required.");
        }

        if (!AllowedDrawModes.Contains(req.DrawMode))
        {
            return (false, $"Unsupported wall draw mode '{req.DrawMode}'.");
        }

        if (req.WidthMeters < 2 || req.WidthMeters > 60 || req.DepthMeters < 2 || req.DepthMeters > 60)
        {
            return (false, "Chamber dimensions must be between 2m and 60m.");
        }

        if (req.ThicknessMeters < 0.15 || req.ThicknessMeters > 3.0)
        {
            return (false, "Wall thickness must be between 0.15m and 3.0m.");
        }

        return (true, null);
    }

    public static (bool IsValid, string? ErrorMessage) ValidatePath(CreatePathRibbonRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
        {
            return (false, "Path or cliff ribbon name is required.");
        }

        if (req.Waypoints is null || req.Waypoints.Count < 2)
        {
            return (false, "Path ribbon requires at least 2 waypoints.");
        }

        if (req.WidthMeters < 0.5 || req.WidthMeters > 16.0)
        {
            return (false, "Path ribbon width must be between 0.5m and 16.0m.");
        }

        return (true, null);
    }
}
