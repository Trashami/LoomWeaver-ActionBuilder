using LoomWeaver.Infrastructure.MySql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Text.Json;
using System.Text.Json.Nodes;
using MySqlConnector;

namespace LoomWeaver.Modules.Characters;

public static class SourceBookEndpoints
{
    public static RouteGroupBuilder MapSourceBookEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/sources", async (string? search, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                await using var cmd = db.CreateCommand();
                var whereClauses = new List<string>
                {
                    "EXISTS (SELECT 1 FROM `dnd_book_nodes` b WHERE b.`source_id` = s.`id` COLLATE utf8mb4_0900_ai_ci)"
                };
                if (!string.IsNullOrWhiteSpace(search))
                {
                    whereClauses.Add("(s.`name` LIKE @search OR s.`id` LIKE @search OR s.`author` LIKE @search)");
                    cmd.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
                }
                var whereSql = "WHERE " + string.Join(" AND ", whereClauses);
                cmd.CommandText = $@"
                    SELECT s.`id`, s.`name`, s.`source_type`, s.`source_group`, s.`published`, s.`author`,
                           CASE WHEN s.`id` <> 'PHB' AND s.`cover_path` LIKE '%/PHB.webp' THEN NULL ELSE s.`cover_path` END AS `cover_path`,
                           (SELECT COUNT(*) FROM `dnd_decks` d WHERE d.`source_book` = s.`id` COLLATE utf8mb4_0900_ai_ci) AS `deck_count`
                    FROM `dnd_sources` s {whereSql}
                    ORDER BY
                        CASE
                            WHEN s.`id` IN ('XPHB', 'PHB', 'XDMG', 'DMG', 'XMM', 'MM') THEN 0
                            WHEN s.`source_group` = 'core' THEN 1
                            WHEN s.`source_group` IN ('supplement', 'supplement-alt') AND (s.`author` LIKE '%Wizards%' OR s.`author` IS NULL) THEN 2
                            ELSE 3
                        END,
                        s.`published` DESC,
                        s.`name`
                    LIMIT 500;";

