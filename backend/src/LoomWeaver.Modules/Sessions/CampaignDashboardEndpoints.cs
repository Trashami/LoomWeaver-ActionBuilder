using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Sessions;

public sealed record DashboardPrepItemDto(
    string Id,
    string Label,
    bool Completed,
    string RouteLink,
    bool GmOnly);

public sealed record DashboardUpcomingSessionDto(
    string SessionId,
    int SessionNumber,
    string Title,
    string ArtworkUrl,
    string ScheduledDateLabel,
    string ScheduledTimeLabel,
    string LocationTitle,
    string LocationRegion,
    string PrepStatusLabel,
    int CompletedPrepCount,
    int TotalPrepCount,
    IReadOnlyList<DashboardPrepItemDto> Checklist);

public sealed record DashboardActivityItemDto(
    string Id,
    string Title,
    string EntityType,
    string Description,
    string RelativeTime,
    string RouteLink,
    string CompositeKey,
    string Visibility);

public sealed record DashboardNoteItemDto(
    string Id,
    string Title,
    string Excerpt,
    string RelativeTime,
    string RouteLink,
    string CompositeKey,
    string Visibility);

public sealed record DashboardQuestThreadDto(
    string Id,
    string Title,
    string Summary,
    string CategoryBadge,
    string BadgeTone,
    string RouteLink,
    string CompositeKey,
    string Visibility);

public sealed record DashboardPartyMemberDto(
    string Id,
    string CompositeKey,
    string Name,
    string ClassAndAncestry,
    int HpCurrent,
    int HpMax,
    string ResourceLabel,
    int Ac,
    bool Online,
    string AvatarInitials,
    string RingColor,
    bool LevelUpEligible,
    string RouteLink);

public sealed record DashboardAlertItemDto(
    string Id,
    string Title,
    string Description,
    string Category,
    string Tone,
    string RouteLink,
    bool Read,
    bool GmOnly);

public sealed record DashboardSessionBeatDto(
    string Id,
    string Label,
    bool Done);

public sealed record DashboardGuideNpcDto(
    string CompositeKey,
    string Name,
    string Role,
    string DispositionLabel,
    string DispositionTone,
    string Initials,
    string RingColor);

public sealed record DashboardSessionGuideDto(
    string HeaderTitle,
    string ArtworkUrl,
    string Epigraph,
    string Summary,
    IReadOnlyList<DashboardSessionBeatDto> Beats,
    IReadOnlyList<DashboardGuideNpcDto> KeyNpcs,
    IReadOnlyList<string> Secrets);

public sealed record CampaignDashboardResponseDto(
    int CampaignId,
    string CampaignName,
    string SessionState,
    string ActTitle,
    string ActSubtitle,
    string SessionBadgeLabel,
    string SessionBadgeSubtitle,
    string LastActivityLabel,
    string NarrativeSummary,
    string HeroArtworkUrl,
    DashboardUpcomingSessionDto UpcomingSession,
    IReadOnlyList<DashboardActivityItemDto> RecentActivity,
    IReadOnlyList<DashboardNoteItemDto> RecentNotes,
    IReadOnlyList<DashboardQuestThreadDto> ActiveQuests,
    IReadOnlyList<DashboardPartyMemberDto> PartyMembers,
    string PartyHealthTitle,
    string PartyHealthSubtitle,
    IReadOnlyList<DashboardAlertItemDto> Alerts,
    DashboardSessionGuideDto SessionGuide);

public static class CampaignDashboardEndpoints
{
    private static readonly Dictionary<int, List<DashboardPrepItemDto>> PrepByCampaign = new()
    {
        [1] = new List<DashboardPrepItemDto>
        {
            new("prep-1", "Review encounter: Shadow Stalker", true, "/encounters", true),
            new("prep-2", "Prep Brother Malric dialogue", true, "/campaigns", true),
            new("prep-3", "Finalize map and lighting", false, "/maps", true),
            new("prep-4", "Prepare handouts and clues", false, "/assets", false),
            new("prep-5", "Review treasure and rewards", false, "/campaigns", true),
        },
        [2] = new List<DashboardPrepItemDto>
        {
            new("prep-2-1", "Calibrate Clockwork Vault hazard DCs", true, "/encounters", true),
            new("prep-2-2", "Stage Absalom Grand Bazaar map tokens", true, "/maps", false),
            new("prep-2-3", "Prepare Starstone resonance handout", true, "/assets", false),
            new("prep-2-4", "Review High Clockmaster dialogue tree", false, "/campaigns", true),
        },
        [3] = new List<DashboardPrepItemDto>
        {
            new("prep-3-1", "Audit Elysium Boon Ledger", true, "/campaigns", true),
            new("prep-3-2", "Set Conservatory ambient lighting", false, "/maps", false),
            new("prep-3-3", "Review Prince Harbor blood-hunt edict", false, "/loom", true),
        }
    };

