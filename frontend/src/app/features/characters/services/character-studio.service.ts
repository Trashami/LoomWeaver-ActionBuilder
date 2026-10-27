import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { AdventureGuideService } from '../../../core/services/adventure-guide.service';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import {
  CREATOR_ANCESTRIES,
  CREATOR_BACKGROUNDS,
  CREATOR_CLASSES,
  buildSavingThrows,
  buildSkillsList,
} from '../models/character-creator-catalog.data';
import {
  AbilityScoreVm,
  CharacterCreatorDraftVm,
  CharacterSheetTab,
  CharacterSheetVm,
  CharacterStudioViewMode,
} from '../models/character-studio.models';
import {
  DEFAULT_CONNECTIONS,
  buildSeedPartySheets,
  wizardDefaultEquipment,
} from '../models/character-studio-seed.data';

@Injectable({ providedIn: 'root' })
export class CharacterStudioService {
  private readonly store = inject(LoomWeaverStoreService);
  private readonly adventureGuide = inject(AdventureGuideService);
  private readonly auth = inject(AuthSessionService);

  readonly activeSystem = signal<'dnd5e' | 'pf2e' | 'vampire_v5'>('dnd5e');
  readonly selectedCharacterKey = signal<string>('char-ciaran');
  readonly sheets = signal<readonly CharacterSheetVm[]>(
    buildSeedPartySheets().map((s) => this.recalculate(s, 'dnd5e')),
  );

  readonly viewMode = signal<CharacterStudioViewMode>('viewer');
  readonly activeSheetTab = signal<CharacterSheetTab>('overview');
  readonly creatorStep = signal<number>(1);
  readonly ancestrySourceFilter = signal<'All' | 'PHB' | 'SRD 5.1' | 'Homebrew'>('All');
  readonly ancestrySearchQuery = signal<string>('');

  readonly creatorDraft = signal<CharacterCreatorDraftVm>({
    name: 'Ciarán Fiachra',
    pronouns: 'He/Him',
    alignment: 'Neutral Good',
    quote: '"Knowledge preserves what time would otherwise forget."',
    portraitUrl: '/assets/5e-tools/races/PHB/Elf.webp',
    ancestryId: 'elf',
    subraceId: 'high-elf',
    classId: 'wizard',
    subclass: 'School of Evocation',
    backgroundId: 'sage',
    selectedSkills: ['Arcana', 'History', 'Investigation', 'Perception'],
    selectedFeatId: 'Warcaster',
    startingPack: 'Starting Equipment',
    abilities: { STR: 8, DEX: 16, CON: 14, INT: 17, WIS: 12, CHA: 10 },
  });

  readonly userOwnedSheets = computed<readonly CharacterSheetVm[]>(() => {
    const profile = this.auth.activeProfile();
    const all = this.sheets();
    if (!profile || profile.accountId === 'unauthenticated') return [];
    const bound = (profile.boundCharacter || '').trim().toLowerCase();
    return all.filter((s) => {
      if (s.ownerAccountId === profile.accountId) return true;
      if (s.ownerUsername && s.ownerUsername.toLowerCase() === (profile.username || '').toLowerCase()) return true;
      if (bound && bound !== 'gm' && bound !== 'none') {
        return s.name.toLowerCase().includes(bound) || s.characterKey.toLowerCase().includes(bound);
      }
      return false;
    });
  });

  readonly hasUserCharacters = computed<boolean>(() => this.userOwnedSheets().length > 0);

  readonly activeSheet = computed<CharacterSheetVm>(() => {
    const key = this.selectedCharacterKey();
    const list = this.sheets();
    const found = list.find((s) => s.characterKey === key) ?? list[0];
    return this.recalculate(found, this.activeSystem());
  });

  private lastInitializedAccountId = '';

  constructor() {
    effect(
      () => {
        const profile = this.auth.activeProfile();
        const owned = this.userOwnedSheets();
        if (profile.accountId !== this.lastInitializedAccountId) {
          this.lastInitializedAccountId = profile.accountId;
          if (owned.length > 0) {
            this.selectedCharacterKey.set(owned[0].characterKey);
            this.viewMode.set('viewer');
          } else {
            this.selectedCharacterKey.set('char-dal');
            this.viewMode.set('roster');
          }
        }
      },
      { allowSignalWrites: true },
    );
  }

