using LoomWeaver.Domain;

namespace LoomWeaver.Modules.Knowledge;

public static class WorldLoreCatalogStore
{
    public static readonly Dictionary<int, List<WorldMapMarkerDto>> MarkersByCampaign = new()
    {
        [1] =
        [
            new("m-karak-thul", "map-icrandor-world", "loc-karak-thul", "1:Location:loc-karak-thul", "Karak Thul", "Dwarven Hold", "Settlements", "Settlement", 23.0, 29.0, "known", "players", null, null, 0, 2, 0, "sess-13", "Session 13 · Stone-Sense on the Cinth Road"),
            new("m-stormwatch", "map-icrandor-world", "loc-vandia", "1:Location:loc-vandia", "Vandia & Stormwatch", "Coastal Outpost", "Settlements", "Settlement", 21.0, 42.0, "visited", "players", null, "scene-vandia-cliff", 1, 2, 0, "sess-12", "Session 12 · Departure from Vandia & Well of Life"),
            new("m-sunspear", "map-icrandor-world", "loc-well-of-life", "1:Location:loc-well-of-life", "Well of Life Sanctuary", "Temple Ruins", "Locations", "Building", 35.0, 58.0, "visited", "players", null, "scene-vandia-cliff", 0, 1, 0, "sess-12", "Session 12 · Departure from Vandia & Well of Life"),
            new("m-ruined-chapel", "map-icrandor-world", "loc-ruined-chapel", "1:Location:loc-ruined-chapel", "The Ruined Chapel", "Quest Location", "Quests", "Building", 39.5, 34.5, "visited", "players", null, "scene-cinth-gala", 1, 2, 1, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth"),
            new("m-cinth", "map-icrandor-world", "loc-cinth", "1:Location:loc-cinth", "City of Cinth", "Major City", "Settlements", "Settlement", 46.5, 44.0, "visited", "players", "map-cinth-metropolis", "scene-cinth-gala", 2, 3, 2, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth"),
            new("m-skydock", "map-icrandor-world", "loc-artificers-skydock", "1:Location:loc-artificers-skydock", "Artificers Sky-Dock", "Cinth High Berth", "Factions", "District", 48.2, 38.6, "visited", "players", "map-cinth-metropolis", "scene-cinth-gala", 1, 2, 0, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth"),
            new("m-mournwald", "map-icrandor-world", "loc-veldra-wood", "1:Location:loc-veldra-wood", "Mournwald", "Ancient Forest", "Regions", "Region", 55.5, 35.5, "known", "players", null, null, 1, 1, 0),
            new("m-hollow-vale", "map-icrandor-world", "loc-plains-red", "1:Location:loc-plains-red", "The Plains of Red", "Ancient Fey Battlefield", "Locations", "Region", 67.0, 46.0, "visited", "players", null, "scene-plains-red", 1, 2, 0, "sess-13", "Session 13 · Crossing the Plains of Red"),
            new("m-grimtal", "map-icrandor-world", "loc-crimson-ambush", "1:Location:loc-crimson-ambush", "Crimson Court Ambush", "Active Encounter", "Encounters", "Building", 67.5, 55.0, "known", "players", null, "scene-cinth-gala", 1, 1, 0, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth"),
            new("m-mountain-secret", "map-icrandor-world", "loc-mountain-cavern", "1:Location:loc-mountain-cavern", "Runed Dragon Prison", "GM Secret Vault", "Secrets", "Building", 52.0, 53.0, "undiscovered", "gm", "map-mountain-prison", "scene-mountain-prison", 1, 2, 2, "sess-16", "Session 16 · Shadow Beneath the Southern Peaks"),
            new("m-cinth-rotunda", "map-cinth-metropolis", "loc-cinth-keep", "1:Location:loc-cinth-keep", "The Glass Rotunda", "Lord of Cinth Estate", "Locations", "Building", 48.0, 42.0, "visited", "players", null, "scene-cinth-gala", 1, 2, 1, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth"),
            new("m-cinth-guildhall", "map-cinth-metropolis", "loc-artificers-skydock", "1:Location:loc-artificers-skydock", "Artificers Guildhall & Sky-Dock", "Brass Workshop Ward", "Factions", "District", 62.0, 54.0, "visited", "players", null, "scene-cinth-gala", 1, 2, 0, "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth")
        ],
        [2] =
        [
            new("m-absalom-bazaar", "map-absalom-isle", "loc-absalom-bazaar", "2:Location:loc-absalom-bazaar", "Absalom Grand Bazaar", "Metropolis Hub", "Settlements", "Settlement", 48.0, 46.0, "visited", "players", null, null, 2, 2, 0)
        ],
        [3] = []
    };

    public static readonly Dictionary<int, List<PartyJourneyWaypointDto>> WaypointsByCampaign = new()
    {
        [1] =
        [
            new("wp-1", "map-icrandor-world", "loc-vandia", "Vandia & Cliff House", 11, "2nd of Frostfall, 1004 A.M.", 21.0, 42.0, "visited", "Departed the cliff-edge house bearing two Luminaries.", "players"),
            new("wp-2", "map-icrandor-world", "loc-vandia", "Well of Life Triangle", 12, "5th of Frostfall, 1004 A.M.", 35.0, 58.0, "visited", "Passed the Well of Life sanctuary northeast of the cliff house.", "players"),
            new("wp-3", "map-icrandor-world", "loc-ruined-chapel", "The Ruined Chapel", 13, "9th of Frostfall, 1004 A.M.", 39.5, 34.5, "visited", "Kildrid felt rhythmic scratching beneath the southern mountain from afar; Kycius sewed the Quiet Maw inside Dolly.", "players"),
            new("wp-4", "map-icrandor-world", "loc-cinth", "City of Cinth (Current Party Position)", 15, "18th of Frostfall, 1004 A.M.", 46.5, 44.0, "current", "Allied with the Artificers Guild and entered the Lord of Cinth's masquerade.", "players"),
            new("wp-5-gm", "map-icrandor-world", "loc-mountain-cavern", "Emrys's Planned Mountain Trap", 16, "Planned Return Route", 52.0, 53.0, "gm_planned", "GM Only: Emrys plans to divert the party into the runed dragon cavern on their return journey.", "gm")
        ],
        [2] =
        [
            new("wp-2-1", "map-absalom-isle", "loc-absalom-bazaar", "Absalom Grand Bazaar", 6, "14 Rova, 4724 AR", 48.0, 46.0, "current", "Descending into the Starstone Clockwork Vaults.", "players")
        ],
        [3] = []
    };

    public static readonly Dictionary<int, List<LoreEntryDto>> LoreByCampaign = new()
    {
        [1] =
        [
            new(
                "lore-kingdom-cinth",
                "1:Location:loc-cinth",
                1,
                "The Kingdom of Cinth",
                "Inland Metropolis & Seat of the Brass Guilds",
                "Kingdoms & Settlements",
                "A realm of cities, trade, and post-war craft, Cinth has stood for centuries near the Plains of Vistagh as a counterweight to unchecked arcane rule.",
                "Built where the northeast road from Vandia meets the fertile Plains of Vistagh, the Kingdom of Cinth is governed by the Lord of Cinth and chartered guild councils. Since the hundred-year Moonlight Wars, Cinth has become the heart of the Artificers movement—non-magical engineers who answer spellcraft with phosphor-bronze condensers, clockwork defenses, and skyships. See @City of Cinth and @Artificers Guild of Cinth.",
                "/six-engines-showcase.jpg",
                ["Kingdoms", "Settlements", "Cinth", "Artificers"],
                ["1:Location:loc-cinth", "1:Faction:fac-artificers", "1:NPC:npc-emrys"],
                [
                    new("1:Location:loc-cinth", "City of Cinth", "Inland Metropolis", "Location", "Capital City", "/weave", "players"),
                    new("1:Faction:fac-artificers", "Artificers Guild of Cinth", "Craft Collective", "Faction", "Chartered Guild", "/campaigns", "players")
                ],
                "players",
                false,
                "3 days ago",
                "2 hours ago",
                1761500000000
            ),
            new(
                "lore-veldra-wood",
                "1:Location:loc-veldra-wood",
                1,
                "The Veldra Wood & Mournwald",
                "Ancient Fey-Bordered Canopy of Icrandor",
                "Worlds & Regions",
                "An ancient and mysterious forest, older than the current kingdoms. Home to fey remnants, hermits, and boundary stones that remember the Sidhe Ard.",
                "Stretching north of the Cinth road, the Veldra Wood shelters outcast fey and ancient stone markers from before the Moonlight Wars. Fivi's sideways stories often reference the seasonal courts beyond its deepest glades. Linked to @The Plains of Red.",
                "/icrandor_world_dashboard.jpg",
                ["Regions", "Geography", "Fey"],
                ["1:Location:loc-veldra-wood", "1:PlayerCharacter:pc-fivi"],
                [
                    new("1:PlayerCharacter:pc-fivi", "Fivi", "Feywild Outcast", "PlayerCharacter", "Cultural Tie", "/characters", "players")
                ],
                "players",
                false,
                "5 days ago",
                "1 day ago",
                1761450000000
            ),
            new(
                "lore-artificers-guild",
                "1:Faction:fac-artificers",
                1,
                "The Artificers Guild of Cinth",
                "Non-Magical Answer to Arcane Dominance",
                "Factions & Organizations",
                "Formed after the Moonlight Wars by intelligent non-magical artisans building mechanical-arcane engines, defenses, and skyships so ordinary people are never helpless.",
                "During the hundred-year Moonlight Wars, the old Council of Magic represented only wizards and sought to register or punish all other power. In the aftermath, non-magical engineers in Cinth founded the Artificers Guild, proving that intellect, risk, and brass craft can stand beside mages, undead, and divine remnants. Captain Kutler's skyship was built in their high docks.",
                "/six-engines-showcase.jpg",
                ["Factions", "Magic & Technology", "Cinth"],
                ["1:Faction:fac-artificers", "1:NPC:npc-kutler", "1:Location:loc-cinth"],
                [
                    new("1:NPC:npc-kutler", "Captain Kutler", "Skyship Commander", "NPC", "Skyship Pilot", "/campaigns", "players")
                ],
                "players",
                false,
                "6 days ago",
                "5 hours ago",
                1761490000000
            ),
            new(
                "lore-ruined-chapel",
                "1:Location:loc-ruined-chapel",
                1,
                "The Ruined Chapel",
                "Sanctuary of the Abandoned on the Old Kingsroad",
                "Kingdoms & Settlements",
                "A crumbling shrine on the old kingsroad. Locals speak of strange lights at night and whispers beneath the stones.",
                "Originally consecrated to Ekkos, mother of the abandoned and homeless, the chapel fell into disrepair after the Moonlight Wars. Brother Malric tends its upper nave while sealed runes hum below the altar.",
                "/combat-caves.jpg",
                ["Locations", "Religions & Deities", "Ekkos"],
                ["1:Location:loc-ruined-chapel", "1:Clue:clue-kildrid-tremor"],
                [],
                "players",
                false,
                "4 days ago",
                "2 hours ago",
                1761502000000
            ),
            new(
                "lore-first-age-anelith",
                "1:Artifact:art-luminary-well",
                1,
                "The First Age & The Six Luminaries",
                "Creation's Remains Woven Through the Anelith",
                "Historical Events",
                "The age when the Sidhe Ard called upon the Anelith—a weave of magic spanning time and space—to breathe life into root and river, beast and blood.",
                "When the Sidhe Ard wove life across Icrandor through the Anelith, six concentrations of leftover creation power remained: the Luminaries, arranged in a great hexagon across the world. Ancient dragons later contained the Luminaries inside themselves to safeguard Icrandor.",
                "/the-weave-graph-engine.jpg",
                ["History", "Myths & Legends", "Luminaries", "Anelith"],
                ["1:Artifact:art-luminary-well"],
                [],
                "players",
                false,
                "1 week ago",
                "3 days ago",
                1761300000000
            ),
            new(
                "lore-ekkos-moon",
                "1:Faction:fac-priors",
                1,
                "Ekkos, Mother of the Abandoned",
                "Moon Goddess & Patron of the Left-Behind",
                "Religions & Deities",
                "Before the Sidhe Ard departed Icrandor, Ekkos left traces of her memory as a loving moon goddess for all peoples left behind.",
                "Ekkos loves all species and peoples equally. Her faith began among the abandoned after the Sidhe Ard departure and grew into sanctuaries for street children and the homeless.",
                "/LoomWeaverWallpaper.png",
                ["Religion", "Myths", "Ekkos"],
                ["1:Location:loc-ruined-chapel"],
                [],
                "players",
                false,
                "1 week ago",
                "4 days ago",
                1761250000000
            ),
            new(
                "lore-priors-rituals",
                "1:Faction:fac-priors",
                1,
                "Lore: Priors' Rituals & The Chokrah Siphon",
                "Order of Priors · Corrupted Sanctuaries of Ekkos",
                "Factions & Organizations",
                "Publicly the Priors rescue street children and teach discipline; evidence in Crypt C3 reveals they titrate Chokrah to siphon innate magic.",
                "Before the Sidhe Ard departed Icrandor, Ekkos left traces of her memory as Mother of the Abandoned. Centuries later, Emrys Driothe reshaped her street-schools into the Order of Priors. The Chokrah manifest recovered in Crypt C3 beneath @The Ruined Chapel supports the claim that Prior alchemists siphon a percentage of students' innate gift to fuel a dragon-scale ritual.",
                "/the-weave-graph-engine.jpg",
                ["Factions", "Chokrah", "Priors", "Rituals"],
                ["1:Faction:fac-priors", "1:NPC:npc-emrys", "1:Clue:clue-chokrah-manifest", "1:Location:loc-ruined-chapel"],
                [
                    new("1:NPC:npc-emrys", "Emrys Driothe", "Council Reformer", "NPC", "Implicated Patron", "/campaigns?inspect=npc-emrys", "players"),
                    new("1:Location:loc-ruined-chapel", "The Ruined Chapel", "Whispering Woods Shrine", "Location", "Crypt C3 Evidence Site", "/world-lore?location=loc-ruined-chapel", "players")
                ],
                "players",
                false,
                "1 day ago",
                "30 mins ago",
                1761504000000
            ),
            new(
                "lore-star-etched-arrow",
                "1:Artifact:art-luminary-well",
                1,
                "The Star-Etched Arrow",
                "Recovered Vale Scout Relic · Royal Lineage Sigil",
                "Artifacts & Relics",
                "Found on a fallen scout in the Whispering Woods. The silver fletching bears the ancient royal mark of the Vale of Edhellain.",
                "Recovered near the shattered cloister arch of @The Ruined Chapel, this star-etched arrow was loosed by a ranger of the Vale before the shadows dragged his satchel toward Crypt C3. Its silver-chased shaft carries the same royal house sigil that appears in the missing lineage pages of Edhellain.",
                "/dice-physics-engine.jpg",
                ["Artifacts", "Edhellain", "Clues", "Dal"],
                ["1:PlayerCharacter:pc-dal", "1:Location:loc-ruined-chapel"],
                [
                    new("1:PlayerCharacter:pc-dal", "Dal Riata", "Elf Ranger · Royal Lineage", "PlayerCharacter", "Lineage Bearer", "/characters?focus=pc-dal", "players")
                ],
                "players",
                false,
                "2 days ago",
                "2 hours ago",
                1761503000000
            ),
            new(
                "lore-gm-priors-chokrah",
                "1:Secret:sec-emrys-trap",
                1,
                "GM Secret: The Priors & Chokrah Siphon",
                "Emrys's Manipulation of His Mother's Faith",
                "Factions & Organizations",
                "GM Canonical Secret: Emrys uses Ekkos's religion to run the Priors, secretly stealing innate magic from street children via Chokrah rituals.",
                "While the Priors publicly shelter street children and teach discipline, Emrys secretly siphons magic from a percentage of students—telling them their gift simply 'ran out'—to pool the immense dragon-scale power required for the six-Luminary god-trap ritual.",
                "/combat-caves.jpg",
                ["Secrets", "Chokrah", "Priors", "Emrys"],
                ["1:Faction:fac-priors", "1:NPC:npc-emrys", "1:Secret:sec-emrys-trap"],
                [],
                "gm",
                false,
                "2 days ago",
                "1 hour ago",
                1761505000000
            )
        ],
        [2] =
        [
            new(
                "lore-starstone-cathedral",
                "2:Location:loc-absalom-bazaar",
                2,
                "The Starstone & Founding of Absalom",
                "Ascendant Court Chronicle",
                "Historical Events",
                "Raised from the floor of the Inner Sea by Aroden, the Starstone rests at the heart of Absalom.",
                "Countless aspirants have attempted the Test of the Starstone across the ages of Golarion.",
                "/landing-assets/engines/engine-3-loommaps-atlas.jpg",
                ["History", "Absalom", "Starstone"],
                ["2:Location:loc-absalom-bazaar"],
                [],
                "players",
                false,
                "5 days ago",
                "1 day ago",
                1761400000000
            )
        ],
        [3] =
        [
            new(
                "lore-elysium-traditions",
                "3:Campaign:velvet-ash",
                3,
                "Covenants of the Gilded Conservatory",
                "Camarilla Elysium Protocol",
                "Cultures & Civilizations",
                "Strict neutrality and blood-boon accounting enforced within the Prince's Harbor Conservatory.",
                "No vitae may be spilled within the glass conservatory under penalty of the Lextalionis.",
                "/LoomWeaverWallpaper.png",
                ["Factions", "Elysium", "Vampire V5"],
                [],
                [],
                "players",
                false,
                "3 days ago",
                "1 day ago",
                1761410000000
            )
        ]
    };

    public static readonly Dictionary<int, List<WorldHistoryChronicleEventDto>> HistoryByCampaign = new()
    {
        [1] =
        [
            new("ev-1", 1, "Weaving of the Anelith & The Six Luminaries", "First Age · Dawn of Icrandor", "ca. 4,000 B.M.", 10, null, "World Mythos", "Religious & Cultural Events", "The Sidhe Ard called upon the Anelith to breathe life into Icrandor, leaving six hexagonal Luminaries that ancient dragons later safeguarded within themselves.", "loc-vandia", "Well of Life", "map-icrandor-world", [], "players"),
            new("ev-2", 1, "Slaughter on the Plains of Red", "First Age · Mortal Expansion", "ca. 1,000 Years Ago", 20, null, "World Mythos", "Wars", "Men slaughtered the fey host along the central corridor between the forest and southern peaks, forever naming the Plains of Red.", "loc-plains-red", "The Plains of Red", "map-icrandor-world", [], "players"),
            new("ev-3", 1, "Outbreak of the Hundred-Year Moonlight Wars", "Age of the Moonlight Wars", "Year 800 A.M.", 30, null, "World History", "Wars", "Publicly sparked by the old wizard-only Council of Magic seeking to register and punish unsanctioned casters across Icrandor.", "loc-cinth", "City of Cinth", "map-icrandor-world", [], "players"),
            new("ev-4-gm", 1, "GM Secret: Binding of Vaelkorath Beneath the Mountain", "Age of the Moonlight Wars", "Year 812 A.M.", 35, null, "GM Canon Chronicle", "Catastrophes", "Emrys trapped the elder dragon beneath the southern mountain with runes and Luminaries, but the dragon bound its life to Emrys moments before containment.", "loc-mountain-cavern", "Runed Dragon Prison", "map-icrandor-world", [], "gm"),
            new("ev-5", 1, "Founding Charter of the Cinth Artificers Guild", "Post-War Reconstruction", "Year 905 A.M.", 40, null, "World History", "Founding of Settlements", "Non-magical engineers and scholars in Cinth chartered the Artificers Guild to build mechanical-arcane defenses and skyships.", "loc-cinth", "City of Cinth", "map-icrandor-world", [], "players"),
            new("ev-6", 1, "Stone-Sense Tremor & The Quiet Maw on the Cinth Road", "Current Campaign · Act II", "9th of Frostfall, 1004 A.M.", 50, 16, "Session 16 (May 2025)", "Historical Discoveries", "Passing the southern mountain on the road to Cinth, Kildrid sensed rhythmic clawing in the deep stone while Kycius sewed the Quiet Maw pocket inside Dolly.", "loc-plains-red", "The Plains of Red", "map-icrandor-world", [], "players"),
            new("ev-7", 1, "Masquerade of the Crimson Court & Arrival at the Ruined Chapel", "Current Campaign · Act II", "18th of Frostfall, 1004 A.M.", 60, 17, "Session 17 (May 2025)", "Major Historical Events", "The party allied with the Cinth Artificers Guild, met Emrys at the Lord of Cinth's gala, repelled the vampire coven, and tracked clues to the Ruined Chapel.", "loc-cinth", "City of Cinth", "map-icrandor-world", [], "players")
        ],
        [2] =
        [
            new("ev-2-1", 2, "Sealing of the Clockwork Spire Vaults", "Age of Enthronement", "4698 AR", 10, 6, "Session 6", "Historical Discoveries", "The High Clockmaster sealed the lower Starstone resonance chambers beneath the Grand Bazaar.", "loc-absalom-bazaar", "Absalom Grand Bazaar", "map-absalom-isle", [], "players")
        ],
        [3] = []
    };

    public static readonly Dictionary<int, List<RecentWorldDiscoveryDto>> DiscoveriesByCampaign = new()
    {
        [1] =
        [
            new("disc-1", "The Ruined Chapel", "Discovered during Session 15", "2 hours ago", "/combat-caves.jpg", "location", "loc-ruined-chapel", "players"),
            new("disc-2", "Artificers Guild of Cinth", "Added new lore and connections", "5 hours ago", "/six-engines-showcase.jpg", "lore", "lore-artificers-guild", "players"),
            new("disc-3", "The Plains of Red", "Updated with party route", "1 day ago", "/tactical-combat-engine.jpg", "location", "loc-plains-red", "players"),
            new("disc-4", "Mournwald & Veldra Wood", "Expanded region details", "2 days ago", "/icrandor_world_dashboard.jpg", "location", "loc-veldra-wood", "players"),
            new("disc-5", "Captain Kutler", "Added NPC background & skyship intel", "3 days ago", "/uploads/characters/captain_kutler.jpg", "entity", "1:NPC:npc-kutler", "players"),
            new("disc-6-gm", "The Order of Priors Siphon", "GM Secret: Chokrah extraction ledger", "1 hour ago", "/combat-caves.jpg", "lore", "lore-gm-priors-chokrah", "gm")
        ],
        [2] =
        [
            new("disc-2-1", "Absalom Grand Bazaar", "Visited in Session 6", "1 hour ago", "/landing-assets/engines/engine-3-loommaps-atlas.jpg", "location", "loc-absalom-bazaar", "players")
        ],
        [3] = []
    };
}
