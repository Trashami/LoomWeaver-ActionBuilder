import { EffectLayer, VARIANTS, WHIP_DEFAULTS } from './effect-definition';
import { ease } from '../shared/animation/animation-curves';
import { whipFrame } from './whip-path';
import { missilePosition, missileTiming } from './missile-path';
import { seeded, FxPoint } from './fireball-motion';
export interface MaterialFrame { p:number; clock:number; envelope:number; anchor:FxPoint; angle:number; extent:number; length:number; variant:number; whipPoints?:FxPoint[]; }
export function materialFrame(l:EffectLayer,time:number,from:FxPoint,to:FxPoint,scale:number):MaterialFrame {
 const local=(time-l.delay)/l.duration,p=ease(Math.max(0,Math.min(1,local)),l.easing),clock=p*l.duration/1000;
 const axis=Math.atan2(to.y-from.y,to.x-from.x),length=Math.hypot(to.x-from.x,to.y-from.y);
 const base=l.anchor==='caster'?from:l.anchor==='path'?{x:(from.x+to.x)/2,y:(from.y+to.y)/2}:to;
 const anchor={x:base.x+(Math.cos(axis)*l.offsetX-Math.sin(axis)*l.offsetY)*scale,y:base.y+(Math.sin(axis)*l.offsetX+Math.cos(axis)*l.offsetY)*scale};
 return {p,clock,whipPoints:l.kind==='whip'?whipFrame(p,length,scale,l.whip??WHIP_DEFAULTS).points:undefined,envelope:!l.enabled||local<0||local>1?0:l.opacityKeyframes.length?1:Math.min(1,p*12,(1-p)*8),anchor,angle:axis+l.motion.direction*Math.PI/180,extent:Math.max(12,(l.size+l.spread*.65)*scale),length,variant:Math.max(0,VARIANTS[l.kind].findIndex(v=>v.id===l.variant))};
}
export function projectileMaterialPoint(l:EffectLayer,f:MaterialFrame,from:FxPoint,to:FxPoint,scale:number,t:number,n=0):FxPoint {
 const count=l.variant==='swarm'?7:1,m=l.motion,spread=l.spread*scale;
 const wave=-Math.sin(t*Math.PI)*spread+Math.sin(t*8+n)*m.turbulence*scale*Math.sin(t*Math.PI)+(n-(count-1)/2)*9*scale*Math.sin(t*Math.PI)+Math.sin(t*Math.PI*2+f.clock*m.twirl*Math.PI*2)*m.twirl*5*scale*Math.sin(t*Math.PI);
 return{x:from.x+Math.cos(f.angle)*f.length*t-Math.sin(f.angle)*wave,y:from.y+Math.sin(f.angle)*f.length*t+Math.cos(f.angle)*wave+m.gravity*t*t*scale};
}
export interface MaterialParticle { x:number;y:number;size:number;alpha:number;rotation:number;stretch:number; }
/** Fixed emission times and seeded coordinates: seek/replay never depend on frame history. */
export function materialParticle(l:EffectLayer,f:MaterialFrame,index:number,count:number,from:FxPoint,to:FxPoint,scale:number,targets:FxPoint[],mist=false):MaterialParticle {
 const a=seeded(index+11,l.motion.seed),b=seeded(index+317,l.motion.seed),v=f.variant;
 const cycles=f.clock*Math.max(.05,l.motion.speed)/(l.motion.lifetime+.2),age=(cycles+a)%1;
 const angle=a*Math.PI*2+f.clock*l.motion.twirl*(mist?.3:1),r=f.extent;
 let x=f.anchor.x,y=f.anchor.y,rotation=angle,spread=r*(.2+Math.sqrt(b)*.8),alpha=Math.sin(age*Math.PI)*f.envelope,stretch=1;
 const path=['beam','lightning','tether','projectile','whip'].includes(l.kind);
 if(l.missile){const bolt=index%3,target=targets[l.missile.targets[bolt]]??to,timing=missileTiming(l.duration,l.missile.launchGap,bolt),head=(f.p*l.duration-timing.offset)/timing.flight;const q=head-a*l.missile.smokeLife/timing.flight;if(q<0||q>.8||head>1){alpha=0;}const at=missilePosition(Math.max(0,Math.min(.8,q)),from,target,bolt,l.missile,scale);x=at.x;y=at.y;alpha*=l.missile.smokeOpacity;spread=l.missile.smokeSpread*scale*(.4+a);}
 else if(l.kind==='projectile'){const bolt=l.variant==='swarm'?index%7:0,head=Math.max(0,Math.min(1,f.p*l.motion.speed*1.25/(1+l.motion.drag*f.p)-bolt*.035)),u=Math.max(0,head-a*(.03+l.motion.trail*.2));const q=projectileMaterialPoint(l,f,from,to,scale,u,bolt);x=q.x;y=q.y;spread=l.size*scale*.4;rotation=f.angle;stretch=mist?1:2;}
 else if(l.kind==='whip'){const points=f.whipPoints!;const q=points[Math.min(points.length-1,Math.floor(a*(points.length-1)))];x=from.x+Math.cos(f.angle)*q.x-Math.sin(f.angle)*q.y;y=from.y+Math.sin(f.angle)*q.x+Math.cos(f.angle)*q.y;spread=l.size*scale*.65;}
 else if(path){const u=a*(l.kind==='beam'||l.kind==='lightning'?Math.min(1,f.p*4*l.motion.speed):1);const wave=Math.sin(u*Math.PI)*Math.sin(u*(10+v*5)-f.clock*7)*l.spread*scale*.25;x=from.x+Math.cos(f.angle)*f.length*u-Math.sin(f.angle)*wave;y=from.y+Math.sin(f.angle)*f.length*u+Math.cos(f.angle)*wave;spread=(l.size*1.3+l.motion.turbulence*.08)*scale;stretch=mist?1:2+v*.4;rotation=f.angle;}
 else if(l.kind==='cone'||l.kind==='wall'){const u=l.kind==='wall'?a-.5:a,across=(b-.5)*r*(l.kind==='wall'?2.8:u*2);x+=Math.cos(f.angle)*u*r*2-Math.sin(f.angle)*across;y+=Math.sin(f.angle)*u*r*2+Math.cos(f.angle)*across;spread=r*.1;rotation=f.angle;stretch=mist?1:2;}
 else if(l.kind==='sparks'){rotation=f.angle+(a-.5)*l.motion.cone*Math.PI/180+f.clock*l.motion.twirl;spread=r*age*l.motion.speed/(1+l.motion.drag*age*4);x+=Math.cos(rotation)*spread;y+=Math.sin(rotation)*spread;spread=r*.12;stretch=mist?1:l.variant==='pushback'?4:1;}
 else if(l.kind==='burst'){spread=r*(.1+f.p*(1+b*2));alpha=f.envelope*(1-f.p)**.7;stretch=mist?1:2+f.p*4;}
 else if(l.kind==='ring'||l.kind==='sigil'){spread=r*(l.kind==='ring'&&v<2?.3+f.p:1);alpha*=.75;}
 else if(l.kind==='cloud'){spread=r*Math.sqrt(b);alpha*=.6;}
 else{spread=r*(.4+b*.6)*(1-f.p*.2);alpha*=.8;}
 x+=Math.cos(angle)*spread;y+=Math.sin(angle)*spread*(l.kind==='cloud'?.7:1);
 const turbulence=l.motion.turbulence*scale*.12;x+=Math.sin(f.clock*3+index)*turbulence;y+=Math.cos(f.clock*2+index)*turbulence+l.motion.gravity*scale*age*age*.15;
 return {x,y,size:mist?(path?5+l.size*.3:r*(.18+b*.3))*(.6+age):(.8+b*1.6)*scale*(1+v*.13),alpha:Math.max(0,Math.min(1,alpha)),rotation,stretch};
}
