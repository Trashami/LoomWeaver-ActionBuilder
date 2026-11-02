import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { CampaignActionRule } from '../../../core/models/action-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-parameters-editor',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent],
  templateUrl: './rule-parameters-editor.component.html',
  styleUrl: './rule-parameters-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleParametersEditorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly activeCampaignName = input<string>('Shadow of the Mountain');

  readonly ruleChange = output<CampaignActionRule>();

  readonly expanded = signal<boolean>(false);

  readonly categories = [
    'Actions',
    'Spells',
    'Conditions',
    'Class Features',
    'Campaign Custom',
  ];

  readonly actionCosts = [
    '1 Action',
    '1 Bonus Action',
    '1 Reaction',
    'Free (1/Turn on Hit)',
    'Free (Triggered on Damage)',
    'At Will / Passive',
  ];

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  patchField<K extends keyof CampaignActionRule>(key: K, value: CampaignActionRule[K]): void {
    this.ruleChange.emit({
      ...this.rule(),
      [key]: value,
    });
  }
}
