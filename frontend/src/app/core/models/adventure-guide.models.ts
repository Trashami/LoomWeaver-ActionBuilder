import { AudienceVisibility } from './loomweaver.models';

export type AdventureScopeKind = 'adventure' | 'session' | 'location' | 'room' | 'encounter';
export type AdventureProgressState = 'all' | 'unresolved' | 'discovered' | 'completed' | 'optional';

export interface AdventureBreadcrumbVm {
  readonly nodeId: string;
  readonly scopeKind: AdventureScopeKind;
  readonly label: string;
  readonly areaKey?: string | null;
}

export interface AdventureRoomExitVm {
  readonly targetNodeId: string;
  readonly targetTitle: string;
  readonly targetAreaKey?: string | null;
  readonly directionLabel: string;
  readonly visibility: AudienceVisibility;
}

export interface AdventureReadAloudBlockVm {
  readonly blockId: string;
  readonly nodeId: string;
  readonly title: string;
  readonly content: string;
  readonly audience: AudienceVisibility;
  readonly shareable: boolean;
  readonly sharedWithPlayers: boolean;
}

export interface AdventureSkillCheckVm {
  readonly blockId: string;
  readonly nodeId: string;
  readonly title: string;
  readonly skillLabel: string;
  readonly dc: number;
  readonly passOutcome: string;
  readonly failOutcome: string;
  readonly resolutionState: string;
}

export interface AdventureMapRegionChipVm {
  readonly regionId: string;
  readonly roomNodeId: string;
  readonly areaKey: string;
  readonly title: string;
  readonly linkedSceneKey: string;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
}

export interface AdventureAssignedBattlemapVm {
  readonly sceneKey: string;
  readonly title: string;
  readonly sessionId: string;
  readonly sessionTitle: string;
  readonly locationNodeId: string;
  readonly locationTitle: string;
  readonly areaKey?: string | null;
  readonly artworkUrl: string;
  readonly routeLink: string;
  readonly vttRouteLink: string;
  readonly clickableRegions: readonly AdventureMapRegionChipVm[];
}

export interface AdventureGuideNpcItemVm {
  readonly nodeId: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly role: string;
  readonly dispositionLabel: string;
  readonly dispositionTone: 'gold' | 'emerald' | 'crimson';
  readonly initials: string;
  readonly ringColor: string;
  readonly artworkUrl: string;
  readonly motive: string;
  readonly dialogueExcerpt: string;
  readonly whyIncluded: string;
  readonly progressState: string;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
}

export interface AdventureGuideEncounterItemVm {
  readonly nodeId: string;
  readonly compositeKey: string;
  readonly title: string;
  readonly subtitle: string;
  readonly difficulty: string;
  readonly xpReward: number;
  readonly trigger: string;
  readonly terrainNotes: string;
  readonly tacticsSummary: string;
  readonly assignedSceneKey: string;
  readonly whyIncluded: string;
  readonly progressState: string;
  readonly routeLink: string;
  readonly vttRouteLink: string;
  readonly visibility: AudienceVisibility;
}

export interface AdventureGuideElementItemVm {
  readonly nodeId: string;
  readonly compositeKey: string;
  readonly elementKind: string;
  readonly areaKey?: string | null;
  readonly title: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly artworkUrl: string;
  readonly whyIncluded: string;
  readonly progressState: string;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
  readonly xpReward?: number;
  readonly currencyOrItemLabel?: string;
  readonly rewardAwarded?: boolean;
}

export interface AdventureSessionBeatItemVm {
  readonly id: string;
  readonly nodeId: string;
  readonly label: string;
  readonly done: boolean;
  readonly progressState: string;
  readonly outcomeNotes: string;
  readonly linkedRoomNodeId?: string | null;
}

export interface AdventureScopeOptionVm {
  readonly id: string;
  readonly scopeKind: AdventureScopeKind;
  readonly areaKey?: string | null;
  readonly title: string;
  readonly subtitle: string;
  readonly parentId?: string | null;
}

export interface AdventurePlayEventVm {
  readonly id: string;
  readonly eventKind: string;
  readonly actorLabel: string;
  readonly summary: string;
  readonly relativeTime: string;
}

export interface ContextualAdventureGuideVm {
  readonly campaignId: number;
  readonly adventureId: string;
  readonly adventureVersionId: string;
  readonly adventureTitle: string;
  readonly activeScopeKind: AdventureScopeKind;
  readonly activeScopeId: string;
  readonly activeSessionId: string;
  readonly activeSessionNumber: number;
  readonly headerTitle: string;
  readonly headerSubtitle: string;
  readonly artworkUrl: string;
  readonly epigraph: string;
  readonly summary: string;
  readonly immediateSituation: string;
  readonly sensoryDescription: string;
  readonly activeAreaKey?: string | null;
  readonly breadcrumbs: readonly AdventureBreadcrumbVm[];
  readonly availableSessions: readonly AdventureScopeOptionVm[];
  readonly availableLocations: readonly AdventureScopeOptionVm[];
  readonly availableRooms: readonly AdventureScopeOptionVm[];
  readonly readAloudBlocks: readonly AdventureReadAloudBlockVm[];
  readonly exits: readonly AdventureRoomExitVm[];
  readonly skillChecks: readonly AdventureSkillCheckVm[];
  readonly assignedBattlemap: AdventureAssignedBattlemapVm;
  readonly beats: readonly AdventureSessionBeatItemVm[];
  readonly keyNpcs: readonly AdventureGuideNpcItemVm[];
  readonly encounters: readonly AdventureGuideEncounterItemVm[];
  readonly cluesAndHazards: readonly AdventureGuideElementItemVm[];
  readonly treasuresAndRewards: readonly AdventureGuideElementItemVm[];
  readonly secrets: readonly string[];
  readonly notesTabItems: readonly AdventureGuideElementItemVm[];
  readonly npcsTabItems: readonly AdventureGuideNpcItemVm[];
  readonly placesTabItems: readonly AdventureGuideElementItemVm[];
  readonly loreTabItems: readonly AdventureGuideElementItemVm[];
  readonly recentPlayEvents: readonly AdventurePlayEventVm[];
}
