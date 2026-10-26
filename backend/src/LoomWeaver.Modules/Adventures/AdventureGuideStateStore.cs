using LoomWeaver.Domain;

namespace LoomWeaver.Modules.Adventures;

public static class AdventureGuideStateStore
{
    private static readonly object SyncLock = new();

    private static readonly Dictionary<string, string> NodeProgressStates = new(StringComparer.OrdinalIgnoreCase)
    {
        ["node-loc-ruined-chapel"] = "discovered",
        ["node-room-c1-nave"] = "completed",
        ["node-room-c2-courtyard"] = "unresolved",
        ["node-room-c3-crypt"] = "unresolved",
        ["node-loc-cinth-gala"] = "discovered",
        ["node-npc-malric"] = "discovered",
        ["node-npc-elowen"] = "discovered",
        ["node-npc-emrys"] = "discovered",
        ["node-enc-shadow-stalker"] = "unresolved",
        ["node-clue-crypt-tracks"] = "discovered",
        ["node-clue-chokrah-seal"] = "unresolved",
        ["node-haz-crypt-glyph"] = "unresolved",
        ["node-trs-star-arrow"] = "unresolved",
        ["node-rule-shadow-tether"] = "discovered",
    };

    private static readonly HashSet<string> SharedReadAloudAndSecretIds = new(StringComparer.OrdinalIgnoreCase)
    {
        "blk-c1-readaloud",
        "blk-c2-readaloud",
    };

    private static readonly HashSet<string> AwardedRewardKeys = new(StringComparer.OrdinalIgnoreCase);

    private static readonly List<AdventureSessionBeatItemDto> Session15Beats = new()
    {
        new("beat-1", "node-room-c1-nave", "Arrival at the ruined chapel", true, "completed", "Party entered C1 Shattered Nave out of the Whispering Woods mist.", "node-room-c1-nave"),
        new("beat-2", "node-npc-malric", "Speaking with Brother Malric", true, "completed", "Questioned Malric by the brazier; sensed his fear of the Priors.", "node-room-c1-nave"),
        new("beat-3", "node-clue-crypt-tracks", "Tracks leading to the crypt", false, "discovered", "Boot tracks and dragged satchel marks lead through C2 toward C3.", "node-room-c2-courtyard"),
        new("beat-4", "node-enc-shadow-stalker", "Ambush in the courtyard", false, "unresolved", "Shadow Stalkers wait atop the fallen bell tower in C2.", "node-room-c2-courtyard"),
        new("beat-5", "node-room-c3-crypt", "Discover what stirs beneath the chapel", false, "unresolved", "Unseal the C3 altar slab and inspect the Chokrah siphon lectern.", "node-room-c3-crypt"),
    };

    private static readonly List<AdventureGuideNpcItemDto> PopulatedNpcsAndHeroes = new()
    {
        new("node-npc-malric", "1:NPC:npc-emrys", "Brother Malric", "Chapel Keeper · Cautious", "Cautious", "gold", "BM", "#d9b77a", "/icrandor_world_dashboard.jpg",
            "Protect the street-children from Prior inquisitors without exposing his past.",
            "\"Do not lift the altar stone after dark. What scratches beneath the mountain has long fingers.\"",
            "Present in C1 · Linked to Session 15", "discovered", "/campaigns?inspect=npc-emrys", "players"),
        new("node-npc-elowen", "1:NPC:npc-kutler", "Sister Elowen", "Healer · Guarded", "Guarded", "emerald", "SE", "#49e892", "/six-engines-showcase.jpg",
            "Keep the wounded Vale scout alive until the party clears the courtyard.",
            "\"The shadows did not kill the scouts outright—they dragged them toward the crypt stairs.\"",
            "Present in C1 · Linked to Session 15", "discovered", "/campaigns?inspect=npc-kutler", "players"),
        new("node-npc-emrys", "1:NPC:npc-emrys", "Emrys Driothe", "Reformer of the Council of Magic", "Deceptive", "gold", "ED", "#d9b77a", "/the-weave-graph-engine.jpg",
            "Steer the party toward the bound dragon beneath the southern mountain.",
            "\"The reformed Council opens its doors to every gift.\"",
            "Linked via Prior Siphon Seal in C3", "optional", "/campaigns?inspect=npc-emrys", "players"),
        new("node-pc-dal", "1:PlayerCharacter:pc-dal", "Dal Riata", "Elf Ranger · Lineage of Edhellain", "Party Hero", "gold", "DR", "#d9b77a", "/characters-showcase.jpg",
            "Track the missing Vale scouts and read the elven stonework.",
            "\"Those fletchings on the broken arrow belong to the Vale vanguard.\"",
            "Party Roster · Active in Session 15", "discovered", "/characters?focus=pc-dal", "players"),
        new("node-pc-kildrid", "1:PlayerCharacter:pc-kildrid", "Kildrid", "Dwarven Cleric · Stone Sense Scholar", "Party Hero", "emerald", "KI", "#49e892", "/characters-showcase.jpg",
            "Decipher the containment runes beneath the chapel altar.",
            "\"The granite under this altar hums with the same agony we felt on the Cinth road.\"",
            "Party Roster · Stone Sense Link to C3", "discovered", "/characters?focus=pc-kildrid", "players"),
    };

