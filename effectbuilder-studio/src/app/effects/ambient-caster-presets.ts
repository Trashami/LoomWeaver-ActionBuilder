import { EffectKind, EffectMotion } from './effect-definition';

export type AmbientSpec = {
  kind: EffectKind;
  variant: string;
  color: string;
  size?: number;
  spread?: number;
  count?: number;
  opacity?: number;
  delay?: number;
  duration?: number;
  offsetX?: number;
  offsetY?: number;
  motion?: Partial<EffectMotion>;
};

export interface AmbientPresetEntry {
  name: string;
  spellName: string;
  description: string;
  specs: AmbientSpec[];
}

export const fx = (
  kind: EffectKind,
  variant: string,
  color: string,
  options: Omit<AmbientSpec, 'kind' | 'variant' | 'color'> = {}
): AmbientSpec => ({ kind, variant, color, ...options });

export const hands = (
  variant: string,
  color: string,
  motion: Partial<EffectMotion> = {}
): AmbientSpec[] => [
  fx('sparks', variant, color, { size: 4, spread: 16, count: 20, offsetX: 19, offsetY: -13, motion }),
  fx('sparks', variant, color, { size: 4, spread: 16, count: 20, offsetX: 19, offsetY: 13, motion }),
];

export const CASTER_AMBIENT_SPECS: AmbientPresetEntry[] = [
  { name: 'Cinder Hands', spellName: 'Burning Hands', description: 'Twin ember-filled palms warm up before a fire spell.', specs: [...hands('embers', '#ff792e', { direction: -90, cone: 55, speed: 0.65, turbulence: 30 }), fx('aura', 'flame', '#d64b20', { size: 28, count: 16, opacity: 0.25 })] },
  { name: 'Kindling Mantle', spellName: 'Fire Bolt', description: 'A low flame mantle gathers beneath rising sparks.', specs: [fx('aura', 'flame', '#ff652d', { size: 40, count: 32, motion: { speed: 0.65 } }), fx('sparks', 'fire', '#ffc064', { size: 4, spread: 27, count: 28 })] },
  { name: 'Starlit Palms', spellName: 'Light', description: 'Tiny white and gold sparkles gather at both hands.', specs: [...hands('twirl', '#ffe6a1', { speed: 0.4, twirl: 0.5 }), fx('aura', 'orbit', '#fff7d7', { size: 30, opacity: 0.3 })] },
  { name: 'Gathering Zephyr', spellName: 'Gust', description: 'A breeze slowly forms into rotating air currents around the caster.', specs: [fx('aura', 'vortex', '#a3e8dd', { size: 57, opacity: 0.42, motion: { twirl: 0.22, speed: 0.35 } }), fx('sparks', 'twirl', '#dbfff6', { size: 2, spread: 42, count: 18, opacity: 0.4, motion: { speed: 0.45, twirl: 0.35, trail: 0.8 } })] },
  { name: 'Smokewoven Mantle', spellName: 'Fog Cloud', description: 'Cool smoke banks gather into a soft casting shroud.', specs: [fx('cloud', 'fog', '#8da0af', { size: 55, count: 45, opacity: 0.36, motion: { speed: 0.25, twirl: 0.25, turbulence: 25 } }), fx('aura', 'mist', '#c0d2da', { size: 29, count: 18, opacity: 0.25, motion: { direction: -90, speed: 0.3 } })] },
  { name: 'Rimebound Hands', spellName: 'Ray of Frost', description: 'Crystal motes gather around two cold, luminous palms.', specs: [...hands('embers', '#8cddff', { direction: -90, speed: 0.25, turbulence: 12 }), fx('aura', 'orbit', '#c4f1ff', { size: 34, opacity: 0.45, motion: { speed: 0.35, twirl: 0.25 } })] },
  { name: 'Storm Charge', spellName: 'Shocking Grasp', description: 'A crackling personal storm charges the caster’s hands.', specs: [...hands('pushback', '#90b3ff', { cone: 360, speed: 0.45, trail: 0.7 }), fx('cloud', 'storm', '#8c9eff', { size: 38, count: 18, opacity: 0.4, motion: { speed: 0.3 } })] },
  { name: 'Venom Vapors', spellName: 'Poison Spray', description: 'Green vapor and floating venom bubbles collect near the palms.', specs: [fx('cloud', 'poison', '#83b746', { size: 25, count: 18, offsetX: 20, offsetY: -12, opacity: 0.4 }), fx('aura', 'mist', '#abc85f', { size: 27, count: 24, offsetX: 20, offsetY: 12, opacity: 0.4, motion: { direction: -90, speed: 0.35 } })] },
  { name: 'Renewal Wellspring', spellName: 'Cure Wounds', description: 'Warm healing light rises through a quiet golden halo.', specs: [fx('aura', 'halo', '#f4d587', { size: 39, opacity: 0.5, motion: { speed: 0.4 } }), ...hands('fountain', '#ffecc0', { direction: -90, cone: 40, speed: 0.3, gravity: 25 })] },
  { name: 'Eldritch Gathering', spellName: 'Eldritch Blast', description: 'Unstable violet spirals and pale motes gather before release.', specs: [fx('aura', 'vortex', '#a77bff', { size: 45, motion: { twirl: -0.6, speed: 0.4 } }), fx('sparks', 'twirl', '#dfb7ff', { size: 3, spread: 23, count: 32, motion: { twirl: -1, speed: 0.6 } })] },
  { name: 'Verdant Awakening', spellName: 'Druidcraft', description: 'Living green circles and seed-like motes awaken around the caster.', specs: [fx('sigil', 'ward', '#5ec975', { size: 43, opacity: 0.35, motion: { twirl: 0.15 } }), fx('sparks', 'fountain', '#b4e97d', { size: 3, spread: 30, count: 24, motion: { speed: 0.25, gravity: 30, direction: -90, cone: 120 } })] },
  { name: 'Pixie Constellation', spellName: 'Faerie Fire', description: 'Pink and cyan faerie lights orbit the caster and collect in their hands.', specs: [fx('aura', 'orbit', '#ec99ff', { size: 47, motion: { speed: 0.55, twirl: 0.4 } }), ...hands('twirl', '#8cf3e8', { speed: 0.35, twirl: -0.6 })] },
  { name: 'Abjurer’s Ward', spellName: 'Mage Armor', description: 'Fine geometric wards assemble around a pale protective shell.', specs: [fx('sigil', 'ward', '#85bdff', { size: 51, opacity: 0.6, motion: { twirl: 0.2 } }), fx('aura', 'halo', '#d0e9ff', { size: 38, opacity: 0.35 })] },
  { name: 'Dawn Benediction', spellName: 'Bless', description: 'A golden runic circle and gentle halo announce a blessing.', specs: [fx('sigil', 'runic', '#eac574', { size: 52, opacity: 0.55, motion: { twirl: -0.2 } }), fx('sparks', 'embers', '#fff1c5', { size: 3, spread: 38, count: 20, motion: { speed: 0.35, direction: -90 } })] },
  { name: 'Arcane Focus', spellName: 'Magic Missile', description: 'Crossing violet orbits focus into a rotating arcane lattice.', specs: [fx('sigil', 'teleport', '#ad9bff', { size: 39, opacity: 0.4, motion: { twirl: 0.35 } }), fx('aura', 'orbit', '#a7d0ff', { size: 53, motion: { speed: 0.6, twirl: -0.4 } })] },
  { name: 'Sacred Kindling', spellName: 'Sacred Flame', description: 'Small white-gold flames bloom at both hands before casting.', specs: [...hands('fire', '#ffe8b2', { direction: -90, cone: 35, speed: 0.45 }), fx('ring', 'runes', '#ffdb82', { size: 40, opacity: 0.4, motion: { twirl: 0.2 } })] },
  { name: 'Grave Mist', spellName: 'Chill Touch', description: 'Ashen spirit smoke and cold motes curl around the caster.', specs: [fx('aura', 'mist', '#739c9b', { size: 43, count: 40, opacity: 0.45, motion: { direction: -90, speed: 0.35, turbulence: 45 } }), fx('sparks', 'embers', '#bde4d6', { size: 2, spread: 26, count: 18, motion: { speed: 0.2, twirl: -0.4 } })] },
  { name: 'Resonant Air', spellName: 'Thunderwave', description: 'Pulsing air rings and a slow vortex build a thunderous charge.', specs: [fx('ring', 'ripple', '#9fcbe8', { size: 57, opacity: 0.4, motion: { speed: 0.4 } }), fx('aura', 'vortex', '#e2eaff', { size: 32, opacity: 0.55, motion: { twirl: 0.5, speed: 0.3 } })] },
  { name: 'Veilstep Preparation', spellName: 'Misty Step', description: 'Silver mist gathers inside a rotating portal rim.', specs: [fx('cloud', 'fog', '#b4a9df', { size: 48, count: 35, opacity: 0.35, motion: { speed: 0.2, twirl: 0.5 } }), fx('ring', 'portal', '#d9cbff', { size: 45, opacity: 0.45, motion: { twirl: 0.6, speed: 0.4 } })] },
  { name: 'Witchlight Invocation', spellName: 'Hex', description: 'A shadowy violet seal and green witchlights build a curse.', specs: [fx('sigil', 'summoning', '#b282de', { size: 47, opacity: 0.45, motion: { twirl: -0.25 } }), ...hands('embers', '#aad66a', { direction: -90, speed: 0.3, twirl: 0.6 })] },
];
