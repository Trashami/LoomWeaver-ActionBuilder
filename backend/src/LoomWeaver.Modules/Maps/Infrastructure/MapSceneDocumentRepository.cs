using System.Text.Json;
using LoomWeaver.Infrastructure.MySql;
using MySqlConnector;

namespace LoomWeaver.Modules.Maps.Infrastructure;

public sealed record StoredMapSceneDocument(int Revision, JsonElement Document, string Visibility = "players");

public static class MapSceneDocumentRepository
{
    public static async Task<StoredMapSceneDocument?> LoadAsync(
        LoomWeaverMySqlRepository mysql, int campaignId, string sceneKey, CancellationToken ct)
    {
        await using var db = await mysql.OpenConnectionAsync(ct);
        await using var cmd = new MySqlCommand("""
            SELECT revision, document_json, visibility
            FROM lw_battlemap_scenes WHERE campaign_id = @c AND scene_key = @s
            """, db);
        cmd.Parameters.AddWithValue("@c", campaignId);
        cmd.Parameters.AddWithValue("@s", sceneKey);
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct)
            ? new StoredMapSceneDocument(reader.GetInt32(0), JsonSerializer.Deserialize<JsonElement>(reader.GetString(1)), reader.GetString(2))
            : null;
    }

    public static async Task<(string SceneKey, StoredMapSceneDocument Document)?> LoadLatestAsync(
        LoomWeaverMySqlRepository mysql, int campaignId, string? title, CancellationToken ct)
    {
        await using var db = await mysql.OpenConnectionAsync(ct);
        if (!string.IsNullOrWhiteSpace(title))
        {
            await using var byTitle = new MySqlCommand("""
                SELECT scene_key, revision, document_json, visibility
                FROM lw_battlemap_scenes
                WHERE campaign_id = @c AND JSON_UNQUOTE(JSON_EXTRACT(document_json, '$.name')) = @t
                ORDER BY updated_at DESC, revision DESC
                LIMIT 1
                """, db);
            byTitle.Parameters.AddWithValue("@c", campaignId);
            byTitle.Parameters.AddWithValue("@t", title.Trim());
            await using var r1 = await byTitle.ExecuteReaderAsync(ct);
            if (await r1.ReadAsync(ct))
            {
                return (
                    r1.GetString(0),
                    new StoredMapSceneDocument(r1.GetInt32(1), JsonSerializer.Deserialize<JsonElement>(r1.GetString(2)), r1.GetString(3))
                );
            }
        }

        await using var latest = new MySqlCommand("""
            SELECT scene_key, revision, document_json, visibility
            FROM lw_battlemap_scenes
            WHERE campaign_id = @c
            ORDER BY updated_at DESC, revision DESC
            LIMIT 1
            """, db);
        latest.Parameters.AddWithValue("@c", campaignId);
        await using var r2 = await latest.ExecuteReaderAsync(ct);
        if (await r2.ReadAsync(ct))
        {
            return (
                r2.GetString(0),
                new StoredMapSceneDocument(r2.GetInt32(1), JsonSerializer.Deserialize<JsonElement>(r2.GetString(2)), r2.GetString(3))
            );
        }
        return null;
    }

    public static async Task<int?> SaveAsync(
        LoomWeaverMySqlRepository mysql,
        int campaignId,
        string sceneKey,
        int expectedRevision,
        string documentJson,
        string updatedBy,
        CancellationToken ct)
    {
        await using var db = await mysql.OpenConnectionAsync(ct);
        await using var tx = await db.BeginTransactionAsync(ct);
        await using (var upsert = new MySqlCommand("""
            INSERT INTO lw_battlemap_scenes
                (campaign_id, scene_key, revision, document_json, updated_by)
            VALUES (@c, @s, 1, CAST(@d AS JSON), @u)
            ON DUPLICATE KEY UPDATE
                revision = revision + 1,
                document_json = CAST(@d AS JSON),
                updated_by = @u
            """, db, tx))
        {
            upsert.Parameters.AddWithValue("@c", campaignId);
            upsert.Parameters.AddWithValue("@s", sceneKey);
            upsert.Parameters.AddWithValue("@d", documentJson);
            upsert.Parameters.AddWithValue("@u", updatedBy);
            await upsert.ExecuteNonQueryAsync(ct);
        }

        int nextRevision = 1;
        await using (var revCmd = new MySqlCommand("""
            SELECT revision FROM lw_battlemap_scenes WHERE campaign_id = @c AND scene_key = @s
            """, db, tx))
        {
            revCmd.Parameters.AddWithValue("@c", campaignId);
            revCmd.Parameters.AddWithValue("@s", sceneKey);
            var revObj = await revCmd.ExecuteScalarAsync(ct);
            if (revObj is not null) nextRevision = Convert.ToInt32(revObj);
        }

        await using (var playEvent = new MySqlCommand("""
            INSERT INTO lw_play_events (campaign_id, event_kind, actor_label, summary, payload_json)
            VALUES (@c, 'map_scene_saved', @u, @summary, JSON_OBJECT('sceneKey', @s, 'revision', @r))
            """, db, tx))
        {
            playEvent.Parameters.AddWithValue("@c", campaignId);
            playEvent.Parameters.AddWithValue("@u", updatedBy);
            playEvent.Parameters.AddWithValue("@summary", $"Saved map scene '{sceneKey}' at revision {nextRevision}.");
            playEvent.Parameters.AddWithValue("@s", sceneKey);
            playEvent.Parameters.AddWithValue("@r", nextRevision);
            await playEvent.ExecuteNonQueryAsync(ct);
        }

        await tx.CommitAsync(ct);
        return nextRevision;
    }
}
