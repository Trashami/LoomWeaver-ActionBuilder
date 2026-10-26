import {
  CampaignDashboardVm,
  DashboardActivityItemVm,
  DashboardAlertItemVm,
  DashboardNoteItemVm,
  DashboardPrepItemVm,
  DashboardQuestThreadVm,
  DashboardSessionBeatVm,
} from '../models/dashboard.models';
import { ViewerRole } from '../models/loomweaver.models';

const CAMPAIGN_1_PREP: readonly DashboardPrepItemVm[] = [
  { id: 'prep-1', label: 'Review encounter: Shadow Stalker', completed: true, routeLink: '/encounters', gmOnly: true },
  { id: 'prep-2', label: 'Prep Brother Malric dialogue', completed: true, routeLink: '/campaigns', gmOnly: true },
  { id: 'prep-3', label: 'Finalize map and lighting', completed: false, routeLink: '/maps', gmOnly: true },
  { id: 'prep-4', label: 'Prepare handouts and clues', completed: false, routeLink: '/assets', gmOnly: false },
  { id: 'prep-5', label: 'Review treasure and rewards', completed: false, routeLink: '/campaigns', gmOnly: true },
];

const CAMPAIGN_1_ACTIVITY: readonly DashboardActivityItemVm[] = [
  { id: 'act-1', title: 'Brother Malric (NPC) updated', entityType: 'NPC', description: 'Added new dialogue and motivations', relativeTime: '2h ago', routeLink: '/campaigns', compositeKey: '1:NPC:npc-emrys', visibility: 'players' },
  { id: 'act-2', title: 'The Ruined Chapel (Map Scene)', entityType: 'Map Scene', description: 'Added lighting and new areas', relativeTime: '4h ago', routeLink: '/maps', compositeKey: '1:Location:loc-cinth', visibility: 'players' },
  { id: 'act-3', title: 'Shadow Stalker (Encounter)', entityType: 'Encounter', description: 'Adjusted HP and added lair actions', relativeTime: '6h ago', routeLink: '/encounters', compositeKey: '1:Encounter:enc-cinth-ballroom', visibility: 'gm' },
  { id: 'act-4', title: 'Whispers in the Woods (Note)', entityType: 'Note', description: 'New clue about the forged blade', relativeTime: '8h ago', routeLink: '/loom', compositeKey: '1:Clue:clue-kildrid-tremor', visibility: 'players' },
  { id: 'act-5', title: 'Seraphine (Character)', entityType: 'Character', description: 'Updated spells and equipment', relativeTime: '1d ago', routeLink: '/characters', compositeKey: '1:PlayerCharacter:pc-kycius', visibility: 'players' },
];

const CAMPAIGN_1_NOTES: readonly DashboardNoteItemVm[] = [
  { id: 'note-1', title: 'Carvings Beneath the Chapel', excerpt: 'Strange symbols match those from the mountain tomb. They speak of a...', relativeTime: '3h ago', routeLink: '/loom', compositeKey: '1:Clue:clue-kildrid-tremor', visibility: 'players' },
  { id: 'note-2', title: "Brother Malric's Warning", excerpt: 'He believes the shadows are not just undead, but something older...', relativeTime: '1d ago', routeLink: '/loom', compositeKey: '1:NPC:npc-emrys', visibility: 'players' },
  { id: 'note-3', title: 'The Star-Etched Arrow', excerpt: 'Found on a fallen scout. The fletching bears the mark of the Vale.', relativeTime: '2d ago', routeLink: '/assets', compositeKey: '1:PlayerCharacter:pc-dal', visibility: 'players' },
  { id: 'note-4', title: 'Whispering Woods Rumors', excerpt: 'Locals speak of lights in the trees and voices at night.', relativeTime: '3d ago', routeLink: '/loom', compositeKey: '1:Location:loc-plains-red', visibility: 'players' },
  { id: 'note-5', title: 'A Debt of Iron', excerpt: 'The dwarven smith in Varik expects payment soon. Time is short.', relativeTime: '4d ago', routeLink: '/campaigns', compositeKey: '1:Faction:fac-artificers', visibility: 'players' },
];

