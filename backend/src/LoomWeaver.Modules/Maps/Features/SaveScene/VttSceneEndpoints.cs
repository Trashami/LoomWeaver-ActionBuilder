using System.IO;
using System.Text.Json;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Modules.Auth;
using LoomWeaver.Modules.Maps.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using MySqlConnector;

namespace LoomWeaver.Modules.Maps.Features.SaveScene;

public sealed record VttWallDto(string Id, string Label, double X1, double Z1, double X2, double Z2, bool BlocksVision, bool BlocksMovement);
public sealed record VttSceneDto(
    string SceneKey,
    string Name,
    int Revision,
    IReadOnlyList<VttWallDto> Walls,
    string? SceneDataJson = null,
    string? ImageUrl = null,
    int GridSizePx = 50,
    string? AmbientLight = null
);
public sealed record VttSceneListItem(string SceneKey, string Name, int Revision);

/// <summary>Hands a saved map to the table: members receive walls, lighting, and scene data in VTT units.</summary>
public static class VttSceneEndpoints
{
    // A map square is 1.5 m (5 ft) and the VTT uses 2 world units per 5 ft square.
    private const double WorldUnitsPerMeter = 2 / 1.5;

    public static void MapVttSceneEndpoints(this IEndpointRouteBuilder group)
    {
        group.MapGet("/campaigns/{campaignId:int}/maps/scenes", async (
            int campaignId, HttpContext ctx, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            var access = await CampaignAccessResolver.ResolveAsync(ctx, campaignId, null, ct);
            if (!access.IsMember) return Results.StatusCode(403);
            var items = new List<VttSceneListItem>();
            await using var db = await mysql.OpenConnectionAsync(ct);
            await using var cmd = new MySqlCommand(
                "SELECT scene_key, revision, document_json FROM lw_battlemap_scenes WHERE campaign_id=@c AND (@gm = 1 OR visibility IN ('public','players')) ORDER BY updated_at DESC LIMIT 50", db);
            cmd.Parameters.AddWithValue("@c", campaignId);
            cmd.Parameters.AddWithValue("@gm", access.IsEffectiveGm ? 1 : 0);
            await using var r = await cmd.ExecuteReaderAsync(ct);
            while (await r.ReadAsync(ct))
                items.Add(new VttSceneListItem(r.GetString(0), NameOf(JsonSerializer.Deserialize<JsonElement>(r.GetString(2)), r.GetString(0)), r.GetInt32(1)));
            return Results.Ok(items);
        });

        group.MapGet("/campaigns/{campaignId:int}/maps/{sceneKey}/vtt-scene", async (
            int campaignId, string sceneKey, HttpContext ctx, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            var access = await CampaignAccessResolver.ResolveAsync(ctx, campaignId, null, ct);
            if (!access.IsMember) return Results.StatusCode(403);
            var stored = await MapSceneDocumentRepository.LoadAsync(mysql, campaignId, sceneKey, ct);
            if (stored is not null)
            {
                if (!access.IsEffectiveGm && stored.Visibility == "gm")
                    return Results.NotFound(new { error = "That scene has not been saved." });
                return Results.Ok(Project(sceneKey, stored, access.IsEffectiveGm));
            }

            // Fall back to dnd_combat_scenes or lm_user_maps
            await using var db = await mysql.OpenConnectionAsync(ct);
            long.TryParse(sceneKey, out var numericId);
            await using var cmd = new MySqlCommand("""
                SELECT id, name, scene_data_json, image_url, grid_size_px, ambient_light, walls_json
                FROM dnd_combat_scenes
                WHERE (campaign_id = @c OR campaign_id IS NULL)
                  AND (LOWER(name) = LOWER(@s) OR id = @nid OR @s = 'current' OR @s = 'active' OR @s = '' OR image_url LIKE CONCAT('%', @s, '%'))
                ORDER BY id DESC LIMIT 1
                """, db);
            cmd.Parameters.AddWithValue("@c", campaignId);
            cmd.Parameters.AddWithValue("@s", sceneKey);
            cmd.Parameters.AddWithValue("@nid", numericId);
            await using var reader = await cmd.ExecuteReaderAsync(ct);
            if (await reader.ReadAsync(ct))
            {
                var name = reader.GetString(1);
                var sceneJson = reader.IsDBNull(2) ? null : reader.GetString(2);
                var imgUrl = reader.IsDBNull(3) ? null : reader.GetString(3);
                var gridSize = reader.IsDBNull(4) ? 50 : reader.GetInt32(4);
                var ambient = reader.IsDBNull(5) ? "dim" : reader.GetString(5);
                var wallsJson = reader.IsDBNull(6) ? null : reader.GetString(6);
                var walls = ParseNativeWalls(wallsJson, sceneJson);
                return Results.Ok(new VttSceneDto(sceneKey, name, 1, walls, sceneJson, imgUrl, gridSize, ambient));
            }

            return Results.NotFound(new { error = "That scene has not been saved." });
        });

        group.MapGet("/campaigns/{campaignId:int}/maps/active-scene", async (
            int campaignId, string? sceneKey, string? title, string? artworkUrl, HttpContext ctx, LoomWeaverMySqlRepository mysql, CancellationToken ct) =>
        {
            var access = await CampaignAccessResolver.ResolveAsync(ctx, campaignId, null, ct);
            if (!access.IsMember) return Results.StatusCode(403);

            var artFileName = string.IsNullOrWhiteSpace(artworkUrl) ? "" : Path.GetFileName(artworkUrl);
            long.TryParse(sceneKey, out var numericId);

            await using var db = await mysql.OpenConnectionAsync(ct);
            await using var cmd = new MySqlCommand("""
                SELECT id, name, scene_data_json, image_url, grid_size_px, ambient_light, walls_json
                FROM dnd_combat_scenes
                WHERE (campaign_id = @c OR campaign_id IS NULL)
                  AND (
                    (@t <> '' AND LOWER(name) = LOWER(@t)) OR
                    (@art <> '' AND image_url LIKE CONCAT('%', @art, '%')) OR
                    (@sk <> '' AND (LOWER(name) = LOWER(@sk) OR id = @nid))
                  )
                ORDER BY id DESC LIMIT 1
                """, db);
            cmd.Parameters.AddWithValue("@c", campaignId);
            cmd.Parameters.AddWithValue("@t", title ?? "");
            cmd.Parameters.AddWithValue("@art", artFileName);
            cmd.Parameters.AddWithValue("@sk", sceneKey ?? "");
            cmd.Parameters.AddWithValue("@nid", numericId);

            await using var r = await cmd.ExecuteReaderAsync(ct);
            if (await r.ReadAsync(ct))
            {
                var name = r.GetString(1);
                var sceneJson = r.IsDBNull(2) ? null : r.GetString(2);
                var imgUrl = r.IsDBNull(3) ? null : r.GetString(3);
                var gridSize = r.IsDBNull(4) ? 50 : r.GetInt32(4);
                var ambient = r.IsDBNull(5) ? "dim" : r.GetString(5);
                var wallsJson = r.IsDBNull(6) ? null : r.GetString(6);
                var walls = ParseNativeWalls(wallsJson, sceneJson);
                return Results.Ok(new VttSceneDto(sceneKey ?? name, name, 1, walls, sceneJson, imgUrl, gridSize, ambient));
            }

            // Also check lm_user_maps
            await using var lmCmd = new MySqlCommand("""
                SELECT id, title, scene_data_json, thumbnail_url, grid_size_px
                FROM lm_user_maps
                WHERE (campaign_id = @c OR campaign_id IS NULL)
                  AND (
                    (@t <> '' AND LOWER(title) = LOWER(@t)) OR
                    (@art <> '' AND thumbnail_url LIKE CONCAT('%', @art, '%')) OR
                    (@sk <> '' AND (LOWER(title) = LOWER(@sk) OR id = @nid))
                  )
                ORDER BY updated_at DESC LIMIT 1
                """, db);
            lmCmd.Parameters.AddWithValue("@c", campaignId);
            lmCmd.Parameters.AddWithValue("@t", title ?? "");
            lmCmd.Parameters.AddWithValue("@art", artFileName);
            lmCmd.Parameters.AddWithValue("@sk", sceneKey ?? "");
            lmCmd.Parameters.AddWithValue("@nid", numericId);

            await using var lmr = await lmCmd.ExecuteReaderAsync(ct);
            if (await lmr.ReadAsync(ct))
            {
                var mapTitle = lmr.GetString(1);
                var sceneJson = lmr.IsDBNull(2) ? null : lmr.GetString(2);
                var imgUrl = lmr.IsDBNull(3) ? null : lmr.GetString(3);
                var gridSize = lmr.IsDBNull(4) ? 50 : lmr.GetInt32(4);
                var walls = ParseNativeWalls(null, sceneJson);
                return Results.Ok(new VttSceneDto(sceneKey ?? mapTitle, mapTitle, 1, walls, sceneJson, imgUrl, gridSize, "dim"));
            }

            return Results.NotFound(new { error = "Active scene not found." });
        });
    }

