import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../components/icon/icon.component';
import { clamp, EASINGS, OpacityKeyframe, opacityAt } from './animation-curves';

@Component({ selector: 'mw-opacity-editor', standalone: true, imports: [FormsModule, IconComponent],
  templateUrl: './opacity-editor.component.html', styleUrl: './opacity-editor.component.scss', changeDetection: ChangeDetectionStrategy.OnPush })
export class OpacityEditorComponent {
  @Input() frames: OpacityKeyframe[] = [];
  @Input() duration = 1000;
  @Input() start = 0;
  @Input() playhead = 0;
  @Input() snapping = true;
  @Output() changed = new EventEmitter<OpacityKeyframe[]>();
  @Output() editStarted = new EventEmitter<void>();
  @Output() scrubbed = new EventEmitter<number>();
  readonly curves = EASINGS;
  readonly selectedId = signal('');
  get selected(): OpacityKeyframe | undefined { return this.frames.find(f => f.id === this.selectedId()); }
  get localTime(): number { return clamp((this.playhead - this.start) / this.duration); }
  get curve(): string { return Array.from({length:101},(_,i) => `${i*10},${100-opacityAt(this.frames,i/100)*100}`).join(' '); }
  get currentOpacity(): number { return opacityAt(this.frames,this.localTime); }
  private emit(frames: OpacityKeyframe[]): void { this.changed.emit([...frames].sort((a,b) => a.time-b.time)); }
  add(time=this.localTime, value=opacityAt(this.frames,time)): void {
    const existing=this.frames.find(f => Math.abs(f.time-time)<.000001);
    if(existing) { this.pick(existing); return; }
    if(this.frames.length>=32) return;
    this.editStarted.emit(); const frame={id:crypto.randomUUID(),time:clamp(time),value:clamp(value),easing:'linear' as const};
    this.selectedId.set(frame.id); this.emit([...this.frames,frame]); this.scrubbed.emit(this.start+frame.time*this.duration);
  }
  preset(): void {
    this.editStarted.emit(); this.selectedId.set('');
    this.emit([ {time:0,value:0}, {time:.2,value:1}, {time:.8,value:1}, {time:1,value:0} ].map(f=>({...f,id:crypto.randomUUID(),easing:'ease-in-out'})));
  }
  clear(): void { this.editStarted.emit(); this.selectedId.set(''); this.emit([]); }
  pick(frame: OpacityKeyframe): void { this.selectedId.set(frame.id); this.scrubbed.emit(this.start + frame.time*this.duration); }
  remove(): void { if(!this.selected) return; this.editStarted.emit(); this.emit(this.frames.filter(f=>f.id!==this.selectedId())); this.selectedId.set(''); }
  patch(patch: Partial<OpacityKeyframe>, remember=true): void {
    const selected=this.selected; if(!selected) return;
    const i=this.frames.indexOf(selected), gap=1/Math.max(1,this.duration);
    const min=i>0?this.frames[i-1].time+gap:0, max=i<this.frames.length-1?this.frames[i+1].time-gap:1;
    const time=clamp(patch.time ?? selected.time,min,max), value=clamp(patch.value ?? selected.value);
    if(remember) this.editStarted.emit();
    this.emit(this.frames.map(f=>f.id===selected.id?{...f,...patch,time,value}:f));
    this.scrubbed.emit(this.start+time*this.duration);
  }
  graphAdd(event: MouseEvent): void {
    const r=(event.currentTarget as HTMLElement).getBoundingClientRect();
    let time=clamp((event.clientX-r.left)/r.width);
    if(this.snapping&&!event.altKey)time=clamp(Math.round(time*this.duration/50)*50/this.duration);
    this.add(time,clamp(1-(event.clientY-r.top)/r.height));
  }
  drag(event: PointerEvent, frame: OpacityKeyframe): void {
    if(event.button!==0) return;
    event.preventDefault();event.stopPropagation();this.pick(frame);
    const target=event.currentTarget as HTMLElement, bounds=target.parentElement!.getBoundingClientRect(), before=this.frames.map(f=>({...f}));
    target.setPointerCapture(event.pointerId);
    let started=false;
    const move=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;if(!started){if(Math.hypot(e.clientX-event.clientX,e.clientY-event.clientY)<2)return;this.editStarted.emit();started=true;}let time=clamp((e.clientX-bounds.left)/bounds.width);if(this.snapping&&!e.altKey)time=clamp(Math.round(time*this.duration/50)*50/this.duration);this.patch({time,value:clamp(1-(e.clientY-bounds.top)/bounds.height)},false);};
    const end=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;if(e.type==='pointercancel'&&started)this.emit(before);target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',end);target.removeEventListener('lostpointercapture',end);if(target.hasPointerCapture(e.pointerId))target.releasePointerCapture(e.pointerId);};
    target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);target.addEventListener('lostpointercapture',end);
  }
  keyboard(event: KeyboardEvent, frame: OpacityKeyframe): void {
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Delete','Backspace'].includes(event.key))return;
    event.preventDefault();this.selectedId.set(frame.id);
    if(event.key==='Delete'||event.key==='Backspace')this.remove();
    else if(event.key==='ArrowLeft'||event.key==='ArrowRight')this.patch({time:frame.time+(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?250:50)/this.duration});
    else this.patch({value:frame.value+(event.key==='ArrowUp'?1:-1)*.05});
  }
}
