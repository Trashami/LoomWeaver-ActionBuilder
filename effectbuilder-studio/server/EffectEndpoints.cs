using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;
using MySqlConnector;
using MythWeaver.Server.Auth;
using MythWeaver.Server.Data;
namespace EffectBuilder.Server;
public static class EffectEndpoints {
    public record Assignment(string SpellName, long CharacterId, JsonElement Definition);
    public record Publication(string Title, string? Description, JsonElement[] Effects);
    static string Key(string name) => Regex.Replace(name.ToLowerInvariant(),"[^a-z0-9]","");
    public static void MapEffectEndpoints(this IEndpointRouteBuilder app) {
        var g = app.MapGroup("/api/effects");
        g.MapGet("/campaigns/{cid:long}/summon-npcs",async(long cid,ClaimsPrincipal u,MySqlConnectionFactory f,CancellationToken ct)=>{
            await using var c=await Open(f,ct);if(!await Allowed(c,cid,u.GetUserId(),null,ct))return Results.Forbid();
            await using var q=c.CreateCommand();q.CommandText="SELECT n.id,n.name,COALESCE(JSON_UNQUOTE(JSON_EXTRACT(n.details,'$.tokenUrl')),n.avatar_url,'') FROM cm_characters n WHERE n.campaign_id=@c AND LOWER(n.character_type) NOT IN ('pc','player') AND (n.user_id=@u OR n.player_id=@u OR EXISTS(SELECT 1 FROM mw_campaigns cp LEFT JOIN mw_campaign_members m ON m.campaign_id=cp.id AND m.user_id=@u WHERE cp.id=@c AND (cp.dm_user_id=@u OR m.role IN ('dm','co-dm')))) ORDER BY n.name LIMIT 200";q.Parameters.AddWithValue("@c",cid);q.Parameters.AddWithValue("@u",u.GetUserId());var list=new List<object>();await using var r=await q.ExecuteReaderAsync(ct);while(await r.ReadAsync(ct))list.Add(new{id=r.GetInt64(0),name=r.GetString(1),tokenUrl=r.GetString(2)});return Results.Ok(list);
        }).RequireAuthorization();
        g.MapGet("/library", async (ClaimsPrincipal u, MySqlConnectionFactory f, CancellationToken ct) => {
            await using var c = await Open(f,ct); await using var q = c.CreateCommand(); q.CommandText = "SELECT definition_json FROM mw_effect_library WHERE user_id=@uid ORDER BY updated_at DESC LIMIT 500"; q.Parameters.AddWithValue("@uid",u.GetUserId());
            var list = new List<JsonElement>(); await using var r = await q.ExecuteReaderAsync(ct); while (await r.ReadAsync(ct)) list.Add(JsonSerializer.Deserialize<JsonElement>(r.GetString(0))); return Results.Ok(list);
        }).RequireAuthorization();
        g.MapPut("/library/{id}", async (string id, JsonElement d, ClaimsPrincipal u, MySqlConnectionFactory f, CancellationToken ct) => {
            if (!EffectValidation.Valid(d) || d.GetProperty("id").GetString() != id) return Results.BadRequest(new { message="Invalid effect definition or motion parameters." });
            await using var c = await Open(f,ct); await using var q = c.CreateCommand(); q.CommandText = "INSERT INTO mw_effect_library(user_id,effect_id,definition_json) VALUES(@uid,@id,@json) ON DUPLICATE KEY UPDATE definition_json=@json";
            q.Parameters.AddWithValue("@uid",u.GetUserId()); q.Parameters.AddWithValue("@id",id); q.Parameters.AddWithValue("@json",d.GetRawText()); await q.ExecuteNonQueryAsync(ct); return Results.Ok(new {id});
        }).RequireAuthorization();
        g.MapDelete("/library/{id}", async (string id, ClaimsPrincipal u, MySqlConnectionFactory f, CancellationToken ct) => {
            await using var c=await Open(f,ct); await using var q=c.CreateCommand(); q.CommandText="DELETE FROM mw_effect_library WHERE user_id=@uid AND effect_id=@id"; q.Parameters.AddWithValue("@uid",u.GetUserId()); q.Parameters.AddWithValue("@id",id); await q.ExecuteNonQueryAsync(ct); return Results.NoContent();
        }).RequireAuthorization();
        g.MapGet("/campaigns/{cid:long}/assignments", async (long cid, ClaimsPrincipal u, MySqlConnectionFactory f, CancellationToken ct) => {
            await using var c=await Open(f,ct); if (!await Allowed(c,cid,u.GetUserId(),null,ct)) return Results.Forbid();
            await using var q=c.CreateCommand(); q.CommandText="SELECT spell_name,character_id,definition_json FROM mw_effect_assignments WHERE campaign_id=@cid"; q.Parameters.AddWithValue("@cid",cid); var list=new List<Assignment>(); await using var r=await q.ExecuteReaderAsync(ct); while(await r.ReadAsync(ct)) list.Add(new(r.GetString(0),r.GetInt64(1),JsonSerializer.Deserialize<JsonElement>(r.GetString(2)))); return Results.Ok(list);
        }).RequireAuthorization();
        g.MapPut("/campaigns/{cid:long}/assignments", async (long cid, Assignment a, ClaimsPrincipal u, MySqlConnectionFactory f, CancellationToken ct) => {
            if(!EffectValidation.Valid(a.Definition) || string.IsNullOrWhiteSpace(a.SpellName) || a.SpellName.Length>120 || Key(a.SpellName).Length==0 || a.CharacterId<0) return Results.BadRequest(new {message="A valid effect and spell name are required."});
            await using var c=await Open(f,ct); if(!await Allowed(c,cid,u.GetUserId(),a.CharacterId,ct)) return Results.Forbid();
            if(a.Definition.TryGetProperty("gameplay",out var rider)&&rider.GetProperty("enabled").GetBoolean()&&!await Allowed(c,cid,u.GetUserId(),0,ct))return Results.BadRequest(new{message="A GM must approve and assign gameplay riders. You can assign cosmetic effects with gameplay disabled."});
            if(a.Definition.TryGetProperty("summon",out var summon)) {
                if(summon.GetProperty("campaignId").GetInt64()!=cid)return Results.BadRequest(new{message="Relink the summon to an NPC in the assigned campaign."});
                await using var check=c.CreateCommand();check.CommandText="SELECT COUNT(*) FROM cm_characters n WHERE n.id=@n AND n.campaign_id=@c AND LOWER(n.character_type) NOT IN ('pc','player') AND (n.user_id=@u OR n.player_id=@u OR EXISTS(SELECT 1 FROM mw_campaigns cp LEFT JOIN mw_campaign_members m ON m.campaign_id=cp.id AND m.user_id=@u WHERE cp.id=@c AND (cp.dm_user_id=@u OR m.role IN ('dm','co-dm'))))";check.Parameters.AddWithValue("@n",summon.GetProperty("npcId").GetInt64());check.Parameters.AddWithValue("@c",cid);check.Parameters.AddWithValue("@u",u.GetUserId());if(Convert.ToInt64(await check.ExecuteScalarAsync(ct))==0)return Results.Forbid();
                var url=summon.GetProperty("tokenUrl").GetString()!;if(url.StartsWith("/api/summon-assets/")){await using var asset=c.CreateCommand();asset.CommandText="SELECT COUNT(*) FROM mw_summon_assets WHERE id=@id AND user_id=@u";asset.Parameters.AddWithValue("@id",url.Split('/').Last());asset.Parameters.AddWithValue("@u",u.GetUserId());if(Convert.ToInt64(await asset.ExecuteScalarAsync(ct))==0)return Results.Forbid();}
            }
 await using var q=c.CreateCommand(); q.CommandText="INSERT INTO mw_effect_assignments(campaign_id,character_id,spell_key,spell_name,definition_json) VALUES(@cid,@char,@key,@name,@json) ON DUPLICATE KEY UPDATE spell_name=@name,definition_json=@json";
            q.Parameters.AddWithValue("@cid",cid); q.Parameters.AddWithValue("@char",a.CharacterId); q.Parameters.AddWithValue("@key",Key(a.SpellName)); q.Parameters.AddWithValue("@name",a.SpellName.Trim()); q.Parameters.AddWithValue("@json",a.Definition.GetRawText()); await q.ExecuteNonQueryAsync(ct); return Results.Ok();
        }).RequireAuthorization();
        g.MapDelete("/campaigns/{cid:long}/assignments", async (long cid,string spellName,long characterId,ClaimsPrincipal u,MySqlConnectionFactory f,CancellationToken ct)=>{
            await using var c=await Open(f,ct); if(!await Allowed(c,cid,u.GetUserId(),characterId,ct)) return Results.Forbid(); await using var q=c.CreateCommand(); q.CommandText="DELETE FROM mw_effect_assignments WHERE campaign_id=@cid AND character_id=@char AND spell_key=@key"; q.Parameters.AddWithValue("@cid",cid); q.Parameters.AddWithValue("@char",characterId); q.Parameters.AddWithValue("@key",Key(spellName)); await q.ExecuteNonQueryAsync(ct); return Results.NoContent();
        }).RequireAuthorization();
        g.MapGet("/marketplace", async (MySqlConnectionFactory f,CancellationToken ct)=>{
            await using var c=await Open(f,ct); await using var q=c.CreateCommand(); q.CommandText="SELECT id,title,description,author_name,module_data_json FROM marketplace_products WHERE category IN ('spell_effect','effect_pack') AND verification_status IN ('published','verified') AND price_cents=0 ORDER BY created_at DESC LIMIT 100";
            var list=new List<object>(); await using var r=await q.ExecuteReaderAsync(ct); while(await r.ReadAsync(ct)) { var d=JsonSerializer.Deserialize<JsonElement>(r.GetString(4)); list.Add(new {id=r.GetInt64(0),title=r.GetString(1),description=r.IsDBNull(2)?"":r.GetString(2),authorName=r.GetString(3),effectCount=d.GetProperty("effects").GetArrayLength()}); } return Results.Ok(list);
        });
        g.MapGet("/marketplace/{id:long}",async(long id,MySqlConnectionFactory f,CancellationToken ct)=>{
            await using var c=await Open(f,ct); await using var q=c.CreateCommand(); q.CommandText="SELECT module_data_json FROM marketplace_products WHERE id=@id AND category IN ('spell_effect','effect_pack') AND verification_status IN ('published','verified') AND price_cents=0"; q.Parameters.AddWithValue("@id",id); var json=await q.ExecuteScalarAsync(ct) as string; return json is null ? Results.NotFound() : Results.Content(json,"application/json");
        });
        g.MapPost("/marketplace",async(Publication p,ClaimsPrincipal u,MySqlConnectionFactory f,CancellationToken ct)=>{
            if(string.IsNullOrWhiteSpace(p.Title) || p.Title.Length>120 || (p.Description?.Length??0)>2000 || p.Effects is null || p.Effects.Length is <1 or >50 || p.Effects.Any(d=>!EffectValidation.Valid(d)||d.TryGetProperty("summon",out _))) return Results.BadRequest(new {message="Provide a title and 1–50 valid effects."});
            await using var c=await Open(f,ct); await using var author=c.CreateCommand(); author.CommandText="SELECT COALESCE(NULLIF(display_name,''),username) FROM mw_users WHERE id=@uid"; author.Parameters.AddWithValue("@uid",u.GetUserId()); var name=Convert.ToString(await author.ExecuteScalarAsync(ct))??"Creator";
            await using var q=c.CreateCommand(); q.CommandText="INSERT INTO marketplace_products(title,slug,subtitle,description,category,price_cents,badge_label,author_user_id,author_name,verification_status,tags_json,module_data_json) VALUES(@title,@slug,'Custom VTT spell visuals',@desc,@cat,0,'COMMUNITY',@uid,@author,'published','[\"VTT\",\"Spell effects\"]',@data); SELECT LAST_INSERT_ID();";
            q.Parameters.AddWithValue("@title",p.Title.Trim()); q.Parameters.AddWithValue("@slug","fx-"+Guid.NewGuid().ToString("N")); q.Parameters.AddWithValue("@desc",p.Description??""); q.Parameters.AddWithValue("@cat",p.Effects.Length==1?"spell_effect":"effect_pack"); q.Parameters.AddWithValue("@uid",u.GetUserId()); q.Parameters.AddWithValue("@author",name); q.Parameters.AddWithValue("@data",JsonSerializer.Serialize(new {format="loomweaver-effect-pack",schemaVersion=1,effects=p.Effects})); var id=Convert.ToInt64(await q.ExecuteScalarAsync(ct)); return Results.Ok(new {id});
        }).RequireAuthorization();
    }
    static async Task<bool> Allowed(MySqlConnection c,long cid,long? uid,long? character,CancellationToken ct) {
        if(uid is null || character<0) return false; await using var q=c.CreateCommand(); q.CommandText="SELECT c.dm_user_id,m.role,m.character_id FROM mw_campaigns c LEFT JOIN mw_campaign_members m ON m.campaign_id=c.id AND m.user_id=@uid WHERE c.id=@cid"; q.Parameters.AddWithValue("@uid",uid); q.Parameters.AddWithValue("@cid",cid);
        bool gm,member; long? own;
        await using(var r=await q.ExecuteReaderAsync(ct)) { if(!await r.ReadAsync(ct))return false; gm=r.GetInt64(0)==uid || !r.IsDBNull(1) && r.GetString(1) is "dm" or "co-dm"; member=!r.IsDBNull(1); own=r.IsDBNull(2)?null:r.GetInt64(2); }
        if(character is null) return gm||member; if(character==0)return gm; if(!gm)return member&&own==character;
        await using var exists=c.CreateCommand(); exists.CommandText="SELECT COUNT(*) FROM mw_campaign_members WHERE campaign_id=@cid AND character_id=@char"; exists.Parameters.AddWithValue("@cid",cid); exists.Parameters.AddWithValue("@char",character); return Convert.ToInt64(await exists.ExecuteScalarAsync(ct))>0;
    }
    static async Task<MySqlConnection> Open(MySqlConnectionFactory f,CancellationToken ct) {
        var c=f.CreateConnection(); try { await c.OpenAsync(ct); await using var q=c.CreateCommand(); q.CommandText="""
            CREATE TABLE IF NOT EXISTS mw_effect_library(user_id BIGINT NOT NULL,effect_id VARCHAR(80) NOT NULL,definition_json LONGTEXT NOT NULL,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(user_id,effect_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            CREATE TABLE IF NOT EXISTS mw_effect_assignments(campaign_id BIGINT NOT NULL,character_id BIGINT NOT NULL DEFAULT 0,spell_key VARCHAR(120) NOT NULL,spell_name VARCHAR(120) NOT NULL,definition_json LONGTEXT NOT NULL,updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(campaign_id,character_id,spell_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """; await q.ExecuteNonQueryAsync(ct); return c; } catch { await c.DisposeAsync(); throw; }
    }
}
