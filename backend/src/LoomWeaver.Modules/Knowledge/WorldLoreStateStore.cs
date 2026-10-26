using LoomWeaver.Domain;

namespace LoomWeaver.Modules.Knowledge;

public static class WorldLoreStateStore
{
    public static readonly List<string> DefaultCategories =
    [
        "Kingdoms & Settlements",
        "Worlds & Regions",
        "Geography",
        "Cultures & Civilizations",
        "Factions & Organizations",
        "Religions & Deities",
        "Historical Events",
        "Languages",
        "Magic & Technology",
        "Myths & Legends",
        "Important Documents"
    ];

    public static readonly Dictionary<int, List<WorldMapSummaryDto>> MapsByCampaign = new()
    {
        [1] =
        [
            new("map-icrandor-world", 1, "Icrandor Continental Atlas", "World", null, null, "/icrandor_world_dashboard.jpg", "scene-plains-red", "0 — 100 — 200 Miles", "Top-Right North", 1000, 560, "players"),
            new("map-cinth-metropolis", 1, "City of Cinth & Artificer Wards", "Settlement", "map-icrandor-world", "loc-cinth", "/six-engines-showcase.jpg", "scene-cinth-gala", "0 — 500 — 1000 Yards", "Top-Right North", 1000, 560, "players"),
            new("map-mountain-prison", 1, "Runed Cavern Beneath the Southern Peaks", "Building", "map-icrandor-world", "loc-mountain-cavern", "/combat-caves.jpg", "scene-mountain-prison", "0 — 60 — 120 Feet", "Top-Right North", 1000, 560, "gm")
        ],
        [2] =
        [
            new("map-absalom-isle", 2, "Isle of Kortos & Absalom Atlas", "Region", null, null, "/landing-assets/engines/engine-3-loommaps-atlas.jpg", null, "0 — 25 — 50 Miles", "Standard North", 1000, 560, "players")
        ],
        [3] = []
    };

    public static readonly Dictionary<int, List<WorldMapRegionOverlayDto>> OverlaysByCampaign = new()
    {
        [1] =
        [
            new("reg-cinth-kingdom", "map-icrandor-world", "KINGDOM OF CINTH", "region", "1:Faction:fac-artificers", "#d9b77a", 38, 46, "M 290 190 L 495 175 L 520 315 L 310 330 Z", "players"),
            new("reg-veldra-wood", "map-icrandor-world", "VELDRA WOOD", "region", null, "#49e892", 58, 36, "M 510 140 L 670 150 L 660 290 L 515 275 Z", "players"),
            new("reg-red-marches", "map-icrandor-world", "THE PLAINS OF RED", "region", null, "#e26d5c", 56, 68, "M 450 330 L 665 340 L 640 465 L 430 450 Z", "players"),
            new("reg-blackridge", "map-icrandor-world", "ORDER OF PRIORS DOMAIN", "territory", "1:Faction:fac-priors", "#e06c75", 76, 30, "M 685 110 L 870 125 L 855 255 L 680 240 Z", "gm")
        ],
        [2] =
        [
            new("reg-ascendant", "map-absalom-isle", "ASCENDANT COURT", "region", null, "#d9b77a", 48, 44, "M 360 180 L 580 180 L 580 340 L 360 340 Z", "players")
        ],
        [3] = []
    };

