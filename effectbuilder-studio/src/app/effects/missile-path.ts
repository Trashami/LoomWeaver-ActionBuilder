import type { MagicMissileSettings } from './effect-definition';
export interface MissilePoint { x: number; y: number; }
const clamp=(t:number)=>Math.max(0,Math.min(1,t));
const smooth=(t:number)=>t*t*(3-2*t);
export function missileTiming(duration:number,gap:number,bolt:number): {offset:number;flight:number;hit:number} {
  const spacing=Math.min(gap,duration*.15), flight=duration-2*spacing, offset=bolt*spacing;
  return {offset,flight,hit:offset+flight*.8};
}
/** Formation above the caster, upward lift, then an independently curved homing arc. */
export function missilePosition(progress:number,from:MissilePoint,to:MissilePoint,bolt:number,settings:MagicMissileSettings,scale=1):MissilePoint {
  const p=clamp(progress),lane=bolt-1, rise=settings.rise*scale;
  const spawn={x:from.x+lane*17*scale,y:from.y-29*scale};
  const launch={x:spawn.x+lane*12*scale,y:spawn.y-rise};
  if(p<.16)return spawn;
  if(p<.34){const t=smooth((p-.16)/.18);return{x:spawn.x+(launch.x-spawn.x)*t,y:spawn.y+(launch.y-spawn.y)*t};}
  if(p>=.8)return {...to};
  const t=smooth((p-.34)/.46),v=1-t,dx=to.x-launch.x,dy=to.y-launch.y,d=Math.max(1,Math.hypot(dx,dy));
  const bend=settings.curve*scale*(lane===0?.35:lane),nx=-dy/d,ny=dx/d;
  const c1={x:launch.x+dx*.25+nx*bend,y:launch.y+dy*.1+ny*bend-rise*.25};
  const c2={x:launch.x+dx*.75+nx*bend*.45,y:launch.y+dy*.8+ny*bend*.45};
  return{x:v*v*v*launch.x+3*v*v*t*c1.x+3*v*t*t*c2.x+t*t*t*to.x,y:v*v*v*launch.y+3*v*v*t*c1.y+3*v*t*t*c2.y+t*t*t*to.y};
}
