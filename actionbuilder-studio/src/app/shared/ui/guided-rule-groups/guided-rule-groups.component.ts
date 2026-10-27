import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  CampaignActionRule,
  ClauseCombiner,
  RuleLogicClause,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type GuidedGroupKey = 'trigger' | 'requirements' | 'effects';

@Component({
  selector: 'lw-guided-rule-groups',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent, LwButtonComponent, LwBadgeComponent],
  templateUrl: './guided-rule-groups.component.html',
  styleUrl: './guided-rule-groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwGuidedRuleGroupsComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly ruleChange = output<CampaignActionRule>();
  readonly openAdvancedRequested = output<void>();

  readonly expandedGroup = signal<GuidedGroupKey | null>('trigger');
  readonly activePicker = signal<GuidedGroupKey | null>(null);
  readonly customInputText = signal<string>('');

  readonly triggerPresets: string[] = [
    'An attack hits you',
    'Magic Missile targets you',
    'Hostile Creature Casts Spell Within 60 ft',
    'Hostile Leaves Reach Without Disengage',
    'Creature Takes Damage While Concentrating',
    'Ranged Or Finesse Weapon Attack Hits',
    'Unsupported: Custom tabletop trigger (tests Not evaluated)',
  ];

  readonly requirementPresets: string[] = [
    'Reaction available',
    'Appropriate 1st-level spell slot available',
    'Appropriate 3rd-level spell slot available',
    'Applicable casting requirements (Verbal, Somatic)',
    'Distance(Attacker, Target) <= 60 ft',
    'Distance(Attacker, Target) <= 5 ft',
    'Target Has Concentration Active',
    'Unsupported: Target wears iron armor (tests Not evaluated)',
  ];

  readonly effectPresets: string[] = [
    'Spend the required resources (1 Reaction + 1st-level Spell Slot)',
    'Grant +5 AC until the start of your next turn',
    'Resolve the triggering attack or Magic Missile interaction',
    'Interrupt Spell Cast & Negate Effect',
    'Pause Movement & Execute 1 Melee Attack',
    'Add Sneak Attack Dice To Damage Roll',
    'Apply Chokrah +2d8 Necrotic/Radiant Surge',
  ];

  readonly triggerClause = computed<RuleLogicClause>(() => {
    const found = this.rule().clauses.find((c) => c.keyword.toLowerCase() === 'when');
    return (
      found ?? {
        id: 'c-guided-when',
        keyword: 'When',
        combiner: 'ANY',
        tokens: ['An attack hits you'],
        boundClass: this.rule().primaryClassName,
        boundMethod: this.rule().primaryMethodName,
        notes: 'Trigger condition',
      }
    );
  });

  readonly requirementItems = computed(() => {
    const clauses = this.rule().clauses.filter((c) =>
      ['has', 'contains', 'has not', 'where', 'if', 'and', 'or'].includes(c.keyword.toLowerCase())
    );
    const items: { clauseId: string; keyword: string; token: string; tokenIdx: number }[] = [];
    for (const c of clauses) {
      c.tokens.forEach((tok, idx) => {
        items.push({ clauseId: c.id, keyword: c.keyword, token: tok, tokenIdx: idx });
      });
    }
    return items;
  });

  readonly requirementCombiner = computed<ClauseCombiner>(() => {
    const primaryReq = this.rule().clauses.find((c) =>
      ['has', 'contains', 'if', 'where'].includes(c.keyword.toLowerCase())
    );
    return (primaryReq?.combiner?.toUpperCase() === 'ANY' ? 'ANY' : 'ALL') as ClauseCombiner;
  });

  readonly effectClause = computed<RuleLogicClause>(() => {
    const found = this.rule().clauses.find((c) => c.keyword.toLowerCase() === 'then');
    return (
      found ?? {
        id: 'c-guided-then',
        keyword: 'Then',
        combiner: 'ALL',
        tokens: [this.rule().damageOrEffectFormula || 'Apply ability effect'],
        boundClass: this.rule().primaryClassName,
        boundMethod: this.rule().primaryMethodName,
        notes: 'Primary effect resolution',
      }
    );
  });

  readonly fallbackClause = computed<RuleLogicClause | null>(() => {
    return this.rule().clauses.find((c) => c.keyword.toLowerCase() === 'else') ?? null;
  });

  readonly triggerSummary = computed(() => {
    const c = this.triggerClause();
    const joiner = (c.combiner || 'ANY').toUpperCase() === 'ANY' ? ' OR ' : ' AND ';
    return c.tokens.length > 0 ? c.tokens.join(joiner) : 'No trigger configured';
  });

  readonly requirementsSummary = computed(() => {
    const items = this.requirementItems().map((i) => i.token);
    const joiner = this.requirementCombiner() === 'ANY' ? ' OR ' : ' AND ';
    return items.length > 0 ? items.join(joiner) : 'No special requirements';
  });

  readonly effectsSummary = computed(() => {
    const tokens = this.effectClause().tokens;
    return tokens.length > 0 ? tokens.join(' ; ') : this.rule().damageOrEffectFormula;
  });

  toggleGroup(group: GuidedGroupKey): void {
    this.expandedGroup.update((cur) => (cur === group ? null : group));
    this.activePicker.set(null);
  }

  openPicker(group: GuidedGroupKey): void {
    this.activePicker.update((cur) => (cur === group ? null : group));
    this.customInputText.set('');
  }

  setTriggerCombiner(combiner: ClauseCombiner): void {
    const r = this.rule();
    const hasWhen = r.clauses.some((c) => c.keyword.toLowerCase() === 'when');
    const nextClauses = hasWhen
      ? r.clauses.map((c) => (c.keyword.toLowerCase() === 'when' ? { ...c, combiner } : c))
      : [{ ...this.triggerClause(), combiner }, ...r.clauses];
    this.ruleChange.emit({ ...r, clauses: nextClauses });
  }

  setRequirementsCombiner(combiner: ClauseCombiner): void {
    const r = this.rule();
    const nextClauses = r.clauses.map((c) =>
      ['has', 'contains', 'has not', 'where', 'if'].includes(c.keyword.toLowerCase())
        ? { ...c, combiner }
        : c
    );
    this.ruleChange.emit({ ...r, clauses: nextClauses });
  }

  addConditionToGroup(group: GuidedGroupKey, text: string): void {
    const clean = text.trim();
    if (!clean) return;
    const r = this.rule();
    const clauses = r.clauses.map((c) => ({ ...c, tokens: [...c.tokens] }));

    if (group === 'trigger') {
      const idx = clauses.findIndex((c) => c.keyword.toLowerCase() === 'when');
      if (idx >= 0) {
        if (!clauses[idx].tokens.includes(clean)) clauses[idx].tokens.push(clean);
      } else {
        clauses.unshift({ ...this.triggerClause(), tokens: [clean] });
      }
    } else if (group === 'requirements') {
      const isContains =
        clean.toLowerCase().includes('casting') ||
        clean.toLowerCase().includes('contains') ||
        clean.toLowerCase().includes('unsupported');
      const targetKw = isContains ? 'Contains' : 'Has';
      const idx = clauses.findIndex((c) => c.keyword.toLowerCase() === targetKw.toLowerCase());
      if (idx >= 0) {
        if (!clauses[idx].tokens.includes(clean)) clauses[idx].tokens.push(clean);
      } else {
        const insertAt = Math.min(1, clauses.length);
        clauses.splice(insertAt, 0, {
          id: `c-req-${Date.now()}`,
          keyword: targetKw,
          combiner: this.requirementCombiner(),
          tokens: [clean],
          boundClass: r.primaryClassName,
          boundMethod: r.primaryMethodName,
          notes: 'Added via Guided Builder',
        });
      }
    } else {
      const idx = clauses.findIndex((c) => c.keyword.toLowerCase() === 'then');
      if (idx >= 0) {
        if (!clauses[idx].tokens.includes(clean)) clauses[idx].tokens.push(clean);
      } else {
        clauses.push({ ...this.effectClause(), tokens: [clean] });
      }
    }

    this.ruleChange.emit({ ...r, clauses });
    this.customInputText.set('');
    this.activePicker.set(null);
  }

  removeTriggerToken(tokenIdx: number): void {
    const r = this.rule();
    const clauses = r.clauses.map((c) =>
      c.keyword.toLowerCase() === 'when'
        ? { ...c, tokens: c.tokens.filter((_, i) => i !== tokenIdx) }
        : c
    );
    this.ruleChange.emit({ ...r, clauses });
  }

  removeRequirementItem(clauseId: string, tokenIdx: number): void {
    const r = this.rule();
    const clauses = r.clauses
      .map((c) => (c.id === clauseId ? { ...c, tokens: c.tokens.filter((_, i) => i !== tokenIdx) } : c))
      .filter((c) => c.tokens.length > 0 || ['when', 'then'].includes(c.keyword.toLowerCase()));
    this.ruleChange.emit({ ...r, clauses });
  }

  removeEffectToken(tokenIdx: number): void {
    const r = this.rule();
    const clauses = r.clauses.map((c) =>
      c.keyword.toLowerCase() === 'then'
        ? { ...c, tokens: c.tokens.filter((_, i) => i !== tokenIdx) }
        : c
    );
    this.ruleChange.emit({ ...r, clauses });
  }

  patchNumericAcBonus(acBonus: number): void {
    const r = this.rule();
    const bonus = Math.max(0, Number(acBonus) || 0);
    const updatedFormula =
      bonus > 0 && r.id === 'rule-shield-reaction'
        ? `+${bonus} AC & Negate Magic Missile`
        : r.damageOrEffectFormula;
    const clauses = r.clauses.map((c) => {
      if (c.keyword.toLowerCase() === 'with' && bonus > 0) {
        return { ...c, tokens: [`Grant +${bonus} AC until the start of your next turn`] };
      }
      if (c.keyword.toLowerCase() === 'then' && bonus > 0) {
        return {
          ...c,
          tokens: c.tokens.map((t) =>
            t.includes('AC until the start')
              ? `Grant +${bonus} AC until the start of your next turn`
              : t
          ),
        };
      }
      return c;
    });
    this.ruleChange.emit({ ...r, acBonus: bonus, damageOrEffectFormula: updatedFormula, clauses });
  }
}
