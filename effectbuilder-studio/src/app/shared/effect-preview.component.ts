import { teleportFrame } from '../effects/teleport-preview';
import { BabylonEffectPreview } from '../effects/babylon/native-preview';
import { riderPoint } from '../effects/gameplay-preview';
import { movingTarget } from '../effects/fireball-motion';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnChanges, inject, Output, ViewChild, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IconComponent } from './components/icon/icon.component';
import { EffectDefinition, PreviewScene, effectDuration } from '../effects/effect-definition';

@Component({ selector:'mw-effect-preview', standalone:true, imports:[IconComponent],changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./effect-preview.component.html',styleUrl:'./effect-preview.component.scss' })
export class EffectPreviewComponent implements AfterViewInit, OnDestroy, OnChanges {
 readonly holdHidden=signal(false);@Output() reappearRequested=new EventEmitter<number>();
 private pendingStart:number|null=null;
 startAt(ms:number):void{this.holdHidden.set(false);this.pendingStart=ms;}
 reveal():void{const t=this.definition.previewScene.teleport;if(t)this.reappearRequested.emit(t.vanishMs+t.hiddenMs);}
 get casterFade():number{const s=this.definition.previewScene;return teleportFrame(s.teleport,this.previewTime(),s.caster,s.teleport?.destination??s.caster).alpha;}
 readonly view3d=signal(false);toggleView():void{this.view3d.update(v=>!v);this.native?.setView(this.view3d());}projectPoint(p:{x:number;y:number}){return this.native?.project(p)??p;}
 inspect(turn=0,tilt=0,zoom=1):void{this.native?.inspect(turn,tilt,zoom);}resetCamera():void{this.native?.resetView();}
 readonly background=signal(true);readonly ambient=signal(.28);readonly bump=signal(2.2);readonly relief=signal(.18); private native?:BabylonEffectPreview;
 private http=inject(HttpClient);readonly summonArtwork=signal('');private artworkSource='';private artworkGeneration=0;
 ngOnChanges():void{const url=this.definition?.summon?.tokenUrl??'';if(url===this.artworkSource)return;this.artworkSource=url;const generation=++this.artworkGeneration;const previous=this.summonArtwork();if(previous.startsWith('blob:'))URL.revokeObjectURL(previous);this.summonArtwork.set('');if(url.startsWith('/api/summon-assets/')){void firstValueFrom(this.http.get(url,{responseType:'blob'})).then(blob=>{if(generation===this.artworkGeneration&&!this.disposed)this.summonArtwork.set(URL.createObjectURL(blob));}).catch(()=>this.error.set('Sign in as the token owner to preview private artwork.'));}else this.summonArtwork.set(url);}
 @ViewChild('surface',{static:true}) surface!:ElementRef<HTMLDivElement>;
 @Input({required:true}) definition!:EffectDefinition;
 @Input() playing=true; @Input() loop=true; @Input() speed=1; @Input() showGrid=true; @Input() seekTime:number|null=null;
 @Input() showGround=false; @Input() activeBolt=0; @Input() boltTargets:number[]=[];
 @Input() editHandPath=false;@Input() handPath:{x:number;y:number}[]=[];
 @Output() handPathChanged=new EventEmitter<{x:number;y:number}[]>();
 get handPoints(){const s=this.definition.previewScene,a=s.caster,b=s.targets[0],dx=b.x-a.x,dy=b.y-a.y,ratio=(this.surface?.nativeElement.clientWidth||1)/(this.surface?.nativeElement.clientHeight||1);return this.handPath.map(p=>this.projectPoint({x:a.x+dx*p.x-dy/ratio*p.y,y:a.y+dy*p.x+dx*ratio*p.y}));}
 pathPoint(event:PointerEvent,index=-1):void{if(!this.editHandPath||(index>=0&&event.buttons!==1))return;event.stopPropagation();const rect=this.surface.nativeElement.getBoundingClientRect(),s=this.definition.previewScene,a=s.caster,b=s.targets[0],dx=b.x-a.x,dy=(b.y-a.y)*rect.height/rect.width,den=dx*dx+dy*dy;if(den<.0001)return;const design=this.native?.designPoint(event.clientX-rect.left,event.clientY-rect.top)??{x:event.clientX-rect.left,y:event.clientY-rect.top},x=design.x/rect.width-a.x,y=design.y/rect.width-a.y*rect.height/rect.width,q={x:Math.max(-.5,Math.min(1.5,(x*dx+y*dy)/den)),y:Math.max(-1,Math.min(1,(y*dx-x*dy)/den))},path=this.handPath.map(p=>({...p}));if(index<0){if(path.length>=8)return;path.push(q);}else path[index]=q;this.handPathChanged.emit(path);}
 movePoint(event:PointerEvent,index:number):void{event.stopPropagation();(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);this.editStarted.emit();}
 removePoint(event:Event,index:number):void{event.stopPropagation();this.handPathChanged.emit(this.handPath.filter((_,i)=>i!==index));}
 @Output() timeChanged=new EventEmitter<number>(); @Output() sceneChanged=new EventEmitter<PreviewScene>();
 @Output() editStarted=new EventEmitter<void>(); @Output() targetSelected=new EventEmitter<number>();
 readonly previewTime=signal(0); readonly rendererStatus=signal('Starting GPU renderer'); readonly error=signal('');private resizeObserver?:ResizeObserver;private elapsed=0;private disposed=false;private suppressClick=false;
 get summonPoint(){return this.projectPoint(this.definition.previewScene.targets[0]);}
 get multiTarget():boolean{return this.definition.layers.some(l=>!!l.missile);}
 get pronePreview():boolean{return !!this.definition.gameplay?.enabled&&!!this.definition.gameplay.prone&&this.previewTime()>=this.definition.gameplay.impactMs;}
 get tokens(){const source=this.definition.previewScene;const s={...source,targets:source.targets.map((p,i)=>i===0&&source.targetMotion?movingTarget(p,this.previewTime()):p)};return [{id:'caster',label:'Caster',point:this.projectPoint(teleportFrame(s.teleport,this.previewTime(),s.caster,s.teleport?.destination??s.caster).point),target:-1},...s.targets.slice(0,this.multiTarget?3:1).map((point,i)=>({id:'target-'+i,label:this.multiTarget?'Target '+(i+1):'Target',point:this.projectPoint(this.riderNormalized(point)),target:i})),...(s.teleport?.enabled?[{id:'destination',label:'Destination',point:this.projectPoint(s.teleport.destination),target:3}]:[])];}
 riderNormalized(p:{x:number;y:number}){const el=this.surface?.nativeElement,w=el?.clientWidth||700,h=el?.clientHeight||360,a=this.definition.previewScene.caster;const q=riderPoint(this.definition.gameplay,this.previewTime(),{x:a.x*w,y:a.y*h},{x:p.x*w,y:p.y*h},66*Math.min(1,w/700,h/360));return {x:Math.max(.03,Math.min(.97,q.x/w)),y:Math.max(.08,Math.min(.92,q.y/h))};}
 boltsFor(slot:number):string{return this.boltTargets.map((s,i)=>s===slot?String(i+1):'').filter(Boolean).join(', ');}
 restart():void{this.pendingStart=0;this.elapsed=0;}
 pick(event:MouseEvent,target:number):void{if(event.detail!==0&&this.suppressClick){this.suppressClick=false;return;}if(this.multiTarget&&target>=0&&target<3)this.targetSelected.emit(target);}
 drag(event:PointerEvent,targetIndex:number):void{
  if(event.button!==0)return;event.preventDefault();this.suppressClick=false;
  const button=event.currentTarget as HTMLElement,bounds=this.surface.nativeElement.getBoundingClientRect(),before=structuredClone(this.definition.previewScene);
  const initial=targetIndex<0?before.caster:targetIndex===3?before.teleport!.destination:before.targets[targetIndex],start=this.native?.designPoint(event.clientX-bounds.left,event.clientY-bounds.top)??{x:event.clientX-bounds.left,y:event.clientY-bounds.top};let started=false;
  button.setPointerCapture(event.pointerId);
  const move=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;if(!started){if(Math.hypot(e.clientX-event.clientX,e.clientY-event.clientY)<3)return;this.editStarted.emit();started=true;this.suppressClick=true;}
   const current=this.native?.designPoint(e.clientX-bounds.left,e.clientY-bounds.top)??{x:e.clientX-bounds.left,y:e.clientY-bounds.top},scene=structuredClone(before),point={x:Math.max(.05,Math.min(.95,initial.x+(current.x-start.x)/bounds.width)),y:Math.max(.12,Math.min(.88,initial.y+(current.y-start.y)/bounds.height))};
   if(targetIndex<0)scene.caster=point;else if(targetIndex===3)scene.teleport!.destination=point;else scene.targets[targetIndex]=point;this.sceneChanged.emit(scene);};
  const end=(e:PointerEvent)=>{if(e.pointerId!==event.pointerId)return;if(e.type==='pointercancel'&&started)this.sceneChanged.emit(before);button.removeEventListener('pointermove',move);button.removeEventListener('pointerup',end);button.removeEventListener('pointercancel',end);button.removeEventListener('lostpointercapture',end);if(button.hasPointerCapture(e.pointerId))button.releasePointerCapture(e.pointerId);};
  button.addEventListener('pointermove',move);button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
 }
 nudge(event:KeyboardEvent,index:number):void{
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();this.editStarted.emit();
  const scene=structuredClone(this.definition.previewScene),p=index<0?scene.caster:index===3?scene.teleport!.destination:scene.targets[index],step=event.shiftKey ? .05 : .01;
  p.x=Math.max(.05,Math.min(.95,p.x+(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0)));p.y=Math.max(.12,Math.min(.88,p.y+(event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0)));this.sceneChanged.emit(scene);
 }
 async ngAfterViewInit():Promise<void>{
  try{
   const surface=this.surface.nativeElement,canvas=document.createElement('canvas');Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});surface.appendChild(canvas);
   const native=new BabylonEffectPreview(canvas,()=>surface.clientWidth,()=>surface.clientHeight);this.native=native;
   this.resizeObserver=new ResizeObserver(()=>{if(!this.disposed&&surface.clientWidth>0&&surface.clientHeight>0)native.resize();});this.resizeObserver.observe(surface);
   this.rendererStatus.set('Babylon.js native / WebGL '+native.engine.webGLVersion);let lastEmit=-1,last=performance.now();
   native.engine.runRenderLoop(()=>{if(this.disposed)return;const now=performance.now(),delta=Math.min(100,now-last);last=now;const w=surface.clientWidth,h=surface.clientHeight,s=this.definition.previewScene,duration=effectDuration(this.definition);
    if(this.seekTime!==null)this.elapsed=this.seekTime;else if(this.pendingStart!==null){this.elapsed=this.pendingStart;this.pendingStart=null;}else if(this.playing)this.elapsed+=delta*this.speed;
    const teleport=s.teleport;if(teleport?.enabled&&this.holdHidden()&&this.seekTime===null)this.elapsed=Math.min(this.elapsed,teleport.vanishMs+teleport.hiddenMs*.5);
    if(this.loop&&this.seekTime===null&&this.elapsed>duration+300)this.elapsed=0;
    const time=Math.min(this.elapsed,duration),targetAt=(ms:number)=>{const p=s.targetMotion?movingTarget(s.targets[0],ms):s.targets[0];return{x:p.x*w,y:p.y*h};},from={x:s.caster.x*w,y:s.caster.y*h},targets=s.targets.map((p,i)=>i===0?targetAt(time):{x:p.x*w,y:p.y*h});
    native.render(this.definition,time,from,targets,Math.min(1,w/700,h/360),{targetAt,walls:(s.walls??[]).map(wall=>({a:{x:wall.a.x*w,y:wall.a.y*h},b:{x:wall.b.x*w,y:wall.b.y*h}}))},{background:this.background(),ambient:this.ambient(),bump:this.bump(),height:this.relief(),grid:this.showGrid,ground:this.showGround});
    const rounded=Math.round(this.elapsed/40)*40;if(rounded!==lastEmit){lastEmit=rounded;this.previewTime.set(time);this.timeChanged.emit(time);}
   });
  }catch(error){this.native?.dispose();this.rendererStatus.set('GPU renderer unavailable');this.error.set('Babylon requires hardware-accelerated WebGL. Enable browser graphics acceleration and reload. Your effect remains editable.');console.error('Native effect preview failed',error);}
 }
 ngOnDestroy():void{this.disposed=true;this.resizeObserver?.disconnect();const url=this.summonArtwork();if(url.startsWith('blob:'))URL.revokeObjectURL(url);this.native?.dispose();}
}
