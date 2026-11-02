export type EffectTrajectoryType = 'arc' | 'cone' | 'beam' | 'sigil';

export interface EffectTimelinePresetVm {
  readonly id: string;
  readonly name: string;
  readonly trajectoryType: EffectTrajectoryType;
  readonly primaryColorHex: string;
  readonly secondaryColorHex: string;
  readonly particleCount: number;
  readonly durationMs: number;
  readonly keyframes: readonly string[];
}

export interface ActionRuleVm {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly actionCost: '1 Action' | '1 Bonus Action' | '1 Reaction' | 'Free Action';
  readonly rangeFeet: number;
  readonly triggerWhen: string;
  readonly conditionIf: string;
  readonly executeThen: string;
  readonly attackBonus: number;
  readonly saveDc: number;
  readonly damageDiceCount: number;
  readonly damageDiceSides: number;
  readonly damageBonus: number;
  readonly damageFormula: string;
  readonly linkedEffectPresetId: string;
  readonly canonStatus: 'approved' | 'draft';
}

export type DndSizeCategory =
  | 'tiny'
  | 'small'
  | 'medium'
  | 'large'
  | 'huge'
  | 'gargantuan';

export const DND_SIZE_ORDER: readonly DndSizeCategory[] = [
  'tiny',
  'small',
  'medium',
  'large',
  'huge',
  'gargantuan',
];

export const DND_SIZE_METRICS: Record<
  DndSizeCategory,
  { label: string; spaceFeet: number; gridSquares: number; scaleFactor: number }
> = {
  tiny: { label: 'Tiny', spaceFeet: 2.5, gridSquares: 0.5, scaleFactor: 0.5 },
  small: { label: 'Small', spaceFeet: 5, gridSquares: 1, scaleFactor: 0.8 },
  medium: { label: 'Medium', spaceFeet: 5, gridSquares: 1, scaleFactor: 1.0 },
  large: { label: 'Large', spaceFeet: 10, gridSquares: 2, scaleFactor: 2.0 },
  huge: { label: 'Huge', spaceFeet: 15, gridSquares: 3, scaleFactor: 3.0 },
  gargantuan: { label: 'Gargantuan', spaceFeet: 20, gridSquares: 4, scaleFactor: 4.0 },
};

export function getDndSizeScale(category?: string): number {
  const cat = (category?.toLowerCase() || 'medium') as DndSizeCategory;
  return DND_SIZE_METRICS[cat]?.scaleFactor ?? 1.0;
}

export interface VttTokenVm {
  readonly key: string;
  readonly name: string;
  readonly roleLabel: string;
  readonly faction: 'party' | 'hostile' | 'ally';
  readonly initiative: number;
  readonly currentHp: number;
  readonly maxHp: number;
  readonly armorClass: number;
  readonly x: number;
  readonly z: number;
  readonly colorHex: string;
  readonly actionUsed: boolean;
  readonly bonusUsed: boolean;
  readonly reactionUsed: boolean;
  readonly movementFeet: number;
  /** Sight range in feet. Falls back to the player sight setting when absent. */
  readonly sightFeet?: number;
  /** Darkvision range in feet. Extends vision when it exceeds sight. */
  readonly darkvisionFeet?: number;
  /** True when the signed-in viewer may move or act with this token. The GM controls every token. */
  readonly canControl?: boolean;
  /** Avatar portrait image URL for 2D token faces and basic 3D miniature pucks. */
  readonly avatarUrl?: string;
  /** Real 3D GLB miniature model URL. */
  readonly glbUrl?: string;
  /** D&D 5e size category (tiny, small, medium, large, huge, gargantuan). Defaults to medium. */
  readonly sizeCategory?: DndSizeCategory;
  /** DM manual base color override. Takes precedence over faction defaults. */
  readonly colorOverride?: string;
}

/** Resolves token base color per standard rules:
 * - Players: Green (#2ee66b)
 * - NPCs: Grey (#737982) unless hostile
 * - Hostiles, Monsters, Emotes: Red (#ef4444)
 * - DM Override: Takes precedence if set
 */
export function getTokenBaseColorHex(token: VttTokenVm): string {
  if (token.colorOverride && token.colorOverride.trim().length > 0) {
    return token.colorOverride.trim();
  }
  const faction = token.faction;
  const role = (token.roleLabel || '').toLowerCase();
  if (faction === 'hostile' || role.includes('monster') || role.includes('emote')) {
    return '#ef4444';
  }
  if (faction === 'party' || role === 'pc' || role.includes('player')) {
    return '#2ee66b';
  }
  return '#737982';
}

export interface CombatResolutionLogVm {
  readonly id: string;
  readonly round: number;
  readonly attackerName: string;
  readonly targetName: string;
  readonly actionName: string;
  readonly distanceFeet: number;
  readonly hit: boolean;
  readonly isCritical: boolean;
  readonly damageDealt: number;
  readonly message: string;
}
