import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActionScalingTier,
  CampaignActionRule,
  RuleEngineMethodDescriptor,
  RuleEngineSymbolDescriptor,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwPanelComponent } from '../panel/panel.component';

@Component({
  selector: 'lw-rule-parameters-editor',
  standalone: true,
  imports: [FormsModule, LwPanelComponent, LwButtonComponent, LwBadgeComponent],
  templateUrl: './rule-parameters-editor.component.html',
  styleUrl: './rule-parameters-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleParametersEditorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly engineSymbols = input<RuleEngineSymbolDescriptor[]>([]);
  readonly activeCampaignName = input<string>('Shadow of the Mountain');

  readonly ruleChange = output<CampaignActionRule>();

  readonly categories = [
    'Reactions & Interrupts',
    'Core Rules',
    'Movement & Terrain',
    'Saving Throws & Vitals',
    'Class & Party Actions',
    'Campaign Custom',
  ];

  readonly actionCosts = [
    '1 Action',
    '1 Bonus Action',
    '1 Reaction',
    'Free (Triggered on Damage)',
    'Free (1/Turn on Hit)',
    'Turn Start Refresh',
    'Movement Budget',
  ];

  methodsForPrimaryClass(className: string): RuleEngineMethodDescriptor[] {
    const found = this.engineSymbols().find((s) => s.className === className);
    return found ? found.methods : this.engineSymbols()[0]?.methods || [];
  }

  patchField<K extends keyof CampaignActionRule>(key: K, value: CampaignActionRule[K]): void {
    const updated: CampaignActionRule = {
      ...this.rule(),
      [key]: value,
    };
    if (key === 'primaryClassName') {
      const methods = this.methodsForPrimaryClass(String(value));
      updated.primaryMethodName = methods[0]?.methodName || '';
      const sym = this.engineSymbols().find((s) => s.className === String(value));
      if (sym) {
        updated.sourceFilePath = sym.filePath;
      }
    }
    this.ruleChange.emit(updated);
  }

  updateScalingTier(index: number, field: keyof ActionScalingTier, value: string): void {
    const nextTiers = this.rule().scalingTiers.map((t, idx) =>
      idx === index ? { ...t, [field]: value } : t
    );
    this.patchField('scalingTiers', nextTiers);
  }

  addScalingTier(): void {
    const nextTiers: ActionScalingTier[] = [
      ...this.rule().scalingTiers,
      {
        levelRange: 'Levels 17-20',
        diceOrValue: '+1d8',
        label: 'High-Level Tier',
        summary: 'Additional campaign scaling tier.',
      },
    ];
    this.patchField('scalingTiers', nextTiers);
  }

  removeScalingTier(index: number): void {
    const nextTiers = this.rule().scalingTiers.filter((_, idx) => idx !== index);
    this.patchField('scalingTiers', nextTiers);
  }
}
