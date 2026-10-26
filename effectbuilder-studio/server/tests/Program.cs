using System.Text.Json;
using System.Text.Json.Nodes;
using EffectBuilder.Server;
var sample = JsonNode.Parse("""
{"schemaVersion":1,"id":"test","name":"Test","description":"","spellName":"Eldritch Blast","layers":[{"id":"layer","kind":"beam","color":"#00ff00","secondaryColor":"#ffffff","delay":0,"duration":800,"size":7,"intensity":0.9,"spread":22,"count":24,"enabled":true,"anchor":"path"}]}
""")!;
var motion = JsonNode.Parse("""
{"direction":0,"cone":45,"speed":1,"twirl":1,"turbulence":30,"gravity":10,"drag":0.3,"lifetime":0.8,"trail":0.5,"seed":42}
""")!;
var count = 0;
bool Valid(JsonNode? node) => EffectValidation.Valid(JsonSerializer.SerializeToElement(node));
void Check(bool ok, string name) { if (!ok) throw new Exception(name); count++; }
Check(Valid(sample),"Legacy effect accepted");
foreach (var (kind, variants) in EffectValidation.Variants) foreach (var variant in variants) {
    var copy=sample.DeepClone(); copy["layers"]![0]!["kind"]=kind; copy["layers"]![0]!["variant"]=variant; copy["layers"]![0]!["motion"]=motion.DeepClone(); Check(Valid(copy),kind+"/"+variant);
}
foreach (var (key,value) in new (string,double)[] {("direction",181),("cone",361),("speed",5),("twirl",7),("turbulence",101),("gravity",-201),("drag",-0.1),("lifetime",0),("trail",2),("seed",0),("seed",1.5)}) {
    var copy=sample.DeepClone(); var m=motion.DeepClone(); m[key]=value; copy["layers"]![0]!["motion"]=m; Check(!Valid(copy),"Reject invalid "+key);
}
var wrong=sample.DeepClone(); wrong["layers"]![0]!["variant"]="embers"; Check(!Valid(wrong),"Variant belongs to its layer type");
var script=sample.DeepClone(); script["script"]="untrusted"; Check(!Valid(script),"Reject hidden executable fields");
var duplicate=sample.DeepClone(); duplicate["layers"]!.AsArray().Add(sample["layers"]![0]!.DeepClone()); Check(!Valid(duplicate),"Duplicate IDs rejected");
var badNumber=sample.DeepClone(); badNumber["layers"]![0]!["duration"]="800"; Check(!Valid(badNumber),"Wrong numeric types rejected");
Check(!Valid(null),"Null rejected");
foreach(var mode in new[]{"normal","add","screen","multiply","overlay","soft-light","hard-light","darken","lighten","difference"}) { var copy=sample.DeepClone();copy["layers"]![0]!["blendMode"]=mode;copy["layers"]![0]!["opacity"]=0.35;Check(Valid(copy),"Blend "+mode); }
foreach(var bad in new[]{"unsafe","SCREEN",""}) { var copy=sample.DeepClone();copy["layers"]![0]!["blendMode"]=bad;Check(!Valid(copy),"Reject blend "+bad); }
var opacity=sample.DeepClone();opacity["layers"]![0]!["opacity"]=1.1;Check(!Valid(opacity),"Opacity bounds");
var whipSettings=JsonNode.Parse("""{"reach":1,"backswing":0.85,"height":1,"curl":1,"thorns":16,"thornSize":7,"windup":35,"strike":25,"hold":8,"retract":32}""")!;
var vine=sample.DeepClone();vine["layers"]![0]!["kind"]="whip";vine["layers"]![0]!["variant"]="vine";vine["layers"]![0]!["whip"]=whipSettings.DeepClone();Check(Valid(vine),"Full whip choreography accepted");
foreach(var (key,value) in new (string,double)[]{("reach",2),("backswing",-1),("height",3),("curl",4),("thorns",41),("thorns",1.5),("thornSize",21),("windup",0),("strike",0),("hold",-1),("retract",0)}) { var copy=vine.DeepClone();copy["layers"]![0]!["whip"]![key]=value;Check(!Valid(copy),"Whip bounds "+key); }
var unsafeWhip=vine.DeepClone();unsafeWhip["layers"]![0]!["whip"]!["script"]="no";Check(!Valid(unsafeWhip),"Reject unknown whip settings");
foreach(var curve in new[]{"linear","ease-in","ease-out","ease-in-out"}) {var copy=sample.DeepClone();copy["layers"]![0]!["easing"]=curve;copy["layers"]![0]!["opacityKeyframes"]=JsonNode.Parse("""[{"id":"a","time":0,"value":0,"easing":"linear"},{"id":"b","time":1,"value":1,"easing":"ease-out"}]""");Check(Valid(copy),"Animation "+curve);}
foreach(var raw in new[]{"""[{"id":"a","time":0,"value":2,"easing":"linear"}]""","""[{"id":"a","time":-1,"value":1,"easing":"linear"}]""","""[{"id":"a","time":0,"value":1,"easing":"script"}]""","""[{"id":"a","time":0,"value":1,"easing":"linear","script":"bad"}]""","""[{"id":"a","time":0,"value":1,"easing":"linear"},{"id":"b","time":0,"value":0,"easing":"linear"}]"""}) {var copy=sample.DeepClone();copy["layers"]![0]!["opacityKeyframes"]=JsonNode.Parse(raw);Check(!Valid(copy),"Invalid opacity keys");}
var badEase=sample.DeepClone();badEase["layers"]![0]!["easing"]="unsafe";Check(!Valid(badEase),"Invalid easing rejected");
var tooMany=sample.DeepClone();var keys=new JsonArray();for(var i=0;i<33;i++) keys.Add(new JsonObject { ["id"]=i.ToString(),["time"]=i/32.0,["value"]=1,["easing"]="linear" });tooMany["layers"]![0]!["opacityKeyframes"]=keys;Check(!Valid(tooMany),"Keyframe limit");
foreach(var offset in new[]{"offsetX","offsetY"}) {var positioned=sample.DeepClone();positioned["layers"]![0]![offset]=-13;Check(Valid(positioned),"Emitter offset "+offset);positioned["layers"]![0]![offset]=201;Check(!Valid(positioned),"Offset bound "+offset);}
var missile=JsonNode.Parse("""{"targets":[0,1,2],"smokeColor":"#a59ad9","rise":55,"curve":85,"smokeLife":700,"smokeOpacity":0.45,"smokeSpread":8,"launchGap":90,"impactSize":18}""")!;
foreach(var slots in new[]{"[0,1,2]","[0,0,1]","[2,2,2]"}){var copy=sample.DeepClone();copy["layers"]![0]!["kind"]="projectile";var m=missile.DeepClone();m["targets"]=JsonNode.Parse(slots);copy["layers"]![0]!["missile"]=m;Check(Valid(copy),"Missile allocation "+slots);}
foreach(var slots in new[]{"[0,3,1]","[0,1]","[0,1,1.5]"}){var copy=sample.DeepClone();copy["layers"]![0]!["kind"]="projectile";var m=missile.DeepClone();m["targets"]=JsonNode.Parse(slots);copy["layers"]![0]!["missile"]=m;Check(!Valid(copy),"Reject missile allocation "+slots);}
var preview=sample.DeepClone();preview["previewScene"]=JsonNode.Parse("""{"caster":{"x":0.2,"y":0.6},"targets":[{"x":0.8,"y":0.5},{"x":0.7,"y":0.3},{"x":0.8,"y":0.8}]}""");Check(Valid(preview),"Preview scene accepted");preview["previewScene"]!["targets"]![0]!["x"]=2;Check(!Valid(preview),"Preview point bounds");
var fire=sample.DeepClone();fire["layers"]![0]!["kind"]="burst";fire["layers"]![0]!["fireHit"]=JsonNode.Parse("""{"smokeColor":"#4a4149","smoke":0.7,"light":1,"shadows":0.65,"turbulence":0.8,"embers":1}""");Check(Valid(fire),"Shader fire settings");
foreach(var key in new[]{"smoke","light","shadows","turbulence","embers"}){var copy=fire.DeepClone();copy["layers"]![0]!["fireHit"]![key]=99;Check(!Valid(copy),"Reject fire bound "+key);}
var wrongFire=fire.DeepClone();wrongFire["layers"]![0]!["kind"]="beam";Check(!Valid(wrongFire),"Fire requires burst");
var badFireColor=fire.DeepClone();badFireColor["layers"]![0]!["fireHit"]!["smokeColor"]="unsafe";Check(!Valid(badFireColor),"Fire color validation");
var badFireField=fire.DeepClone();badFireField["layers"]![0]!["fireHit"]!["script"]="unsafe";Check(!Valid(badFireField),"Reject arbitrary shader source");
var material=JsonNode.Parse("""{"role":"impact","smokeColor":"#4a4149","smoke":0.7,"light":1,"shadows":0.65,"turbulence":0.8,"embers":1,"trail":1,"arc":-55,"bloom":0.65,"distortion":0.45,"scorch":0.7}""")!;
foreach(var (role,kind) in new[]{("caster","aura"),("projectile","projectile"),("impact","burst")}){var copy=sample.DeepClone();copy["layers"]![0]!["kind"]=kind;var m=material.DeepClone();m["role"]=role;copy["layers"]![0]!["fireMaterial"]=m;Check(Valid(copy),"Fire material "+role);}
foreach(var key in new[]{"smoke","light","shadows","turbulence","embers","trail","arc","bloom","distortion","scorch"}){var copy=sample.DeepClone();copy["layers"]![0]!["kind"]="burst";copy["layers"]![0]!["fireMaterial"]=material.DeepClone();copy["layers"]![0]!["fireMaterial"]![key]=999;Check(!Valid(copy),"Reject material bound "+key);}
var world=sample.DeepClone();world["previewScene"]=JsonNode.Parse("""{"caster":{"x":0.22,"y":0.52},"targets":[{"x":0.78,"y":0.52},{"x":0.72,"y":0.27},{"x":0.82,"y":0.78}],"targetMotion":true,"walls":[{"a":{"x":0.55,"y":0.2},"b":{"x":0.55,"y":0.8}}]}""");Check(Valid(world),"World preview scene");world["previewScene"]!["walls"]![0]!["a"]!["x"]=2;Check(!Valid(world),"Reject out of bounds wall");
var unsafeMaterial=sample.DeepClone();unsafeMaterial["layers"]![0]!["kind"]="burst";unsafeMaterial["layers"]![0]!["fireMaterial"]=material.DeepClone();unsafeMaterial["layers"]![0]!["fireMaterial"]!["shaderSource"]="unsafe";Check(!Valid(unsafeMaterial),"Reject executable material source");
var hand=sample.DeepClone();hand["layers"]![0]!["kind"]="projectile";hand["layers"]![0]!["mageHand"]=JsonNode.Parse("""{"growth":0.22,"wrist":0.7,"wisps":0.65,"path":[{"x":0.5,"y":-0.3}]}""");Check(Valid(hand),"Mage Hand route accepted");
foreach(var key in new[]{"growth","wrist","wisps"}){var bad=hand.DeepClone();bad["layers"]![0]!["mageHand"]![key]=99;Check(!Valid(bad),"Reject hand bound "+key);}
var badHand=hand.DeepClone();badHand["layers"]![0]!["mageHand"]!["path"]![0]!["x"]=2;Check(!Valid(badHand),"Reject hand route bounds");badHand=hand.DeepClone();badHand["layers"]![0]!["mageHand"]!["script"]="bad";Check(!Valid(badHand),"Reject hand script");badHand=hand.DeepClone();badHand["layers"]![0]!["missile"]=missile.DeepClone();Check(!Valid(badHand),"Reject incompatible hand material");
var cinematic=sample.DeepClone();cinematic["layers"]![0]!["cinematic"]=JsonNode.Parse("""{"style":"cone","element":"ice","reachFeet":15,"widthFeet":15,"bloom":0.8,"smoke":0.6}""");Check(Valid(cinematic),"Cinematic material accepted");foreach(var key in new[]{"reachFeet","widthFeet","bloom","smoke"}){var bad=cinematic.DeepClone();bad["layers"]![0]!["cinematic"]![key]=999;Check(!Valid(bad),"Reject cinematic bound "+key);}
var rider=sample.DeepClone();rider["gameplay"]=JsonNode.Parse("""{"enabled":true,"move":"pull","feet":5,"prone":false,"impactMs":700,"basis":"spell"}""");Check(Valid(rider),"Gameplay accepted");var riderBad=rider.DeepClone();riderBad["gameplay"]!["prone"]=true;Check(!Valid(riderBad),"Prone requires homebrew");riderBad=rider.DeepClone();riderBad["gameplay"]!["feet"]=7;Check(!Valid(riderBad),"Rider feet are 5 or 10");
var target=new MythWeaver.Server.CombatMaps.SpellRiderGeometry.Point(300,200);var casterPoint=new MythWeaver.Server.CombatMaps.SpellRiderGeometry.Point(100,200);
var freeMove=MythWeaver.Server.CombatMaps.SpellRiderGeometry.Move(casterPoint,target,false,132,20,1000,800,[],[]);Check(Math.Abs(freeMove.X-432)<.01,"Ten-foot push");
var blocked=MythWeaver.Server.CombatMaps.SpellRiderGeometry.Move(casterPoint,target,false,132,20,1000,800,[new(new(360,0),new(360,800))],[]);Check(blocked.X<=340,"Wall blocks swept push");
var pulled=MythWeaver.Server.CombatMaps.SpellRiderGeometry.Move(casterPoint,target,true,264,20,1000,800,[],[new(casterPoint,20)]);Check(pulled.X>=140,"Pull cannot overlap caster");
var edge=MythWeaver.Server.CombatMaps.SpellRiderGeometry.Move(casterPoint,target,false,900,20,500,800,[],[]);Check(edge.X<=480,"Map boundary clips movement");
Check(!MythWeaver.Server.CombatMaps.SpellRiderRules.CanControl(true,false,1,null,null,null),"Unowned NPC is not player-controlled");Check(MythWeaver.Server.CombatMaps.SpellRiderRules.CanControl(true,false,1,1,null,null),"Owned token control");Check(MythWeaver.Server.CombatMaps.SpellRiderRules.CanControl(true,false,1,null,2,2),"Member character control");Check(!MythWeaver.Server.CombatMaps.SpellRiderRules.CanControl(false,false,1,1,2,2),"Campaign membership required");Check(!MythWeaver.Server.CombatMaps.SpellRiderRules.CanAffect(false,false,66,66,"thornwhip"),"Miss or successful save skips rider");Check(!MythWeaver.Server.CombatMaps.SpellRiderRules.CanAffect(true,true,66,66,"thornwhip"),"Locked token protected");Check(!MythWeaver.Server.CombatMaps.SpellRiderRules.CanAffect(true,false,198,66,"thornwhip"),"Huge target cannot be whipped");Check(MythWeaver.Server.CombatMaps.SpellRiderRules.CanAffect(true,false,198,66,"thunderwave"),"Thunderwave has no size restriction");
var lit=sample.DeepClone();lit["layers"]![0]!["lighting"]=JsonNode.Parse("""{"enabled":true,"followColor":true,"color":"#ffad62","intensity":1.2,"radiusFeet":12,"heightFeet":3,"softness":0.8,"flicker":0.08}""");Check(Valid(lit),"Lighting accepted");
foreach(var key in new[]{"intensity","radiusFeet","heightFeet","softness","flicker"}){var bad=lit.DeepClone();bad["layers"]![0]!["lighting"]![key]=1000;Check(!Valid(bad),"Lighting bounds "+key);}
foreach(var key in new[]{"enabled","followColor","color"}){var bad=lit.DeepClone();bad["layers"]![0]!["lighting"]![key]="invalid";Check(!Valid(bad),"Lighting type "+key);}
var unsafeLight=lit.DeepClone();unsafeLight["layers"]![0]!["lighting"]!["script"]="invalid";Check(!Valid(unsafeLight),"Lighting rejects arbitrary fields");
Console.WriteLine($"PASS: {count} server checks for legacy effects, all 65 variants, motion limits, strict JSON types, and unsafe fields.");

