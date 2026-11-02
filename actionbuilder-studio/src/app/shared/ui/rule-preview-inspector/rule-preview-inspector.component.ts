import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  ActionResolutionStep,
  CampaignActionRule,
} from '../../../core/models/action-studio.models';
import { ensureRuleResolutionSteps } from '../../../core/models/action-resolution.helpers';

@Component({
  selector: 'lw-rule-preview-inspector',
  standalone: true,
  imports: [],
  templateUrl: './rule-preview-inspector.component.html',
  styleUrl: './rule-preview-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRulePreviewInspectorComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly campaignName = input<string>('Shadow of the Mountain');

  readonly steps = computed<ActionResolutionStep[]>(() => {
    const current = this.rule();
    const withSteps = ensureRuleResolutionSteps(current);
    return withSteps.resolutionSteps ?? [];
  });

  stepTypeLabel(stepType: string): string {
    switch (stepType) {
      case 'CHECK':
        return 'CHECK';
      case 'PROMPT':
        return 'PROMPT';
      case 'ROLL':
        return 'ROLL';
      case 'BRANCH':
        return 'BRANCH';
      case 'SPAWN_TOKEN':
        return 'TOKEN SPAWN';
      case 'CHANGE_TOKEN':
        return 'TOKEN SHIFT';
      case 'EFFECT':
      default:
        return 'EFFECT';
    }
  }
}
