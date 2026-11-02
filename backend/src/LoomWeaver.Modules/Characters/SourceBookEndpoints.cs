using LoomWeaver.Infrastructure.MySql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Text.Json;
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
                            ELSE 2
                        END,
                        s.`source_group`,
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
                if (source is null)
                {
                    return Results.NotFound(new { message = $"Source {code} was not found." });
                }
                return Results.Ok(source);
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
                SELECT `id`, `name`, `level`, `school`, `spell_type`, `casting_time`, `range_text`,
                       `components_json`, `duration_text`, `concentration`, `ritual`,
                       `description`, `higher_levels`, `classes_json`, `source_book`, `source_page`,
                       `image_path`, `raw_json`
                FROM `dnd_spells`
                WHERE LOWER(`name`) = LOWER(@spellName)
                ORDER BY
                    CASE
                        WHEN UPPER(`source_book`) = UPPER(@pref) THEN 0
                        WHEN UPPER(@pref) = 'XPHB' AND UPPER(`source_book`) = 'PHB' THEN 1
                        WHEN UPPER(@pref) = 'PHB' AND UPPER(`source_book`) = 'XPHB' THEN 1
                        WHEN UPPER(`source_book`) = 'XPHB' THEN 2
                        WHEN UPPER(`source_book`) = 'PHB' THEN 3
                        ELSE 4
                    END,
                    `id`
                LIMIT 1;";
            cmd.Parameters.AddWithValue("@spellName", spellName);
            cmd.Parameters.AddWithValue("@pref", preferredSource);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                spell = ReadRow(r);
            }
        }

        if (spell is null)
        {
            return null;
        }

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

    private static void ParseJsonColumn(Dictionary<string, object?> row, string key)
    {
        if (!row.TryGetValue(key, out var rawObj) || rawObj is null)
        {
            return;
        }
        var raw = rawObj.ToString();
        if (string.IsNullOrWhiteSpace(raw))
        {
            row[key] = null;
            return;
        }
        try
        {
            row[key] = JsonSerializer.Deserialize<JsonElement>(raw);
        }
        catch
        {
            // Keep string fallback if not valid JSON
        }
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
        if (node is null)
        {
            return null;
        }

        ParseJsonColumn(node, "data_json");

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
        if (source is null)
        {
            return null;
        }

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
