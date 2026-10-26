import { Easing, EASINGS, OpacityKeyframe } from '../animation/animation-curves';
import { OpacityEditorComponent } from '../animation/opacity-editor.component';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../../Mythweaver.client/src/app/shared/components/icon/icon.component';
import { ClipEdit, editClip } from './timeline-math';
export interface TimelineClip { id: string; name: string; color: string; start: number; duration: number; enabled: boolean; easing: Easing; opacityKeyframes: OpacityKeyframe[]; }
export interface ClipChange { id: string; start: number; duration: number; }
@Component({
  selector: 'mw-effect-timeline', standalone: true, imports: [FormsModule, IconComponent, OpacityEditorComponent],
  templateUrl: './timeline.component.html', styleUrl: './timeline.component.scss', changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent {
  @Input({ required: true }) clips: TimelineClip[] = [];
  @Input() selectedId = '';
  @Input() playhead = 0;
  @Output() selected = new EventEmitter<string>();
  @Output() visibility = new EventEmitter<string>();
  @Output() changed = new EventEmitter<ClipChange>();
  @Output() editStarted = new EventEmitter<void>();
  @Output() scrubbed = new EventEmitter<number>();
  @Output() duplicate = new EventEmitter<string>();
  @Output() remove = new EventEmitter<string>();
  @Output() reorder = new EventEmitter<{ id: string; direction: number }>();
  @Output() animationChanged = new EventEmitter<{ id: string; easing?: Easing; opacityKeyframes?: OpacityKeyframe[] }>();
  readonly easings = EASINGS;
  changeEasing(easing: Easing): void { const clip=this.selectedClip; if(!clip)return;this.editStarted.emit();this.animationChanged.emit({id:clip.id,easing}); }
  keyframes(frames: OpacityKeyframe[]): void { const clip=this.selectedClip;if(clip)this.animationChanged.emit({id:clip.id,opacityKeyframes:frames}); }
  readonly range = signal(5000);
  readonly snapping = signal(true);
  readonly dragging = signal<string | null>(null);
  private dragExtent = 5000;
  get selectedClip(): TimelineClip | undefined { return this.clips.find(c => c.id === this.selectedId); }
  get extent(): number { return this.dragging() ? this.dragExtent : Math.max(this.range(), ...this.clips.map(c => c.start + c.duration)); }
  get ticks(): number[] { return Array.from({ length: 11 }, (_, i) => this.extent * i / 10); }
  fit(): void { this.range.set(Math.max(1000, Math.ceil(Math.max(0, ...this.clips.map(c => c.start + c.duration)) / 500) * 500)); }
  begin(event: PointerEvent, clip: TimelineClip, mode: ClipEdit): void {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    const track = target.closest('.track') as HTMLElement;
    const width = track.getBoundingClientRect().width, extent = this.extent;
    const x = event.clientX, initial = { ...clip };
    target.setPointerCapture(event.pointerId);
    this.dragExtent = extent; this.selected.emit(clip.id); this.editStarted.emit(); this.dragging.set(clip.id);
    const move = (e: PointerEvent) => { if (e.pointerId !== event.pointerId) return; this.changed.emit({ id: clip.id, ...editClip(initial.start, initial.duration, (e.clientX - x) / width * extent, mode, this.snapping() && !e.altKey) }); };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return;
      if (e.type === 'pointercancel') this.changed.emit({ id: clip.id, start: initial.start, duration: initial.duration });
      target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', end); target.removeEventListener('pointercancel', end); target.removeEventListener('lostpointercapture', end);
      if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
      this.dragging.set(null);
    };
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', end); target.addEventListener('pointercancel', end); target.addEventListener('lostpointercapture', end);
  }
  keyboard(event: KeyboardEvent, clip: TimelineClip, mode: ClipEdit): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); event.stopPropagation(); this.editStarted.emit();
    this.changed.emit({ id: clip.id, ...editClip(clip.start, clip.duration, (event.key === 'ArrowLeft' ? -1 : 1) * (event.shiftKey ? 250 : 50), mode, true) });
  }
  numeric(mode: 'start' | 'duration', value: number): void {
    const c = this.selectedClip; if (!c) return;
    this.editStarted.emit(); this.changed.emit({ id: c.id, start: mode === 'start' ? Math.max(0, Math.min(5000, Number(value) || 0)) : c.start,
      duration: mode === 'duration' ? Math.max(100, Math.min(5000, Number(value) || 100)) : c.duration });
  }
  seek(event: PointerEvent): void {
    if (event.button !== 0) return;
    const target = event.currentTarget as HTMLElement, bounds = target.getBoundingClientRect(), extent = this.extent;
    const set = (e: PointerEvent) => this.scrubbed.emit(Math.max(0, Math.min(extent, (e.clientX - bounds.left) / bounds.width * extent)));
    event.preventDefault(); target.setPointerCapture(event.pointerId); set(event);
    const move = (e: PointerEvent) => { if (e.pointerId === event.pointerId) set(e); };
    const end = () => { target.removeEventListener('pointermove', move); target.removeEventListener('pointerup', end); target.removeEventListener('pointercancel', end); };
    target.addEventListener('pointermove', move); target.addEventListener('pointerup', end); target.addEventListener('pointercancel', end);
  }
}
