using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MythWeaver.Server.Data;
using EffectBuilder.Server;
var builder = WebApplication.CreateBuilder(args);
var configRoot = builder.Configuration["SharedConfigRoot"];
if (!string.IsNullOrWhiteSpace(configRoot)) {
    builder.Configuration.AddJsonFile(Path.Combine(configRoot, "appsettings.json"), optional: false)
        .AddJsonFile(Path.Combine(configRoot, "appsettings.Production.json"), optional: true)
        .AddJsonFile(Path.Combine(configRoot, "appsettings.Local.json"), optional: true).AddEnvironmentVariables();
}
builder.WebHost.ConfigureKestrel(o => o.Limits.MaxRequestBodySize = 4_000_000);
var secret = builder.Configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Configure the shared Jwt:Secret before starting Effect Builder.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters {
    ValidateIssuerSigningKey = true, IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)), ValidateIssuer = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "MythWeaver.Server", ValidateAudience = true,
    ValidAudience = builder.Configuration["Jwt:Audience"] ?? "MythWeaver.Client", ValidateLifetime = true, ClockSkew = TimeSpan.FromMinutes(2)
});
builder.Services.AddAuthorization(); builder.Services.AddSingleton<MySqlConnectionFactory>();
var app = builder.Build(); app.UseAuthentication(); app.UseAuthorization(); app.MapEffectEndpoints(); MythWeaver.Server.Images.SummonAssets.Map(app);
app.MapGet("/api/effects/health", () => Results.Ok(new { service = "effectbuilder", version = 14, surfaceLighting = true, normalMappedPreview = true, spellTemplates = 25, cinematicCones = true, gameplayRiders = true, cinematicMaterials = true, summonTokens = true, styles = 65, blendModes = 10, opacityKeyframes = true, ambientPresets = 43, texturedFireball = true, shaderFireHit = true, magicMissile = true }));
app.Run();
