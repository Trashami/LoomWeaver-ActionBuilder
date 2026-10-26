// =============================================================================
// LoomWeaver V2 Authoritative Neo4j Node Graph Schema & Seed ("loomweaver")
// Composite Key Standard: {campaignId}:{entityType}:{entityKey}
// =============================================================================

CREATE CONSTRAINT lw_entity_composite IF NOT EXISTS
FOR (e:Entity) REQUIRE (e.namespace, e.campaignId, e.compositeKey) IS UNIQUE;

CREATE CONSTRAINT lw_adventure_node_unique IF NOT EXISTS
FOR (a:AdventureNode) REQUIRE (a.namespace, a.campaignId, a.nodeId) IS UNIQUE;

CREATE INDEX lw_entity_visibility IF NOT EXISTS
FOR (e:Entity) ON (e.namespace, e.campaignId, e.visibility);

// Rebuild node graph cleanly ONLY within the 'loomweaver' namespace (never unscoped)
MATCH (n {namespace: 'loomweaver'}) DETACH DELETE n;

MERGE (camp:Entity:Campaign {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'shadow-of-the-mountain',
  compositeKey: '1:Campaign:shadow-of-the-mountain',
  entityType: 'Campaign',
  entityKey: 'shadow-of-the-mountain',
  name: 'Shadow of the Mountain',
  subtitle: 'D&D 5e · Act II: The Road to Cinth',
  visibility: 'public',
  canonStatus: 'approved',
  route: '/campaigns'
})
MERGE (world:Entity:World {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'icrandor',
  compositeKey: '1:World:icrandor',
  entityType: 'World',
  entityKey: 'icrandor',
  name: 'Icrandor',
  subtitle: 'Realm of the Six Luminaries',
  visibility: 'public',
  canonStatus: 'approved',
  route: '/maps'
})
MERGE (party:Entity:Party {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'vanguard-of-vandia',
  compositeKey: '1:Party:vanguard-of-vandia',
  entityType: 'Party',
  entityKey: 'vanguard-of-vandia',
  name: 'Companions of the Cliff House',
  subtitle: 'Dal, Fivi, Kildrid, Kycius & Munk',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters'
})
MERGE (cinth:Entity:Location {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'loc-cinth',
  compositeKey: '1:Location:loc-cinth',
  entityType: 'Location',
  entityKey: 'loc-cinth',
  name: 'City of Cinth',
  subtitle: 'Inland Metropolis near the Plains of Vistagh',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/maps?scene=scene-cinth-gala'
})
MERGE (vandia:Entity:Location {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'loc-vandia',
  compositeKey: '1:Location:loc-vandia',
  entityType: 'Location',
  entityKey: 'loc-vandia',
  name: 'Vandia & Cliff House',
  subtitle: 'Southwest Coast · Bay of Forgotten Treasures',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/maps?scene=scene-vandia-cliff'
})
MERGE (plainsRed:Entity:Location {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'loc-plains-red',
  compositeKey: '1:Location:loc-plains-red',
  entityType: 'Location',
  entityKey: 'loc-plains-red',
  name: 'The Plains of Red',
  subtitle: 'Ancient Fey Slaughter Grounds',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/maps?scene=scene-plains-red'
})
MERGE (mountainVault:Entity:Location {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'loc-mountain-vault',
  compositeKey: '1:Location:loc-mountain-vault',
  entityType: 'Location',
  entityKey: 'loc-mountain-vault',
  name: 'Runed Cavern Under the Mountain',
  subtitle: 'Southern Mountain Prison',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/maps?scene=scene-mountain-prison'
})
MERGE (dal:Entity:PlayerCharacter {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'pc-dal',
  compositeKey: '1:PlayerCharacter:pc-dal',
  entityType: 'PlayerCharacter',
  entityKey: 'pc-dal',
  name: 'Dal Riata',
  subtitle: 'Elf Ranger · True Lineage of Edhellain',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters?focus=pc-dal'
})
MERGE (fivi:Entity:PlayerCharacter {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'pc-fivi',
  compositeKey: '1:PlayerCharacter:pc-fivi',
  entityType: 'PlayerCharacter',
  entityKey: 'pc-fivi',
  name: 'Fivi',
  subtitle: 'Feywild Outcast · Keeper of Dolly',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters?focus=pc-fivi'
})
MERGE (kildrid:Entity:PlayerCharacter {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'pc-kildrid',
  compositeKey: '1:PlayerCharacter:pc-kildrid',
  entityType: 'PlayerCharacter',
  entityKey: 'pc-kildrid',
  name: 'Kildrid',
  subtitle: 'Dwarven Cleric · Stone Sense Scholar',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters?focus=pc-kildrid'
})
MERGE (kycius:Entity:PlayerCharacter {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'pc-kycius',
  compositeKey: '1:PlayerCharacter:pc-kycius',
  entityType: 'PlayerCharacter',
  entityKey: 'pc-kycius',
  name: 'Kycius',
  subtitle: 'Tabaxi Investigator · Bonded to Laksis',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters?focus=pc-kycius'
})
MERGE (munk:Entity:PlayerCharacter {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'pc-munk',
  compositeKey: '1:PlayerCharacter:pc-munk',
  entityType: 'PlayerCharacter',
  entityKey: 'pc-munk',
  name: 'Munk',
  subtitle: 'Half-Orc Vanguard Fighter',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/characters?focus=pc-munk'
})
MERGE (emrys:Entity:NPC {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'npc-emrys',
  compositeKey: '1:NPC:npc-emrys',
  entityType: 'NPC',
  entityKey: 'npc-emrys',
  name: 'Emrys Driothe',
  subtitle: 'Council of Magic Reformer',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=npc-emrys'
})
MERGE (kutler:Entity:NPC {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'npc-kutler',
  compositeKey: '1:NPC:npc-kutler',
  entityType: 'NPC',
  entityKey: 'npc-kutler',
  name: 'Captain Kutler',
  subtitle: 'Skyship Commander · Lost Isles Scout',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=npc-kutler'
})
MERGE (artificers:Entity:Faction {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'fac-artificers',
  compositeKey: '1:Faction:fac-artificers',
  entityType: 'Faction',
  entityKey: 'fac-artificers',
  name: 'Artificers Guild of Cinth',
  subtitle: 'Post-War Craft & Brass Defense Collective',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=fac-artificers'
})
MERGE (priors:Entity:Faction {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'fac-priors',
  compositeKey: '1:Faction:fac-priors',
  entityType: 'Faction',
  entityKey: 'fac-priors',
  name: 'The Order of Priors',
  subtitle: 'Chokrah Ritual Siphon Academy',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/campaigns?inspect=fac-priors'
})
MERGE (luminary:Entity:Artifact {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'art-luminary-well',
  compositeKey: '1:Artifact:art-luminary-well',
  entityType: 'Artifact',
  entityKey: 'art-luminary-well',
  name: 'Luminary of the Well of Life',
  subtitle: 'Sidhe Ard Anelith Remnant',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/assets?inspect=art-luminary-well'
})
MERGE (questGala:Entity:Quest {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'quest-cinth-gala',
  compositeKey: '1:Quest:quest-cinth-gala',
  entityType: 'Quest',
  entityKey: 'quest-cinth-gala',
  name: 'Masquerade of the Crimson Court',
  subtitle: 'Uncover the Vampire Coup in Cinth',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=quest-cinth-gala'
})
MERGE (clueTremor:Entity:Clue {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'clue-kildrid-tremor',
  compositeKey: '1:Clue:clue-kildrid-tremor',
  entityType: 'Clue',
  entityKey: 'clue-kildrid-tremor',
  name: 'Claws Scraping Deep Granite',
  subtitle: 'Discovered by Kildrid on the Cinth Road',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/loom?query=mountain+stone+sense'
})
MERGE (secretTrap:Entity:Secret {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'sec-emrys-trap',
  compositeKey: '1:Secret:sec-emrys-trap',
  entityType: 'Secret',
  entityKey: 'sec-emrys-trap',
  name: 'The Life-Bound Dragon Trap',
  subtitle: 'GM Truth · Emrys Cannot Kill Vaelkorath Himself',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/weave?node=sec-emrys-trap'
})
MERGE (dragon:Entity:Monster {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'mon-bound-dragon',
  compositeKey: '1:Monster:mon-bound-dragon',
  entityType: 'Monster',
  entityKey: 'mon-bound-dragon',
  name: 'Vaelkorath, The Bound Dragon',
  subtitle: 'Imprisoned Under the Southern Mountain',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/encounters?focus=enc-mountain-caves'
})
MERGE (world)-[:PART_OF {visibility: 'public'}]->(camp)
MERGE (cinth)-[:LOCATED_IN {visibility: 'players'}]->(world)
MERGE (vandia)-[:LOCATED_IN {visibility: 'players'}]->(world)
MERGE (plainsRed)-[:LOCATED_IN {visibility: 'players'}]->(world)
MERGE (mountainVault)-[:LOCATED_IN {visibility: 'gm'}]->(world)
MERGE (vandia)-[:CONNECTED_TO {visibility: 'players', routeName: 'Northeast Cinth Road'}]->(plainsRed)
MERGE (plainsRed)-[:CONNECTED_TO {visibility: 'players', routeName: 'Plains of Vistagh Approach'}]->(cinth)
MERGE (plainsRed)-[:CONNECTED_TO {visibility: 'gm', routeName: 'Hidden Mountain Diversion'}]->(mountainVault)
MERGE (party)-[:CURRENTLY_IN {visibility: 'players'}]->(cinth)
MERGE (dal)-[:MEMBER_OF {visibility: 'players'}]->(party)
MERGE (fivi)-[:MEMBER_OF {visibility: 'players'}]->(party)
MERGE (kildrid)-[:MEMBER_OF {visibility: 'players'}]->(party)
MERGE (kycius)-[:MEMBER_OF {visibility: 'players'}]->(party)
MERGE (munk)-[:MEMBER_OF {visibility: 'players'}]->(party)
MERGE (party)-[:CARRIES {visibility: 'players'}]->(luminary)
MERGE (party)-[:ALLIED_WITH {visibility: 'players'}]->(artificers)
MERGE (kutler)-[:ALLIED_WITH {visibility: 'players'}]->(party)
MERGE (questGala)-[:TARGETS {visibility: 'players'}]->(cinth)
MERGE (kildrid)-[:DISCOVERED {visibility: 'players', session: 12}]->(clueTremor)
MERGE (clueTremor)-[:REVEALS {visibility: 'gm'}]->(secretTrap)
MERGE (secretTrap)-[:ABOUT {visibility: 'gm'}]->(dragon)
MERGE (emrys)-[:KNOWS_ABOUT {visibility: 'gm'}]->(secretTrap)
MERGE (emrys)-[:CONTROLS {visibility: 'gm'}]->(priors)
MERGE (emrys)-[:SEARCHING_FOR {visibility: 'gm'}]->(luminary)
MERGE (dragon)-[:IMPRISONED_IN {visibility: 'gm'}]->(mountainVault)

