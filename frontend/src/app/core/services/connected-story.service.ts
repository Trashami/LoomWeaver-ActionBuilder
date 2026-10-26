import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CampaignStoryWorkspaceVm,
  ConnectedStoryChainVm,
  StoryBeatItemVm,
  TruthAssessmentStatus,
} from '../models/connected-story.models';
import { AdventureScopeKind } from '../models/adventure-guide.models';
import { AdventureGuideService } from './adventure-guide.service';
import { SEED_STORY_WORKSPACE } from './connected-story-seed.data';
import { LoomWeaverStoreService } from './loomweaver-store.service';
import { WorldLoreFacadeService } from './world-lore-facade.service';

@Injectable({ providedIn: 'root' })
export class ConnectedStoryService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(LoomWeaverStoreService);
  private readonly advGuide = inject(AdventureGuideService);
  private readonly worldLore = inject(WorldLoreFacadeService);

  private readonly workspaceState = signal<CampaignStoryWorkspaceVm>(SEED_STORY_WORKSPACE);
  readonly workspace = this.workspaceState.asReadonly();
  readonly storyChain = computed<ConnectedStoryChainVm>(() => this.workspaceState().activeStoryChain);
  readonly activeBeatId = computed<string>(() => this.workspaceState().activeBeatId);
  readonly plannerOpen = signal<boolean>(false);
  readonly statusBanner = signal<string>('');

  constructor() {
    effect(() => {
      const cid = this.store.activeCampaignId();
      const role = this.store.viewerRole();
      this.reloadWorkspace(cid, role);
    });
  }

  reloadWorkspace(campaignId = this.store.activeCampaignId(), role = this.store.viewerRole(), beatId?: string): void {
    const qBeat = beatId ? `&beatId=${encodeURIComponent(beatId)}` : '';
    this.http
      .get<CampaignStoryWorkspaceVm>(`/api/v2/campaigns/${campaignId}/story-overview?role=${role}${qBeat}`)
      .subscribe({
        next: (res) => {
          if (res?.acts?.length) {
            this.workspaceState.set(res);
          }
        },
        error: () => {},
      });
  }

  selectBeat(beat: StoryBeatItemVm): void {
    const cleanTitle =
      beat.title.includes(' ') && /^\d/.test(beat.title)
        ? beat.title.slice(beat.title.indexOf(' ') + 1)
        : beat.title;

    this.workspaceState.update((w) => ({
      ...w,
      activeBeatId: beat.id,
      activeBeatTitle: cleanTitle,
    }));

    const scopeKind: AdventureScopeKind =
      beat.scopeKind === 'room'
        ? 'room'
        : beat.scopeKind === 'session'
          ? 'session'
          : 'location';
    this.advGuide.selectScope(scopeKind, beat.scopeNodeId);
    this.reloadWorkspace(this.store.activeCampaignId(), this.store.viewerRole(), beat.id);
  }

  cycleBeatStatus(beat: StoryBeatItemVm, event?: Event): void {
    event?.stopPropagation();
    const nextStatus =
      beat.status === 'Planned'
        ? 'In Progress'
        : beat.status === 'In Progress'
          ? 'Complete'
          : 'Planned';

    const cid = this.store.activeCampaignId();
    const role = this.store.viewerRole();

    this.workspaceState.update((w) => ({
      ...w,
      acts: w.acts.map((act) => {
        if (act.id !== beat.actId) return act;
        const beats = act.beats.map((b) => (b.id === beat.id ? { ...b, status: nextStatus } : b));
        const completedCount = beats.filter((b) => b.status === 'Complete').length;
        return {
          ...act,
          beats,
          completedCount,
          totalCount: beats.length,
        };
      }),
    }));

    this.http
      .post<CampaignStoryWorkspaceVm>(
        `/api/v2/campaigns/${cid}/story-overview/beats/${encodeURIComponent(beat.id)}/status?role=${role}`,
        { nextStatus },
      )
      .subscribe({
        next: (res) => {
          if (res?.acts?.length) this.workspaceState.set(res);
          this.statusBanner.set(`Updated "${beat.title}" to ${nextStatus}.`);
        },
        error: () => {},
      });
  }

  addBeat(actId: string, title: string, kind = 'scene', linkedLocationKey = 'loc-ruined-chapel'): void {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const cid = this.store.activeCampaignId();
    const role = this.store.viewerRole();

    this.http
      .post<CampaignStoryWorkspaceVm>(`/api/v2/campaigns/${cid}/story-overview/beats?role=${role}`, {
        actId,
        title: cleanTitle,
        kind,
        status: 'Planned',
        linkedLocationKey,
      })
      .subscribe({
        next: (res) => {
          if (res?.acts?.length) this.workspaceState.set(res);
          this.statusBanner.set(`Added "${cleanTitle}" to ${actId.toUpperCase()} and linked to ${linkedLocationKey}.`);
        },
        error: () => {
          this.workspaceState.update((w) => ({
            ...w,
            acts: w.acts.map((act) => {
              if (act.id !== actId) return act;
              const nextNum = act.beats.length + 1;
              const newBeat: StoryBeatItemVm = {
                id: `beat-local-${Date.now()}`,
                actId,
                code: `${act.romanNumeral}.${nextNum}`,
                title: cleanTitle,
                kind,
                status: 'Planned',
                scopeKind: 'location',
                scopeNodeId: 'node-loc-ruined-chapel',
                linkedLocationKey,
                routeLink: '/campaigns',
                visibility: 'players',
              };
              const beats = [...act.beats, newBeat];
              return { ...act, beats, totalCount: beats.length };
            }),
          }));
        },
      });
  }

  updateClaimTruth(claimId: string, truthAssessment: TruthAssessmentStatus): void {
    const cid = this.store.activeCampaignId();
    const role = this.store.viewerRole();

    this.workspaceState.update((w) => ({
      ...w,
      activeStoryChain: {
        ...w.activeStoryChain,
        claims: w.activeStoryChain.claims.map((c) =>
          c.id === claimId || c.compositeKey === claimId ? { ...c, truthAssessment, revision: c.revision + 1 } : c,
        ),
        steps: w.activeStoryChain.steps.map((s) =>
          s.compositeKey === '1:Claim:claim-priors-rituals' && claimId === 'claim-priors-rituals'
            ? { ...s, truthAssessment }
            : s,
        ),
      },
    }));

    this.http
      .post<ConnectedStoryChainVm>(
        `/api/v2/campaigns/${cid}/story-chain/claims/${encodeURIComponent(claimId)}/truth?role=${role}`,
        { truthAssessment },
      )
      .subscribe({
        next: (chain) => {
          if (chain?.steps?.length) {
            this.workspaceState.update((w) => ({ ...w, activeStoryChain: chain }));
          }
          this.statusBanner.set(`Updated Claim "${claimId}" truth assessment to ${truthAssessment.toUpperCase()}.`);
        },
        error: () => {},
      });
  }

  createRelationship(
    fromCompositeKey: string,
    relationshipType: string,
    toCompositeKey: string,
    whyIncludedLabel: string,
    visibility: 'players' | 'gm' = 'players',
    markPreviousHistorical = false,
  ): void {
    const cid = this.store.activeCampaignId();
    const role = this.store.viewerRole();

    this.http
      .post<ConnectedStoryChainVm>(`/api/v2/campaigns/${cid}/story-chain/relationships?role=${role}`, {
        fromCompositeKey,
        relationshipType,
        toCompositeKey,
        whyIncludedLabel,
        visibility,
        markPreviousHistorical,
      })
      .subscribe({
        next: (chain) => {
          if (chain?.relationships?.length) {
            this.workspaceState.update((w) => ({ ...w, activeStoryChain: chain }));
          }
          this.statusBanner.set(
            `Saved SQL relationship (${fromCompositeKey} -[${relationshipType}]-> ${toCompositeKey}) and projected to Neo4j via transactional outbox.`,
          );
        },
        error: () => {},
      });
  }

  navigateConnectedElement(compositeKey: string, routeLink: string, locationKey?: string | null, loreEntryId?: string | null): void {
    if (loreEntryId) {
      this.worldLore.selectLoreEntry(loreEntryId);
      this.worldLore.setPrimaryTab('lore');
      this.router.navigateByUrl('/world-lore');
      return;
    }
    if (locationKey && routeLink.startsWith('/world-lore')) {
      this.worldLore.selectLocation(locationKey);
      this.worldLore.setPrimaryTab('atlas');
      this.router.navigateByUrl('/world-lore');
      return;
    }
    this.store.inspectEntity(compositeKey);
    if (compositeKey.includes('room-c3-crypt')) {
      this.advGuide.selectScope('room', 'node-room-c3-crypt');
    } else if (compositeKey.includes('session-15')) {
      this.advGuide.selectScope('session', 'session-15');
    }
  }
}
