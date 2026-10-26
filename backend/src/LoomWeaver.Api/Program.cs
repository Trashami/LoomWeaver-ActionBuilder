using LoomWeaver.GameSystems;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules;
using LoomWeaver.Modules.Auth;
using LoomWeaver.Modules.Realtime;

LoomWeaver.Api.LoomWeaverServerHost.Run(args);

namespace LoomWeaver.Api
{
    public static class LoomWeaverServerHost
    {
        public static void Run(string[] args)
        {
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
                    policy
                        .SetIsOriginAllowed(SecurityHardeningMiddleware.IsTrustedOrigin)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials());
            });

            var app = builder.Build();
            app.UseCors();

            // Initialize LoomWeaver V2 MySQL schema (lw_*) on startup when reachable
            var repo = app.Services.GetRequiredService<LoomWeaverMySqlRepository>();
            _ = Task.Run(() => MySqlUserAuthStore.EnsureDatabaseReadyAsync(repo));

            // Enforce OWASP security headers, auth rate-limiting, and unified JWT / HttpOnly cookie auth
            app.Use(async (context, next) =>
            {
                SecurityHardeningMiddleware.ApplySecurityHeaders(context);

                var path = context.Request.Path.Value ?? string.Empty;
                if (path.StartsWith("/api/", StringComparison.OrdinalIgnoreCase))
                {
                    if (SecurityHardeningMiddleware.IsRateLimitedAuthRequest(context, path))
                    {
                        context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync("{\"message\":\"Too many authentication attempts. Please wait 60 seconds and try again.\"}");
                        return;
                    }

                    var isPublicAuthOrHealth =
                        path.EndsWith("/health", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/effects/studio", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/effects/emitters", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/auth/login", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/auth/register", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/auth/google", StringComparison.OrdinalIgnoreCase) ||
                        path.EndsWith("/auth/logout", StringComparison.OrdinalIgnoreCase) ||
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
        }
    }
}
