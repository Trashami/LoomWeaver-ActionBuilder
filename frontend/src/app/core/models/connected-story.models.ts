import { AudienceVisibility } from './loomweaver.models';

export type TruthAssessmentStatus = 'unverified' | 'confirmed' | 'disputed' | 'disproven';

export interface EntityRelationshipVm {
  readonly id: number;
  readonly campaignId: number;
  readonly fromCompositeKey: string;
  readonly fromName: string;
  readonly fromType: string;
  readonly relationshipType: string;
  readonly toCompositeKey: string;
  readonly toName: string;
  readonly toType: string;
  readonly whyIncludedLabel: string;
  readonly visibility: AudienceVisibility;
  readonly sourceRecordId?: string | null;
  readonly validFromEventId?: number | null;
  readonly validUntilEventId?: number | null;
  readonly revision: number;
  readonly isHistorical: boolean;
}

export interface StoryClaimVm {
  readonly id: string;
  readonly campaignId: number;
  readonly compositeKey: string;
  readonly title: string;
  readonly statement: string;
  readonly truthAssessment: TruthAssessmentStatus;
  readonly gmCanonicalTruth?: string | null;
  readonly supportingSourceKey?: string | null;
  readonly supportingSourceLabel: string;
  readonly contradictingSourceKey?: string | null;
  readonly contradictingSourceLabel: string;
  readonly documentedLoreId?: string | null;
  readonly documentedLoreTitle: string;
  readonly implicatedEntityKey?: string | null;
  readonly implicatedEntityName: string;
  readonly visibility: AudienceVisibility;
  readonly knownByCharacters: readonly string[];
  readonly revision: number;
}

export interface ConnectedChainStepVm {
  readonly stepId: string;
  readonly stepRole: string;
  readonly compositeKey: string;
  readonly title: string;
  readonly subtitle: string;
  readonly questionAnswered: string;
  readonly relationLabel: string;
  readonly truthAssessment?: TruthAssessmentStatus | null;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
  readonly knownByCharacters: readonly string[];
}

export interface ConnectedStoryChainVm {
  readonly chainId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly scopeNodeId: string;
  readonly steps: readonly ConnectedChainStepVm[];
  readonly claims: readonly StoryClaimVm[];
  readonly relationships: readonly EntityRelationshipVm[];
  readonly pendingOutboxCount: number;
  readonly projectedRelationshipCount: number;
}

export interface StoryBeatItemVm {
  readonly id: string;
  readonly actId: string;
  readonly code: string;
  readonly title: string;
  readonly kind: string;
  readonly status: 'Complete' | 'In Progress' | 'Planned' | string;
  readonly scopeKind: string;
  readonly scopeNodeId: string;
  readonly linkedLocationKey: string;
  readonly routeLink: string;
  readonly visibility: AudienceVisibility;
}

export interface StoryActColumnVm {
  readonly id: string;
  readonly romanNumeral: string;
  readonly title: string;
  readonly subtitle: string;
  readonly status: 'Complete' | 'In Progress' | 'Planned' | 'Unwritten' | string;
  readonly synopsis: string;
  readonly completedCount: number;
  readonly totalCount: number;
  readonly beats: readonly StoryBeatItemVm[];
}

export interface StorySessionSequenceItemVm {
  readonly sessionId: string;
  readonly sessionNumber: number;
  readonly title: string;
  readonly locationLabel: string;
  readonly dateLabel: string;
  readonly status: 'completed' | 'live' | 'planned' | string;
  readonly artworkUrl: string;
  readonly scopeNodeId: string;
}

export interface StoryLoreClueFeedItemVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly title: string;
  readonly kindLabel: string;
  readonly kindTone: 'emerald' | 'gold' | 'amber' | 'crimson' | string;
  readonly summary: string;
  readonly relativeTime: string;
  readonly truthAssessment?: TruthAssessmentStatus | null;
  readonly routeLink: string;
  readonly loreEntryId?: string | null;
}

export interface StoryConnectedLinkItemVm {
  readonly compositeKey: string;
  readonly title: string;
  readonly subtitle: string;
  readonly routeLink: string;
  readonly locationKey?: string | null;
}

export interface StoryConnectedGroupVm {
  readonly category: string;
  readonly iconName: string;
  readonly tone: 'gold' | 'emerald' | 'crimson' | string;
  readonly items: readonly StoryConnectedLinkItemVm[];
}

export interface CampaignStoryWorkspaceVm {
  readonly campaignId: number;
  readonly campaignTitle: string;
  readonly campaignSubtitle: string;
  readonly heroArtworkUrl: string;
  readonly currentActLabel: string;
  readonly currentActSub: string;
  readonly nextSessionLabel: string;
  readonly nextSessionSub: string;
  readonly totalSessionsLabel: string;
  readonly totalSessionsSub: string;
  readonly activeBeatId: string;
  readonly activeBeatTitle: string;
  readonly acts: readonly StoryActColumnVm[];
  readonly sessionSequence: readonly StorySessionSequenceItemVm[];
  readonly loreAndClues: readonly StoryLoreClueFeedItemVm[];
  readonly connectedGroups: readonly StoryConnectedGroupVm[];
  readonly activeStoryChain: ConnectedStoryChainVm;
}
