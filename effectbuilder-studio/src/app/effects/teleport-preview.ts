import type { TeleportPreview } from './effect-definition';
export function teleportFrame(settings:TeleportPreview|undefined,time:number,from:{x:number;y:number},destination:{x:number;y:number}){
 if(!settings?.enabled)return {point:from,alpha:1,phase:'present'};
 const fade=Math.max(0,Math.min(1,time/settings.vanishMs)),arrival=settings.vanishMs+settings.hiddenMs;
 if(time<settings.vanishMs)return {point:from,alpha:1-fade*fade*(3-2*fade),phase:'vanishing'};
 if(time<arrival)return {point:destination,alpha:0,phase:'hidden'};
 const p=Math.max(0,Math.min(1,(time-arrival)/settings.appearMs));return {point:destination,alpha:p*p*(3-2*p),phase:p<1?'appearing':'present'};
}
