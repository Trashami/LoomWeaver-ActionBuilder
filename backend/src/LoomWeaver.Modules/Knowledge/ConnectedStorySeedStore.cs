using LoomWeaver.Domain;

namespace LoomWeaver.Modules.Knowledge;

public static class ConnectedStorySeedStore
{
    public static readonly object SyncLock = new();

    public static string ActiveBeatId { get; set; } = "beat-2-1-arrival";

    public static readonly List<StoryActColumnDto> Acts = new()
    {
        new(
            "act-1",
            "I",
            "ACT I",
            "Shadows in the Stone",
            "Complete",
            "Strange signs, a missing caravan, and the first threads of an ancient mystery.",
            5,
            5,
            new List<StoryBeatItemDto>
            {
                new("beat-1-1", "act-1", "1.1", "1.1 The Missing Caravan", "quest", "Complete", "location", "node-loc-ruined-chapel", "loc-vandia", "/campaigns?beat=beat-1-1", "players"),
                new("beat-1-2", "act-1", "1.2", "1.2 The Whispering Woods", "location", "Complete", "location", "node-loc-ruined-chapel", "loc-veldra-wood", "/world-lore?location=loc-veldra-wood", "players"),
                new("beat-1-3", "act-1", "1.3", "1.3 Clues in the Old Ruins", "clue", "Complete", "room", "node-room-c1-nave", "loc-ruined-chapel", "/world-lore?location=loc-ruined-chapel", "players"),
                new("beat-1-4", "act-1", "1.4", "1.4 Brother Malric Arrives", "npc", "Complete", "room", "node-room-c1-nave", "loc-ruined-chapel", "/campaigns?inspect=npc-malric", "players"),
                new("beat-1-5", "act-1", "1.5", "1.5 The Sealed Map Fragment", "lore", "Complete", "room", "node-room-c2-courtyard", "loc-plains-red", "/world-lore?tab=lore&loreId=lore-star-etched-arrow", "players"),
            }
        ),
        new(
            "act-2",
            "II",
            "ACT II",
            "The Road to Cinth",
            "In Progress",
            "The party follows the trail into the Whispering Woods and uncovers the Ruined Chapel.",
            2,
            5,
            new List<StoryBeatItemDto>
            {
                new("beat-2-1-arrival", "act-2", "2.1", "Arrival at the Ruined Chapel", "scene", "In Progress", "session", "session-15", "loc-ruined-chapel", "/campaigns?session=session-15", "players"),
                new("beat-2-2-site", "act-2", "2.2", "2.2 The Chapel Site", "location", "Planned", "location", "node-loc-ruined-chapel", "loc-ruined-chapel", "/world-lore?location=loc-ruined-chapel", "players"),
                new("beat-2-3-secrets", "act-2", "2.3", "2.3 Secrets Beneath the Chapel", "clue", "Planned", "room", "node-room-c3-crypt", "loc-ruined-chapel", "/world-lore?tab=lore&loreId=lore-priors-rituals", "players"),
                new("beat-2-4-arrow", "act-2", "2.4", "2.4 The Star-Etched Arrow", "lore", "Planned", "room", "node-room-c2-courtyard", "loc-veldra-wood", "/world-lore?tab=lore&loreId=lore-star-etched-arrow", "players"),
                new("beat-2-5-cinth", "act-2", "2.5", "2.5 The Road to Cinth", "route", "Planned", "location", "node-loc-cinth-gala", "loc-cinth", "/world-lore?location=loc-cinth", "players"),
            }
        ),
        new(
            "act-3",
            "III",
            "ACT III",
            "The Heart Beneath",
            "Planned",
            "The true nature of the bound dragon emerges, and the party must decide what to awaken.",
            0,
            5,
            new List<StoryBeatItemDto>
            {
                new("beat-3-1", "act-3", "3.1", "3.1 The Forgotten Vault", "secret", "Planned", "room", "node-room-c3-crypt", "loc-mountain-cavern", "/world-lore?location=loc-mountain-cavern", "players"),
                new("beat-3-2", "act-3", "3.2", "3.2 The Bound Dragon", "monster", "Planned", "location", "node-loc-ruined-chapel", "loc-mountain-cavern", "/encounters?focus=enc-mountain-caves", "players"),
                new("beat-3-3", "act-3", "3.3", "3.3 The Sixth Luminary", "artifact", "Planned", "location", "node-loc-cinth-gala", "loc-well-of-life", "/world-lore?location=loc-well-of-life", "players"),
                new("beat-3-4", "act-3", "3.4", "3.4 Choosing the Future", "quest", "Planned", "location", "node-loc-cinth-gala", "loc-cinth", "/campaigns?inspect=quest-cinth-gala", "players"),
                new("beat-3-5", "act-3", "3.5", "3.5 The Mountain Awakens", "encounter", "Planned", "location", "node-loc-ruined-chapel", "loc-mountain-cavern", "/arcane-screen", "players"),
            }
        ),
        new(
            "act-4",
            "IV",
            "Act IV",
            "Unwritten",
            "Unwritten",
            "The final confrontation and the fate of Cinth.",
            0,
            0,
            new List<StoryBeatItemDto>()
        )
    };

