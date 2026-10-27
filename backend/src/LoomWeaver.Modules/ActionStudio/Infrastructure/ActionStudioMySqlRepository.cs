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
    private static readonly ConcurrentDictionary<string, bool> DeletedInitialCustomIds = new(StringComparer.OrdinalIgnoreCase);
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
                    id INT PRIMARY KEY, slug VARCHAR(80) NOT NULL, name VARCHAR(140) NOT NULL,
                    system_code VARCHAR(32) NOT NULL DEFAULT 'dnd5e', ruleset_label VARCHAR(64) NOT NULL DEFAULT 'D&D 5e (2024 + Campaign Rules)',
                    dm_user_id BIGINT NOT NULL, dm_username VARCHAR(64) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                CREATE TABLE IF NOT EXISTS lw_engine_core_rules (
                    rule_id VARCHAR(80) PRIMARY KEY, rule_code VARCHAR(100) NOT NULL, name VARCHAR(140) NOT NULL,
                    category VARCHAR(64) NOT NULL, ruleset_code VARCHAR(32) NOT NULL DEFAULT 'dnd5e-2024',
                    is_locked TINYINT(1) NOT NULL DEFAULT 1, rule_json LONGTEXT NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                CREATE TABLE IF NOT EXISTS lw_campaign_rule_overrides (
                    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, campaign_id INT NOT NULL, rule_id VARCHAR(80) NOT NULL,
                    bypasses_core_rule_id VARCHAR(80) NULL, rule_code VARCHAR(100) NOT NULL, name VARCHAR(140) NOT NULL,
                    category VARCHAR(64) NOT NULL, updated_by_user_id BIGINT NOT NULL, updated_by_username VARCHAR(64) NOT NULL,
                    rule_json LONGTEXT NOT NULL, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uq_camp_rule (campaign_id, rule_id), INDEX idx_camp_rules (campaign_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
                """;
            await using (var cmd = new MySqlCommand(ddl, conn))
            {
                await cmd.ExecuteNonQueryAsync(ct);
            }

            foreach (var c in SeedDmCampaigns)
            {
                const string upsertCamp = "INSERT INTO lw_dm_campaigns (id, slug, name, system_code, ruleset_label, dm_user_id, dm_username) VALUES (@id, @slug, @name, @sys, @ruleset, @dmid, @dmuser) ON DUPLICATE KEY UPDATE name = @name, ruleset_label = @ruleset, dm_user_id = @dmid, dm_username = @dmuser;";
                await using var cCmd = new MySqlCommand(upsertCamp, conn);
                cCmd.Parameters.AddWithValue("@id", c.Id);
                cCmd.Parameters.AddWithValue("@slug", c.Slug);
                cCmd.Parameters.AddWithValue("@name", c.Name);
                cCmd.Parameters.AddWithValue("@sys", c.SystemCode);
                cCmd.Parameters.AddWithValue("@ruleset", c.RulesetLabel);
                cCmd.Parameters.AddWithValue("@dmid", c.DmUserId);
                cCmd.Parameters.AddWithValue("@dmuser", c.DmUsername);
                await cCmd.ExecuteNonQueryAsync(ct);
            }

            foreach (var coreRule in ActionRuleCatalog.GetDefaultRules())
            {
                const string upsertCore = "INSERT INTO lw_engine_core_rules (rule_id, rule_code, name, category, ruleset_code, is_locked, rule_json) VALUES (@rid, @rcode, @name, @cat, @rset, 1, @json) ON DUPLICATE KEY UPDATE rule_code = @rcode, name = @name, category = @cat, is_locked = 1, rule_json = @json;";
                await using var rCmd = new MySqlCommand(upsertCore, conn);
                rCmd.Parameters.AddWithValue("@rid", coreRule.Id);
                rCmd.Parameters.AddWithValue("@rcode", coreRule.RuleCode);
                rCmd.Parameters.AddWithValue("@name", coreRule.Name);
                rCmd.Parameters.AddWithValue("@cat", coreRule.Category);
                rCmd.Parameters.AddWithValue("@rset", coreRule.RulesetCode);
                rCmd.Parameters.AddWithValue("@json", JsonSerializer.Serialize(coreRule, JsonOpts));
                await rCmd.ExecuteNonQueryAsync(ct);
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
            var populatedCampaigns = new List<DmCampaignOptionDto>();
            foreach (var camp in dmOwnedCampaigns)
            {
                var campRules = camp.Id == activeCampaign.Id
                    ? rules
                    : await GetRulesForCampaignAsync(camp.Id, ct);
                var count = campRules.Count(r => r.IsCustomizedForCampaign && !r.IsCoreEngineRule);
                var updatedCamp = camp with { CustomizedRuleCount = count };
                populatedCampaigns.Add(updatedCamp);
                if (camp.Id == activeCampaign.Id)
                {
                    activeCampaign = updatedCamp;
                }
            }
            dmOwnedCampaigns = populatedCampaigns;
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
        var coreRules = ActionRuleCatalog.GetDefaultRules();
        var customMap = new Dictionary<string, CampaignActionRuleDto>(StringComparer.OrdinalIgnoreCase);

        foreach (var seedCustom in ActionRuleCatalog.GetInitialCampaignCustomRules(campaignId))
        {
            if (!DeletedInitialCustomIds.ContainsKey($"{campaignId}:{seedCustom.Id}"))
            {
                customMap[seedCustom.Id] = seedCustom;
            }
        }

        foreach (var kv in MemoryOverrides)
        {
            if (kv.Key.StartsWith($"{campaignId}:", StringComparison.OrdinalIgnoreCase))
            {
                customMap[kv.Value.Id] = kv.Value;
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
                    // Legacy safety: if an older override had a core rule ID directly, convert it into a non-destructive Campaign Bypass
                    var matchingCore = coreRules.FirstOrDefault(c => string.Equals(c.Id, dto.Id, StringComparison.OrdinalIgnoreCase));
                    if (matchingCore is not null)
                    {
                        var bypassId = $"bypass-c{campaignId}-{matchingCore.Id}";
                        dto = dto with
                        {
                            Id = bypassId,
                            Name = dto.Name.Contains("Bypass", StringComparison.OrdinalIgnoreCase) || dto.Name != matchingCore.Name
                                ? dto.Name
                                : $"{matchingCore.Name} (Campaign Bypass)",
                            SourceLabel = "Campaign Bypass",
                            IsCoreEngineRule = false,
                            IsCustomizedForCampaign = true,
                            BypassesCoreRuleId = matchingCore.Id
                        };
                    }

                    customMap[dto.Id] = dto;
                    MemoryOverrides[$"{campaignId}:{dto.Id}"] = dto;
                }
            }
        }
        catch { }

        var bypassByCoreId = customMap.Values
            .Where(x => !string.IsNullOrWhiteSpace(x.BypassesCoreRuleId))
            .GroupBy(x => x.BypassesCoreRuleId!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var result = new List<CampaignActionRuleDto>();

        // 1. Campaign Bypass & Custom Rules at top of campaign rules list so GM sees active overrides immediately
        foreach (var customRule in customMap.Values.OrderByDescending(x => !string.IsNullOrWhiteSpace(x.BypassesCoreRuleId)).ThenBy(x => x.Name))
        {
            result.Add(customRule with
            {
                IsCoreEngineRule = false,
                IsCustomizedForCampaign = true,
                SourceLabel = !string.IsNullOrWhiteSpace(customRule.BypassesCoreRuleId) ? "Campaign Bypass" : "Campaign Custom"
            });
        }

        // 2. All Immutable Core Engine Rules (never overwritten in SQL; annotated if bypassed in this campaign)
        foreach (var core in coreRules)
        {
            if (bypassByCoreId.TryGetValue(core.Id, out var activeBypass))
            {
                result.Add(core with
                {
                    IsCoreEngineRule = true,
                    IsCustomizedForCampaign = false,
                    SourceLabel = "Core Engine (Bypassed)",
                    BypassedByRuleId = activeBypass.Id,
                    BypassedByRuleName = activeBypass.Name
                });
            }
            else
            {
                result.Add(core with
                {
                    IsCoreEngineRule = true,
                    IsCustomizedForCampaign = false,
                    SourceLabel = "Core Engine",
                    BypassedByRuleId = null,
                    BypassedByRuleName = null
                });
            }
        }

        return result;
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

        var coreRules = ActionRuleCatalog.GetDefaultRules();
        var matchedCore = coreRules.FirstOrDefault(c =>
            string.Equals(c.Id, rule.Id, StringComparison.OrdinalIgnoreCase) ||
            string.Equals(c.Id, rule.BypassesCoreRuleId, StringComparison.OrdinalIgnoreCase));

        string savedRuleId;
        string? bypassesCoreId = rule.BypassesCoreRuleId;
        string savedName = string.IsNullOrWhiteSpace(rule.Name) ? "Custom Campaign Rule" : rule.Name.Trim();

        if (rule.IsCoreEngineRule || (matchedCore is not null && string.Equals(rule.Id, matchedCore.Id, StringComparison.OrdinalIgnoreCase)))
        {
            // Core Engine rules in SQL are immutable! Create/update a Campaign Bypass rule instead.
            var coreTarget = matchedCore ?? coreRules[0];
            bypassesCoreId = coreTarget.Id;
            savedRuleId = $"bypass-c{campaignId}-{coreTarget.Id}";
            if (string.Equals(savedName, coreTarget.Name, StringComparison.OrdinalIgnoreCase))
            {
                savedName = $"{coreTarget.Name} ({targetCampaign.Name} Bypass)";
            }
        }
        else
        {
            savedRuleId = string.IsNullOrWhiteSpace(rule.Id)
                ? $"rule-custom-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
                : rule.Id.Trim();
        }

        var savedRule = rule with
        {
            Id = savedRuleId,
            Name = savedName,
            SourceLabel = !string.IsNullOrWhiteSpace(bypassesCoreId) ? "Campaign Bypass" : "Campaign Custom",
            IsCustomizedForCampaign = true,
            IsCoreEngineRule = false,
            BypassesCoreRuleId = bypassesCoreId,
            BypassedByRuleId = null,
            BypassedByRuleName = null,
            UpdatedByUsername = user.Username,
            UpdatedAt = DateTimeOffset.UtcNow.ToString("O")
        };

        DeletedInitialCustomIds.TryRemove($"{campaignId}:{savedRule.Id}", out _);
        MemoryOverrides[$"{campaignId}:{savedRule.Id}"] = savedRule;

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string upsert = "INSERT INTO lw_campaign_rule_overrides (campaign_id, rule_id, bypasses_core_rule_id, rule_code, name, category, updated_by_user_id, updated_by_username, rule_json) VALUES (@cid, @rid, @bcore, @rcode, @name, @cat, @uid, @uname, @json) ON DUPLICATE KEY UPDATE bypasses_core_rule_id = @bcore, rule_code = @rcode, name = @name, category = @cat, updated_by_user_id = @uid, updated_by_username = @uname, rule_json = @json, updated_at = CURRENT_TIMESTAMP;";
            await using var cmd = new MySqlCommand(upsert, conn);
            cmd.Parameters.AddWithValue("@cid", campaignId);
            cmd.Parameters.AddWithValue("@rid", savedRule.Id);
            cmd.Parameters.AddWithValue("@bcore", (object?)savedRule.BypassesCoreRuleId ?? DBNull.Value);
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
        var customCount = allRules.Count(r => r.IsCustomizedForCampaign && !r.IsCoreEngineRule);

        var msg = !string.IsNullOrWhiteSpace(bypassesCoreId)
            ? $"Core SQL rule kept intact. Saved Campaign Bypass '{savedRule.Name}' for '{targetCampaign.Name}' (overrides Core Engine rule '{bypassesCoreId}')."
            : $"Applied custom rule '{savedRule.Name}' to your campaign '{targetCampaign.Name}'.";

        return new ApplyCampaignRuleResponse(
            Success: true,
            Message: msg,
            CampaignId: campaignId,
            CampaignName: targetCampaign.Name,
            Rule: savedRule,
            CustomizedRuleCount: customCount,
            Rules: allRules
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
            throw new UnauthorizedAccessException("Only the Dungeon Master of this campaign can remove campaign bypass rules.");
        }

        var bypassIdForCore = $"bypass-c{campaignId}-{ruleId}";
        MemoryOverrides.TryRemove($"{campaignId}:{ruleId}", out _);
        MemoryOverrides.TryRemove($"{campaignId}:{bypassIdForCore}", out _);
        DeletedInitialCustomIds[$"{campaignId}:{ruleId}"] = true;

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            await using var cmd = new MySqlCommand(
                "DELETE FROM lw_campaign_rule_overrides WHERE campaign_id = @cid AND (rule_id = @rid OR rule_id = @brid OR bypasses_core_rule_id = @rid);",
                conn);
            cmd.Parameters.AddWithValue("@cid", campaignId);
            cmd.Parameters.AddWithValue("@rid", ruleId);
            cmd.Parameters.AddWithValue("@brid", bypassIdForCore);
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
        var cleanName = string.IsNullOrWhiteSpace(req.Name) ? $"{user.DisplayName}'s Homebrew Campaign" : req.Name.Trim();
        var cleanRuleset = string.IsNullOrWhiteSpace(req.RulesetLabel) ? "D&D 5e (2024 + Campaign Rules)" : req.RulesetLabel.Trim();
        var newId = 200 + (int)(user.Id % 1000) + SeedDmCampaigns.Count;
        var created = new DmCampaignOptionDto(newId, $"campaign-{newId}", cleanName, "dnd5e", cleanRuleset, user.Id, user.Username, "dm", 0);
        SeedDmCampaigns.RemoveAll(c => c.Id == newId);
        SeedDmCampaigns.Add(created);

        try
        {
            await using var conn = await mysql.OpenConnectionAsync(ct);
            const string sql = "INSERT INTO lw_dm_campaigns (id, slug, name, system_code, ruleset_label, dm_user_id, dm_username) VALUES (@id, @slug, @name, 'dnd5e', @ruleset, @dmid, @dmuser) ON DUPLICATE KEY UPDATE name = @name, ruleset_label = @ruleset;";
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
        new(2, "echoes-of-the-starstone", "Echoes of the Starstone", "pf2e", "Pathfinder 2e Remaster", 1, "GeoJason", "dm", 1),
        new(3, "court-of-velvet-ash", "Court of Velvet Ash", "vtm5e", "Vampire: The Masquerade V5", 1, "GeoJason", "dm", 1),
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
