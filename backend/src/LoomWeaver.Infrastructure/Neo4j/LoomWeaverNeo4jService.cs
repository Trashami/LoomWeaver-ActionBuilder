using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using Neo4j.Driver;

namespace LoomWeaver.Infrastructure.Neo4j;

public sealed class LoomWeaverGraphOptions
{
    public string Uri { get; set; } = "bolt://127.0.0.1:7687";
    public string Username { get; set; } = "neo4j";
    public string Password { get; set; } = "";
    public string Namespace { get; set; } = "loomweaver";
}

public sealed class LoomWeaverNeo4jService : IAsyncDisposable
{
    private readonly LoomWeaverGraphOptions _options;
    private readonly IDriver? _driver;

    private static readonly List<EntitySummaryDto> DynamicGraphNodes = new();
    private static readonly List<GraphEdgeDto> DynamicGraphEdges = new()
    {
        new("1:Location:loc-ruined-chapel", "1:Location:room-c1-nave", "CONTAINS", "players", "Present in Ruined Chapel (C1)"),
        new("1:Location:loc-ruined-chapel", "1:Location:room-c2-courtyard", "CONTAINS", "players", "Present in Ruined Chapel (C2)"),
        new("1:Location:loc-ruined-chapel", "1:Location:room-c3-crypt", "CONTAINS", "gm", "Hidden Beneath Altar (C3)"),
        new("1:Session:session-15", "1:Location:loc-ruined-chapel", "PLANS", "players", "Session 15 Primary Site"),
        new("1:NPC:npc-malric", "1:Location:room-c1-nave", "CURRENTLY_IN", "players", "Present in C1"),
        new("1:Encounter:enc-shadow-stalker", "1:Location:room-c2-courtyard", "OCCURS_AT", "players", "Triggered in C2 Courtyard"),
    };

    public LoomWeaverNeo4jService(LoomWeaverGraphOptions options)
    {
        _options = options;
        if (!string.IsNullOrWhiteSpace(options.Uri))
        {
            _driver = GraphDatabase.Driver(options.Uri, AuthTokens.Basic(options.Username, options.Password));
        }
    }

    public async Task ProjectCharacterOrNpcNodeAsync(
        int campaignId,
        EntitySummaryDto node,
        string? sessionId,
        string? locationCompositeKey,
        CancellationToken ct = default)
    {
        lock (DynamicGraphNodes)
        {
            DynamicGraphNodes.RemoveAll(n => n.CompositeKey == node.CompositeKey);
            DynamicGraphNodes.Add(node);
            if (!string.IsNullOrWhiteSpace(locationCompositeKey))
            {
                DynamicGraphEdges.Add(new GraphEdgeDto(
                    node.CompositeKey,
                    locationCompositeKey,
                    "FEATURES",
                    node.Visibility,
                    $"Present in {locationCompositeKey.Split(':').LastOrDefault()}"));
            }
            if (!string.IsNullOrWhiteSpace(sessionId))
            {
                DynamicGraphEdges.Add(new GraphEdgeDto(
                    $"{campaignId}:Session:{sessionId}",
                    node.CompositeKey,
                    "FEATURES",
                    node.Visibility,
                    $"Linked to {sessionId}"));
            }
        }

        if (_driver is null) return;
        try
        {
            await using var session = _driver.AsyncSession();
            var cypher = """
                MERGE (n:Entity:AdventureNode {namespace: $ns, campaignId: $cid, compositeKey: $ckey})
                SET n.entityType = $etype,
                    n.entityKey = $ekey,
                    n.nodeId = $ekey,
                    n.name = $name,
                    n.subtitle = $sub,
                    n.visibility = $vis,
                    n.canonStatus = $canon,
                    n.route = $route
                WITH n
                OPTIONAL MATCH (loc:Entity {namespace: $ns, campaignId: $cid, compositeKey: $locKey})
                FOREACH (_ IN CASE WHEN loc IS NOT NULL THEN [1] ELSE [] END |
                    MERGE (n)-[r:CURRENTLY_IN]->(loc)
                    SET r.visibility = $vis, r.whyIncluded = 'Populated in Adventure Guide'
                )
                """;
            await session.RunAsync(cypher, new
            {
                ns = _options.Namespace,
                cid = campaignId,
                ckey = node.CompositeKey,
                etype = node.EntityType,
                ekey = node.EntityKey,
                name = node.Name,
                sub = node.Subtitle,
                vis = node.Visibility,
                canon = node.CanonStatus,
                route = node.RouteLink,
                locKey = locationCompositeKey ?? ""
            });
        }
        catch
        {
            // Keep in-memory projection active when Neo4j tunnel is offline
        }
    }

