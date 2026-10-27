export type ProjectileElement =
  | 'fire'
  | 'ice'
  | 'snow'
  | 'eldritch'
  | 'lightning'
  | 'acid'
  | 'radiant'
  | 'shadow';

export type ProjectileCoreShape = 'sphere' | 'lance' | 'comet' | 'prism' | 'star';

export interface ProjectileCoreSettings {
  element: ProjectileElement;
  shape: ProjectileCoreShape;
  arc: number;
  coreScale: number;
  coronaSize: number;
  spinSpeed: number;
  orbitCount: number;
  wakeRibbons: number;
  wakeLength: number;
}

export const PROJECTILE_ELEMENTS: readonly {
  id: ProjectileElement;
  name: string;
  color: string;
  secondaryColor: string;
  shape: ProjectileCoreShape;
  description: string;
}[] = [
  {
    id: 'fire',
    name: 'Fire / Fireball',
    color: '#ff5b16',
    secondaryColor: '#fff1bd',
    shape: 'comet',
    description: '3D molten magma core with roiling flame corona, coiling fire ribbons, and embers.',
  },
  {
    id: 'ice',
    name: 'Ice / Frost Lance',
    color: '#6edcff',
    secondaryColor: '#ebfcff',
    shape: 'lance',
    description: 'Faceted 3D crystalline icicle spear with spinning frost shards and cold vapor.',
  },
  {
    id: 'snow',
    name: 'Snow / Blizzard Orb',
    color: '#a8ecff',
    secondaryColor: '#ffffff',
    shape: 'sphere',
    description: 'Swirling 3D packed snow-sphere with orbiting frost-flake rings and snow flurry wake.',
  },
  {
    id: 'eldritch',
    name: 'Eldritch Blast / Arcane',
    color: '#30efc1',
    secondaryColor: '#e8fff8',
    shape: 'prism',
    description: 'Crackling 3D arcane singularity core with counter-rotating helix coils and force bolts.',
  },
  {
    id: 'lightning',
    name: 'Lightning / Storm Orb',
    color: '#7ab8ff',
    secondaryColor: '#f2f8ff',
    shape: 'star',
    description: 'High-voltage 3D plasma core with branching electrical arcs and ionized sparks.',
  },
  {
    id: 'acid',
    name: 'Acid / Venom Glob',
    color: '#9fef33',
    secondaryColor: '#ecffbd',
    shape: 'sphere',
    description: 'Morphing 3D caustic globule with orbiting venom droplets and corrosive wake.',
  },
  {
    id: 'radiant',
    name: 'Radiant / Guiding Bolt',
    color: '#ffd978',
    secondaryColor: '#fffdf0',
    shape: 'star',
    description: 'Blazing 3D celestial star-core with intersecting golden halo rings and light motes.',
  },
  {
    id: 'shadow',
    name: 'Shadow / Void Bolt',
    color: '#955ada',
    secondaryColor: '#f0d9ff',
    shape: 'prism',
    description: 'Dark 3D abyssal core with luminous violet rim and coiling umbral tendrils.',
  },
];

export const PROJECTILE_SHAPES: readonly { id: ProjectileCoreShape; name: string }[] = [
  { id: 'sphere', name: '3D Energy Sphere / Orb' },
  { id: 'comet', name: '3D Meteor / Comet Head' },
  { id: 'lance', name: '3D Crystal Spear / Icicle' },
  { id: 'prism', name: '3D Arcane Octahedron Prism' },
  { id: 'star', name: '3D Radiant / Eldritch Star' },
];

export const PROJECTILE_CORE_DEFAULTS: ProjectileCoreSettings = {
  element: 'fire',
  shape: 'comet',
  arc: -45,
  coreScale: 1,
  coronaSize: 1.35,
  spinSpeed: 1.8,
  orbitCount: 3,
  wakeRibbons: 3,
  wakeLength: 1,
};

export const PROJECTILE_CORE_CONTROLS: readonly {
  key: Exclude<keyof ProjectileCoreSettings, 'element' | 'shape'>;
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: 'arc', label: 'Flight arc (curve / wall bypass)', min: -180, max: 180, step: 1 },
  { key: 'coreScale', label: '3D core mesh scale', min: 0.4, max: 2.5, step: 0.05 },
  { key: 'coronaSize', label: '3D outer shell / corona', min: 0, max: 2.5, step: 0.05 },
  { key: 'spinSpeed', label: '3D core & ring spin speed', min: 0, max: 4, step: 0.1 },
  { key: 'orbitCount', label: 'Orbiting 3D shards / rings', min: 0, max: 6, step: 1 },
  { key: 'wakeRibbons', label: 'Coiling 3D wake ribbons', min: 1, max: 5, step: 1 },
  { key: 'wakeLength', label: '3D wake trail length', min: 0.1, max: 2, step: 0.05 },
];

export function defaultProjectileCoreForVariant(
  variant: string,
  color = '#ff5b16'
): ProjectileCoreSettings {
  const c = color.toLowerCase();
  const isIce = variant === 'shard' || c.includes('89e') || c.includes('6ed') || c.includes('78e');
  const isSnow = c.includes('a8e') || c.includes('fff');
  const isEldritch = c.includes('30e') || c.includes('62e') || c.includes('55e') || c.includes('b48');
  const isAcid = c.includes('9fe') || c.includes('a4d');
  const isRadiant = c.includes('ffd') || c.includes('ffe');
  const element: ProjectileElement =
    variant === 'meteor' || variant === 'comet'
      ? isAcid
        ? 'acid'
        : 'fire'
      : isIce
        ? 'ice'
        : isSnow
          ? 'snow'
          : isEldritch
            ? 'eldritch'
            : isRadiant
              ? 'radiant'
              : 'fire';
  const shape: ProjectileCoreShape =
    variant === 'shard'
      ? 'lance'
      : variant === 'meteor' || variant === 'comet'
        ? 'comet'
        : variant === 'swarm'
          ? 'prism'
          : 'sphere';
  return {
    ...PROJECTILE_CORE_DEFAULTS,
    element,
    shape,
    arc: variant === 'shard' ? -15 : -45,
  };
}

export function parseProjectileCore(
  raw: unknown,
  variant = 'comet',
  color = '#ff5b16'
): ProjectileCoreSettings {
  const base = defaultProjectileCoreForVariant(variant, color);
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const element = PROJECTILE_ELEMENTS.some((e) => e.id === r['element'])
    ? (r['element'] as ProjectileElement)
    : base.element;
  const shape = PROJECTILE_SHAPES.some((s) => s.id === r['shape'])
    ? (r['shape'] as ProjectileCoreShape)
    : base.shape;
  const clamp = (v: unknown, min: number, max: number, fb: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fb;
  return {
    element,
    shape,
    arc: clamp(r['arc'], -180, 180, base.arc),
    coreScale: clamp(r['coreScale'], 0.4, 2.5, base.coreScale),
    coronaSize: clamp(r['coronaSize'], 0, 2.5, base.coronaSize),
    spinSpeed: clamp(r['spinSpeed'], 0, 4, base.spinSpeed),
    orbitCount: Math.round(clamp(r['orbitCount'], 0, 6, base.orbitCount)),
    wakeRibbons: Math.round(clamp(r['wakeRibbons'], 1, 5, base.wakeRibbons)),
    wakeLength: clamp(r['wakeLength'], 0.1, 2, base.wakeLength),
  };
}
