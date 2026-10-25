import { Injectable, computed, inject, signal } from '@angular/core';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import {
  AbilityScoreVm,
  CharacterSheetVm,
  EquipmentLoadoutItemVm,
} from '../models/character-studio.models';

@Injectable({ providedIn: 'root' })
export class CharacterStudioService {
  private readonly store = inject(LoomWeaverStoreService);

  readonly activeSystem = signal<'dnd5e' | 'pf2e' | 'vampire_v5'>('dnd5e');
  readonly selectedCharacterKey = signal<string>('char-dal');
  readonly sheets = signal<readonly CharacterSheetVm[]>(this.seedPartySheets());

  readonly activeSheet = computed<CharacterSheetVm>(() => {
    const key = this.selectedCharacterKey();
    const list = this.sheets();
    const found = list.find((s) => s.characterKey === key) ?? list[0];
    return this.recalculate(found, this.activeSystem());
  });

  selectCharacter(characterKey: string): void {
    this.selectedCharacterKey.set(characterKey);
    this.store.inspectEntity(`1:Character:${characterKey}`);
  }

  adjustAbility(code: AbilityScoreVm['code'], delta: number): void {
    const key = this.selectedCharacterKey();
    this.sheets.update((list) =>
      list.map((sheet) => {
        if (sheet.characterKey !== key) return sheet;
        const abilities = sheet.abilities.map((a) =>
          a.code === code ? { ...a, score: Math.max(6, Math.min(22, a.score + delta)) } : a,
        );
        return this.recalculate({ ...sheet, abilities }, this.activeSystem());
      }),
    );
  }

  toggleEquipment(equipmentId: string): void {
    const key = this.selectedCharacterKey();
    this.sheets.update((list) =>
      list.map((sheet) => {
        if (sheet.characterKey !== key) return sheet;
        const equipment = sheet.equipment.map((eq) =>
          eq.id === equipmentId ? { ...eq, equipped: !eq.equipped } : eq,
        );
        return this.recalculate({ ...sheet, equipment }, this.activeSystem());
      }),
    );
  }

  unlockEquipment(equipmentId: string): void {
    const key = this.selectedCharacterKey();
    this.sheets.update((list) =>
      list.map((sheet) => {
        if (sheet.characterKey !== key) return sheet;
        const equipment = sheet.equipment.map((eq) =>
          eq.id === equipmentId ? { ...eq, entitlement: 'purchased' as const, equipped: true } : eq,
        );
        return this.recalculate({ ...sheet, equipment }, this.activeSystem());
      }),
    );
  }

  executeLevelUp(featureName: string, abilityBoost: AbilityScoreVm['code']): void {
    const key = this.selectedCharacterKey();
    this.sheets.update((list) =>
      list.map((sheet) => {
        if (sheet.characterKey !== key) return sheet;
        const nextLevel = sheet.level + 1;
        const abilities = sheet.abilities.map((a) =>
          a.code === abilityBoost ? { ...a, score: Math.min(22, a.score + 1) } : a,
        );
        const features = [...sheet.features, `Lv.${nextLevel}: ${featureName}`];
        return this.recalculate(
          {
            ...sheet,
            level: nextLevel,
            nextLevelXp: sheet.nextLevelXp + 14000,
            abilities,
            features,
          },
          this.activeSystem(),
        );
      }),
    );
  }

