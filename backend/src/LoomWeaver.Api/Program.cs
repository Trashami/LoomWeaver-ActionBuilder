using LoomWeaver.GameSystems;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules;
using LoomWeaver.Modules.Realtime;

var builder = WebApplication.CreateBuilder(args);

var mysqlOptions = builder.Configuration.GetSection("LoomWeaverDatabase").Get<LoomWeaverMySqlOptions>()
    ?? new LoomWeaverMySqlOptions();
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
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();
app.UseCors();
app.MapHub<TableRealtimeHub>("/hubs/table");
app.MapLoomWeaverModules();
app.Run();
