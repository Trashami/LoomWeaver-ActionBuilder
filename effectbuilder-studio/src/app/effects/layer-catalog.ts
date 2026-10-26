import { GridOption } from '../shared/components/option-grid/option-grid.component';
import { makeAmbientPresets } from './ambient-presets';
import { makeGasCone, makeSpellTemplates } from './spell-templates';
import { createEffect, createFireballComposition, createFireHitEffect, createMageHandEffect, createMagicMissileEffect, defaultMotion, EFFECT_KINDS, EffectDefinition, VARIANTS } from './effect-definition';
export interface LayerCatalogEntry extends GridOption { effect: EffectDefinition; }
/** One catalog for every selectable GPU composition and all authored core styles. */
export function makeLayerCatalog():LayerCatalogEntry[]{
 const entries:LayerCatalogEntry[]=[];
 const add=(id:string,title:string,description:string,category:string,effect:EffectDefinition,icon:GridOption['icon']='sparkles')=>entries.push({id,title,description,category,effect,icon});
 for(const kind of EFFECT_KINDS)for(const variant of VARIANTS[kind]){
  const effect=createEffect(variant.name,kind),layer=effect.layers[0];layer.variant=variant.id;layer.motion=defaultMotion(kind,variant.id);
  if(layer.cinematic){layer.motion.direction=0;layer.cinematic.element=variant.id==='frost'||variant.id==='shards'?'ice':variant.id==='poison'?'gas':variant.id==='force'?'force':'fire';}
  add('core:'+kind+':'+variant.id,kind.charAt(0).toUpperCase()+kind.slice(1)+' / '+variant.name,variant.description,'Core styles',effect);
 }
 const templates=makeSpellTemplates();
 for(const element of ['fire','ice','gas'] as const){
  const effect=structuredClone(element==='gas'?makeGasCone():templates.find(e=>e.spellName===(element==='ice'?'Cone of Cold':'Burning Hands'))!);
  for(const layer of effect.layers)if(layer.cinematic){layer.cinematic.reachFeet=15;layer.cinematic.widthFeet=15;}
  add('cone:'+element,element.charAt(0).toUpperCase()+element.slice(1)+' Cone','15-foot cone with adjustable reach and end width.','Special effects',effect);
 }
 add('mage-hand','Mage Hand','A growing spectral hand following an editable path.','Special effects',createMageHandEffect());
 add('magic-missile','Magic Missile','Three curved bolts, colored smoke trails, and independent targets.','Special effects',createMagicMissileEffect());
 add('fireball','Fireball Sequence','Caster charge, traveling fireball, and explosive target impact.','Special effects',createFireballComposition(),'flame');
 for(const role of ['caster','projectile','impact'] as const)add('fire:'+role,'Fire '+role,'Textured flames, smoke, and glowing embers.','Special effects',createFireballComposition(role),'flame');
 add('fire-hit','Fire Hit','Flame, residual smoke, lighting, and ground shadow.','Special effects',createFireHitEffect(),'flame');
 templates.forEach((effect,i)=>add('spell:'+i,effect.spellName,effect.description,'Spell templates',effect));
 makeAmbientPresets().forEach(({role,effect},i)=>add('ambient:'+i,effect.name,effect.description,role==='caster'?'Caster effects':'Target effects',effect));
 const order=['Special effects','Core styles','Spell templates','Caster effects','Target effects'];
 return entries.sort((a,b)=>order.indexOf(a.category)-order.indexOf(b.category));
}