    private static readonly Dictionary<string, AdventureAssignedBattlemapDto> AssignedMapsByScope = new(StringComparer.OrdinalIgnoreCase)
    {
        ["default"] = new(
            "scene-plains-red",
            "The Ruined Chapel & Whispering Woods Cloister",
            "session-15",
            "Session 15 — The Ruined Chapel",
            "node-loc-ruined-chapel",
            "The Ruined Chapel (C1–C3)",
            "CHAPEL",
            "/combat-caves.jpg",
            "/maps?scene=scene-plains-red",
            "/arcane-screen",
            new List<AdventureMapRegionChipDto>
            {
                new("mapreg-c1", "node-room-c1-nave", "C1", "C1: The Shattered Nave", "scene-plains-red", "/maps?scene=scene-plains-red", "players"),
                new("mapreg-c2", "node-room-c2-courtyard", "C2", "C2: Moonlit Courtyard", "scene-plains-red", "/maps?scene=scene-plains-red", "players"),
                new("mapreg-c3", "node-room-c3-crypt", "C3", "C3: Sealed Altar Crypt", "scene-mountain-prison", "/maps?scene=scene-mountain-prison", "gm"),
            })
    };

    private static readonly List<AdventurePlayEventDto> PlayEvents = new()
    {
        new("evt-1", "beat_checked", "GM", "Completed Beat: Speaking with Brother Malric in C1 Shattered Nave", "12m ago"),
        new("evt-2", "clue_discovered", "Kildrid", "Discovered Clue: Scratched Basalt & Dragged Satchel Tracks in C2", "28m ago"),
        new("evt-3", "map_assigned", "GM", "Assigned Battlemap 'The Ruined Chapel & Whispering Woods Cloister' to Session 15", "1h ago"),
    };

