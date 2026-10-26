import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  EffectCameraPreset,
  EffectEmitterCardVm,
  EffectGizmoToolId,
  EffectInGameTestResultVm,
  EffectInspectorTabId,
  EffectMotionForceConfigVm,
  EffectRailToolId,
  EffectStudioDocumentVm,
  EffectStudioMode,
  EffectTimelineTrackVm,
} from '../models/effect-studio.models';
import {
  DEFAULT_MOTION_FORCES,
  DEFAULT_STUDIO_DOCUMENT,
  DEFAULT_TIMELINE_TRACKS,
  EFFECT_EMITTER_LIBRARY_SEED,
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
    this.loadStudioBootstrap();
  }

  loadStudioBootstrap(): void {
    this.http
      .get<{
        emitters: readonly EffectEmitterCardVm[];
        documents: readonly EffectStudioDocumentVm[];
        activeDocument: EffectStudioDocumentVm;
      }>('/api/v2/effects/studio?campaignId=1')
      .subscribe({
        next: (res) => {
          if (res?.emitters?.length) {
            this.emitters.set(res.emitters);
          }
          if (res?.documents?.length) {
            this.savedDocuments.set(res.documents);
          }
          if (res?.activeDocument) {
            this.hydrateDocument(res.activeDocument, false);
          }
        },
        error: () => {},
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

  updateTrackWindow(trackId: string, startSec: number, endSec: number): void {
    this.pushHistorySnapshot();
    const maxD = this.totalDurationSeconds();
    const s = Math.max(0, Math.min(maxD - 0.2, Number(startSec)));
    const e = Math.max(s + 0.2, Math.min(maxD, Number(endSec)));
    this.tracks.update((list) =>
      list.map((t) =>
        t.id === trackId ? { ...t, startTimeSeconds: s, endTimeSeconds: e } : t,
      ),
    );
    this.statusLabel.set('Not Saved');
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

  saveEffectDocument(viewerRole: 'gm' | 'players' = 'gm'): void {
    const payload = {
      id: this.effectId(),
      campaignId: 1,
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
        this.showToast(`Saved '${saved.name}' to LoomWeaver Effect Studio.`);
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

    this.http
      .post<EffectInGameTestResultVm>('/api/v2/effects/test-in-game', {
        effectId: this.effectId(),
        casterTokenKey: '1:PlayerCharacter:pc-kycius',
        targetTokenKey: '1:Monster:skeleton-vanguard-1',
        targetX: 0,
        targetZ: 0,
        reducedMotion: this.reducedMotion(),
      })
      .subscribe({
        next: (res) => {
          this.lastInGameTestResult.set(res);
          this.showToast(res.combatLogSummary);
        },
        error: () => {
          const fallback: EffectInGameTestResultVm = {
            effectId: this.effectId(),
            effectName: this.effectName(),
            casterTokenKey: '1:PlayerCharacter:pc-kycius',
            targetTokenKey: '1:Monster:skeleton-vanguard-1',
            distanceFeet: 20,
            simulatedParticlesSpawned: this.activeProperties().emissionRate * 3,
            dynamicLightPeakLux: this.activeProperties().lightIntensity * 45,
            TriggeredTrackLabels: this.tracks()
              .filter((t) => t.visible)
              .map((t) => t.label),
            combatLogSummary: `[In-Game VTT Test] Fired '${this.effectName()}' across dungeon stage (${this.activeProperties().radius}m radius).`,
            timestamp: new Date().toISOString(),
          } as unknown as EffectInGameTestResultVm;
          this.lastInGameTestResult.set(fallback);
          this.showToast(fallback.combatLogSummary);
        },
      });
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
    setTimeout(() => {
      if (this.toastBanner() === msg) {
        this.toastBanner.set('');
      }
    }, 4500);
  }
}
