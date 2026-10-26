using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using MySqlConnector;

namespace LoomWeaver.Modules.Auth;

public sealed record StoredUserRecord(
    long Id,
    string AccountId,
    string Email,
    string Username,
    string DisplayName,
    string PasswordHash,
    string PasswordSalt,
    string Role,
    string TierCode,
    string BoundCharacter,
    IReadOnlyList<string> OwnedAssetIds,
    double CreatorBalanceUsd
);

public static class MySqlUserAuthStore
{
    private static readonly byte[] JwtSigningKey =
        Encoding.UTF8.GetBytes("LoomWeaverV2-Polyglot-HMAC-SHA256-SigningKey-2026!");

    private const string GoogleClientId =
        "280529007750-q5jrb7qbln2hpcaf8a62j4125oied8qs.apps.googleusercontent.com";

    private static readonly List<StoredUserRecord> MemoryUsers = BuildSeedUsers();
    private static bool _schemaInitialized;

    private static List<StoredUserRecord> BuildSeedUsers()
    {
        var (adminHash, adminSalt) = PasswordHasher.HashPassword("Sp34kFri3nd4nd3nt3r!");
        var (testerHash, testerSalt) = PasswordHasher.HashPassword("LoomWeaverTester");

        return new List<StoredUserRecord>
        {
            new(1, "acc-gm-geojason", "jtromborg1@gmail.com", "GeoJason", "Jason (GeoJason)", adminHash, adminSalt, "gm", "legendary", "GM",
                new[] { "asset-map-cinth", "asset-dice-runed-obsidian", "mod-cinth-masquerade-pack", "mod-shadow-mountain-raid" }, 1842.50),
            new(2, "acc-gm-trashami", "gm@loom-weaver.com", "trashami", "Trashami · Master GM & Creator", adminHash, adminSalt, "gm", "legendary", "GM",
                new[] { "asset-map-cinth", "asset-dice-runed-obsidian", "mod-cinth-masquerade-pack", "mod-shadow-mountain-raid" }, 1842.50),
            new(3, "acc-player-dal", "scott.brogan@loomweaver.com", "ScottBrogan", "Scott Brogan (Dal Riata)", testerHash, testerSalt, "gm", "legendary", "Dal",
                new[] { "asset-map-cinth" }, 0.00),
            new(4, "acc-player-kycius", "stick.hazen@loomweaver.com", "StickHazen", "Stick Hazen (Kycius)", testerHash, testerSalt, "gm", "worldsmith", "Kycius",
                Array.Empty<string>(), 0.00),
            new(5, "acc-gm-greg", "gregmeinert@loomweaver.com", "GregMeinert", "Greg Meinert", testerHash, testerSalt, "gm", "legendary", "GM",
                new[] { "asset-map-cinth", "asset-dice-runed-obsidian" }, 0.00),
            new(6, "acc-player-kildrid", "ryan.issak@loomweaver.com", "RyanIssak", "Ryan Issak (Kildrid)", testerHash, testerSalt, "players", "worldsmith", "Kildrid",
                Array.Empty<string>(), 0.00),
            new(7, "acc-player-fivi", "dallas.crow@loomweaver.com", "DallasCrow", "Dallas Crow (Fivi)", testerHash, testerSalt, "players", "adventurer", "Fivi",
                new[] { "asset-dice-runed-obsidian" }, 0.00),
            new(8, "acc-player-munk", "pete.higano@loomweaver.com", "PeteHigano", "Pete Higano (Munk)", testerHash, testerSalt, "players", "adventurer", "Munk",
                Array.Empty<string>(), 0.00),
            new(9, "acc-player-josh", "josh.tromborg@loomweaver.com", "JoshTromborg", "Josh Tromborg", testerHash, testerSalt, "players", "worldsmith", "Dal",
                Array.Empty<string>(), 0.00),
            new(10, "acc-gm-kenneth", "kenneth.alexander@loomweaver.com", "KennethAlexander", "Kenneth Alexander", testerHash, testerSalt, "gm", "legendary", "GM",
                Array.Empty<string>(), 0.00),
            new(11, "acc-player-christine", "christine.richey@loomweaver.com", "ChristineRichey", "Christine Richey", testerHash, testerSalt, "players", "worldsmith", "Fivi",
                Array.Empty<string>(), 0.00),
            new(12, "acc-player-michael", "michael.aguilar@loomweaver.com", "MichaelAguilar", "Michael Aguilar", testerHash, testerSalt, "players", "adventurer", "Kycius",
                Array.Empty<string>(), 0.00),
            new(13, "acc-player-juno", "juno@loomweaver.com", "Juno", "Juno", testerHash, testerSalt, "players", "worldsmith", "Fivi",
                Array.Empty<string>(), 0.00),
            new(14, "acc-player-candice", "candice.freymond@loomweaver.com", "CandiceFreymond", "Candice Freymond", testerHash, testerSalt, "players", "adventurer", "Dal",
                Array.Empty<string>(), 0.00)
        };
    }

