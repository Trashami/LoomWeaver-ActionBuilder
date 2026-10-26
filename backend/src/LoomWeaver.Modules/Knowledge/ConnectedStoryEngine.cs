using System.Text.Json;
using LoomWeaver.Domain;
using LoomWeaver.Infrastructure.MySql;
using LoomWeaver.Infrastructure.Neo4j;
using LoomWeaver.Modules.Auth;
using MySqlConnector;

namespace LoomWeaver.Modules.Knowledge;

public static class ConnectedStoryEngine
{
    private static int _pendingOutboxCount;
    private static int _projectedRelCount = ConnectedStorySeedStore.Relationships.Count;

    public static async Task EnsureSchemaAndSeedAsync(LoomWeaverMySqlRepository repo, LoomWeaverNeo4jService graph)
    {
        try
        {
            await using var conn = await repo.OpenConnectionAsync();
            var ddl = """
                CREATE TABLE IF NOT EXISTS `lw_claims` (
                  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                  `campaign_id` BIGINT UNSIGNED NOT NULL,
                  `entity_id` BIGINT UNSIGNED NULL,
                  `composite_key` VARCHAR(160) NOT NULL,
                  `title` VARCHAR(160) NOT NULL,
                  `statement` TEXT NOT NULL,
                  `truth_assessment` ENUM('unverified','confirmed','disputed','disproven') NOT NULL DEFAULT 'unverified',
                  `gm_canonical_truth` TEXT NOT NULL,
                  `supporting_source_key` VARCHAR(160) NULL,
                  `contradicting_source_key` VARCHAR(160) NULL,
                  `documented_lore_id` VARCHAR(64) NULL,
                  `implicated_entity_key` VARCHAR(160) NULL,
                  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
                  `revision` INT NOT NULL DEFAULT 1,
                  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS `lw_entity_relationships` (
                  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                  `campaign_id` BIGINT UNSIGNED NOT NULL,
                  `from_entity_id` BIGINT UNSIGNED NULL,
                  `from_composite_key` VARCHAR(160) NOT NULL,
                  `relationship_type` VARCHAR(64) NOT NULL,
                  `to_entity_id` BIGINT UNSIGNED NULL,
                  `to_composite_key` VARCHAR(160) NOT NULL,
                  `why_included_label` VARCHAR(200) NOT NULL DEFAULT '',
                  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
                  `source_record_id` VARCHAR(160) NULL,
                  `valid_from_event_id` BIGINT UNSIGNED NULL,
                  `valid_until_event_id` BIGINT UNSIGNED NULL,
                  `revision` INT NOT NULL DEFAULT 1,
                  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                  UNIQUE KEY `uk_lw_entity_rel` (`campaign_id`, `from_composite_key`, `relationship_type`, `to_composite_key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE IF NOT EXISTS `lw_world_regions` (
                  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
                  `campaign_id` BIGINT UNSIGNED NOT NULL,
                  `map_id` VARCHAR(64) NOT NULL,
                  `composite_key` VARCHAR(160) NOT NULL,
                  `name` VARCHAR(160) NOT NULL,
                  `overlay_type` VARCHAR(32) NOT NULL DEFAULT 'region',
                  `subtitle` VARCHAR(200) NOT NULL DEFAULT 'Charted Realm',
                  `faction_key` VARCHAR(160) NULL,
                  `color_hex` VARCHAR(24) NOT NULL DEFAULT '#d9b77a',
                  `label_x` DECIMAL(6,2) NOT NULL DEFAULT 50.00,
                  `label_y` DECIMAL(6,2) NOT NULL DEFAULT 50.00,
                  `svg_path` TEXT NOT NULL,
                  `points_json` JSON NOT NULL,
                  `description` TEXT NOT NULL,
                  `governance_and_realm` TEXT NOT NULL,
                  `linked_lore_id` VARCHAR(64) NULL,
                  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
                  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                """;
            await using (var cmd = new MySqlCommand(ddl, conn))
            {
                await cmd.ExecuteNonQueryAsync();
            }

            foreach (var rel in ConnectedStorySeedStore.Relationships)
            {
                await graph.ProjectEntityRelationshipAsync(
                    rel.Id,
                    rel.CampaignId,
                    rel.FromCompositeKey,
                    rel.RelationshipType,
                    rel.ToCompositeKey,
                    rel.Visibility,
                    rel.WhyIncludedLabel,
                    rel.Revision,
                    rel.ValidFromEventId,
                    rel.ValidUntilEventId);
            }
        }
        catch
        {
            // Continue with synchronized in-memory seed store when DB tunnel is offline
        }
    }