    public static ContextualAdventureGuideDto BuildGuide(
        int campaignId,
        bool isGm,
        string? scopeKind = null,
        string? scopeId = null,
        string? progressFilter = null)
    {
        lock (SyncLock)
        {
            var normScopeKind = NormalizeScopeKind(scopeKind, scopeId);
            var normScopeId = ResolveScopeId(normScopeKind, scopeId);
            var filter = string.IsNullOrWhiteSpace(progressFilter) ? "all" : progressFilter.Trim().ToLowerInvariant();

            var roomMeta = AdventureGuideSeedCatalog.GetRoomMetadata(normScopeId, isGm);
            var assignedMap = AssignedMapsByScope.TryGetValue(normScopeId, out var scopedMap)
                ? scopedMap
                : AssignedMapsByScope["default"];

            var visibleRegions = assignedMap.ClickableRegions
                .Where(r => isGm || r.Visibility != "gm" || SharedReadAloudAndSecretIds.Contains(r.RoomNodeId))
                .ToList();

            var allNpcs = PopulatedNpcsAndHeroes
                .Where(n => isGm || n.Visibility != "gm")
                .Select(n => n with { ProgressState = GetNodeState(n.NodeId, n.ProgressState) })
                .ToList();

            var filteredNpcs = filter == "all" ? allNpcs : allNpcs.Where(n => FilterMatches(n.ProgressState, filter)).ToList();
            var encounters = GetEncounters(isGm).Where(e => FilterMatches(e.ProgressState, filter)).ToList();
            var cluesAndHazards = GetCluesAndHazards(isGm).Where(c => FilterMatches(c.ProgressState, filter)).ToList();
            var treasures = GetTreasures().Where(t => FilterMatches(t.ProgressState, filter)).ToList();

            var secrets = isGm
                ? new List<string>
                {
                    "A sealed crypt (Room C3) lies beneath the displaced Ekkosian altar slab.",
                    "Brother Malric hides the fact that Prior inquisitors visited C3 three nights ago.",
                    "The C3 containment runes echo Vaelkorath's century-old prison beneath the southern mountain."
                }
                : SharedReadAloudAndSecretIds.Where(s => s.StartsWith("secret:")).Select(s => s["secret:".Length..]).ToList();

            return new ContextualAdventureGuideDto(
                CampaignId: campaignId,
                AdventureId: "adv-shadow-mountain",
                AdventureVersionId: "adv-ver-sotm-1-0",
                AdventureTitle: "Shadow of the Mountain",
                ActiveScopeKind: normScopeKind,
                ActiveScopeId: normScopeId,
                ActiveSessionId: normScopeId == "session-14" ? "session-14" : "session-15",
                ActiveSessionNumber: normScopeId == "session-14" ? 14 : 15,
                HeaderTitle: roomMeta.HeaderTitle,
                HeaderSubtitle: roomMeta.HeaderSubtitle,
                ArtworkUrl: assignedMap.ArtworkUrl,
                Epigraph: roomMeta.Epigraph,
                Summary: roomMeta.Summary,
                ImmediateSituation: roomMeta.ImmediateSituation,
                SensoryDescription: roomMeta.SensoryDescription,
                ActiveAreaKey: roomMeta.AreaKey,
                Breadcrumbs: BuildBreadcrumbs(normScopeKind, normScopeId, roomMeta.AreaKey),
                AvailableSessions: new List<AdventureScopeOptionDto>
                {
                    new("session-15", "session", "S15", "Session 15 — The Ruined Chapel", "Live Session · Whispering Woods", "node-chap-whispering"),
                    new("session-14", "session", "S14", "Session 14 — Brass Gears & Velvet Fangs", "Completed · City of Cinth", "node-chap-whispering"),
                },
                AvailableLocations: new List<AdventureScopeOptionDto>
                {
                    new("node-loc-ruined-chapel", "location", "CHAPEL", "The Ruined Chapel (Site)", "Whispering Woods Sanctuary · 3 Keyed Rooms", "node-chap-whispering"),
                    new("node-loc-cinth-gala", "location", "CINTH", "City of Cinth & Gala Rotunda", "Plains of Vistagh Metropolis", "node-chap-whispering"),
                },
                AvailableRooms: new List<AdventureScopeOptionDto>
                {
                    new("node-room-c1-nave", "room", "C1", "C1: The Shattered Nave", "Entry Hall & Brother Malric's Vigil", "node-loc-ruined-chapel"),
                    new("node-room-c2-courtyard", "room", "C2", "C2: Moonlit Cloister Courtyard", "Fallen Bell Tower & Shadow Stalker Ambush", "node-loc-ruined-chapel"),
                    new("node-room-c3-crypt", "room", "C3", "C3: Sealed Altar Crypt", "Subterranean Resonance Ossuary", "node-loc-ruined-chapel"),
                },
                ReadAloudBlocks: GetReadAloudBlocks(normScopeId, isGm),
                Exits: AdventureGuideSeedCatalog.GetRoomExits(normScopeId, isGm),
                SkillChecks: GetSkillChecks(normScopeId, isGm),
                AssignedBattlemap: assignedMap with { ClickableRegions = visibleRegions },
                Beats: Session15Beats.ToList(),
                KeyNpcs: filteredNpcs,
                Encounters: encounters,
                CluesAndHazards: cluesAndHazards,
                TreasuresAndRewards: treasures,
                Secrets: secrets,
                NotesTabItems: cluesAndHazards.Concat(treasures).ToList(),
                NpcsTabItems: allNpcs,
                PlacesTabItems: AdventureGuideSeedCatalog.GetPlacesTabItems(isGm, assignedMap, GetNodeState, SharedReadAloudAndSecretIds),
                LoreTabItems: AdventureGuideSeedCatalog.GetLoreTabItems(isGm),
                RecentPlayEvents: PlayEvents.Take(6).ToList()
            );
        }
    }