    public static IReadOnlyList<UserAccountProfileContract> GetPublicAccounts() =>
        MemoryUsers.Select(ToContract).ToList();

    public static UserAccountProfileContract ToContract(StoredUserRecord u) =>
        new(u.AccountId, u.Username, u.DisplayName, u.Email, u.Role, u.TierCode, u.BoundCharacter, u.OwnedAssetIds, u.CreatorBalanceUsd);

    public static object ToLegacyUserDto(StoredUserRecord u)
    {
        var isAdmin = u.Email.Equals("jtromborg1@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                      u.Username.Equals("GeoJason", StringComparison.OrdinalIgnoreCase) ||
                      u.Username.Equals("GregMeinert", StringComparison.OrdinalIgnoreCase);
        return new
        {
            id = u.Id,
            accountId = u.AccountId,
            email = u.Email,
            username = u.Username,
            displayName = u.DisplayName,
            role = isAdmin ? "admin" : (u.Role == "gm" ? "dm" : "player"),
            tier = u.TierCode,
            billingCycle = "annual",
            subscriptionStatus = "active",
            subscriptionAiCredits = 1000,
            purchasedAiCredits = 500,
            totalAiCredits = 1500,
            storageUsedBytes = 0L,
            storageLimitBytes = 10737418240L,
            activeCampaignsLimit = 25,
            isAdmin,
            boundCharacter = u.BoundCharacter
        };
    }

    public static async Task EnsureDatabaseReadyAsync(LoomWeaverMySqlRepository repo, CancellationToken ct = default)
    {
        if (_schemaInitialized) return;
        try
        {
            await using var conn = await repo.OpenConnectionAsync(ct);

            var createSql = """
                DROP TABLE IF EXISTS mw_users;
                DROP TABLE IF EXISTS mw_account_requests;

                CREATE TABLE IF NOT EXISTS lw_auth_users (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    account_id VARCHAR(64) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    username VARCHAR(64) NOT NULL UNIQUE,
                    display_name VARCHAR(128) NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    password_salt VARCHAR(255) NOT NULL,
                    google_id VARCHAR(128) NULL,
                    role VARCHAR(32) NOT NULL DEFAULT 'gm',
                    tier VARCHAR(32) NOT NULL DEFAULT 'adventurer',
                    bound_character VARCHAR(64) NOT NULL DEFAULT 'GM',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    last_login_at DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS lw_account_requests (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    username VARCHAR(64) NOT NULL,
                    display_name VARCHAR(128) NOT NULL,
                    notes TEXT NULL,
                    status VARCHAR(32) NOT NULL DEFAULT 'pending',
                    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """;
            await using (var cmd = new MySqlCommand(createSql, conn))
            {
                await cmd.ExecuteNonQueryAsync(ct);
            }

            foreach (var seed in MemoryUsers)
            {
                const string upsert = """
                    INSERT INTO lw_auth_users (account_id, email, username, display_name, password_hash, password_salt, role, tier, bound_character)
                    VALUES (@aid, @email, @uname, @dname, @hash, @salt, @role, @tier, @bound)
                    ON DUPLICATE KEY UPDATE
                        password_hash = COALESCE(NULLIF(password_hash, ''), @hash),
                        password_salt = COALESCE(NULLIF(password_salt, ''), @salt),
                        display_name = @dname;
                    """;
                await using var uCmd = new MySqlCommand(upsert, conn);
                uCmd.Parameters.AddWithValue("@aid", seed.AccountId);
                uCmd.Parameters.AddWithValue("@email", seed.Email);
                uCmd.Parameters.AddWithValue("@uname", seed.Username);
                uCmd.Parameters.AddWithValue("@dname", seed.DisplayName);
                uCmd.Parameters.AddWithValue("@hash", seed.PasswordHash);
                uCmd.Parameters.AddWithValue("@salt", seed.PasswordSalt);
                uCmd.Parameters.AddWithValue("@role", seed.Role);
                uCmd.Parameters.AddWithValue("@tier", seed.TierCode);
                uCmd.Parameters.AddWithValue("@bound", seed.BoundCharacter);
                await uCmd.ExecuteNonQueryAsync(ct);
            }

            _schemaInitialized = true;
        }
        catch
        {
            // Uses MemoryUsers with identical PBKDF2-SHA512 hashes when MySQL is unavailable locally
        }
    }

