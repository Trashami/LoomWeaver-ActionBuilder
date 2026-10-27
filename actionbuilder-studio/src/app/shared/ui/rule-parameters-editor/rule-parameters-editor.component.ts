import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { CampaignActionRule } from '../../../core/models/action-studio.models';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-parameters-editor',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent, LwButtonComponent],
  templateUrl: './rule-parameters-editor.component.html',
  styleUrl: './rule-parameters-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleParametersEditorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly activeCampaignName = input<string>('Shadow of the Mountain');

  readonly ruleChange = output<CampaignActionRule>();

  readonly newWorksWith = signal<string>('');
  readonly newConflict = signal<string>('');

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

  readonly sourceOptions = ['Core SRD', 'Modified SRD', 'Custom Action', 'Homebrew'];

  patchField<K extends keyof CampaignActionRule>(key: K, value: CampaignActionRule[K]): void {
    this.ruleChange.emit({
      ...this.rule(),
      [key]: value,
    });
  }

  addWorksWith(): void {
    const val = this.newWorksWith().trim();
    if (!val) return;
    const current = this.rule().worksWith || [];
    if (!current.includes(val)) {
      this.patchField('worksWith', [...current, val]);
    }
    this.newWorksWith.set('');
  }

  removeWorksWith(idx: number): void {
    this.patchField(
      'worksWith',
      this.rule().worksWith.filter((_, i) => i !== idx)
    );
  }

  addConflict(): void {
    const val = this.newConflict().trim();
    if (!val) return;
    const current = this.rule().conflictsWith || [];
    if (!current.includes(val)) {
      this.patchField('conflictsWith', [...current, val]);
    }
    this.newConflict.set('');
  }

  removeConflict(idx: number): void {
    this.patchField(
      'conflictsWith',
      this.rule().conflictsWith.filter((_, i) => i !== idx)
    );
  }
}