  syncDefaultViewForSignedInUser(requestedMode?: string | null, focusKey?: string | null): void {
    if (focusKey) {
      const exists = this.sheets().find((s) => s.characterKey === focusKey);
      if (exists) this.selectedCharacterKey.set(exists.characterKey);
    }
    if (requestedMode === 'creator' || requestedMode === 'create') {
      this.openCreatorWizard();
      return;
    }
    if (requestedMode === 'roster' || requestedMode === 'studio') {
      this.viewMode.set('roster');
      return;
    }
    if (requestedMode === 'viewer' || requestedMode === 'sheet') {
      this.viewMode.set('viewer');
      return;
    }
    const owned = this.userOwnedSheets();
    if (owned.length > 0) {
      if (!focusKey) this.selectedCharacterKey.set(owned[0].characterKey);
      this.viewMode.set('viewer');
    } else {
      if (!focusKey) this.selectedCharacterKey.set('char-dal');
      this.viewMode.set('roster');
    }
  }

  selectCharacter(characterKey: string, openViewer = false): void {
    this.selectedCharacterKey.set(characterKey);
    this.store.inspectEntity(`1:Character:${characterKey}`);
    if (openViewer) this.viewMode.set('viewer');
  }

  openCreatorWizard(fromExisting?: CharacterSheetVm): void {
    if (fromExisting) {
      const scoreOf = (code: AbilityScoreVm['code']) =>
        fromExisting.abilities.find((a) => a.code === code)?.score ?? 12;
      this.creatorDraft.set({
        name: fromExisting.name,
        pronouns: fromExisting.pronouns,
        alignment: fromExisting.alignment,
        quote: fromExisting.quote,
        portraitUrl: fromExisting.portraitUrl,
        ancestryId: CREATOR_ANCESTRIES.find((a) => fromExisting.ancestryOrClan.toLowerCase().includes(a.name.toLowerCase()))?.id ?? 'elf',
        subraceId: CREATOR_ANCESTRIES.flatMap((a) => a.subraces).find((sr) => fromExisting.subrace.toLowerCase().includes(sr.name.toLowerCase()))?.id ?? 'high-elf',
        classId: CREATOR_CLASSES.find((c) => fromExisting.classOrArchetype.toLowerCase().includes(c.name.toLowerCase()))?.id ?? 'wizard',
        subclass: fromExisting.subclass,
        backgroundId: CREATOR_BACKGROUNDS.find((b) => fromExisting.backgroundName.toLowerCase().includes(b.name.toLowerCase()))?.id ?? 'sage',
        selectedSkills: fromExisting.skills.filter((s) => s.proficient).map((s) => s.label),
        selectedFeatId: fromExisting.featureCards.find((f) => f.category === 'feat')?.title ?? 'Warcaster',
        startingPack: 'Starting Equipment',
        abilities: {
          STR: scoreOf('STR'),
          DEX: scoreOf('DEX'),
          CON: scoreOf('CON'),
          INT: scoreOf('INT'),
          WIS: scoreOf('WIS'),
          CHA: scoreOf('CHA'),
        },
      });
    } else {
      this.creatorStep.set(1);
    }
    this.viewMode.set('creator');
  }

  openSheetViewer(characterKey?: string): void {
    if (characterKey) this.selectedCharacterKey.set(characterKey);
    this.viewMode.set('viewer');
  }

  openStudioRoster(): void {
    this.viewMode.set('roster');
  }

  updateCreatorDraft(patch: Partial<CharacterCreatorDraftVm>): void {
    this.creatorDraft.update((cur) => ({ ...cur, ...patch }));
  }

  updateCreatorAbility(code: AbilityScoreVm['code'], delta: number): void {
    this.creatorDraft.update((cur) => ({
      ...cur,
      abilities: { ...cur.abilities, [code]: Math.max(6, Math.min(20, (cur.abilities[code] ?? 10) + delta)) },
    }));
  }