    public static async Task<StoredUserRecord?> AuthenticateAsync(
        LoomWeaverMySqlRepository repo,
        string identifier,
        string password,
        CancellationToken ct = default)
    {
        var cleanId = (identifier ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(cleanId) || string.IsNullOrWhiteSpace(password))
        {
            return null;
        }

        await EnsureDatabaseReadyAsync(repo, ct);

        try
        {
            await using var conn = await repo.OpenConnectionAsync(ct);
            const string sql = """
                SELECT id, COALESCE(account_id, CONCAT('acc-', id)), email, username, display_name,
                       password_hash, password_salt, role, tier, COALESCE(bound_character, 'GM')
                FROM lw_auth_users
                WHERE LOWER(email) = LOWER(@id) OR LOWER(username) = LOWER(@id) OR LOWER(account_id) = LOWER(@id)
                LIMIT 1;
                """;
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", cleanId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var hash = reader.IsDBNull(5) ? string.Empty : reader.GetString(5);
                var salt = reader.IsDBNull(6) ? string.Empty : reader.GetString(6);
                if (!PasswordHasher.VerifyPassword(password, hash, salt))
                {
                    return null;
                }

                var rawRole = reader.GetString(7);
                var normalizedRole = rawRole is "player" or "players" ? "players" : "gm";
                return new StoredUserRecord(
                    reader.GetInt64(0),
                    reader.GetString(1),
                    reader.GetString(2),
                    reader.GetString(3),
                    reader.GetString(4),
                    hash,
                    salt,
                    normalizedRole,
                    reader.GetString(8),
                    reader.GetString(9),
                    new[] { "asset-map-cinth", "asset-dice-runed-obsidian" },
                    0.0
                );
            }
        }
        catch
        {
            // Fall through to MemoryUsers verification
        }