const CAMPAIGN_1_QUESTS: readonly DashboardQuestThreadVm[] = [
  { id: 'quest-shadows-stone', title: 'Shadows in the Stone', summary: 'Investigate the ruined chapel', categoryBadge: 'Main Story', badgeTone: 'gold', routeLink: '/campaigns', compositeKey: '1:Quest:quest-cinth-gala', visibility: 'players' },
  { id: 'quest-missing-caravan', title: 'The Missing Caravan', summary: 'Search the old road for survivors', categoryBadge: 'In Progress', badgeTone: 'emerald', routeLink: '/campaigns', compositeKey: '1:Quest:quest-chokrah-ledger', visibility: 'players' },
  { id: 'quest-whispers-woods', title: 'Whispers in the Woods', summary: 'Speak to the hermit of Elderwood', categoryBadge: 'In Progress', badgeTone: 'emerald', routeLink: '/campaigns', compositeKey: '1:Clue:clue-kildrid-tremor', visibility: 'players' },
  { id: 'quest-debt-iron', title: 'A Debt of Iron', summary: 'Deliver the forged blade to Varik', categoryBadge: 'In Progress', badgeTone: 'emerald', routeLink: '/campaigns', compositeKey: '1:Faction:fac-artificers', visibility: 'players' },
  { id: 'quest-lost-expedition', title: 'The Lost Expedition', summary: 'Discover what happened to the Vale scouts', categoryBadge: 'Side Quest', badgeTone: 'gold', routeLink: '/campaigns', compositeKey: '1:Location:loc-plains-red', visibility: 'players' },
];

const CAMPAIGN_1_ALERTS: readonly DashboardAlertItemVm[] = [
  { id: 'alert-1', title: 'Level Up Available', description: 'Seraphine can advance to level 5', category: 'level-up', tone: 'gold', routeLink: '/characters', read: false, gmOnly: false },
  { id: 'alert-2', title: '1 Pending Invite', description: 'Marcus has been invited to the campaign', category: 'invite', tone: 'emerald', routeLink: '/campaigns', read: false, gmOnly: true },
  { id: 'alert-3', title: 'Unresolved Reminder', description: 'Determine the source of the shadow magic', category: 'reminder', tone: 'amber', routeLink: '/loom', read: false, gmOnly: true },
  { id: 'alert-4', title: 'Asset Import Complete', description: '3 new map assets added to your library', category: 'asset', tone: 'emerald', routeLink: '/assets', read: false, gmOnly: false },
];

const CAMPAIGN_1_BEATS: readonly DashboardSessionBeatVm[] = [
  { id: 'beat-1', label: 'Arrival at the ruined chapel', done: true },
  { id: 'beat-2', label: 'Speaking with Brother Malric', done: true },
  { id: 'beat-3', label: 'Tracks leading to the crypt', done: false },
  { id: 'beat-4', label: 'Ambush in the courtyard', done: false },
  { id: 'beat-5', label: 'Discover what stirs beneath the chapel', done: false },
];

