using Microsoft.AspNetCore.Http;

namespace LoomWeaver.Modules.Auth;

public sealed record ResolvedCampaignAccess(
    long UserId,
    string Email,
    string Username,
    string AccountRole,
    string EffectiveViewerRole,
    bool IsAccountGm,
    bool IsEffectiveGm,
    string BoundCharacterKey
);

public static class CampaignAccessResolver
{
    public static ResolvedCampaignAccess Resolve(HttpContext? context, int campaignId, string? requestedPreviewRole = null)
    {
        var user = context is not null ? AuthAndCheckoutEndpoints.ResolveAuthenticatedUser(context) : null;
        if (user is null)
        {
            var previewAsPlayer = string.Equals(requestedPreviewRole, "players", StringComparison.OrdinalIgnoreCase) ||
                                  string.Equals(requestedPreviewRole, "player", StringComparison.OrdinalIgnoreCase);
            var effectiveRole = previewAsPlayer ? "players" : "gm";

            return new ResolvedCampaignAccess(
                0,
                "gm@loom-weaver.com",
                "GameMaster",
                effectiveRole,
                effectiveRole,
                effectiveRole == "gm",
                effectiveRole == "gm",
                effectiveRole == "gm" ? "all-party" : "pc-dal"
            );
        }

        var isPlayerAccount = string.Equals(user.Role, "player", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(user.Role, "players", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(user.Email, "player@loom-weaver.com", StringComparison.OrdinalIgnoreCase);

        var isAccountGm = !isPlayerAccount;

        // A player account can NEVER escalate to GM via query parameters or request body.
        // An authenticated GM can down-scope to "players" when using the "Player View" preview toggle.
        var wantsPlayerPreview = string.Equals(requestedPreviewRole, "players", StringComparison.OrdinalIgnoreCase) ||
                                 string.Equals(requestedPreviewRole, "player", StringComparison.OrdinalIgnoreCase);

        var isEffectiveGm = isAccountGm && !wantsPlayerPreview;
        var effectiveViewerRole = isEffectiveGm ? "gm" : "players";

        var boundChar = !string.IsNullOrWhiteSpace(user.BoundCharacter) && user.BoundCharacter != "GM"
            ? NormalizeCharacterKey(user.BoundCharacter)
            : (isPlayerAccount ? "pc-dal" : "all-party");

        return new ResolvedCampaignAccess(
            user.Id,
            user.Email,
            user.Username,
            isAccountGm ? "gm" : "players",
            effectiveViewerRole,
            isAccountGm,
            isEffectiveGm,
            boundChar
        );
    }

    private static string NormalizeCharacterKey(string raw)
    {
        var clean = raw.Trim();
        if (clean.StartsWith("pc-", StringComparison.OrdinalIgnoreCase)) return clean.ToLowerInvariant();
        if (clean.StartsWith("Dal", StringComparison.OrdinalIgnoreCase)) return "pc-dal";
        if (clean.StartsWith("Fivi", StringComparison.OrdinalIgnoreCase)) return "pc-fivi";
        if (clean.StartsWith("Kildrid", StringComparison.OrdinalIgnoreCase)) return "pc-kildrid";
        if (clean.StartsWith("Kycius", StringComparison.OrdinalIgnoreCase)) return "pc-kycius";
        if (clean.StartsWith("Munk", StringComparison.OrdinalIgnoreCase)) return "pc-munk";
        return clean;
    }
}