    public static void ToggleBeat(string beatId)
    {
        lock (SyncLock)
        {
            var idx = Session15Beats.FindIndex(b => b.Id == beatId);
            if (idx < 0) return;
            var cur = Session15Beats[idx];
            var nextDone = !cur.Done;
            Session15Beats[idx] = cur with { Done = nextDone, ProgressState = nextDone ? "completed" : "unresolved" };
            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "beat_checked",
                "GM",
                $"{(nextDone ? "Completed" : "Reopened")} Session Beat: {cur.Label} (Location secrets remain isolated)",
                "Just now"));
        }
    }

    public static void UpdateNodeState(string nodeId, string progressState, string? outcomeNotes)
    {
        lock (SyncLock)
        {
            var clean = string.IsNullOrWhiteSpace(progressState) ? "discovered" : progressState.Trim().ToLowerInvariant();
            NodeProgressStates[nodeId] = clean;
            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "state_updated",
                "GM",
                $"Marked '{nodeId}' as {clean.ToUpperInvariant()}" + (string.IsNullOrWhiteSpace(outcomeNotes) ? "" : $" — {outcomeNotes}"),
                "Just now"));
        }
    }

    public static void GrantKnowledge(GrantAdventureKnowledgeRequest req)
    {
        lock (SyncLock)
        {
            SharedReadAloudAndSecretIds.Add(req.TargetId);
            NodeProgressStates[req.TargetId] = "discovered";
            var recipient = string.IsNullOrWhiteSpace(req.CharacterKey) ? "All Party" : req.CharacterKey;
            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "knowledge_granted",
                "GM",
                $"Revealed '{req.TargetTitle}' to {recipient}",
                "Just now"));
        }
    }

    public static (bool NewlyAwarded, int XpAwarded, string Message) AwardReward(AwardAdventureRewardRequest req)
    {
        lock (SyncLock)
        {
            var key = string.IsNullOrWhiteSpace(req.IdempotencyKey) ? $"reward-{req.NodeId}" : req.IdempotencyKey;
            if (!AwardedRewardKeys.Add(key))
            {
                return (false, 0, $"Reward '{req.CurrencyOrItemLabel}' was already awarded (idempotent ledger verified).");
            }
            NodeProgressStates[req.NodeId] = "completed";
            var msg = $"Awarded +{req.XpAmount} XP & {req.CurrencyOrItemLabel} to the party.";
            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "reward_awarded",
                "GM",
                msg,
                "Just now"));
            return (true, req.XpAmount, msg);
        }
    }

    public static AdventureGuideNpcItemDto RegisterCharacterOrNpc(
        int campaignId,
        string nodeId,
        string compositeKey,
        string name,
        string role,
        string disposition,
        string dispositionTone,
        string artworkUrl,
        string motive,
        string dialogue,
        string whyIncluded,
        string routeLink,
        string visibility)
    {
        lock (SyncLock)
        {
            var parts = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            var initials = parts.Length >= 2
                ? $"{char.ToUpperInvariant(parts[0][0])}{char.ToUpperInvariant(parts[1][0])}"
                : name.Length >= 2 ? name[..2].ToUpperInvariant() : "NP";

            var item = new AdventureGuideNpcItemDto(
                nodeId,
                compositeKey,
                name,
                role,
                disposition,
                dispositionTone,
                initials,
                dispositionTone == "crimson" ? "#e25c5c" : dispositionTone == "emerald" ? "#49e892" : "#d9b77a",
                string.IsNullOrWhiteSpace(artworkUrl) ? "/icrandor_world_dashboard.jpg" : artworkUrl,
                motive,
                dialogue,
                whyIncluded,
                "discovered",
                routeLink,
                visibility);

            PopulatedNpcsAndHeroes.RemoveAll(n => n.NodeId == nodeId || n.CompositeKey == compositeKey);
            PopulatedNpcsAndHeroes.Insert(0, item);
            NodeProgressStates[nodeId] = "discovered";
            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "npc_populated",
                "Studio",
                $"Populated '{name}' ({role}) into the Session & Location Guide",
                "Just now"));
            return item;
        }
    }

    public static AdventureAssignedBattlemapDto AssignBattlemap(AssignBattlemapToAdventureRequest req)
    {
        lock (SyncLock)
        {
            var locNodeId = string.IsNullOrWhiteSpace(req.LocationNodeId) ? "node-loc-ruined-chapel" : req.LocationNodeId;
            var sesId = string.IsNullOrWhiteSpace(req.SessionId) ? "session-15" : req.SessionId;
            var art = string.IsNullOrWhiteSpace(req.ArtworkUrl) ? "/tactical-combat-engine.jpg" : req.ArtworkUrl;
            var defaultMap = AssignedMapsByScope["default"];

            var updated = defaultMap with
            {
                SceneKey = req.SceneKey,
                Title = string.IsNullOrWhiteSpace(req.SceneTitle) ? req.SceneKey : req.SceneTitle,
                SessionId = sesId,
                SessionTitle = sesId == "session-14" ? "Session 14 — Brass Gears & Velvet Fangs" : "Session 15 — The Ruined Chapel",
                LocationNodeId = locNodeId,
                LocationTitle = ResolveLocationTitle(locNodeId),
                AreaKey = ResolveAreaKey(locNodeId),
                ArtworkUrl = art,
                RouteLink = $"/maps?scene={req.SceneKey}",
                VttRouteLink = $"/arcane-screen?scene={req.SceneKey}"
            };

            AssignedMapsByScope["default"] = updated;
            AssignedMapsByScope[sesId] = updated;
            AssignedMapsByScope[locNodeId] = updated;

            PlayEvents.Insert(0, new AdventurePlayEventDto(
                $"evt-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                "map_assigned",
                "LoomMaps",
                $"Assigned Battlemap '{updated.Title}' to {updated.SessionTitle} · {updated.LocationTitle}",
                "Just now"));

            return updated;
        }
    }

    private static string GetNodeState(string nodeId, string fallback) =>
        NodeProgressStates.TryGetValue(nodeId, out var st) ? st : fallback;

    private static bool FilterMatches(string state, string filter) =>
        filter == "all" || string.Equals(state, filter, StringComparison.OrdinalIgnoreCase);

    private static string NormalizeScopeKind(string? scopeKind, string? scopeId)
    {
        if (!string.IsNullOrWhiteSpace(scopeKind)) return scopeKind.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(scopeId))
        {
            if (scopeId.StartsWith("node-room-", StringComparison.OrdinalIgnoreCase)) return "room";
            if (scopeId.StartsWith("node-loc-", StringComparison.OrdinalIgnoreCase)) return "location";
            if (scopeId.StartsWith("adv-", StringComparison.OrdinalIgnoreCase)) return "adventure";
        }
        return "session";
    }

    private static string ResolveScopeId(string scopeKind, string? scopeId) =>
        !string.IsNullOrWhiteSpace(scopeId) ? scopeId.Trim() : scopeKind switch
        {
            "room" => "node-room-c1-nave",
            "location" => "node-loc-ruined-chapel",
            "adventure" => "adv-shadow-mountain",
            _ => "session-15"
        };

    private static string ResolveLocationTitle(string nodeId) => nodeId switch
    {
        "node-room-c1-nave" => "C1: The Shattered Nave",
        "node-room-c2-courtyard" => "C2: Moonlit Cloister Courtyard",
        "node-room-c3-crypt" => "C3: Sealed Altar Crypt",
        "node-loc-cinth-gala" => "City of Cinth & Grand Masquerade",
        _ => "The Ruined Chapel (C1–C3)"
    };

    private static string ResolveAreaKey(string nodeId) => nodeId switch
    {
        "node-room-c1-nave" => "C1",
        "node-room-c2-courtyard" => "C2",
        "node-room-c3-crypt" => "C3",
        "node-loc-cinth-gala" => "CINTH",
        _ => "CHAPEL"
    };

    private static IReadOnlyList<AdventureBreadcrumbDto> BuildBreadcrumbs(string scopeKind, string scopeId, string? areaKey)
    {
        var list = new List<AdventureBreadcrumbDto>
        {
            new("adv-shadow-mountain", "adventure", "Shadow of the Mountain", "ADV"),
            new("session-15", "session", "Session 15", "S15"),
            new("node-loc-ruined-chapel", "location", "Ruined Chapel", "CHAPEL"),
        };
        if (scopeKind == "room" || scopeId.StartsWith("node-room-", StringComparison.OrdinalIgnoreCase))
        {
            list.Add(new(scopeId, "room", ResolveLocationTitle(scopeId), areaKey));
        }
        return list;
    }

    private static IReadOnlyList<AdventureReadAloudBlockDto> GetReadAloudBlocks(string scopeId, bool isGm)
    {
        var all = new List<AdventureReadAloudBlockDto>
        {
            new("blk-c1-readaloud", "node-room-c1-nave", "C1 Read-Aloud · Entering the Shattered Nave",
                "Old stones remember. Rain needles through the ribs of the collapsed roof, hissing against a single brass brazier before the cracked mosaic of Ekkos. An elderly friar in rain-darkened wool lifts a shuttered lantern: \"If you seek the scouts from the Vale road, lower your steel. The stone beneath this floor has been listening since sundown.\"",
                "players", true, SharedReadAloudAndSecretIds.Contains("blk-c1-readaloud")),
            new("blk-c2-readaloud", "node-room-c2-courtyard", "C2 Read-Aloud · The Moonlit Cloister Yard",
                "The fallen bronze bell lies half-sunk in black brambles at the center of the courtyard. Between the leaning arches, the mist pools around three elongated silhouettes crouched above a torn leather messenger satchel.",
                "players", true, SharedReadAloudAndSecretIds.Contains("blk-c2-readaloud")),
            new("blk-c3-readaloud", "node-room-c3-crypt", "C3 Read-Aloud · Unsealing the Altar Crypt",
                "The basalt steps spiral down into air colder than winter river-water. Blue containment runes—carved by the same hand that bound the southern mountain—throb along a vaulted ossuary. On a stone lectern rests a brass siphon vial still warm to the touch.",
                "gm", true, SharedReadAloudAndSecretIds.Contains("blk-c3-readaloud")),
        };

        var visible = all.Where(b => isGm || b.Audience != "gm" || b.SharedWithPlayers).ToList();
        if (scopeId.StartsWith("node-room-", StringComparison.OrdinalIgnoreCase))
        {
            var roomMatches = visible.Where(b => b.NodeId == scopeId).ToList();
            if (roomMatches.Count > 0) return roomMatches;
        }
        return visible;
    }

    private static IReadOnlyList<AdventureSkillCheckDto> GetSkillChecks(string scopeId, bool isGm)
    {
        var list = new List<AdventureSkillCheckDto>
        {
            new("blk-c1-check-malric", "node-room-c1-nave", "Questioning Brother Malric", "Insight / Persuasion", 14,
                "Malric admits three Prior inspectors descended into C3 three nights ago with Lost Isles Chokrah crates.",
                "Malric blames forest wolves, though his eyes dart toward the chipped altar mortar.",
                GetNodeState("blk-c1-check-malric", "completed")),
            new("blk-c2-check-tracks", "node-room-c2-courtyard", "Tracing the Dragged Scout Satchel", "Survival / Stonecunning", 13,
                "You spot Chokrah dust leading into C3 and detect the Shadow Stalkers perched on the fallen bell tower.",
                "You follow the tracks to the courtyard center and trigger the Shadow Stalkers' surprise leap.",
                GetNodeState("blk-c2-check-tracks", "discovered")),
            new("blk-c3-check-ward", "node-room-c3-crypt", "Disarming the Anelith Feedback Ward", "Arcana / Thieves' Tools", 15,
                "You ground the runic charge into the bedrock and recover the Chokrah Manifest and Star-Etched Quiver intact.",
                "An arc of emerald-crimson static lashes 15 ft across the stairs (3d8 damage).",
                GetNodeState("blk-c3-check-ward", "unresolved")),
        };
        if (scopeId.StartsWith("node-room-", StringComparison.OrdinalIgnoreCase))
        {
            var scoped = list.Where(c => c.NodeId == scopeId).ToList();
            if (scoped.Count > 0) return scoped;
        }
        return isGm ? list : list.Where(c => c.ResolutionState != "unresolved" || c.NodeId != "node-room-c3-crypt").ToList();
    }

    private static IReadOnlyList<AdventureGuideEncounterItemDto> GetEncounters(bool isGm) =>
        new List<AdventureGuideEncounterItemDto>
        {
            new("node-enc-shadow-stalker", "1:Encounter:enc-cinth-ballroom", "Shadow Stalker Pack in the Courtyard",
                "Hard Encounter · 3 Shadow Stalkers & 1 Corrupt Prior Hound", "Hard", 1800,
                "Crossing the C2 courtyard midline or disturbing the fallen bronze bell.",
                "Collapsed bell tower (+2 AC half-cover), bramble patches (difficult terrain).",
                "Shadow Stalkers shadow-step between dim cloister pillars to flank casters; retreat toward C3 if reduced below 15 HP.",
                "scene-plains-red", "Triggered in C2 · Linked to Session 15",
                GetNodeState("node-enc-shadow-stalker", "unresolved"),
                "/encounters?focus=enc-cinth-ballroom", "/arcane-screen", "players"),
            new("node-enc-mountain-caves", "1:Encounter:enc-mountain-caves", "Echo of the Bound Dragon's Runes",
                "Deadly Boss Foreshadow · Southern Mountain Cavern", "Deadly", 4500,
                "Unsealing the C3 resonance plinth while carrying the Luminaries.",
                "Subterranean runic ossuary with pulsing containment pillars.",
                "Reveals the life-tether binding Vaelkorath to Emrys Driothe.",
                "scene-mountain-prison", "Foreshadowed in C3 Crypt",
                GetNodeState("node-enc-mountain-caves", "optional"),
                "/encounters?focus=enc-mountain-caves", "/arcane-screen", "gm")
        }.Where(e => isGm || e.Visibility != "gm").ToList();

    private static IReadOnlyList<AdventureGuideElementItemDto> GetCluesAndHazards(bool isGm) =>
        new List<AdventureGuideElementItemDto>
        {
            new("node-clue-crypt-tracks", "1:Clue:clue-kildrid-tremor", "clue", "C2",
                "Scratched Basalt & Dragged Satchel Tracks", "Discovered Clue · Survival / Stonecunning DC 13",
                "Boot prints mixed with clawed drag marks lead from the broken cloister wall directly to the mortared seam under the altar.",
                "/combat-caves.jpg", "Present in C2 · Links C2 to C3",
                GetNodeState("node-clue-crypt-tracks", "discovered"), "/loom?query=mountain+stone+sense", "players"),
            new("node-clue-chokrah-seal", "1:Clue:clue-chokrah-manifest", "clue", "C3",
                "Signed Chokrah Siphon Manifest & Prior Seal", "Crypt Evidence · Investigation DC 15",
                "Wax-sealed cargo ledger in C3 proving Chokrah shipments from the Lost Isles feed the Priors' magic-extraction crucible.",
                "/the-weave-graph-engine.jpg", "Present in C3 · Links Chapel to Cinth Priors",
                GetNodeState("node-clue-chokrah-seal", "unresolved"), "/weave?node=clue-chokrah-manifest",
                SharedReadAloudAndSecretIds.Contains("node-clue-chokrah-seal") ? "players" : "gm"),
            new("node-haz-crypt-glyph", "1:Clue:clue-kildrid-tremor", "hazard", "C3",
                "Anelith Feedback Ward on the Crypt Seal", "Magical Trap · Detect DC 14 / Disarm DC 15",
                "Lifting the C3 altar slab without grounding the copper shunt releases a 15-ft pulse of necrotic-radiant static (3d8 damage).",
                "/tactical-combat-engine.jpg", "Present in C3 · Wards Altar Slab",
                GetNodeState("node-haz-crypt-glyph", "unresolved"), "/encounters", "gm"),
        }.Where(i => isGm || i.Visibility != "gm").ToList();

    private static IReadOnlyList<AdventureGuideElementItemDto> GetTreasures() =>
        new List<AdventureGuideElementItemDto>
        {
            new("node-trs-star-arrow", "1:Artifact:art-luminary-well", "treasure", "C3",
                "Star-Etched Edhellain Quiver & 450 gp", "Crypt Reliquary Cache · Room C3",
                "A silver-chased quiver bearing the royal crest of Edhellain and a pouch of pre-war gold crowns hidden behind the ossuary lectern.",
                "/dice-physics-engine.jpg", "Present in C3 · Reliquary Reward",
                GetNodeState("node-trs-star-arrow", "unresolved"), "/assets?inspect=art-luminary-well", "players",
                XpReward: 1200, CurrencyOrItemLabel: "450 gp + Star-Etched Quiver",
                RewardAwarded: AwardedRewardKeys.Contains("reward-c3-star-arrow")),
        };
}
