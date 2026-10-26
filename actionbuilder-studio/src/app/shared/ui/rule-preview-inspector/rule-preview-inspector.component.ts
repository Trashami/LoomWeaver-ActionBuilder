import { ChangeDetectionStrategy, Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CampaignActionRule,
  EvaluateRuleLogicRequest,
  EvaluateRuleLogicResponse,
  RuleEngineSymbolDescriptor,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwPanelComponent } from '../panel/panel.component';

@Component({
  selector: 'lw-rule-preview-inspector',
  standalone: true,
  imports: [FormsModule, LwPanelComponent, LwButtonComponent, LwBadgeComponent],
  templateUrl: './rule-preview-inspector.component.html',
  styleUrl: './rule-preview-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRulePreviewInspectorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly campaignId = input<number>(1);
  readonly campaignName = input<string>('Shadow of the Mountain');
  readonly engineSymbols = input<RuleEngineSymbolDescriptor[]>([]);
  readonly evaluationResult = input<EvaluateRuleLogicResponse | null>(null);
  readonly evaluating = input<boolean>(false);

  readonly previewMode = signal<'player' | 'gm'>('player');
  readonly simAttackRoll = model<number>(17);
  readonly simTargetAc = model<number>(15);
  readonly simDistanceFeet = model<number>(30);
  readonly simDamageRolled = model<number>(14);
  readonly simReactionAvailable = model<boolean>(true);
  readonly simHasSpellSlot = model<boolean>(true);

  readonly runSimulation = output<EvaluateRuleLogicRequest>();
  readonly applyToCampaign = output<void>();

  readonly activeSymbolInfo = computed(() => {
    const r = this.rule();
    const cls = this.engineSymbols().find((s) => s.className === r.primaryClassName);
    const method = cls?.methods.find((m) => m.methodName === r.primaryMethodName);
    return { cls, method };
  });

  triggerSimulation(): void {
    const r = this.rule();
    this.runSimulation.emit({
      campaignId: this.campaignId(),
      ruleId: r.id,
      ruleName: r.name,
      primaryClassName: r.primaryClassName,
      primaryMethodName: r.primaryMethodName,
      clauses: r.clauses,
      actionCost: r.actionCost,
      damageOrEffectFormula: r.damageOrEffectFormula,
      saveDc: r.saveDc,
      acBonus: r.acBonus,
      attackerName: 'Vaelkorath (Boss)',
      defenderName: 'Kycius',
      attackRollTotal: Number(this.simAttackRoll()),
      targetAc: Number(this.simTargetAc()),
      distanceFeet: Number(this.simDistanceFeet()),
      reactionAvailable: Boolean(this.simReactionAvailable()),
      hasSpellSlot: Boolean(this.simHasSpellSlot()),
      damageRolled: Number(this.simDamageRolled()),
    });
  }
}