    public static readonly Dictionary<int, List<LocationInspectorDetailDto>> LocationsByCampaign = new()
    {
        [1] =
        [
            new(
                "loc-cinth",
                "1:Location:loc-cinth",
                1,
                "City of Cinth",
                "Major City",
                "Settlement",
                "loc-kingdom-cinth",
                "Kingdom of Cinth",
                "/six-engines-showcase.jpg",
                "The glittering inland metropolis of Cinth near the Plains of Vistagh. Built where ancient stone meets phosphor-bronze skyship towers, Cinth hosts the rising Artificers Guild and the Lord of Cinth's high masquerade.",
                "visited",
                "38.4° N, 52.1° E (Top-Right North)",
                "map-icrandor-world",
                "map-cinth-metropolis",
                "scene-cinth-gala",
                "players",
                [
                    new("Region", "Kingdom of Cinth · Plains of Vistagh"),
                    new("Population", "~250,000"),
                    new("Government", "Lord's Noble Council & Guild Charter"),
                    new("Ruler", "Lord Varyn of Cinth"),
                    new("Primary Exports", "Artificer Brass Condensers, Chokrah Trade, Scholar Works"),
                    new("Alignment", "Lawful Neutral")
                ],
                "Founded after the ancient wars along the northeast trade artery from Vandia, Cinth grew into a center of commerce and post-Moonlight Wars innovation where non-magical engineers answer arcane dominance with craft.",
                "Noble houses hold masked galas in glass rotundas while artificer workshops hum beneath brass lightning coils and sky-dock cranes.",
                "Citizens whisper that the crimson wine served at the high courts carries an older thirst, and that the reformed Council of Magic watches every workshop.",
                ["Settlements", "Cinth", "Artificers", "Masquerade"],
                ["lore-kingdom-cinth", "lore-artificers-guild"],
                [
                    new("1:Faction:fac-artificers", "Artificers Guild of Cinth", "Post-Moonlight Wars Craft Collective", "Faction", "Major Faction", "/campaigns?inspect=fac-artificers", "players"),
                    new("1:NPC:npc-emrys", "Emrys Driothe", "Reformer of the New Council", "NPC", "Notable NPC", "/campaigns?inspect=npc-emrys", "players"),
                    new("1:NPC:npc-kutler", "Captain Kutler", "Skyship Commander", "NPC", "Notable NPC", "/campaigns?inspect=npc-kutler", "players"),
                    new("1:Quest:quest-cinth-gala", "Masquerade of the Crimson Court", "Main Quest", "Quest", "Active Quest", "/campaigns?inspect=quest-cinth-gala", "players"),
                    new("1:Location:loc-cinth-keep", "The Glass Rotunda & Keep", "Palace District", "Location", "Related Location", "/maps?scene=scene-cinth-gala", "players"),
                    new("1:Faction:fac-priors", "The Order of Priors", "Corrupted Street-School", "Faction", "Hidden Influence", "/weave?node=fac-priors", "gm")
                ],
                [
                    new("hist-cinth-founding", "Charter of the Brass Guilds", "Year 892 A.M.", null, "Founding of Settlements", "Following the Moonlight Wars, non-magical artificers established the Cinth Guildhall.", "players"),
                    new("hist-cinth-gala", "Session 14–15: Velvet & Fangs at the Masquerade", "14th of Frostfall, 1004 A.M.", 14, "Major Events", "The party arrived in Cinth, allied with the Artificers Guild, met Emrys, and defended the rotunda from vampire infiltrators.", "players")
                ],
                [
                    new("sec-cinth-1", "Hidden Vampire Covenant", "A vampire cabal seeks to turn or slay the noble attendees at the Lord of Cinth's party to seize the city.", false),
                    new("sec-cinth-2", "Emrys's Mountain Diversion", "Emrys learned the party is returning toward Vandia and intends to divert them into the runed cavern beneath the southern mountain.", false)
                ]
            ),
            new(
                "loc-ruined-chapel",
                "1:Location:loc-ruined-chapel",
                1,
                "The Ruined Chapel",
                "Quest Location",
                "Building",
                "loc-veldra-wood",
                "Whispering Woods",
                "/combat-caves.jpg",
                "A crumbling stone shrine along the old kingsroad where missing travelers and strange subterranean tremors converge.",
                "visited",
                "41.2° N, 39.8° E",
                "map-icrandor-world",
                null,
                "scene-cinth-gala",
                "players",
                [
                    new("Region", "Whispering Woods Edge"),
                    new("Status", "Active Investigation"),
                    new("Caretaker", "Brother Malric"),
                    new("Danger Rating", "Moderate (Crypt Sealed)")
                ],
                "Built centuries ago to shelter abandoned travelers under Ekkos's moonlit aspect before falling into ruin during the Moonlight Wars.",
                "Pilgrims once left silver lanterns along the crypt stairs.",
                "Locals speak of strange lights at night and rhythmic scraping deep in the stone below.",
                ["Locations", "Ruins", "Ekkos", "Session 15"],
                ["lore-ruined-chapel", "lore-ekkos-moon"],
                [
                    new("1:Quest:quest-cinth-gala", "Shadows in the Stone", "Main Story", "Quest", "Active Quest", "/campaigns", "players"),
                    new("1:Clue:clue-kildrid-tremor", "Rhythmic Scratching in Deep Stone", "Discovered Clue", "Clue", "Linked Clue", "/loom", "players")
                ],
                [
                    new("hist-chapel-15", "Session 15: Arrival at the Ruined Chapel", "18th of Frostfall, 1004 A.M.", 15, "Historical Discoveries", "The party spoke with Brother Malric and uncovered tracks leading toward the sealed crypt.", "players")
                ],
                [
                    new("sec-chapel-crypt", "Crypt Resonance with the Mountain", "The carvings beneath the chapel altar echo the containment runes binding Vaelkorath beneath the southern mountain.", false)
                ]
            ),
            new(
                "loc-vandia",
                "1:Location:loc-vandia",
                1,
                "Vandia & The Cliff House",
                "Coastal Port",
                "Settlement",
                null,
                "Bay of Forgotten Treasures",
                "/icrandor_world_dashboard.jpg",
                "Southwest coastal haven overlooking the Bay of Forgotten Treasures and the party's cliff-edge house along the marked triangle route to the Well of Life.",
                "visited",
                "18.5° S, 21.0° W",
                "map-icrandor-world",
                null,
                "scene-vandia-cliff",
                "players",
                [
                    new("Region", "Southwest Coast · Bay of Forgotten Treasures"),
                    new("Landmark", "Party Cliff-Edge House & Sky-Dock"),
                    new("Trade", "Maritime & Lost Isles Shipping")
                ],
                "Long a maritime gateway to the southern seas, Vandia serves as the party's coastal anchor and point of departure along the northeast road to Cinth.",
                "Sailors, scholars, and skyship riggers mingle along the cliffside wharves.",
                "Legends tell of the Well of Life hidden northeast of the cliff house along a sacred triangle.",
                ["Settlements", "Vandia", "Coast", "Well of Life"],
                ["lore-vandia-coast"],
                [
                    new("1:NPC:npc-kutler", "Captain Kutler", "Skyship Commander", "NPC", "Docked Ally", "/campaigns?inspect=npc-kutler", "players"),
                    new("1:Artifact:art-luminary-well", "Luminary of the Well of Life", "Sidhe Ard Creation Core", "Artifact", "Recovered Nearby", "/assets", "players")
                ],
                [
                    new("hist-vandia-departure", "Session 11: Departure from the Cliff House", "2nd of Frostfall, 1004 A.M.", 11, "Major Events", "Bearing two Luminaries, the party set out northeast from Vandia toward Cinth.", "players")
                ],
                []
            ),
            new(
                "loc-plains-red",
                "1:Location:loc-plains-red",
                1,
                "The Plains of Red",
                "Historic Battlefield",
                "Region",
                null,
                "Central Icrandor Corridor",
                "/tactical-combat-engine.jpg",
                "A wind-scoured crimson steppe along the northeast road between the fey-associated forest and the southern mountains.",
                "visited",
                "29.0° N, 36.5° E",
                "map-icrandor-world",
                null,
                "scene-plains-red",
                "players",
                [
                    new("Region", "Northeast Road (Vandia to Cinth)"),
                    new("Terrain", "Crimson Clay & Broken Fey Cairns"),
                    new("Hazard", "Southern Mountain Tremors")
                ],
                "Named for the slaughter of fey by men roughly a thousand years ago. Travelers passing toward Cinth skirt the poisoned southern mountain roots.",
                "Outcast fey leavesilent cairns of unworked stone along the ridge.",
                "Dwarven stone-scholars claim the bedrock itself weeps from a century of clawing beneath the southern peak.",
                ["Regions", "History", "Fey", "Cinth Road"],
                ["lore-plains-of-red"],
                [
                    new("1:PlayerCharacter:pc-kildrid", "Kildrid", "Dwarven Stone Scholar", "PlayerCharacter", "Sensed Tremor", "/characters?focus=pc-kildrid", "players"),
                    new("1:PlayerCharacter:pc-kycius", "Kycius", "Tabaxi Investigator", "PlayerCharacter", "Sewed Quiet Maw", "/characters?focus=pc-kycius", "players")
                ],
                [
                    new("hist-fey-slaughter", "The Slaughter of the Crimson Steppe", "First Age (~1,000 Years Ago)", null, "Wars", "Mortal armies slaughtered the fey host across the plains, giving the region its enduring name.", "players"),
                    new("hist-road-cinth", "Session 13: Stone-Sense on the Northeast Road", "9th of Frostfall, 1004 A.M.", 13, "Historical Discoveries", "Passing the mountain threat at a distance, Kildrid felt rhythmic scratching in the deep stone while Kycius sewed the Quiet Maw inside Dolly.", "players")
                ],
                []
            ),
            new(
                "loc-veldra-wood",
                "1:Location:loc-veldra-wood",
                1,
                "Mournwald & Veldra Wood",
                "Ancient Forest",
                "Region",
                null,
                "Central Canopy",
                "/icrandor_world_dashboard.jpg",
                "An ancient forest older than the current kingdoms, home to fey remnants, hermits, and forgotten shrines.",
                "known",
                "56.5° N, 37.0° E",
                "map-icrandor-world",
                null,
                null,
                "players",
                [
                    new("Region", "Northern Fey Canopy"),
                    new("Inhabitants", "Fey Remnants & Forest Wardens")
                ],
                "Bordering the old fey crossings, Veldra Wood shelters those who remember the Sidhe Ard departure.",
                "Travelers must ask permission of the boundary stones before kindling fire.",
                "They say the paths rearrange themselves when spoken of in pride.",
                ["Regions", "Fey", "Forest"],
                ["lore-veldra-wood"],
                [],
                [],
                []
            ),
            new(
                "loc-mountain-cavern",
                "1:Location:loc-mountain-cavern",
                1,
                "Runed Prison of the Bound Dragon",
                "GM Secret Vault",
                "Building",
                "loc-plains-red",
                "Southern Mountain Roots",
                "/combat-caves.jpg",
                "Deep beneath the poisoned southern forest, ancient containment runes hold Vaelkorath alive. Its blood poisons the roots above while its claws wear down and regrow against the stone.",
                "undiscovered",
                "33.2° N, 44.0° E (Hidden Subterranean)",
                "map-icrandor-world",
                "map-mountain-prison",
                "scene-mountain-prison",
                "gm",
                [
                    new("Region", "Southern Mountain Roots"),
                    new("Prisoner", "Vaelkorath (Life-Bound to Emrys)"),
                    new("Containment", "Moonlight Wars Runes & Luminaries"),
                    new("Surface Effect", "Dragon-Blood Poisoned Canopy")
                ],
                "Early in the hundred-year Moonlight Wars, Emrys trapped Vaelkorath beneath the mountain using runes and Luminaries. Moments before containment sealed its magic, the dragon bound its life to Emrys.",
                "None—sealed for a century of solitary agony.",
                "Kildrid sensed its claws scraping granite from the Cinth road.",
                ["Secrets", "Dragons", "Luminaries", "Emrys"],
                ["lore-luminaries-anelith"],
                [
                    new("1:Monster:mon-bound-dragon", "Vaelkorath, The Bound Dragon", "CR 19 Ancient Dragon", "Monster", "Bound Prisoner", "/encounters?focus=enc-mountain-caves", "gm"),
                    new("1:NPC:npc-emrys", "Emrys Driothe", "Immortal Architect", "NPC", "Life-Bound Captor", "/campaigns?inspect=npc-emrys", "gm"),
                    new("1:Secret:sec-emrys-trap", "The Life-Bound Dragon Trap", "GM Canonical Truth", "Secret", "Core Plot Secret", "/weave", "gm")
                ],
                [
                    new("hist-dragon-binding", "Binding of Vaelkorath Beneath the Mountain", "Year 901 A.M. (Moonlight Wars)", null, "Wars", "Emrys trapped the elder dragon beneath the mountain, but Vaelkorath bound its life to Emrys before the runes sealed.", "gm")
                ],
                [
                    new("sec-mountain-1", "Why Emrys Cannot Strike the Blow", "Emrys cannot kill Vaelkorath without dying himself; he plans to lure the party into slaying the dragon on their return road to Vandia.", false),
                    new("sec-mountain-2", "Fivi's Tooth-Loaded Slingshot Fate", "When the dragon is reduced to its final sliver of life, Fivi's tooth-loaded slingshot is destined to land the killing blow before Emrys steps in.", false)
                ]
            ),
            new(
                "loc-cinth-keep",
                "1:Location:loc-cinth-keep",
                1,
                "The Glass Rotunda & Artificer Quarter",
                "District",
                "District",
                "loc-cinth",
                "City of Cinth",
                "/six-engines-showcase.jpg",
                "The upper noble rotunda and adjacent phosphor-bronze guild workshops within the walls of Cinth.",
                "visited",
                "Cinth Inner Ward",
                "map-cinth-metropolis",
                null,
                "scene-cinth-gala",
                "players",
                [
                    new("Parent City", "City of Cinth", "loc-cinth", "location"),
                    new("Notable Sites", "Grand Ballroom, Artificers Guildhall, Sky-Dock", "loc-artificers-skydock", "location")
                ],
                "Built after the Moonlight Wars to showcase both noble splendor and artificer engineering.",
                "Clockwork chimes mark every hour across the district.",
                "Some claim the sky-dock lightning rods also ground stray arcane surges.",
                ["Settlements", "Cinth", "Artificers"],
                ["lore-artificers-guild"],
                [],
                [],
                [],
                "sess-15",
                "Session 15 · The Ruined Chapel & Masquerade of Cinth"
            ),
            new(
                "loc-artificers-skydock",
                "1:Location:loc-artificers-skydock",
                1,
                "Artificers Sky-Dock & Brass Foundry",
                "Guild Stronghold",
                "District",
                "loc-cinth",
                "City of Cinth",
                "/six-engines-showcase.jpg",
                "Rising directly above Cinth's eastern terraced walls, the Artificers Sky-Dock cradles phosphor-bronze airships, lightning-condenser towers, and non-magical mechanical workshops.",
                "visited",
                "48.2° E, 38.6° N (Cinth High Berth)",
                "map-icrandor-world",
                "map-cinth-metropolis",
                "scene-cinth-gala",
                "players",
                [
                    new("Parent City", "City of Cinth", "loc-cinth", "location"),
                    new("Controlling Guild", "Artificers Guild of Cinth", "lore-artificers-guild", "lore"),
                    new("Docked Vessel", "Captain Kutler's Skyship (Claimed by Fivi)", "1:NPC:npc-kutler", "entity"),
                    new("Attached Session", "Session 15 · The Ruined Chapel & Masquerade of Cinth", "sess-15", "session")
                ],
                "Constructed after the hundred-year Moonlight Wars by non-magical engineers determined never again to be helpless before wizard councils or ancient monsters.",
                "Master riggers test brass pressure-valves and clockwork ballistae while skyship hulls moor to copper lightning spires.",
                "Apprentices swear that Fivi has already chalked her name across the helm of Captain Kutler's flagship.",
                ["Factions", "Artificers", "Cinth", "Skyship"],
                ["lore-artificers-guild", "lore-kingdom-cinth"],
                [
                    new("1:Faction:fac-artificers", "Artificers Guild of Cinth", "Post-Moonlight Wars Craft Collective", "Faction", "Headquarters", "/campaigns?inspect=fac-artificers", "players"),
                    new("1:NPC:npc-kutler", "Captain Kutler", "Skyship Commander", "NPC", "Skyship Berth", "/campaigns?inspect=npc-kutler", "players"),
                    new("1:Location:loc-cinth", "City of Cinth", "Parent Metropolis", "Location", "Parent Settlement", "/weave", "players")
                ],
                [
                    new("hist-skydock-14", "Session 14: Alliance at the Sky-Dock", "14th of Frostfall, 1004 A.M.", 14, "Major Events", "The party befriended the Artificers Guild engineers and inspected the high airship moorings of Cinth.", "players")
                ],
                [],
                "sess-15",
                "Session 15 · The Ruined Chapel & Masquerade of Cinth"
            ),
            new(
                "loc-karak-thul",
                "1:Location:loc-karak-thul",
                1,
                "Karak Thul",
                "Dwarven Hold",
                "Settlement",
                null,
                "Northern Iron Peaks",
                "/combat-caves.jpg",
                "An ancient dwarven stone-hold carved into the western basalt ridges, famed for deep-crust seismic listening posts and keepers of post-war dragon lore.",
                "known",
                "23.0° E, 29.0° N",
                "map-icrandor-world",
                null,
                null,
                "players",
                [
                    new("Region", "Western Basalt Ridges", "loc-plains-red", "location"),
                    new("Scholarly Tie", "Kildrid's Stone-Sense Lineage", "lore-first-age-anelith", "lore")
                ],
                "After the Moonlight Wars, one of the surviving dragons entrusted a Luminary's safeguarding to the dwarven holds.",
                "Stone-scholars read tremors in the mountain roots like written scripture.",
                "Miners speak of a rhythmic hundred-year scratching echoing from the southern mountain range.",
                ["Settlements", "Dwarves", "Stone-Sense"],
                ["lore-first-age-anelith"],
                [
                    new("1:PlayerCharacter:pc-kildrid", "Kildrid", "Dwarven Stone Scholar", "PlayerCharacter", "Scholarly Archive", "/characters?focus=pc-kildrid", "players")
                ],
                [],
                [],
                "sess-13",
                "Session 13 · Crossing the Plains of Red"
            ),
            new(
                "loc-well-of-life",
                "1:Location:loc-well-of-life",
                1,
                "Well of Life Sanctuary",
                "Temple Ruins",
                "Building",
                "loc-vandia",
                "Vandia & The Cliff House",
                "/icrandor_world_dashboard.jpg",
                "Ancient overgrown sanctuary northeast of the party's cliff-edge house along the sacred triangle route, where the dragon-thing once guarded the Luminary of the Well of Life.",
                "visited",
                "35.0° E, 58.0° S",
                "map-icrandor-world",
                null,
                "scene-vandia-cliff",
                "players",
                [
                    new("Parent Region", "Vandia & The Cliff House", "loc-vandia", "location"),
                    new("Sacred Relic", "Luminary of the Well of Life", "lore-first-age-anelith", "lore")
                ],
                "Woven during the First Age when the Sidhe Ard called upon the Anelith to breathe life into root and river.",
                "Pilgrims from Vandia once traced the triangle route in silence.",
                "Even after the guardian fell, the basin water glows faintly under moonlight.",
                ["Locations", "Luminaries", "Well of Life", "Vandia"],
                ["lore-first-age-anelith"],
                [
                    new("1:Artifact:art-luminary-well", "Luminary of the Well of Life", "Sidhe Ard Creation Core", "Artifact", "Origin Sanctuary", "/assets", "players"),
                    new("1:Location:loc-vandia", "Vandia & The Cliff House", "Coastal Haven", "Location", "Southwest Anchor", "/weave", "players")
                ],
                [
                    new("hist-well-12", "Session 12: Trial at the Well of Life", "5th of Frostfall, 1004 A.M.", 12, "Historical Discoveries", "The party passed the Well of Life sanctuary northeast of the cliff house bearing the recovered Luminary.", "players")
                ],
                [],
                "sess-12",
                "Session 12 · Departure from Vandia & Well of Life"
            ),
            new("loc-crimson-ambush", "1:Location:loc-crimson-ambush", 1, "Crimson Court Road Ambush", "Active Encounter", "Building", "loc-plains-red", "The Plains of Red", "/tactical-combat-engine.jpg",
                "A shattered wayside watchtower along the southern edge of the Plains of Red where vampire outriders of the Crimson Court waylay envoys traveling to and from Cinth.",
                "known", "67.5° E, 55.0° S", "map-icrandor-world", null, "scene-cinth-gala", "players",
                [new("Parent Region", "The Plains of Red", "loc-plains-red", "location"), new("Linked Quest", "Masquerade of the Crimson Court", "lore-kingdom-cinth", "lore")],
                "Once a border toll-post of Cinth, now used by nocturnal thralls loyal to the vampire conspirators.",
                "Carriages avoid the southern mile-markers after sundown.", "Broken wine crates stamped with Cinth noble seals litter the ditch.",
                ["Encounters", "Cinth", "Crimson Court"], ["lore-kingdom-cinth"],
                [new("1:Quest:quest-cinth-gala", "Masquerade of the Crimson Court", "Main Quest", "Quest", "Ambush Site", "/campaigns?inspect=quest-cinth-gala", "players"), new("1:Location:loc-plains-red", "The Plains of Red", "Crimson Steppe", "Location", "Surrounding Region", "/weave", "players")],
                [], [], "sess-15", "Session 15 · The Ruined Chapel & Masquerade of Cinth")
        ],
        [2] =
        [
            new("loc-absalom-bazaar", "2:Location:loc-absalom-bazaar", 2, "Absalom Grand Bazaar & Clockwork Vaults", "Metropolis Hub", "Settlement", null, "Isle of Kortos", "/landing-assets/engines/engine-3-loommaps-atlas.jpg",
                "The bustling commercial heart of Absalom above the sealed Starstone clockwork vaults.", "visited", "Center of the Inner Sea", "map-absalom-isle", null, null, "players",
                [new("Region", "Isle of Kortos"), new("System", "Pathfinder 2e Remaster")],
                "Founded around the Starstone Cathedral.", "Merchants and pathfinders from every nation trade beneath brass awnings.", "The lower gear-vaults hum in resonance with the cathedral spire.",
                ["Settlements", "Absalom", "Starstone"], [], [], [], [])
        ],
        [3] = []
    };
}
