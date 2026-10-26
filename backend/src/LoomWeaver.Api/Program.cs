using LoomWeaver.GameSystems;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules;
using LoomWeaver.Modules.Auth;
using LoomWeaver.Modules.Realtime;

var builder = WebApplication.CreateBuilder(args);

var mysqlOptions = builder.Configuration.GetSection("LoomWeaverDatabase").Get<LoomWeaverMySqlOptions>()
    ?? new LoomWeaverMySqlOptions();
var envConnStr = builder.Configuration.GetConnectionString("LoomWeaverMySql");
if (!string.IsNullOrWhiteSpace(envConnStr))
{
    mysqlOptions.ConnectionString = envConnStr;
}

var graphOptions = builder.Configuration.GetSection("LoomWeaverGraph").Get<LoomWeaverGraphOptions>()
    ?? new LoomWeaverGraphOptions();

builder.Services.AddSingleton(mysqlOptions);
builder.Services.AddSingleton<LoomWeaverMySqlRepository>();
builder.Services.AddSingleton(graphOptions);
builder.Services.AddSingleton<LoomWeaverNeo4jService>();
builder.Services.AddSingleton<IGameSystemRules, Dnd5eSystemRules>();
builder.Services.AddSingleton<IGameSystemRules, Pathfinder2eSystemRules>();
builder.Services.AddSingleton<IGameSystemRules, VampireV5SystemRules>();
builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

var app = builder.Build();
app.UseCors();

// Enforce unified JWT / .loom-weaver.com cookie authentication across all API routes
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
    {
        var isPublicAuthOrHealth =
            path.EndsWith("/health", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/auth/login", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/auth/register", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/auth/google", StringComparison.OrdinalIgnoreCase) ||
            path.EndsWith("/auth/request-account", StringComparison.OrdinalIgnoreCase);

        if (!isPublicAuthOrHealth)
        {
            var user = AuthAndCheckoutEndpoints.ResolveAuthenticatedUser(context);
            if (user is null)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsync("{\"message\":\"Authentication required. Please sign in to LoomWeaver.\"}");
                return;
            }
        }
    }

    await next();
});

app.MapHub<TableRealtimeHub>("/hubs/table");
app.MapLoomWeaverModules();
app.Run();
