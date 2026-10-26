import { EffectDefinition, EffectLayer, createEffect, createLayer, defaultMotion, newId } from './effect-definition';
import { AmbientPresetEntry, CASTER_AMBIENT_SPECS } from './ambient-caster-presets';
import { TARGET_AMBIENT_SPECS } from './ambient-target-presets';

export type AmbientRole = 'caster' | 'target';
export interface AmbientPreset {
  role: AmbientRole;
  effect: EffectDefinition;
}

/** Curated compositions, using editable layers rather than opaque baked animations. */
export function makeAmbientPresets(): AmbientPreset[] {
  const presets: AmbientPreset[] = [];

  const buildEntry = (role: AmbientRole, entry: AmbientPresetEntry) => {
    const effect = createEffect(entry.name);
    effect.spellName = entry.spellName;
    effect.description = entry.description;
    effect.layers = entry.specs.map((spec, i): EffectLayer => {
      const layer = createLayer(spec.kind);
      const { kind, variant, color, motion, ...patch } = spec;
      return {
        ...layer,
        kind,
        variant,
        color,
        secondaryColor: role === 'caster' ? '#fff5d6' : '#e4dcff',
        size: 55,
        spread: 35,
        count: 32,
        anchor: role,
        delay: role === 'caster' ? 0 : 850,
        duration: role === 'caster' ? 2400 : 3200,
        opacity: 0.8,
        blendMode: 'screen',
        ...patch,
        motion: { ...defaultMotion(kind, variant), seed: 71 + presets.length * 17 + i * 29, ...motion },
        opacityKeyframes: (
          role === 'caster'
            ? [{ time: 0, value: 0 }, { time: 0.32, value: 0.8 }, { time: 0.72, value: 1 }, { time: 1, value: 0 }]
            : [{ time: 0, value: 0 }, { time: 0.08, value: 1 }, { time: 0.45, value: 0.75 }, { time: 1, value: 0 }]
        ).map((key) => ({ ...key, id: newId(), easing: 'ease-in-out' })),
      };
    });
    presets.push({ role, effect });
  };

  for (const c of CASTER_AMBIENT_SPECS) buildEntry('caster', c);
  for (const t of TARGET_AMBIENT_SPECS) buildEntry('target', t);
  return presets;
}
