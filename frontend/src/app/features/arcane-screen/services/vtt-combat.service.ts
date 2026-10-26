import { Injectable, computed, signal } from '@angular/core';
import { CreatureCardVm } from '../../../shared/ui/creature-card/creature-card.component';
import { EncounterCardVm } from '../../../shared/ui/encounter-card/encounter-card.component';
import { NpcCardVm } from '../../../shared/ui/npc-card/npc-card.component';
import {
  ActionRuleVm,
  CombatResolutionLogVm,
  EffectTimelinePresetVm,
  VttTokenVm,
} from '../../effects/engine/effect-timeline.contract';
import {
  SEED_ACTION_RULES,
  SEED_CREATURES,
  SEED_EFFECT_PRESETS,
  SEED_ENCOUNTERS,
  SEED_NPCS,
  SEED_VTT_TOKENS,
} from './vtt-combat.seed';

@Injectable({ providedIn: 'root' })
export class VttCombatService {
  readonly activeRound = signal<number>(1);
  readonly activeTurnIndex = signal<number>(0);
  readonly activeEncounterId = signal<string>('enc-cinth-masquerade');
  readonly selectedAttackerKey = signal<string>('1:Character:char-fivi');
  readonly selectedTargetKey = signal<string>('1:Encounter:vamp-1');
  readonly xpAwardBanner = signal<string | null>(null);

  readonly encounters = signal<readonly EncounterCardVm[]>(SEED_ENCOUNTERS);
  readonly creatures = signal<readonly CreatureCardVm[]>(SEED_CREATURES);
  readonly npcs = signal<readonly NpcCardVm[]>(SEED_NPCS);
  readonly effectPresets = signal<readonly EffectTimelinePresetVm[]>(SEED_EFFECT_PRESETS);
  readonly actionRules = signal<readonly ActionRuleVm[]>(SEED_ACTION_RULES);
  readonly tokens = signal<readonly VttTokenVm[]>(SEED_VTT_TOKENS);

  readonly combatLogs = signal<readonly CombatResolutionLogVm[]>([
    {
      id: 'log-init',
      round: 1,
      attackerName: 'Arcane Screen Engine',
      targetName: 'Cinth Ballroom',
      actionName: 'Initiative Rolled',
      distanceFeet: 0,
      hit: true,
      isCritical: false,
      damageDealt: 0,
      message: 'Round 1 started. Select an Attacker, Target, and ActionBuilder ability to fire.',
    },
  ]);

  readonly selectedAttacker = computed(
    () => this.tokens().find((t) => t.key === this.selectedAttackerKey()) ?? this.tokens()[0],
  );

  readonly selectedTarget = computed(
    () => this.tokens().find((t) => t.key === this.selectedTargetKey()) ?? this.tokens()[2],
  );

  readonly targetDistanceFeet = computed(() => {
    const a = this.selectedAttacker();
    const b = this.selectedTarget();
    return Math.round(Math.hypot(a.x - b.x, a.z - b.z) * 2.5 * 10) / 10;
  });

  advanceTurn(): void {
    const total = this.tokens().length;
    const next = (this.activeTurnIndex() + 1) % total;
    if (next === 0) {
      this.activeRound.update((r) => r + 1);
      this.tokens.update((list) =>
        list.map((t) => ({ ...t, actionUsed: false, bonusUsed: false, reactionUsed: false })),
      );
    }
    this.activeTurnIndex.set(next);
    this.selectedAttackerKey.set(this.tokens()[next].key);
  }

  toggleEconomySlot(key: string, slot: 'actionUsed' | 'bonusUsed' | 'reactionUsed'): void {
    this.tokens.update((list) =>
      list.map((t) => (t.key === key ? { ...t, [slot]: !t[slot] } : t)),
    );
  }

