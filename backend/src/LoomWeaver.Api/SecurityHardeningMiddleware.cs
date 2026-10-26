using System.Collections.Concurrent;
using Microsoft.AspNetCore.Http;

namespace LoomWeaver.Api;

public static class SecurityHardeningMiddleware
{
    private static readonly ConcurrentDictionary<string, (int Count, DateTimeOffset WindowStart)> AuthRateLimits = new();
    private const int MaxAuthAttemptsPerMinute = 15;

    public static bool IsTrustedOrigin(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin)) return false;
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;

        var host = uri.Host.ToLowerInvariant();
        return host == "localhost" ||
               host == "127.0.0.1" ||
               host == "loom-weaver.com" ||
               host.EndsWith(".loom-weaver.com", StringComparison.Ordinal) ||
               host == "geo-gamers.com" ||
               host.EndsWith(".geo-gamers.com", StringComparison.Ordinal) ||
               host == "geo-coders.com" ||
               host.EndsWith(".geo-coders.com", StringComparison.Ordinal);
    }

    public static void ApplySecurityHeaders(HttpContext context)
    {
        var headers = context.Response.Headers;
        headers["X-Content-Type-Options"] = "nosniff";
        headers["X-Frame-Options"] = "SAMEORIGIN";
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        headers["X-Permitted-Cross-Domain-Policies"] = "none";
        headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()";

        if (context.Request.IsHttps ||
            string.Equals(context.Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase))
        {
            headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
        }
    }

    public static bool IsRateLimitedAuthRequest(HttpContext context, string path)
    {
        var isMutatingAuth =
            HttpMethods.IsPost(context.Request.Method) &&
            (path.EndsWith("/auth/login", StringComparison.OrdinalIgnoreCase) ||
             path.EndsWith("/auth/register", StringComparison.OrdinalIgnoreCase) ||
             path.EndsWith("/auth/google", StringComparison.OrdinalIgnoreCase));

        if (!isMutatingAuth) return false;

        var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        var clientIp = !string.IsNullOrWhiteSpace(forwardedFor)
            ? forwardedFor.Split(',')[0].Trim()
            : (context.Connection.RemoteIpAddress?.ToString() ?? "unknown");

        var now = DateTimeOffset.UtcNow;
        var entry = AuthRateLimits.AddOrUpdate(
            clientIp,
            _ => (1, now),
            (_, existing) =>
            {
                if ((now - existing.WindowStart).TotalSeconds > 60)
                {
                    return (1, now);
                }
                return (existing.Count + 1, existing.WindowStart);
            });

        return entry.Count > MaxAuthAttemptsPerMinute;
    }
}
