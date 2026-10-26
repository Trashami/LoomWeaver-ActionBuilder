using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LoomWeaver.Domain;
using LoomWeaver.Modules.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Auth;

public static class AuthAndCheckoutEndpoints
{
    private static readonly byte[] JwtSigningKey =
        Encoding.UTF8.GetBytes("LoomWeaverV2-Polyglot-HMAC-SHA256-SigningKey-2026!");

    private static readonly List<UserAccountProfileContract> Accounts = new()
    {
        new(
            "acc-gm-trashami",
            "trashami",
            "Trashami · Master GM & Creator",
            "gm@loom-weaver.com",
            "gm",
            "archmage",
            "GM",
            new[] { "asset-map-cinth", "asset-dice-runed-obsidian", "mod-cinth-masquerade-pack", "mod-shadow-mountain-raid" },
            1842.50
        ),
        new(
            "acc-player-fivi",
            "fivi_fey",
            "Fivi · Feywild Outcast (Free Player Seat)",
            "fivi@loom-weaver.com",
            "players",
            "free_player",
            "Fivi",
            new[] { "asset-dice-runed-obsidian" },
            0.00
        ),
        new(
            "acc-player-dal",
            "dal_ranger",
            "Dal · Edhellainian Heir (Free Player Seat)",
            "dal@loom-weaver.com",
            "players",
            "free_player",
            "Dal",
            new[] { "asset-map-cinth" },
            0.00
        ),
        new(
            "acc-player-kildrid",
            "kildrid_stone",
            "Kildrid · Dwarven Runesmith (Free Player Seat)",
            "kildrid@loom-weaver.com",
            "players",
            "free_player",
            "Kildrid",
            Array.Empty<string>(),
            0.00
        ),
        new(
            "acc-player-kycius",
            "kycius_blade",
            "Kycius · Seeker of Truth (Free Player Seat)",
            "kycius@loom-weaver.com",
            "players",
            "free_player",
            "Kycius",
            Array.Empty<string>(),
            0.00
        ),
        new(
            "acc-player-munk",
            "munk_vanguard",
            "Munk · Frontline Vanguard (Free Player Seat)",
            "munk@loom-weaver.com",
            "players",
            "free_player",
            "Munk",
            Array.Empty<string>(),
            0.00
        )
    };