  createCharacter(name: string, ancestry: string, archetype: string): void {
    const cleanName = name.trim() || 'Vandia Vanguard';
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const charKey = `char-${slug}`;
    const newSheet = this.recalculate(
      {
        compositeKey: `1:Character:${charKey}`,
        characterKey: charKey,
        campaignId: 1,
        name: cleanName,
        ancestryOrClan: ancestry,
        classOrArchetype: archetype,
        systemCode: this.activeSystem(),
        level: 7,
        currentXp: 34500,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 64,
        currentHp: 64,
        armorClass: 17,
        initiativeBonus: 3,
        speedFeet: 30,
        proficiencyBonus: 3,
        primaryAttackBonus: 7,
        actionEconomySummary: '',
        abilities: [
          { code: 'STR', label: 'Strength', score: 14, modifier: 2 },
          { code: 'DEX', label: 'Dexterity', score: 16, modifier: 3 },
          { code: 'CON', label: 'Constitution', score: 14, modifier: 2 },
          { code: 'INT', label: 'Intelligence', score: 14, modifier: 2 },
          { code: 'WIS', label: 'Wisdom', score: 15, modifier: 2 },
          { code: 'CHA', label: 'Charisma', score: 13, modifier: 1 },
        ],
        equipment: [
          {
            id: `eq-${slug}-1`,
            name: 'Cinth Artificer Brigandine',
            slot: 'Armor',
            summary: 'Steel-plated leather forged by the Cinth Artificers Guild.',
            bonusLabel: '+3 AC · Arcane Insulation',
            acBonus: 3,
            attackBonus: 0,
            equipped: true,
            entitlement: 'included',
          },
          {
            id: `eq-${slug}-2`,
            name: 'Moonlight Wars Relic Blade',
            slot: 'Main Hand',
            summary: 'Resonant alloy blade etched with pre-Council glyphs.',
            bonusLabel: '+2 Attack · +1d6 Force',
            acBonus: 0,
            attackBonus: 2,
            equipped: true,
            entitlement: 'free',
          },
        ],
        features: [
          `Origin: ${ancestry}`,
          `Specialization: ${archetype}`,
          'Cinth Masquerade Envoy',
        ],
      },
      this.activeSystem(),
    );

    this.sheets.update((prev) => [newSheet, ...prev]);
    this.selectedCharacterKey.set(charKey);
  }

  private recalculate(
    sheet: CharacterSheetVm,
    systemCode: 'dnd5e' | 'pf2e' | 'vampire_v5',
  ): CharacterSheetVm {
    const abilities: AbilityScoreVm[] = sheet.abilities.map((a) => ({
      ...a,
      modifier:
        systemCode === 'vampire_v5'
          ? Math.max(1, Math.min(5, Math.round(a.score / 4)))
          : Math.floor((a.score - 10) / 2),
    }));

    const dexMod = abilities.find((a) => a.code === 'DEX')?.modifier ?? 2;
    const conMod = abilities.find((a) => a.code === 'CON')?.modifier ?? 2;
    const strMod = abilities.find((a) => a.code === 'STR')?.modifier ?? 2;
    const prof =
      systemCode === 'pf2e'
        ? sheet.level + 2
        : systemCode === 'vampire_v5'
          ? Math.min(5, 1 + Math.floor(sheet.level / 3))
          : 2 + Math.floor((sheet.level - 1) / 4);

    const eqAc = sheet.equipment.filter((e) => e.equipped).reduce((s, e) => s + e.acBonus, 0);
    const eqAtk = sheet.equipment.filter((e) => e.equipped).reduce((s, e) => s + e.attackBonus, 0);

    const baseAc = systemCode === 'pf2e' ? 10 + prof : 12;
    const armorClass = baseAc + Math.min(3, dexMod) + eqAc;
    const maxHp = (7 + conMod) * sheet.level + 12;
    const primaryAttackBonus = Math.max(strMod, dexMod) + prof + eqAtk;

    const economy =
      systemCode === 'pf2e'
        ? '3 Actions · 1 Reaction · Focus Pool (2)'
        : systemCode === 'vampire_v5'
          ? '1 Turn Action · Rouse Check · Willpower Pool'
          : '1 Action · 1 Bonus Action · 1 Reaction · 30ft Move';

    return {
      ...sheet,
      systemCode,
      abilities,
      proficiencyBonus: prof,
      armorClass,
      maxHp,
      currentHp: maxHp,
      initiativeBonus: dexMod + (systemCode === 'pf2e' ? prof : 0),
      primaryAttackBonus,
      actionEconomySummary: economy,
      levelUpEligible: sheet.currentXp >= sheet.nextLevelXp,
    };
  }