    private static readonly Dictionary<int, List<DashboardSessionBeatDto>> BeatsByCampaign = new()
    {
        [1] = new List<DashboardSessionBeatDto>
        {
            new("beat-1", "Arrival at the ruined chapel", true),
            new("beat-2", "Speaking with Brother Malric", true),
            new("beat-3", "Tracks leading to the crypt", false),
            new("beat-4", "Ambush in the courtyard", false),
            new("beat-5", "Discover what stirs beneath the chapel", false),
        },
        [2] = new List<DashboardSessionBeatDto>
        {
            new("beat-2-1", "Enter the Clockwork Vaults beneath Absalom", true),
            new("beat-2-2", "Bypass the brass pendulum ward", false),
            new("beat-2-3", "Confront the Vault Automaton Warden", false),
        },
        [3] = new List<DashboardSessionBeatDto>
        {
            new("beat-3-1", "Present credentials to the Keeper of Elysium", true),
            new("beat-3-2", "Question Lady Vance in the Conservatory", false),
            new("beat-3-3", "Prevent the Masquerade breach at Harbor Pier", false),
        }
    };

    private static readonly Dictionary<int, List<DashboardAlertItemDto>> AlertsByCampaign = new()
    {
        [1] = new List<DashboardAlertItemDto>
        {
            new("alert-1", "Level Up Available", "Seraphine can advance to level 5", "level-up", "gold", "/characters", false, false),
            new("alert-2", "1 Pending Invite", "Marcus has been invited to the campaign", "invite", "emerald", "/campaigns", false, true),
            new("alert-3", "Unresolved Reminder", "Determine the source of the shadow magic", "reminder", "amber", "/loom", false, true),
            new("alert-4", "Asset Import Complete", "3 new map assets added to your library", "asset", "emerald", "/assets", false, false),
        },
        [2] = new List<DashboardAlertItemDto>
        {
            new("alert-2-1", "Feat Selection Pending", "2 Pathfinder characters have unspent skill feats", "level-up", "gold", "/characters", false, false),
            new("alert-2-2", "Vault Map Synced", "Clockwork Vault 2.5D lighting baked", "asset", "emerald", "/maps", false, false),
        },
        [3] = new List<DashboardAlertItemDto>
        {
            new("alert-3-1", "Hunger Warning", "2 coterie members are at Hunger 4", "reminder", "amber", "/characters", false, false),
            new("alert-3-2", "Boon Ledger Updated", "Harpy recorded a major boon in Elysium", "invite", "gold", "/campaigns", false, true),
        }
    };

