using LoomWeaver.Domain;

namespace LoomWeaver.Infrastructure.MySql;

public static class FallbackSeedData
{
    public static readonly IReadOnlyList<CampaignDto> Campaigns =
    [
        new(1, "shadow-of-the-mountain", "Shadow of the Mountain", "Six Luminaries, a bound dragon beneath the Southern Peaks, and the road to Cinth", "dnd5e", "Icrandor", "Act II: The Road to Cinth", 14, "Cinth — Artificers Quarter", true),
        new(2, "echoes-of-starstone", "Echoes of the Starstone", "Absalom expedition into the shattered clockwork vaults", "pf2e", "Golarion", "Act I: Siege of the Spire", 6, "Absalom Grand Bazaar", true),
        new(3, "court-of-velvet-ash", "Court of Velvet Ash", "Elysium intrigue, blood debts, and the Prince of the Harbor", "vampire_v5", "Nocturne Domain", "Coterie Chronicle III", 9, "The Gilded Conservatory", false)
    ];

    public static readonly IReadOnlyList<EntitySummaryDto> Entities =
    [
        new("1:PlayerCharacter:pc-dal", 1, "PlayerCharacter", "pc-dal", "Dal Riata", "Elf Ranger / Lineage of Edhellain · Level 7", "Observes patterns, hidden ambushes, and ancient elven architectural lies. Carries the true royal lineage of Edhellain.", "players", "approved", "/characters?focus=pc-dal"),
        new("1:PlayerCharacter:pc-fivi", 1, "PlayerCharacter", "pc-fivi", "Fivi", "Feywild Outcast Rogue / Warlock · Level 7", "Wields a tooth-loaded slingshot and carries Dolly (with Kycius's sewn pocket-maw). Uses sideways fey logic.", "players", "approved", "/characters?focus=pc-fivi"),
        new("1:PlayerCharacter:pc-kildrid", 1, "PlayerCharacter", "pc-kildrid", "Kildrid", "Dwarven Cleric / Stone Scholar · Level 7", "Reads stonework, runes, and structural history. Felt the hundred-year agony of the trapped dragon beneath the southern mountain.", "players", "approved", "/characters?focus=pc-kildrid"),
        new("1:PlayerCharacter:pc-kycius", 1, "PlayerCharacter", "pc-kycius", "Kycius", "Tabaxi Arcane Investigator · Level 7", "Watches for hidden truth. Bonded to Laksis, a small fire drake. Sewed the non-lethal dimensional pouch inside Dolly's mouth.", "players", "approved", "/characters?focus=pc-kycius"),
        new("1:PlayerCharacter:pc-munk", 1, "PlayerCharacter", "pc-munk", "Munk", "Half-Orc Vanguard Fighter · Level 7", "Brings physical courage and blunt-force clarity to the front line.", "players", "approved", "/characters?focus=pc-munk"),
        new("1:NPC:npc-emrys", 1, "NPC", "npc-emrys", "Emrys Driothe", "Reformer of the New Council of Magic", "Presents himself at the Lord of Cinth's gala as a benevolent reformer opening magic education to all classes.", "players", "approved", "/campaigns?inspect=npc-emrys"),
        new("1:NPC:npc-kutler", 1, "NPC", "npc-kutler", "Captain Kutler", "Skyship Commander · Lost Isles Investigator", "Returned from the Lost Isles piloting a brass-and-canvas artificer skyship with urgent intelligence on Chokrah rituals.", "players", "approved", "/campaigns?inspect=npc-kutler"),
        new("1:Monster:mon-bound-dragon", 1, "Monster", "mon-bound-dragon", "Vaelkorath, The Bound Dragon", "Ancient Dragon · Bound by Runes & Life-Tether", "Trapped beneath the southern mountain during the Moonlight Wars.", "gm", "approved", "/encounters?focus=enc-mountain-caves"),
        new("1:Location:loc-cinth", 1, "Location", "loc-cinth", "City of Cinth", "Inland Metropolis near the Plains of Vistagh", "A seat of high nobility, vampire infiltration at the Lord's gala, and the rising Artificers Guild.", "players", "approved", "/maps?scene=scene-cinth-gala"),
        new("1:Location:loc-vandia", 1, "Location", "loc-vandia", "Vandia & The Cliff House", "Southwest Coast · Bay of Forgotten Treasures", "Coastal port city and the party's cliffside house near the Well of Life.", "players", "approved", "/maps?scene=scene-vandia-cliff"),
        new("1:Location:loc-plains-red", 1, "Location", "loc-plains-red", "The Plains of Red", "Bloodied Corridor between Fey Forest and Southern Peaks", "Named for the slaughter of fey by men a thousand years ago along the northeast road to Cinth.", "players", "approved", "/maps?scene=scene-plains-red"),
        new("1:Faction:fac-artificers", 1, "Faction", "fac-artificers", "Artificers Guild of Cinth", "Post-Moonlight Wars Craft & Engine Collective", "Non-magical engineers building brass, clockwork, and arcane-capacitor defenses.", "players", "approved", "/campaigns?inspect=fac-artificers"),
        new("1:Faction:fac-priors", 1, "Faction", "fac-priors", "The Order of Priors", "Corrupted Street-School of Ekkos", "Publicly rescues street children; secretly siphons innate magic through Chokrah rituals.", "gm", "approved", "/campaigns?inspect=fac-priors"),
        new("1:Quest:quest-cinth-gala", 1, "Quest", "quest-cinth-gala", "Invitation to the Lord of Cinth's Masquerade", "Active Main Story Thread · Act II", "Attend the Lord of Cinth's high reception, uncover the vampire coup, and meet Emrys.", "players", "approved", "/campaigns?inspect=quest-cinth-gala"),
        new("1:Artifact:art-luminary-well", 1, "Artifact", "art-luminary-well", "Luminary of the Well of Life", "Remnant of the Anelith · Sidhe Ard Creation Core", "One of six hexagonal creation remnants left when the Sidhe Ard wove life through the Anelith.", "players", "approved", "/assets?inspect=art-luminary-well"),
        new("1:Encounter:enc-cinth-ballroom", 1, "Encounter", "enc-cinth-ballroom", "Blood on the Masquerade Glass", "Hard Encounter · 6 Combatants · Cinth Ballroom", "Cinth's noble coven strikes during the third waltz while Emrys observes.", "players", "approved", "/encounters?focus=enc-cinth-ballroom"),
        new("1:Encounter:enc-mountain-caves", 1, "Encounter", "enc-mountain-caves", "Runes of the Bound Dragon", "Deadly Boss Encounter · Southern Mountain Cavern", "The deceptive diversion into the runed cavern beneath the mountain.", "gm", "approved", "/encounters?focus=enc-mountain-caves"),
        new("1:Secret:sec-emrys-trap", 1, "Secret", "sec-emrys-trap", "Emrys's True Motive & The Life-Bound Dragon", "GM-Only Canonical Truth", "Emrys plans to divert the party into slaying the life-bound dragon so he can claim the final Luminary clue without dying.", "gm", "approved", "/weave?node=sec-emrys-trap"),
        new("1:Clue:clue-kildrid-tremor", 1, "Clue", "clue-kildrid-tremor", "Rhythmic Scratching in the Deep Stone", "Discovered Clue · Road to Cinth", "Kildrid felt claws scraping runed granite beneath the southern mountain from miles away.", "players", "approved", "/loom?query=mountain+stone+sense")
    ];

