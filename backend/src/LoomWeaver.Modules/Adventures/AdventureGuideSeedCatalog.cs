using LoomWeaver.Domain;

namespace LoomWeaver.Modules.Adventures;

internal static class AdventureGuideSeedCatalog
{
    public static (string HeaderTitle, string HeaderSubtitle, string? AreaKey, string Epigraph, string Summary, string ImmediateSituation, string SensoryDescription) GetRoomMetadata(string scopeId, bool isGm) =>
        scopeId switch
        {
            "node-room-c1-nave" => (
                "ROOM C1 — THE SHATTERED NAVE",
                "Keyed Room C1 · Ruined Chapel Entry & Brother Malric's Vigil",
                "C1",
                "\"If you seek the scouts from the Vale road, lower your steel. The stone beneath this floor has been listening since sundown.\"",
                "Overturned oak pews flank a cracked mosaic of Ekkos, Mother of the Abandoned. Brother Malric keeps vigil by a brass brazier while Sister Elowen tends a wounded Vale scout.",
                "Brother Malric stands near the cracked Ekkosian altar; fresh chisel dust borders the northern flagstones leading toward C2 and the hidden stairs to C3.",
                "Rain drips through ribs of blackened timber; warm tallow candle-smoke fights the chill draft rising from the altar seam."
            ),
            "node-room-c2-courtyard" => (
                "ROOM C2 — MOONLIT CLOISTER COURTYARD",
                "Keyed Room C2 · Fallen Bell Tower & Shadow Stalker Ambush",
                "C2",
                "\"Between the leaning arches, the mist does not drift with the wind—it pools around three elongated silhouettes.\"",
                "Shattered gargoyles and waist-high brambles choke the cloister yard. Fresh boot-tracks and dragged satchel marks lead toward the sunken crypt stairs.",
                "Three Shadow Stalkers crouch atop the collapsed bell tower (+2 AC half-cover), waiting for a lantern-bearer to cross the courtyard midline.",
                "Silver moonlight cuts through dead yew branches; shadows detach unnatural angles from the broken masonry."
            ),
            "node-room-c3-crypt" => (
                "ROOM C3 — SEALED ALTAR CRYPT",
                "Keyed Room C3 · Subterranean Resonance Vault Beneath the Chapel",
                "C3",
                "\"Blue containment runes—carved by the same hand that bound the southern mountain—throb along the vaulted ossuary.\"",
                isGm
                    ? "Beneath the displaced altar slab descends a spiral of basalt steps into a vaulted ossuary containing a Signed Chokrah Siphon Manifest and pre-Council containment glyphs."
                    : "Spiral basalt steps descend beneath the altar into a cold, rune-lit subterranean ossuary.",
                "An Anelith Feedback Ward guards the inner reliquary lectern (DC 15 Arcana or Thieves' Tools) where the Chokrah manifest and Star-Etched Quiver rest.",
                "Cold blue runelight pulses in time with a distant subterranean heartbeat; the scent of Chokrah residue lingers in the damp stone."
            ),
            "session-14" => (
                "SESSION 14 — BRASS GEARS & VELVET FANGS",
                "Completed Session · City of Cinth & Grand Masquerade Rotunda",
                "CINTH",
                "\"Behind every polished mask in Cinth, a gear turns or a fang waits.\"",
                "The party arrived in Cinth, befriended the non-magical Artificers Guild, spoke with Lord Emrys Driothe at the masquerade, and repelled the Crimson Covenant.",
                "The Cinth Masquerade concluded with Emrys subtly suggesting the Whispering Woods return route.",
                "Polished obsidian pillars, phosphor-bronze chandeliers, and waltz echoes."
            ),
            _ => (
                "SESSION 15 — THE RUINED CHAPEL",
                "Connected Adventure & Location Reference · Whispering Woods (Rooms C1–C3)",
                "CHAPEL",
                "\"Old stones remember. And something stirs beneath them still.\"",
                "A crumbling chapel stands on the edge of the Whispering Woods. Strange noises and missing travelers have drawn the party here, where an uneasy silence hangs over the ruins.",
                "Party is investigating the Ruined Chapel across Keyed Rooms C1 (Shattered Nave), C2 (Moonlit Courtyard), and C3 (Sealed Altar Crypt).",
                "Cracked slate roof tiles, damp incense mixed with ozone, and ancient scratch marks echoing up through the altar flagstones."
            )
        };

    public static IReadOnlyList<AdventureRoomExitDto> GetRoomExits(string scopeId, bool isGm) =>
        scopeId switch
        {
            "node-room-c1-nave" => new List<AdventureRoomExitDto>
            {
                new("node-room-c2-courtyard", "C2: Moonlit Cloister Courtyard", "C2", "East Archway -> C2 Courtyard", "players"),
                new("node-room-c3-crypt", "C3: Sealed Altar Crypt", "C3", "Displaced Altar Slab -> C3 Crypt", isGm ? "gm" : "players"),
            },
            "node-room-c2-courtyard" => new List<AdventureRoomExitDto>
            {
                new("node-room-c1-nave", "C1: The Shattered Nave", "C1", "West Archway -> C1 Nave", "players"),
                new("node-room-c3-crypt", "C3: Sealed Altar Crypt", "C3", "North Cellar Steps -> C3 Crypt", "players"),
            },
            "node-room-c3-crypt" => new List<AdventureRoomExitDto>
            {
                new("node-room-c1-nave", "C1: The Shattered Nave", "C1", "Spiral Stairs Up -> C1 Altar", "players"),
                new("node-room-c2-courtyard", "C2: Moonlit Cloister Courtyard", "C2", "Exterior Bulkhead -> C2 Courtyard", "players"),
            },
            _ => new List<AdventureRoomExitDto>
            {
                new("node-room-c1-nave", "C1: The Shattered Nave", "C1", "Enter C1: Shattered Nave", "players"),
                new("node-room-c2-courtyard", "C2: Moonlit Cloister Courtyard", "C2", "Enter C2: Moonlit Courtyard", "players"),
                new("node-room-c3-crypt", "C3: Sealed Altar Crypt", "C3", "Descend to C3: Altar Crypt", isGm ? "gm" : "players"),
            }
        };

