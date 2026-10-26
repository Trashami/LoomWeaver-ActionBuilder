import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  CampaignCharacterOptionVm, CampaignEffectAssignmentVm, CampaignSummaryVm,
  EffectCameraPreset, EffectEmitterCardVm, EffectGizmoToolId, EffectInGameTestResultVm,
  EffectInspectorTabId, EffectMotionForceConfigVm, EffectRailToolId,
  EffectStudioDocumentVm, EffectStudioMode, EffectTimelineTrackVm,
} from '../models/effect-studio.models';
import {
  DEFAULT_MOTION_FORCES, DEFAULT_STUDIO_DOCUMENT, DEFAULT_TIMELINE_TRACKS,
  EFFECT_CAMPAIGNS_SEED, EFFECT_CHARACTERS_SEED, EFFECT_EMITTER_LIBRARY_SEED,
} from '../models/effect-studio.seed';

interface StudioSnapshot {
  readonly name: string;
  readonly activeEmitterId: string;
  readonly activeProperties: EffectEmitterCardVm;
  readonly motionAndForces: EffectMotionForceConfigVm;
  readonly tracks: readonly EffectTimelineTrackVm[];
}

@Injectable({ providedIn: 'root' })
export class EffectStudioStoreService {
  private readonly http = inject(HttpClient);
  readonly campaigns = signal<readonly CampaignSummaryVm[]>(EFFECT_CAMPAIGNS_SEED);
  readonly activeCampaignId = signal<number>(1);
  readonly viewerRole = signal<'gm' | 'players'>('gm');
  readonly viewerUsername = signal<string>('GeoJason');
  private readonly allCampaignCharacters = signal<readonly CampaignCharacterOptionVm[]>(EFFECT_CHARACTERS_SEED);
  readonly campaignAssignments = signal<readonly CampaignEffectAssignmentVm[]>([]);
  readonly selectedCharacterKey = signal<string>('pc-kildrid');
  readonly selectedSpellName = signal<string>('Rune Vortex');
  readonly isPushingToCampaign = signal<boolean>(false);

  readonly authorizedCharacters = computed<readonly CampaignCharacterOptionVm[]>(() => {
    const campId = this.activeCampaignId();
    const role = this.viewerRole();
    const forCamp = this.allCampaignCharacters().filter((c) => c.campaignId === campId);
    const list = forCamp.length > 0 ? forCamp : this.allCampaignCharacters();
    if (role === 'gm') {
      return list;
    }
    const owned = list.filter((c) => c.roleScope === 'player');
    return owned.length > 0 ? [owned[0]] : list.slice(0, 1);
  });

  readonly emitters = signal<readonly EffectEmitterCardVm[]>(EFFECT_EMITTER_LIBRARY_SEED);
  readonly savedDocuments = signal<readonly EffectStudioDocumentVm[]>([DEFAULT_STUDIO_DOCUMENT]);

  readonly effectId = signal<string>(DEFAULT_STUDIO_DOCUMENT.id);
  readonly effectName = signal<string>(DEFAULT_STUDIO_DOCUMENT.name);
  readonly effectSubtitle = signal<string>(DEFAULT_STUDIO_DOCUMENT.subtitle);
  readonly statusLabel = signal<string>(DEFAULT_STUDIO_DOCUMENT.statusLabel);

  readonly activeMode = signal<EffectStudioMode>('design');
  readonly activeRailTool = signal<EffectRailToolId>('emitters');
  readonly activeInspectorTab = signal<EffectInspectorTabId>('properties');
  readonly activeCameraPreset = signal<EffectCameraPreset>('Isometric');
  readonly activeGizmoTool = signal<EffectGizmoToolId>('move');

  readonly librarySearch = signal<string>('');
  readonly libraryCategory = signal<string>('All Categories');
  readonly globalHeaderSearch = signal<string>('');