                var sources = new List<Dictionary<string, object?>>();
                await using var r = await cmd.ExecuteReaderAsync(ct);
                while (await r.ReadAsync(ct))
                {
                    sources.Add(ReadRow(r));
                }
                return Results.Ok(new { sources, total = sources.Count });
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        api.MapGet("/sources/{code}", async (string code, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                var source = await LoadSourceAsync(db, code, ct);
                return source is null
                    ? Results.NotFound(new { message = $"Source {code} was not found." })
                    : Results.Ok(source);
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        api.MapGet("/sources/{code}/nodes/{nodeId:long}", async (string code, long nodeId, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                var node = await LoadNodeAsync(db, code, nodeId, ct);
                return node is null
                    ? Results.NotFound(new { message = $"Section {nodeId} was not found in {code}." })
                    : Results.Ok(node);
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        api.MapGet("/sources/{code}/spells/{spellName}", async (string code, string spellName, string? spellSource, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                var preferredSource = !string.IsNullOrWhiteSpace(spellSource) ? spellSource.Trim() : code.Trim();
                var spell = await LoadSpellForBookAsync(db, preferredSource, spellName.Trim(), ct);
                return spell is null
                    ? Results.NotFound(new { message = $"Spell '{spellName}' was not found." })
                    : Results.Ok(spell);
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        return api;
    }

    private static async Task<Dictionary<string, object?>?> LoadSpellForBookAsync(
        MySqlConnection db,
        string preferredSource,
        string spellName,
        CancellationToken ct)
    {
        Dictionary<string, object?>? spell = null;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT s.`id`, s.`name`, s.`level`, s.`school`, s.`spell_type`, s.`casting_time`, s.`range_text`,
                       s.`components_json`, s.`duration_text`, s.`concentration`, s.`ritual`,
                       s.`description`, s.`higher_levels`, s.`classes_json`, s.`source_book`, s.`source_page`,
                       COALESCE(
                           NULLIF(s.`image_path`, ''),
                           (SELECT s2.`image_path` FROM `dnd_spells` s2
                            WHERE LOWER(s2.`name`) = LOWER(s.`name`)
                              AND s2.`image_path` IS NOT NULL AND s2.`image_path` <> ''
                            LIMIT 1)
                       ) AS `image_path`,
                       s.`raw_json`
                FROM `dnd_spells` s
                WHERE LOWER(s.`name`) = LOWER(@spellName)
                ORDER BY
                    CASE
                        WHEN UPPER(s.`source_book`) = UPPER(@pref) THEN 0
                        WHEN UPPER(@pref) = 'XPHB' AND UPPER(s.`source_book`) = 'PHB' THEN 1
                        WHEN UPPER(@pref) = 'PHB' AND UPPER(s.`source_book`) = 'XPHB' THEN 1
                        WHEN UPPER(s.`source_book`) = 'XPHB' THEN 2
                        WHEN UPPER(s.`source_book`) = 'PHB' THEN 3
                        ELSE 4
                    END,
                    s.`id`
                LIMIT 1;";
            cmd.Parameters.AddWithValue("@spellName", spellName);
            cmd.Parameters.AddWithValue("@pref", preferredSource);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                spell = ReadRow(r);
            }
        }

        if (spell is null) return null;

        ParseJsonColumn(spell, "raw_json");
        ParseJsonColumn(spell, "components_json");
        ParseJsonColumn(spell, "classes_json");

        var actualSource = spell["source_book"]?.ToString() ?? preferredSource;
        var actualName = spell["name"]?.ToString() ?? spellName;

        await using (var prevCmd = db.CreateCommand())
        {
            prevCmd.CommandText = @"
                SELECT `name` FROM `dnd_spells`
                WHERE UPPER(`source_book`) = UPPER(@src) AND `name` < @name
                ORDER BY `name` DESC LIMIT 1;";
            prevCmd.Parameters.AddWithValue("@src", actualSource);
            prevCmd.Parameters.AddWithValue("@name", actualName);
            var prev = await prevCmd.ExecuteScalarAsync(ct);
            spell["prev_spell"] = prev is DBNull || prev is null ? null : prev.ToString();
        }

        await using (var nextCmd = db.CreateCommand())
        {
            nextCmd.CommandText = @"
                SELECT `name` FROM `dnd_spells`
                WHERE UPPER(`source_book`) = UPPER(@src) AND `name` > @name
                ORDER BY `name` ASC LIMIT 1;";
            nextCmd.Parameters.AddWithValue("@src", actualSource);
            nextCmd.Parameters.AddWithValue("@name", actualName);
            var next = await nextCmd.ExecuteScalarAsync(ct);
            spell["next_spell"] = next is DBNull || next is null ? null : next.ToString();
        }

        return spell;
    }

    private static async Task HydrateCreatureStatblocksAsync(
        MySqlConnection db,
        string bookCode,
        Dictionary<string, object?> node,
        CancellationToken ct)
    {
        if (!node.TryGetValue("data_json", out var rawObj) || rawObj is null) return;
        var raw = rawObj.ToString();
        if (string.IsNullOrWhiteSpace(raw)) return;

        JsonNode? root;
        try { root = JsonNode.Parse(raw); }
        catch { return; }
        if (root is null) return;

        var targets = new List<(JsonObject Obj, string Name, string Source)>();
        void Walk(JsonNode? current)
        {
            if (current is JsonObject obj)
            {
                var type = obj["type"]?.GetValue<string>() ?? "";
                var tag = obj["tag"]?.GetValue<string>() ?? "";
                var prop = obj["prop"]?.GetValue<string>() ?? "";
                var name = obj["name"]?.GetValue<string>() ?? "";
                var src = obj["source"]?.GetValue<string>() ?? bookCode;
                if (type.Equals("statblock", StringComparison.OrdinalIgnoreCase) &&
                    !string.IsNullOrWhiteSpace(name) &&
                    (tag.Equals("creature", StringComparison.OrdinalIgnoreCase) ||
                     prop.Equals("monsterFluff", StringComparison.OrdinalIgnoreCase) ||
                     string.IsNullOrEmpty(tag)))
                {
                    targets.Add((obj, name, src));
                }
                foreach (var kv in obj) Walk(kv.Value);
            }
            else if (current is JsonArray arr)
            {
                foreach (var item in arr) Walk(item);
            }
        }
        Walk(root);

        foreach (var (obj, name, src) in targets.Take(25))
        {
            await using var cmd = db.CreateCommand();
            cmd.CommandText = @"
                SELECT `id`, `name`, `source_id`, `cr_text`, `type_main`, `ac_best`, `hp_avg`, `hp_formula`,
                       `speed_walk`, `str_score`, `dex_score`, `con_score`, `int_score`, `wis_score`, `cha_score`,
                       `image_path`, `raw_json`
                FROM `dnd_monster_library`
                WHERE `provider` = '5etools' AND `campaign_id` IS NULL AND `is_canonical` = 1
                  AND LOWER(`name`) = LOWER(@name)
                ORDER BY
                    CASE
                        WHEN UPPER(`source_id`) = UPPER(@src) THEN 0
                        WHEN UPPER(`source_id`) = 'XMM' THEN 1
                        WHEN UPPER(`source_id`) = 'MM' THEN 2
                        ELSE 3
                    END,
                    `id`
                LIMIT 1;";
            cmd.Parameters.AddWithValue("@name", name);
            cmd.Parameters.AddWithValue("@src", src);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                var id = Convert.ToInt64(r["id"]);
                obj["bestiaryKey"] = $"off-{id}";
                obj["monsterName"] = r["name"]?.ToString() ?? name;
                obj["monsterSource"] = r["source_id"]?.ToString() ?? src;
                obj["crText"] = r["cr_text"] is DBNull ? "0" : r["cr_text"]?.ToString();
                obj["typeMain"] = r["type_main"] is DBNull ? "Creature" : r["type_main"]?.ToString();
                obj["acBest"] = r["ac_best"] is DBNull ? 10 : Convert.ToInt32(r["ac_best"]);
                obj["hpAvg"] = r["hp_avg"] is DBNull ? 10 : Convert.ToInt32(r["hp_avg"]);
                obj["hpFormula"] = r["hp_formula"] is DBNull ? "" : r["hp_formula"]?.ToString();
                obj["speedWalk"] = r["speed_walk"] is DBNull ? 30 : Convert.ToInt32(r["speed_walk"]);
                obj["str"] = r["str_score"] is DBNull ? 10 : Convert.ToInt32(r["str_score"]);
                obj["dex"] = r["dex_score"] is DBNull ? 10 : Convert.ToInt32(r["dex_score"]);
                obj["con"] = r["con_score"] is DBNull ? 10 : Convert.ToInt32(r["con_score"]);
                obj["int"] = r["int_score"] is DBNull ? 10 : Convert.ToInt32(r["int_score"]);
                obj["wis"] = r["wis_score"] is DBNull ? 10 : Convert.ToInt32(r["wis_score"]);
                obj["cha"] = r["cha_score"] is DBNull ? 10 : Convert.ToInt32(r["cha_score"]);
                var rawMonsterJson = r["raw_json"] is DBNull ? null : r["raw_json"]?.ToString();
                if (!string.IsNullOrWhiteSpace(rawMonsterJson))
                {
                    try { obj["monsterRaw"] = JsonNode.Parse(rawMonsterJson); } catch { }
                }
            }
        }

        node["data_json"] = JsonSerializer.Deserialize<JsonElement>(root.ToJsonString());
    }

    private static void ParseJsonColumn(Dictionary<string, object?> row, string key)
    {
        if (!row.TryGetValue(key, out var rawObj) || rawObj is null) return;
        if (rawObj is JsonElement) return;
        var raw = rawObj.ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            row[key] = null;
            return;
        }
        try { row[key] = JsonSerializer.Deserialize<JsonElement>(raw); }
        catch { }
    }

    private static async Task<Dictionary<string, object?>?> LoadNodeAsync(MySqlConnection db, string code, long nodeId, CancellationToken ct)
    {
        Dictionary<string, object?>? node = null;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT `id`, `source_id`, `parent_id`, `seq`, `node_type`, `name`, `page`, `text`, `data_json`
                FROM `dnd_book_nodes`
                WHERE `id` = @nodeId AND `source_id` = @code
                LIMIT 1;";
            cmd.Parameters.AddWithValue("@nodeId", nodeId);
            cmd.Parameters.AddWithValue("@code", code.Trim());
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                node = ReadRow(r);
            }
        }
        if (node is null) return null;

