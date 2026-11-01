using LoomWeaver.Infrastructure.MySql;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using MySqlConnector;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace LoomWeaver.Modules.Characters;

// Roll tables come from canonical dnd_tables rows. Row ranges and the die are parsed here so the client can roll and match.
public static class RollTableEndpoints
{
    private static readonly Regex DieRe = new(@"^\s*(\d*)d(\d+)\s*$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex RangeRe = new(@"^(\d+)\s*[-\u2013]\s*(\d+)$", RegexOptions.Compiled);
    private static readonly Regex SingleRe = new(@"^(\d+)$", RegexOptions.Compiled);
    private static readonly Regex TagRe = new(@"\{@\w+\s+([^|}]*)(?:\|[^}]*)?\}", RegexOptions.Compiled);
    private static readonly HashSet<int> RollableSides = new() { 4, 6, 8, 10, 12, 20, 100 };

    public static RouteGroupBuilder MapRollTableEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/roll-tables", async (string? search, string? source, int? limit, int? offset, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                await using var cmd = db.CreateCommand();
                var conditions = new List<string> { "`is_canonical` = 1" };
                if (!string.IsNullOrWhiteSpace(search))
                {
                    conditions.Add("(`name` LIKE @search OR `caption` LIKE @search)");
                    cmd.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
                }
                if (!string.IsNullOrWhiteSpace(source) && !string.Equals(source, "all", StringComparison.OrdinalIgnoreCase))
                {
                    conditions.Add("`source_book` = @source");
                    cmd.Parameters.AddWithValue("@source", source.Trim());
                }
                var take = Math.Clamp(limit ?? 200, 1, 3000);
                var skip = Math.Max(0, offset ?? 0);
                cmd.CommandText = $@"
                    SELECT `id`, `name`, `source_book`, `page`, `caption`, `table_category`, `col_labels_json`,
                           JSON_LENGTH(`rows_json`) AS `row_count`
                    FROM `dnd_tables`
                    WHERE {string.Join(" AND ", conditions)}
                    ORDER BY `source_book`, `name`, `id`
                    LIMIT {take} OFFSET {skip};";

                var tables = new List<object>();
                await using var r = await cmd.ExecuteReaderAsync(ct);
                while (await r.ReadAsync(ct))
                {
                    var colLabels = ReadStringList(ReadNullableString(r, "col_labels_json"));
                    var die = ParseDie(colLabels.FirstOrDefault());
                    tables.Add(new
                    {
                        id = r.GetInt64(r.GetOrdinal("id")),
                        name = r.GetString(r.GetOrdinal("name")),
                        sourceBook = r.GetString(r.GetOrdinal("source_book")),
                        page = ReadNullableInt(r, "page"),
                        caption = ReadNullableString(r, "caption"),
                        category = ReadNullableString(r, "table_category"),
                        rowCount = ReadNullableInt(r, "row_count") ?? 0,
                        die = die is null ? null : DieInfo(die.Value),
                    });
                }
                return Results.Ok(new { tables, count = tables.Count, hasMore = tables.Count == take });
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        api.MapGet("/roll-tables/{id:long}", async (long id, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            try
            {
                await using var db = await mysql.OpenConnectionAsync(ct);
                await using var cmd = db.CreateCommand();
                cmd.CommandText = @"
                    SELECT `id`, `name`, `source_book`, `page`, `caption`, `table_category`, `col_labels_json`, `rows_json`
                    FROM `dnd_tables`
                    WHERE `id` = @id AND `is_canonical` = 1
                    LIMIT 1;";
                cmd.Parameters.AddWithValue("@id", id);

                await using var r = await cmd.ExecuteReaderAsync(ct);
                if (!await r.ReadAsync(ct))
                {
                    return Results.NotFound(new { message = $"Roll table {id} was not found." });
                }

                var colLabels = ReadStringList(ReadNullableString(r, "col_labels_json")).Select(StripTags).ToList();
                var die = ParseDie(colLabels.FirstOrDefault());
                var rows = ParseRows(ReadNullableString(r, "rows_json"));

                return Results.Ok(new
                {
                    id = r.GetInt64(r.GetOrdinal("id")),
                    name = r.GetString(r.GetOrdinal("name")),
                    sourceBook = r.GetString(r.GetOrdinal("source_book")),
                    page = ReadNullableInt(r, "page"),
                    caption = ReadNullableString(r, "caption"),
                    category = ReadNullableString(r, "table_category"),
                    colLabels,
                    die = die is null ? null : DieInfo(die.Value),
                    rows,
                });
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        return api;
    }

    private static object DieInfo((int Count, int Sides) die) => new
    {
        count = die.Count,
        sides = die.Sides,
        expression = $"{die.Count}d{die.Sides}",
    };

    // Accepts "d6", "1d10", "2d6", and {@dice d100}. Returns null when the table has no single rollable die.
    private static (int Count, int Sides)? ParseDie(string? label)
    {
        if (label is null)
        {
            return null;
        }
        var match = DieRe.Match(StripTags(label));
        if (!match.Success)
        {
            return null;
        }
        var count = int.TryParse(match.Groups[1].Value, out var parsedCount) && parsedCount > 0 ? parsedCount : 1;
        var sides = int.Parse(match.Groups[2].Value);
        if (count > 10 || !RollableSides.Contains(sides))
        {
            return null;
        }
        return (count, sides);
    }

    private static List<RollRow> ParseRows(string? rowsJson)
    {
        var rows = new List<RollRow>();
        if (string.IsNullOrWhiteSpace(rowsJson))
        {
            return rows;
        }

        using var doc = JsonDocument.Parse(rowsJson);
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            var cells = item.ValueKind switch
            {
                JsonValueKind.Array => item,
                JsonValueKind.Object when item.TryGetProperty("row", out var inner) && inner.ValueKind == JsonValueKind.Array => inner,
                _ => default,
            };
            if (cells.ValueKind != JsonValueKind.Array || cells.GetArrayLength() == 0)
            {
                continue;
            }

            var range = ParseRange(cells[0]);
            var texts = new List<string>();
            for (var i = 1; i < cells.GetArrayLength(); i++)
            {
                texts.Add(CellText(cells[i]));
            }
            rows.Add(new RollRow(range.Label, range.Min, range.Max, texts));
        }
        return rows;
    }

    private static (string Label, int? Min, int? Max) ParseRange(JsonElement cell)
    {
        if (cell.ValueKind == JsonValueKind.Object && cell.TryGetProperty("roll", out var roll))
        {
            if (roll.TryGetProperty("exact", out var exact) && exact.TryGetInt32(out var value))
            {
                return (value.ToString(), value, value);
            }
            if (roll.TryGetProperty("min", out var min) && roll.TryGetProperty("max", out var max)
                && min.TryGetInt32(out var lo) && max.TryGetInt32(out var hi))
            {
                return ($"{lo}\u2013{hi}", lo, hi);
            }
        }

        var text = CellText(cell);
        if (text == "00")
        {
            return ("00", 100, 100);
        }
        var range = RangeRe.Match(text);
        if (range.Success)
        {
            return (text, int.Parse(range.Groups[1].Value), int.Parse(range.Groups[2].Value));
        }
        var single = SingleRe.Match(text);
        if (single.Success)
        {
            var n = int.Parse(single.Groups[1].Value);
            return (text, n, n);
        }
        return (text, null, null);
    }

    private static string CellText(JsonElement cell)
    {
        switch (cell.ValueKind)
        {
            case JsonValueKind.String:
                return StripTags(cell.GetString() ?? "");
            case JsonValueKind.Number:
                return cell.GetRawText();
            case JsonValueKind.Object:
                if (cell.TryGetProperty("entry", out var entry) && entry.ValueKind == JsonValueKind.String)
                {
                    return StripTags(entry.GetString() ?? "");
                }
                if (cell.TryGetProperty("entries", out var entries) && entries.ValueKind == JsonValueKind.Array)
                {
                    return string.Join(" ", entries.EnumerateArray()
                        .Where(e => e.ValueKind == JsonValueKind.String)
                        .Select(e => StripTags(e.GetString() ?? ""))
                        .Where(s => s.Length > 0));
                }
                return "";
            default:
                return "";
        }
    }

    // Converts 5etools inline tags ({@item Name|src}, {@dice d100}) to their display text.
    private static string StripTags(string text) =>
        TagRe.Replace(text, match => match.Groups[1].Value).Trim();

    private static List<string> ReadStringList(string? json)
    {
        var list = new List<string>();
        if (string.IsNullOrWhiteSpace(json))
        {
            return list;
        }
        using var doc = JsonDocument.Parse(json);
        foreach (var item in doc.RootElement.EnumerateArray())
        {
            list.Add(CellText(item));
        }
        return list;
    }

    private static string? ReadNullableString(MySqlDataReader r, string column)
    {
        var ordinal = r.GetOrdinal(column);
        return r.IsDBNull(ordinal) ? null : r.GetString(ordinal);
    }

    private static int? ReadNullableInt(MySqlDataReader r, string column)
    {
        var ordinal = r.GetOrdinal(column);
        return r.IsDBNull(ordinal) ? null : Convert.ToInt32(r.GetValue(ordinal));
    }

    private sealed record RollRow(string RangeLabel, int? Min, int? Max, List<string> Cells);
}