    public async Task ProjectBattlemapAssignmentAsync(
        int campaignId,
        string sceneKey,
        string sceneTitle,
        string sessionId,
        string locationCompositeKey,
        CancellationToken ct = default)
    {
        var mapKey = $"{campaignId}:MapRegion:{sceneKey}";
        lock (DynamicGraphNodes)
        {
            DynamicGraphNodes.RemoveAll(n => n.CompositeKey == mapKey);
            DynamicGraphNodes.Add(new EntitySummaryDto(
                mapKey,
                campaignId,
                "Location",
                sceneKey,
                sceneTitle,
                $"Assigned Battlemap · {sessionId}",
                $"Battlemap linked to {sessionId} and {locationCompositeKey}.",
                "players",
                "approved",
                $"/maps?scene={sceneKey}"));
            DynamicGraphEdges.Add(new GraphEdgeDto(
                mapKey,
                locationCompositeKey,
                "DEPICTS",
                "players",
                $"Assigned Battlemap for {sessionId}"));
        }

        if (_driver is null) return;
        try
        {
            await using var session = _driver.AsyncSession();
            var cypher = """
                MERGE (m:Entity:AdventureNode:MapRegion {namespace: $ns, campaignId: $cid, compositeKey: $mkey})
                SET m.nodeId = $skey,
                    m.entityType = 'MapRegion',
                    m.entityKey = $skey,
                    m.name = $title,
                    m.visibility = 'players',
                    m.route = $route
                WITH m
                OPTIONAL MATCH (loc:Entity {namespace: $ns, campaignId: $cid, compositeKey: $locKey})
                FOREACH (_ IN CASE WHEN loc IS NOT NULL THEN [1] ELSE [] END |
                    MERGE (m)-[r:DEPICTS]->(loc)
                    SET r.visibility = 'players', r.sessionId = $sid
                )
                """;
            await session.RunAsync(cypher, new
            {
                ns = _options.Namespace,
                cid = campaignId,
                mkey = mapKey,
                skey = sceneKey,
                title = sceneTitle,
                route = $"/maps?scene={sceneKey}",
                locKey = locationCompositeKey,
                sid = sessionId
            });
        }
        catch
        {
            // Keep in-memory projection active when Neo4j tunnel is offline
        }
    }