var summonSample=sample.DeepClone();summonSample["summon"]=JsonNode.Parse("""{"campaignId":2,"npcId":17,"name":"Familiar","tokenUrl":"/api/summon-assets/01234567890123456789012345678901","delay":800,"size":1}""");
Check(Valid(summonSample),"Summon accepted");
foreach(var (key,value) in new (string,JsonNode?)[]{("campaignId",JsonValue.Create(0)),("npcId",JsonValue.Create(1.5)),("delay",JsonValue.Create(5001)),("size",JsonValue.Create(10)),("tokenUrl",JsonValue.Create("https://example.com/private.png")),("tokenUrl",JsonValue.Create("/uploads/../secret")),("tokenUrl",JsonValue.Create("/uploads/foo?secret=1"))}){var invalid=summonSample.DeepClone();invalid["summon"]![key]=value;Check(!Valid(invalid),"Invalid summon "+key);}
Console.WriteLine($"{count} checks including summoning passed.");

var teleportSample=sample.DeepClone();teleportSample["previewScene"]=JsonNode.Parse("""{"caster":{"x":0.22,"y":0.52},"targets":[{"x":0.32,"y":0.55},{"x":0.72,"y":0.27},{"x":0.82,"y":0.78}],"teleport":{"enabled":true,"vanishMs":650,"hiddenMs":700,"appearMs":650,"destination":{"x":0.78,"y":0.52}}}""");Check(Valid(teleportSample),"Teleport preview accepted");teleportSample["previewScene"]!["teleport"]!["destination"]!["x"]=2;Check(!Valid(teleportSample),"Reject invalid teleport destination");Console.WriteLine("Teleport preview validation passed.");
