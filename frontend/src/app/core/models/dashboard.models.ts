import { AudienceVisibility } from './loomweaver.models';

export type CampaignSessionState =
  | 'live'
  | 'planned'
  | 'completed_no_next'
  | 'no_sessions';

export interface DashboardPrepItemVm {
  readonly id: string;
  readonly label: string;
  readonly completed: boolean;
  readonly routeLink: string;
  readonly gmOnly: boolean;
}

export interface DashboardUpcomingSessionVm {
  readonly sessionId: string;
  readonly sessionNumber: number;
  readonly title: string;
  readonly artworkUrl: string;
  readonly scheduledDateLabel: string;
  readonly scheduledTimeLabel: string;
  readonly locationTitle: string;
  readonly locationRegion: string;
  readonly prepStatusLabel: string;
  readonly completedPrepCount: number;
  readonly totalPrepCount: number;
  readonly checklist: readonly DashboardPrepItemVm[];
}

export interface DashboardActivityItemVm {
  readonly id: string;
  readonly title: string;
  readonly entityType: string;
  readonly description: string;
  readonly relativeTime: string;
  readonly routeLink: string;
  readonly compositeKey: string;
  readonly visibility: AudienceVisibility;
}

export interface DashboardNoteItemVm {
  readonly id: string;
  readonly title: string;
  readonly excerpt: string;
  readonly relativeTime: string;
  readonly routeLink: string;
  readonly compositeKey: string;
  readonly visibility: AudienceVisibility;
}

export interface DashboardQuestThreadVm {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly categoryBadge: string;
  readonly badgeTone: 'gold' | 'emerald' | 'gm' | 'crimson';
  readonly routeLink: string;
  readonly compositeKey: string;
  readonly visibility: AudienceVisibility;
}

export interface DashboardPartyMemberVm {
  readonly id: string;
  readonly compositeKey: string;
  readonly name: string;
  readonly classAndAncestry: string;
  readonly hpCurrent: number;
  readonly hpMax: number;
  readonly resourceLabel: string;
  readonly ac: number;
  readonly online: boolean;
  readonly avatarInitials: string;
  readonly ringColor: string;
  readonly levelUpEligible: boolean;
  readonly routeLink: string;
}

export interface DashboardAlertItemVm {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'level-up' | 'invite' | 'reminder' | 'asset';
  readonly tone: 'gold' | 'emerald' | 'amber' | 'crimson';
  readonly routeLink: string;
  readonly read: boolean;
  readonly gmOnly: boolean;
}

export interface DashboardSessionBeatVm {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

export interface DashboardGuideNpcVm {
  readonly compositeKey: string;
  readonly name: string;
  readonly role: string;
  readonly dispositionLabel: string;
  readonly dispositionTone: 'gold' | 'emerald' | 'crimson';
  readonly initials: string;
  readonly ringColor: string;
}

export interface DashboardSessionGuideVm {
  readonly headerTitle: string;
  readonly artworkUrl: string;
  readonly epigraph: string;
  readonly summary: string;
  readonly beats: readonly DashboardSessionBeatVm[];
  readonly keyNpcs: readonly DashboardGuideNpcVm[];
  readonly secrets: readonly string[];
}

export interface CampaignDashboardVm {
  readonly campaignId: number;
  readonly campaignName: string;
  readonly sessionState: CampaignSessionState;
  readonly actTitle: string;
  readonly actSubtitle: string;
  readonly sessionBadgeLabel: string;
  readonly sessionBadgeSubtitle: string;
  readonly lastActivityLabel: string;
  readonly narrativeSummary: string;
  readonly heroArtworkUrl: string;
  readonly upcomingSession: DashboardUpcomingSessionVm;
  readonly recentActivity: readonly DashboardActivityItemVm[];
  readonly recentNotes: readonly DashboardNoteItemVm[];
  readonly activeQuests: readonly DashboardQuestThreadVm[];
  readonly partyMembers: readonly DashboardPartyMemberVm[];
  readonly partyHealthTitle: string;
  readonly partyHealthSubtitle: string;
  readonly alerts: readonly DashboardAlertItemVm[];
  readonly sessionGuide: DashboardSessionGuideVm;
}