// =============================================================================
// Adventure & Contextual Session Guide Graph Projection
// =============================================================================
MERGE (advVer:Entity:AdventureNode:AdventureVersion {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'adv-ver-sotm-1-0',
  entityId: 'adv-ver-sotm-1-0',
  compositeKey: '1:AdventureVersion:adv-ver-sotm-1-0',
  entityType: 'AdventureVersion',
  entityKey: 'adv-ver-sotm-1-0',
  name: 'Shadow of the Mountain v1.0.0',
  subtitle: 'Playable Adventure Package · D&D 5e',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns'
})
MERGE (chap4:Entity:AdventureNode:Chapter {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-chap-whispering',
  entityId: 'node-chap-whispering',
  compositeKey: '1:Chapter:node-chap-whispering',
  entityType: 'Chapter',
  entityKey: 'node-chap-whispering',
  name: 'Chapter 4: Shadows in the Stone',
  subtitle: 'Whispering Woods & The Ruined Chapel',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns'
})
MERGE (ses15:Entity:AdventureNode:Session {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'session-15',
  entityId: 'session-15',
  compositeKey: '1:Session:session-15',
  entityType: 'Session',
  entityKey: 'session-15',
  name: 'Session 15 — The Ruined Chapel',
  subtitle: 'Live Session Plan · Whispering Woods',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?session=session-15'
})
MERGE (chapelSite:Entity:AdventureNode:Location {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-loc-ruined-chapel',
  entityId: 'loc-ruined-chapel',
  compositeKey: '1:Location:loc-ruined-chapel',
  entityType: 'Location',
  entityKey: 'loc-ruined-chapel',
  locationType: 'site',
  areaKey: 'CHAPEL',
  name: 'The Ruined Chapel',
  subtitle: 'Crumbling Ekkosian Sanctuary · Site',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/maps?scene=scene-plains-red'
})
MERGE (roomC1:Entity:AdventureNode:Location:Room {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-room-c1-nave',
  entityId: 'room-c1-nave',
  compositeKey: '1:Location:room-c1-nave',
  entityType: 'Location',
  entityKey: 'room-c1-nave',
  locationType: 'room',
  areaKey: 'C1',
  name: 'C1: The Shattered Nave',
  subtitle: 'Entry Hall & Brother Malric Lantern Post',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/maps?scene=scene-plains-red'
})
MERGE (roomC2:Entity:AdventureNode:Location:Room {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-room-c2-courtyard',
  entityId: 'room-c2-courtyard',
  compositeKey: '1:Location:room-c2-courtyard',
  entityType: 'Location',
  entityKey: 'room-c2-courtyard',
  locationType: 'room',
  areaKey: 'C2',
  name: 'C2: Moonlit Cloister Courtyard',
  subtitle: 'Overgrown Flagstone Yard & Fallen Bell Tower',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/encounters?focus=enc-cinth-ballroom'
})
MERGE (roomC3:Entity:AdventureNode:Location:Room {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-room-c3-crypt',
  entityId: 'room-c3-crypt',
  compositeKey: '1:Location:room-c3-crypt',
  entityType: 'Location',
  entityKey: 'room-c3-crypt',
  locationType: 'room',
  areaKey: 'C3',
  name: 'C3: Sealed Altar Crypt',
  subtitle: 'Subterranean Resonance Vault Beneath the Chapel',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/maps?scene=scene-mountain-prison'
})
MERGE (scnArrival:Entity:AdventureNode:Scene {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-scene-chapel-arrival',
  entityId: 'scene-chapel-arrival',
  compositeKey: '1:Scene:scene-chapel-arrival',
  entityType: 'Scene',
  entityKey: 'scene-chapel-arrival',
  name: 'Scene 1: Vigil in the Shattered Nave',
  subtitle: 'Roleplay & Investigation in C1',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns'
})
MERGE (scnAmbush:Entity:AdventureNode:Scene {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-scene-courtyard-ambush',
  entityId: 'scene-courtyard-ambush',
  compositeKey: '1:Scene:scene-courtyard-ambush',
  entityType: 'Scene',
  entityKey: 'scene-courtyard-ambush',
  name: 'Scene 2: Ambush in the Moonlit Courtyard',
  subtitle: 'Tactical Skirmish in C2',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/arcane-screen'
})
MERGE (scnCrypt:Entity:AdventureNode:Scene {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-scene-crypt-descent',
  entityId: 'scene-crypt-descent',
  compositeKey: '1:Scene:scene-crypt-descent',
  entityType: 'Scene',
  entityKey: 'scene-crypt-descent',
  name: 'Scene 3: What Stirs Beneath the Altar',
  subtitle: 'Crypt Puzzle & Chokrah Manifest in C3',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/weave?node=sec-emrys-trap'
})
MERGE (malric:Entity:AdventureNode:NPC {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-npc-malric',
  entityId: 'npc-malric',
  compositeKey: '1:NPC:npc-malric',
  entityType: 'NPC',
  entityKey: 'npc-malric',
  name: 'Brother Malric',
  subtitle: 'Chapel Keeper · Cautious',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=npc-emrys'
})
MERGE (elowen:Entity:AdventureNode:NPC {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-npc-elowen',
  entityId: 'npc-elowen',
  compositeKey: '1:NPC:npc-elowen',
  entityType: 'NPC',
  entityKey: 'npc-elowen',
  name: 'Sister Elowen',
  subtitle: 'Healer · Guarded',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=npc-kutler'
})
MERGE (encStalker:Entity:AdventureNode:Encounter {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-enc-shadow-stalker',
  entityId: 'enc-shadow-stalker',
  compositeKey: '1:Encounter:enc-shadow-stalker',
  entityType: 'Encounter',
  entityKey: 'enc-shadow-stalker',
  name: 'Shadow Stalker Pack in the Courtyard',
  subtitle: 'Hard Encounter · Room C2',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/encounters?focus=enc-cinth-ballroom'
})
MERGE (clueTracks:Entity:AdventureNode:Clue {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-clue-crypt-tracks',
  entityId: 'clue-crypt-tracks',
  compositeKey: '1:Clue:clue-crypt-tracks',
  entityType: 'Clue',
  entityKey: 'clue-crypt-tracks',
  name: 'Scratched Basalt & Dragged Satchel Tracks',
  subtitle: 'Discovered Clue · Room C2 to C3',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/loom?query=mountain+stone+sense'
})
MERGE (clueChokrah:Entity:AdventureNode:Clue {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-clue-chokrah-seal',
  entityId: 'clue-chokrah-manifest',
  compositeKey: '1:Clue:clue-chokrah-manifest',
  entityType: 'Clue',
  entityKey: 'clue-chokrah-manifest',
  name: 'Signed Chokrah Siphon Manifest',
  subtitle: 'Undiscovered Evidence · Room C3',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/weave?node=clue-chokrah-manifest'
})
MERGE (hazGlyph:Entity:AdventureNode:Hazard {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-haz-crypt-glyph',
  entityId: 'haz-crypt-glyph',
  compositeKey: '1:Hazard:haz-crypt-glyph',
  entityType: 'Hazard',
  entityKey: 'haz-crypt-glyph',
  name: 'Anelith Feedback Ward on the Crypt Seal',
  subtitle: 'Magical Trap · DC 15 Arcana / Thieves Tools',
  visibility: 'gm',
  canonStatus: 'approved',
  route: '/encounters'
})
MERGE (trsArrow:Entity:AdventureNode:Treasure {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'node-trs-star-arrow',
  entityId: 'trs-star-arrow',
  compositeKey: '1:Treasure:trs-star-arrow',
  entityType: 'Treasure',
  entityKey: 'trs-star-arrow',
  name: 'Star-Etched Edhellain Quiver & 450 gp',
  subtitle: 'Crypt Reliquary Cache · Room C3',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/assets?inspect=art-luminary-well'
})
MERGE (mapRegC1:AdventureNode:MapRegion {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'mapreg-c1',
  sceneKey: 'scene-plains-red',
  areaKey: 'C1',
  name: 'Polygon Region C1: Shattered Nave',
  visibility: 'players'
})
MERGE (mapRegC2:AdventureNode:MapRegion {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'mapreg-c2',
  sceneKey: 'scene-plains-red',
  areaKey: 'C2',
  name: 'Polygon Region C2: Moonlit Courtyard',
  visibility: 'players'
})
MERGE (mapRegC3:AdventureNode:MapRegion {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'mapreg-c3',
  sceneKey: 'scene-mountain-prison',
  areaKey: 'C3',
  name: 'Polygon Region C3: Sealed Altar Crypt',
  visibility: 'gm'
})
MERGE (compStalker:AdventureNode:CompendiumEntry {
  namespace: 'loomweaver',
  campaignId: 1,
  installationId: 1,
  nodeId: 'comp-shadow-stalker',
  name: 'Shadow Stalker (CR 5)',
  systemCode: 'dnd5e',
  visibility: 'players'
})

