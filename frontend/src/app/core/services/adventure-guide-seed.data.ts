import {
  AdventureAssignedBattlemapVm,
  AdventureGuideElementItemVm,
  AdventureGuideEncounterItemVm,
  AdventureGuideNpcItemVm,
  AdventurePlayEventVm,
  AdventureReadAloudBlockVm,
  AdventureRoomExitVm,
  AdventureScopeKind,
  AdventureSessionBeatItemVm,
  AdventureSkillCheckVm,
  ContextualAdventureGuideVm,
} from '../models/adventure-guide.models';
import { ViewerRole } from '../models/loomweaver.models';

export const SEED_ADVENTURE_BEATS: readonly AdventureSessionBeatItemVm[] = [
  { id: 'beat-1', nodeId: 'node-room-c1-nave', label: 'Arrival at the ruined chapel', done: true, progressState: 'completed', outcomeNotes: 'Party entered C1 Shattered Nave out of the Whispering Woods mist.', linkedRoomNodeId: 'node-room-c1-nave' },
  { id: 'beat-2', nodeId: 'node-npc-malric', label: 'Speaking with Brother Malric', done: true, progressState: 'completed', outcomeNotes: 'Questioned Malric by the brazier; sensed his fear of the Priors.', linkedRoomNodeId: 'node-room-c1-nave' },
  { id: 'beat-3', nodeId: 'node-clue-crypt-tracks', label: 'Tracks leading to the crypt', done: false, progressState: 'discovered', outcomeNotes: 'Boot tracks and dragged satchel marks lead through C2 toward C3.', linkedRoomNodeId: 'node-room-c2-courtyard' },
  { id: 'beat-4', nodeId: 'node-enc-shadow-stalker', label: 'Ambush in the courtyard', done: false, progressState: 'unresolved', outcomeNotes: 'Shadow Stalkers wait atop the fallen bell tower in C2.', linkedRoomNodeId: 'node-room-c2-courtyard' },
  { id: 'beat-5', nodeId: 'node-room-c3-crypt', label: 'Discover what stirs beneath the chapel', done: false, progressState: 'unresolved', outcomeNotes: 'Unseal the C3 altar slab and inspect the Chokrah siphon lectern.', linkedRoomNodeId: 'node-room-c3-crypt' },
];

