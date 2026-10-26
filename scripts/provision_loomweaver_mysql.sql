-- =============================================================================
-- LoomWeaver V2 Authoritative MySQL Schema & Seed ("loomweaver" database)
-- Strictly isolated from legacy "jane_scrum"
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `loomweaver`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `loomweaver_test`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'loomweaver_app'@'%' IDENTIFIED BY 'Sp34kFri3nd4nd3nt3r!';
CREATE USER IF NOT EXISTS 'loomweaver_app'@'localhost' IDENTIFIED BY 'Sp34kFri3nd4nd3nt3r!';
GRANT ALL PRIVILEGES ON `loomweaver`.* TO 'loomweaver_app'@'%';
GRANT ALL PRIVILEGES ON `loomweaver`.* TO 'loomweaver_app'@'localhost';
GRANT ALL PRIVILEGES ON `loomweaver_test`.* TO 'loomweaver_app'@'%';
GRANT ALL PRIVILEGES ON `loomweaver_test`.* TO 'loomweaver_app'@'localhost';
FLUSH PRIVILEGES;

USE `loomweaver`;

-- 1. Subscription Tiers (ui-and-product-rules.md)
CREATE TABLE IF NOT EXISTS `lw_subscription_tiers` (
  `code` VARCHAR(32) NOT NULL PRIMARY KEY,
  `name` VARCHAR(64) NOT NULL,
  `monthly_cents` INT NOT NULL DEFAULT 0,
  `annual_cents` INT NOT NULL DEFAULT 0,
  `max_active_campaigns` INT NOT NULL DEFAULT 1,
  `storage_limit_mb` INT NOT NULL DEFAULT 250,
  `includes_weave_ai` TINYINT(1) NOT NULL DEFAULT 0,
  `creator_royalty_pct` INT NOT NULL DEFAULT 85,
  `summary` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users
CREATE TABLE IF NOT EXISTS `lw_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `display_name` VARCHAR(128) NOT NULL,
  `role` ENUM('gm', 'player', 'creator', 'admin') NOT NULL DEFAULT 'gm',
  `tier_code` VARCHAR(32) NOT NULL DEFAULT 'archweaver',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lw_users_tier` FOREIGN KEY (`tier_code`) REFERENCES `lw_subscription_tiers` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Campaigns
CREATE TABLE IF NOT EXISTS `lw_campaigns` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `slug` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(160) NOT NULL,
  `subtitle` VARCHAR(255) NOT NULL,
  `system_code` ENUM('dnd5e', 'pf2e', 'vampire_v5') NOT NULL DEFAULT 'dnd5e',
  `gm_user_id` BIGINT UNSIGNED NOT NULL,
  `world_name` VARCHAR(128) NOT NULL,
  `current_act` VARCHAR(128) NOT NULL,
  `current_session_number` INT NOT NULL DEFAULT 1,
  `current_location_name` VARCHAR(128) NOT NULL,
  `weave_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lw_campaigns_gm` FOREIGN KEY (`gm_user_id`) REFERENCES `lw_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Campaign Entities (Bridged to Neo4j via {campaign_id}:{entity_type}:{entity_key})
CREATE TABLE IF NOT EXISTS `lw_entities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `entity_type` ENUM('PlayerCharacter','NPC','Monster','Location','Faction','Quest','Artifact','Encounter','Session','Event','Secret','Clue','Claim','SourceRecord') NOT NULL,
  `entity_key` VARCHAR(64) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `subtitle` VARCHAR(160) NOT NULL DEFAULT '',
  `summary` TEXT NOT NULL,
  `visibility` ENUM('public', 'players', 'gm') NOT NULL DEFAULT 'players',
  `canon_status` ENUM('approved', 'draft') NOT NULL DEFAULT 'approved',
  `route_link` VARCHAR(255) NOT NULL DEFAULT '/campaigns',
  `metadata_json` JSON NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_lw_entity_composite` (`campaign_id`, `entity_type`, `entity_key`),
  KEY `ix_lw_entities_visibility` (`campaign_id`, `visibility`),
  CONSTRAINT `fk_lw_entities_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Map Scenes (2D/3D Map Studio & VTT)
CREATE TABLE IF NOT EXISTS `lw_scenes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `scene_key` VARCHAR(64) NOT NULL UNIQUE,
  `name` VARCHAR(160) NOT NULL,
  `region_name` VARCHAR(128) NOT NULL,
  `mode_support` VARCHAR(64) NOT NULL DEFAULT '2D + 3D Linked',
  `grid_cols` INT NOT NULL DEFAULT 32,
  `grid_rows` INT NOT NULL DEFAULT 24,
  `biome` VARCHAR(64) NOT NULL DEFAULT 'Temperate Highland',
  `weather_preset` VARCHAR(64) NOT NULL DEFAULT 'Dusk Mist',
  `lighting_profile` VARCHAR(64) NOT NULL DEFAULT 'Torchlit Dynamic',
  `visibility` ENUM('public', 'players', 'gm') NOT NULL DEFAULT 'players',
  `revision` INT NOT NULL DEFAULT 1,
  `scene_config_json` JSON NULL,
  CONSTRAINT `fk_lw_scenes_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Assets & Marketplace Catalog (lw-asset-card contract)
CREATE TABLE IF NOT EXISTS `lw_assets` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(160) NOT NULL,
  `category` ENUM('map-pack','3d-stamp','scatter-biome','dice-skin','spell-fx','audio-ambience','adventure-module') NOT NULL,
  `creator_name` VARCHAR(128) NOT NULL,
  `entitlement` ENUM('free', 'included', 'purchased', 'locked') NOT NULL DEFAULT 'free',
  `price_label` VARCHAR(32) NOT NULL DEFAULT 'Free',
  `price_cents` INT NOT NULL DEFAULT 0,
  `preview_url` VARCHAR(500) NULL,
  `summary` VARCHAR(255) NOT NULL,
  `system_code` VARCHAR(32) NOT NULL DEFAULT 'system-neutral',
  `tags_json` JSON NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Event-Backed Statistics (Damage, Nat20s, Last Hits, Radar Axes)
CREATE TABLE IF NOT EXISTS `lw_combat_telemetry` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `character_key` VARCHAR(64) NOT NULL,
  `character_name` VARCHAR(128) NOT NULL,
  `class_summary` VARCHAR(128) NOT NULL,
  `total_damage_dealt` INT NOT NULL DEFAULT 0,
  `damage_vs_dragons` INT NOT NULL DEFAULT 0,
  `damage_vs_undead` INT NOT NULL DEFAULT 0,
  `damage_vs_constructs` INT NOT NULL DEFAULT 0,
  `last_hits` INT NOT NULL DEFAULT 0,
  `natural_20_count` INT NOT NULL DEFAULT 0,
  `natural_1_count` INT NOT NULL DEFAULT 0,
  `healing_done` INT NOT NULL DEFAULT 0,
  `clues_discovered` INT NOT NULL DEFAULT 0,
  `radar_offense` INT NOT NULL DEFAULT 70,
  `radar_defense` INT NOT NULL DEFAULT 70,
  `radar_support` INT NOT NULL DEFAULT 70,
  `radar_control` INT NOT NULL DEFAULT 70,
  `radar_lore` INT NOT NULL DEFAULT 70,
  `radar_tactics` INT NOT NULL DEFAULT 70,
  UNIQUE KEY `uk_lw_telemetry_char` (`campaign_id`, `character_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Transactional Outbox for Neo4j Projections
CREATE TABLE IF NOT EXISTS `lw_outbox_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `composite_key` VARCHAR(160) NOT NULL,
  `payload_json` JSON NOT NULL,
  `projected_to_neo4j` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO `lw_subscription_tiers` (`code`, `name`, `monthly_cents`, `annual_cents`, `max_active_campaigns`, `storage_limit_mb`, `includes_weave_ai`, `creator_royalty_pct`, `summary`) VALUES
('spark', 'Spark Free', 0, 0, 1, 250, 0, 85, 'Free forever player seat, The Loom campaign memory, 2D map export, and core character sheets.'),
('threadkeeper', 'Threadkeeper', 600, 6000, 3, 2048, 1, 85, 'GM campaign hosting, 2D/3D Map Studio, custom stamps, and The Loom deep-link memory.'),
('weaver', 'Weaver', 1200, 12000, 10, 10240, 1, 85, 'Full 3D VTT lighting & weather, Action/Effect Builder, The Weave AI draft companion, and Neo4j World Graph.'),
('archweaver', 'Archweaver', 2400, 24000, 999, 51200, 1, 85, 'Unlimited campaigns, creator marketplace publishing with 85/15 split, and priority 3D asset packs.')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `summary`=VALUES(`summary`);

INSERT INTO `lw_users` (`id`, `email`, `username`, `display_name`, `role`, `tier_code`) VALUES
(1, 'jtromborg1@gmail.com', 'GeoJason', 'Jason (Archweaver GM)', 'gm', 'archweaver'),
(2, 'player@loom-weaver.com', 'DalPlayer', 'Dal (Party View)', 'player', 'spark')
ON DUPLICATE KEY UPDATE `display_name`=VALUES(`display_name`), `tier_code`=VALUES(`tier_code`);

INSERT INTO `lw_campaigns` (`id`, `slug`, `name`, `subtitle`, `system_code`, `gm_user_id`, `world_name`, `current_act`, `current_session_number`, `current_location_name`, `weave_enabled`) VALUES
(1, 'shadow-of-the-mountain', 'Shadow of the Mountain', 'Six Luminaries, a bound dragon beneath the Southern Peaks, and the road to Cinth', 'dnd5e', 1, 'Icrandor', 'Act II: The Road to Cinth', 14, 'Cinth — Artificers Quarter', 1),
(2, 'echoes-of-starstone', 'Echoes of the Starstone', 'Absalom expedition into the shattered clockwork vaults', 'pf2e', 1, 'Golarion', 'Act I: Siege of the Spire', 6, 'Absalom Grand Bazaar', 1),
(3, 'court-of-velvet-ash', 'Court of Velvet Ash', 'Elysium intrigue, blood debts, and the Prince of the Harbor', 'vampire_v5', 1, 'Nocturne Domain', 'Coterie Chronicle III', 9, 'The Gilded Conservatory', 0)
ON DUPLICATE KEY UPDATE `subtitle`=VALUES(`subtitle`), `current_act`=VALUES(`current_act`);

-- Seed Canonical Entities for Campaign 1 (Icrandor / Shadow of the Mountain)
INSERT INTO `lw_entities` (`campaign_id`, `entity_type`, `entity_key`, `name`, `subtitle`, `summary`, `visibility`, `canon_status`, `route_link`, `metadata_json`) VALUES
(1, 'PlayerCharacter', 'pc-dal', 'Dal Riata', 'Elf Ranger / Lineage of Edhellain · Level 7', 'Observes patterns, hidden ambushes, and ancient elven architectural lies. Unbeknownst to the wider realm, carries the true royal lineage of Edhellain.', 'players', 'approved', '/characters?focus=pc-dal', JSON_OBJECT('ac', 17, 'hp', 62, 'maxHp', 62, 'levelUpEligible', true, 'system', 'dnd5e')),
(1, 'PlayerCharacter', 'pc-fivi', 'Fivi', 'Feywild Outcast Rogue / Warlock · Level 7', 'Wields a tooth-loaded slingshot and carries Dolly (with Kycius''s sewn pocket-maw). Masks deep fear of never belonging behind sideways fey logic.', 'players', 'approved', '/characters?focus=pc-fivi', JSON_OBJECT('ac', 16, 'hp', 51, 'maxHp', 51, 'levelUpEligible', true, 'system', 'dnd5e')),
(1, 'PlayerCharacter', 'pc-kildrid', 'Kildrid', 'Dwarven Cleric / Stone Scholar · Level 7', 'Reads stonework, runes, and structural history. Felt the hundred-year agony of the trapped dragon beneath the southern mountain from miles away.', 'players', 'approved', '/characters?focus=pc-kildrid', JSON_OBJECT('ac', 19, 'hp', 68, 'maxHp', 68, 'levelUpEligible', false, 'system', 'dnd5e')),
(1, 'PlayerCharacter', 'pc-kycius', 'Kycius', 'Tabaxi Arcane Investigator · Level 7', 'Watches for hidden truth. Bonded to Laksis, a small fire drake. Sewed the non-lethal dimensional pouch inside Dolly''s mouth for Fivi.', 'players', 'approved', '/characters?focus=pc-kycius', JSON_OBJECT('ac', 16, 'hp', 54, 'maxHp', 54, 'levelUpEligible', false, 'system', 'dnd5e')),
(1, 'PlayerCharacter', 'pc-munk', 'Munk', 'Half-Orc Vanguard Fighter · Level 7', 'Brings physical courage and blunt-force clarity to the front line. Raised and trained by an old master in his home village near the northern route.', 'players', 'approved', '/characters?focus=pc-munk', JSON_OBJECT('ac', 18, 'hp', 79, 'maxHp', 79, 'levelUpEligible', true, 'system', 'dnd5e')),
(1, 'NPC', 'npc-emrys', 'Emrys Driothe', 'Reformer of the New Council of Magic', 'Presents himself at the Lord of Cinth''s gala as a benevolent reformer opening magic education to all classes.', 'players', 'approved', '/campaigns?inspect=npc-emrys', JSON_OBJECT('role', 'Council Reformer', 'location', 'Cinth Gala Hall')),
(1, 'NPC', 'npc-kutler', 'Captain Kutler', 'Skyship Commander · Lost Isles Investigator', 'Returned from the Lost Isles piloting a brass-and-canvas artificer skyship with urgent intelligence on Chokrah rituals and the Priors.', 'players', 'approved', '/campaigns?inspect=npc-kutler', JSON_OBJECT('role', 'Skyship Captain', 'location', 'Cinth Sky-Dock')),
(1, 'Monster', 'mon-bound-dragon', 'Vaelkorath, The Bound Dragon Under the Mountain', 'Ancient Dragon · Bound by Runes & Life-Tether', 'Trapped beneath the southern mountain during the Moonlight Wars. Its claws have worn down and regrown for a century clawing at the containment runes.', 'gm', 'approved', '/encounters?focus=enc-mountain-caves', JSON_OBJECT('cr', '19', 'ac', 20, 'hp', 310)),
(1, 'Location', 'loc-cinth', 'City of Cinth', 'Inland Metropolis near the Plains of Vistagh', 'A seat of high nobility, vampire infiltration at the Lord''s gala, and the rising Artificers Guild.', 'players', 'approved', '/maps?scene=scene-cinth-gala', JSON_OBJECT('region', 'Plains of Vistagh')),
(1, 'Location', 'loc-vandia', 'Vandia & The Cliff House', 'Southwest Coast · Bay of Forgotten Treasures', 'Coastal port city and the party''s cliffside house near the marked triangle route to the Well of Life.', 'players', 'approved', '/maps?scene=scene-vandia-cliff', JSON_OBJECT('region', 'Southwest Coast')),
(1, 'Location', 'loc-plains-red', 'The Plains of Red', 'Bloodied Corridor between Fey Forest and Southern Peaks', 'Named for the slaughter of fey by men a thousand years ago along the northeast road to Cinth.', 'players', 'approved', '/maps?scene=scene-plains-red', JSON_OBJECT('region', 'Central Corridor')),
(1, 'Faction', 'fac-artificers', 'Artificers Guild of Cinth', 'Post-Moonlight Wars Craft & Engine Collective', 'Non-magical engineers and inventors building brass, clockwork, and arcane-capacitor defenses so ordinary people are never helpless before mages again.', 'players', 'approved', '/campaigns?inspect=fac-artificers', JSON_OBJECT('disposition', 'Allied')),
(1, 'Faction', 'fac-priors', 'The Order of Priors', 'Corrupted Street-School of Ekkos', 'Publicly rescues street children and teaches discipline; secretly siphons innate magic from students through Chokrah rituals.', 'gm', 'approved', '/campaigns?inspect=fac-priors', JSON_OBJECT('disposition', 'Hostile Secret')),
(1, 'Quest', 'quest-cinth-gala', 'Invitation to the Lord of Cinth''s Masquerade', 'Active Main Story Thread · Act II', 'Attend the Lord of Cinth''s high reception, uncover the vampire coup targeting the city nobility, and meet the Council reformer Emrys.', 'players', 'approved', '/campaigns?inspect=quest-cinth-gala', JSON_OBJECT('status', 'Active', 'xpReward', 4500)),
(1, 'Quest', 'quest-chokrah-ledger', 'The Chokrah Cargo & Priors Ledger', 'Investigation Thread · Act II', 'Trace the smuggled Chokrah shipments from the Lost Isles to the Council''s Prior academies with Captain Kutler.', 'players', 'approved', '/campaigns?inspect=quest-chokrah-ledger', JSON_OBJECT('status', 'Active', 'xpReward', 3200)),
(1, 'Artifact', 'art-luminary-well', 'Luminary of the Well of Life', 'Remnant of the Anelith · Sidhe Ard Creation Core', 'One of six hexagonal creation remnants left when the Sidhe Ard wove life through the Anelith. Carried by the party.', 'players', 'approved', '/assets?inspect=art-luminary-well', JSON_OBJECT('rarity', 'Artifact')),
(1, 'Encounter', 'enc-cinth-ballroom', 'Blood on the Masquerade Glass', 'Hard Encounter · 6 Combatants · Cinth Ballroom', 'Cinth''s noble coven strikes during the third waltz while Emrys observes the party''s capabilities.', 'players', 'approved', '/encounters?focus=enc-cinth-ballroom', JSON_OBJECT('difficulty', 'Hard', 'round', 3)),
(1, 'Encounter', 'enc-mountain-caves', 'Runes of the Bound Dragon', 'Deadly Boss Encounter · Southern Mountain Cavern', 'The deceptive diversion into the runed cavern beneath the mountain where Vaelkorath claws at his century-old prison.', 'gm', 'approved', '/encounters?focus=enc-mountain-caves', JSON_OBJECT('difficulty', 'Deadly', 'round', 1)),
(1, 'Session', 'ses-14', 'Session 14: Brass Gears & Velvet Fangs', 'Recorded Session Chronicle · Act II', 'The party arrived in Cinth, befriended the Artificers Guild, tested Kycius''s new pocket-maw inside Dolly, and entered the Lord''s gala.', 'players', 'approved', '/campaigns?session=ses-14', JSON_OBJECT('sessionNumber', 14)),
(1, 'Secret', 'sec-emrys-trap', 'Emrys''s True Motive & The Life-Bound Dragon', 'GM-Only Canonical Truth', 'Emrys carries Sidhe Ard blood, started the Moonlight Wars, steals children''s magic via the Priors, and plans to trick the party into slaying the life-bound dragon so he can extract the final Luminary location without dying.', 'gm', 'approved', '/weave?node=sec-emrys-trap', JSON_OBJECT('truthStatus', 'Undiscovered by Party')),
(1, 'Clue', 'clue-kildrid-tremor', 'Rhythmic Scratching in the Deep Stone', 'Discovered Clue · Road to Cinth', 'Kildrid felt a vast, rhythmic scratching beneath the southern mountain—claws scraping runed granite for a hundred years.', 'players', 'approved', '/loom?query=mountain+stone+sense', JSON_OBJECT('status', 'discovered')),
(1, 'Clue', 'clue-chokrah-manifest', 'Signed Chokrah Siphon Manifest', 'Undiscovered GM Evidence', 'Hidden shipping manifest proving Chokrah shipments feed the Priors'' magic-extraction crucible for a dragon-scale ritual.', 'gm', 'approved', '/weave?node=clue-chokrah-manifest', JSON_OBJECT('status', 'undiscovered')),
(1, 'Claim', 'claim-council-reform', 'Public Claim: "The New Council Protects Every Gift"', 'Disputed Political Narrative', 'Emrys claims the reformed Council registers all magic users solely to protect clerics, warlocks, and self-taught casters from persecution.', 'players', 'draft', '/weave?node=claim-council-reform', JSON_OBJECT('believedBy', 'Citizens of Cinth'))
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `summary`=VALUES(`summary`), `visibility`=VALUES(`visibility`), `canon_status`=VALUES(`canon_status`);

-- Seed Map Scenes
INSERT INTO `lw_scenes` (`campaign_id`, `scene_key`, `name`, `region_name`, `mode_support`, `grid_cols`, `grid_rows`, `biome`, `weather_preset`, `lighting_profile`, `visibility`, `revision`, `scene_config_json`) VALUES
(1, 'scene-cinth-gala', 'Cinth Grand Masquerade & Glass Rotunda', 'City of Cinth', '2D + 3D Linked', 36, 28, 'Urban Noble Estate', 'Clear Starlight', 'Chandelier Warm Gold', 'players', 12, JSON_OBJECT('stamps', 48, 'lights', 14, 'elevationChunks', 6, 'waterSplines', 1)),
(1, 'scene-plains-red', 'The Plains of Red & Broken Fey Cairns', 'Northeast Cinth Road', '2D + 3D Linked', 44, 32, 'Crimson Steppe', 'Ash Wind', 'Dusk Emerald Rim', 'players', 8, JSON_OBJECT('stamps', 64, 'lights', 6, 'elevationChunks', 12, 'waterSplines', 2)),
(1, 'scene-vandia-cliff', 'Vandia Cliff House & Well of Life Approach', 'Bay of Forgotten Treasures', '2D + 3D Linked', 32, 24, 'Coastal Cliff', 'Sea Fog', 'Moonlit Beacon', 'players', 15, JSON_OBJECT('stamps', 39, 'lights', 9, 'elevationChunks', 9, 'waterSplines', 3)),
(1, 'scene-mountain-prison', 'Runed Cavern of the Bound Dragon', 'Southern Mountain Roots', '2D + 3D Linked', 48, 36, 'Subterranean Rune Vault', 'Poison Spore Haze', 'Runic Crimson & Emerald', 'gm', 5, JSON_OBJECT('stamps', 52, 'lights', 18, 'elevationChunks', 16, 'waterSplines', 1))
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `visibility`=VALUES(`visibility`), `revision`=VALUES(`revision`);

-- Seed Assets (Shared across Asset Library, Marketplace, Map Studio, Dice Forge)
INSERT INTO `lw_assets` (`id`, `name`, `category`, `creator_name`, `entitlement`, `price_label`, `price_cents`, `preview_url`, `summary`, `system_code`, `tags_json`) VALUES
('ast-wildflower-scatter', 'Icrandor Highland Wildflower & Cairn Scatter', 'scatter-biome', 'LoomWeaver Studio', 'free', 'Free', 0, '/icrandor_world_dashboard.jpg', 'Deterministic seed-based scatter collection of highland heather, mossy boulders, and weathered fey cairns.', 'system-neutral', JSON_ARRAY('scatter', 'terrain', 'free')),
('ast-artificer-brass-pack', 'Cinth Artificer Guild Brass & Capacitor Stamps', '3d-stamp', 'Master Wren (Creator)', 'included', 'Included in Weaver', 0, '/six-engines-showcase.jpg', '34 top-down and 3D GLB steampunk-arcane workbenches, lightning coils, and skyship dock cranes.', 'dnd5e', JSON_ARRAY('3d-glb', 'steampunk', 'cinth')),
('ast-obsidian-gold-dice', 'Obsidian & Antique Gold Runed Polyhedrals', 'dice-skin', 'LoomWeaver Studio', 'purchased', 'Owned', 499, '/dice-physics-engine.jpg', 'Chamfered 3D physics dice set with emerald nat-20 shockwave and deep basalt roll acoustics.', 'system-neutral', JSON_ARRAY('dice', 'physics', 'cosmetic')),
('ast-anelith-spell-fx', 'Anelith Weave & Chokrah Overcharge Shader Pack', 'spell-fx', 'Arcane Foundry (Creator)', 'included', 'Included in Weaver', 0, '/tactical-combat-engine.jpg', 'GPU particle and post-FX trajectories for Luminary Pillar, Anelith Magic Missile, and Slingshot Tooth Crit.', 'dnd5e', JSON_ARRAY('fx', 'shaders', 'combat')),
('ast-shadow-mountain-mod', 'Shadow of the Mountain — Act I & II Adventure Package (.lwp)', 'adventure-module', 'Jason Tromborg', 'purchased', 'Owned ($14.99)', 1499, '/the-weave-graph-engine.jpg', 'Complete relational + Neo4j graph module with 24 linked maps, NPC motives, and zero-leak secret gates.', 'dnd5e', JSON_ARRAY('module', 'neo4j', 'campaign')),
('ast-gwaedhellain-crypts', 'Underworld Dark Elf Portal & Poisoned Root Kit', 'map-pack', 'Deepstone Cartography', 'locked', '$8.99 (85% to Creator)', 899, '/combat-caves.jpg', 'Modular subterranean portal chambers, corrupted root bridges, and bioluminescent fungal cliffs.', 'system-neutral', JSON_ARRAY('premium', 'underworld', 'map-pack'))
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `entitlement`=VALUES(`entitlement`), `price_label`=VALUES(`price_label`);

-- Seed Event-Backed Statistics
INSERT INTO `lw_combat_telemetry` (`campaign_id`, `character_key`, `character_name`, `class_summary`, `total_damage_dealt`, `damage_vs_dragons`, `damage_vs_undead`, `damage_vs_constructs`, `last_hits`, `natural_20_count`, `natural_1_count`, `healing_done`, `clues_discovered`, `radar_offense`, `radar_defense`, `radar_support`, `radar_control`, `radar_lore`, `radar_tactics`) VALUES
(1, 'pc-dal', 'Dal Riata', 'Elf Ranger · Horizon Scout', 418, 112, 194, 112, 9, 7, 2, 34, 14, 86, 72, 64, 78, 88, 94),
(1, 'pc-fivi', 'Fivi', 'Fey Rogue / Warlock · Slingshot Trickster', 389, 145, 160, 84, 12, 11, 5, 18, 11, 88, 62, 58, 84, 76, 81),
(1, 'pc-kildrid', 'Kildrid', 'Dwarven Cleric · Stone Lorekeeper', 264, 68, 142, 54, 4, 5, 1, 312, 16, 64, 91, 95, 79, 96, 85),
(1, 'pc-kycius', 'Kycius', 'Tabaxi Arcane Investigator', 342, 94, 138, 110, 6, 6, 2, 45, 19, 79, 68, 74, 92, 98, 90),
(1, 'pc-munk', 'Munk', 'Half-Orc Vanguard Fighter', 512, 164, 218, 130, 15, 9, 3, 12, 6, 96, 94, 52, 74, 60, 82)
ON DUPLICATE KEY UPDATE `total_damage_dealt`=VALUES(`total_damage_dealt`), `last_hits`=VALUES(`last_hits`);


-- 9. World Atlas Maps (World -> Continent -> Region -> Settlement -> District -> Building)
CREATE TABLE IF NOT EXISTS `lw_world_maps` (
  `map_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `scope_level` ENUM('World','Continent','Region','Settlement','District','Building') NOT NULL DEFAULT 'World',
  `parent_map_id` VARCHAR(64) NULL,
  `parent_location_key` VARCHAR(64) NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `linked_scene_key` VARCHAR(64) NULL,
  `scale_label` VARCHAR(64) NOT NULL DEFAULT '0 — 100 — 200 Miles',
  `compass_orientation` VARCHAR(64) NOT NULL DEFAULT 'Top-Right North',
  `width_units` INT NOT NULL DEFAULT 1000,
  `height_units` INT NOT NULL DEFAULT 600,
  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
  CONSTRAINT `fk_lw_world_maps_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. World Locations & Hierarchy
CREATE TABLE IF NOT EXISTS `lw_world_locations` (
  `location_key` VARCHAR(64) NOT NULL PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `composite_key` VARCHAR(160) NOT NULL,
  `name` VARCHAR(160) NOT NULL,
  `location_type` VARCHAR(64) NOT NULL,
  `hierarchy_level` ENUM('World','Continent','Region','Settlement','District','Building') NOT NULL DEFAULT 'Settlement',
  `parent_location_key` VARCHAR(64) NULL,
  `map_id` VARCHAR(64) NULL,
  `child_map_id` VARCHAR(64) NULL,
  `linked_scene_key` VARCHAR(64) NULL,
  `x_percent` DECIMAL(6,2) NOT NULL DEFAULT 50.00,
  `y_percent` DECIMAL(6,2) NOT NULL DEFAULT 50.00,
  `discovery_status` ENUM('visited','known','rumor','undiscovered') NOT NULL DEFAULT 'known',
  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
  `artwork_url` VARCHAR(500) NOT NULL,
  `description` TEXT NOT NULL,
  `historical_background` TEXT NOT NULL,
  `culture_and_traditions` TEXT NOT NULL,
  `local_myths` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lw_world_locations_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Lore Library Articles (System-Agnostic Extensible Taxonomy)
CREATE TABLE IF NOT EXISTS `lw_lore_entries` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `composite_key` VARCHAR(160) NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `subtitle` VARCHAR(200) NOT NULL DEFAULT '',
  `category` VARCHAR(64) NOT NULL,
  `excerpt` VARCHAR(500) NOT NULL,
  `content` TEXT NOT NULL,
  `artwork_url` VARCHAR(500) NOT NULL,
  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
  `archived` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lw_lore_entries_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. World History Events (Fictional Era Dates vs Real Session Dates)
CREATE TABLE IF NOT EXISTS `lw_world_history_events` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `title` VARCHAR(160) NOT NULL,
  `era_name` VARCHAR(128) NOT NULL,
  `world_date_label` VARCHAR(128) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 100,
  `session_number` INT NULL,
  `real_session_date_label` VARCHAR(64) NOT NULL DEFAULT '',
  `category` VARCHAR(64) NOT NULL,
  `summary` TEXT NOT NULL,
  `location_key` VARCHAR(64) NULL,
  `map_id` VARCHAR(64) NULL,
  `visibility` ENUM('public','players','gm') NOT NULL DEFAULT 'players',
  CONSTRAINT `fk_lw_world_history_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `lw_campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