    public static readonly List<StorySessionSequenceItemDto> SessionSequence = new()
    {
        new("session-13", 13, "Session 13", "Whispering Woods", "Sat, May 3, 2025", "completed", "/icrandor_world_dashboard.jpg", "node-chap-whispering"),
        new("session-14", 14, "Session 14", "The Chapel Site", "Sat, May 10, 2025", "completed", "/six-engines-showcase.jpg", "session-14"),
        new("session-15", 15, "Session 15", "The Ruined Chapel", "Sat, May 17, 2025", "live", "/combat-caves.jpg", "session-15"),
    };

    public static readonly List<StoryLoreClueFeedItemDto> LoreAndCluesFeed = new()
    {
        new(
            "feed-carvings",
            "1:Clue:clue-carvings-chapel",
            "Carvings Beneath the Chapel",
            "Clue",
            "emerald",
            "Strange symbols match those from the mountain tomb. They speak of a bound dragon beneath the peaks.",
            "3h ago",
            "confirmed",
            "/world-lore?tab=lore&loreId=lore-priors-rituals",
            "lore-priors-rituals"
        ),
        new(
            "feed-arrow",
            "1:Lore:lore-star-etched-arrow",
            "The Star-Etched Arrow",
            "Lore",
            "gold",
            "Found on a fallen scout. The fletching bears the royal mark of the Vale of Edhellain.",
            "2d ago",
            "confirmed",
            "/world-lore?tab=lore&loreId=lore-star-etched-arrow",
            "lore-star-etched-arrow"
        ),
        new(
            "feed-malric",
            "1:SourceRecord:src-malric-testimony",
            "Brother Malric's Warnings",
            "Handout",
            "amber",
            "He believes the shadows are not just undead, but tied to the Prior inspectors who entered Crypt C3.",
            "4d ago",
            "unverified",
            "/campaigns?inspect=npc-malric",
            "lore-priors-rituals"
        ),
        new(
            "feed-claim-priors",
            "1:Claim:claim-priors-rituals",
            "Claim: The Priors' Chokrah Siphon",
            "Claim",
            "crimson",
            "Crypt C3 manifest supports the claim that Prior academies siphon student magic for Emrys.",
            "Just now",
            "confirmed",
            "/world-lore?tab=lore&loreId=lore-priors-rituals",
            "lore-priors-rituals"
        )
    };

    public static readonly List<StoryClaimDto> Claims = new()
    {
        new(
            "claim-priors-rituals",
            1,
            "1:Claim:claim-priors-rituals",
            "Claim about the Priors: Chokrah Siphon Crucible",
            "The Order of Priors conducts secret Chokrah titration rituals to siphon innate magic from street-born initiates.",
            "confirmed",
            "GM Canonical Truth: Confirmed. Emrys created the Priors from his mother Ekkos's religion and pools the siphoned student magic to power the dragon-scale Luminary ritual.",
            "1:Clue:clue-chokrah-manifest",
            "Signed Chokrah Siphon Manifest (Crypt C3)",
            "1:Claim:claim-council-reform",
            "Emrys's Public Council Reform Charter",
            "lore-priors-rituals",
            "Lore: Priors' Rituals & Chokrah Titration",
            "1:NPC:npc-emrys",
            "Emrys Driothe & The Order of Priors",
            "players",
            new[] { "Dal", "Kildrid", "Kycius" },
            3
        ),
        new(
            "claim-council-reform",
            1,
            "1:Claim:claim-council-reform",
            "Public Claim: \"The New Council Protects Every Gift\"",
            "Emrys Driothe claims the reformed Council of Magic registers self-taught casters solely to protect clerics, warlocks, and artificers.",
            "disputed",
            "GM Canonical Truth: Partly true in public law, which makes it more dangerous—Emrys uses the registry to track bloodlines and harvest magic.",
            "1:SourceRecord:src-malric-testimony",
            "Cinth Gala Public Proclamation",
            "1:Clue:clue-chokrah-manifest",
            "Signed Chokrah Siphon Manifest (Crypt C3)",
            "lore-priors-rituals",
            "Lore: Priors' Rituals & Chokrah Titration",
            "1:NPC:npc-emrys",
            "Emrys Driothe",
            "players",
            new[] { "All Party" },
            2
        )
    };