    public static VttSceneDto Project(string sceneKey, StoredMapSceneDocument stored, bool viewerIsGm)
    {
        var walls = new List<VttWallDto>();
        var includeWalls = viewerIsGm || stored.Visibility != "gm";
        if (includeWalls && stored.Document.TryGetProperty("walls", out var list) && list.ValueKind == JsonValueKind.Array)
        {
            foreach (var wall in list.EnumerateArray().Take(500))
            {
                var id = wall.TryGetProperty("id", out var i) ? i.GetString() ?? "wall" : "wall";
                var name = wall.TryGetProperty("name", out var n) ? n.GetString() ?? "Wall" : "Wall";
                if (!wall.TryGetProperty("points", out var pts) || pts.ValueKind != JsonValueKind.Array) continue;
                var points = pts.EnumerateArray()
                    .Where(p => p.ValueKind == JsonValueKind.Array && p.GetArrayLength() >= 2)
                    .Select(p => (X: p[0].GetDouble() * WorldUnitsPerMeter, Z: p[1].GetDouble() * WorldUnitsPerMeter))
                    .Take(400).ToList();
                for (var k = 0; k + 1 < points.Count; k++)
                    walls.Add(new VttWallDto($"{id}-{k}", name, points[k].X, points[k].Z, points[k + 1].X, points[k + 1].Z, true, true));
            }
        }

        var sceneJson = stored.Document.GetRawText();
        return new VttSceneDto(sceneKey, NameOf(stored.Document, sceneKey), stored.Revision, walls, sceneJson);
    }