    public static CampaignStoryWorkspaceDto BuildStoryWorkspace(
        int campaignId,
        ResolvedCampaignAccess access,
        string? beatId = null)
    {
        lock (ConnectedStorySeedStore.SyncLock)
        {
            if (!string.IsNullOrWhiteSpace(beatId))
            {
                ConnectedStorySeedStore.ActiveBeatId = beatId.Trim();
            }

            var activeBeatId = ConnectedStorySeedStore.ActiveBeatId;
            var allBeats = ConnectedStorySeedStore.Acts.SelectMany(a => a.Beats).ToList();
            var activeBeat = allBeats.FirstOrDefault(b => b.Id == activeBeatId)
                             ?? allBeats.FirstOrDefault(b => b.Id == "beat-2-1-arrival")
                             ?? allBeats.First();

            var chain = BuildConnectedChain(campaignId, access, activeBeat.ScopeNodeId);
            var connectedGroups = BuildConnectedGroupsForBeat(activeBeat, access.IsEffectiveGm);

            return new CampaignStoryWorkspaceDto(
                CampaignId: campaignId,
                CampaignTitle: "SHADOW OF THE MOUNTAIN",
                CampaignSubtitle: "Six Luminaries, a bound dragon beneath the Southern Peaks, and the road to Cinth — a kingdom where ancient power stirs and old secrets refuse to stay buried.",
                HeroArtworkUrl: "/combat-caves.jpg",
                CurrentActLabel: "Act II",
                CurrentActSub: "The Road to Cinth",
                NextSessionLabel: "Session 15",
                NextSessionSub: "The Ruined Chapel",
                TotalSessionsLabel: "14 sessions",
                TotalSessionsSub: "In progress",
                ActiveBeatId: activeBeat.Id,
                ActiveBeatTitle: activeBeat.Title.Contains(' ') && char.IsDigit(activeBeat.Title[0])
                    ? activeBeat.Title[(activeBeat.Title.IndexOf(' ') + 1)..]
                    : activeBeat.Title,
                Acts: ConnectedStorySeedStore.Acts.ToList(),
                SessionSequence: ConnectedStorySeedStore.SessionSequence.ToList(),
                LoreAndClues: ConnectedStorySeedStore.LoreAndCluesFeed.ToList(),
                ConnectedGroups: connectedGroups,
                ActiveStoryChain: chain
            );
        }
    }