export function buildSeedDashboardForCampaign(
  campaignId: number,
  role: ViewerRole,
): CampaignDashboardVm {
  const isGm = role === 'gm';

  if (campaignId === 2) {
    const prep2: readonly DashboardPrepItemVm[] = [
      { id: 'prep-2-1', label: 'Calibrate Clockwork Vault hazard DCs', completed: true, routeLink: '/encounters', gmOnly: true },
      { id: 'prep-2-2', label: 'Stage Absalom Grand Bazaar map tokens', completed: true, routeLink: '/maps', gmOnly: false },
      { id: 'prep-2-3', label: 'Prepare Starstone resonance handout', completed: true, routeLink: '/assets', gmOnly: false },
      { id: 'prep-2-4', label: 'Review High Clockmaster dialogue tree', completed: false, routeLink: '/campaigns', gmOnly: true },
    ];
    return {
      campaignId: 2,
      campaignName: 'Echoes of the Starstone',
      sessionState: 'planned',
      actTitle: 'ACT I',
      actSubtitle: 'Siege of the Spire',
      sessionBadgeLabel: 'Session 6',
      sessionBadgeSubtitle: 'The Clockwork Vaults',
      lastActivityLabel: 'Today at 6:15 PM',
      narrativeSummary:
        "Beneath the Grand Bazaar of Absalom, ancient brass gears grind awake. The party stands before the Starstone Vault seal as the High Clockmaster's constructs patrol the lower catwalks.",
      heroArtworkUrl: '/landing-assets/engines/engine-3-loommaps-atlas.jpg',
      upcomingSession: {
        sessionId: 'session-2-6',
        sessionNumber: 6,
        title: 'Session 6 — The Clockwork Vaults',
        artworkUrl: '/landing-assets/engines/engine-3-loommaps-atlas.jpg',
        scheduledDateLabel: 'Sunday, May 18, 2025',
        scheduledTimeLabel: '6:00 PM – 10:00 PM (4h)',
        locationTitle: 'Subterranean Vaults',
        locationRegion: 'Absalom Grand Bazaar',
        prepStatusLabel: 'Prep In Progress',
        completedPrepCount: 3,
        totalPrepCount: 4,
        checklist: prep2.filter((p) => isGm || !p.gmOnly),
      },
      recentActivity: [
        { id: 'act-2-1', title: 'High Clockmaster (NPC) updated', entityType: 'NPC', description: 'Adjusted construct command aura', relativeTime: '1h ago', routeLink: '/campaigns', compositeKey: '1:NPC:npc-kutler', visibility: 'players' },
        { id: 'act-2-2', title: 'Clockwork Vaults (Map Scene)', entityType: 'Map Scene', description: 'Added dynamic gear hazards and catwalks', relativeTime: '3h ago', routeLink: '/maps', compositeKey: '1:Location:loc-cinth', visibility: 'players' },
      ],
      recentNotes: [
        { id: 'note-2-1', title: 'Starstone Resonance Log', excerpt: 'Harmonic frequency matches the Ascendant Court spire.', relativeTime: '2h ago', routeLink: '/loom', compositeKey: '1:Clue:clue-kildrid-tremor', visibility: 'players' },
      ],
      activeQuests: [
        { id: 'quest-2-1', title: 'Siege of the Spire', summary: 'Unlock the lower Starstone vault', categoryBadge: 'Main Story', badgeTone: 'gold', routeLink: '/campaigns', compositeKey: '1:Quest:quest-cinth-gala', visibility: 'players' },
        { id: 'quest-2-2', title: 'Gears of the Bazaar', summary: 'Recover the missing guild ledger', categoryBadge: 'In Progress', badgeTone: 'emerald', routeLink: '/campaigns', compositeKey: '1:Quest:quest-chokrah-ledger', visibility: 'players' },
      ],
      partyMembers: [
        { id: 'pm-2-1', compositeKey: '1:PlayerCharacter:pc-dal', name: 'Valeros', classAndAncestry: 'Human Fighter', hpCurrent: 54, hpMax: 58, resourceLabel: 'HP 54/58', ac: 21, online: true, avatarInitials: 'VA', ringColor: '#d9b77a', levelUpEligible: false, routeLink: '/characters' },
        { id: 'pm-2-2', compositeKey: '1:PlayerCharacter:pc-fivi', name: 'Ezren', classAndAncestry: 'Human Wizard', hpCurrent: 38, hpMax: 38, resourceLabel: 'HP 38/38', ac: 17, online: true, avatarInitials: 'EZ', ringColor: '#49e892', levelUpEligible: true, routeLink: '/characters' },
      ],
      partyHealthTitle: 'All party members are healthy',
      partyHealthSubtitle: 'Three-action economy ready · No persistent conditions.',
      alerts: [
        { id: 'alert-2-1', title: 'Feat Selection Pending', description: '2 Pathfinder characters have unspent skill feats', category: 'level-up', tone: 'gold', routeLink: '/characters', read: false, gmOnly: false },
      ],
      sessionGuide: {
        headerTitle: 'SESSION 6 — THE CLOCKWORK VAULTS',
        artworkUrl: '/landing-assets/engines/engine-3-loommaps-atlas.jpg',
        epigraph: '"Every gear in Absalom turns toward the Starstone."',
        summary: 'The party descends beneath the Grand Bazaar into the sealed clockwork vaults.',
        beats: [
          { id: 'beat-2-1', label: 'Enter the Clockwork Vaults beneath Absalom', done: true },
          { id: 'beat-2-2', label: 'Bypass the brass pendulum ward', done: false },
          { id: 'beat-2-3', label: 'Confront the Vault Automaton Warden', done: false },
        ],
        keyNpcs: [
          { compositeKey: '1:NPC:npc-kutler', name: 'High Clockmaster', role: 'Vault Warden · Guarded', dispositionLabel: 'Guarded', dispositionTone: 'emerald', initials: 'HC', ringColor: '#d9b77a' },
        ],
        secrets: isGm
          ? ['The Vault Warden is bound to the Starstone conduit.', 'A hidden bypass rune lies behind the third pendulum.']
          : [],
      },
    };
  }

  const visiblePrep = CAMPAIGN_1_PREP.filter((p) => isGm || !p.gmOnly);
  const completedPrepCount = CAMPAIGN_1_PREP.filter((p) => p.completed).length;

  return {
    campaignId: 1,
    campaignName: 'Shadow of the Mountain',
    sessionState: 'live',
    actTitle: 'ACT I',
    actSubtitle: 'Shadows in the Stone',
    sessionBadgeLabel: 'Session 15',
    sessionBadgeSubtitle: 'The Ruined Chapel',
    lastActivityLabel: 'Today at 7:42 PM',
    narrativeSummary:
      'The party has followed the trail into the Whispering Woods, where an ancient, half-buried chapel holds secrets older than the kingdom. Strange noises echo within, and Brother Malric awaits their arrival.',
    heroArtworkUrl: '/landing-assets/backgrounds/section-atmosphere.jpg',
    upcomingSession: {
      sessionId: 'session-15',
      sessionNumber: 15,
      title: 'Session 15 — The Ruined Chapel',
      artworkUrl: '/combat-caves.jpg',
      scheduledDateLabel: 'Saturday, May 17, 2025',
      scheduledTimeLabel: '7:00 PM – 11:00 PM (4h)',
      locationTitle: 'The Ruined Chapel',
      locationRegion: 'Whispering Woods',
      prepStatusLabel: 'Prep In Progress',
      completedPrepCount,
      totalPrepCount: CAMPAIGN_1_PREP.length,
      checklist: visiblePrep,
    },
    recentActivity: CAMPAIGN_1_ACTIVITY.filter((a) => isGm || a.visibility !== 'gm'),
    recentNotes: CAMPAIGN_1_NOTES.filter((n) => isGm || n.visibility !== 'gm'),
    activeQuests: CAMPAIGN_1_QUESTS.filter((q) => isGm || q.visibility !== 'gm'),
    partyMembers: [
      { id: 'party-kael', compositeKey: '1:PlayerCharacter:pc-dal', name: 'Kael', classAndAncestry: 'Human Ranger', hpCurrent: 32, hpMax: 38, resourceLabel: 'HP 32/38', ac: 16, online: true, avatarInitials: 'KA', ringColor: '#d9b77a', levelUpEligible: false, routeLink: '/characters?focus=pc-dal' },
      { id: 'party-lira', compositeKey: '1:PlayerCharacter:pc-fivi', name: 'Lira', classAndAncestry: 'Elf Sorcerer', hpCurrent: 24, hpMax: 24, resourceLabel: 'HP 24/24', ac: 15, online: true, avatarInitials: 'LI', ringColor: '#49e892', levelUpEligible: false, routeLink: '/characters?focus=pc-fivi' },
      { id: 'party-stonehide', compositeKey: '1:PlayerCharacter:pc-kildrid', name: 'Stonehide', classAndAncestry: 'Goliath Barbarian', hpCurrent: 41, hpMax: 45, resourceLabel: 'HP 41/45', ac: 17, online: true, avatarInitials: 'ST', ringColor: '#e2a85c', levelUpEligible: false, routeLink: '/characters?focus=pc-kildrid' },
      { id: 'party-seraphine', compositeKey: '1:PlayerCharacter:pc-kycius', name: 'Seraphine', classAndAncestry: 'Tiefling Cleric', hpCurrent: 27, hpMax: 27, resourceLabel: 'HP 27/27', ac: 18, online: true, avatarInitials: 'SE', ringColor: '#5ec2e8', levelUpEligible: true, routeLink: '/characters?focus=pc-kycius' },
    ],
    partyHealthTitle: 'All party members are healthy',
    partyHealthSubtitle: 'No critical conditions or exhaustion.',
    alerts: CAMPAIGN_1_ALERTS.filter((a) => isGm || !a.gmOnly),
    sessionGuide: {
      headerTitle: 'SESSION 15 — THE RUINED CHAPEL',
      artworkUrl: '/combat-caves.jpg',
      epigraph: '"Old stones remember. And something stirs beneath them still."',
      summary:
        'A crumbling chapel stands on the edge of the Whispering Woods. Strange noises and missing travelers have drawn the party here, where an uneasy silence hangs over the ruins.',
      beats: CAMPAIGN_1_BEATS,
      keyNpcs: [
        { compositeKey: '1:NPC:npc-emrys', name: 'Brother Malric', role: 'Chapel Keeper · Cautious', dispositionLabel: 'Cautious', dispositionTone: 'gold', initials: 'BM', ringColor: '#d9b77a' },
        { compositeKey: '1:NPC:npc-kutler', name: 'Sister Elowen', role: 'Healer · Guarded', dispositionLabel: 'Guarded', dispositionTone: 'emerald', initials: 'SE', ringColor: '#49e892' },
        { compositeKey: '1:Encounter:enc-cinth-ballroom', name: 'Shadow Stalker', role: 'Ruin Stalker · Hostile', dispositionLabel: 'Hostile', dispositionTone: 'crimson', initials: 'GS', ringColor: '#e25c5c' },
      ],
      secrets: isGm
        ? [
            'A sealed crypt lies beneath the altar.',
            'Brother Malric knows more than he admits.',
            'The shadows are connected to the mountain.',
          ]
        : [],
    },
  };
}