    public async Task<GraphSubgraphDto> GetAuthorizedSubgraphAsync(int campaignId, string viewerRole, CancellationToken ct = default)
    {
        var isGm = string.Equals(viewerRole, "gm", StringComparison.OrdinalIgnoreCase);
        if (_driver is not null)
        {
            try
            {
                await using var session = _driver.AsyncSession();
                var cypher = """
                    MATCH (n:Entity {namespace: $ns, campaignId: $cid})
                    WHERE $isGm = true OR n.visibility IN ['public', 'players']
                    OPTIONAL MATCH (n)-[r]->(m:Entity {namespace: $ns, campaignId: $cid})
                    WHERE $isGm = true OR (r.visibility IN ['public', 'players'] AND m.visibility IN ['public', 'players'])
                    RETURN n.compositeKey AS sKey, n.entityType AS sType, n.entityKey AS sId, n.name AS sName,
                           n.subtitle AS sSub, n.visibility AS sVis, n.canonStatus AS sCanon, n.route AS sRoute,
                           type(r) AS relType, r.visibility AS relVis, m.compositeKey AS tKey
                    """;
                var cursor = await session.RunAsync(cypher, new { ns = _options.Namespace, cid = campaignId, isGm });
                var records = await cursor.ToListAsync(ct);
                if (records.Count > 0)
                {
                    var nodeMap = new Dictionary<string, EntitySummaryDto>();
                    var edges = new List<GraphEdgeDto>();
                    foreach (var rec in records)
                    {
                        var sKey = rec["sKey"].As<string>();
                        if (!nodeMap.ContainsKey(sKey))
                        {
                            nodeMap[sKey] = new EntitySummaryDto(
                                sKey,
                                campaignId,
                                rec["sType"].As<string>(),
                                rec["sId"].As<string>(),
                                rec["sName"].As<string>(),
                                rec["sSub"].As<string>() ?? "",
                                "",
                                rec["sVis"].As<string>() ?? "players",
                                rec["sCanon"].As<string>() ?? "approved",
                                rec["sRoute"].As<string>() ?? "/campaigns"
                            );
                        }
                        var relType = rec["relType"].As<string?>();
                        var tKey = rec["tKey"].As<string?>();
                        if (!string.IsNullOrEmpty(relType) && !string.IsNullOrEmpty(tKey))
                        {
                            edges.Add(new GraphEdgeDto(sKey, tKey, relType, rec["relVis"].As<string?>() ?? "players", relType));
                        }
                    }
                    return new GraphSubgraphDto(campaignId, _options.Namespace, isGm ? "gm" : "players", nodeMap.Values.ToList(), edges);
                }
            }
            catch
            {
                // Fall back to deterministic in-memory projection when tunnel is offline
            }
        }

        var nodes = FallbackSeedData.FilterEntities(campaignId, isGm, null).ToList();
        var fallbackEdges = new List<GraphEdgeDto>
        {
            new("1:Location:loc-vandia", "1:Location:loc-plains-red", "CONNECTED_TO", "players", "Northeast Cinth Road"),
            new("1:Location:loc-plains-red", "1:Location:loc-cinth", "CONNECTED_TO", "players", "Plains of Vistagh Approach"),
            new("1:PlayerCharacter:pc-dal", "1:Location:loc-cinth", "CURRENTLY_IN", "players", "In Cinth"),
            new("1:PlayerCharacter:pc-kildrid", "1:Clue:clue-kildrid-tremor", "DISCOVERED", "players", "Stone Sense"),
            new("1:Quest:quest-cinth-gala", "1:Location:loc-cinth", "TARGETS", "players", "Active Gala")
        };

        lock (DynamicGraphNodes)
        {
            foreach (var dynNode in DynamicGraphNodes.Where(n => n.CampaignId == campaignId && (isGm || n.Visibility != "gm")))
            {
                if (nodes.All(existing => existing.CompositeKey != dynNode.CompositeKey))
                {
                    nodes.Add(dynNode);
                }
            }
            fallbackEdges.AddRange(DynamicGraphEdges.Where(e => isGm || e.Visibility != "gm"));
        }

        if (isGm)
        {
            fallbackEdges.Add(new("1:Clue:clue-kildrid-tremor", "1:Secret:sec-emrys-trap", "REVEALS", "gm", "Points to Dragon Trap"));
            fallbackEdges.Add(new("1:Secret:sec-emrys-trap", "1:Monster:mon-bound-dragon", "ABOUT", "gm", "Life-Bound Tether"));
            fallbackEdges.Add(new("1:NPC:npc-emrys", "1:Secret:sec-emrys-trap", "KNOWS_ABOUT", "gm", "Architect of Trap"));
            fallbackEdges.Add(new("1:NPC:npc-emrys", "1:Faction:fac-priors", "CONTROLS", "gm", "Chokrah Siphon"));
        }
        return new GraphSubgraphDto(campaignId, _options.Namespace, isGm ? "gm" : "players", nodes, fallbackEdges);
    }

    public async ValueTask DisposeAsync()
    {
        if (_driver is not null)
        {
            await _driver.DisposeAsync();
        }
    }
}
