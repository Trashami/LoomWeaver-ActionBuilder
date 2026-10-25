export interface AbilityScoreVm {
  readonly code: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  readonly label: string;
  readonly score: number;
  readonly modifier: number;
}

export interface EquipmentLoadoutItemVm {
  readonly id: string;
  readonly name: string;
  readonly slot: 'Armor' | 'Main Hand' | 'Off Hand' | 'Focus' | 'Companion';
  readonly summary: string;
  readonly bonusLabel: string;
  readonly acBonus: number;
  readonly attackBonus: number;
  readonly equipped: boolean;
  readonly entitlement: 'free' | 'included' | 'purchased' | 'locked';
}

export interface CharacterSheetVm {
  readonly compositeKey: string;
  readonly characterKey: string;
  readonly campaignId: number;
  readonly name: string;
  readonly ancestryOrClan: string;
  readonly classOrArchetype: string;
  readonly systemCode: 'dnd5e' | 'pf2e' | 'vampire_v5';
  readonly level: number;
  readonly currentXp: number;
  readonly nextLevelXp: number;
  readonly levelUpEligible: boolean;
  readonly maxHp: number;
  readonly currentHp: number;
  readonly armorClass: number;
  readonly initiativeBonus: number;
  readonly speedFeet: number;
  readonly proficiencyBonus: number;
  readonly primaryAttackBonus: number;
  readonly actionEconomySummary: string;
  readonly abilities: readonly AbilityScoreVm[];
  readonly equipment: readonly EquipmentLoadoutItemVm[];
  readonly features: readonly string[];
}