    public static readonly List<EntityRelationshipDto> Relationships = new()
    {
        new(1, 1, "1:Session:session-15", "Session 15 — The Ruined Chapel", "Session", "PLANS", "1:Scene:scene-crypt-descent", "Investigate the Crypt", "Scene", "What are we preparing to play? Session 15 plans Investigate the Crypt", "players", null, 2, null, 1, false),
        new(2, 1, "1:Scene:scene-crypt-descent", "Investigate the Crypt", "Scene", "OCCURS_AT", "1:Room:room-c3-crypt", "Crypt C3: Sealed Altar Crypt", "Room", "Where does it happen? Scene occurs at Crypt C3", "players", null, 2, null, 1, false),
        new(3, 1, "1:Room:room-c3-crypt", "Crypt C3: Sealed Altar Crypt", "Room", "CONTAINS", "1:Clue:clue-chokrah-manifest", "Chokrah Manifest", "Clue", "What can the party find here? Crypt C3 contains the Chokrah manifest", "players", null, 1, null, 1, false),
        new(4, 1, "1:Room:room-c3-crypt", "Crypt C3: Sealed Altar Crypt", "Room", "CONTAINS", "1:Clue:clue-carvings-chapel", "Carvings Beneath the Chapel", "Clue", "What can the party find here? Runic carvings matching the mountain tomb", "players", null, 1, null, 1, false),
        new(5, 1, "1:Clue:clue-chokrah-manifest", "Chokrah Manifest", "Clue", "SUPPORTS", "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "What does the evidence suggest? Manifest supports Claim about the Priors", "players", "1:SourceRecord:src-malric-testimony", 3, null, 2, false),
        new(6, 1, "1:SourceRecord:src-malric-testimony", "Brother Malric's Testimony", "SourceRecord", "SUPPORTS", "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "Witness testimony confirming Prior inspectors brought Chokrah crates to C3", "players", "1:SourceRecord:src-malric-testimony", 2, null, 1, false),
        new(7, 1, "1:Claim:claim-council-reform", "Public Council Reform Claim", "Claim", "CONTRADICTS", "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "Public reform narrative contradicts secret siphon claim", "players", null, 1, null, 1, false),
        new(8, 1, "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "DOCUMENTED_IN", "1:Lore:lore-priors-rituals", "Lore: Priors' Rituals", "Lore", "Where is the supporting explanation? Documented in Lore: Priors' rituals", "players", null, 1, null, 1, false),
        new(9, 1, "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "IMPLICATES", "1:NPC:npc-emrys", "NPC: Emrys Driothe", "NPC", "Who is involved? Claim implicates Emrys Driothe", "players", null, 1, null, 1, false),
        new(10, 1, "1:Claim:claim-priors-rituals", "Claim about the Priors", "Claim", "IMPLICATES", "1:Faction:fac-priors", "The Order of Priors", "Faction", "Who is involved? Implicates The Order of Priors", "players", null, 1, null, 1, false),
        new(11, 1, "1:PlayerCharacter:pc-dal", "Dal Riata", "PlayerCharacter", "DISCOVERED", "1:Clue:clue-carvings-chapel", "Carvings Beneath the Chapel", "Clue", "Who actually knows this? Discovered by Dal & Kildrid during play", "players", null, 3, null, 1, false),
        new(12, 1, "1:PlayerCharacter:pc-kildrid", "Kildrid", "PlayerCharacter", "DISCOVERED", "1:Clue:clue-kildrid-tremor", "Rhythmic Scratching in Deep Stone", "Clue", "Who actually knows this? Sensed by Kildrid via Stonecunning", "players", null, 3, null, 1, false),
        new(13, 1, "1:PlayerCharacter:pc-kycius", "Kycius", "PlayerCharacter", "DISCOVERED", "1:Clue:clue-chokrah-manifest", "Chokrah Manifest", "Clue", "Who actually knows this? Deciphered by Kycius in Crypt C3", "players", null, 3, null, 1, false),
        new(14, 1, "1:NPC:npc-malric", "Brother Malric", "NPC", "WAS_IN", "1:Room:room-c3-crypt", "Crypt C3: Sealed Altar Crypt", "Room", "Historical event (Event 1–2): Malric was in Crypt C3 when the Priors arrived", "players", null, 1, 2, 1, true),
        new(15, 1, "1:NPC:npc-malric", "Brother Malric", "NPC", "CURRENTLY_IN", "1:Location:room-c1-nave", "C1: The Shattered Nave", "Room", "Current state (Event 2+): Malric is currently keeping vigil in C1", "players", null, 2, null, 2, false),
        new(16, 1, "1:Secret:sec-emrys-trap", "Emrys's Life-Bound Dragon Trap", "Secret", "ABOUT", "1:Monster:mon-bound-dragon", "Vaelkorath, The Bound Dragon", "Monster", "GM Secret: Emrys cannot kill Vaelkorath without dying himself", "gm", null, 1, null, 1, false),
    };
}