  executeActionOnTarget(rule: ActionRuleVm): {
    preset: EffectTimelinePresetVm;
    startPos: { x: number; z: number };
    endPos: { x: number; z: number };
  } {
    const attacker = this.selectedAttacker();
    const target = this.selectedTarget();
    const dist = this.targetDistanceFeet();
    const inRange = dist <= rule.rangeFeet;

    const d20 = Math.floor(Math.random() * 20) + 1;
    const isCrit = d20 == 20;
    const totalRoll = d20 + rule.attackBonus;
    const hit = inRange && (isCrit || (d20 !== 1 && totalRoll >= target.armorClass));

    let dmg = 0;
    if (hit) {
      const dice = isCrit ? rule.damageDiceCount * 2 : rule.damageDiceCount;
      for (let i = 0; i < dice; i++) {
        dmg += Math.floor(Math.random() * rule.damageDiceSides) + 1;
      }
      dmg += rule.damageBonus;
    }

    const nextHp = Math.max(0, target.currentHp - dmg);
    const slotKey =
      rule.actionCost === '1 Bonus Action'
        ? 'bonusUsed'
        : rule.actionCost === '1 Reaction'
          ? 'reactionUsed'
          : 'actionUsed';

    this.tokens.update((list) =>
      list.map((t) => {
        if (t.key === attacker.key) return { ...t, [slotKey]: true };
        if (t.key === target.key) return { ...t, currentHp: nextHp };
        return t;
      }),
    );

    const msg = !inRange
      ? `${attacker.name} tried ${rule.name}, but ${target.name} is at ${dist}ft (max ${rule.rangeFeet}ft).`
      : hit
        ? `${attacker.name} -> ${target.name} [${rule.name}]: Rolled ${d20}+${rule.attackBonus}=${totalRoll} vs AC ${target.armorClass} -> HIT for ${dmg} dmg! (${nextHp}/${target.maxHp} HP)`
        : `${attacker.name} -> ${target.name} [${rule.name}]: Rolled ${d20}+${rule.attackBonus}=${totalRoll} vs AC ${target.armorClass} -> MISS.`;

    this.combatLogs.update((logs) => [
      {
        id: `log-${Date.now()}`,
        round: this.activeRound(),
        attackerName: attacker.name,
        targetName: target.name,
        actionName: rule.name,
        distanceFeet: dist,
        hit,
        isCritical: isCrit,
        damageDealt: dmg,
        message: msg,
      },
      ...logs.slice(0, 7),
    ]);

    const preset =
      this.effectPresets().find((p) => p.id === rule.linkedEffectPresetId) ??
      this.effectPresets()[0];

    return {
      preset,
      startPos: { x: attacker.x, z: attacker.z },
      endPos: { x: target.x, z: target.z },
    };
  }

  spawnCreatureIntoVtt(creature: CreatureCardVm): void {
    const id = `1:Encounter:spawn-${Date.now().toString().slice(-4)}`;
    const rx = Math.round((Math.random() * 10 + 2) * 10) / 10;
    const rz = Math.round((Math.random() * 10 - 5) * 10) / 10;
    this.tokens.update((list) => [
      ...list,
      {
        key: id,
        name: creature.name,
        roleLabel: `Hostile · CR ${creature.challengeRating}`,
        faction: 'hostile',
        initiative: Math.floor(Math.random() * 12) + 10,
        currentHp: creature.maxHp,
        maxHp: creature.maxHp,
        armorClass: creature.armorClass,
        x: rx,
        z: rz,
        colorHex: '#ef5d72',
        actionUsed: false,
        bonusUsed: false,
        reactionUsed: false,
        movementFeet: creature.speedFeet,
      },
    ]);
    this.selectedTargetKey.set(id);
  }

  concludeEncounterAndAwardXp(encounterId: string): void {
    const enc = this.encounters().find((e) => e.id === encounterId) ?? this.encounters()[0];
    const perHero = Math.floor(enc.totalXp / 5);
    this.encounters.update((list) =>
      list.map((e) => (e.id === enc.id ? { ...e, completed: true } : e)),
    );
    this.xpAwardBanner.set(
      `Encounter Concluded: Awarded ${enc.totalXp.toLocaleString()} XP (${perHero.toLocaleString()} XP each to Dal, Fivi, Kildrid, Kycius & Munk). Level-Up Ready in Character Studio!`,
    );
  }

  addCustomActionRule(
    name: string,
    category: string,
    cost: ActionRuleVm['actionCost'],
    rangeFeet: number,
    whenText: string,
    ifText: string,
    thenText: string,
    formula: string,
    effectId: string,
    isGm: boolean,
  ): void {
    const cleanName = name.trim() || 'Custom Cinth Artificer Strike';
    const created: ActionRuleVm = {
      id: `act-${Date.now()}`,
      name: cleanName,
      category,
      actionCost: cost,
      rangeFeet,
      triggerWhen: whenText,
      conditionIf: ifText,
      executeThen: thenText,
      attackBonus: 9,
      saveDc: 16,
      damageDiceCount: 3,
      damageDiceSides: 8,
      damageBonus: 5,
      damageFormula: formula,
      linkedEffectPresetId: effectId,
      canonStatus: isGm ? 'approved' : 'draft',
    };
    this.actionRules.update((prev) => [created, ...prev]);
  }
}
