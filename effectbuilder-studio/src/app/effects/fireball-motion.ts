export interface FxPoint {x:number;y:number}
export interface FxWall {a:FxPoint;b:FxPoint}
export interface EffectWorld {flight?:{arrival:number;arc:number};walls?:FxWall[];targetAt?:(time:number)=>FxPoint}
export const FIREBALL_FLIGHT_FRACTION=.6;
export const seeded=(i:number,seed:number)=>{const v=Math.sin(i*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};
export function movingTarget(base:FxPoint,time:number):FxPoint{return {x:Math.max(.06,Math.min(.94,base.x+Math.sin(time/900)*.055)),y:Math.max(.12,Math.min(.88,base.y+Math.sin(time/650)*.12))};}
export function fireballCurve(from:FxPoint,to:FxPoint,t:number,arc:number,scale=1):FxPoint{
 const p=Math.max(0,Math.min(1,t)),d=Math.hypot(to.x-from.x,to.y-from.y)||1;
 // Accelerating flight, with a curved release from the caster's hands.
 const u=p*p*(1.45-.45*p),bow=Math.sin(u*Math.PI)*arc*scale;
 return {x:from.x+(to.x-from.x)*u-(to.y-from.y)/d*bow,y:from.y+(to.y-from.y)*u+(to.x-from.x)/d*bow};
}
function intersection(a:FxPoint,b:FxPoint,c:FxPoint,d:FxPoint):number|null{
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;if(Math.abs(den)<1e-8)return null;
 const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/den,u=((c.x-a.x)*ry-(c.y-a.y)*rx)/den;
 return t>=0&&t<=1&&u>=0&&u<=1?t:null;
}
/** First contact along the actual curved path, never an unbounded physics loop. */
export function fireballContact(from:FxPoint,to:FxPoint,arc:number,scale:number,walls:readonly FxWall[]=[]):{point:FxPoint;fraction:number}{
 let previous=from;
 for(let i=1;i<=64;i++){
  const next=fireballCurve(from,to,i/64,arc,scale);let first=2;
  for(const wall of walls){const t=intersection(previous,next,wall.a,wall.b);if(t!==null)first=Math.min(first,t);}
  if(first<=1)return {point:{x:previous.x+(next.x-previous.x)*first,y:previous.y+(next.y-previous.y)*first},fraction:(i-1+first)/64};
  previous=next;
 }
 return {point:{...to},fraction:1};
}
export function clippedFireball(from:FxPoint,to:FxPoint,t:number,arc:number,scale:number,walls:readonly FxWall[]=[]):FxPoint{
 const contact=fireballContact(from,to,arc,scale,walls);return fireballCurve(from,to,Math.max(0,Math.min(1,t))*contact.fraction,arc,scale);
}