    public static ConnectedStoryChainDto BuildConnectedChain(
        int campaignId,
        ResolvedCampaignAccess access,
        string? scopeNodeId = null)
    {
        lock (ConnectedStorySeedStore.SyncLock)
        {
            var isGm = access.IsEffectiveGm;
            var rels = ConnectedStorySeedStore.Relationships
                .Where(r => r.CampaignId == campaignId && (isGm || r.Visibility != "gm"))
                .ToList();

            var claims = ConnectedStorySeedStore.Claims
                .Where(c => c.CampaignId == campaignId && (isGm || c.Visibility != "gm"))
                .Select(c => isGm ? c : c with { GmCanonicalTruth = null })
                .ToList();

            var steps = new List<ConnectedChainStepDto>
            {
                new("step-session", "Session", "1:Session:session-15", "Session 15", "The Ruined Chapel · Live Session",
                    "What are we preparing to play?", "plans ->", null, "/campaigns?session=session-15", "players", new[] { "All Party" }),
                new("step-scene", "Scene", "1:Scene:scene-crypt-descent", "Investigate the Crypt", "Scene 3 · Beneath the Altar",
                    "What scene is planned?", "occurs at ->", null, "/campaigns?session=session-15", "players", new[] { "All Party" }),
                new("step-room", "Room", "1:Room:room-c3-crypt", "Crypt C3", "Sealed Altar Crypt · Resonance Vault",
                    "Where does it happen?", "contains ->", null, "/maps?scene=scene-mountain-prison", "players", new[] { "Dal", "Kildrid", "Kycius" }),
                new("step-clue", "Clue", "1:Clue:clue-chokrah-manifest", "Chokrah Manifest", "Signed Prior Siphon Ledger & Carvings",
                    "What can the party find here?", "supports ->", "confirmed", "/world-lore?tab=lore&loreId=lore-priors-rituals", "players", new[] { "Dal", "Kildrid", "Kycius" }),
                new("step-claim", "Claim", "1:Claim:claim-priors-rituals", "Claim about the Priors", "Priors siphon student magic via Chokrah",
                    "What does the evidence suggest?", "documented in & implicates ->", claims.FirstOrDefault()?.TruthAssessment ?? "confirmed", "/world-lore?tab=lore&loreId=lore-priors-rituals", "players", new[] { "Dal", "Kildrid", "Kycius" }),
                new("step-lore", "Lore", "1:Lore:lore-priors-rituals", "Lore: Priors' Rituals", "Codex Article · Corrupted Street-Schools",
                    "Where is the supporting explanation?", "implicates ->", null, "/world-lore?tab=lore&loreId=lore-priors-rituals", "players", new[] { "All Party" }),
                new("step-npc", "NPC", "1:NPC:npc-emrys", "NPC: Emrys Driothe", "Council of Magic Reformer",
                    "Who is involved?", "discovered by ->", null, "/campaigns?inspect=npc-emrys", "players", new[] { "All Party" }),
                new("step-discovery", "Discovery", "1:PlayerCharacter:pc-dal", "Discovery During Play", "Knowledge Grants: Dal, Kildrid & Kycius",
                    "Who actually knows this?", "verified grant", "confirmed", "/characters?focus=pc-dal", "players", new[] { "Dal", "Kildrid", "Kycius" })
            };

            return new ConnectedStoryChainDto(
                ChainId: "chain-chapel-crypt-priors",
                Title: "Connected Story & Evidence Chain — The Ruined Chapel",
                Subtitle: "SQL stores authored records & play events; Neo4j connects Session -> Scene -> Room -> Clue -> Claim -> Lore & NPC -> Character Discovery.",
                ScopeNodeId: scopeNodeId ?? "session-15",
                Steps: steps,
                Claims: claims,
                Relationships: rels,
                PendingOutboxCount: _pendingOutboxCount,
                ProjectedRelationshipCount: _projectedRelCount
            );
        }
    }