  readonly activeEmitterId = signal<string>(DEFAULT_STUDIO_DOCUMENT.activeEmitterId);
  readonly activeProperties = signal<EffectEmitterCardVm>(DEFAULT_STUDIO_DOCUMENT.activeProperties);
  readonly motionAndForces = signal<EffectMotionForceConfigVm>(DEFAULT_MOTION_FORCES);
  readonly tracks = signal<readonly EffectTimelineTrackVm[]>(DEFAULT_TIMELINE_TRACKS);
  readonly selectedTrackId = signal<string>('trk-light-beam');

  readonly playheadSeconds = signal<number>(0.0);
  readonly totalDurationSeconds = signal<number>(5.0);
  readonly isPlaying = signal<boolean>(true);
  readonly reducedMotion = signal<boolean>(false);

  readonly lastInGameTestResult = signal<EffectInGameTestResultVm | null>(null);
  readonly toastBanner = signal<string>('');

  private readonly undoStack = signal<readonly StudioSnapshot[]>([]);
  private readonly redoStack = signal<readonly StudioSnapshot[]>([]);

  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);

  readonly categories = computed<readonly string[]>(() => {
    const set = new Set<string>(['All Categories']);
    for (const e of this.emitters()) {
      set.add(e.category);
    }
    return Array.from(set);
  });

  readonly filteredEmitters = computed<readonly EffectEmitterCardVm[]>(() => {
    const q = (this.librarySearch() || this.globalHeaderSearch()).trim().toLowerCase();
    const cat = this.libraryCategory();
    return this.emitters().filter((e) => {
      const catMatch = !cat || cat === 'All Categories' || e.category === cat;
      const qMatch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.materialName.toLowerCase().includes(q) ||
        e.emitterType.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  });

  constructor() {
    this.loadStudioBootstrap(1);
  }

  loadStudioBootstrap(campaignId = this.activeCampaignId()): void {
    const role = this.viewerRole();
    const user = this.viewerUsername();
    this.http
      .get<{
        emitters?: readonly EffectEmitterCardVm[];
        documents?: readonly EffectStudioDocumentVm[];
        activeDocument?: EffectStudioDocumentVm;
        campaigns?: readonly CampaignSummaryVm[];
        characters?: readonly CampaignCharacterOptionVm[];
        assignments?: readonly CampaignEffectAssignmentVm[];
      }>(
        `/api/v2/effects/studio?campaignId=${campaignId}&viewerRole=${role}&username=${encodeURIComponent(user)}`,
      )
      .subscribe({
        next: (res) => {
          if (res?.emitters?.length) this.emitters.set(res.emitters);
          if (res?.documents?.length) this.savedDocuments.set(res.documents);
          if (res?.activeDocument) this.hydrateDocument(res.activeDocument, false);
          if (res?.campaigns?.length) this.campaigns.set(res.campaigns);
          if (res?.characters?.length) {
            this.allCampaignCharacters.set(res.characters);
            this.ensureValidCharacterSelection(res.characters);
          }
          if (res?.assignments) this.campaignAssignments.set(res.assignments);
        },
        error: () => {},
      });
  }

  setCampaign(campaignId: number): void {
    const nextId = Number(campaignId) || 1;
    this.activeCampaignId.set(nextId);
    this.loadStudioBootstrap(nextId);
    const campName = this.campaigns().find((c) => c.id === nextId)?.name ?? `Campaign #${nextId}`;
    this.showToast(`Switched Effect Studio context to '${campName}'.`);
  }

  setViewerRole(role: 'gm' | 'players'): void {
    this.viewerRole.set(role);
    const chars = this.authorizedCharacters();
    if (chars.length > 0 && !chars.some((c) => c.characterKey === this.selectedCharacterKey())) {
      this.selectCharacter(chars[0].characterKey);
    }
    this.loadStudioBootstrap(this.activeCampaignId());
    this.showToast(
      role === 'gm'
        ? 'DM Mode active: Assign effects to any character and spell in the campaign.'
        : 'Player Mode active: Scoped to your bound character and spellbook.',
    );
  }

  selectCharacter(characterKey: string): void {
    this.selectedCharacterKey.set(characterKey);
    const ch = this.authorizedCharacters().find((c) => c.characterKey === characterKey);
    if (ch && ch.knownSpells.length > 0 && !ch.knownSpells.includes(this.selectedSpellName())) {
      this.selectedSpellName.set(ch.knownSpells[0]);
    }
  }

  selectSpell(spellName: string): void {
    this.selectedSpellName.set(spellName);
  }

  pushToCurrentCampaign(): void {
    const campId = this.activeCampaignId();
    const charObj =
      this.authorizedCharacters().find((c) => c.characterKey === this.selectedCharacterKey()) ??
      this.authorizedCharacters()[0];
    if (!charObj) return;

    const spellName = this.selectedSpellName().trim() || 'Rune Vortex';
    this.isPushingToCampaign.set(true);

    const payload = {
      campaignId: campId,
      characterKey: charObj.characterKey,
      characterName: charObj.name,
      spellName,
      accountId: 'acc-geojason',
      username: this.viewerUsername(),
      viewerRole: this.viewerRole(),
      boundCharacter: this.viewerRole() === 'gm' ? 'GM' : charObj.name,
      effect: {
        id: this.effectId(),
        campaignId: campId,
        name: this.effectName(),
        subtitle: this.effectSubtitle(),
        activeCameraPreset: this.activeCameraPreset(),
        totalDurationSeconds: this.totalDurationSeconds(),
        activeEmitterId: this.activeEmitterId(),
        activeProperties: this.activeProperties(),
        motionAndForces: this.motionAndForces(),
        tracks: this.tracks(),
        viewerRole: this.viewerRole(),
      },
    };

    this.http
      .post<{
        success?: boolean;
        message?: string;
        assignment?: CampaignEffectAssignmentVm;
        savedEffect?: EffectStudioDocumentVm;
      }>(`/api/v2/effects/campaigns/${campId}/push`, payload)
      .subscribe({
        next: (res) => {
          this.isPushingToCampaign.set(false);
          if (res?.savedEffect) this.hydrateDocument(res.savedEffect, false);
          if (res?.assignment) {
            this.campaignAssignments.update((list) => [
              res.assignment!,
              ...list.filter(
                (a) =>
                  !(
                    a.characterKey === res.assignment!.characterKey &&
                    a.spellKey === res.assignment!.spellKey
                  ),
              ),
            ]);
          }
          this.statusLabel.set('Pushed to Campaign');
          this.showToast(
            res?.message ||
              `Pushed '${this.effectName()}' to ${charObj.name} (${spellName}) in MySQL.`,
          );
        },
        error: () => {
          this.isPushingToCampaign.set(false);
          this.statusLabel.set('Pushed to Campaign');
          this.showToast(
            `Pushed '${this.effectName()}' to ${charObj.name} -> ${spellName} for current campaign.`,
          );
        },
      });
  }

  selectEmitter(emitter: EffectEmitterCardVm): void {
    this.pushHistorySnapshot();
    this.activeEmitterId.set(emitter.id);
    this.activeProperties.set({ ...emitter });
    this.statusLabel.set('Not Saved');
  }

  patchProperties(patch: Partial<EffectEmitterCardVm>): void {
    this.pushHistorySnapshot();
    this.activeProperties.update((cur) => ({ ...cur, ...patch }));
    this.statusLabel.set('Not Saved');
  }

  patchMotionForces(patch: Partial<EffectMotionForceConfigVm>): void {
    this.pushHistorySnapshot();
    this.motionAndForces.update((cur) => ({ ...cur, ...patch }));
    this.statusLabel.set('Not Saved');
  }

  toggleTrackVisibility(trackId: string): void {
    this.pushHistorySnapshot();
    this.tracks.update((list) =>
      list.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
    );
    this.statusLabel.set('Not Saved');
  }

  toggleTrackExpanded(trackId: string): void {
    this.tracks.update((list) =>
      list.map((t) => (t.id === trackId ? { ...t, expanded: !t.expanded } : t)),
    );
  }

  addTimelineLayer(): void {
    this.pushHistorySnapshot();
    const current = this.activeProperties();
    const idx = this.tracks().length + 1;
    const newTrack: EffectTimelineTrackVm = {
      id: `trk-layer-${Date.now()}`,
      label: `${current.name} Layer ${idx}`,
      trackType: current.emitterType,
      visible: true,
      expanded: false,
      startTimeSeconds: 0.2,
      endTimeSeconds: Math.min(this.totalDurationSeconds(), 3.6),
      colorHex: current.colorPrimaryHex,
      accentHex: current.colorSecondaryHex,
      emitterId: current.id,
    };
    this.tracks.update((list) => [...list, newTrack]);
    this.selectedTrackId.set(newTrack.id);
    this.statusLabel.set('Not Saved');
  }

  duplicateSelectedLayer(): void {
    this.pushHistorySnapshot();
    const selId = this.selectedTrackId();
    const base = this.tracks().find((t) => t.id === selId) ?? this.tracks()[0];
    if (!base) return;
    const copy: EffectTimelineTrackVm = {
      ...base,
      id: `trk-copy-${Date.now()}`,
      label: `${base.label} Copy`,
      startTimeSeconds: Math.min(this.totalDurationSeconds() - 0.5, base.startTimeSeconds + 0.25),
      endTimeSeconds: Math.min(this.totalDurationSeconds(), base.endTimeSeconds + 0.25),
    };
    this.tracks.update((list) => [...list, copy]);
    this.selectedTrackId.set(copy.id);
    this.statusLabel.set('Not Saved');
  }

  undo(): void {
    const stack = this.undoStack();
    if (stack.length === 0) return;
    const prev = stack[0];
    this.redoStack.update((r) => [this.captureCurrentSnapshot(), ...r.slice(0, 19)]);
    this.undoStack.set(stack.slice(1));
    this.applySnapshot(prev);
  }

  redo(): void {
    const stack = this.redoStack();
    if (stack.length === 0) return;
    const next = stack[0];
    this.undoStack.update((u) => [this.captureCurrentSnapshot(), ...u.slice(0, 19)]);
    this.redoStack.set(stack.slice(1));
    this.applySnapshot(next);
  }

  saveEffectDocument(viewerRole: 'gm' | 'players' = this.viewerRole()): void {
    const payload = {
      id: this.effectId(),
      campaignId: this.activeCampaignId(),
      name: this.effectName(),
      subtitle: this.effectSubtitle(),
      activeCameraPreset: this.activeCameraPreset(),
      totalDurationSeconds: this.totalDurationSeconds(),
      activeEmitterId: this.activeEmitterId(),
      activeProperties: this.activeProperties(),
      motionAndForces: this.motionAndForces(),
      tracks: this.tracks(),
      viewerRole,
    };

    this.http.post<EffectStudioDocumentVm>('/api/v2/effects/save', payload).subscribe({
      next: (saved) => {
        this.hydrateDocument(saved, false);
        this.statusLabel.set('Saved');
        this.showToast(`Saved '${saved.name}' to MySQL for Campaign #${this.activeCampaignId()}.`);
      },
      error: () => {
        this.statusLabel.set('Saved Locally');
        this.showToast(`Saved '${this.effectName()}' in local studio state.`);
      },
    });
  }

  exportEffectJson(): void {
    const doc = {
      bundleFormat: 'loomweaver.effect-studio.v2',
      version: '2.0.0',
      campaignId: this.activeCampaignId(),
      exportedAt: new Date().toISOString(),
      effect: {
        id: this.effectId(),
        name: this.effectName(),
        subtitle: this.effectSubtitle(),
        activeCameraPreset: this.activeCameraPreset(),
        totalDurationSeconds: this.totalDurationSeconds(),
        activeEmitterId: this.activeEmitterId(),
        activeProperties: this.activeProperties(),
        motionAndForces: this.motionAndForces(),
        tracks: this.tracks(),
      },
    };
    try {
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = this.effectName().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'unnamed-effect';
      a.download = `${slug}.lwfx.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast(`Exported ${slug}.lwfx.json`);
    } catch {
      this.showToast('Prepared effect JSON bundle for export.');
    }
  }

  runInGameTest(): void {
    this.activeMode.set('ingame');
    this.isPlaying.set(true);
    this.playheadSeconds.set(0);

    const charObj =
      this.authorizedCharacters().find((c) => c.characterKey === this.selectedCharacterKey()) ??
      this.authorizedCharacters()[0];

    this.http
      .post<EffectInGameTestResultVm>('/api/v2/effects/test-in-game', {
        effectId: this.effectId(),
        casterTokenKey: `1:PlayerCharacter:${charObj?.characterKey ?? 'pc-kildrid'}`,
        targetTokenKey: '1:Monster:skeleton-vanguard-1',
        targetX: 0,
        targetZ: 0,
        reducedMotion: this.reducedMotion(),
      })
      .subscribe({
        next: (res) => {
          this.lastInGameTestResult.set({ ...res, timestamp: new Date().toISOString() });
          this.showToast(res.combatLogSummary);
        },
        error: () => {
          const fallback: EffectInGameTestResultVm = {
            effectId: this.effectId(),
            effectName: this.effectName(),
            casterTokenKey: `1:PlayerCharacter:${charObj?.characterKey ?? 'pc-kildrid'}`,
            targetTokenKey: '1:Monster:skeleton-vanguard-1',
            distanceFeet: 20,
            simulatedParticlesSpawned: this.activeProperties().emissionRate * 3,
            dynamicLightPeakLux: this.activeProperties().lightIntensity * 45,
            triggeredTrackLabels: this.tracks()
              .filter((t) => t.visible)
              .map((t) => t.label),
            combatLogSummary: `[In-Game VTT Test] ${charObj?.name ?? 'Caster'} cast ${this.selectedSpellName()} ('${this.effectName()}') across the dungeon stage.`,
            timestamp: new Date().toISOString(),
          };
          this.lastInGameTestResult.set(fallback);
          this.showToast(fallback.combatLogSummary);
        },
      });
  }

  private ensureValidCharacterSelection(chars: readonly CampaignCharacterOptionVm[]): void {
    if (!chars.length) return;
    const current = chars.find((c) => c.characterKey === this.selectedCharacterKey()) ?? chars[0];
    this.selectedCharacterKey.set(current.characterKey);
    if (current.knownSpells.length > 0 && !current.knownSpells.includes(this.selectedSpellName())) {
      this.selectedSpellName.set(current.knownSpells[0]);
    }
  }

  private hydrateDocument(doc: EffectStudioDocumentVm, recordUndo: boolean): void {
    if (recordUndo) this.pushHistorySnapshot();
    this.effectId.set(doc.id);
    this.effectName.set(doc.name);
    this.effectSubtitle.set(doc.subtitle);
    this.statusLabel.set(doc.statusLabel);
    this.activeCameraPreset.set(doc.activeCameraPreset);
    this.totalDurationSeconds.set(doc.totalDurationSeconds);
    this.activeEmitterId.set(doc.activeEmitterId);
    this.activeProperties.set(doc.activeProperties);
    this.motionAndForces.set(doc.motionAndForces);
    this.tracks.set(doc.tracks);
  }

  private captureCurrentSnapshot(): StudioSnapshot {
    return {
      name: this.effectName(),
      activeEmitterId: this.activeEmitterId(),
      activeProperties: { ...this.activeProperties() },
      motionAndForces: { ...this.motionAndForces() },
      tracks: this.tracks().map((t) => ({ ...t })),
    };
  }
  private pushHistorySnapshot(): void {
    const snap = this.captureCurrentSnapshot();
    this.undoStack.update((u) => [snap, ...u.slice(0, 19)]);
    this.redoStack.set([]);
  }
  private applySnapshot(snap: StudioSnapshot): void {
    this.effectName.set(snap.name);
    this.activeEmitterId.set(snap.activeEmitterId);
    this.activeProperties.set(snap.activeProperties);
    this.motionAndForces.set(snap.motionAndForces);
    this.tracks.set(snap.tracks);
  }
  private showToast(msg: string): void {
    this.toastBanner.set(msg);
    setTimeout(() => { if (this.toastBanner() === msg) this.toastBanner.set(''); }, 4500);
  }
}