  private seedPartySheets(): readonly CharacterSheetVm[] {
    const baseEquip = (prefix: string, armorName: string, weaponName: string): EquipmentLoadoutItemVm[] => [
      {
        id: `${prefix}-armor`,
        name: armorName,
        slot: 'Armor',
        summary: 'Custom-fitted campaign armor calibrated for the road to Cinth.',
        bonusLabel: '+3 AC · Ward-Stitched',
        acBonus: 3,
        attackBonus: 0,
        equipped: true,
        entitlement: 'free',
      },
      {
        id: `${prefix}-weapon`,
        name: weaponName,
        slot: 'Main Hand',
        summary: 'Signature weapon registered in the LoomWeaver combat engine.',
        bonusLabel: '+2 Attack · Signature',
        acBonus: 0,
        attackBonus: 2,
        equipped: true,
        entitlement: 'included',
      },
      {
        id: `${prefix}-aegis`,
        name: 'Cinth Artificer Aegis Buckler',
        slot: 'Off Hand',
        summary: 'Collapsible clockwork shield crafted by the Cinth Artificers Guild.',
        bonusLabel: '+2 AC · Kinetic Deflect',
        acBonus: 2,
        attackBonus: 0,
        equipped: false,
        entitlement: 'locked',
      },
    ];

    return [
      {
        compositeKey: '1:Character:char-dal',
        characterKey: 'char-dal',
        campaignId: 1,
        name: 'Dallas (Dal)',
        ancestryOrClan: 'Edhellain Royal Lineage',
        classOrArchetype: 'Horizon Ranger · Pattern Scout',
        systemCode: 'dnd5e',
        level: 7,
        currentXp: 35200,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 68,
        currentHp: 68,
        armorClass: 17,
        initiativeBonus: 4,
        speedFeet: 35,
        proficiencyBonus: 3,
        primaryAttackBonus: 9,
        actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 35ft Move',
        abilities: [
          { code: 'STR', label: 'Strength', score: 12, modifier: 1 },
          { code: 'DEX', label: 'Dexterity', score: 18, modifier: 4 },
          { code: 'CON', label: 'Constitution', score: 14, modifier: 2 },
          { code: 'INT', label: 'Intelligence', score: 14, modifier: 2 },
          { code: 'WIS', label: 'Wisdom', score: 16, modifier: 3 },
          { code: 'CHA', label: 'Charisma', score: 13, modifier: 1 },
        ],
        equipment: baseEquip('dal', 'Edhellain Wayfinder Cloak', 'Twin Recurve Longbow'),
        features: ['Pattern Danger Sense', 'Edhellain Kingship Bloodline', 'Multiattack Volley'],
      },
      {
        compositeKey: '1:Character:char-fivi',
        characterKey: 'char-fivi',
        campaignId: 1,
        name: 'Fivi',
        ancestryOrClan: 'Feywild Outcast',
        classOrArchetype: 'Fey Trickster · Slingshot Savant',
        systemCode: 'dnd5e',
        level: 7,
        currentXp: 35200,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 58,
        currentHp: 58,
        armorClass: 17,
        initiativeBonus: 4,
        speedFeet: 30,
        proficiencyBonus: 3,
        primaryAttackBonus: 9,
        actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 30ft Move',
        abilities: [
          { code: 'STR', label: 'Strength', score: 9, modifier: -1 },
          { code: 'DEX', label: 'Dexterity', score: 18, modifier: 4 },
          { code: 'CON', label: 'Constitution', score: 14, modifier: 2 },
          { code: 'INT', label: 'Intelligence', score: 13, modifier: 1 },
          { code: 'WIS', label: 'Wisdom', score: 12, modifier: 1 },
          { code: 'CHA', label: 'Charisma', score: 17, modifier: 3 },
        ],
        equipment: baseEquip('fivi', 'Dolly Pocket-Maw Harness', 'Tooth-Loaded Fey Slingshot'),
        features: ['Fey Logic Step', 'Dolly Non-Lethal Gullet', 'Dragon-Tooth Executioner'],
      },
      {
        compositeKey: '1:Character:char-kildrid',
        characterKey: 'char-kildrid',
        campaignId: 1,
        name: 'Kildrid',
        ancestryOrClan: 'Mountain Dwarf',
        classOrArchetype: 'Stone & Rune Scholar',
        systemCode: 'dnd5e',
        level: 7,
        currentXp: 35200,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 72,
        currentHp: 72,
        armorClass: 18,
        initiativeBonus: 1,
        speedFeet: 25,
        proficiencyBonus: 3,
        primaryAttackBonus: 9,
        actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 25ft Move',
        abilities: [
          { code: 'STR', label: 'Strength', score: 14, modifier: 2 },
          { code: 'DEX', label: 'Dexterity', score: 12, modifier: 1 },
          { code: 'CON', label: 'Constitution', score: 16, modifier: 3 },
          { code: 'INT', label: 'Intelligence', score: 18, modifier: 4 },
          { code: 'WIS', label: 'Wisdom', score: 15, modifier: 2 },
          { code: 'CHA', label: 'Charisma', score: 10, modifier: 0 },
        ],
        equipment: baseEquip('kil', 'Runed Basalt Half-Plate', 'Anelith Resonance Chisel'),
        features: ['Deep Stone Tremorsense', 'Pre-Moonlight Rune Deciphering', 'Runic Bastion'],
      },
      {
        compositeKey: '1:Character:char-kycius',
        characterKey: 'char-kycius',
        campaignId: 1,
        name: 'Kycius',
        ancestryOrClan: 'Catfolk Truth-Watcher',
        classOrArchetype: 'Arcane Stitcher & Drake Companion',
        systemCode: 'dnd5e',
        level: 7,
        currentXp: 35200,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 60,
        currentHp: 60,
        armorClass: 16,
        initiativeBonus: 3,
        speedFeet: 35,
        proficiencyBonus: 3,
        primaryAttackBonus: 8,
        actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 35ft Move',
        abilities: [
          { code: 'STR', label: 'Strength', score: 10, modifier: 0 },
          { code: 'DEX', label: 'Dexterity', score: 16, modifier: 3 },
          { code: 'CON', label: 'Constitution', score: 14, modifier: 2 },
          { code: 'INT', label: 'Intelligence', score: 16, modifier: 3 },
          { code: 'WIS', label: 'Wisdom', score: 17, modifier: 3 },
          { code: 'CHA', label: 'Charisma', score: 14, modifier: 2 },
        ],
        equipment: baseEquip('kyc', 'Vandia Silk-Weave Coat', 'Laksis Fire-Drake Tether & Needle'),
        features: ['Hidden Truth Sight', 'Laksis Cinder Bond', 'Extradimensional Seamcraft'],
      },
      {
        compositeKey: '1:Character:char-munk',
        characterKey: 'char-munk',
        campaignId: 1,
        name: 'Munk',
        ancestryOrClan: 'Half-Orc Vanguard',
        classOrArchetype: 'Frontline Champion & Village Shield',
        systemCode: 'dnd5e',
        level: 7,
        currentXp: 35200,
        nextLevelXp: 34000,
        levelUpEligible: true,
        maxHp: 84,
        currentHp: 84,
        armorClass: 18,
        initiativeBonus: 2,
        speedFeet: 30,
        proficiencyBonus: 3,
        primaryAttackBonus: 9,
        actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 30ft Move',
        abilities: [
          { code: 'STR', label: 'Strength', score: 18, modifier: 4 },
          { code: 'DEX', label: 'Dexterity', score: 14, modifier: 2 },
          { code: 'CON', label: 'Constitution', score: 16, modifier: 3 },
          { code: 'INT', label: 'Intelligence', score: 10, modifier: 0 },
          { code: 'WIS', label: 'Wisdom', score: 13, modifier: 1 },
          { code: 'CHA', label: 'Charisma', score: 12, modifier: 1 },
        ],
        equipment: baseEquip('munk', 'Homestead Ironbreast Plate', 'Mentor-Forged Greatsword'),
        features: ['Relentless Endurance', 'Blunt-Force Clarity', 'Intercepting Cleave'],
      },
    ];
  }
}