    public static async Task<EntityRelationshipDto> SaveRelationshipAndProjectAsync(
        int campaignId,
        CreateStoryRelationshipRequest req,
        LoomWeaverMySqlRepository repo,
        LoomWeaverNeo4jService graph,
        CancellationToken ct = default)
    {
        var fromKey = string.IsNullOrWhiteSpace(req.FromCompositeKey) ? "1:Clue:clue-chokrah-manifest" : req.FromCompositeKey.Trim();
        var toKey = string.IsNullOrWhiteSpace(req.ToCompositeKey) ? "1:Claim:claim-priors-rituals" : req.ToCompositeKey.Trim();
        var relType = string.IsNullOrWhiteSpace(req.RelationshipType) ? "SUPPORTS" : req.RelationshipType.Trim().ToUpperInvariant();
        var vis = string.Equals(req.Visibility, "gm", StringComparison.OrdinalIgnoreCase) ? "gm" : "players";
        var why = string.IsNullOrWhiteSpace(req.WhyIncludedLabel) ? $"{relType} link" : req.WhyIncludedLabel.Trim();

        EntityRelationshipDto created;
        lock (ConnectedStorySeedStore.SyncLock)
        {
            if (req.MarkPreviousHistorical)
            {
                for (var i = 0; i < ConnectedStorySeedStore.Relationships.Count; i++)
                {
                    var cur = ConnectedStorySeedStore.Relationships[i];
                    if (cur.FromCompositeKey == fromKey && cur.RelationshipType == "CURRENTLY_IN" && !cur.IsHistorical)
                    {
                        ConnectedStorySeedStore.Relationships[i] = cur with
                        {
                            RelationshipType = "WAS_IN",
                            ValidUntilEventId = DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000,
                            IsHistorical = true
                        };
                    }
                }
            }

            var existingIdx = ConnectedStorySeedStore.Relationships.FindIndex(r =>
                r.CampaignId == campaignId &&
                r.FromCompositeKey == fromKey &&
                r.RelationshipType == relType &&
                r.ToCompositeKey == toKey);

            var nextRev = existingIdx >= 0 ? ConnectedStorySeedStore.Relationships[existingIdx].Revision + 1 : 1;
            var nextId = existingIdx >= 0
                ? ConnectedStorySeedStore.Relationships[existingIdx].Id
                : ConnectedStorySeedStore.Relationships.Count + 1L;

            created = new EntityRelationshipDto(
                nextId, campaignId, fromKey, fromKey.Split(':').LastOrDefault() ?? fromKey,
                fromKey.Split(':').ElementAtOrDefault(1) ?? "Entity", relType, toKey,
                toKey.Split(':').LastOrDefault() ?? toKey, toKey.Split(':').ElementAtOrDefault(1) ?? "Entity",
                why, vis, req.SourceRecordId, DateTimeOffset.UtcNow.ToUnixTimeSeconds() % 1000, null, nextRev, false);

            if (existingIdx >= 0) ConnectedStorySeedStore.Relationships[existingIdx] = created;
            else ConnectedStorySeedStore.Relationships.Insert(0, created);
            _pendingOutboxCount++;
        }

        // Write sequence: 1. SQL transaction (relationship + pending outbox with projected_to_neo4j = 0) -> 2. Project to Neo4j -> 3. Mark processed
        long? outboxId = null;
        try
        {
            await using var conn = await repo.OpenConnectionAsync(ct);
            await using var tx = await conn.BeginTransactionAsync(ct);

            var relSql = """
                INSERT INTO lw_entity_relationships
                  (campaign_id, from_composite_key, relationship_type, to_composite_key, why_included_label, visibility, source_record_id, revision)
                VALUES (@cid, @fromKey, @relType, @toKey, @why, @vis, @src, @rev)
                ON DUPLICATE KEY UPDATE
                  why_included_label = VALUES(why_included_label),
                  visibility = VALUES(visibility),
                  revision = revision + 1;
                """;
            await using (var relCmd = new MySqlCommand(relSql, conn, tx))
            {
                relCmd.Parameters.AddWithValue("@cid", campaignId);
                relCmd.Parameters.AddWithValue("@fromKey", created.FromCompositeKey);
                relCmd.Parameters.AddWithValue("@relType", created.RelationshipType);
                relCmd.Parameters.AddWithValue("@toKey", created.ToCompositeKey);
                relCmd.Parameters.AddWithValue("@why", created.WhyIncludedLabel);
                relCmd.Parameters.AddWithValue("@vis", created.Visibility);
                relCmd.Parameters.AddWithValue("@src", (object?)created.SourceRecordId ?? DBNull.Value);
                relCmd.Parameters.AddWithValue("@rev", created.Revision);
                await relCmd.ExecuteNonQueryAsync(ct);
            }

            var outboxSql = """
                INSERT INTO lw_outbox_messages (campaign_id, event_type, composite_key, payload_json, projected_to_neo4j)
                VALUES (@cid, 'ENTITY_RELATIONSHIP_UPSERTED', @ckey, @payload, 0);
                SELECT LAST_INSERT_ID();
                """;
            await using (var obCmd = new MySqlCommand(outboxSql, conn, tx))
            {
                obCmd.Parameters.AddWithValue("@cid", campaignId);
                obCmd.Parameters.AddWithValue("@ckey", $"{created.FromCompositeKey}->{created.ToCompositeKey}");
                obCmd.Parameters.AddWithValue("@payload", JsonSerializer.Serialize(created));
                var scalar = await obCmd.ExecuteScalarAsync(ct);
                if (scalar is not null) outboxId = Convert.ToInt64(scalar);
            }

            await tx.CommitAsync(ct);
        }
        catch
        {
            // Continue to Neo4j projection even if MySQL is offline
        }

        var projected = await graph.ProjectEntityRelationshipAsync(
            created.Id,
            campaignId,
            created.FromCompositeKey,
            created.RelationshipType,
            created.ToCompositeKey,
            created.Visibility,
            created.WhyIncludedLabel,
            created.Revision,
            created.ValidFromEventId,
            created.ValidUntilEventId,
            ct);

        if (projected)
        {
            Interlocked.Decrement(ref _pendingOutboxCount);
            if (_pendingOutboxCount < 0) _pendingOutboxCount = 0;
            Interlocked.Increment(ref _projectedRelCount);

            if (outboxId.HasValue)
            {
                try
                {
                    await using var conn = await repo.OpenConnectionAsync(ct);
                    await using var markCmd = new MySqlCommand(
                        "UPDATE lw_outbox_messages SET projected_to_neo4j = 1 WHERE id = @id", conn);
                    markCmd.Parameters.AddWithValue("@id", outboxId.Value);
                    await markCmd.ExecuteNonQueryAsync(ct);
                }
                catch
                {
                    // Ignore
                }
            }
        }

        return created;
    }

