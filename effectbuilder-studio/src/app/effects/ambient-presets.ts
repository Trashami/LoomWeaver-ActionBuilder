import { EffectDefinition, EffectKind, EffectLayer, EffectMotion, createEffect, createLayer, defaultMotion, newId } from './effect-definition';

export type AmbientRole = 'caster' | 'target';
export interface AmbientPreset { role: AmbientRole; effect: EffectDefinition; }
type Spec = { kind: EffectKind; variant: string; color: string; size?: number; spread?: number; count?: number; opacity?: number; delay?: number; duration?: number; offsetX?: number; offsetY?: number; motion?: Partial<EffectMotion>; };
const fx = (kind: EffectKind, variant: string, color: string, options: Omit<Spec,'kind'|'variant'|'color'> = {}): Spec => ({kind,variant,color,...options});
const hands = (variant: string, color: string, motion: Partial<EffectMotion> = {}): Spec[] => [
  fx('sparks',variant,color,{size:4,spread:16,count:20,offsetX:19,offsetY:-13,motion}),
  fx('sparks',variant,color,{size:4,spread:16,count:20,offsetX:19,offsetY:13,motion})
];

/** Curated compositions, using editable layers rather than opaque baked animations. */
export function makeAmbientPresets(): AmbientPreset[] {
  const presets: AmbientPreset[] = [];
  const add = (role: AmbientRole, name: string, spellName: string, description: string, specs: Spec[]) => {
    const effect = createEffect(name); effect.spellName=spellName; effect.description=description;
    effect.layers=specs.map((spec,i):EffectLayer => {
      const layer=createLayer(spec.kind);
      const {kind,variant,color,motion,...patch}=spec;
      return {...layer,kind,variant,color,secondaryColor:role==='caster'?'#fff5d6':'#e4dcff',size:55,spread:35,count:32,
        anchor:role,delay:role==='caster'?0:850,duration:role==='caster'?2400:3200,opacity:.8,blendMode:'screen',...patch,
        motion:{...defaultMotion(kind,variant),seed:71+presets.length*17+i*29,...motion},
        opacityKeyframes:(role==='caster'?[{time:0,value:0},{time:.32,value:.8},{time:.72,value:1},{time:1,value:0}]:[{time:0,value:0},{time:.08,value:1},{time:.45,value:.75},{time:1,value:0}])
          .map(key=>({...key,id:newId(),easing:'ease-in-out'}))};
    });
    presets.push({role,effect});
  };
  add('caster','Cinder Hands','Burning Hands','Twin ember-filled palms warm up before a fire spell.',[...hands('embers','#ff792e',{direction:-90,cone:55,speed:.65,turbulence:30}),fx('aura','flame','#d64b20',{size:28,count:16,opacity:.25})]);
  add('caster','Kindling Mantle','Fire Bolt','A low flame mantle gathers beneath rising sparks.',[fx('aura','flame','#ff652d',{size:40,count:32,motion:{speed:.65}}),fx('sparks','fire','#ffc064',{size:4,spread:27,count:28})]);
  add('caster','Starlit Palms','Light','Tiny white and gold sparkles gather at both hands.',[...hands('twirl','#ffe6a1',{speed:.4,twirl:.5}),fx('aura','orbit','#fff7d7',{size:30,opacity:.3})]);
  add('caster','Gathering Zephyr','Gust','A breeze slowly forms into rotating air currents around the caster.',[fx('aura','vortex','#a3e8dd',{size:57,opacity:.42,motion:{twirl:.22,speed:.35}}),fx('sparks','twirl','#dbfff6',{size:2,spread:42,count:18,opacity:.4,motion:{speed:.45,twirl:.35,trail:.8}})]);
  add('caster','Smokewoven Mantle','Fog Cloud','Cool smoke banks gather into a soft casting shroud.',[fx('cloud','fog','#8da0af',{size:55,count:45,opacity:.36,motion:{speed:.25,twirl:.25,turbulence:25}}),fx('aura','mist','#c0d2da',{size:29,count:18,opacity:.25,motion:{direction:-90,speed:.3}})]);
  add('caster','Rimebound Hands','Ray of Frost','Crystal motes gather around two cold, luminous palms.',[...hands('embers','#8cddff',{direction:-90,speed:.25,turbulence:12}),fx('aura','orbit','#c4f1ff',{size:34,opacity:.45,motion:{speed:.35,twirl:.25}})]);
  add('caster','Storm Charge','Shocking Grasp','A crackling personal storm charges the caster’s hands.',[...hands('pushback','#90b3ff',{cone:360,speed:.45,trail:.7}),fx('cloud','storm','#8c9eff',{size:38,count:18,opacity:.4,motion:{speed:.3}})]);
  add('caster','Venom Vapors','Poison Spray','Green vapor and floating venom bubbles collect near the palms.',[fx('cloud','poison','#83b746',{size:25,count:18,offsetX:20,offsetY:-12,opacity:.4}),fx('aura','mist','#abc85f',{size:27,count:24,offsetX:20,offsetY:12,opacity:.4,motion:{direction:-90,speed:.35}})]);
  add('caster','Renewal Wellspring','Cure Wounds','Warm healing light rises through a quiet golden halo.',[fx('aura','halo','#f4d587',{size:39,opacity:.5,motion:{speed:.4}}),...hands('fountain','#ffecc0',{direction:-90,cone:40,speed:.3,gravity:25})]);
  add('caster','Eldritch Gathering','Eldritch Blast','Unstable violet spirals and pale motes gather before release.',[fx('aura','vortex','#a77bff',{size:45,motion:{twirl:-.6,speed:.4}}),fx('sparks','twirl','#dfb7ff',{size:3,spread:23,count:32,motion:{twirl:-1,speed:.6}})]);
  add('caster','Verdant Awakening','Druidcraft','Living green circles and seed-like motes awaken around the caster.',[fx('sigil','ward','#5ec975',{size:43,opacity:.35,motion:{twirl:.15}}),fx('sparks','fountain','#b4e97d',{size:3,spread:30,count:24,motion:{speed:.25,gravity:30,direction:-90,cone:120}})]);
  add('caster','Pixie Constellation','Faerie Fire','Pink and cyan faerie lights orbit the caster and collect in their hands.',[fx('aura','orbit','#ec99ff',{size:47,motion:{speed:.55,twirl:.4}}),...hands('twirl','#8cf3e8',{speed:.35,twirl:-.6})]);
  add('caster','Abjurer’s Ward','Mage Armor','Fine geometric wards assemble around a pale protective shell.',[fx('sigil','ward','#85bdff',{size:51,opacity:.6,motion:{twirl:.2}}),fx('aura','halo','#d0e9ff',{size:38,opacity:.35})]);
  add('caster','Dawn Benediction','Bless','A golden runic circle and gentle halo announce a blessing.',[fx('sigil','runic','#eac574',{size:52,opacity:.55,motion:{twirl:-.2}}),fx('sparks','embers','#fff1c5',{size:3,spread:38,count:20,motion:{speed:.35,direction:-90}})]);
  add('caster','Arcane Focus','Magic Missile','Crossing violet orbits focus into a rotating arcane lattice.',[fx('sigil','teleport','#ad9bff',{size:39,opacity:.4,motion:{twirl:.35}}),fx('aura','orbit','#a7d0ff',{size:53,motion:{speed:.6,twirl:-.4}})]);
  add('caster','Sacred Kindling','Sacred Flame','Small white-gold flames bloom at both hands before casting.',[...hands('fire','#ffe8b2',{direction:-90,cone:35,speed:.45}),fx('ring','runes','#ffdb82',{size:40,opacity:.4,motion:{twirl:.2}})]);
  add('caster','Grave Mist','Chill Touch','Ashen spirit smoke and cold motes curl around the caster.',[fx('aura','mist','#739c9b',{size:43,count:40,opacity:.45,motion:{direction:-90,speed:.35,turbulence:45}}),fx('sparks','embers','#bde4d6',{size:2,spread:26,count:18,motion:{speed:.2,twirl:-.4}})]);
  add('caster','Resonant Air','Thunderwave','Pulsing air rings and a slow vortex build a thunderous charge.',[fx('ring','ripple','#9fcbe8',{size:57,opacity:.4,motion:{speed:.4}}),fx('aura','vortex','#e2eaff',{size:32,opacity:.55,motion:{twirl:.5,speed:.3}})]);
  add('caster','Veilstep Preparation','Misty Step','Silver mist gathers inside a rotating portal rim.',[fx('cloud','fog','#b4a9df',{size:48,count:35,opacity:.35,motion:{speed:.2,twirl:.5}}),fx('ring','portal','#d9cbff',{size:45,opacity:.45,motion:{twirl:.6,speed:.4}})]);
  add('caster','Witchlight Invocation','Hex','A shadowy violet seal and green witchlights build a curse.',[fx('sigil','summoning','#b282de',{size:47,opacity:.45,motion:{twirl:-.25}}),...hands('embers','#aad66a',{direction:-90,speed:.3,twirl:.6})]);

  add('target','Afterburn Smoke','Fireball','Residual gray smoke and scattered hot cinders linger after impact.',[fx('cloud','fog','#8f817a',{size:68,count:55,opacity:.4,motion:{speed:.22,twirl:.18,turbulence:25}}),fx('sparks','embers','#ff8d3d',{size:3,spread:60,count:35,motion:{direction:-90,speed:.35}})]);
  add('target','Lingering Pyre','Burning Hands','A low ring of fire sheds sparks around the affected token.',[fx('aura','flame','#fa682d',{size:38,count:40,motion:{speed:.5}}),fx('ring','shockwave','#ffa755',{size:38,opacity:.28,motion:{speed:.15}})]);
  add('target','Frostfall Residue','Cone of Cold','Snow and cold vapor remain over the point of impact.',[fx('cloud','blizzard','#c4ecff',{size:70,count:55,opacity:.7,motion:{direction:20,speed:.3}}),fx('cloud','fog','#88c2df',{size:52,count:24,opacity:.22})]);
  add('target','Glacial Fracture','Ray of Frost','A crystalline impact resolves into frozen ripples.',[fx('burst','shatter','#a1ddff',{size:46,count:22,duration:1500,motion:{speed:.35,gravity:20}}),fx('ring','ripple','#dbf8ff',{size:55,opacity:.45,motion:{speed:.2}})]);
  add('target','Noxious Aftercloud','Cloudkill','Poison bubbles drift within a lingering green cloud.',[fx('cloud','poison','#8ca834',{size:69,count:50,opacity:.45,motion:{speed:.2,twirl:.15}}),fx('aura','mist','#b6cc63',{size:41,count:20,opacity:.32,motion:{direction:-90,speed:.25}})]);
  add('target','Dissipating Fog','Fog Cloud','Broad pale fog slowly unwinds and fades around the target.',[fx('cloud','fog','#bac8d3',{size:84,count:60,opacity:.35,motion:{speed:.15,twirl:-.12}}),fx('aura','mist','#9fb7c5',{size:60,count:30,opacity:.22,motion:{speed:.2,direction:-90,turbulence:20}})]);
  add('target','Umbral Remnant','Darkness','A pool of shadow and purple wisps remain after dark magic.',[fx('cloud','darkness','#7d62ac',{size:63,count:45,opacity:.65}),fx('aura','mist','#8062ad',{size:35,count:24,opacity:.25,motion:{twirl:-.3,speed:.25}})]);
  add('target','Static Afterimage','Lightning Bolt','Residual electrical flickers dance across fading storm vapor.',[fx('cloud','storm','#8bb4ff',{size:45,count:28,opacity:.6,motion:{speed:.2}}),fx('sparks','pushback','#d5efff',{size:2,spread:40,count:30,motion:{cone:360,speed:.35,trail:.8}})]);
  add('target','Thunderwake','Thunderwave','Concentric shock ripples and pale motes mark the aftermath.',[fx('ring','ripple','#b5d9ee',{size:76,opacity:.55,motion:{speed:.22}}),fx('sparks','twirl','#d8e8f2',{size:2,spread:49,count:18,motion:{twirl:.15,speed:.3}})]);
  add('target','Hexed Ground','Hex','A six-sided violet curse lattice rotates beneath the target.',[fx('sigil','teleport','#b27cde',{size:62,offsetY:15,opacity:.7,motion:{twirl:.15}}),fx('sparks','embers','#d598ea',{size:2,spread:40,count:20,motion:{direction:-90,speed:.2}})]);
  add('target','Infernal Pentagram','Summon Fiend','A red pentagram and a low circle of smoke stain the floor.',[fx('sigil','summoning','#dc5b57',{size:68,offsetY:16,opacity:.8,motion:{twirl:0}}),fx('cloud','fog','#9d665e',{size:58,count:34,opacity:.27,offsetY:16,motion:{speed:.15,twirl:.12}})]);
  add('target','Binding Seal','Hold Person','Crossed magical diamonds and runic marks linger around the subject.',[fx('sigil','banishment','#d5aeff',{size:51,opacity:.65,motion:{twirl:.12}}),fx('ring','runes','#9f8de6',{size:64,offsetY:14,opacity:.5,motion:{twirl:-.15}})]);
  add('target','Faerie Fire Traces','Faerie Fire','Bright fey motes outline the target inside pink and cyan orbits.',[fx('aura','halo','#f184ed',{size:29,count:80,opacity:.8,motion:{speed:.35,turbulence:14}}),fx('aura','orbit','#8ceae3',{size:42,opacity:.6,motion:{speed:.6,twirl:.35}}),fx('sparks','twirl','#e7b2ff',{size:2,spread:29,count:24,motion:{speed:.25,twirl:.4}})]);
  add('target','Moonlit Consecration','Moonbeam','Silver runes and drifting moon dust mark a consecrated patch.',[fx('sigil','runic','#d2dbff',{size:68,offsetY:15,opacity:.7,motion:{twirl:.1}}),fx('sparks','embers','#e9f1ff',{size:2,spread:48,count:30,motion:{direction:-90,speed:.2}})]);
  add('target','Briar Aftergrowth','Entangle','A living green seal and curling seed motes cling to the affected ground.',[fx('sigil','ward','#78b95e',{size:66,offsetY:15,opacity:.6,motion:{twirl:.05}}),fx('aura','vortex','#b7d789',{size:51,opacity:.45,motion:{twirl:.15,speed:.2}})]);
  add('target','Necrotic Ash','Blight','Cold gray ash rises from a faint green-black spirit haze.',[fx('sparks','embers','#a1ada2',{size:3,spread:53,count:45,opacity:.5,motion:{direction:-90,speed:.25,twirl:-.35}}),fx('cloud','fog','#677d66',{size:54,count:35,opacity:.35,motion:{speed:.2,twirl:-.15}})]);
  add('target','Radiant Echo','Guiding Bolt','A warm golden outline and celestial satellites persist after a radiant hit.',[fx('aura','halo','#ffe2a0',{size:32,count:45,opacity:.65}),fx('aura','orbit','#fff4d2',{size:57,opacity:.5,motion:{speed:.35,twirl:.2}})]);
  add('target','Fractured Force','Wall of Force','Dissolving geometric fragments and a thin arcane shock ring remain.',[fx('burst','shatter','#96c5f6',{size:63,count:18,duration:1800,motion:{speed:.25}}),fx('ring','shockwave','#c7ddff',{size:64,opacity:.4,motion:{speed:.2}})]);
  add('target','Disintegration Dust','Disintegrate','Fine green dust curls away inside a fading planar seal.',[fx('sparks','fountain','#abd67b',{size:2,spread:60,count:55,opacity:.6,motion:{direction:-90,cone:100,speed:.35,gravity:22,twirl:.4}}),fx('sigil','banishment','#7bad62',{size:54,opacity:.25,motion:{twirl:-.25}})]);
  add('target','Fey Departure','Misty Step','A fading portal rim, lavender smoke and pixie sparks mark a departure.',[fx('ring','portal','#c4a0fa',{size:48,opacity:.55,motion:{speed:.25,twirl:.4}}),fx('cloud','fog','#b998db',{size:56,count:40,opacity:.3,motion:{speed:.2,twirl:.2}}),fx('sparks','twirl','#edc7ff',{size:2,spread:40,count:22,motion:{speed:.2,twirl:-.3}})]);
  return presets;
}
