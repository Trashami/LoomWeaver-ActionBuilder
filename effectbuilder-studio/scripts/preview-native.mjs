// Isolated GPU verification surface: uses the production renderer without account/campaign writes.
import {build} from 'esbuild';
import fs from 'node:fs/promises';
const out='dist/native-preview';await fs.mkdir(out,{recursive:true});
await fs.cp('public/lighting',out+'/lighting',{recursive:true});
await build({stdin:{contents:`
import {BabylonEffectPreview} from './src/app/effects/babylon/native-preview';
import {createEffect,createFireballComposition,createFireHitEffect,createMageHandEffect,createMagicMissileEffect,EFFECT_KINDS,VARIANTS,defaultMotion,effectDuration} from './src/app/effects/effect-definition';
import {makeSpellTemplates} from './src/app/effects/spell-templates';
import {makeAmbientPresets} from './src/app/effects/ambient-presets';
const core=EFFECT_KINDS.flatMap(kind=>VARIANTS[kind].map(v=>{const e=createEffect(kind+' / '+v.name,kind);e.layers[0].variant=v.id;e.layers[0].motion=defaultMotion(kind,v.id);return e;}));
const effects=[createFireballComposition(),createMageHandEffect(),createMagicMissileEffect(),createFireHitEffect(),...makeSpellTemplates(),...makeAmbientPresets().map(x=>x.effect),...core];
const selector=document.querySelector('select'),canvas=document.querySelector('canvas'),status=document.querySelector('#status'),range=document.querySelector('#seek');
effects.forEach((e,i)=>selector.add(new Option(e.name,String(i))));let selected=effects[0],time=1200,playing=true,orbit=false,running=false;
const preview=new BabylonEffectPreview(canvas,()=>canvas.clientWidth,()=>canvas.clientHeight);
window.addEventListener('resize',()=>preview.resize());selector.onchange=()=>{selected=effects[+selector.value];time=selected.layers[0].delay+selected.layers[0].duration*.42;};range.oninput=()=>{playing=false;time=+range.value*effectDuration(selected);};
document.querySelector('#play').onclick=()=>playing=!playing;
document.querySelector('#blend').onchange=e=>selected={...selected,layers:selected.layers.map(l=>({...l,blendMode:e.target.value}))};
document.querySelector('#orbit').onclick=()=>{orbit=!orbit;preview.setView(orbit);};
let last=performance.now();preview.engine.runRenderLoop(()=>{const now=performance.now();if(playing&&!running)time=(time+Math.min(50,now-last))%(effectDuration(selected)+300);last=now;
 const w=canvas.clientWidth,h=canvas.clientHeight,s=selected.previewScene,from={x:s.caster.x*w,y:s.caster.y*h},targets=s.targets.map(p=>({x:p.x*w,y:p.y*h}));

 preview.render(selected,Math.min(time,effectDuration(selected)),from,targets,Math.min(1,w/700,h/360),{},{background:true,ambient:.24,bump:1.25,grid:true,ground:true});
 status.textContent=running?'GPU sweep in progress':selected.name+' · '+Math.round(time)+' ms · '+Math.round(preview.engine.getFps())+' FPS';
});
document.querySelector('#sweep').onclick=async()=>{running=true;playing=false;const failures=[];for(let i=0;i<effects.length;i++){selected=effects[i];selector.value=String(i);time=selected.layers[0].delay+selected.layers[0].duration*.45;for(let j=0;j<3;j++)await new Promise(requestAnimationFrame);await preview.scene.whenReadyAsync();for(const m of preview.scene.materials)if(m.getEffect?.()?.getCompilationError?.())failures.push(selected.name+': '+m.getEffect().getCompilationError());}running=false;document.querySelector('#result').textContent=failures.length?failures.join('\\n'):'PASS: '+effects.length+' compositions compiled and rendered on WebGL';selected=effects[0];selector.value='0';time=2200;};
`,resolveDir:process.cwd(),sourcefile:'native-preview-entry.ts',loader:'ts'},bundle:true,format:'esm',outfile:out+'/preview.js',sourcemap:false});
await fs.writeFile(out+'/index.html',`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#080f13;color:#d4ece6;font:14px system-ui}header{padding:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}button,select{background:#093d31;color:#bdffe8;border:1px solid #00885c;padding:8px;border-radius:5px}canvas{display:block;width:100vw;height:calc(100vh - 125px)}#result{white-space:pre-wrap;padding:6px}input{width:180px}</style></head><body><header><strong>Native Babylon EffectBuilder</strong><select aria-label="Effect template"></select><button id="play">Play / pause</button><button id="orbit">3D / overhead</button><select id="blend" aria-label="Layer blend"><option>normal</option>${['add','screen','multiply','overlay','soft-light','hard-light','darken','lighten','difference'].map(x=>'<option>'+x+'</option>').join('')}</select><input id="seek" aria-label="Seek" type="range" min="0" max="1" step=".001"><button id="sweep">Run GPU catalog sweep</button><span id="status"></span></header><canvas></canvas><div id="result" role="status"></div><script type="module" src="preview.js"></script></body></html>`);
console.log('Native GPU harness:',out);