export const SEED_ADVENTURE_NPCS: readonly AdventureGuideNpcItemVm[] = [
  {
    nodeId: 'node-npc-malric', compositeKey: '1:NPC:npc-emrys', name: 'Brother Malric', role: 'Chapel Keeper · Cautious',
    dispositionLabel: 'Cautious', dispositionTone: 'gold', initials: 'BM', ringColor: '#d9b77a', artworkUrl: '/icrandor_world_dashboard.jpg',
    motive: 'Protect the street-children from Prior inquisitors without exposing his past.',
    dialogueExcerpt: '"Do not lift the altar stone after dark. What scratches beneath the mountain has long fingers."',
    whyIncluded: 'Present in C1 · Linked to Session 15', progressState: 'discovered', routeLink: '/campaigns?inspect=npc-emrys', visibility: 'players',
  },
  {
    nodeId: 'node-npc-elowen', compositeKey: '1:NPC:npc-kutler', name: 'Sister Elowen', role: 'Healer · Guarded',
    dispositionLabel: 'Guarded', dispositionTone: 'emerald', initials: 'SE', ringColor: '#49e892', artworkUrl: '/six-engines-showcase.jpg',
    motive: 'Keep the wounded Vale scout alive until the party clears the courtyard.',
    dialogueExcerpt: '"The shadows did not kill the scouts—they dragged them toward the crypt stairs."',
    whyIncluded: 'Present in C1 · Linked to Session 15', progressState: 'discovered', routeLink: '/campaigns?inspect=npc-kutler', visibility: 'players',
  },
  {
    nodeId: 'node-npc-emrys', compositeKey: '1:NPC:npc-emrys', name: 'Emrys Driothe', role: 'Reformer of the Council of Magic',
    dispositionLabel: 'Deceptive', dispositionTone: 'gold', initials: 'ED', ringColor: '#d9b77a', artworkUrl: '/the-weave-graph-engine.jpg',
    motive: 'Steer the party toward the bound dragon beneath the southern mountain.',
    dialogueExcerpt: '"The reformed Council opens its doors to every gift."',
    whyIncluded: 'Linked via Prior Siphon Seal in C3', progressState: 'optional', routeLink: '/campaigns?inspect=npc-emrys', visibility: 'players',
  },
  {
    nodeId: 'node-pc-dal', compositeKey: '1:PlayerCharacter:pc-dal', name: 'Dal Riata', role: 'Elf Ranger · Lineage of Edhellain',
    dispositionLabel: 'Party Hero', dispositionTone: 'gold', initials: 'DR', ringColor: '#d9b77a', artworkUrl: '/characters-showcase.jpg',
    motive: 'Track the missing Vale scouts and read the elven stonework.',
    dialogueExcerpt: '"Those fletchings on the broken arrow belong to the Vale vanguard."',
    whyIncluded: 'Party Roster · Active in Session 15', progressState: 'discovered', routeLink: '/characters?focus=pc-dal', visibility: 'players',
  },
  {
    nodeId: 'node-pc-kildrid', compositeKey: '1:PlayerCharacter:pc-kildrid', name: 'Kildrid', role: 'Dwarven Cleric · Stone Sense Scholar',
    dispositionLabel: 'Party Hero', dispositionTone: 'emerald', initials: 'KI', ringColor: '#49e892', artworkUrl: '/characters-showcase.jpg',
    motive: 'Decipher the containment runes beneath the chapel altar.',
    dialogueExcerpt: '"The granite under this altar hums with the same agony we felt on the Cinth road."',
    whyIncluded: 'Party Roster · Stone Sense Link to C3', progressState: 'discovered', routeLink: '/characters?focus=pc-kildrid', visibility: 'players',
  },
];

export const SEED_ASSIGNED_BATTLEMAP: AdventureAssignedBattlemapVm = {
  sceneKey: 'scene-plains-red',
  title: 'The Ruined Chapel & Whispering Woods Cloister',
  sessionId: 'session-15',
  sessionTitle: 'Session 15 — The Ruined Chapel',
  locationNodeId: 'node-loc-ruined-chapel',
  locationTitle: 'The Ruined Chapel (C1–C3)',
  areaKey: 'CHAPEL',
  artworkUrl: '/combat-caves.jpg',
  routeLink: '/maps?scene=scene-plains-red',
  vttRouteLink: '/arcane-screen',
  clickableRegions: [
    { regionId: 'mapreg-c1', roomNodeId: 'node-room-c1-nave', areaKey: 'C1', title: 'C1: The Shattered Nave', linkedSceneKey: 'scene-plains-red', routeLink: '/maps?scene=scene-plains-red', visibility: 'players' },
    { regionId: 'mapreg-c2', roomNodeId: 'node-room-c2-courtyard', areaKey: 'C2', title: 'C2: Moonlit Courtyard', linkedSceneKey: 'scene-plains-red', routeLink: '/maps?scene=scene-plains-red', visibility: 'players' },
    { regionId: 'mapreg-c3', roomNodeId: 'node-room-c3-crypt', areaKey: 'C3', title: 'C3: Sealed Altar Crypt', linkedSceneKey: 'scene-mountain-prison', routeLink: '/maps?scene=scene-mountain-prison', visibility: 'gm' },
  ],
};