// Adventure Hierarchy & Session Guide Relationships
MERGE (advVer)-[:CONTAINS {visibility: 'players', whyIncluded: 'Chapter 4 of Shadow of the Mountain'}]->(chap4)
MERGE (chap4)-[:CONTAINS {visibility: 'players', whyIncluded: 'Primary Chapter Site'}]->(chapelSite)
MERGE (chapelSite)-[:CONTAINS {visibility: 'players', whyIncluded: 'Present in Ruined Chapel (C1)'}]->(roomC1)
MERGE (chapelSite)-[:CONTAINS {visibility: 'players', whyIncluded: 'Present in Ruined Chapel (C2)'}]->(roomC2)
MERGE (chapelSite)-[:CONTAINS {visibility: 'gm', whyIncluded: 'Hidden Beneath Ruined Chapel (C3)'}]->(roomC3)
MERGE (scnArrival)-[:OCCURS_AT {visibility: 'players', whyIncluded: 'Occurs in C1: Shattered Nave'}]->(roomC1)
MERGE (scnAmbush)-[:OCCURS_AT {visibility: 'players', whyIncluded: 'Occurs in C2: Moonlit Courtyard'}]->(roomC2)
MERGE (scnCrypt)-[:OCCURS_AT {visibility: 'gm', whyIncluded: 'Occurs in C3: Sealed Altar Crypt'}]->(roomC3)
MERGE (ses15)-[:PLAYED {visibility: 'players', whyIncluded: 'Completed in Session 15'}]->(scnArrival)
MERGE (ses15)-[:PLANS {visibility: 'players', whyIncluded: 'Planned for Session 15'}]->(scnAmbush)
MERGE (ses15)-[:PLANS {visibility: 'gm', whyIncluded: 'Planned Finale for Session 15'}]->(scnCrypt)
MERGE (scnArrival)-[:FEATURES {visibility: 'players', whyIncluded: 'Authored in Scene 1 (C1)'}]->(malric)
MERGE (scnArrival)-[:FEATURES {visibility: 'players', whyIncluded: 'Authored in Scene 1 (C1)'}]->(elowen)
MERGE (malric)-[:CURRENTLY_IN {visibility: 'players', whyIncluded: 'Present in C1'}]->(roomC1)
MERGE (elowen)-[:CURRENTLY_IN {visibility: 'players', whyIncluded: 'Present in C1'}]->(roomC1)
MERGE (scnAmbush)-[:USES {visibility: 'players', whyIncluded: 'Triggered in C2 Courtyard'}]->(encStalker)
MERGE (roomC2)-[:HAS {visibility: 'players', role: 'Clue', whyIncluded: 'Present in C2'}]->(clueTracks)
MERGE (roomC3)-[:HAS {visibility: 'gm', role: 'Clue', whyIncluded: 'Present in C3'}]->(clueChokrah)
MERGE (roomC3)-[:HAS {visibility: 'gm', role: 'Hazard', whyIncluded: 'Present in C3'}]->(hazGlyph)
MERGE (roomC3)-[:HAS {visibility: 'players', role: 'Treasure', whyIncluded: 'Present in C3'}]->(trsArrow)
MERGE (clueTracks)-[:REVEALS {visibility: 'gm', whyIncluded: 'Points to Sealed Crypt'}]->(roomC3)
MERGE (clueChokrah)-[:REVEALS {visibility: 'gm', whyIncluded: 'Exposes Priors Siphon'}]->(secretTrap)
MERGE (scnArrival)-[:LEADS_TO {visibility: 'players', exitLabel: 'East Archway to Courtyard'}]->(scnAmbush)
MERGE (scnAmbush)-[:LEADS_TO {visibility: 'gm', exitLabel: 'Sunken Crypt Stairs'}]->(scnCrypt)
MERGE (mapRegC1)-[:DEPICTS {visibility: 'players'}]->(roomC1)
MERGE (mapRegC2)-[:DEPICTS {visibility: 'players'}]->(roomC2)
MERGE (mapRegC3)-[:DEPICTS {visibility: 'gm'}]->(roomC3)
MERGE (encStalker)-[:REFERENCES {visibility: 'players'}]->(compStalker)

