using LoomWeaver.Domain;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace LoomWeaver.Modules.Sessions;

public static class SessionChronicleEndpoints
{
    private static readonly List<SessionRecapContract> CampaignSessions = new()
    {
        new SessionRecapContract(
            "session-18",
            1,
            18,
            "Shadow Beneath the Mountain & Kutler's Skyship",
            "Runic Cavern & Cinth Sky-Dock",
            "Act I Finale",
            2500,
            "Deceived by Lord Emrys into entering the mountain cavern, the party battled the ancient life-bound dragon. Fivi landed the final killing blow with a tooth-loaded slingshot just before Emrys claimed the final Luminary clue and Captain Kutler arrived in a flying skyship.",
            new[]
            {
                "Fivi slew the bound dragon at 1 HP with a slingshot loaded with a tooth",
                "Emrys revealed his true design to trap the Sidhe Ard using the Luminaries",
                "Captain Kutler returned from the Lost Isles with Chokrah ritual intelligence; Fivi claimed his skyship as hers"
            },
            new[]
            {
                new SessionDeepLinkContract("Runic Cavern VTT", "/arcane-screen", "1:Location:loc-mountain-cavern"),
                new SessionDeepLinkContract("Fivi Character Sheet", "/characters", "1:Character:char-fivi"),
                new SessionDeepLinkContract("Chokrah Clue in The Loom", "/loom", "1:Clue:clue-chokrah-manifest")
            }
        ),
        new SessionRecapContract(
            "session-17",
            1,
            17,
            "Velvet, Brass & Fangs in Cinth",
            "Cinth Guildhall & Masquerade Ballroom",
            "Act I · Cinth",
            1800,
            "The party allied with the non-magical Artificers Guild of Cinth, attended the Lord of Cinth's masquerade, met the self-styled reformer Lord Emrys for the first time, and thwarted the vampire coven's bid to convert the city's nobility.",
            new[]
            {
                "Befriended the Cinth Artificers Guild and inspected their phosphor-bronze defenses",
                "First conversation with Lord Emrys regarding the reformed Council of Magic",
                "Repelled the Crimson Covenant vampire ambush across the ballroom balcony"
            },
            new[]
            {
                new SessionDeepLinkContract("Cinth Ballroom Map", "/maps", "1:Location:loc-cinth"),
                new SessionDeepLinkContract("Lord Emrys Dossier", "/campaigns", "1:NPC:npc-emrys"),
                new SessionDeepLinkContract("Ballroom Audio Stems", "/assets", "1:Location:loc-cinth")
            }
        ),
        new SessionRecapContract(
            "session-16",
            1,
            16,
            "The Plains of Red & The Quiet Maw",
            "Northeast Road from Vandia to Cinth",
            "Act I · Road to Cinth",
            1400,
            "Traveling northeast from the cliff-house near Vandia across the Plains of Red, Kildrid felt the hundred-year clawing beneath the southern mountain from afar while Kycius sewed an extradimensional containment pocket inside Dolly's mouth.",
            new[]
            {
                "Kildrid sensed the poisoned mountain runes from the Cinth road without entering",
                "Kycius stitched the Quiet Maw pocket inside Dolly so Fivi's companion spares lives",
                "Laksis the little fire drake bonded closely with Kycius and Fivi"
            },
            new[]
            {
                new SessionDeepLinkContract("Kildrid Stone Sense Note", "/loom", "1:Character:char-kildrid"),
                new SessionDeepLinkContract("Kycius & Dolly Loadout", "/characters", "1:Character:char-kycius"),
                new SessionDeepLinkContract("Neo4j World Graph", "/weave", "1:Character:char-fivi")
            }
        )
    };

    public static RouteGroupBuilder MapSessionChronicleEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/campaigns/{campaignId:int}/sessions", (int campaignId) =>
            Results.Ok(CampaignSessions.Where(s => s.CampaignId == campaignId).OrderByDescending(s => s.SessionNumber).ToList()));

        api.MapPost("/campaigns/{campaignId:int}/sessions", (int campaignId, CreateSessionRecapRequest req) =>
        {
            var nextNum = req.SessionNumber <= 0
                ? (CampaignSessions.Count > 0 ? CampaignSessions.Max(s => s.SessionNumber) + 1 : 19)
                : req.SessionNumber;
            var xp = req.XpAwarded <= 0 ? 1500 : req.XpAwarded;

            var created = new SessionRecapContract(
                $"session-{nextNum}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                campaignId,
                nextNum,
                string.IsNullOrWhiteSpace(req.Title) ? $"Session {nextNum}: Book Two — Road to Edhellain" : req.Title.Trim(),
                string.IsNullOrWhiteSpace(req.LocationName) ? "Borderland Village & Edhellain Road" : req.LocationName.Trim(),
                "Book II Chronicle",
                xp,
                string.IsNullOrWhiteSpace(req.Summary)
                    ? "Recorded in the living campaign chronicle with automated party XP distribution."
                    : req.Summary.Trim(),
                req.Highlights is { Count: > 0 }
                    ? req.Highlights
                    : new[]
                    {
                        $"Concluded Session {nextNum} and awarded +{xp} XP across the party",
                        "Synchronized session memory with The Loom and Campaign Analytics"
                    },
                new[]
                {
                    new SessionDeepLinkContract("Campaign Quests", "/campaigns", "1:Character:char-dal"),
                    new SessionDeepLinkContract("The Loom Recall", "/loom", "1:Character:char-munk"),
                    new SessionDeepLinkContract("Analytics Ledger", "/statistics", "1:Character:char-fivi")
                }
            );

            CampaignSessions.Insert(0, created);
            return Results.Ok(created);
        });

        return api;
    }
}