export function buildSeedAdventureGuide(
  campaignId: number,
  role: ViewerRole,
  scopeKind: AdventureScopeKind = 'session',
  scopeId = 'session-15',
  customNpcs: readonly AdventureGuideNpcItemVm[] = SEED_ADVENTURE_NPCS,
  customBeats: readonly AdventureSessionBeatItemVm[] = SEED_ADVENTURE_BEATS,
  assignedMap: AdventureAssignedBattlemapVm = SEED_ASSIGNED_BATTLEMAP,
  events: readonly AdventurePlayEventVm[] = [],
): ContextualAdventureGuideVm {
  const isGm = role === 'gm';
  const meta = getRoomMeta(scopeId);
  const readAlouds: readonly AdventureReadAloudBlockVm[] = [
    {
      blockId: 'blk-c1-readaloud', nodeId: 'node-room-c1-nave', title: 'C1 Read-Aloud · Entering the Shattered Nave',
      content: 'Old stones remember. Rain needles through the ribs of the collapsed roof, hissing against a single brass brazier before the cracked mosaic of Ekkos. An elderly friar lifts a shuttered lantern: "If you seek the scouts from the Vale road, lower your steel. The stone beneath this floor has been listening since sundown."',
      audience: 'players', shareable: true, sharedWithPlayers: true,
    },
    {
      blockId: 'blk-c2-readaloud', nodeId: 'node-room-c2-courtyard', title: 'C2 Read-Aloud · The Moonlit Cloister Yard',
      content: 'The fallen bronze bell lies half-sunk in black brambles at the center of the courtyard. Between the leaning arches, the mist pools around three elongated silhouettes crouched above a torn leather messenger satchel.',
      audience: 'players', shareable: true, sharedWithPlayers: true,
    },
    ...(isGm ? [{
      blockId: 'blk-c3-readaloud', nodeId: 'node-room-c3-crypt', title: 'C3 Read-Aloud · Unsealing the Altar Crypt',
      content: 'The basalt steps spiral down into air colder than winter river-water. Blue containment runes—carved by the same hand that bound the southern mountain—throb along a vaulted ossuary. On a stone lectern rests a brass siphon vial still warm to the touch.',
      audience: 'gm' as const, shareable: true, sharedWithPlayers: false,
    }] : []),
  ];

  const exits: readonly AdventureRoomExitVm[] = [
    { targetNodeId: 'node-room-c1-nave', targetTitle: 'C1: The Shattered Nave', targetAreaKey: 'C1', directionLabel: 'Room C1: Shattered Nave', visibility: 'players' },
    { targetNodeId: 'node-room-c2-courtyard', targetTitle: 'C2: Moonlit Courtyard', targetAreaKey: 'C2', directionLabel: 'Room C2: Moonlit Courtyard', visibility: 'players' },
    { targetNodeId: 'node-room-c3-crypt', targetTitle: 'C3: Sealed Altar Crypt', targetAreaKey: 'C3', directionLabel: 'Room C3: Sealed Altar Crypt', visibility: isGm ? 'gm' : 'players' },
  ];

  const skillChecks: readonly AdventureSkillCheckVm[] = [
    { blockId: 'blk-c1-check-malric', nodeId: 'node-room-c1-nave', title: 'Questioning Brother Malric', skillLabel: 'Insight / Persuasion', dc: 14, passOutcome: 'Malric admits three Prior inspectors descended into C3 three nights ago with Lost Isles Chokrah crates.', failOutcome: 'Malric blames forest wolves, though his eyes dart toward the chipped altar mortar.', resolutionState: 'completed' },
    { blockId: 'blk-c2-check-tracks', nodeId: 'node-room-c2-courtyard', title: 'Tracing the Dragged Scout Satchel', skillLabel: 'Survival / Stonecunning', dc: 13, passOutcome: 'You spot Chokrah dust leading into C3 and detect the Shadow Stalkers perched on the fallen bell tower.', failOutcome: "You follow the tracks to the courtyard center and trigger the Shadow Stalkers' surprise leap.", resolutionState: 'discovered' },
    ...(isGm ? [{ blockId: 'blk-c3-check-ward', nodeId: 'node-room-c3-crypt', title: 'Disarming the Anelith Feedback Ward', skillLabel: "Arcana / Thieves' Tools", dc: 15, passOutcome: 'You ground the runic charge into the bedrock and recover the Chokrah Manifest and Star-Etched Quiver intact.', failOutcome: 'An arc of emerald-crimson static lashes 15 ft across the stairs (3d8 damage).', resolutionState: 'unresolved' }] : []),
  ];

  const encounters: readonly AdventureGuideEncounterItemVm[] = [{
    nodeId: 'node-enc-shadow-stalker', compositeKey: '1:Encounter:enc-cinth-ballroom', title: 'Shadow Stalker Pack in the Courtyard',
    subtitle: 'Hard Encounter · 3 Shadow Stalkers & 1 Corrupt Prior Hound', difficulty: 'Hard', xpReward: 1800,
    trigger: 'Crossing the C2 courtyard midline or disturbing the fallen bronze bell.',
    terrainNotes: 'Collapsed bell tower (+2 AC half-cover), bramble patches (difficult terrain).',
    tacticsSummary: 'Shadow Stalkers shadow-step between dim cloister pillars to flank casters; retreat toward C3 if reduced below 15 HP.',
    assignedSceneKey: assignedMap.sceneKey, whyIncluded: 'Triggered in C2 · Linked to Session 15', progressState: 'unresolved',
    routeLink: '/encounters?focus=enc-cinth-ballroom', vttRouteLink: '/arcane-screen', visibility: 'players',
  }];

  const cluesAndHazards: readonly AdventureGuideElementItemVm[] = [
    {
      nodeId: 'node-clue-crypt-tracks', compositeKey: '1:Clue:clue-kildrid-tremor', elementKind: 'clue', areaKey: 'C2',
      title: 'Scratched Basalt & Dragged Satchel Tracks', subtitle: 'Discovered Clue · Survival / Stonecunning DC 13',
      summary: 'Boot prints mixed with clawed drag marks lead from the broken cloister wall directly to the mortared seam under the altar.',
      artworkUrl: '/combat-caves.jpg', whyIncluded: 'Present in C2 · Links C2 to C3', progressState: 'discovered', routeLink: '/loom?query=mountain+stone+sense', visibility: 'players',
    },
    ...(isGm ? [
      {
        nodeId: 'node-clue-chokrah-seal', compositeKey: '1:Clue:clue-chokrah-manifest', elementKind: 'clue', areaKey: 'C3',
        title: 'Signed Chokrah Siphon Manifest & Prior Seal', subtitle: 'Crypt Evidence · Investigation DC 15',
        summary: "Wax-sealed cargo ledger in C3 proving Chokrah shipments from the Lost Isles feed the Priors' magic-extraction crucible.",
        artworkUrl: '/the-weave-graph-engine.jpg', whyIncluded: 'Present in C3 · Links Chapel to Cinth Priors', progressState: 'unresolved', routeLink: '/weave?node=clue-chokrah-manifest', visibility: 'gm' as const,
      },
      {
        nodeId: 'node-haz-crypt-glyph', compositeKey: '1:Clue:clue-kildrid-tremor', elementKind: 'hazard', areaKey: 'C3',
        title: 'Anelith Feedback Ward on the Crypt Seal', subtitle: 'Magical Trap · Detect DC 14 / Disarm DC 15',
        summary: 'Lifting the C3 altar slab without grounding the copper shunt releases a 15-ft pulse of necrotic-radiant static (3d8 damage).',
        artworkUrl: '/tactical-combat-engine.jpg', whyIncluded: 'Present in C3 · Wards Altar Slab', progressState: 'unresolved', routeLink: '/encounters', visibility: 'gm' as const,
      },
    ] : []),
  ];

  const treasures: readonly AdventureGuideElementItemVm[] = [{
    nodeId: 'node-trs-star-arrow', compositeKey: '1:Artifact:art-luminary-well', elementKind: 'treasure', areaKey: 'C3',
    title: 'Star-Etched Edhellain Quiver & 450 gp', subtitle: 'Crypt Reliquary Cache · Room C3',
    summary: 'A silver-chased quiver bearing the royal crest of Edhellain and a pouch of pre-war gold crowns hidden behind the ossuary lectern.',
    artworkUrl: '/dice-physics-engine.jpg', whyIncluded: 'Present in C3 · Reliquary Reward', progressState: 'unresolved',
    routeLink: '/assets?inspect=art-luminary-well', visibility: 'players', xpReward: 1200, currencyOrItemLabel: '450 gp + Star-Etched Quiver', rewardAwarded: false,
  }];

  const placesTabItems: readonly AdventureGuideElementItemVm[] = [
    { nodeId: 'node-loc-ruined-chapel', compositeKey: '1:Location:loc-plains-red', elementKind: 'location', areaKey: 'CHAPEL', title: 'The Ruined Chapel (Site Overview)', subtitle: `Assigned Battlemap: ${assignedMap.title}`, summary: 'Crumbling Ekkosian wayside sanctuary on the edge of the Whispering Woods containing keyed rooms C1, C2, and C3.', artworkUrl: assignedMap.artworkUrl, whyIncluded: 'Session 15 Primary Site', progressState: 'discovered', routeLink: assignedMap.routeLink, visibility: 'players' },
    { nodeId: 'node-room-c1-nave', compositeKey: '1:Location:loc-plains-red', elementKind: 'room', areaKey: 'C1', title: 'C1: The Shattered Nave', subtitle: "Keyed Room C1 · Entry & Brother Malric's Vigil", summary: 'Overturned oak pews, a brass brazier, and chipped mortar bordering the altar plinth.', artworkUrl: '/combat-caves.jpg', whyIncluded: 'Keyed Room in Ruined Chapel', progressState: 'completed', routeLink: '/maps?scene=scene-plains-red', visibility: 'players' },
    { nodeId: 'node-room-c2-courtyard', compositeKey: '1:Location:loc-plains-red', elementKind: 'room', areaKey: 'C2', title: 'C2: Moonlit Cloister Courtyard', subtitle: 'Keyed Room C2 · Fallen Bell Tower & Ambush', summary: 'Bramble-choked flagstones where Shadow Stalkers perch above the dragged scout satchel.', artworkUrl: '/tactical-combat-engine.jpg', whyIncluded: 'Keyed Room in Ruined Chapel', progressState: 'unresolved', routeLink: '/encounters?focus=enc-cinth-ballroom', visibility: 'players' },
    ...(isGm ? [{ nodeId: 'node-room-c3-crypt', compositeKey: '1:Location:loc-cinth', elementKind: 'room', areaKey: 'C3', title: 'C3: Sealed Altar Crypt', subtitle: 'Keyed Room C3 · Subterranean Resonance Vault', summary: 'Spiral basalt steps descending into an ossuary etched with pre-Council containment runes.', artworkUrl: '/the-weave-graph-engine.jpg', whyIncluded: 'Keyed Room Beneath Altar', progressState: 'unresolved', routeLink: '/maps?scene=scene-mountain-prison', visibility: 'gm' as const }] : []),
  ];

  const loreTabItems: readonly AdventureGuideElementItemVm[] = [
    { nodeId: 'node-rule-shadow-tether', compositeKey: '1:Clue:clue-kildrid-tremor', elementKind: 'rule', areaKey: 'RULE', title: 'Poisoned Root & Stone Tremor Resonance', subtitle: 'Adventure-Wide Rule · Whispering Woods & Southern Peaks', summary: "Whenever a 3rd-level or higher spell is cast underground, Kildrid's stone sense detects the directional bearing of the bound dragon's runes.", artworkUrl: '/icrandor_world_dashboard.jpg', whyIncluded: 'Adventure-Wide Rule', progressState: 'discovered', routeLink: '/loom?query=mountain+stone+sense', visibility: 'players' },
    { nodeId: 'node-lore-priors', compositeKey: '1:Faction:fac-priors', elementKind: 'lore', areaKey: 'LORE', title: 'The Order of Priors & Ekkosian Sanctuaries', subtitle: 'Faction Canon · Street-Schools of Ekkos', summary: 'Publicly rescues street children and teaches discipline; secretly siphons innate magic from students through Chokrah rituals.', artworkUrl: '/the-weave-graph-engine.jpg', whyIncluded: 'Linked to C1 Altar & C3 Manifest', progressState: 'discovered', routeLink: '/weave?node=fac-priors', visibility: isGm ? 'gm' : 'players' },
  ];

  const visibleNpcs = customNpcs.filter((n) => isGm || n.visibility !== 'gm');

  return {
    campaignId, adventureId: 'adv-shadow-mountain', adventureVersionId: 'adv-ver-sotm-1-0', adventureTitle: 'Shadow of the Mountain',
    activeScopeKind: scopeKind, activeScopeId: scopeId, activeSessionId: 'session-15', activeSessionNumber: 15,
    headerTitle: meta.headerTitle, headerSubtitle: meta.headerSubtitle, artworkUrl: assignedMap.artworkUrl,
    epigraph: meta.epigraph, summary: meta.summary, immediateSituation: meta.immediateSituation, sensoryDescription: meta.sensoryDescription,
    activeAreaKey: meta.areaKey,
    breadcrumbs: [
      { nodeId: 'adv-shadow-mountain', scopeKind: 'adventure', label: 'Shadow of the Mountain', areaKey: 'ADV' },
      { nodeId: 'session-15', scopeKind: 'session', label: 'Session 15', areaKey: 'S15' },
      { nodeId: 'node-loc-ruined-chapel', scopeKind: 'location', label: 'Ruined Chapel', areaKey: 'CHAPEL' },
      ...(scopeKind === 'room' ? [{ nodeId: scopeId, scopeKind: 'room' as const, label: meta.headerTitle, areaKey: meta.areaKey }] : []),
    ],
    availableSessions: [
      { id: 'session-15', scopeKind: 'session', areaKey: 'S15', title: 'Session 15 — The Ruined Chapel', subtitle: 'Live Session · Whispering Woods' },
      { id: 'session-14', scopeKind: 'session', areaKey: 'S14', title: 'Session 14 — Brass Gears & Velvet Fangs', subtitle: 'Completed · City of Cinth' },
    ],
    availableLocations: [
      { id: 'node-loc-ruined-chapel', scopeKind: 'location', areaKey: 'CHAPEL', title: 'The Ruined Chapel (Site)', subtitle: 'Whispering Woods Sanctuary · 3 Keyed Rooms' },
      { id: 'node-loc-cinth-gala', scopeKind: 'location', areaKey: 'CINTH', title: 'City of Cinth & Gala Rotunda', subtitle: 'Plains of Vistagh Metropolis' },
    ],
    availableRooms: [
      { id: 'node-room-c1-nave', scopeKind: 'room', areaKey: 'C1', title: 'C1: The Shattered Nave', subtitle: "Entry Hall & Brother Malric's Vigil" },
      { id: 'node-room-c2-courtyard', scopeKind: 'room', areaKey: 'C2', title: 'C2: Moonlit Cloister Courtyard', subtitle: 'Fallen Bell Tower & Shadow Stalker Ambush' },
      { id: 'node-room-c3-crypt', scopeKind: 'room', areaKey: 'C3', title: 'C3: Sealed Altar Crypt', subtitle: 'Subterranean Resonance Ossuary' },
    ],
    readAloudBlocks: readAlouds.filter((b) => !scopeId.startsWith('node-room-') || b.nodeId === scopeId),
    exits,
    skillChecks: skillChecks.filter((c) => !scopeId.startsWith('node-room-') || c.nodeId === scopeId),
    assignedBattlemap: { ...assignedMap, clickableRegions: assignedMap.clickableRegions.filter((r) => isGm || r.visibility !== 'gm') },
    beats: customBeats, keyNpcs: visibleNpcs, encounters, cluesAndHazards, treasuresAndRewards: treasures,
    secrets: isGm ? [
      'A sealed crypt (Room C3) lies beneath the displaced Ekkosian altar slab.',
      'Brother Malric hides the fact that Prior inquisitors visited C3 three nights ago.',
      "The C3 containment runes echo Vaelkorath's century-old prison beneath the southern mountain.",
    ] : [],
    notesTabItems: [...cluesAndHazards, ...treasures], npcsTabItems: visibleNpcs, placesTabItems, loreTabItems,
    recentPlayEvents: events.length > 0 ? events : [
      { id: 'evt-1', eventKind: 'beat_checked', actorLabel: 'GM', summary: 'Completed Beat: Speaking with Brother Malric in C1', relativeTime: '12m ago' },
      { id: 'evt-2', eventKind: 'clue_discovered', actorLabel: 'Kildrid', summary: 'Discovered Clue: Scratched Basalt & Dragged Satchel Tracks in C2', relativeTime: '28m ago' },
    ],
  };
}