  toggleCreatorSkill(skillLabel: string): void {
    this.creatorDraft.update((cur) => {
      const exists = cur.selectedSkills.includes(skillLabel);
      const next = exists ? cur.selectedSkills.filter((s) => s !== skillLabel) : [...cur.selectedSkills, skillLabel];
      return { ...cur, selectedSkills: next };
    });
  }

  finalizeWizardCharacter(): CharacterSheetVm {
    const draft = this.creatorDraft();
    const ancestry = CREATOR_ANCESTRIES.find((a) => a.id === draft.ancestryId) ?? CREATOR_ANCESTRIES[1];
    const subrace = ancestry.subraces.find((sr) => sr.id === draft.subraceId) ?? ancestry.subraces[0];
    const cls = CREATOR_CLASSES.find((c) => c.id === draft.classId) ?? CREATOR_CLASSES[0];
    const bg = CREATOR_BACKGROUNDS.find((b) => b.id === draft.backgroundId) ?? CREATOR_BACKGROUNDS[0];

    const cleanName = draft.name.trim() || 'Ciarán Fiachra';
    const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const charKey = `char-${slug}`;
    const profile = this.auth.activeProfile();

    const abilities: AbilityScoreVm[] = [
      { code: 'STR', label: 'Strength', score: draft.abilities.STR, modifier: 0 },
      { code: 'DEX', label: 'Dexterity', score: draft.abilities.DEX, modifier: 0 },
      { code: 'CON', label: 'Constitution', score: draft.abilities.CON, modifier: 0 },
      { code: 'INT', label: 'Intelligence', score: draft.abilities.INT, modifier: 0 },
      { code: 'WIS', label: 'Wisdom', score: draft.abilities.WIS, modifier: 0 },
      { code: 'CHA', label: 'Charisma', score: draft.abilities.CHA, modifier: 0 },
    ];

    const baseSheet: CharacterSheetVm = {
      compositeKey: `1:Character:${charKey}`,
      characterKey: charKey,
      ownerAccountId: profile.accountId,
      ownerUsername: profile.username,
      campaignId: 1,
      name: cleanName,
      roleBadge: 'Player Character',
      portraitUrl: draft.portraitUrl || subrace?.portraitUrl || ancestry.portraitUrl,
      pronouns: draft.pronouns || 'He/Him',
      alignment: draft.alignment || 'Neutral Good',
      quote: draft.quote || bg.defaultQuote,
      ancestryOrClan: ancestry.name,
      subrace: subrace?.name ?? ancestry.name,
      classOrArchetype: cls.name,
      subclass: draft.subclass || cls.subclassDefault,
      backgroundName: bg.name,
      backgroundSummary: bg.summary,
      tags: ['Party Member', subrace?.name ?? ancestry.name, bg.name, 'Arcane Scholar', 'Cinth', 'Member of the Circle'],
      systemCode: this.activeSystem(),
      level: 5,
      currentXp: 14250,
      nextLevelXp: 15000,
      levelUpEligible: true,
      maxHp: 32,
      currentHp: 32,
      armorClass: 15,
      initiativeBonus: 3,
      speedFeet: 30,
      proficiencyBonus: 3,
      primaryAttackBonus: 7,
      actionEconomySummary: '1 Action · 1 Bonus Action · 1 Reaction · 30ft Move',
      abilities,
      savingThrows: buildSavingThrows(abilities, 3, cls.savingThrows),
      skills: buildSkillsList(abilities, 3, draft.selectedSkills),
      spellGroups: cls.startingSpells,
      equipment: wizardDefaultEquipment(slug),
      featureCards: [
        ...cls.features,
        ...ancestry.traits.map((t) => ({
          id: `anc-${slug}-${t.id}`,
          title: `${ancestry.name}: ${t.title}`,
          category: 'ancestry' as const,
          summary: t.description,
          icon: t.icon,
          tone: 'emerald' as const,
        })),
        {
          id: `feat-${slug}-custom`,
          title: draft.selectedFeatId || 'Warcaster',
          category: 'feat',
          summary: 'Selected during character creation.',
          icon: 'swords',
          tone: 'gold',
        },
      ],
      features: [...cls.features.map((f) => f.title), ...ancestry.traits.map((t) => t.title), draft.selectedFeatId || 'Warcaster'],
      personality: bg.personality,
      connections: DEFAULT_CONNECTIONS,
      notes: [
        `Created in Character Studio for ${this.store.activeCampaign().name}.`,
        `Starting Equipment Pack: ${draft.startingPack} · Proficient Skills: ${draft.selectedSkills.join(', ')}.`,
      ],
      historyEvents: [
        `Created as a ${subrace?.name ?? ancestry.name} ${cls.name} (${draft.subclass || cls.subclassDefault}) with the ${bg.name} background.`,
        `Joined the active party roster in ${this.store.activeCampaign().currentLocationName}.`,
      ],
    };

    const calculated = this.recalculate(baseSheet, this.activeSystem());
    this.sheets.update((prev) => [calculated, ...prev.filter((s) => s.characterKey !== charKey)]);
    this.selectedCharacterKey.set(charKey);
    this.viewMode.set('viewer');
    this.activeSheetTab.set('overview');
    this.registerInCampaignStore(calculated);
    return calculated;
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
        const equipment = sheet.equipment.map((eq) => (eq.id === equipmentId ? { ...eq, equipped: !eq.equipped } : eq));
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

  setActiveCharacterPortrait(portraitUrl: string): void {
    if (!portraitUrl) return;
    const key = this.selectedCharacterKey();
    this.sheets.update((list) => list.map((sheet) => (sheet.characterKey === key ? { ...sheet, portraitUrl } : sheet)));
  }

  cyclePortrait(): void {
    const portraits = [
      '/assets/5e-tools/races/PHB/Elf.webp',
      '/assets/5e-tools/races/PHB/Human.webp',
      '/assets/5e-tools/races/PHB/Dwarf.webp',
      '/assets/5e-tools/races/PHB/Halfling.webp',
      '/assets/5e-tools/races/PHB/Dragonborn.webp',
      '/assets/5e-tools/races/PHB/Tiefling.webp',
      '/assets/previews-png/obj-654ef947728b71fc.png',
    ];
    const key = this.selectedCharacterKey();
    this.sheets.update((list) =>
      list.map((sheet) => {
        if (sheet.characterKey !== key) return sheet;
        const idx = portraits.indexOf(sheet.portraitUrl);
        return { ...sheet, portraitUrl: portraits[(idx + 1) % portraits.length] };
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
        const featureCards = [
          ...sheet.featureCards,
          { id: `feat-lv-${nextLevel}`, title: `Lv.${nextLevel} · ${featureName} (+1 ${abilityBoost})`, category: 'feat' as const, summary: `Unlocked at Level ${nextLevel} along with +1 ${abilityBoost}.`, icon: 'zap', tone: 'gold' as const },
        ];
        const historyEvents = [`Advanced to Level ${nextLevel}: selected ${featureName} and +1 ${abilityBoost}.`, ...sheet.historyEvents];
        return this.recalculate(
          { ...sheet, level: nextLevel, nextLevelXp: sheet.nextLevelXp + 14000, abilities, features, featureCards, historyEvents },
          this.activeSystem(),
        );
      }),
    );
  }

  addCharacterNote(text: string): void {
    const clean = text.trim();
    if (!clean) return;
    const key = this.selectedCharacterKey();
    this.sheets.update((list) => list.map((s) => (s.characterKey === key ? { ...s, notes: [clean, ...s.notes] } : s)));
  }

  createCharacter(name: string, ancestry: string, archetype: string): void {
    this.updateCreatorDraft({ name: name.trim() || 'Vandia Vanguard', subclass: archetype });
    const created = this.finalizeWizardCharacter();
    this.sheets.update((list) =>
      list.map((s) =>
        s.characterKey === created.characterKey
          ? this.recalculate({ ...s, ancestryOrClan: ancestry, classOrArchetype: archetype, level: 7 }, this.activeSystem())
          : s,
      ),
    );
  }

  private registerInCampaignStore(sheet: CharacterSheetVm): void {
    this.store.registerEntity({
      compositeKey: sheet.compositeKey,
      entityKey: sheet.characterKey,
      campaignId: sheet.campaignId,
      entityType: 'Character',
      name: sheet.name,
      subtitle: `${sheet.ancestryOrClan} · ${sheet.classOrArchetype}`,
      visibility: 'players',
      canonStatus: 'approved',
      summary: `Level ${sheet.level} ${sheet.ancestryOrClan} ${sheet.classOrArchetype} (HP ${sheet.maxHp}, AC ${sheet.armorClass}).`,
      routeLink: `/characters?focus=${sheet.characterKey}`,
    });
    this.adventureGuide.populateCharacterOrNpc({
      compositeKey: sheet.compositeKey,
      name: sheet.name,
      role: `${sheet.ancestryOrClan} · ${sheet.classOrArchetype}`,
      dispositionLabel: 'Party Hero',
      motive: `Active party member (Lv.${sheet.level}, HP ${sheet.maxHp}, AC ${sheet.armorClass}).`,
      artworkUrl: sheet.portraitUrl,
      sessionId: 'session-15',
      locationNodeId: 'node-room-c1-nave',
      routeLink: `/characters?focus=${sheet.characterKey}`,
    });
  }

  private recalculate(sheet: CharacterSheetVm, systemCode: 'dnd5e' | 'pf2e' | 'vampire_v5'): CharacterSheetVm {
    const abilities: AbilityScoreVm[] = sheet.abilities.map((a) => ({
      ...a,
      modifier: systemCode === 'vampire_v5' ? Math.max(1, Math.min(5, Math.round(a.score / 4))) : Math.floor((a.score - 10) / 2),
    }));
    const dexMod = abilities.find((a) => a.code === 'DEX')?.modifier ?? 2;
    const conMod = abilities.find((a) => a.code === 'CON')?.modifier ?? 2;
    const strMod = abilities.find((a) => a.code === 'STR')?.modifier ?? 2;
    const intMod = abilities.find((a) => a.code === 'INT')?.modifier ?? 2;
    const prof = systemCode === 'pf2e' ? sheet.level + 2 : systemCode === 'vampire_v5' ? Math.min(5, 1 + Math.floor(sheet.level / 3)) : 2 + Math.floor((sheet.level - 1) / 4);

    const eqAc = sheet.equipment.filter((e) => e.equipped).reduce((s, e) => s + e.acBonus, 0);
    const eqAtk = sheet.equipment.filter((e) => e.equipped).reduce((s, e) => s + e.attackBonus, 0);
    const isWizard = sheet.classOrArchetype.toLowerCase().includes('wizard');
    const baseAc = systemCode === 'pf2e' ? 10 + prof : isWizard ? 10 : 12;
    const armorClass = baseAc + Math.min(3, dexMod) + eqAc;
    const maxHp = isWizard ? (4 + conMod) * sheet.level + 2 : (7 + conMod) * sheet.level + 12;
    const primaryStatMod = isWizard ? intMod : Math.max(strMod, dexMod);
    const primaryAttackBonus = primaryStatMod + prof + eqAtk;
    const economy =
      systemCode === 'pf2e'
        ? '3 Actions · 1 Reaction · Focus Pool (2)'
        : systemCode === 'vampire_v5'
          ? '1 Turn Action · Rouse Check · Willpower Pool'
          : '1 Action · 1 Bonus Action · 1 Reaction · 30ft Move';

    const proficientSaves = sheet.savingThrows.filter((s) => s.proficient).map((s) => s.code);
    const savingThrows = buildSavingThrows(abilities, prof, proficientSaves.length ? proficientSaves : ['INT', 'WIS']);
    const proficientSkills = sheet.skills.filter((sk) => sk.proficient).map((sk) => sk.label);
    const skills = buildSkillsList(abilities, prof, proficientSkills);

    return {
      ...sheet,
      systemCode,
      abilities,
      savingThrows,
      skills,
      proficiencyBonus: prof,
      armorClass,
      maxHp,
      currentHp: maxHp,
      initiativeBonus: dexMod + (systemCode === 'pf2e' ? prof : 0),
      primaryAttackBonus,
      actionEconomySummary: economy,
      levelUpEligible: sheet.currentXp >= sheet.nextLevelXp || sheet.levelUpEligible,
    };
  }
}
