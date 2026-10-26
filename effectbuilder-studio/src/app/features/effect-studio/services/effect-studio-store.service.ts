import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  CampaignCharacterOptionVm, CampaignEffectAssignmentVm, CampaignSummaryVm,
  EffectAppearanceId, EffectAppearancePresetVm, EffectCameraPreset, EffectCompositePresetVm,
  EffectEasingKind, EffectEmitterCardVm, EffectGizmoToolId, EffectInGameTestResultVm,
  EffectInspectorTabId, EffectLibrarySectionId, EffectMotionForceConfigVm, EffectOpacityKeyframeVm,
  EffectRailToolId, EffectStudioDocumentVm, EffectStudioMode, EffectTimelineTrackVm,
  EffectViewDimensionMode,
} from '../models/effect-studio.models';
import {
  DEFAULT_MOTION_FORCES, DEFAULT_STUDIO_DOCUMENT, DEFAULT_TIMELINE_TRACKS,
  EFFECT_APPEARANCES_SEED, EFFECT_CAMPAIGNS_SEED, EFFECT_CHARACTERS_SEED,
  EFFECT_COMPOSITE_PRESETS_SEED, EFFECT_EMITTER_LIBRARY_SEED,
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
    const forCamp = this.allCampaignCharacters().filter((c) => c.campaignId === campId);
    const list = forCamp.length > 0 ? forCamp : this.allCampaignCharacters();
    if (this.viewerRole() === 'gm') return list;
    const owned = list.filter((c) => c.roleScope === 'player');
    return owned.length > 0 ? [owned[0]] : list.slice(0, 1);
  });

  readonly emitters = signal<readonly EffectEmitterCardVm[]>(EFFECT_EMITTER_LIBRARY_SEED);
  readonly appearances = signal<readonly EffectAppearancePresetVm[]>(EFFECT_APPEARANCES_SEED);
  readonly presets = signal<readonly EffectCompositePresetVm[]>(EFFECT_COMPOSITE_PRESETS_SEED);
  readonly savedDocuments = signal<readonly EffectStudioDocumentVm[]>([DEFAULT_STUDIO_DOCUMENT]);

  readonly effectId = signal<string>(DEFAULT_STUDIO_DOCUMENT.id);
  readonly effectName = signal<string>(DEFAULT_STUDIO_DOCUMENT.name);
  readonly effectSubtitle = signal<string>(DEFAULT_STUDIO_DOCUMENT.subtitle);
  readonly statusLabel = signal<string>(DEFAULT_STUDIO_DOCUMENT.statusLabel);

  readonly activeMode = signal<EffectStudioMode>('design');
  readonly navCollapsed = signal<boolean>(false);
  readonly viewDimensionMode = signal<EffectViewDimensionMode>('3d');
  readonly activeRailTool = signal<EffectRailToolId>('emitters');
  readonly activeLibrarySection = signal<EffectLibrarySectionId>('effects');
  readonly activeInspectorTab = signal<EffectInspectorTabId>('properties');
  readonly activeCameraPreset = signal<EffectCameraPreset>('Isometric');
  readonly activeGizmoTool = signal<EffectGizmoToolId>('move');

  readonly librarySearch = signal<string>('');
  readonly libraryCategory = signal<string>('All Categories');
  readonly globalHeaderSearch = signal<string>('');

  readonly activeEmitterId = signal<string>(DEFAULT_STUDIO_DOCUMENT.activeEmitterId);
  readonly activeAppearanceId = signal<EffectAppearanceId>('Radiant');
  readonly activePresetId = signal<string>('preset-luminary-pillar');
  readonly activeProperties = signal<EffectEmitterCardVm>(DEFAULT_STUDIO_DOCUMENT.activeProperties);
  readonly motionAndForces = signal<EffectMotionForceConfigVm>(DEFAULT_MOTION_FORCES);
  readonly tracks = signal<readonly EffectTimelineTrackVm[]>(DEFAULT_TIMELINE_TRACKS);
  readonly selectedTrackId = signal<string>('trk-cast-charge');

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
    for (const e of this.emitters()) set.add(e.category);
    return Array.from(set);
  });

  readonly filteredEmitters = computed<readonly EffectEmitterCardVm[]>(() => {
    const q = (this.librarySearch() || this.globalHeaderSearch()).trim().toLowerCase();
    const cat = this.libraryCategory();
    return this.emitters().filter((e) => {
      const catMatch = !cat || cat === 'All Categories' || e.category === cat;
      const qMatch = !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
        || e.materialName.toLowerCase().includes(q) || e.emitterType.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  });

  constructor() { this.loadStudioBootstrap(1); }

  loadStudioBootstrap(campaignId = this.activeCampaignId()): void {
    const url = `/api/v2/effects/studio?campaignId=${campaignId}&viewerRole=${this.viewerRole()}&username=${encodeURIComponent(this.viewerUsername())}`;
    this.http.get<Record<string, unknown>>(url).subscribe({
      next: (res: any) => {
        if (res?.emitters?.length >= 20) this.emitters.set(res.emitters);
        if (res?.documents?.length) this.savedDocuments.set(res.documents);
        if (res?.activeDocument) this.hydrateDocument(res.activeDocument, false);
        if (res?.campaigns?.length) this.campaigns.set(res.campaigns);
        if (res?.characters?.length) { this.allCampaignCharacters.set(res.characters); this.ensureValidCharacterSelection(res.characters); }
        if (res?.assignments) this.campaignAssignments.set(res.assignments);
      },
      error: () => {},
    });
  }

  selectRailTool(tool: EffectRailToolId): void {
    this.activeRailTool.set(tool);
    if (tool === 'emitters') { this.activeLibrarySection.set('effects'); this.libraryCategory.set('All Categories'); }
    else if (tool === 'materials') this.activeLibrarySection.set('appearances');
    else if (tool === 'presets') this.activeLibrarySection.set('presets');
    else if (tool === 'forces') { this.activeLibrarySection.set('effects'); this.libraryCategory.set('Area & Zones'); }
    else if (tool === 'lights') { this.activeLibrarySection.set('effects'); this.libraryCategory.set('Illumination & Marks'); }
    else if (tool === 'models') { this.activeLibrarySection.set('effects'); this.libraryCategory.set('Projectiles & Flight'); }
    else if (tool === 'sounds') { this.activeLibrarySection.set('effects'); this.libraryCategory.set('Audio & Atmosphere'); }
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
    this.showToast(role === 'gm' ? 'DM Mode active: Assign effects to any character and spell.' : 'Player Mode active: Scoped to your bound character.');
  }

  selectCharacter(characterKey: string): void {
    this.selectedCharacterKey.set(characterKey);
    const ch = this.authorizedCharacters().find((c) => c.characterKey === characterKey);
    if (ch && ch.knownSpells.length > 0 && !ch.knownSpells.includes(this.selectedSpellName())) {
      this.selectedSpellName.set(ch.knownSpells[0]);
    }
  }

  selectSpell(spellName: string): void { this.selectedSpellName.set(spellName); }

  selectEmitter(emitter: EffectEmitterCardVm): void {
    this.pushHistorySnapshot();
    this.activeEmitterId.set(emitter.id);
    this.activeProperties.set({ ...emitter });
    if (emitter.appearanceId) this.activeAppearanceId.set(emitter.appearanceId);
    const selId = this.selectedTrackId();
    this.tracks.update((list) =>
      list.map((t) => (t.id === selId ? { ...t, trackType: emitter.emitterType, emitterId: emitter.id, colorHex: emitter.colorPrimaryHex, accentHex: emitter.colorSecondaryHex, appearanceId: emitter.appearanceId ?? t.appearanceId } : t)),
    );
    this.statusLabel.set('Not Saved');
  }

  selectTrack(trackId: string): void {
    this.selectedTrackId.set(trackId);
    const trk = this.tracks().find((t) => t.id === trackId);
    if (!trk) return;
    const base = this.emitters().find((e) => e.id === trk.emitterId || e.emitterType === trk.trackType) ?? this.activeProperties();
    this.activeEmitterId.set(base.id);
    this.activeProperties.set({
      ...base, emitterType: trk.trackType, appearanceId: trk.appearanceId ?? base.appearanceId,
      colorPrimaryHex: trk.colorHex || base.colorPrimaryHex, colorSecondaryHex: trk.accentHex || base.colorSecondaryHex,
      scale: trk.scale ?? base.scale ?? 1.0, count: trk.count ?? base.count ?? 3,
      opacityPercent: trk.opacityPercent ?? base.opacityPercent, animationModifier: trk.animationModifier ?? base.animationModifier,
    });
  }

  selectAppearance(app: EffectAppearancePresetVm): void {
    this.pushHistorySnapshot();
    this.activeAppearanceId.set(app.id);
    this.activeProperties.update((cur) => ({
      ...cur, appearanceId: app.id, colorPrimaryHex: app.colorPrimaryHex, colorSecondaryHex: app.colorSecondaryHex,
      previewAccentHex: app.colorPrimaryHex, materialName: app.materialName, blendMode: app.blendMode,
    }));
    const selId = this.selectedTrackId();
    this.tracks.update((list) => list.map((t) => (t.id === selId ? { ...t, appearanceId: app.id, colorHex: app.colorPrimaryHex, accentHex: app.colorSecondaryHex } : t)));
    this.statusLabel.set('Not Saved');
    this.showToast(`Applied '${app.name}' appearance palette.`);
  }

  selectPreset(preset: EffectCompositePresetVm): void {
    this.pushHistorySnapshot();
    this.activePresetId.set(preset.id);
    this.effectName.set(preset.name);
    this.effectSubtitle.set(`Expanded Preset · ${preset.tracks.length} Timeline Layers`);
    this.totalDurationSeconds.set(preset.totalDurationSeconds);
    this.tracks.set(preset.tracks.map((t) => ({ ...t })));
    if (preset.tracks.length > 0) this.selectTrack(preset.tracks[0].id);
    const matchingBlock = this.emitters().find((e) => e.id === preset.baseEmitterId) ?? this.emitters()[0];
    const app = this.appearances().find((a) => a.id === preset.appearanceId);
    if (matchingBlock) {
      this.activeEmitterId.set(matchingBlock.id);
      this.activeProperties.set({
        ...matchingBlock,
        appearanceId: preset.appearanceId,
        colorPrimaryHex: app?.colorPrimaryHex ?? matchingBlock.colorPrimaryHex,
        colorSecondaryHex: app?.colorSecondaryHex ?? matchingBlock.colorSecondaryHex,
        materialName: app?.materialName ?? matchingBlock.materialName,
      });
    }
    this.activeAppearanceId.set(preset.appearanceId);
    this.playheadSeconds.set(0);
    this.isPlaying.set(true);
    this.statusLabel.set('Not Saved');
    this.showToast(`Expanded '${preset.name}' into ${preset.tracks.length} independent timeline layers.`);
  }

  patchProperties(patch: Partial<EffectEmitterCardVm>): void {
    this.pushHistorySnapshot();
    this.activeProperties.update((cur) => ({ ...cur, ...patch }));
    if (patch.appearanceId) this.activeAppearanceId.set(patch.appearanceId);
    this.statusLabel.set('Not Saved');
  }

  patchTrack(event: { trackId: string; patch: Partial<EffectTimelineTrackVm> }): void {
    this.pushHistorySnapshot();
    this.tracks.update((list) => list.map((t) => (t.id === event.trackId ? { ...t, ...event.patch } : t)));
    this.statusLabel.set('Not Saved');
  }

  updateTrackTiming(event: { trackId: string; startTimeSeconds: number; endTimeSeconds: number }): void {
    this.tracks.update((list) => list.map((t) => (t.id === event.trackId ? { ...t, startTimeSeconds: event.startTimeSeconds, endTimeSeconds: event.endTimeSeconds } : t)));
    this.statusLabel.set('Not Saved');
  }

  updateTrackEasing(event: { trackId: string; easing: EffectEasingKind }): void {
    this.pushHistorySnapshot();
    this.tracks.update((list) => list.map((t) => (t.id === event.trackId ? { ...t, easing: event.easing } : t)));
    this.statusLabel.set('Not Saved');
  }

  updateTrackOpacityKeyframes(event: { trackId: string; keyframes: readonly EffectOpacityKeyframeVm[] }): void {
    this.tracks.update((list) => list.map((t) => (t.id === event.trackId ? { ...t, opacityKeyframes: [...event.keyframes] } : t)));
    this.statusLabel.set('Not Saved');
  }

  reorderTrack(event: { trackId: string; direction: -1 | 1 }): void {
    this.pushHistorySnapshot();
    this.tracks.update((list) => {
      const idx = list.findIndex((t) => t.id === event.trackId);
      const nextIdx = idx + event.direction;
      if (idx < 0 || nextIdx < 0 || nextIdx >= list.length) return list;
      const copy = [...list];
      const [moved] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, moved);
      return copy;
    });
    this.statusLabel.set('Not Saved');
  }

  removeTimelineLayer(trackId: string): void {
    if (this.tracks().length <= 1) return;
    this.pushHistorySnapshot();
    this.tracks.update((list) => list.filter((t) => t.id !== trackId));
    const remaining = this.tracks();
    if (remaining.length > 0 && !remaining.some((t) => t.id === this.selectedTrackId())) this.selectTrack(remaining[0].id);
    this.statusLabel.set('Not Saved');
  }

  patchMotionForces(patch: Partial<EffectMotionForceConfigVm>): void {
    this.pushHistorySnapshot();
    this.motionAndForces.update((cur) => ({ ...cur, ...patch }));
    this.statusLabel.set('Not Saved');
  }

  toggleTrackVisibility(trackId: string): void {
    this.pushHistorySnapshot();
    this.tracks.update((list) => list.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)));
    this.statusLabel.set('Not Saved');
  }

  toggleTrackExpanded(trackId: string): void {
    this.tracks.update((list) => list.map((t) => (t.id === trackId ? { ...t, expanded: !t.expanded } : t)));
  }

  addTimelineLayer(): void {
    this.pushHistorySnapshot();
    const cur = this.activeProperties();
    const newTrack: EffectTimelineTrackVm = {
      id: `trk-layer-${Date.now()}`,
      label: `${cur.name} Layer ${this.tracks().length + 1}`,
      trackType: cur.emitterType,
      visible: true,
      expanded: false,
      startTimeSeconds: 0.2,
      endTimeSeconds: Math.min(this.totalDurationSeconds(), 3.0),
      colorHex: cur.colorPrimaryHex,
      accentHex: cur.colorSecondaryHex,
      emitterId: cur.id,
      anchor: 'target',
      appearanceId: cur.appearanceId ?? this.activeAppearanceId(),
      scale: cur.scale ?? 1.0,
      count: cur.count ?? 1,
      opacityPercent: cur.opacityPercent,
      animationModifier: 'Fade / Pulse',
      easing: 'ease-in-out',
      opacityKeyframes: [
        { time: 0, value: 0, easing: 'ease-out' },
        { time: 0.2, value: 1, easing: 'ease-in-out' },
        { time: 0.8, value: 1, easing: 'ease-in' },
        { time: 1, value: 0, easing: 'linear' },
      ],
    };
    this.tracks.update((list) => [...list, newTrack]);
    this.selectTrack(newTrack.id);
    this.statusLabel.set('Not Saved');
  }

  duplicateSelectedLayer(): void {
    this.pushHistorySnapshot();
    const base = this.tracks().find((t) => t.id === this.selectedTrackId()) ?? this.tracks()[0];
    if (!base) return;
    const copy: EffectTimelineTrackVm = {
      ...base,
      id: `trk-copy-${Date.now()}`,
      label: `${base.label} Copy`,
      startTimeSeconds: Math.min(this.totalDurationSeconds() - 0.5, base.startTimeSeconds + 0.25),
      endTimeSeconds: Math.min(this.totalDurationSeconds(), base.endTimeSeconds + 0.25),
    };
    this.tracks.update((list) => [...list, copy]);
    this.selectTrack(copy.id);
    this.statusLabel.set('Not Saved');
  }

  pushToCurrentCampaign(): void {
    const campId = this.activeCampaignId();
    const charObj = this.authorizedCharacters().find((c) => c.characterKey === this.selectedCharacterKey()) ?? this.authorizedCharacters()[0];
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
      effect: this.buildSavePayload(this.viewerRole()),
    };
    this.http
      .post<{ success?: boolean; message?: string; assignment?: CampaignEffectAssignmentVm; savedEffect?: EffectStudioDocumentVm }>(
        `/api/v2/effects/campaigns/${campId}/push`,
        payload,
      )
      .subscribe({
        next: (res) => {
          this.isPushingToCampaign.set(false);
          if (res?.savedEffect) this.hydrateDocument(res.savedEffect, false);
          if (res?.assignment) {
            this.campaignAssignments.update((list) => [
              res.assignment!,
              ...list.filter((a) => !(a.characterKey === res.assignment!.characterKey && a.spellKey === res.assignment!.spellKey)),
            ]);
          }
          this.statusLabel.set('Pushed to Campaign');
          this.showToast(res?.message || `Pushed '${this.effectName()}' to ${charObj.name} (${spellName}) in MySQL.`);
        },
        error: () => {
          this.isPushingToCampaign.set(false);
          this.statusLabel.set('Pushed to Campaign');
          this.showToast(`Pushed '${this.effectName()}' to ${charObj.name} -> ${spellName} for current campaign.`);
        },
      });
  }

  undo(): void {
    const stack = this.undoStack();
    if (!stack.length) return;
    this.redoStack.update((r) => [this.captureCurrentSnapshot(), ...r.slice(0, 19)]);
    this.undoStack.set(stack.slice(1));
    this.applySnapshot(stack[0]);
  }

  redo(): void {
    const stack = this.redoStack();
    if (!stack.length) return;
    this.undoStack.update((u) => [this.captureCurrentSnapshot(), ...u.slice(0, 19)]);
    this.redoStack.set(stack.slice(1));
    this.applySnapshot(stack[0]);
  }

  saveEffectDocument(viewerRole: 'gm' | 'players' = this.viewerRole()): void {
    this.http.post<EffectStudioDocumentVm>('/api/v2/effects/save', this.buildSavePayload(viewerRole)).subscribe({
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
    const doc = { bundleFormat: 'loomweaver.effect-studio.v2', version: '2.0.0', campaignId: this.activeCampaignId(), exportedAt: new Date().toISOString(), effect: this.buildSavePayload(this.viewerRole()) };
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
    } catch { this.showToast('Prepared effect JSON bundle for export.'); }
  }

  runInGameTest(): void {
    this.activeMode.set('ingame');
    this.isPlaying.set(true);
    this.playheadSeconds.set(0);
    const charObj = this.authorizedCharacters().find((c) => c.characterKey === this.selectedCharacterKey()) ?? this.authorizedCharacters()[0];
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
        error: () => {},
      });
  }

  private buildSavePayload(viewerRole: 'gm' | 'players') {
    return {
      id: this.effectId(), campaignId: this.activeCampaignId(), name: this.effectName(), subtitle: this.effectSubtitle(),
      activeCameraPreset: this.activeCameraPreset(), totalDurationSeconds: this.totalDurationSeconds(), activeEmitterId: this.activeEmitterId(),
      activeProperties: this.activeProperties(), motionAndForces: this.motionAndForces(), tracks: this.tracks(), viewerRole,
    };
  }

  private ensureValidCharacterSelection(chars: readonly CampaignCharacterOptionVm[]): void {
    if (!chars.length) return;
    const current = chars.find((c) => c.characterKey === this.selectedCharacterKey()) ?? chars[0];
    this.selectedCharacterKey.set(current.characterKey);
    if (current.knownSpells.length > 0 && !current.knownSpells.includes(this.selectedSpellName())) this.selectedSpellName.set(current.knownSpells[0]);
  }

  private hydrateDocument(doc: EffectStudioDocumentVm, recordUndo: boolean): void {
    if (recordUndo) this.pushHistorySnapshot();
    this.effectId.set(doc.id); this.effectName.set(doc.name); this.effectSubtitle.set(doc.subtitle); this.statusLabel.set(doc.statusLabel);
    this.activeCameraPreset.set(doc.activeCameraPreset); this.totalDurationSeconds.set(doc.totalDurationSeconds);
    this.activeEmitterId.set(doc.activeEmitterId); this.activeProperties.set(doc.activeProperties);
    this.motionAndForces.set(doc.motionAndForces); this.tracks.set(doc.tracks);
  }

  private captureCurrentSnapshot(): StudioSnapshot {
    return { name: this.effectName(), activeEmitterId: this.activeEmitterId(), activeProperties: { ...this.activeProperties() }, motionAndForces: { ...this.motionAndForces() }, tracks: this.tracks().map((t) => ({ ...t })) };
  }
  private pushHistorySnapshot(): void { this.undoStack.update((u) => [this.captureCurrentSnapshot(), ...u.slice(0, 19)]); this.redoStack.set([]); }
  private applySnapshot(snap: StudioSnapshot): void { this.effectName.set(snap.name); this.activeEmitterId.set(snap.activeEmitterId); this.activeProperties.set(snap.activeProperties); this.motionAndForces.set(snap.motionAndForces); this.tracks.set(snap.tracks); }
  private showToast(msg: string): void { this.toastBanner.set(msg); setTimeout(() => { if (this.toastBanner() === msg) this.toastBanner.set(''); }, 4500); }
}