    public static readonly IReadOnlyList<AssetCardDto> Assets =
    [
        new("ast-wildflower-scatter", "Icrandor Highland Wildflower & Cairn Scatter", "scatter-biome", "LoomWeaver Studio", "free", "Free", 0, "/icrandor_world_dashboard.jpg", "Deterministic seed-based scatter collection of highland heather, mossy boulders, and weathered fey cairns.", "system-neutral"),
        new("ast-artificer-brass-pack", "Cinth Artificer Guild Brass & Capacitor Stamps", "3d-stamp", "Master Wren (Creator)", "included", "Included in Weaver", 0, "/six-engines-showcase.jpg", "34 top-down and 3D GLB steampunk-arcane workbenches, lightning coils, and skyship dock cranes.", "dnd5e"),
        new("ast-obsidian-gold-dice", "Obsidian & Antique Gold Runed Polyhedrals", "dice-skin", "LoomWeaver Studio", "purchased", "Owned", 499, "/dice-physics-engine.jpg", "Chamfered 3D physics dice set with emerald nat-20 shockwave and deep basalt roll acoustics.", "system-neutral"),
        new("ast-anelith-spell-fx", "Anelith Weave & Chokrah Overcharge Shader Pack", "spell-fx", "Arcane Foundry (Creator)", "included", "Included in Weaver", 0, "/tactical-combat-engine.jpg", "GPU particle and post-FX trajectories for Luminary Pillar, Anelith Magic Missile, and Slingshot Tooth Crit.", "dnd5e"),
        new("ast-shadow-mountain-mod", "Shadow of the Mountain — Act I & II Adventure Package (.lwp)", "adventure-module", "Jason Tromborg", "purchased", "Owned ($14.99)", 1499, "/the-weave-graph-engine.jpg", "Complete relational + Neo4j graph module with 24 linked maps, NPC motives, and zero-leak secret gates.", "dnd5e"),
        new("ast-gwaedhellain-crypts", "Underworld Dark Elf Portal & Poisoned Root Kit", "map-pack", "Deepstone Cartography", "locked", "$8.99 (85% to Creator)", 899, "/combat-caves.jpg", "Modular subterranean portal chambers, corrupted root bridges, and bioluminescent fungal cliffs.", "system-neutral")
    ];

    public static readonly IReadOnlyList<SceneSummaryDto> Scenes =
    [
        new("scene-cinth-gala", 1, "Cinth Grand Masquerade & Glass Rotunda", "City of Cinth", "2D + 3D Linked", 36, 28, "Urban Noble Estate", "Clear Starlight", "Chandelier Warm Gold", "players", 12),
        new("scene-plains-red", 1, "The Plains of Red & Broken Fey Cairns", "Northeast Cinth Road", "2D + 3D Linked", 44, 32, "Crimson Steppe", "Ash Wind", "Dusk Emerald Rim", "players", 8),
        new("scene-vandia-cliff", 1, "Vandia Cliff House & Well of Life Approach", "Bay of Forgotten Treasures", "2D + 3D Linked", 32, 24, "Coastal Cliff", "Sea Fog", "Moonlit Beacon", "players", 15),
        new("scene-mountain-prison", 1, "Runed Cavern of the Bound Dragon", "Southern Mountain Roots", "2D + 3D Linked", 48, 36, "Subterranean Rune Vault", "Poison Spore Haze", "Runic Crimson & Emerald", "gm", 5)
    ];

    public static IReadOnlyList<EntitySummaryDto> FilterEntities(int campaignId, bool isGm, string? entityType) =>
        Entities
            .Where(e => e.CampaignId == campaignId)
            .Where(e => isGm || e.Visibility is "public" or "players")
            .Where(e => string.IsNullOrEmpty(entityType) || string.Equals(e.EntityType, entityType, StringComparison.OrdinalIgnoreCase))
            .ToList();
}