// =============================================================================
// Connected Story Chain Projection (Truth vs. Testimony vs. Character Knowledge)
// Session 15 -> Scene -> Crypt C3 -> Chokrah Manifest -> Claim about the Priors -> Lore & Emrys
// =============================================================================
MERGE (claimPriors:Entity:Claim {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'claim-priors-rituals',
  compositeKey: '1:Claim:claim-priors-rituals',
  entityType: 'Claim',
  entityKey: 'claim-priors-rituals',
  name: 'Claim about the Priors: Chokrah Siphon',
  subtitle: 'Truth Assessment: Confirmed by Manifest',
  truthAssessment: 'confirmed',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/world-lore?tab=lore&loreId=lore-priors-rituals'
})
MERGE (claimReform:Entity:Claim {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'claim-council-reform',
  compositeKey: '1:Claim:claim-council-reform',
  entityType: 'Claim',
  entityKey: 'claim-council-reform',
  name: 'Public Claim: "The New Council Protects Every Gift"',
  subtitle: 'Truth Assessment: Disputed Political Narrative',
  truthAssessment: 'disputed',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/world-lore?tab=lore&loreId=lore-priors-rituals'
})
MERGE (srcMalric:Entity:SourceRecord {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'src-malric-testimony',
  compositeKey: '1:SourceRecord:src-malric-testimony',
  entityType: 'SourceRecord',
  entityKey: 'src-malric-testimony',
  name: 'Brother Malric Lantern Testimony',
  subtitle: 'Witness Account · Room C1',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/campaigns?inspect=npc-malric'
})
MERGE (lorePriors:Entity:Lore {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'lore-priors-rituals',
  compositeKey: '1:Lore:lore-priors-rituals',
  entityType: 'Lore',
  entityKey: 'lore-priors-rituals',
  name: 'Lore: Priors'' Rituals & Chokrah Titration',
  subtitle: 'Codex Article · Factions & Forbidden Rites',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/world-lore?tab=lore&loreId=lore-priors-rituals'
})
MERGE (clueCarvings:Entity:Clue {
  namespace: 'loomweaver',
  campaignId: 1,
  entityId: 'clue-carvings-chapel',
  compositeKey: '1:Clue:clue-carvings-chapel',
  entityType: 'Clue',
  entityKey: 'clue-carvings-chapel',
  name: 'Carvings Beneath the Chapel',
  subtitle: 'Discovered Clue · Matches Mountain Tomb Runes',
  visibility: 'players',
  canonStatus: 'approved',
  route: '/world-lore?tab=lore&loreId=lore-priors-rituals'
})

