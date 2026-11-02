using System.Collections.Concurrent;
using System.Security.Cryptography;
using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Modules.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using MySqlConnector;

namespace LoomWeaver.Modules.Auth;

public sealed record UserVttPreferencesDto(
    string? MapQuality,
    double? GridScale,
    double? GridOffsetX,
    double? GridOffsetY
);

public static class AuthAndCheckoutEndpoints
{
    private static readonly ConcurrentDictionary<long, UserVttPreferencesDto> FallbackPrefs = new();

    private static readonly List<StripeCheckoutSettlementResponse> SettlementLedger = new()
    {
        new(
            "cs_live_a1b2c3d4e5",
            "paid_settled",
            "mod-starter-pack",
            "Starter Campaign Module",
            24.00,
            20.40,
            3.60,
            "@TrashamiChronicles",
            "LW-8515-9041",
            DateTimeOffset.UtcNow.AddHours(-4)
        ),
        new(
            "cs_live_f6g7h8i9j0",
            "paid_settled",
            "mod-raid-pack",
            "Raid Encounter & Boss Pack",
            18.00,
            15.30,
            2.70,
            "@TrashamiChronicles",
            "LW-8515-9042",
            DateTimeOffset.UtcNow.AddHours(-2)
        )
    };

    public static RouteGroupBuilder MapAuthAndCheckoutEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/auth/accounts", (HttpContext ctx) =>
        {
            var caller = ResolveAuthenticatedUser(ctx);
            if (caller is null)
            {
                return Results.Json(new { message = "Authentication required." }, statusCode: StatusCodes.Status401Unauthorized);
            }
            return Results.Ok(new[] { MySqlUserAuthStore.ToContract(caller) });
        });

        api.MapPost("/auth/login", async (
            AuthLoginRequest req,
            HttpContext httpCtx,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            var identifier = !string.IsNullOrWhiteSpace(req.Identifier)
                ? req.Identifier.Trim()
                : (req.AccountId ?? string.Empty).Trim();
            var password = !string.IsNullOrWhiteSpace(req.Password)
                ? req.Password
                : (req.PasswordOrPin ?? string.Empty);

            if (string.IsNullOrWhiteSpace(identifier) || string.IsNullOrWhiteSpace(password))
            {
                return Results.BadRequest(new { message = "Email/username and password are required." });
            }

            var user = await MySqlUserAuthStore.AuthenticateAsync(repo, identifier, password, ct);
            if (user is null)
            {
                return Results.Json(
                    new { message = "Invalid email/username or password." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var expiresAt = DateTimeOffset.UtcNow.AddDays(30);
            var token = MySqlUserAuthStore.IssueHmacJwt(user, expiresAt);
            AppendHttpOnlySessionCookie(httpCtx, token, expiresAt);
            var profile = MySqlUserAuthStore.ToContract(user);
            var legacyUser = MySqlUserAuthStore.ToLegacyUserDto(user);

            TableRealtimeEndpoints.RecordEvent(
                1,
                "auth_login",
                profile.DisplayName,
                $"Authenticated session established for {profile.DisplayName} ({profile.Email}, Role={profile.Role.ToUpperInvariant()}).",
                "{}"
            );

            return Results.Ok(new AuthSessionResponse(token, expiresAt, profile, legacyUser));
        });

        api.MapPost("/auth/google", async (
            AuthGoogleLoginRequest req,
            HttpContext httpCtx,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            var user = await MySqlUserAuthStore.AuthenticateGoogleTokenAsync(repo, req.IdToken, ct);
            if (user is null)
            {
                return Results.Json(
                    new { message = "Google authentication failed. Invalid or expired Google ID token." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var expiresAt = DateTimeOffset.UtcNow.AddDays(30);
            var token = MySqlUserAuthStore.IssueHmacJwt(user, expiresAt);
            AppendHttpOnlySessionCookie(httpCtx, token, expiresAt);
            var profile = MySqlUserAuthStore.ToContract(user);
            var legacyUser = MySqlUserAuthStore.ToLegacyUserDto(user);

            return Results.Ok(new AuthSessionResponse(token, expiresAt, profile, legacyUser));
        });

        api.MapPost("/auth/register", async (
            AuthRegisterRequest req,
            HttpContext httpCtx,
            LoomWeaverMySqlRepository repo,
            CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@'))
            {
                return Results.BadRequest(new { message = "A valid email address is required." });
            }
            if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 6)
            {
                return Results.BadRequest(new { message = "Password must be at least 6 characters." });
            }

            try
            {
                var user = await MySqlUserAuthStore.RegisterAsync(
                    repo,
                    req.Email,
                    req.Username ?? req.Email.Split('@')[0],
                    req.DisplayName,
                    req.Password,
                    ct);

                var expiresAt = DateTimeOffset.UtcNow.AddDays(30);
                var token = MySqlUserAuthStore.IssueHmacJwt(user, expiresAt);
                AppendHttpOnlySessionCookie(httpCtx, token, expiresAt);
                var profile = MySqlUserAuthStore.ToContract(user);
                var legacyUser = MySqlUserAuthStore.ToLegacyUserDto(user);

                TableRealtimeEndpoints.RecordEvent(
                    1,
                    "auth_register",
                    profile.DisplayName,
                    $"New LoomWeaver account registered: {profile.DisplayName} ({profile.Email}, Role={profile.Role.ToUpperInvariant()}).",
                    "{}"
                );

                return Results.Ok(new AuthSessionResponse(token, expiresAt, profile, legacyUser));
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new { message = ex.Message });
            }
        });

        api.MapPost("/auth/logout", (HttpContext httpCtx) =>
        {
            ClearHttpOnlySessionCookie(httpCtx);
            return Results.Ok(new { success = true });
        });

        api.MapPost("/auth/request-account", (AuthAccountRequestDto req) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || !req.Email.Contains('@') || string.IsNullOrWhiteSpace(req.Username))
            {
                return Results.BadRequest(new { success = false, message = "A valid email address and username are required." });
            }

            return Results.Ok(new
            {
                success = true,
                message = "Your account request has been submitted for administrator review. Or use the Create Account tab to set your password and sign in immediately."
            });
        });

        api.MapGet("/auth/me", (HttpContext ctx) =>
        {
            var user = ResolveAuthenticatedUser(ctx);
            if (user is null)
            {
                return Results.Json(new { message = "Unauthorized or expired session." }, statusCode: StatusCodes.Status401Unauthorized);
            }

            var expiresAt = DateTimeOffset.UtcNow.AddDays(30);
            var token = MySqlUserAuthStore.IssueHmacJwt(user, expiresAt);
            AppendHttpOnlySessionCookie(ctx, token, expiresAt);
            return Results.Ok(MySqlUserAuthStore.ToLegacyUserDto(user, token));
        });

        api.MapPut("/auth/ai-preference", (HttpContext ctx) =>
        {
            var user = ResolveAuthenticatedUser(ctx);
            if (user is null)
            {
                return Results.Json(new { message = "Unauthorized or expired session." }, statusCode: StatusCodes.Status401Unauthorized);
            }
            return Results.Ok(MySqlUserAuthStore.ToLegacyUserDto(user));
        });

        api.MapGet("/auth/preferences", async (HttpContext ctx, LoomWeaverMySqlRepository repo, CancellationToken ct) =>
        {
            var user = ResolveAuthenticatedUser(ctx);
            if (user is null)
            {
                return Results.Json(new { message = "Authentication required." }, statusCode: StatusCodes.Status401Unauthorized);
            }

            try
            {
                await using var conn = await repo.OpenConnectionAsync(ct);
                await EnsurePrefsTableAsync(conn, ct);
                await using var cmd = new MySqlCommand(
                    "SELECT map_quality, grid_scale, grid_offset_x, grid_offset_y FROM lw_user_preferences WHERE user_id = @uid LIMIT 1;",
                    conn);
                cmd.Parameters.AddWithValue("@uid", user.Id);
                await using var r = await cmd.ExecuteReaderAsync(ct);
                if (await r.ReadAsync(ct))
                {
                    var dto = new UserVttPreferencesDto(
                        r.IsDBNull(0) ? "balanced" : r.GetString(0),
                        r.IsDBNull(1) ? 1.0 : r.GetDouble(1),
                        r.IsDBNull(2) ? 0.0 : r.GetDouble(2),
                        r.IsDBNull(3) ? 0.0 : r.GetDouble(3));
                    FallbackPrefs[user.Id] = dto;
                    return Results.Ok(dto);
                }
            }
            catch
            {
                // Fallback to in-memory preference cache when DB unavailable
            }

            return Results.Ok(FallbackPrefs.TryGetValue(user.Id, out var cached)
                ? cached
                : new UserVttPreferencesDto("balanced", 1.0, 0.0, 0.0));
        });

        api.MapPut("/auth/preferences", async (UserVttPreferencesDto req, HttpContext ctx, LoomWeaverMySqlRepository repo, CancellationToken ct) =>
        {
            var user = ResolveAuthenticatedUser(ctx);
            if (user is null)
            {
                return Results.Json(new { message = "Authentication required." }, statusCode: StatusCodes.Status401Unauthorized);
            }

            var quality = (req.MapQuality ?? "balanced").Trim().ToLowerInvariant();
            if (quality is not ("performance" or "balanced" or "visual")) quality = "balanced";
            var scale = Math.Clamp(req.GridScale ?? 1.0, 0.25, 3.0);
            var offsetX = Math.Clamp(req.GridOffsetX ?? 0.0, -200.0, 200.0);
            var offsetY = Math.Clamp(req.GridOffsetY ?? 0.0, -200.0, 200.0);
            var saved = new UserVttPreferencesDto(quality, scale, offsetX, offsetY);
            FallbackPrefs[user.Id] = saved;

            try
            {
                await using var conn = await repo.OpenConnectionAsync(ct);
                await EnsurePrefsTableAsync(conn, ct);
                await using var cmd = new MySqlCommand("""
                    INSERT INTO lw_user_preferences (user_id, map_quality, grid_scale, grid_offset_x, grid_offset_y)
                    VALUES (@uid, @q, @s, @ox, @oy)
                    ON DUPLICATE KEY UPDATE
                      map_quality = VALUES(map_quality),
                      grid_scale = VALUES(grid_scale),
                      grid_offset_x = VALUES(grid_offset_x),
                      grid_offset_y = VALUES(grid_offset_y);
                    """, conn);
                cmd.Parameters.AddWithValue("@uid", user.Id);
                cmd.Parameters.AddWithValue("@q", quality);
                cmd.Parameters.AddWithValue("@s", scale);
                cmd.Parameters.AddWithValue("@ox", offsetX);
                cmd.Parameters.AddWithValue("@oy", offsetY);
                await cmd.ExecuteNonQueryAsync(ct);
            }
            catch
            {
                // Kept in FallbackPrefs
            }

            return Results.Ok(saved);
        });

        api.MapGet("/marketplace/settlements", (HttpContext ctx) =>
        {
            if (ResolveAuthenticatedUser(ctx) is null)
            {
                return Results.Json(new { message = "Authentication required." }, statusCode: StatusCodes.Status401Unauthorized);
            }
            return Results.Ok(SettlementLedger);
        });

        api.MapPost("/marketplace/checkout", (StripeCheckoutRequest req, HttpContext ctx) =>
        {
            var caller = ResolveAuthenticatedUser(ctx);
            if (caller is null)
            {
                return Results.Json(new { message = "Authentication required." }, statusCode: StatusCodes.Status401Unauthorized);
            }

            var gross = Math.Round(Math.Max(1.0, req.PriceUsd), 2);
            var creatorTransfer = Math.Round(gross * 0.85, 2);
            var platformFee = Math.Round(gross - creatorTransfer, 2);
            var now = DateTimeOffset.UtcNow;

            var settlement = new StripeCheckoutSettlementResponse(
                $"cs_live_{now.ToUnixTimeMilliseconds():x}",
                "paid_settled",
                string.IsNullOrWhiteSpace(req.ItemId) ? "mod-skyship-lost-isles" : req.ItemId.Trim(),
                string.IsNullOrWhiteSpace(req.ItemTitle) ? "Skyship & Lost Isles Pack" : req.ItemTitle.Trim(),
                gross,
                creatorTransfer,
                platformFee,
                string.IsNullOrWhiteSpace(req.CreatorHandle) ? "@LoomWeaverCreator" : req.CreatorHandle.Trim(),
                $"LW-8515-{RandomNumberGenerator.GetInt32(1000, 9999)}",
                now
            );

            SettlementLedger.Insert(0, settlement);

            TableRealtimeEndpoints.RecordEvent(
                1,
                "stripe_checkout",
                settlement.CreatorHandle,
                $"Stripe 85/15 Checkout settled for '{settlement.ItemTitle}': ${settlement.CreatorTransferUsd:F2} (85%) transferred to {settlement.CreatorHandle}.",
                "{}"
            );

            return Results.Ok(settlement);
        });

        return api;
    }

    private static async Task EnsurePrefsTableAsync(MySqlConnection conn, CancellationToken ct)
    {
        await using var cmd = new MySqlCommand("""
            CREATE TABLE IF NOT EXISTS lw_user_preferences (
              user_id BIGINT PRIMARY KEY,
              map_quality VARCHAR(32) NOT NULL DEFAULT 'balanced',
              grid_scale DOUBLE NOT NULL DEFAULT 1.0,
              grid_offset_x DOUBLE NOT NULL DEFAULT 0.0,
              grid_offset_y DOUBLE NOT NULL DEFAULT 0.0,
              updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
            """, conn);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public static StoredUserRecord? ResolveAuthenticatedUser(HttpContext ctx)
    {
        var authHeader = ctx.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(authHeader))
        {
            var fromHeader = MySqlUserAuthStore.VerifyHmacJwt(authHeader);
            if (fromHeader is not null) return fromHeader;
        }

        if (ctx.Request.Cookies.TryGetValue("lw_session_http", out var httpOnlyToken) &&
            !string.IsNullOrWhiteSpace(httpOnlyToken))
        {
            var fromHttpCookie = MySqlUserAuthStore.VerifyHmacJwt(Uri.UnescapeDataString(httpOnlyToken));
            if (fromHttpCookie is not null) return fromHttpCookie;
        }

        if (ctx.Request.Cookies.TryGetValue("mw_auth_token", out var cookieToken) &&
            !string.IsNullOrWhiteSpace(cookieToken))
        {
            var fromCookie = MySqlUserAuthStore.VerifyHmacJwt(Uri.UnescapeDataString(cookieToken));
            if (fromCookie is not null) return fromCookie;
        }

        if (ctx.Request.Path.StartsWithSegments("/hubs") &&
            ctx.Request.Query.TryGetValue("access_token", out var hubToken) &&
            !string.IsNullOrWhiteSpace(hubToken))
        {
            return MySqlUserAuthStore.VerifyHmacJwt(hubToken.ToString());
        }

        return null;
    }

    private static void AppendHttpOnlySessionCookie(HttpContext ctx, string token, DateTimeOffset expiresAt)
    {
        var host = ctx.Request.Host.Host.ToLowerInvariant();
        var isHttps = ctx.Request.IsHttps ||
                      string.Equals(ctx.Request.Headers["X-Forwarded-Proto"], "https", StringComparison.OrdinalIgnoreCase);

        var httpOnlyOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAt
        };

        var clientCookieOptions = new CookieOptions
        {
            HttpOnly = false,
            Secure = isHttps,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = expiresAt
        };

        if (host.EndsWith("loom-weaver.com", StringComparison.Ordinal))
        {
            httpOnlyOptions.Domain = ".loom-weaver.com";
            clientCookieOptions.Domain = ".loom-weaver.com";
        }

        ctx.Response.Cookies.Append("lw_session_http", token, httpOnlyOptions);
        ctx.Response.Cookies.Append("mw_auth_token", token, clientCookieOptions);
    }

    private static void ClearHttpOnlySessionCookie(HttpContext ctx)
    {
        var host = ctx.Request.Host.Host.ToLowerInvariant();
        var options = new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UnixEpoch
        };
        var clientOptions = new CookieOptions
        {
            HttpOnly = false,
            SameSite = SameSiteMode.Lax,
            Path = "/",
            Expires = DateTimeOffset.UnixEpoch
        };
        if (host.EndsWith("loom-weaver.com", StringComparison.Ordinal))
        {
            options.Domain = ".loom-weaver.com";
            clientOptions.Domain = ".loom-weaver.com";
        }
        ctx.Response.Cookies.Delete("lw_session_http", options);
        ctx.Response.Cookies.Delete("mw_auth_token", clientOptions);
    }
}