        var mem = MemoryUsers.FirstOrDefault(u =>
            string.Equals(u.Email, cleanId, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(u.Username, cleanId, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(u.AccountId, cleanId, StringComparison.OrdinalIgnoreCase));

        if (mem is null || !PasswordHasher.VerifyPassword(password, mem.PasswordHash, mem.PasswordSalt))
        {
            return null;
        }

        return mem;
    }

    public static async Task<StoredUserRecord> RegisterAsync(
        LoomWeaverMySqlRepository repo,
        string email,
        string username,
        string displayName,
        string password,
        string role,
        CancellationToken ct = default)
    {
        await EnsureDatabaseReadyAsync(repo, ct);
        var cleanEmail = email.Trim().ToLowerInvariant();
        var cleanUser = string.IsNullOrWhiteSpace(username) ? cleanEmail.Split('@')[0] : username.Trim();
        var cleanDisplay = string.IsNullOrWhiteSpace(displayName) ? cleanUser : displayName.Trim();
        var normalizedRole = string.Equals(role, "players", StringComparison.OrdinalIgnoreCase) ||
                             string.Equals(role, "player", StringComparison.OrdinalIgnoreCase)
            ? "players"
            : "gm";

        if (MemoryUsers.Any(u =>
            string.Equals(u.Email, cleanEmail, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(u.Username, cleanUser, StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("An account with that email or username already exists.");
        }

        var (hash, salt) = PasswordHasher.HashPassword(password);
        var accountId = $"acc-{normalizedRole}-{Guid.NewGuid():N}"[..18];
        var newId = (long)(MemoryUsers.Count + 100);
        var record = new StoredUserRecord(
            newId,
            accountId,
            cleanEmail,
            cleanUser,
            cleanDisplay,
            hash,
            salt,
            normalizedRole,
            normalizedRole == "gm" ? "adventurer" : "player",
            normalizedRole == "gm" ? "GM" : "Fivi",
            new[] { "asset-dice-runed-obsidian" },
            0.0
        );

        try
        {
            await using var conn = await repo.OpenConnectionAsync(ct);
            const string insertSql = """
                INSERT INTO lw_auth_users (account_id, email, username, display_name, password_hash, password_salt, role, tier, bound_character)
                VALUES (@aid, @email, @uname, @dname, @hash, @salt, @role, @tier, @bound);
                SELECT LAST_INSERT_ID();
                """;
            await using var cmd = new MySqlCommand(insertSql, conn);
            cmd.Parameters.AddWithValue("@aid", record.AccountId);
            cmd.Parameters.AddWithValue("@email", record.Email);
            cmd.Parameters.AddWithValue("@uname", record.Username);
            cmd.Parameters.AddWithValue("@dname", record.DisplayName);
            cmd.Parameters.AddWithValue("@hash", record.PasswordHash);
            cmd.Parameters.AddWithValue("@salt", record.PasswordSalt);
            cmd.Parameters.AddWithValue("@role", record.Role);
            cmd.Parameters.AddWithValue("@tier", record.TierCode);
            cmd.Parameters.AddWithValue("@bound", record.BoundCharacter);
            var dbId = Convert.ToInt64(await cmd.ExecuteScalarAsync(ct));
            record = record with { Id = dbId };
        }
        catch (MySqlException ex) when (ex.Number == 1062)
        {
            throw new InvalidOperationException("An account with that email or username already exists.");
        }
        catch
        {
            // Keep in-memory record when MySQL is offline locally
        }

        MemoryUsers.Insert(0, record);
        return record;
    }

    public static async Task<StoredUserRecord?> AuthenticateGoogleTokenAsync(
        LoomWeaverMySqlRepository repo,
        string idToken,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(idToken)) return null;
        await EnsureDatabaseReadyAsync(repo, ct);

        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
            var resp = await http.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}", ct);
            if (!resp.IsSuccessStatusCode) return null;

            using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync(ct));
            var root = doc.RootElement;
            var aud = root.TryGetProperty("aud", out var audProp) ? audProp.GetString() : null;
            if (!string.Equals(aud, GoogleClientId, StringComparison.Ordinal))
            {
                return null;
            }

            var email = (root.TryGetProperty("email", out var emProp) ? emProp.GetString() : null)?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(email)) return null;
            var name = (root.TryGetProperty("name", out var nmProp) ? nmProp.GetString() : null) ?? email.Split('@')[0];

            var existing = MemoryUsers.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase));
            if (existing is not null) return existing;

