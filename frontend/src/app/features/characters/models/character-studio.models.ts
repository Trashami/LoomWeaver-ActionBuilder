export type CharacterStudioViewMode = 'roster' | 'creator' | 'viewer';

export type CharacterSheetTab =
  | 'overview'
  | 'abilities'
  | 'skills'
  | 'feats'
  | 'spells'
  | 'equipment'
  | 'inventory'
  | 'background'
  | 'notes'
  | 'connections'
  | 'history';

export interface AbilityScoreVm {
  readonly code: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  readonly label: string;
  readonly score: number;
  readonly modifier: number;
}

export interface SavingThrowVm {
  readonly code: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
  readonly label: string;
  readonly bonus: number;
  readonly proficient: boolean;
}

export interface CharacterSkillVm {
  readonly id: string;
  readonly label: string;
  readonly abilityCode: AbilityScoreVm['code'];
  readonly bonus: number;
  readonly proficient: boolean;
  readonly expertise?: boolean;
}

export interface CharacterSpellVm {
  readonly id: string;
  readonly name: string;
  readonly school: string;
  readonly icon: string;
  readonly tone: 'emerald' | 'gold' | 'crimson' | 'neutral';
  readonly actionCost: string;
  readonly summary: string;
}

export interface CharacterSpellGroupVm {
  readonly groupId: string;
  readonly label: string;
  readonly slotsRemaining: number;
  readonly slotsMax: number;
  readonly isCantrip?: boolean;
  readonly spells: readonly CharacterSpellVm[];
}

export interface EquipmentLoadoutItemVm {
  readonly id: string;
  readonly name: string;
  readonly slot: 'Armor' | 'Main Hand' | 'Off Hand' | 'Focus' | 'Companion' | 'Gear';
  readonly summary: string;
  readonly bonusLabel: string;
  readonly acBonus: number;
  readonly attackBonus: number;
  readonly equipped: boolean;
  readonly entitlement: 'free' | 'included' | 'purchased' | 'locked';
  readonly icon?: string;
}

export interface CharacterFeatureCardVm {
  readonly id: string;
  readonly title: string;
  readonly category: 'class' | 'feat' | 'ancestry';
  readonly summary: string;
  readonly icon: string;
  readonly tone: 'emerald' | 'gold' | 'crimson' | 'neutral';
}

export interface CharacterPersonalityVm {
  readonly personality: string;
  readonly ideals: string;
  readonly bonds: string;
  readonly flaws: string;
}

export interface CharacterConnectionChipVm {
  readonly id: string;
  readonly label: string;
  readonly routeLink: string;
  readonly compositeKey: string;
}

export interface CharacterConnectionsVm {
  readonly locations: readonly CharacterConnectionChipVm[];
  readonly npcs: readonly CharacterConnectionChipVm[];
  readonly factions: readonly CharacterConnectionChipVm[];
}

export interface CharacterSheetVm {
  readonly compositeKey: string;
  readonly characterKey: string;
  readonly ownerAccountId: string;
  readonly ownerUsername?: string;
  readonly campaignId: number;
  readonly name: string;
  readonly roleBadge: string;
  readonly portraitUrl: string;
  readonly pronouns: string;
  readonly alignment: string;
  readonly quote: string;
  readonly ancestryOrClan: string;
  readonly subrace: string;
  readonly classOrArchetype: string;
  readonly subclass: string;
  readonly backgroundName: string;
  readonly backgroundSummary: string;
  readonly tags: readonly string[];
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
  readonly savingThrows: readonly SavingThrowVm[];
  readonly skills: readonly CharacterSkillVm[];
  readonly spellGroups: readonly CharacterSpellGroupVm[];
  readonly equipment: readonly EquipmentLoadoutItemVm[];
  readonly featureCards: readonly CharacterFeatureCardVm[];
  readonly features: readonly string[];
  readonly personality: CharacterPersonalityVm;
  readonly connections: CharacterConnectionsVm;
  readonly notes: readonly string[];
  readonly historyEvents: readonly string[];
}

export interface CreatorTraitVm {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export interface CreatorSubraceOptionVm {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly portraitUrl: string;
  readonly source: 'PHB' | 'SRD 5.1' | 'Homebrew';
}

export interface CreatorAncestryOptionVm {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly source: 'PHB' | 'SRD 5.1' | 'Homebrew';
  readonly portraitUrl: string;
  readonly galleryPortraits: readonly string[];
  readonly traits: readonly CreatorTraitVm[];
  readonly subraces: readonly CreatorSubraceOptionVm[];
}

export interface CreatorClassOptionVm {
  readonly id: string;
  readonly name: string;
  readonly subclassDefault: string;
  readonly tagline: string;
  readonly hitDie: number;
  readonly primaryAbility: AbilityScoreVm['code'];
  readonly savingThrows: readonly [AbilityScoreVm['code'], AbilityScoreVm['code']];
  readonly features: readonly CharacterFeatureCardVm[];
  readonly startingSpells: readonly CharacterSpellGroupVm[];
}

export interface CreatorBackgroundOptionVm {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly summary: string;
  readonly skillProficiencies: readonly string[];
  readonly defaultQuote: string;
  readonly personality: CharacterPersonalityVm;
}

export interface CharacterCreatorDraftVm {
  readonly name: string;
  readonly pronouns: string;
  readonly alignment: string;
  readonly quote: string;
  readonly portraitUrl: string;
  readonly ancestryId: string;
  readonly subraceId: string;
  readonly classId: string;
  readonly subclass: string;
  readonly backgroundId: string;
  readonly selectedSkills: readonly string[];
  readonly selectedFeatId: string;
  readonly startingPack: string;
  readonly abilities: Readonly<Record<AbilityScoreVm['code'], number>>;
}