MERGE (roomC3)-[:CONTAINS {sqlRelationshipId: 3, revision: 1, visibility: 'players', whyIncluded: 'Crypt C3 contains the Chokrah manifest'}]->(clueChokrah)
MERGE (roomC3)-[:CONTAINS {sqlRelationshipId: 4, revision: 1, visibility: 'players', whyIncluded: 'Crypt C3 contains runic carvings matching the mountain prison'}]->(clueCarvings)
MERGE (clueChokrah)-[:SUPPORTS {sqlRelationshipId: 5, revision: 2, visibility: 'players', whyIncluded: 'Manifest supports Claim about the Priors'}]->(claimPriors)
MERGE (srcMalric)-[:SUPPORTS {sqlRelationshipId: 6, revision: 1, visibility: 'players', whyIncluded: 'Witness testimony supports Claim about the Priors'}]->(claimPriors)
MERGE (claimReform)-[:CONTRADICTS {sqlRelationshipId: 7, revision: 1, visibility: 'players', whyIncluded: 'Public reform narrative contradicts secret siphon claim'}]->(claimPriors)
MERGE (claimPriors)-[:DOCUMENTED_IN {sqlRelationshipId: 8, revision: 1, visibility: 'players', whyIncluded: 'Documented in Lore: Priors rituals'}]->(lorePriors)
MERGE (claimPriors)-[:IMPLICATES {sqlRelationshipId: 9, revision: 1, visibility: 'players', whyIncluded: 'Implicates NPC: Emrys Driothe'}]->(emrys)
MERGE (claimPriors)-[:IMPLICATES {sqlRelationshipId: 10, revision: 1, visibility: 'players', whyIncluded: 'Implicates Faction: Order of Priors'}]->(priors)
MERGE (dal)-[:DISCOVERED {sqlRelationshipId: 11, revision: 1, visibility: 'players', session: 15, whyIncluded: 'Dal discovered the chapel carvings'}]->(clueCarvings)
MERGE (kycius)-[:DISCOVERED {sqlRelationshipId: 13, revision: 1, visibility: 'players', session: 15, whyIncluded: 'Kycius deciphered the Chokrah manifest'}]->(clueChokrah)
MERGE (malric)-[:WAS_IN {sqlRelationshipId: 14, revision: 1, validFromEventId: 1, validUntilEventId: 2, visibility: 'players', whyIncluded: 'Malric was in Crypt C3 during Prior inspection'}]->(roomC3);