    public static async Task<IReadOnlyList<LoomGraphPathDto>> QueryAuthorizedLoomPathsAsync(
        int campaignId,
        ResolvedCampaignAccess access,
        string query,
        LoomWeaverNeo4jService graph,
        CancellationToken ct = default)
    {
        var isGm = access.IsEffectiveGm;
        var subgraph = await graph.GetAuthorizedSubgraphAsync(campaignId, isGm ? "gm" : "players", ct);

        // Combine live Neo4j subgraph edges with SQL/persisted relationship store, enforcing visibility & knowledge grants
        var results = new List<LoomGraphPathDto>();
        lock (ConnectedStorySeedStore.SyncLock)
        {
            foreach (var rel in ConnectedStorySeedStore.Relationships.Where(r => r.CampaignId == campaignId))
            {
                if (!isGm && rel.Visibility == "gm") continue;
                var statePrefix = rel.IsHistorical ? "[Historical] " : "";
                results.Add(new LoomGraphPathDto(
                    $"{statePrefix}({rel.FromName})-[:{rel.RelationshipType}]->({rel.ToName}) · {rel.WhyIncludedLabel}",
                    rel.FromCompositeKey,
                    rel.RelationshipType,
                    rel.ToCompositeKey,
                    rel.Visibility
                ));
            }
        }

        foreach (var edge in subgraph.Edges)
        {
            if (!isGm && edge.Visibility == "gm") continue;
            if (results.Any(r => r.SourceKey == edge.SourceKey && r.TargetKey == edge.TargetKey && r.RelationshipType == edge.RelationshipType))
                continue;

            var sNode = subgraph.Nodes.FirstOrDefault(n => n.CompositeKey == edge.SourceKey);
            var tNode = subgraph.Nodes.FirstOrDefault(n => n.CompositeKey == edge.TargetKey);
            if (!isGm && (sNode?.Visibility == "gm" || tNode?.Visibility == "gm")) continue;

            results.Add(new LoomGraphPathDto(
                $"({sNode?.Name ?? edge.SourceKey})-[:{edge.RelationshipType}]->({tNode?.Name ?? edge.TargetKey})",
                edge.SourceKey,
                edge.RelationshipType,
                edge.TargetKey,
                edge.Visibility
            ));
        }

        if (!string.IsNullOrWhiteSpace(query))
        {
            var matched = results
                .Where(p => p.PathSummary.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                            p.RelationshipType.Contains(query, StringComparison.OrdinalIgnoreCase))
                .ToList();
            if (matched.Count > 0) return matched.Take(8).ToList();
        }

        return results.Take(8).ToList();
    }