            var (hash, salt) = PasswordHasher.HashPassword(Guid.NewGuid().ToString("N"));
            var created = new StoredUserRecord(
                MemoryUsers.Count + 200,
                $"acc-google-{Guid.NewGuid():N}"[..18],
                email,
                email.Split('@')[0],
                name,
                hash,
                salt,
                email.Equals("jtromborg1@gmail.com", StringComparison.OrdinalIgnoreCase) ? "gm" : "players",
                email.Equals("jtromborg1@gmail.com", StringComparison.OrdinalIgnoreCase) ? "legendary" : "adventurer",
                email.Equals("jtromborg1@gmail.com", StringComparison.OrdinalIgnoreCase) ? "GM" : "Dal",
                new[] { "asset-map-cinth", "asset-dice-runed-obsidian" },
                0.0
            );
            MemoryUsers.Insert(0, created);
            return created;
        }
        catch
        {
            return null;
        }
    }

    public static string IssueHmacJwt(StoredUserRecord user, DateTimeOffset expiresAt)
    {
        var isAdmin = user.Email.Equals("jtromborg1@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                      user.Username.Equals("GeoJason", StringComparison.OrdinalIgnoreCase) ||
                      user.Username.Equals("GregMeinert", StringComparison.OrdinalIgnoreCase);

        var headerJson = JsonSerializer.Serialize(new { alg = "HS256", typ = "JWT" });
        var payloadJson = JsonSerializer.Serialize(new
        {
            sub = user.Id.ToString(),
            accountId = user.AccountId,
            email = user.Email,
            username = user.Username,
            usr = user.Username,
            name = user.DisplayName,
            role = user.Role,
            tier = user.TierCode,
            witness = user.BoundCharacter,
            is_admin = isAdmin ? "true" : "false",
            exp = expiresAt.ToUnixTimeSeconds()
        });

        var headerB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(headerJson));
        var payloadB64 = Base64UrlEncode(Encoding.UTF8.GetBytes(payloadJson));
        var unsignedToken = $"{headerB64}.{payloadB64}";
        var sigBytes = HMACSHA256.HashData(JwtSigningKey, Encoding.UTF8.GetBytes(unsignedToken));
        return $"{unsignedToken}.{Base64UrlEncode(sigBytes)}";
    }

    public static StoredUserRecord? VerifyHmacJwt(string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var clean = token.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? token["Bearer ".Length..].Trim()
            : token.Trim();

        var parts = clean.Split('.');
        if (parts.Length != 3) return null;

        try
        {
            var unsignedToken = $"{parts[0]}.{parts[1]}";
            var expectedSig = Base64UrlEncode(HMACSHA256.HashData(JwtSigningKey, Encoding.UTF8.GetBytes(unsignedToken)));
            if (!CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(parts[2]),
                    Encoding.UTF8.GetBytes(expectedSig)))
            {
                return null;
            }

            var payloadBytes = Base64UrlDecode(parts[1]);
            using var doc = JsonDocument.Parse(payloadBytes);
            var root = doc.RootElement;

            if (root.TryGetProperty("exp", out var expProp) &&
                expProp.TryGetInt64(out var expSec) &&
                DateTimeOffset.UtcNow.ToUnixTimeSeconds() > expSec)
            {
                return null;
            }

            var email = root.TryGetProperty("email", out var em) ? em.GetString() : null;
            var username = root.TryGetProperty("username", out var un) ? un.GetString() :
                           (root.TryGetProperty("usr", out var usr) ? usr.GetString() : null);
            var accountId = root.TryGetProperty("accountId", out var aid) ? aid.GetString() :
                            (root.TryGetProperty("sub", out var sub) ? sub.GetString() : null);

            return MemoryUsers.FirstOrDefault(u =>
                (!string.IsNullOrEmpty(email) && string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(username) && string.Equals(u.Username, username, StringComparison.OrdinalIgnoreCase)) ||
                (!string.IsNullOrEmpty(accountId) && (string.Equals(u.AccountId, accountId, StringComparison.OrdinalIgnoreCase) || u.Id.ToString() == accountId)));
        }
        catch
        {
            return null;
        }
    }

    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        var padded = input.Replace('-', '+').Replace('_', '/');
        switch (padded.Length % 4)
        {
            case 2: padded += "=="; break;
            case 3: padded += "="; break;
        }
        return Convert.FromBase64String(padded);
    }
}
