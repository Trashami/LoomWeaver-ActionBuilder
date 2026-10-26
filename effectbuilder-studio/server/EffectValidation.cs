using System.Text.Json;
using System.Text.RegularExpressions;
namespace EffectBuilder.Server;
public static class EffectValidation
{
    public static readonly Dictionary<string, string[]> Variants = new() {
        ["beam"] = ["straight","wave","ribbon","pulse","helix"], ["lightning"] = ["arc","branch","fork","chain","plasma"],
        ["projectile"] = ["orb","comet","meteor","shard","swarm"], ["burst"] = ["radial","fire","shatter","cone","implosion"],
        ["aura"] = ["halo","vortex","flame","mist","orbit"], ["sparks"] = ["twirl","fire","embers","pushback","fountain"], ["ring"] = ["shockwave","ripple","runes","spiral","portal"],["cone"] = ["flame","frost","poison","force","shards"],["wall"] = ["force","fire","ice","thorns","stone"],["cloud"] = ["fog","poison","storm","darkness","blizzard"],["sigil"] = ["ward","runic","summoning","banishment","teleport"],["tether"] = ["chain","vine","arcane","soul","gravity"], ["whip"] = ["vine","chain","flame","lightning","ribbon"] };
    private static readonly Dictionary<string, (double Min, double Max)> MotionBounds = new() {
        ["direction"] = (-180,180), ["cone"] = (0,360), ["speed"] = (0,4), ["twirl"] = (-6,6), ["turbulence"] = (0,100),
        ["gravity"] = (-200,200), ["drag"] = (0,1), ["lifetime"] = (0.1,1), ["trail"] = (0,1), ["seed"] = (1,9999) };
    private static readonly Dictionary<string, (double Min, double Max)> WhipBounds = new() {
        ["reach"]=(.25,1.5), ["backswing"]=(0,2), ["height"]=(.2,2), ["curl"]=(0,3), ["thorns"]=(0,40), ["thornSize"]=(0,20),
        ["windup"]=(5,70), ["strike"]=(5,70), ["hold"]=(0,40), ["retract"]=(5,70) };
    private static readonly string[] Easings = ["linear","ease-in","ease-out","ease-in-out"];
    private static readonly Dictionary<string,(double Min,double Max)> MissileBounds=new(){["rise"]=(10,150),["curve"]=(-160,160),["smokeLife"]=(100,1500),["smokeOpacity"]=(0,1),["smokeSpread"]=(1,25),["launchGap"]=(0,300),["impactSize"]=(3,40)};
    private static bool ScenePoint(JsonElement p) => p.ValueKind==JsonValueKind.Object && !p.EnumerateObject().Any(v=>v.Name!="x"&&v.Name!="y") && Number(p,"x",.05,.95) && Number(p,"y",.12,.88);
    private static bool Text(JsonElement o, string key, int max, bool required = true) => o.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.String && v.GetString()!.Length <= max && (!required || !string.IsNullOrWhiteSpace(v.GetString()));
    private static bool Number(JsonElement o, string key, double min, double max) => o.TryGetProperty(key, out var v) && v.ValueKind == JsonValueKind.Number && v.TryGetDouble(out var n) && double.IsFinite(n) && n >= min && n <= max;
    public static bool Valid(JsonElement e) {
        if (e.ValueKind != JsonValueKind.Object || e.GetRawText().Length > 64000 || e.EnumerateObject().Any(p => !new[] { "schemaVersion","id","name","description","spellName","layers","previewScene","summon","gameplay" }.Contains(p.Name))) return false;
        if (!Number(e,"schemaVersion",1,1) || !Text(e,"id",80) || !Text(e,"name",120) || !Text(e,"spellName",120,false) || !Text(e,"description",2000,false) || !e.TryGetProperty("layers",out var layers) || layers.ValueKind != JsonValueKind.Array || layers.GetArrayLength() is < 1 or > 16) return false;
        if(e.TryGetProperty("previewScene",out var scene)) {
            if(scene.ValueKind!=JsonValueKind.Object || scene.EnumerateObject().Any(p=>p.Name!="caster"&&p.Name!="targets"&&p.Name!="targetMotion"&&p.Name!="walls"&&p.Name!="teleport") || !scene.TryGetProperty("caster",out var caster) || !ScenePoint(caster) || !scene.TryGetProperty("targets",out var sceneTargets) || sceneTargets.ValueKind!=JsonValueKind.Array || sceneTargets.GetArrayLength()!=3 || sceneTargets.EnumerateArray().Any(p=>!ScenePoint(p)))return false;
        }
        if(e.TryGetProperty("previewScene",out var teleportScene)&&teleportScene.TryGetProperty("teleport",out var teleport)){
            if(teleport.ValueKind!=JsonValueKind.Object||teleport.EnumerateObject().Any(p=>!new[]{"enabled","vanishMs","hiddenMs","appearMs","destination"}.Contains(p.Name))||!teleport.TryGetProperty("enabled",out var enabled)||enabled.ValueKind is not (JsonValueKind.True or JsonValueKind.False)||!Number(teleport,"vanishMs",100,2500)||!Number(teleport,"hiddenMs",100,5000)||!Number(teleport,"appearMs",100,2500)||!teleport.TryGetProperty("destination",out var destination)||!ScenePoint(destination))return false;
        }
        if(e.TryGetProperty("summon",out var summon)) {
            if(summon.ValueKind!=JsonValueKind.Object||summon.EnumerateObject().Any(p=>!new[]{"campaignId","npcId","name","tokenUrl","delay","size"}.Contains(p.Name))||!Number(summon,"campaignId",1,9007199254740991)||!Number(summon,"npcId",1,9007199254740991)||!summon.GetProperty("campaignId").TryGetInt64(out _)||!summon.GetProperty("npcId").TryGetInt64(out _)||!Text(summon,"name",120)||!Text(summon,"tokenUrl",1000)||!Regex.IsMatch(summon.GetProperty("tokenUrl").GetString()!,@"^/(uploads|assets|tokens|img|api/summon-assets)/[^?#\\]+$")||summon.GetProperty("tokenUrl").GetString()!.Contains("..")||!Number(summon,"delay",0,5000)||!summon.GetProperty("delay").TryGetInt32(out _)||!Number(summon,"size",.25,4))return false;
        }
        if(e.TryGetProperty("gameplay",out var gameplay)){
            if(gameplay.ValueKind!=JsonValueKind.Object||gameplay.EnumerateObject().Any(p=>!new[]{"enabled","move","feet","prone","impactMs","basis"}.Contains(p.Name))||!gameplay.TryGetProperty("enabled",out var ge)||ge.ValueKind is not (JsonValueKind.True or JsonValueKind.False)||!gameplay.TryGetProperty("prone",out var gp)||gp.ValueKind is not (JsonValueKind.True or JsonValueKind.False)||!Text(gameplay,"move",10)||!new[]{"none","push","pull"}.Contains(gameplay.GetProperty("move").GetString())||!Number(gameplay,"feet",5,10)||!gameplay.GetProperty("feet").TryGetInt32(out var feet)||feet is not (5 or 10)||!Number(gameplay,"impactMs",0,5000)||!gameplay.GetProperty("impactMs").TryGetInt32(out _)||!Text(gameplay,"basis",12)||!new[]{"spell","feature","homebrew"}.Contains(gameplay.GetProperty("basis").GetString())||gp.GetBoolean()&&gameplay.GetProperty("basis").GetString()!="homebrew")return false;
        }
        var ids = new HashSet<string>();
        if(e.TryGetProperty("previewScene",out var sceneWorld)){
            if(sceneWorld.TryGetProperty("targetMotion",out var moving)&&moving.ValueKind is not (JsonValueKind.True or JsonValueKind.False))return false;
            if(sceneWorld.TryGetProperty("walls",out var walls)){
                if(walls.ValueKind!=JsonValueKind.Array||walls.GetArrayLength()>8)return false;
                foreach(var wall in walls.EnumerateArray())if(wall.ValueKind!=JsonValueKind.Object||wall.EnumerateObject().Any(p=>p.Name!="a"&&p.Name!="b")||!wall.TryGetProperty("a",out var a)||!wall.TryGetProperty("b",out var b)||!ScenePoint(a)||!ScenePoint(b))return false;
            }
        }
        foreach (var l in layers.EnumerateArray()) {
            if (l.ValueKind != JsonValueKind.Object || l.EnumerateObject().Any(p => !new[] { "id","kind","variant","lighting","cinematic","mageHand","missile","fireHit","fireMaterial","motion","whip","blendMode","opacity","easing","opacityKeyframes","offsetX","offsetY","color","secondaryColor","delay","duration","size","intensity","spread","count","enabled","anchor" }.Contains(p.Name)) || !Text(l,"id",80) || !ids.Add(l.GetProperty("id").GetString()!) || !Text(l,"kind",20) || !Variants.TryGetValue(l.GetProperty("kind").GetString()!, out var variants)) return false;
            if(l.TryGetProperty("lighting",out var lighting)){
                if(lighting.ValueKind!=JsonValueKind.Object||lighting.EnumerateObject().Any(p=>!new[]{"enabled","followColor","color","intensity","radiusFeet","heightFeet","softness","flicker"}.Contains(p.Name))||!lighting.TryGetProperty("enabled",out var le)||le.ValueKind is not (JsonValueKind.True or JsonValueKind.False)||!lighting.TryGetProperty("followColor",out var lc)||lc.ValueKind is not (JsonValueKind.True or JsonValueKind.False)||!Text(lighting,"color",7)||!Regex.IsMatch(lighting.GetProperty("color").GetString()!,"^#[0-9a-fA-F]{6}$")||!Number(lighting,"intensity",0,6)||!Number(lighting,"radiusFeet",1,60)||!Number(lighting,"heightFeet",.25,30)||!Number(lighting,"softness",.05,1)||!Number(lighting,"flicker",0,1))return false;
            }
            if(l.TryGetProperty("cinematic",out var cinematic)){
                if(cinematic.ValueKind!=JsonValueKind.Object||cinematic.EnumerateObject().Any(p=>!new[]{"style","element","reachFeet","widthFeet","bloom","smoke"}.Contains(p.Name))||l.TryGetProperty("mageHand",out _)||l.TryGetProperty("missile",out _)||l.TryGetProperty("fireHit",out _)||l.TryGetProperty("fireMaterial",out _)||!Text(cinematic,"style",12)||!new[]{"beam","cone","column","nova","cube"}.Contains(cinematic.GetProperty("style").GetString())||!Text(cinematic,"element",12)||!new[]{"force","fire","ice","gas","radiant","lightning","acid","shadow"}.Contains(cinematic.GetProperty("element").GetString())||!Number(cinematic,"reachFeet",5,120)||!Number(cinematic,"widthFeet",1,120)||!Number(cinematic,"bloom",0,1.5)||!Number(cinematic,"smoke",0,1))return false;
            }
            if(l.TryGetProperty("mageHand",out var hand)){
                if(l.GetProperty("kind").GetString()!="projectile"||l.TryGetProperty("missile",out _)||l.TryGetProperty("fireMaterial",out _)||hand.ValueKind!=JsonValueKind.Object||hand.EnumerateObject().Any(p=>!new[]{"growth","wrist","wisps","path"}.Contains(p.Name))||!Number(hand,"growth",.05,.6)||!Number(hand,"wrist",0,1)||!Number(hand,"wisps",0,1)||!hand.TryGetProperty("path",out var path)||path.ValueKind!=JsonValueKind.Array||path.GetArrayLength()>8)return false;
                foreach(var point in path.EnumerateArray())if(point.ValueKind!=JsonValueKind.Object||point.EnumerateObject().Any(p=>p.Name!="x"&&p.Name!="y")||!Number(point,"x",-.5,1.5)||!Number(point,"y",-1,1))return false;
            }
            if(l.TryGetProperty("fireMaterial",out var material)){
                if(l.TryGetProperty("fireHit",out _)||l.TryGetProperty("missile",out _)||material.ValueKind!=JsonValueKind.Object||!Text(material,"role",20)||material.EnumerateObject().Any(p=>!new[]{"role","smokeColor","smoke","light","shadows","turbulence","embers","trail","arc","bloom","distortion","scorch"}.Contains(p.Name)))return false;
                var role=material.GetProperty("role").GetString();var expected=role=="caster"?"aura":role=="projectile"?"projectile":role=="impact"?"burst":"invalid";if(l.GetProperty("kind").GetString()!=expected)return false;
                if(!Text(material,"smokeColor",7)||!Regex.IsMatch(material.GetProperty("smokeColor").GetString()!,"^#[0-9a-fA-F]{6}$")||!Number(material,"smoke",0,1)||!Number(material,"light",0,2)||!Number(material,"shadows",0,1)||!Number(material,"turbulence",0,2)||!Number(material,"embers",0,2)||!Number(material,"trail",.2,2)||!Number(material,"arc",-180,180)||!Number(material,"bloom",0,1.5)||!Number(material,"distortion",0,1)||!Number(material,"scorch",0,1))return false;
            }
            if(l.TryGetProperty("fireHit",out var fireHit)){
                if(l.GetProperty("kind").GetString()!="burst"||fireHit.ValueKind!=JsonValueKind.Object||fireHit.EnumerateObject().Any(p=>!new[]{"smokeColor","smoke","light","shadows","turbulence","embers"}.Contains(p.Name)))return false;
                if(!Text(fireHit,"smokeColor",7)||!Regex.IsMatch(fireHit.GetProperty("smokeColor").GetString()!,"^#[0-9a-fA-F]{6}$")||!Number(fireHit,"smoke",0,1)||!Number(fireHit,"light",0,2)||!Number(fireHit,"shadows",0,1)||!Number(fireHit,"turbulence",0,2)||!Number(fireHit,"embers",0,2))return false;
            }
            if(l.TryGetProperty("missile",out var missile)) {
                if(l.GetProperty("kind").GetString()!="projectile" || missile.ValueKind!=JsonValueKind.Object || missile.EnumerateObject().Any(p=>!MissileBounds.ContainsKey(p.Name)&&p.Name!="targets"&&p.Name!="smokeColor"))return false;
                foreach(var (key,bounds) in MissileBounds)if(!Number(missile,key,bounds.Min,bounds.Max))return false;
                if(!Text(missile,"smokeColor",7)||!Regex.IsMatch(missile.GetProperty("smokeColor").GetString()!,"^#[0-9a-fA-F]{6}$")||!missile.TryGetProperty("targets",out var ts)||ts.ValueKind!=JsonValueKind.Array||ts.GetArrayLength()!=3||ts.EnumerateArray().Any(v=>v.ValueKind!=JsonValueKind.Number||!v.TryGetInt32(out var slot)||slot<0||slot>2))return false;
            }
            foreach(var offset in new[]{"offsetX","offsetY"}) if(l.TryGetProperty(offset,out _) && !Number(l,offset,-200,200)) return false;
            if (l.TryGetProperty("easing",out var easing) && (easing.ValueKind != JsonValueKind.String || !Easings.Contains(easing.GetString()))) return false;
            if (l.TryGetProperty("opacityKeyframes",out var frames)) {
                if (frames.ValueKind != JsonValueKind.Array || frames.GetArrayLength() > 32) return false;
                var keyIds = new HashSet<string>(); double previous = -1;
                foreach(var f in frames.EnumerateArray()) {
                    if (f.ValueKind != JsonValueKind.Object || f.EnumerateObject().Any(p => !new[]{"id","time","value","easing"}.Contains(p.Name)) || !Text(f,"id",80) || !keyIds.Add(f.GetProperty("id").GetString()!) || !Number(f,"time",0,1) || !Number(f,"value",0,1) || !Text(f,"easing",20) || !Easings.Contains(f.GetProperty("easing").GetString())) return false;
                    var at=f.GetProperty("time").GetDouble(); if(at-previous < .000001) return false; previous=at;
                }
            }
            if (l.TryGetProperty("whip", out var whip)) {
                if (whip.ValueKind != JsonValueKind.Object || whip.EnumerateObject().Any(p => !WhipBounds.ContainsKey(p.Name))) return false;
                foreach(var (key,bounds) in WhipBounds) if (!Number(whip,key,bounds.Min,bounds.Max)) return false;
                if (whip.GetProperty("thorns").GetDouble() % 1 != 0) return false;
            }
            if (l.TryGetProperty("opacity",out _) && !Number(l,"opacity",0,1)) return false;
            if (l.TryGetProperty("blendMode",out var blend) && (blend.ValueKind != JsonValueKind.String || !new[] {"normal","add","screen","multiply","overlay","soft-light","hard-light","darken","lighten","difference"}.Contains(blend.GetString()))) return false;
            if (l.TryGetProperty("variant",out var variant) && (variant.ValueKind != JsonValueKind.String || !variants.Contains(variant.GetString()))) return false;
            if (l.TryGetProperty("motion",out var motion)) {
                if (motion.ValueKind != JsonValueKind.Object || motion.EnumerateObject().Any(p => !MotionBounds.ContainsKey(p.Name))) return false;
                foreach (var (key,bounds) in MotionBounds) if (!Number(motion,key,bounds.Min,bounds.Max)) return false;
                if (motion.GetProperty("seed").GetDouble() % 1 != 0) return false;
            }
            if (!Text(l,"anchor",10) || !new[] {"caster","target","path"}.Contains(l.GetProperty("anchor").GetString())) return false;
            foreach (var color in new[] {"color","secondaryColor"}) if (!Text(l,color,7) || !Regex.IsMatch(l.GetProperty(color).GetString()!,"^#[0-9a-fA-F]{6}$")) return false;
            if (!Number(l,"delay",0,5000) || !Number(l,"duration",100,5000) || !Number(l,"size",1,200) || !Number(l,"intensity",0,1) || !Number(l,"spread",0,150) || !Number(l,"count",1,100) || l.GetProperty("count").GetDouble() % 1 != 0 || !l.TryGetProperty("enabled",out var enabled) || enabled.ValueKind is not (JsonValueKind.True or JsonValueKind.False)) return false;
        }
        return true;
    }
}