    public static IReadOnlyList<AdventureGuideElementItemDto> GetPlacesTabItems(
        bool isGm,
        AdventureAssignedBattlemapDto assignedMap,
        Func<string, string, string> getState,
        HashSet<string> sharedIds) =>
        new List<AdventureGuideElementItemDto>
        {
            new("node-loc-ruined-chapel", "1:Location:loc-plains-red", "location", "CHAPEL",
                "The Ruined Chapel (Site Overview)", $"Assigned Battlemap: {assignedMap.Title}",
                "Crumbling Ekkosian wayside sanctuary on the edge of the Whispering Woods containing keyed rooms C1, C2, and C3.",
                assignedMap.ArtworkUrl, "Session 15 Primary Site",
                getState("node-loc-ruined-chapel", "discovered"), assignedMap.RouteLink, "players"),
            new("node-room-c1-nave", "1:Location:loc-plains-red", "room", "C1",
                "C1: The Shattered Nave", "Keyed Room C1 · Entry & Brother Malric's Vigil",
                "Overturned oak pews, a brass brazier, and chipped mortar bordering the altar plinth.",
                "/combat-caves.jpg", "Keyed Room in Ruined Chapel",
                getState("node-room-c1-nave", "completed"), "/maps?scene=scene-plains-red", "players"),
            new("node-room-c2-courtyard", "1:Location:loc-plains-red", "room", "C2",
                "C2: Moonlit Cloister Courtyard", "Keyed Room C2 · Fallen Bell Tower & Ambush",
                "Bramble-choked flagstones where Shadow Stalkers perch above the dragged scout satchel.",
                "/tactical-combat-engine.jpg", "Keyed Room in Ruined Chapel",
                getState("node-room-c2-courtyard", "unresolved"), "/encounters?focus=enc-cinth-ballroom", "players"),
            new("node-room-c3-crypt", "1:Location:loc-cinth", "room", "C3",
                "C3: Sealed Altar Crypt", "Keyed Room C3 · Subterranean Resonance Vault",
                "Spiral basalt steps descending into an ossuary etched with pre-Council containment runes.",
                "/the-weave-graph-engine.jpg", "Keyed Room Beneath Altar",
                getState("node-room-c3-crypt", "unresolved"), "/maps?scene=scene-mountain-prison",
                isGm || sharedIds.Contains("node-room-c3-crypt") ? "players" : "gm"),
            new("node-loc-cinth-gala", "1:Location:loc-cinth", "location", "CINTH",
                "City of Cinth & Grand Masquerade", "Connected Region Hub · Session 14 & Act II",
                "Seat of the Artificers Guild and the Lord of Cinth's gala where Emrys Driothe greeted the party.",
                "/six-engines-showcase.jpg", "Connected Campaign Hub",
                "completed", "/maps?scene=scene-cinth-gala", "players"),
        }.Where(p => isGm || p.Visibility != "gm").ToList();

    public static IReadOnlyList<AdventureGuideElementItemDto> GetLoreTabItems(bool isGm) =>
        new List<AdventureGuideElementItemDto>
        {
            new("node-rule-shadow-tether", "1:Clue:clue-kildrid-tremor", "rule", "RULE",
                "Poisoned Root & Stone Tremor Resonance", "Adventure-Wide Rule · Whispering Woods & Southern Peaks",
                "Whenever a 3rd-level or higher spell is cast underground, Kildrid's stone sense detects the directional bearing of the bound dragon's runes.",
                "/icrandor_world_dashboard.jpg", "Adventure-Wide Rule", "discovered", "/loom?query=mountain+stone+sense", "players"),
            new("node-lore-priors", "1:Faction:fac-priors", "lore", "LORE",
                "The Order of Priors & Ekkosian Sanctuaries", "Faction Canon · Street-Schools of Ekkos",
                "Publicly rescues street children and teaches discipline; secretly siphons innate magic from students through Chokrah rituals.",
                "/the-weave-graph-engine.jpg", "Linked to C1 Altar & C3 Manifest", "discovered", "/weave?node=fac-priors",
                isGm ? "gm" : "players"),
            new("node-lore-luminaries", "1:Artifact:art-luminary-well", "lore", "LORE",
                "The Six Luminaries of the Anelith", "Creation Remnants · Hexagonal Weave of Icrandor",
                "Remnants of Sidhe Ard creation magic left across Icrandor and once contained within ancient dragons.",
                "/dice-physics-engine.jpg", "Carried by Party · Resonates in C3", "discovered", "/assets?inspect=art-luminary-well", "players"),
        };
}