        await HydrateCreatureStatblocksAsync(db, code.Trim(), node, ct);
        ParseJsonColumn(node, "data_json");

        // Resolve root chapter ID even for nested 2+ level nodes
        var rootChapterId = nodeId;
        var currentParent = node["parent_id"] is null or DBNull ? (long?)null : Convert.ToInt64(node["parent_id"]);
        var guard = 0;
        while (currentParent.HasValue && guard++ < 6)
        {
            rootChapterId = currentParent.Value;
            await using var pCmd = db.CreateCommand();
            pCmd.CommandText = "SELECT `parent_id` FROM `dnd_book_nodes` WHERE `id` = @pid LIMIT 1;";
            pCmd.Parameters.AddWithValue("@pid", rootChapterId);
            var nextParent = await pCmd.ExecuteScalarAsync(ct);
            currentParent = nextParent is null or DBNull ? null : Convert.ToInt64(nextParent);
        }
        node["root_chapter_id"] = rootChapterId;

        var children = new List<Dictionary<string, object?>>();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT `id`, `name`, `node_type`, `page`, `seq`
                FROM `dnd_book_nodes`
                WHERE `parent_id` = @nodeId
                ORDER BY `seq`, `id`
                LIMIT 300;";
            cmd.Parameters.AddWithValue("@nodeId", nodeId);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                children.Add(ReadRow(r));
            }
        }

        // If a leaf node has no children, show sibling sections under its parent so TOC sub-links stay visible
        if (children.Count == 0 && node["parent_id"] is not null and not DBNull)
        {
            var parentId = Convert.ToInt64(node["parent_id"]);
            await using var sibCmd = db.CreateCommand();
            sibCmd.CommandText = @"
                SELECT `id`, `name`, `node_type`, `page`, `seq`
                FROM `dnd_book_nodes`
                WHERE `parent_id` = @parentId
                ORDER BY `seq`, `id`
                LIMIT 300;";
            sibCmd.Parameters.AddWithValue("@parentId", parentId);
            await using var r = await sibCmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                children.Add(ReadRow(r));
            }
        }

        node["children"] = children;
        return node;
    }

    private static async Task<Dictionary<string, object?>?> LoadSourceAsync(MySqlConnection db, string code, CancellationToken ct)
    {
        Dictionary<string, object?>? source = null;
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT `id`, `name`, `source_type`, `source_group`, `published`, `author`,
                       CASE WHEN `id` <> 'PHB' AND `cover_path` LIKE '%/PHB.webp' THEN NULL ELSE `cover_path` END AS `cover_path`
                FROM `dnd_sources`
                WHERE `id` = @code
                LIMIT 1;";
            cmd.Parameters.AddWithValue("@code", code.Trim());
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                source = ReadRow(r);
            }
        }
        if (source is null) return null;

        var sections = new List<Dictionary<string, object?>>();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = @"
                SELECT `id`, `name`, `node_type`, `page`, `seq`
                FROM `dnd_book_nodes`
                WHERE `source_id` = @code AND `parent_id` IS NULL
                ORDER BY `seq`, `id`
                LIMIT 300;";
            cmd.Parameters.AddWithValue("@code", code.Trim());
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                sections.Add(ReadRow(r));
            }
        }

        var decks = new List<Dictionary<string, object?>>();
        await using (var cmd = db.CreateCommand())
        {
            cmd.CommandText = "SELECT `id`, `name`, `cards_count`, `image_path` FROM `dnd_decks` WHERE `source_book` = @code COLLATE utf8mb4_0900_ai_ci ORDER BY `name` LIMIT 200;";
            cmd.Parameters.AddWithValue("@code", code.Trim());
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
            {
                decks.Add(ReadRow(r));
            }
        }

        source["sections"] = sections;
        source["decks"] = decks;
        return source;
    }

    private static Dictionary<string, object?> ReadRow(MySqlDataReader r)
    {
        var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        for (var i = 0; i < r.FieldCount; i++)
        {
            row[r.GetName(i)] = r.IsDBNull(i) ? null : r.GetValue(i);
        }
        return row;
    }
}
