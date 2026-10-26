export interface LightSettings {
  enabled:boolean; followColor:boolean; color:string;
  intensity:number; radiusFeet:number; heightFeet:number; softness:number; flicker:number;
}
export const LIGHT_DEFAULTS:LightSettings={enabled:true,followColor:true,color:'#ffad62',intensity:1.2,radiusFeet:12,heightFeet:3,softness:.8,flicker:.08};
export function parseLight(value:unknown):LightSettings {
  const v=(value&&typeof value==='object'?value:{}) as Partial<LightSettings>;
  const number=(n:unknown,min:number,max:number,fallback:number)=>typeof n==='number'&&Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
  return {enabled:v.enabled!==false,followColor:v.followColor!==false,color:typeof v.color==='string'&&/^#[0-9a-f]{6}$/i.test(v.color)?v.color:LIGHT_DEFAULTS.color,
    intensity:number(v.intensity,0,6,1.2),radiusFeet:number(v.radiusFeet,1,60,12),heightFeet:number(v.heightFeet,.25,30,3),softness:number(v.softness,.05,1,.8),flicker:number(v.flicker,0,1,.08)};
}
