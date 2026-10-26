import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  EFFECT_EASINGS,
  EffectEasingKind,
  EffectOpacityKeyframeVm,
  EffectTimelineTrackVm,
  editTimelineClipMs,
  evaluateOpacityAt,
} from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

interface ActiveClipDrag {
  readonly pointerId: number;
  readonly trackId: string;
  readonly mode: 'move' | 'start' | 'end';
  readonly startClientX: number;
  readonly laneWidthPx: number;
  readonly origInMs: number;
  readonly origDurationMs: number;
}

@Component({
  selector: 'lw-effect-timeline-dock',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './effect-timeline-dock.component.html',
  styleUrl: './effect-timeline-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectTimelineDockComponent {
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly selectedTrackId = input<string>('trk-cast-charge');
  readonly isPlaying = input<boolean>(true);
  readonly playheadSeconds = input<number>(0.0);
  readonly totalDurationSeconds = input<number>(5.0);

  readonly easings = EFFECT_EASINGS;
  readonly snapEnabled = signal<boolean>(true);
  readonly expandedDock = signal<boolean>(false);
  readonly selectedKeyframeIndex = signal<number>(0);

  private activeClipDrag: ActiveClipDrag | null = null;
  private scrubbingPointerId: number | null = null;
  private draggingKeyframePointerId: number | null = null;

  readonly selectedTrack = computed<EffectTimelineTrackVm | null>(() => {
    const list = this.tracks();
    return list.find((t) => t.id === this.selectedTrackId()) ?? list[0] ?? null;
  });

  readonly selectedKeyframes = computed<readonly EffectOpacityKeyframeVm[]>(() => {
    const trk = this.selectedTrack();
    if (!trk?.opacityKeyframes || trk.opacityKeyframes.length === 0) {
      return [
        { time: 0, value: 1, easing: 'ease-out' },
        { time: 1, value: 1, easing: 'linear' },
      ];
    }
    return [...trk.opacityKeyframes].sort((a, b) => a.time - b.time);
  });

  readonly activeKeyframe = computed<EffectOpacityKeyframeVm | null>(() => {
    const kfs = this.selectedKeyframes();
    const idx = Math.max(0, Math.min(kfs.length - 1, this.selectedKeyframeIndex()));
    return kfs[idx] ?? null;
  });

  readonly selectedTrackLocalProgress = computed<number | null>(() => {
    const trk = this.selectedTrack();
    if (!trk) return null;
    const dur = Math.max(0.05, trk.endTimeSeconds - trk.startTimeSeconds);
    const rel = (this.playheadSeconds() - trk.startTimeSeconds) / dur;
    if (rel < 0 || rel > 1) return null;
    return rel;
  });

  readonly evaluatedOpacityPercent = computed<number>(() => {
    const kfs = this.selectedKeyframes();
    const prog = this.selectedTrackLocalProgress() ?? 0.5;
    return Math.round(evaluateOpacityAt(kfs, prog) * 100);
  });

  readonly opacityCurvePoints = computed<string>(() => {
    const kfs = this.selectedKeyframes();
    const pts: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const v = evaluateOpacityAt(kfs, t);
      const x = (t * 100).toFixed(1);
      const y = ((1 - v) * 100).toFixed(1);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  });

  readonly opacityAreaPath = computed<string>(() => {
    const poly = this.opacityCurvePoints();
    if (!poly) return '';
    return `M 0,100 L ${poly.replace(/ /g, ' L ')} L 100,100 Z`;
  });

  readonly timeMarkers = computed<readonly number[]>(() => {
    const max = Math.max(1, Math.round(this.totalDurationSeconds()));
    const step = max > 6 ? 1 : 0.5;
    const arr: number[] = [];
    for (let s = 0; s <= max + 0.001; s += step) {
      arr.push(Number(s.toFixed(1)));
    }
    return arr;
  });

  readonly playheadPercent = computed<number>(() => {
    const d = Math.max(0.1, this.totalDurationSeconds());
    return Math.min(100, Math.max(0, (this.playheadSeconds() / d) * 100));
  });

  readonly playToggled = output<void>();
  readonly playheadScrubbed = output<number>();
  readonly durationChanged = output<number>();
  readonly trackSelected = output<string>();
  readonly trackVisibilityToggled = output<string>();
  readonly trackExpandedToggled = output<string>();
  readonly trackTimingUpdated = output<{
    trackId: string;
    startTimeSeconds: number;
    endTimeSeconds: number;
  }>();
  readonly trackEasingUpdated = output<{ trackId: string; easing: EffectEasingKind }>();
  readonly trackOpacityKeyframesUpdated = output<{
    trackId: string;
    keyframes: readonly EffectOpacityKeyframeVm[];
  }>();
  readonly trackReordered = output<{ trackId: string; direction: -1 | 1 }>();
  readonly addLayerRequested = output<void>();
  readonly duplicateLayerRequested = output<void>();
  readonly removeLayerRequested = output<string>();

  formatTime(sec: number): string {
    return `${sec.toFixed(2)}s`;
  }

  trackInMs(track: EffectTimelineTrackVm): number {
    return Math.round(track.startTimeSeconds * 1000);
  }

  trackDurationMs(track: EffectTimelineTrackVm): number {
    return Math.max(50, Math.round((track.endTimeSeconds - track.startTimeSeconds) * 1000));
  }

  keyframeTimeMs(kf: EffectOpacityKeyframeVm, track: EffectTimelineTrackVm): number {
    return Math.round(kf.time * this.trackDurationMs(track));
  }

  trackLeftPct(track: EffectTimelineTrackVm): number {
    const d = Math.max(0.1, this.totalDurationSeconds());
    return Math.max(0, Math.min(98, (track.startTimeSeconds / d) * 100));
  }

  trackWidthPct(track: EffectTimelineTrackVm): number {
    const d = Math.max(0.1, this.totalDurationSeconds());
    const span = Math.max(0.05, track.endTimeSeconds - track.startTimeSeconds);
    return Math.max(2, Math.min(100 - this.trackLeftPct(track), (span / d) * 100));
  }

  setRangeSeconds(sec: number): void {
    this.durationChanged.emit(sec);
  }

  fitRangeToTracks(): void {
    const maxEnd = this.tracks().reduce((m, t) => Math.max(m, t.endTimeSeconds), 1.5);
    this.durationChanged.emit(Math.ceil((maxEnd + 0.5) * 2) / 2);
  }

  onRulerPointerDown(evt: PointerEvent, rulerEl: HTMLElement): void {
    evt.stopPropagation();
    this.scrubbingPointerId = evt.pointerId;
    rulerEl.setPointerCapture(evt.pointerId);
    this.emitScrubFromClientX(evt.clientX, rulerEl);
  }

  onRulerPointerMove(evt: PointerEvent, rulerEl: HTMLElement): void {
    if (this.scrubbingPointerId !== evt.pointerId) return;
    this.emitScrubFromClientX(evt.clientX, rulerEl);
  }

  onRulerPointerUp(evt: PointerEvent, rulerEl: HTMLElement): void {
    if (this.scrubbingPointerId !== evt.pointerId) return;
    this.scrubbingPointerId = null;
    if (rulerEl.hasPointerCapture(evt.pointerId)) {
      rulerEl.releasePointerCapture(evt.pointerId);
    }
  }

  private emitScrubFromClientX(clientX: number, el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    this.playheadScrubbed.emit(Number((ratio * this.totalDurationSeconds()).toFixed(3)));
  }

  // --- Clip Drag (Slide Layer) & Trim Start/End ---
  startClipDrag(
    evt: PointerEvent,
    track: EffectTimelineTrackVm,
    mode: 'move' | 'start' | 'end',
    laneEl: HTMLElement,
  ): void {
    evt.stopPropagation();
    evt.preventDefault();
    this.trackSelected.emit(track.id);
    const targetEl = evt.currentTarget as HTMLElement;
    targetEl.setPointerCapture(evt.pointerId);

    this.activeClipDrag = {
      pointerId: evt.pointerId,
      trackId: track.id,
      mode,
      startClientX: evt.clientX,
      laneWidthPx: Math.max(1, laneEl.getBoundingClientRect().width),
      origInMs: this.trackInMs(track),
      origDurationMs: this.trackDurationMs(track),
    };
  }

  onClipPointerMove(evt: PointerEvent): void {
    const drag = this.activeClipDrag;
    if (!drag || drag.pointerId !== evt.pointerId) return;
    const totalMs = Math.max(500, this.totalDurationSeconds() * 1000);
    const deltaMs = ((evt.clientX - drag.startClientX) / drag.laneWidthPx) * totalMs;
    const snap = this.snapEnabled() && !evt.altKey;

    const next = editTimelineClipMs(
      drag.origInMs,
      drag.origDurationMs,
      deltaMs,
      drag.mode,
      snap,
      totalMs + 2000,
    );

    const startSec = Number((next.startMs / 1000).toFixed(3));
    const endSec = Number(((next.startMs + next.durationMs) / 1000).toFixed(3));
    if (endSec > this.totalDurationSeconds()) {
      this.durationChanged.emit(Math.ceil(endSec + 0.5));
    }
    this.trackTimingUpdated.emit({
      trackId: drag.trackId,
      startTimeSeconds: startSec,
      endTimeSeconds: endSec,
    });
  }

  onClipPointerUp(evt: PointerEvent): void {
    if (!this.activeClipDrag || this.activeClipDrag.pointerId !== evt.pointerId) return;
    const targetEl = evt.currentTarget as HTMLElement;
    if (targetEl?.hasPointerCapture?.(evt.pointerId)) {
      targetEl.releasePointerCapture(evt.pointerId);
    }
    this.activeClipDrag = null;
  }

  updateSelectedInMs(inMs: number): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const durMs = this.trackDurationMs(trk);
    const startSec = Math.max(0, Number((inMs / 1000).toFixed(3)));
    const endSec = Number((startSec + durMs / 1000).toFixed(3));
    this.trackTimingUpdated.emit({
      trackId: trk.id,
      startTimeSeconds: startSec,
      endTimeSeconds: endSec,
    });
  }

  updateSelectedDurationMs(durMs: number): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const clampedDur = Math.max(100, durMs);
    const endSec = Number((trk.startTimeSeconds + clampedDur / 1000).toFixed(3));
    this.trackTimingUpdated.emit({
      trackId: trk.id,
      startTimeSeconds: trk.startTimeSeconds,
      endTimeSeconds: endSec,
    });
  }

  setTrackEasing(easing: EffectEasingKind): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    this.trackEasingUpdated.emit({ trackId: trk.id, easing });
  }

  // --- Opacity Keyframe Curve Editor ---
  onCurveDblClick(evt: MouseEvent, svgEl: Element): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const rect = svgEl.getBoundingClientRect();
    const time = Math.max(0, Math.min(1, (evt.clientX - rect.left) / Math.max(1, rect.width)));
    const value = Math.max(0, Math.min(1, 1 - (evt.clientY - rect.top) / Math.max(1, rect.height)));
    this.insertOpacityKeyframe(Number(time.toFixed(3)), Number(value.toFixed(2)));
  }

  addKeyframeAtPlayhead(): void {
    const prog = this.selectedTrackLocalProgress() ?? 0.5;
    const val = evaluateOpacityAt(this.selectedKeyframes(), prog);
    this.insertOpacityKeyframe(Number(prog.toFixed(3)), Number(val.toFixed(2)));
  }

  private insertOpacityKeyframe(time: number, value: number): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const next = [
      ...this.selectedKeyframes(),
      { time, value, easing: 'ease-in-out' as EffectEasingKind },
    ].sort((a, b) => a.time - b.time);
    const newIdx = next.findIndex((k) => Math.abs(k.time - time) < 0.005);
    this.selectedKeyframeIndex.set(Math.max(0, newIdx));
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }

  applyEasyFadePreset(): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const preset: readonly EffectOpacityKeyframeVm[] = [
      { time: 0, value: 0, easing: 'ease-out' },
      { time: 0.18, value: 1, easing: 'ease-in-out' },
      { time: 0.78, value: 1, easing: 'ease-in' },
      { time: 1, value: 0, easing: 'linear' },
    ];
    this.selectedKeyframeIndex.set(1);
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: preset });
  }

  resetOpacityKeyframes(): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const flat: readonly EffectOpacityKeyframeVm[] = [
      { time: 0, value: 1, easing: 'linear' },
      { time: 1, value: 1, easing: 'linear' },
    ];
    this.selectedKeyframeIndex.set(0);
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: flat });
  }

  startKeyframeDrag(evt: PointerEvent, index: number, svgEl: Element): void {
    evt.stopPropagation();
    evt.preventDefault();
    this.selectedKeyframeIndex.set(index);
    this.draggingKeyframePointerId = evt.pointerId;
    svgEl.setPointerCapture(evt.pointerId);
  }

  onCurvePointerMove(evt: PointerEvent, svgEl: Element): void {
    if (this.draggingKeyframePointerId !== evt.pointerId) return;
    const trk = this.selectedTrack();
    if (!trk) return;
    const rect = svgEl.getBoundingClientRect();
    const time = Math.max(0, Math.min(1, (evt.clientX - rect.left) / Math.max(1, rect.width)));
    const value = Math.max(0, Math.min(1, 1 - (evt.clientY - rect.top) / Math.max(1, rect.height)));
    const idx = this.selectedKeyframeIndex();
    const next = this.selectedKeyframes().map((k, i) =>
      i === idx ? { ...k, time: Number(time.toFixed(3)), value: Number(value.toFixed(2)) } : k,
    );
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }

  onCurvePointerUp(evt: PointerEvent, svgEl: Element): void {
    if (this.draggingKeyframePointerId !== evt.pointerId) return;
    this.draggingKeyframePointerId = null;
    if (svgEl.hasPointerCapture(evt.pointerId)) {
      svgEl.releasePointerCapture(evt.pointerId);
    }
  }

  updateActiveKeyframeValuePct(pct: number): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const idx = this.selectedKeyframeIndex();
    const val = Math.max(0, Math.min(1, pct / 100));
    const next = this.selectedKeyframes().map((k, i) => (i === idx ? { ...k, value: val } : k));
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }

  updateActiveKeyframeTimeMs(ms: number): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const durMs = this.trackDurationMs(trk);
    const time = Math.max(0, Math.min(1, ms / durMs));
    const idx = this.selectedKeyframeIndex();
    const next = this.selectedKeyframes().map((k, i) =>
      i === idx ? { ...k, time: Number(time.toFixed(3)) } : k,
    );
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }

  updateActiveKeyframeEasing(easing: EffectEasingKind): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    const idx = this.selectedKeyframeIndex();
    const next = this.selectedKeyframes().map((k, i) => (i === idx ? { ...k, easing } : k));
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }

  deleteActiveKeyframe(): void {
    const trk = this.selectedTrack();
    const kfs = this.selectedKeyframes();
    if (!trk || kfs.length <= 1) return;
    const idx = this.selectedKeyframeIndex();
    const next = kfs.filter((_, i) => i !== idx);
    this.selectedKeyframeIndex.set(Math.max(0, idx - 1));
    this.trackOpacityKeyframesUpdated.emit({ trackId: trk.id, keyframes: next });
  }
}