    private static List<VttWallDto> ParseNativeWalls(string? wallsJson, string? sceneDataJson)
    {
        var result = new List<VttWallDto>();
        var json = !string.IsNullOrWhiteSpace(wallsJson) ? wallsJson : sceneDataJson;
        if (string.IsNullOrWhiteSpace(json)) return result;
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            var array = root.ValueKind == JsonValueKind.Array
                ? root
                : (root.TryGetProperty("walls", out var wProp) && wProp.ValueKind == JsonValueKind.Array ? wProp : default);
            if (array.ValueKind == JsonValueKind.Array)
            {
                foreach (var w in array.EnumerateArray())
                {
                    var id = w.TryGetProperty("id", out var ip) ? ip.GetString() ?? "wall" : "wall";
                    if (w.TryGetProperty("p1", out var p1) && w.TryGetProperty("p2", out var p2))
                    {
                        var x1 = p1.TryGetProperty("x", out var x1p) ? x1p.GetDouble() : 0;
                        var z1 = p1.TryGetProperty("y", out var y1p) ? y1p.GetDouble() : 0;
                        var x2 = p2.TryGetProperty("x", out var x2p) ? x2p.GetDouble() : 0;
                        var z2 = p2.TryGetProperty("y", out var y2p) ? y2p.GetDouble() : 0;
                        result.Add(new VttWallDto(id, "Wall", (x1 / 3200.0 - 0.5) * 24.0, (z1 / 2400.0 - 0.5) * 16.0, (x2 / 3200.0 - 0.5) * 24.0, (z2 / 2400.0 - 0.5) * 16.0, true, true));
                    }
                }
            }
        }
        catch { }
        return result;
    }

    private static string NameOf(JsonElement doc, string fallback) =>
        doc.ValueKind == JsonValueKind.Object && doc.TryGetProperty("name", out var n) && n.ValueKind == JsonValueKind.String
            ? n.GetString() ?? fallback : fallback;
}
