using System.Collections.Concurrent;
using System.Text.Json;
using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Modules.ActionStudio.Domain;
using LoomWeaver.Modules.Auth;
using MySqlConnector;

namespace LoomWeaver.Modules.ActionStudio.Infrastructure;

public sealed class ActionStudioMySqlRepository(LoomWeaverMySqlRepository mysql)
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
    private static readonly ConcurrentDictionary<string, CampaignActionRuleDto> MemoryOverrides = new(StringComparer.OrdinalIgnoreCase);
    private static readonly List<DmCampaignOptionDto> SeedDmCampaigns = BuildSeedDmCampaigns();
    private static bool _schemaReady;

    public async Task EnsureSchemaAsync(CancellationToken ct = default)
    {
        if (_schemaReady) return;
        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string ddl = """
                CREATE TABLE IF NOT EXISTS lw_dm_campaigns (
                    id INT PRIMARY KEY,
                    slug VARCHAR(80) NOT NULL,
                    name VARCHAR(140) NOT NULL,
                    system_code VARCHAR(32) NOT NULL DEFAULT 'dnd5e',
                    ruleset_label VARCHAR(64) NOT NULL DEFAULT 'D&D 5e (2024 + Campaign Rules)',
                    dm_user_id BIGINT NOT NULL,
                    dm_username VARCHAR(64) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE IF NOT EXISTS lw_campaign_rule_overrides (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                    campaign_id INT NOT NULL,
                    rule_id VARCHAR(80) NOT NULL,
                    rule_code VARCHAR(100) NOT NULL,
                    name VARCHAR(140) NOT NULL,
                    category VARCHAR(64) NOT NULL,
                    updated_by_user_id BIGINT NOT NULL,
                    updated_by_username VARCHAR(64) NOT NULL,
                    rule_json LONGTEXT NOT NULL,
                    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_camp_rule (campaign_id, rule_id),
                    INDEX idx_camp_rules (campaign_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """;
            await using (var cmd = new MySqlCommand(ddl, conn))
            {
                await cmd.ExecuteNonQueryAsync(ct);
            }

            foreach (var c in SeedDmCampaigns)
            {
                const string upsert = """
                    INSERT INTO lw_dm_campaigns (id, slug, name, system_code, ruleset_label, dm_user_id, dm_username)
                    VALUES (@id, @slug, @name, @sys, @ruleset, @dmid, @dmuser)
                    ON DUPLICATE KEY UPDATE
                        name = @name,
                        ruleset_label = @ruleset,
                        dm_user_id = @dmid,
                        dm_username = @dmuser;
                    """;
                await using var cCmd = new MySqlCommand(upsert, conn);
                cCmd.Parameters.AddWithValue("@id", c.Id);
                cCmd.Parameters.AddWithValue("@slug", c.Slug);
                cCmd.Parameters.AddWithValue("@name", c.Name);
                cCmd.Parameters.AddWithValue("@sys", c.SystemCode);
                cCmd.Parameters.AddWithValue("@ruleset", c.RulesetLabel);
                cCmd.Parameters.AddWithValue("@dmid", c.DmUserId);
                cCmd.Parameters.AddWithValue("@dmuser", c.DmUsername);
                await cCmd.ExecuteNonQueryAsync(ct);
            }

            _schemaReady = true;
        }
        catch
        {
            // Falls back gracefully to in-memory seed campaigns and overrides if MySQL is offline
        }
    }

    public async Task<ActionStudioContextDto> BuildStudioContextAsync(
        StoredUserRecord user,
        int? requestedCampaignId,
        CancellationToken ct = default)
    {
        await EnsureSchemaAsync(ct);

        var allCampaigns = await LoadAllDmCampaignsAsync(ct);
        var dmOwnedCampaigns = allCampaigns
            .Where(c => IsUserDmOfCampaign(user, c))
            .ToList();

        var playerOnlyNames = new List<string> { "Shadow of the Mountain (DM: GeoJason)" };
        if (user.Id is 1 or 2)
        {
            playerOnlyNames.Clear();
        }

        string? switchedNotice = null;
        DmCampaignOptionDto? activeCampaign = null;

        if (dmOwnedCampaigns.Count > 0)
        {
            if (requestedCampaignId.HasValue)
            {
                var exactMatch = dmOwnedCampaigns.FirstOrDefault(c => c.Id == requestedCampaignId.Value);
                if (exactMatch is not null)
                {
                    activeCampaign = exactMatch;
                }
                else
                {
                    activeCampaign = dmOwnedCampaigns[0];
                    var requestedOther = allCampaigns.FirstOrDefault(c => c.Id == requestedCampaignId.Value);
                    var otherName = requestedOther?.Name ?? $"Campaign #{requestedCampaignId.Value}";
                    switchedNotice = $"You are a Player in '{otherName}', so you cannot view or edit its rules. Defaulted to your own DM campaign: '{activeCampaign.Name}'.";
                }
            }
            else
            {
                activeCampaign = dmOwnedCampaigns[0];
                if (user.Id is not 1 and not 2)
                {
                    switchedNotice = $"Defaulted to your DM campaign '{activeCampaign.Name}'. Rules applied here affect only your campaign.";
                }
            }
        }

        var canAccess = activeCampaign is not null;
        string? deniedReason = canAccess
            ? null
            : $"You are signed in as {user.DisplayName} (Player in 'Shadow of the Mountain'). Players in a campaign cannot view or edit that campaign's ActionBuilder rules unless they have their own DM campaign.";

        var rules = canAccess && activeCampaign is not null
            ? await GetRulesForCampaignAsync(activeCampaign.Id, ct)
            : [];

        if (activeCampaign is not null)
        {
            var customCount = rules.Count(r => r.IsCustomizedForCampaign);
            activeCampaign = activeCampaign with { CustomizedRuleCount = customCount };
            dmOwnedCampaigns = dmOwnedCampaigns
                .Select(c => c.Id == activeCampaign.Id ? activeCampaign : c)
                .ToList();
        }

        return new ActionStudioContextDto(
            UserId: user.Id,
            Username: user.Username,
            DisplayName: user.DisplayName,
            AccountRole: canAccess ? "dm" : "player",
            CanAccessActionBuilder: canAccess,
            AccessDeniedReason: deniedReason,
            SwitchedFromPlayerCampaignNotice: switchedNotice,
            ActiveCampaign: activeCampaign,
            DmCampaigns: dmOwnedCampaigns,
            PlayerOnlyCampaignNames: playerOnlyNames,
            Rules: rules,
            EngineSymbols: ActionEngineSymbolCatalog.GetEngineSymbols(),
            ClauseKeywords: ActionEngineSymbolCatalog.GetClauseKeywords(),
            TokenSuggestionsByKeyword: ActionEngineSymbolCatalog.GetTokenSuggestions(),
            DemoAccounts: BuildDemoAccounts()
        );
    }

    public async Task<IReadOnlyList<CampaignActionRuleDto>> GetRulesForCampaignAsync(int campaignId, CancellationToken ct = default)
    {
        await EnsureSchemaAsync(ct);
        var defaults = ActionRuleCatalog.GetDefaultRules();
        var overrides = new Dictionary<string, CampaignActionRuleDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var kv in MemoryOverrides)
        {
            if (kv.Key.StartsWith($"{campaignId}:", StringComparison.OrdinalIgnoreCase))
            {
                overrides[kv.Value.Id] = kv.Value;
            }
        }

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string sql = "SELECT rule_id, rule_json FROM lw_campaign_rule_overrides WHERE campaign_id = @cid ORDER BY updated_at DESC;";
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@cid", campaignId);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                var dto = JsonSerializer.Deserialize<CampaignActionRuleDto>(r.GetString(1), JsonOpts);
                if (dto is not null)
                {
                    overrides[r.GetString(0)] = dto;
                    MemoryOverrides[$"{campaignId}:{dto.Id}"] = dto;
                }
            }
        }
        catch { }

        var merged = new List<CampaignActionRuleDto>();
        foreach (var def in defaults)
        {
            if (overrides.TryGetValue(def.Id, out var custom))
            {
                merged.Add(custom);
                overrides.Remove(def.Id);
            }
            else
            {
                // Campaign 1 has Fivi & Chokrah pre-customized; other DM campaigns start clean SRD unless customized
                var isDefaultCustom = campaignId == 1 && def.IsCustomizedForCampaign;
                merged.Add(def with
                {
                    IsCustomizedForCampaign = isDefaultCustom,
                    SourceLabel = isDefaultCustom ? "Campaign Modified" : "Core SRD"
                });
            }
        }

        foreach (var extra in overrides.Values)
        {
            merged.Insert(0, extra);
        }

        return merged;
    }

    public async Task<ApplyCampaignRuleResponse> ApplyRuleToCampaignAsync(
        StoredUserRecord user,
        int campaignId,
        CampaignActionRuleDto rule,
        CancellationToken ct = default)
    {
        await EnsureSchemaAsync(ct);
        var allCampaigns = await LoadAllDmCampaignsAsync(ct);
        var targetCampaign = allCampaigns.FirstOrDefault(c => c.Id == campaignId);

        if (targetCampaign is null || !IsUserDmOfCampaign(user, targetCampaign))
        {
            throw new UnauthorizedAccessException(
                "Access denied: Only the Dungeon Master of this campaign can apply or modify its rules.");
        }

        var ruleId = string.IsNullOrWhiteSpace(rule.Id)
            ? $"rule-custom-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
            : rule.Id.Trim();

        var savedRule = rule with
        {
            Id = ruleId,
            Name = string.IsNullOrWhiteSpace(rule.Name) ? "Custom Campaign Rule" : rule.Name.Trim(),
            SourceLabel = "Campaign Modified",
            IsCustomizedForCampaign = true,
            UpdatedByUsername = user.Username,
            UpdatedAt = DateTimeOffset.UtcNow.ToString("O")
        };

        MemoryOverrides[$"{campaignId}:{savedRule.Id}"] = savedRule;

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string upsert = """
                INSERT INTO lw_campaign_rule_overrides
                    (campaign_id, rule_id, rule_code, name, category, updated_by_user_id, updated_by_username, rule_json)
                VALUES
                    (@cid, @rid, @rcode, @name, @cat, @uid, @uname, @json)
                ON DUPLICATE KEY UPDATE
                    rule_code = @rcode,
                    name = @name,
                    category = @cat,
                    updated_by_user_id = @uid,
                    updated_by_username = @uname,
                    rule_json = @json,
                    updated_at = CURRENT_TIMESTAMP;
                """;
            await using var cmd = new MySqlCommand(upsert, conn);
            cmd.Parameters.AddWithValue("@cid", campaignId);
            cmd.Parameters.AddWithValue("@rid", savedRule.Id);
            cmd.Parameters.AddWithValue("@rcode", savedRule.RuleCode);
            cmd.Parameters.AddWithValue("@name", savedRule.Name);
            cmd.Parameters.AddWithValue("@cat", savedRule.Category);
            cmd.Parameters.AddWithValue("@uid", user.Id);
            cmd.Parameters.AddWithValue("@uname", user.Username);
            cmd.Parameters.AddWithValue("@json", JsonSerializer.Serialize(savedRule, JsonOpts));
            await cmd.ExecuteNonQueryAsync(ct);
        }
        catch { }

        var allRules = await GetRulesForCampaignAsync(campaignId, ct);
        var customCount = allRules.Count(r => r.IsCustomizedForCampaign);

        return new ApplyCampaignRuleResponse(
            Success: true,
            Message: $"Applied '{savedRule.Name}' to your campaign '{targetCampaign.Name}'. Other campaigns are unaffected.",
            CampaignId: campaignId,
            CampaignName: targetCampaign.Name,
            Rule: savedRule,
            CustomizedRuleCount: customCount
        );
    }

    public async Task<IReadOnlyList<CampaignActionRuleDto>> ResetRuleToDefaultAsync(
        StoredUserRecord user,
        int campaignId,
        string ruleId,
        CancellationToken ct = default)
    {
        await EnsureSchemaAsync(ct);
        var allCampaigns = await LoadAllDmCampaignsAsync(ct);
        var targetCampaign = allCampaigns.FirstOrDefault(c => c.Id == campaignId);

        if (targetCampaign is null || !IsUserDmOfCampaign(user, targetCampaign))
        {
            throw new UnauthorizedAccessException("Only the Dungeon Master of this campaign can reset its rules.");
        }

        MemoryOverrides.TryRemove($"{campaignId}:{ruleId}", out _);

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            await using var cmd = new MySqlCommand(
                "DELETE FROM lw_campaign_rule_overrides WHERE campaign_id = @cid AND rule_id = @rid;", conn);
            cmd.Parameters.AddWithValue("@cid", campaignId);
            cmd.Parameters.AddWithValue("@rid", ruleId);
            await cmd.ExecuteNonQueryAsync(ct);
        }
        catch { }

        return await GetRulesForCampaignAsync(campaignId, ct);
    }

    public async Task<DmCampaignOptionDto> CreateQuickDmCampaignAsync(
        StoredUserRecord user,
        CreateDmCampaignQuickRequest req,
        CancellationToken ct = default)
    {
        await EnsureSchemaAsync(ct);
        var cleanName = string.IsNullOrWhiteSpace(req.Name)
            ? $"{user.DisplayName}'s Homebrew Campaign"
            : req.Name.Trim();
        var cleanRuleset = string.IsNullOrWhiteSpace(req.RulesetLabel)
            ? "D&D 5e (2024 + Campaign Rules)"
            : req.RulesetLabel.Trim();
        var newId = 200 + (int)(user.Id % 1000) + SeedDmCampaigns.Count;
        var created = new DmCampaignOptionDto(
            Id: newId,
            Slug: $"campaign-{newId}",
            Name: cleanName,
            SystemCode: "dnd5e",
            RulesetLabel: cleanRuleset,
            DmUserId: user.Id,
            DmUsername: user.Username,
            MyRole: "dm",
            CustomizedRuleCount: 0
        );

        SeedDmCampaigns.RemoveAll(c => c.Id == newId);
        SeedDmCampaigns.Add(created);

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string sql = """
                INSERT INTO lw_dm_campaigns (id, slug, name, system_code, ruleset_label, dm_user_id, dm_username)
                VALUES (@id, @slug, @name, 'dnd5e', @ruleset, @dmid, @dmuser)
                ON DUPLICATE KEY UPDATE name = @name, ruleset_label = @ruleset;
                """;
            await using var cmd = new MySqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", created.Id);
            cmd.Parameters.AddWithValue("@slug", created.Slug);
            cmd.Parameters.AddWithValue("@name", created.Name);
            cmd.Parameters.AddWithValue("@ruleset", created.RulesetLabel);
            cmd.Parameters.AddWithValue("@dmid", created.DmUserId);
            cmd.Parameters.AddWithValue("@dmuser", created.DmUsername);
            await cmd.ExecuteNonQueryAsync(ct);
        }
        catch { }

        return created;
    }

    private async Task<List<DmCampaignOptionDto>> LoadAllDmCampaignsAsync(CancellationToken ct)
    {
        var list = new List<DmCampaignOptionDto>(SeedDmCampaigns);
        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string sql = "SELECT id, slug, name, system_code, ruleset_label, dm_user_id, dm_username FROM lw_dm_campaigns ORDER BY id;";
            await using var cmd = new MySqlCommand(sql, conn);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                var item = new DmCampaignOptionDto(
                    r.GetInt32(0), r.GetString(1), r.GetString(2), r.GetString(3),
                    r.GetString(4), r.GetInt64(5), r.GetString(6), "dm", 0);
                var idx = list.FindIndex(x => x.Id == item.Id);
                if (idx >= 0) list[idx] = item;
                else list.Add(item);
            }
        }
        catch { }
        return list;
    }

    private static bool IsUserDmOfCampaign(StoredUserRecord user, DmCampaignOptionDto campaign)
    {
        if (campaign.DmUserId == user.Id) return true;
        if (user.Id is 1 or 2 && campaign.DmUserId is 1 or 2) return true;
        return string.Equals(campaign.DmUsername, user.Username, StringComparison.OrdinalIgnoreCase);
    }

    private static List<DmCampaignOptionDto> BuildSeedDmCampaigns() =>
    [
        new(1, "shadow-of-the-mountain", "Shadow of the Mountain", "dnd5e", "D&D 5e (2024 + Icrandor Canon)", 1, "GeoJason", "dm", 2),
        new(2, "echoes-of-the-starstone", "Echoes of the Starstone", "pf2e", "Pathfinder 2e Remaster", 1, "GeoJason", "dm", 0),
        new(3, "court-of-velvet-ash", "Court of Velvet Ash", "vtm5e", "Vampire: The Masquerade V5", 1, "GeoJason", "dm", 0),
        new(103, "edhellain-exiles-scott", "Chronicles of Edhellain (Scott's Campaign)", "dnd5e", "D&D 5e (2024 Homebrew)", 3, "ScottBrogan", "dm", 0),
        new(104, "lost-isles-threads-stick", "Threads of the Lost Isles (Stick's Campaign)", "dnd5e", "D&D 5e (2024 Homebrew)", 4, "StickHazen", "dm", 0),
        new(105, "vandia-nocturne-greg", "Vandia Nocturne (Greg's Campaign)", "dnd5e", "D&D 5e (2024 Homebrew)", 4522, "GregMeinert", "dm", 0)
    ];

    private static IReadOnlyList<ActionStudioAccountOptionDto> BuildDemoAccounts() =>
    [
        new(1, "acc-gm-geojason", "GeoJason", "Jason (GeoJason · DM of Shadow of the Mountain)", "jtromborg1@gmail.com", "DM of Shadow of the Mountain", true, 1),
        new(3, "acc-player-dal", "ScottBrogan", "Scott Brogan (Player in Shadow · DM of Edhellain)", "scott.brogan@loomweaver.com", "Player in Shadow -> Defaults to Own Campaign", true, 103),
        new(4, "acc-player-kycius", "StickHazen", "Stick Hazen (Player in Shadow · DM of Lost Isles)", "stick.hazen@loomweaver.com", "Player in Shadow -> Defaults to Own Campaign", true, 104),
        new(5360, "acc-player-fivi", "DallasCrow", "Dallas Crow (Fivi · Player Only, No DM Campaign)", "dallas.crow@loomweaver.com", "Player Only (Blocked Unless Own Campaign Created)", false, 0),
        new(5359, "acc-player-kildrid", "RyanIssak", "Ryan Issak (Kildrid · Player Only, No DM Campaign)", "ryan.issak@loomweaver.com", "Player Only (Blocked Unless Own Campaign Created)", false, 0)
    ];
}
