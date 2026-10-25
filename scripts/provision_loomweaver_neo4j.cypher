// =============================================================================
// LoomWeaver V2 Authoritative Neo4j Node Graph Schema & Seed ("loomweaver")
// Composite Key Standard: {campaignId}:{entityType}:{entityKey}
// =============================================================================

CREATE CONSTRAINT lw_entity_composite IF NOT EXISTS
FOR (e:Entity) REQUIRE (e.namespace, e.campaignId, e.compositeKey) IS UNIQUE;

CREATE INDEX lw_entity_visibility IF NOT EXISTS
FOR (e:Entity) ON (e.namespace, e.campaignId, e.visibility);

// Rebuild node graph cleanly under loomweaver namespace
MATCH (n) DETACH DELETE n;

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
MERGE (dragon)-[:IMPRISONED_IN {visibility: 'gm'}]->(mountainVault);