    private static readonly List<StripeCheckoutSettlementResponse> SettlementLedger = new()
    {
        new(
            "cs_live_a1b2c3d4e5",
            "paid_settled",
            "mod-cinth-masquerade-pack",
            "Cinth Masquerade & Artificer District Campaign Module",
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
            "mod-shadow-mountain-raid",
            "Shadow of the Mountain — Runic Cavern & Dragon Boss Pack",
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
        api.MapGet("/auth/accounts", () => Results.Ok(Accounts));

        api.MapPost("/auth/login", (AuthLoginRequest req) =>
        {
            var identifier = (req.AccountId ?? string.Empty).Trim();
            var profile = Accounts.FirstOrDefault(a =>
                string.Equals(a.AccountId, identifier, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a.Username, identifier, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(a.Email, identifier, StringComparison.OrdinalIgnoreCase))
                ?? Accounts[0];

            var expiresAt = DateTimeOffset.UtcNow.AddDays(7);
            var token = IssueHmacJwt(profile, expiresAt);

            TableRealtimeEndpoints.RecordEvent(
                1,
                "auth_switch",
                profile.DisplayName,
                $"Authenticated session switched to {profile.DisplayName} (Role={profile.Role.ToUpperInvariant()}, Witness={profile.BoundCharacter}).",
                "{}"
            );

            return Results.Ok(new AuthSessionResponse(token, expiresAt, profile));
        });

        api.MapPost("/auth/register", (AuthRegisterRequest req) =>
        {
            var email = string.IsNullOrWhiteSpace(req.Email)
                ? $"chronicler{Accounts.Count + 1}@loom-weaver.com"
                : req.Email.Trim().ToLowerInvariant();
            var existing = Accounts.FirstOrDefault(a =>
                string.Equals(a.Email, email, StringComparison.OrdinalIgnoreCase));
            if (existing is not null)
            {
                var existingExpires = DateTimeOffset.UtcNow.AddDays(7);
                return Results.Ok(new AuthSessionResponse(IssueHmacJwt(existing, existingExpires), existingExpires, existing));
            }

            var role = string.Equals(req.Role, "players", StringComparison.OrdinalIgnoreCase) ||
                       string.Equals(req.Role, "player", StringComparison.OrdinalIgnoreCase)
                ? "players"
                : "gm";
            var username = !string.IsNullOrWhiteSpace(req.Username)
                ? req.Username.Trim().ToLowerInvariant()
                : email.Split('@')[0];
            var displayName = !string.IsNullOrWhiteSpace(req.DisplayName)
                ? req.DisplayName.Trim()
                : $"{username} · {(role == "gm" ? "Game Master" : "Free Player Seat")}";
            var tierCode = role == "gm" ? "loremaster" : "free_player";
            var boundCharacter = role == "gm" ? "GM" : "Fivi";

            var profile = new UserAccountProfileContract(
                $"acc-{role}-{Guid.NewGuid():N}"[..18],
                username,
                displayName,
                email,
                role,
                tierCode,
                boundCharacter,
                role == "gm" ? new[] { "asset-map-cinth", "asset-dice-runed-obsidian" } : new[] { "asset-dice-runed-obsidian" },
                0.00
            );

            Accounts.Insert(0, profile);

            var expiresAt = DateTimeOffset.UtcNow.AddDays(7);
            var token = IssueHmacJwt(profile, expiresAt);

            TableRealtimeEndpoints.RecordEvent(
                1,
                "auth_register",
                profile.DisplayName,
                $"New LoomWeaver account registered: {profile.DisplayName} ({profile.Email}, Role={profile.Role.ToUpperInvariant()}).",
                "{}"
            );

            return Results.Ok(new AuthSessionResponse(token, expiresAt, profile));
        });

        api.MapGet("/marketplace/settlements", () => Results.Ok(SettlementLedger));

        api.MapPost("/marketplace/checkout", (StripeCheckoutRequest req) =>
        {
            var gross = Math.Round(Math.Max(1.0, req.PriceUsd), 2);
            var creatorTransfer = Math.Round(gross * 0.85, 2);
            var platformFee = Math.Round(gross - creatorTransfer, 2);
            var now = DateTimeOffset.UtcNow;

            var settlement = new StripeCheckoutSettlementResponse(
                $"cs_live_{now.ToUnixTimeMilliseconds():x}",
                "paid_settled",
                string.IsNullOrWhiteSpace(req.ItemId) ? "mod-skyship-lost-isles" : req.ItemId.Trim(),
                string.IsNullOrWhiteSpace(req.ItemTitle) ? "Kutler's Skyship & Lost Isles Pack" : req.ItemTitle.Trim(),
                gross,
                creatorTransfer,
                platformFee,
                string.IsNullOrWhiteSpace(req.CreatorHandle) ? "@IcrandorCartography" : req.CreatorHandle.Trim(),
                $"LW-8515-{RandomNumberGenerator.GetInt32(1000, 9999)}",
                now
            );

            SettlementLedger.Insert(0, settlement);

            var accIdx = Accounts.FindIndex(a => a.AccountId == req.AccountId);
            if (accIdx >= 0)
            {
                var current = Accounts[accIdx];
                var updatedOwned = current.OwnedAssetIds.Contains(settlement.ItemId)
                    ? current.OwnedAssetIds
                    : current.OwnedAssetIds.Append(settlement.ItemId).ToList();
                Accounts[accIdx] = current with
                {
                    OwnedAssetIds = updatedOwned,
                    CreatorBalanceUsd = Math.Round(current.CreatorBalanceUsd + creatorTransfer, 2)
                };
            }

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

    private static string IssueHmacJwt(UserAccountProfileContract profile, DateTimeOffset expiresAt)
    {
        var headerJson = JsonSerializer.Serialize(new { alg = "HS256", typ = "JWT" });
        var payloadJson = JsonSerializer.Serialize(new
        {
            sub = profile.AccountId,
            usr = profile.Username,
            role = profile.Role,
            witness = profile.BoundCharacter,
            tier = profile.TierCode,
            exp = expiresAt.ToUnixTimeSeconds()
        });

        var headerB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
        var payloadB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
        var unsignedToken = $"{headerB64}.{payloadB64}";
        var sigBytes = HMACSHA256.HashData(JwtSigningKey, Encoding.UTF8.GetBytes(unsignedToken));
        var sigB64 = Base64UrlEncode(sigBytes);
        return $"{unsignedToken}.{sigB64}";
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
