import type { MageHandSettings } from './effect-definition';
type Point={x:number;y:number};
// Waypoints use caster-target coordinates: x along the cast, y perpendicular.
export function handFrame(settings:MageHandSettings,progress:number,from:Point,to:Point){
 const p=Math.max(0,Math.min(1,progress)),growth=Math.min(1,p/settings.growth),travel=Math.max(0,Math.min(1,(p-settings.growth)/(1-settings.growth-.12)));
 const points=[{x:0,y:0},...settings.path,{x:1,y:0}],lengths=points.slice(1).map((q,i)=>Math.hypot(q.x-points[i].x,q.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);let d=travel*total,i=0;
 while(i<lengths.length-1&&d>lengths[i]){d-=lengths[i];i++;}const a=points[i],b=points[i+1],t=lengths[i]>0?Math.min(1,d/lengths[i]):1,before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+2)],curve=(v0:number,v1:number,v2:number,v3:number)=>.5*((2*v1)+(-v0+v2)*t+(2*v0-5*v1+4*v2-v3)*t*t+(-v0+3*v1-3*v2+v3)*t*t*t),q={x:curve(before.x,a.x,b.x,after.x),y:curve(before.y,a.y,b.y,after.y)},dx=to.x-from.x,dy=to.y-from.y;
 return {x:from.x+dx*q.x-dy*q.y,y:from.y+dy*q.x+dx*q.y,angle:Math.atan2(dy,dx)+Math.atan2(b.y-a.y,b.x-a.x),size:.04+.96*(growth*growth*(3-2*growth)),alpha:Math.min(1,p/.04,(1-p)/.07)};
}
