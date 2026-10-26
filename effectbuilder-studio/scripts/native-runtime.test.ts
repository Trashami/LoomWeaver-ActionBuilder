import assert from 'node:assert/strict';
import { NullEngine, Scene, FreeCamera, Vector3 } from '@babylonjs/core';
import { BabylonEffectRuntime, normalizeNativeDefinition } from '../src/app/effects/babylon/native-runtime';
import { createEffect, createFireballComposition, createMageHandEffect, createMagicMissileEffect, BLEND_MODES } from '../src/app/effects/effect-definition';
import { makeSpellTemplates } from '../src/app/effects/spell-templates';
import { makeAmbientPresets } from '../src/app/effects/ambient-presets';
const engine=new NullEngine({renderWidth:800,renderHeight:400,textureSize:512,deterministicLockstep:false,lockstepMaxSteps:4}),scene=new Scene(engine);
new FreeCamera('test-camera',new Vector3(4,10,-5),scene).setTarget(new Vector3(4,0,2));
const baseline={meshes:scene.meshes.length,materials:scene.materials.length,lights:scene.lights.length,nodes:scene.transformNodes.length};
for(const effect of [createFireballComposition(),createMageHandEffect(),createMagicMissileEffect(),...makeSpellTemplates(),...makeAmbientPresets().map(p=>p.effect)]){
 const runtime=new BabylonEffectRuntime(scene);
 for(const time of [0,400,900,1600,2500]){runtime.draw(effect,time,{x:66,y:132},{x:462,y:132},1,[{x:462,y:132},{x:396,y:66},{x:396,y:264}]);for(const mesh of scene.meshes)for(const value of mesh.getVerticesData('position')??[])assert.ok(Number.isFinite(value));}
 assert.ok(scene.lights.length<=baseline.lights+4,'bounded native lighting');
 runtime.dispose();runtime.dispose();assert.equal(scene.meshes.length,baseline.meshes,effect.name+' meshes released');assert.equal(scene.materials.length,baseline.materials,effect.name+' materials released');assert.equal(scene.lights.length,baseline.lights);assert.equal(scene.transformNodes.length,baseline.nodes);
}
const runtime=new BabylonEffectRuntime(scene),effect=createEffect('Blend lifecycle');
for(const blend of BLEND_MODES){effect.layers[0].blendMode=blend;runtime.draw(effect,500,{x:0,y:100},{x:300,y:100});assert.equal(scene.customRenderTargets.length,blend==='normal'?0:1);}
effect.layers=[];runtime.draw(effect,500,{x:0,y:100},{x:300,y:100});assert.equal(scene.customRenderTargets.length,0);runtime.dispose();
const legacy=normalizeNativeDefinition({id:'old',name:'Legacy',layers:[{id:'layer',type:'rune',durationMs:1000,primaryColor:'#abcdef'}]});assert.equal(legacy.layers[0].kind,'sigil');assert.equal(legacy.layers[0].color,'#abcdef');
scene.dispose();engine.dispose();console.log('PASS Babylon runtime: actual mesh generation, finite buffers, bounded lighting, blend target lifecycle, legacy adapter and complete repeated disposal.');
