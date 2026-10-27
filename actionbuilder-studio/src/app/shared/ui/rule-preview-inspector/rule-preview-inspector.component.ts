import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  ActionScalingTier,
  CampaignActionRule,
  RuleDraftDiffItem,
} from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-preview-inspector',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwButtonComponent, LwBadgeComponent, LwIconComponent],
  templateUrl: './rule-preview-inspector.component.html',
  styleUrl: './rule-preview-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRulePreviewInspectorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly campaignName = input<string>('Shadow of the Mountain');
  readonly draftDiffs = input<RuleDraftDiffItem[]>([]);
  readonly hasDraftSaved = input<boolean>(false);
  readonly saving = input<boolean>(false);

  readonly ruleChange = output<CampaignActionRule>();
  readonly saveDraftRequested = output<void>();
  readonly applyToCampaign = output<void>();
  readonly openTestTabRequested = output<void>();

  readonly previewMode = signal<'player' | 'gm'>('player');
  readonly scalingEnabled = signal<boolean>(true);
  readonly newTagText = signal<string>('');

  readonly triggerLine = computed(() => {
    const when = this.rule().clauses.find((c) => c.keyword.toLowerCase() === 'when');
    if (!when || when.tokens.length === 0) return 'Declared on your turn';
    const joiner = (when.combiner || 'ANY') === 'ANY' ? ' OR ' : ' AND ';
    return when.tokens.join(joiner);
  });

  readonly requirementLine = computed(() => {
    const reqs = this.rule()
      .clauses.filter((c) => ['has', 'contains', 'where', 'if', 'has not'].includes(c.keyword.toLowerCase()))
      .flatMap((c) => c.tokens);
    return reqs.length > 0 ? reqs.join(' AND ') : 'Standard action economy';
  });

  readonly effectLine = computed(() => {
    const thenClause = this.rule().clauses.find((c) => c.keyword.toLowerCase() === 'then');
    if (thenClause && thenClause.tokens.length > 0) {
      return thenClause.tokens.join('; ');
    }
    return this.rule().damageOrEffectFormula;
  });

  updateScalingTier(index: number, field: keyof ActionScalingTier, value: string): void {
    const nextTiers = this.rule().scalingTiers.map((t, idx) =>
      idx === index ? { ...t, [field]: value } : t
    );
    this.ruleChange.emit({ ...this.rule(), scalingTiers: nextTiers });
  }

  addScalingTier(): void {
    const nextTiers: ActionScalingTier[] = [
      ...this.rule().scalingTiers,
      {
        levelRange: '17-20',
        diceOrValue: this.rule().rangeLabel || 'Self',
        label: 'High Tier',
        summary: 'Additional high-level scaling effect.',
      },
    ];
    this.ruleChange.emit({ ...this.rule(), scalingTiers: nextTiers });
  }

  removeScalingTier(index: number): void {
    const nextTiers = this.rule().scalingTiers.filter((_, idx) => idx !== index);
    this.ruleChange.emit({ ...this.rule(), scalingTiers: nextTiers });
  }

  addTag(): void {
    const val = this.newTagText().trim();
    if (!val) return;
    const tags = this.rule().tags || [];
    if (!tags.includes(val)) {
      this.ruleChange.emit({ ...this.rule(), tags: [...tags, val] });
    }
    this.newTagText.set('');
  }

  removeTag(idx: number): void {
    const next = this.rule().tags.filter((_, i) => i !== idx);
    this.ruleChange.emit({ ...this.rule(), tags: next });
  }
}
