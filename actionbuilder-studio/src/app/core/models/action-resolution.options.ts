import { ActionEffectItem } from './action-studio.models';

export const ACTOR_OPTIONS: string[] = [
  'Caster / Attacker',
  'Target(s)',
  'Eligible creatures',
  'All creatures in area',
  'Allies in range',
  'Summoned token',
];

export const PROMPT_TRIGGER_OPTIONS: string[] = [
  'When choosing target',
  'When attacking',
  'When casting',
  'When placing token',
  'Before rolling damage',
];

export const CONTINUE_MODE_OPTIONS: string[] = [
  'After responses or timeout',
  'Immediately after selection',
  'Wait for GM confirmation',
];

export const ROLL_TYPE_OPTIONS: string[] = [
  'Attack Roll vs Target AC',
  'Saving Throw vs Spell Save DC',
  'Contested Ability Check',
  'Concentration Constitution Save',
  'No Roll (Automatic)',
];

export const IF_CONDITION_OPTIONS: string[] = [
  'On Hit',
  'On Critical Hit',
  'On Miss',
  'If Target Fails Save',
  'If Target Succeeds Save',
  'If Reaction Used',
  'Always',
];

export const EFFECT_VERB_OPTIONS: string[] = [
  'Roll weapon damage',
  'Apply damage',
  'Apply half damage',
  'No damage',
  'Reduce incoming damage',
  'Restore HP (Heal)',
  'Grant Temporary HP',
  'Grant AC bonus',
  'Apply condition',
  'Interrupt spell or attack',
];

export const DAMAGE_TYPE_OPTIONS: string[] = [
  'Weapon damage',
  'Slashing',
  'Piercing',
  'Bludgeoning',
  'Fire',
  'Cold',
  'Lightning',
  'Thunder',
  'Force',
  'Radiant',
  'Necrotic',
  'Psychic',
  'Poison',
  'Acid',
  'Healing',
  'Temporary HP',
  'AC Bonus',
  'None',
];

export const SPAWN_PLACEMENT_OPTIONS: string[] = [
  'Prompt caster to place token within spell range',
  'Appear on map next to (adjacent to) Caster',
  'Appear on map within range of Attacker / Caster',
  'Appear on map next to Target(s)',
];

export const SPAWN_RANGE_OPTIONS: string[] = [
  'Adjacent (5 ft)',
  'Within 10 ft',
  'Within 30 ft',
  'Within 60 ft',
  'Within 90 ft',
  'Within Spell Range',
];

export const TRANSFORM_SIZE_OPTIONS: string[] = [
  'Match new form size',
  'Keep current size',
  'Tiny',
  'Small',
  'Medium',
  'Large',
  'Huge',
];

export const TRANSFORM_HP_OPTIONS: string[] = [
  "Grant form's HP as Temporary HP (revert at 0 HP)",
  "Adopt form's physical stats & HP",
  'Visual token swap only',
];

export const REQUIREMENT_PRESETS: string[] = [
  'Weapon equipped',
  'Target in range',
  'Attacker can act',
  'Reaction available',
  'Bonus Action available',
  'Spell slot available',
  'Verbal / Somatic components clear',
  'Unoccupied space in range',
  'Wild Shape use available',
];

export const REACTION_RULE_PRESETS: string[] = [
  'Shield (+5 AC)',
  'Uncanny Dodge (Half damage)',
  'Counterspell',
  'Absorb Elements',
  'Parry / Deflect Attack',
  'Cutting Words',
  'Silvery Barbs',
];

export function createEffectItem(
  conditionLabel: string,
  actionVerb: string,
  targetActor: string,
  formula: string,
  damageType: string
): ActionEffectItem {
  return {
    id: `eff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    conditionLabel,
    actionVerb,
    targetActor,
    formula,
    damageType,
    targetRecipient: targetActor,
    formulaOrValue: formula,
    damageOrEffectType: damageType,
  };
}