    public static RouteGroupBuilder MapCampaignDashboardEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/campaigns/{campaignId:int}/dashboard", (int campaignId, string? role) =>
        {
            var isGm = string.Equals(role, "gm", StringComparison.OrdinalIgnoreCase);
            return Results.Ok(BuildDashboardResponse(campaignId, isGm));
        });

        api.MapPost("/campaigns/{campaignId:int}/dashboard/prep/{itemId}/toggle", (int campaignId, string itemId, string? role) =>
        {
            var isGm = string.Equals(role, "gm", StringComparison.OrdinalIgnoreCase);
            if (!PrepByCampaign.TryGetValue(campaignId, out var list))
            {
                list = PrepByCampaign[1];
            }

            var idx = list.FindIndex(i => i.Id == itemId);
            if (idx >= 0)
            {
                var cur = list[idx];
                list[idx] = cur with { Completed = !cur.Completed };
            }

            return Results.Ok(BuildDashboardResponse(campaignId, isGm));
        });

        api.MapPost("/campaigns/{campaignId:int}/dashboard/beats/{beatId}/toggle", (int campaignId, string beatId, string? role) =>
        {
            var isGm = string.Equals(role, "gm", StringComparison.OrdinalIgnoreCase);
            if (!BeatsByCampaign.TryGetValue(campaignId, out var list))
            {
                list = BeatsByCampaign[1];
            }

            var idx = list.FindIndex(b => b.Id == beatId);
            if (idx >= 0)
            {
                var cur = list[idx];
                list[idx] = cur with { Done = !cur.Done };
            }

            return Results.Ok(BuildDashboardResponse(campaignId, isGm));
        });

        api.MapPost("/campaigns/{campaignId:int}/dashboard/alerts/{alertId}/acknowledge", (int campaignId, string alertId, string? role) =>
        {
            var isGm = string.Equals(role, "gm", StringComparison.OrdinalIgnoreCase);
            if (!AlertsByCampaign.TryGetValue(campaignId, out var list))
            {
                list = AlertsByCampaign[1];
            }

            var idx = list.FindIndex(a => a.Id == alertId);
            if (idx >= 0)
            {
                var cur = list[idx];
                list[idx] = cur with { Read = true };
            }

            return Results.Ok(BuildDashboardResponse(campaignId, isGm));
        });

        return api;
    }

    private static CampaignDashboardResponseDto BuildDashboardResponse(int campaignId, bool isGm)
    {
        var cid = PrepByCampaign.ContainsKey(campaignId) ? campaignId : 1;
        var rawPrep = PrepByCampaign[cid];
        var visiblePrep = rawPrep.Where(p => isGm || !p.GmOnly).ToList();
        var completedPrep = rawPrep.Count(p => p.Completed);
        var totalPrep = rawPrep.Count;
        var beats = BeatsByCampaign[cid];
        var alerts = AlertsByCampaign[cid].Where(a => isGm || !a.GmOnly).ToList();

        if (cid == 2)
        {
            return new CampaignDashboardResponseDto(
                2,
                "Echoes of the Starstone",
                "planned",
                "ACT I",
                "Siege of the Spire",
                "Session 6",
                "The Clockwork Vaults",
                "Today at 6:15 PM",
                "Beneath the Grand Bazaar of Absalom, ancient brass gears grind awake. The party stands before the Starstone Vault seal as the High Clockmaster's constructs patrol the lower catwalks.",
                "/landing-assets/features/feature-3-maps-scenes.jpg",
                new DashboardUpcomingSessionDto(
                    "session-2-6",
                    6,
                    "Session 6 — The Clockwork Vaults",
                    "/landing-assets/features/feature-3-maps-scenes.jpg",
                    "Sunday, May 18, 2025",
                    "6:00 PM – 10:00 PM (4h)",
                    "Subterranean Vaults",
                    "Absalom Grand Bazaar",
                    completedPrep == totalPrep ? "Ready" : "Prep In Progress",
                    completedPrep,
                    totalPrep,
                    visiblePrep),
                new List<DashboardActivityItemDto>
                {
                    new("act-2-1", "High Clockmaster (NPC) updated", "NPC", "Adjusted construct command aura", "1h ago", "/campaigns", "1:NPC:npc-kutler", "players"),
                    new("act-2-2", "Clockwork Vaults (Map Scene)", "Map Scene", "Added dynamic gear hazards and catwalks", "3h ago", "/maps", "1:Location:loc-cinth", "players"),
                },
                new List<DashboardNoteItemDto>
                {
                    new("note-2-1", "Starstone Resonance Log", "Harmonic frequency matches the Ascendant Court spire.", "2h ago", "/loom", "1:Clue:clue-kildrid-tremor", "players"),
                },
                new List<DashboardQuestThreadDto>
                {
                    new("quest-2-1", "Siege of the Spire", "Unlock the lower Starstone vault", "Main Story", "gold", "/campaigns", "1:Quest:quest-cinth-gala", "players"),
                    new("quest-2-2", "Gears of the Bazaar", "Recover the missing guild ledger", "In Progress", "emerald", "/campaigns", "1:Quest:quest-chokrah-ledger", "players"),
                },
                new List<DashboardPartyMemberDto>
                {
                    new("pm-2-1", "1:PlayerCharacter:pc-dal", "Valeros", "Human Fighter", 54, 58, "HP 54/58", 21, true, "VA", "#d9b77a", false, "/characters"),
                    new("pm-2-2", "1:PlayerCharacter:pc-fivi", "Ezren", "Human Wizard", 38, 38, "HP 38/38", 17, true, "EZ", "#49e892", true, "/characters"),
                },
                "All party members are healthy",
                "Three-action economy ready · No persistent conditions.",
                alerts,
                new DashboardSessionGuideDto(
                    "SESSION 6 — THE CLOCKWORK VAULTS",
                    "/landing-assets/features/feature-3-maps-scenes.jpg",
                    "\"Every gear in Absalom turns toward the Starstone.\"",
                    "The party descends beneath the Grand Bazaar into the sealed clockwork vaults.",
                    beats,
                    new List<DashboardGuideNpcDto>
                    {
                        new("1:NPC:npc-kutler", "High Clockmaster", "Vault Warden · Guarded", "Guarded", "emerald", "HC", "#d9b77a"),
                    },
                    isGm
                        ? new[] { "The Vault Warden is bound to the Starstone conduit.", "A hidden bypass rune lies behind the third pendulum." }
                        : Array.Empty<string>()));
        }

        var allActivity = new List<DashboardActivityItemDto>
        {
            new("act-1", "Brother Malric (NPC) updated", "NPC", "Added new dialogue and motivations", "2h ago", "/campaigns", "1:NPC:npc-emrys", "players"),
            new("act-2", "The Ruined Chapel (Map Scene)", "Map Scene", "Added lighting and new areas", "4h ago", "/maps", "1:Location:loc-cinth", "players"),
            new("act-3", "Shadow Stalker (Encounter)", "Encounter", "Adjusted HP and added lair actions", "6h ago", "/encounters", "1:Encounter:enc-cinth-ballroom", "gm"),
            new("act-4", "Whispers in the Woods (Note)", "Note", "New clue about the forged blade", "8h ago", "/loom", "1:Clue:clue-kildrid-tremor", "players"),
            new("act-5", "Seraphine (Character)", "Character", "Updated spells and equipment", "1d ago", "/characters", "1:PlayerCharacter:pc-kycius", "players"),
        };

        var allNotes = new List<DashboardNoteItemDto>
        {
            new("note-1", "Carvings Beneath the Chapel", "Strange symbols match those from the mountain tomb. They speak of a...", "3h ago", "/loom", "1:Clue:clue-kildrid-tremor", "players"),
            new("note-2", "Brother Malric's Warning", "He believes the shadows are not just undead, but something older...", "1d ago", "/loom", "1:NPC:npc-emrys", "players"),
            new("note-3", "The Star-Etched Arrow", "Found on a fallen scout. The fletching bears the mark of the Vale.", "2d ago", "/assets", "1:PlayerCharacter:pc-dal", "players"),
            new("note-4", "Whispering Woods Rumors", "Locals speak of lights in the trees and voices at night.", "3d ago", "/loom", "1:Location:loc-plains-red", "players"),
            new("note-5", "A Debt of Iron", "The dwarven smith in Varik expects payment soon. Time is short.", "4d ago", "/campaigns", "1:Faction:fac-artificers", "players"),
            new("note-gm-secret", "Emrys Life-Bond Rune Transcript", "GM Secret: Vaelkorath bound his life force directly to Emrys.", "5d ago", "/weave", "1:Secret:sec-emrys-trap", "gm"),
        };

        var allQuests = new List<DashboardQuestThreadDto>
        {
            new("quest-shadows-stone", "Shadows in the Stone", "Investigate the ruined chapel", "Main Story", "gold", "/campaigns", "1:Quest:quest-cinth-gala", "players"),
            new("quest-missing-caravan", "The Missing Caravan", "Search the old road for survivors", "In Progress", "emerald", "/campaigns", "1:Quest:quest-chokrah-ledger", "players"),
            new("quest-whispers-woods", "Whispers in the Woods", "Speak to the hermit of Elderwood", "In Progress", "emerald", "/campaigns", "1:Clue:clue-kildrid-tremor", "players"),
            new("quest-debt-iron", "A Debt of Iron", "Deliver the forged blade to Varik", "In Progress", "emerald", "/campaigns", "1:Faction:fac-artificers", "players"),
            new("quest-lost-expedition", "The Lost Expedition", "Discover what happened to the Vale scouts", "Side Quest", "gold", "/campaigns", "1:Location:loc-plains-red", "players"),
            new("quest-gm-priors", "The Priors Chokrah Siphon", "Hidden GM thread tracking stolen student magic", "GM Secret", "gm", "/weave", "1:Faction:fac-priors", "gm"),
        };

        return new CampaignDashboardResponseDto(
            1,
            "Shadow of the Mountain",
            "live",
            "ACT I",
            "Shadows in the Stone",
            "Session 15",
            "The Ruined Chapel",
            "Today at 7:42 PM",
            "The party has followed the trail into the Whispering Woods, where an ancient, half-buried chapel holds secrets older than the kingdom. Strange noises echo within, and Brother Malric awaits their arrival.",
            "/landing-assets/features/feature-1-living-memory.jpg",
            new DashboardUpcomingSessionDto(
                "session-15",
                15,
                "Session 15 — The Ruined Chapel",
                "/landing-assets/features/feature-1-living-memory.jpg",
                "Saturday, May 17, 2025",
                "7:00 PM – 11:00 PM (4h)",
                "The Ruined Chapel",
                "Whispering Woods",
                completedPrep == 0 ? "Not Started" : (completedPrep >= totalPrep ? "Ready" : "Prep In Progress"),
                completedPrep,
                totalPrep,
                visiblePrep),
            allActivity.Where(a => isGm || a.Visibility != "gm").ToList(),
            allNotes.Where(n => isGm || n.Visibility != "gm").Take(5).ToList(),
            allQuests.Where(q => isGm ? q.Visibility != "hidden" : q.Visibility == "players").Take(5).ToList(),
            new List<DashboardPartyMemberDto>
            {
                new("party-kael", "1:PlayerCharacter:pc-dal", "Kael", "Human Ranger", 32, 38, "HP 32/38", 16, true, "KA", "#d9b77a", false, "/characters?focus=pc-dal"),
                new("party-lira", "1:PlayerCharacter:pc-fivi", "Lira", "Elf Sorcerer", 24, 24, "HP 24/24", 15, true, "LI", "#49e892", false, "/characters?focus=pc-fivi"),
                new("party-stonehide", "1:PlayerCharacter:pc-kildrid", "Stonehide", "Goliath Barbarian", 41, 45, "HP 41/45", 17, true, "ST", "#e2a85c", false, "/characters?focus=pc-kildrid"),
                new("party-seraphine", "1:PlayerCharacter:pc-kycius", "Seraphine", "Tiefling Cleric", 27, 27, "HP 27/27", 18, true, "SE", "#5ec2e8", true, "/characters?focus=pc-kycius"),
            },
            "All party members are healthy",
            "No critical conditions or exhaustion.",
            alerts,
            new DashboardSessionGuideDto(
                "SESSION 15 — THE RUINED CHAPEL",
                "/landing-assets/features/feature-1-living-memory.jpg",
                "\"Old stones remember. And something stirs beneath them still.\"",
                "A crumbling chapel stands on the edge of the Whispering Woods. Strange noises and missing travelers have drawn the party here, where an uneasy silence hangs over the ruins.",
                beats,
                new List<DashboardGuideNpcDto>
                {
                    new("1:NPC:npc-emrys", "Brother Malric", "Chapel Keeper · Cautious", "Cautious", "gold", "BM", "#d9b77a"),
                    new("1:NPC:npc-kutler", "Sister Elowen", "Healer · Guarded", "Guarded", "emerald", "SE", "#49e892"),
                    new("1:Encounter:enc-cinth-ballroom", "Shadow Stalker", "Ruin Stalker · Hostile", "Hostile", "crimson", "GS", "#e25c5c"),
                },
                isGm
                    ? new[]
                    {
                        "A sealed crypt lies beneath the altar.",
                        "Brother Malric knows more than he admits.",
                        "The shadows are connected to the mountain."
                    }
                    : Array.Empty<string>()));
    }
}