function getRoomMeta(scopeId: string) {
  if (scopeId === 'node-room-c1-nave') {
    return {
      headerTitle: 'ROOM C1 — THE SHATTERED NAVE', headerSubtitle: "Keyed Room C1 · Ruined Chapel Entry & Brother Malric's Vigil", areaKey: 'C1',
      epigraph: '"If you seek the scouts from the Vale road, lower your steel. The stone beneath this floor has been listening since sundown."',
      summary: 'Overturned oak pews flank a cracked mosaic of Ekkos, Mother of the Abandoned. Brother Malric keeps vigil by a brass brazier while Sister Elowen tends a wounded Vale scout.',
      immediateSituation: 'Brother Malric stands near the cracked Ekkosian altar; fresh chisel dust borders the northern flagstones leading toward C2 and the hidden stairs to C3.',
      sensoryDescription: 'Rain drips through ribs of blackened timber; warm tallow candle-smoke fights the chill draft rising from the altar seam.',
    };
  }
  if (scopeId === 'node-room-c2-courtyard') {
    return {
      headerTitle: 'ROOM C2 — MOONLIT CLOISTER COURTYARD', headerSubtitle: 'Keyed Room C2 · Fallen Bell Tower & Shadow Stalker Ambush', areaKey: 'C2',
      epigraph: '"Between the leaning arches, the mist does not drift with the wind—it pools around three elongated silhouettes."',
      summary: 'Shattered gargoyles and waist-high brambles choke the cloister yard. Fresh boot-tracks and dragged satchel marks lead toward the sunken crypt stairs.',
      immediateSituation: 'Three Shadow Stalkers crouch atop the collapsed bell tower (+2 AC half-cover), waiting for a lantern-bearer to cross the courtyard midline.',
      sensoryDescription: 'Silver moonlight cuts through dead yew branches; shadows detach unnatural angles from the broken masonry.',
    };
  }
  if (scopeId === 'node-room-c3-crypt') {
    return {
      headerTitle: 'ROOM C3 — SEALED ALTAR CRYPT', headerSubtitle: 'Keyed Room C3 · Subterranean Resonance Vault Beneath the Chapel', areaKey: 'C3',
      epigraph: '"Blue containment runes—carved by the same hand that bound the southern mountain—throb along the vaulted ossuary."',
      summary: 'Beneath the displaced altar slab descends a spiral of basalt steps into a vaulted ossuary containing a Signed Chokrah Siphon Manifest and pre-Council containment glyphs.',
      immediateSituation: "An Anelith Feedback Ward guards the inner reliquary lectern (DC 15 Arcana or Thieves' Tools) where the Chokrah manifest and Star-Etched Quiver rest.",
      sensoryDescription: 'Cold blue runelight pulses in time with a distant subterranean heartbeat; the scent of Chokrah residue lingers in the damp stone.',
    };
  }
  return {
    headerTitle: 'SESSION 15 — THE RUINED CHAPEL', headerSubtitle: 'Connected Adventure & Location Reference · Whispering Woods (Rooms C1–C3)', areaKey: 'CHAPEL',
    epigraph: '"Old stones remember. And something stirs beneath them still."',
    summary: 'A crumbling chapel stands on the edge of the Whispering Woods. Strange noises and missing travelers have drawn the party here, where an uneasy silence hangs over the ruins.',
    immediateSituation: 'Party is investigating the Ruined Chapel across Keyed Rooms C1 (Shattered Nave), C2 (Moonlit Courtyard), and C3 (Sealed Altar Crypt).',
    sensoryDescription: 'Cracked slate roof tiles, damp incense mixed with ozone, and ancient scratch marks echoing up through the altar flagstones.',
  };
}
