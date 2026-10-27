import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  CampaignActionRule,
  EvaluateRuleLogicRequest,
  EvaluateRuleLogicResponse,
  RuleClauseTraceStep,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

export interface ScenarioPreset {
  id: string;
  label: string;
  subtitle: string;
  attackRollTotal: number;
  targetAc: number;
  damageRolled: number;
  distanceFeet: number;
  reactionAvailable: boolean;
  hasSpellSlot: boolean;
  isMagicMissile: boolean;
  injectUnsupportedCondition?: boolean;
}

@Component({
  selector: 'lw-rule-test-sandbox',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwButtonComponent, LwBadgeComponent],
  templateUrl: './rule-test-sandbox.component.html',
  styleUrl: './rule-test-sandbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleTestSandboxComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly campaignId = input<number>(1);
  readonly evaluationResult = input<EvaluateRuleLogicResponse | null>(null);
  readonly evaluating = input<boolean>(false);

  readonly runSimulation = output<EvaluateRuleLogicRequest>();

  readonly activePresetId = signal<string>('hit-turned-miss');
  readonly attackerName = model<string>('Vaelkorath (Boss)');
  readonly defenderName = model<string>('Kycius');
  readonly simAttackRoll = model<number>(17);
  readonly simTargetAc = model<number>(15);
  readonly simDamageRolled = model<number>(11);
  readonly simDistanceFeet = model<number>(30);
  readonly simReactionAvailable = model<boolean>(true);
  readonly simHasSpellSlot = model<boolean>(true);
  readonly simIsMagicMissile = model<boolean>(false);
  readonly testUnsupportedCheck = model<boolean>(false);

  readonly presets: ScenarioPreset[] = [
    {
      id: 'hit-turned-miss',
      label: 'Hit Turned Into Miss (17 vs AC 15)',
      subtitle: 'Attack 17 vs AC 15 -> Shield raises AC to 20 -> Misses',
      attackRollTotal: 17,
      targetAc: 15,
      damageRolled: 11,
      distanceFeet: 30,
      reactionAvailable: true,
      hasSpellSlot: true,
      isMagicMissile: false,
    },
    {
      id: 'no-reaction',
      label: 'Failure: No Reaction',
      subtitle: 'Reaction already spent this round',
      attackRollTotal: 17,
      targetAc: 15,
      damageRolled: 11,
      distanceFeet: 30,
      reactionAvailable: false,
      hasSpellSlot: true,
      isMagicMissile: false,
    },
    {
      id: 'no-spell-slot',
      label: 'Failure: No Spell Slot',
      subtitle: 'Reaction ready, but 0 spell slots remaining',
      attackRollTotal: 17,
      targetAc: 15,
      damageRolled: 11,
      distanceFeet: 30,
      reactionAvailable: true,
      hasSpellSlot: false,
      isMagicMissile: false,
    },
    {
      id: 'attack-still-hits',
      label: 'Attack Still Hits (22 vs AC 15)',
      subtitle: 'Shield raises AC to 20, but 22 still hits',
      attackRollTotal: 22,
      targetAc: 15,
      damageRolled: 14,
      distanceFeet: 30,
      reactionAvailable: true,
      hasSpellSlot: true,
      isMagicMissile: false,
    },
    {
      id: 'magic-missile',
      label: 'Magic Missile Targeted',
      subtitle: 'Automatic darts negated & +5 AC granted',
      attackRollTotal: 0,
      targetAc: 15,
      damageRolled: 10,
      distanceFeet: 45,
      reactionAvailable: true,
      hasSpellSlot: true,
      isMagicMissile: true,
    },
    {
      id: 'unsupported-condition',
      label: 'Unsupported Check ("Not evaluated")',
      subtitle: 'Verifies engine reports Not evaluated instead of false pass',
      attackRollTotal: 17,
      targetAc: 15,
      damageRolled: 11,
      distanceFeet: 30,
      reactionAvailable: true,
      hasSpellSlot: true,
      isMagicMissile: false,
      injectUnsupportedCondition: true,
    },
  ];

  selectPreset(preset: ScenarioPreset): void {
    this.activePresetId.set(preset.id);
    this.simAttackRoll.set(preset.attackRollTotal);
    this.simTargetAc.set(preset.targetAc);
    this.simDamageRolled.set(preset.damageRolled);
    this.simDistanceFeet.set(preset.distanceFeet);
    this.simReactionAvailable.set(preset.reactionAvailable);
    this.simHasSpellSlot.set(preset.hasSpellSlot);
    this.simIsMagicMissile.set(preset.isMagicMissile);
    this.testUnsupportedCheck.set(Boolean(preset.injectUnsupportedCondition));
    this.triggerSimulation();
  }

  triggerSimulation(): void {
    const r = this.rule();
    const clauses = r.clauses.map((c) => ({ ...c, tokens: [...c.tokens] }));
    if (this.testUnsupportedCheck()) {
      clauses.splice(1, 0, {
        id: 'c-sim-unsupported',
        keyword: 'Contains',
        combiner: 'ALL',
        tokens: ['Unsupported: Target wears iron armor under full moon'],
        boundClass: r.primaryClassName,
        boundMethod: r.primaryMethodName,
        notes: 'Diagnostic unsupported condition check',
      });
    }

    this.runSimulation.emit({
      campaignId: this.campaignId(),
      ruleId: r.id,
      ruleName: r.name,
      primaryClassName: r.primaryClassName,
      primaryMethodName: r.primaryMethodName,
      clauses,
      actionCost: r.actionCost,
      damageOrEffectFormula: r.damageOrEffectFormula,
      saveDc: r.saveDc,
      acBonus: r.acBonus,
      attackerName: this.attackerName(),
      defenderName: this.defenderName(),
      attackRollTotal: Number(this.simAttackRoll()),
      targetAc: Number(this.simTargetAc()),
      distanceFeet: Number(this.simDistanceFeet()),
      reactionAvailable: Boolean(this.simReactionAvailable()),
      hasSpellSlot: Boolean(this.simHasSpellSlot()),
      damageRolled: Number(this.simDamageRolled()),
      isMagicMissile: Boolean(this.simIsMagicMissile()),
    });
  }

  stepTone(step: RuleClauseTraceStep): 'emerald' | 'crimson' | 'gold' | 'neutral' {
    const st = (step.evaluationStatus || '').toLowerCase();
    if (st === 'notevaluated') return 'gold';
    if (st === 'skipped') return 'neutral';
    return step.passed ? 'emerald' : 'crimson';
  }

  stepStatusLabel(step: RuleClauseTraceStep): string {
    const st = step.evaluationStatus || (step.passed ? 'Passed' : 'Failed');
    if (st === 'NotEvaluated') return 'Not evaluated';
    return st;
  }
}