    public static async Task<WorldMapRegionOverlayDto> UpsertRegionAndSyncAsync(
        int campaignId,
        UpsertRegionOverlayRequest req,
        LoomWeaverMySqlRepository repo,
        LoomWeaverNeo4jService graph)
    {
        var overlays = WorldLoreStateStore.OverlaysByCampaign.TryGetValue(campaignId, out var ovList)
            ? ovList
            : (WorldLoreStateStore.OverlaysByCampaign[campaignId] = []);
        var cleanName = string.IsNullOrWhiteSpace(req.Name) ? "NEW REGION" : req.Name.Trim();
        var slug = string.Join("-", cleanName.ToLowerInvariant().Split([' ', '/', '\'', ':', ',', '&'], StringSplitOptions.RemoveEmptyEntries));
        var id = string.IsNullOrWhiteSpace(req.Id) ? $"reg-{slug}" : req.Id.Trim();
        var mapId = string.IsNullOrWhiteSpace(req.MapId) ? "map-icrandor-world" : req.MapId.Trim();
        var points = req.Points is { Count: >= 3 }
            ? req.Points.ToList()
            : [new(30, 30), new(55, 30), new(55, 55), new(30, 55)];
        var svgPath = !string.IsNullOrWhiteSpace(req.SvgPath) && req.Points is null
            ? req.SvgPath.Trim()
            : "M " + string.Join(" L ", points.Select(p => $"{Math.Round(p.X * 10, 1):0.#} {Math.Round(p.Y * 5.6, 1):0.#}")) + " Z";
        var labelX = req.LabelX > 0 ? req.LabelX : Math.Round(points.Average(p => p.X), 1);
        var labelY = req.LabelY > 0 ? req.LabelY : Math.Round(points.Average(p => p.Y), 1);
        var vis = string.Equals(req.Visibility, "gm", StringComparison.OrdinalIgnoreCase) ? "gm" : "players";
        var loreId = string.IsNullOrWhiteSpace(req.LinkedLoreId) ? $"lore-{id}" : req.LinkedLoreId.Trim();
        var desc = string.IsNullOrWhiteSpace(req.Description) ? $"Charted region of {cleanName} in the campaign atlas." : req.Description.Trim();
        var gov = string.IsNullOrWhiteSpace(req.GovernanceAndRealm) ? "Realm governance, settlements, and trade routes recorded by the GM." : req.GovernanceAndRealm.Trim();
        var sub = string.IsNullOrWhiteSpace(req.Subtitle) ? "Charted Realm & Territory" : req.Subtitle.Trim();

        var dto = new WorldMapRegionOverlayDto(
            id, mapId, cleanName.ToUpperInvariant(),
            string.IsNullOrWhiteSpace(req.OverlayType) ? "region" : req.OverlayType.Trim(),
            req.FactionKey, string.IsNullOrWhiteSpace(req.ColorHex) ? "#d9b77a" : req.ColorHex.Trim(),
            labelX, labelY, svgPath, vis, sub, desc, gov, loreId, points);

        var idx = overlays.FindIndex(o => o.Id == id);
        if (idx >= 0) overlays[idx] = dto;
        else overlays.Add(dto);

        var loreList = WorldLoreCatalogStore.LoreByCampaign.TryGetValue(campaignId, out var lList)
            ? lList
            : (WorldLoreCatalogStore.LoreByCampaign[campaignId] = []);
        var loreContent = string.IsNullOrWhiteSpace(req.LoreContent) ? $"{desc}\n\n{gov}" : req.LoreContent.Trim();
        var loreEntry = new LoreEntryDto(
            loreId, $"{campaignId}:Region:{id}", campaignId, cleanName, sub, "Worlds & Regions",
            desc.Length > 160 ? desc[..157] + "..." : desc, loreContent, "/icrandor_world_dashboard.jpg",
            ["Regions", cleanName], [$"{campaignId}:Region:{id}"], [], vis, false, "Just now", "Just now", DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        var lIdx = loreList.FindIndex(l => l.Id == loreId);
        if (lIdx >= 0) loreList[lIdx] = loreEntry;
        else loreList.Insert(0, loreEntry);

        var locList = WorldLoreStateStore.LocationsByCampaign.TryGetValue(campaignId, out var locs)
            ? locs
            : (WorldLoreStateStore.LocationsByCampaign[campaignId] = []);
        var regionLoc = new LocationInspectorDetailDto(
            id, $"{campaignId}:Region:{id}", campaignId, cleanName, sub, "Region", null, "World Atlas",
            "/icrandor_world_dashboard.jpg", desc, "known", $"{labelY:F1}° N, {labelX:F1}° E", mapId, null, null, vis,
            [new("Region Scope", sub), new("Governance & Realm", gov)], desc, gov, "Regional lore synchronized with the World & Lore Library.",
            ["Regions", cleanName], [loreId], [], [], []);
        var locIdx = locList.FindIndex(l => l.LocationKey == id);
        if (locIdx >= 0) locList[locIdx] = regionLoc;
        else locList.Add(regionLoc);

        await SaveRelationshipAndProjectAsync(
            campaignId,
            new CreateStoryRelationshipRequest($"{campaignId}:Region:{id}", "DOCUMENTED_IN", $"{campaignId}:Lore:{loreId}", $"Regional Lore for {cleanName}", vis, null, false),
            repo, graph);
        return dto;
    }

    private static IReadOnlyList<StoryConnectedGroupDto> BuildConnectedGroupsForBeat(StoryBeatItemDto beat, bool isGm) =>
    [
        new("Quests (2)", "compass", "gold", [
            new("1:Quest:quest-missing-caravan", "The Missing Caravan", "Act I–II Investigation Thread", "/campaigns?beat=beat-1-1", "loc-ruined-chapel"),
            new("1:Quest:quest-chokrah-ledger", "Secrets Beneath the Chapel", "Crypt C3 & Chokrah Manifest", "/world-lore?tab=lore&loreId=lore-priors-rituals", "loc-ruined-chapel")
        ]),
        new("Locations (2)", "map-pin", "emerald", [
            new("1:Location:loc-ruined-chapel", "The Ruined Chapel", "Keyed Rooms C1–C3 · Whispering Woods", "/world-lore?location=loc-ruined-chapel", "loc-ruined-chapel"),
            new("1:Location:loc-veldra-wood", "Whispering Woods", "Ancient Fey-Bordered Canopy", "/world-lore?location=loc-veldra-wood", "loc-veldra-wood")
        ]),
        new("NPCs (2)", "users", "gold", [
            new("1:NPC:npc-malric", "Brother Malric", "Chapel Keeper · Currently in C1 (Was in C3)", "/campaigns?inspect=npc-malric", "loc-ruined-chapel"),
            new("1:NPC:npc-emrys", "Emrys Driothe", "Implicated by Chokrah Manifest & Priors Claim", "/campaigns?inspect=npc-emrys", "loc-cinth")
        ]),
        new("Factions (2)", "shield", "emerald", [
            new("1:Faction:fac-artificers", "Artificers Guild of Cinth", "Allied Brass & Skyship Collective", "/world-lore?tab=lore&loreId=lore-artificers-guild", "loc-artificers-skydock"),
            new("1:Faction:fac-priors", "The Order of Priors", isGm ? "GM Truth: Siphons student magic via Chokrah" : "Street-Schools of Ekkos (Implicated in C3)", "/world-lore?tab=lore&loreId=lore-priors-rituals", "loc-cinth")
        ])
    ];
}
