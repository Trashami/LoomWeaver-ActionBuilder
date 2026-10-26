namespace LoomWeaver.Modules.Maps.Features.SaveScene;

public static class MapPermissionPolicy
{
    public static bool CanSaveSceneRevision(string? viewerRole)
    {
        return string.Equals(viewerRole, "gm", StringComparison.OrdinalIgnoreCase)
            || string.Equals(viewerRole, "creator", StringComparison.OrdinalIgnoreCase);
    }

    public static string DenialMessage =>
        "Forbidden: Only GM or Creator accounts may commit authoritative LoomMaps scene revisions.";
}
