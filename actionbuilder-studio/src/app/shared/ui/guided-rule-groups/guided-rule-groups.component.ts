import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import {
  ACTOR_OPTIONS,
  CONTINUE_MODE_OPTIONS,
  DAMAGE_TYPE_OPTIONS,
  EFFECT_VERB_OPTIONS,
  IF_CONDITION_OPTIONS,
  PROMPT_TRIGGER_OPTIONS,
  REACTION_RULE_PRESETS,
  REQUIREMENT_PRESETS,
  ROLL_TYPE_OPTIONS,
  SPAWN_PLACEMENT_OPTIONS,
  SPAWN_RANGE_OPTIONS,
  TRANSFORM_HP_OPTIONS,
  TRANSFORM_SIZE_OPTIONS,
  createEffectItem,
  createStepOfType,
  ensureRuleResolutionSteps,
  syncRuleFromResolutionSteps,
} from '../../../core/models/action-resolution.helpers';
import {
  ActionEffectItem,
  ActionResolutionStep,
  CampaignActionRule,
  ResolutionStepType,
} from '../../../core/models/action-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-guided-rule-groups',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent],
  templateUrl: './guided-rule-groups.component.html',
  styleUrl: './guided-rule-groups.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwGuidedRuleGroupsComponent {
  readonly rule = input.required<CampaignActionRule>();
  readonly ruleChange = output<CampaignActionRule>();

  readonly expandedStepIds = signal<Record<string, boolean>>({});
  readonly insertMenuIndex = signal<number | null>(null);
  readonly newReqText = signal<string>('');
  readonly newPromptOptionText = signal<string>('');
  readonly newReactionText = signal<string>('');

  readonly actorOptions = ACTOR_OPTIONS;
  readonly promptTriggerOptions = PROMPT_TRIGGER_OPTIONS;
  readonly continueModeOptions = CONTINUE_MODE_OPTIONS;
  readonly rollTypeOptions = ROLL_TYPE_OPTIONS;
  readonly ifConditionOptions = IF_CONDITION_OPTIONS;
  readonly effectVerbOptions = EFFECT_VERB_OPTIONS;
  readonly damageTypeOptions = DAMAGE_TYPE_OPTIONS;
  readonly spawnPlacementOptions = SPAWN_PLACEMENT_OPTIONS;
  readonly spawnRangeOptions = SPAWN_RANGE_OPTIONS;
  readonly transformSizeOptions = TRANSFORM_SIZE_OPTIONS;
  readonly transformHpOptions = TRANSFORM_HP_OPTIONS;
  readonly requirementPresets = REQUIREMENT_PRESETS;
  readonly reactionRulePresets = REACTION_RULE_PRESETS;

  readonly steps = computed<ActionResolutionStep[]>(() => {
    const ensured = ensureRuleResolutionSteps(this.rule());
    return ensured.resolutionSteps ?? [];
  });

  isStepExpanded(step: ActionResolutionStep): boolean {
    const map = this.expandedStepIds();
    if (step.id in map) {
      return map[step.id];
    }
    return (
      step.stepType === 'BRANCH' ||
      step.stepType === 'EFFECT' ||
      step.stepType === 'SPAWN_TOKEN' ||
      step.stepType === 'CHANGE_TOKEN'
    );
  }

  toggleStepExpanded(step: ActionResolutionStep): void {
    const current = this.isStepExpanded(step);
    this.expandedStepIds.update((map) => ({ ...map, [step.id]: !current }));
  }

  stepBadgeLabel(stepType: ResolutionStepType): string {
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
        return 'SPAWN TOKEN';
      case 'CHANGE_TOKEN':
        return 'CHANGE TOKEN';
      case 'EFFECT':
      default:
        return 'EFFECT';
    }
  }

  stepSummarySubtitle(step: ActionResolutionStep): string {
    switch (step.stepType) {
      case 'CHECK':
        return step.requirements.length > 0
          ? step.requirements.join(' · ')
          : 'No requirements configured';
      case 'PROMPT':
        return step.promptMessage || `Ask ${step.promptTarget} (${step.promptTrigger})`;
      case 'ROLL':
        return `${step.rollFormula || '1d20 + modifier'} (${step.rollType})`;
      case 'BRANCH':
        return 'Pause for eligible reactions before applying damage.';
      case 'SPAWN_TOKEN':
        return `${step.spawnTokenName || 'Token'} · ${step.spawnPlacementMode} (${step.spawnRangeFt})`;
      case 'CHANGE_TOKEN':
        return `${step.transformTarget} -> ${step.transformTokenName || 'New Form'} (${step.transformSize})`;
      case 'EFFECT':
      default:
        return step.subtitle || 'Apply Hit / Miss or Save outcome effects.';
    }
  }

  toggleCheckCombiner(stepIdx: number): void {
    const list = this.steps().map((s, idx) =>
      idx === stepIdx ? { ...s, checkCombiner: s.checkCombiner === 'ANY' ? 'ALL' : 'ANY' } : s
    );
    this.emitSteps(list);
  }

  updateStepField<K extends keyof ActionResolutionStep>(
    stepIdx: number,
    field: K,
    value: ActionResolutionStep[K]
  ): void {
    const list = this.steps().map((s, idx) => (idx === stepIdx ? { ...s, [field]: value } : s));
    this.emitSteps(list);
  }

  addRequirement(stepIdx: number, rawText: string): void {
    const clean = (rawText || '').trim();
    if (!clean) return;
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      const nextReqs = s.requirements.includes(clean) ? s.requirements : [...s.requirements, clean];
      return { ...s, requirements: nextReqs, subtitle: nextReqs.join(' · ') };
    });
    this.newReqText.set('');
    this.emitSteps(list);
  }

  removeRequirement(stepIdx: number, reqIdx: number): void {
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      const nextReqs = s.requirements.filter((_, i) => i !== reqIdx);
      return { ...s, requirements: nextReqs, subtitle: nextReqs.join(' · ') };
    });
    this.emitSteps(list);
  }

  addPromptOption(stepIdx: number, rawText: string): void {
    const clean = (rawText || '').trim();
    if (!clean) return;
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      const nextOpts = s.promptOptions.includes(clean) ? s.promptOptions : [...s.promptOptions, clean];
      return { ...s, promptOptions: nextOpts };
    });
    this.newPromptOptionText.set('');
    this.emitSteps(list);
  }

  removePromptOption(stepIdx: number, optIdx: number): void {
    const list = this.steps().map((s, idx) =>
      idx === stepIdx ? { ...s, promptOptions: s.promptOptions.filter((_, i) => i !== optIdx) } : s
    );
    this.emitSteps(list);
  }

  addReactionOption(stepIdx: number, rawText: string): void {
    const clean = (rawText || '').trim();
    if (!clean) return;
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      const nextRx = s.reactionOptions.includes(clean) ? s.reactionOptions : [...s.reactionOptions, clean];
      return { ...s, reactionOptions: nextRx };
    });
    this.newReactionText.set('');
    this.emitSteps(list);
  }

  removeReactionOption(stepIdx: number, rxIdx: number): void {
    const list = this.steps().map((s, idx) =>
      idx === stepIdx ? { ...s, reactionOptions: s.reactionOptions.filter((_, i) => i !== rxIdx) } : s
    );
    this.emitSteps(list);
  }

  addEffectRow(stepIdx: number, branch: 'hit' | 'miss'): void {
    const newItem =
      branch === 'hit'
        ? createEffectItem(
            'On Hit',
            'Apply damage',
            'Target(s)',
            this.rule().damageOrEffectFormula || '1d8',
            'Weapon damage'
          )
        : createEffectItem('On Miss', 'No damage', 'Target(s)', '0', 'None');
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      return branch === 'hit'
        ? { ...s, hitEffects: [...s.hitEffects, newItem] }
        : { ...s, missEffects: [...s.missEffects, newItem] };
    });
    this.emitSteps(list);
  }

  updateEffectRow<K extends keyof ActionEffectItem>(
    stepIdx: number,
    branch: 'hit' | 'miss',
    effIdx: number,
    field: K,
    value: ActionEffectItem[K]
  ): void {
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      const targetList = branch === 'hit' ? s.hitEffects : s.missEffects;
      const updated = targetList.map((e, i) => (i === effIdx ? { ...e, [field]: value } : e));
      return branch === 'hit' ? { ...s, hitEffects: updated } : { ...s, missEffects: updated };
    });
    this.emitSteps(list);
  }

  removeEffectRow(stepIdx: number, branch: 'hit' | 'miss', effIdx: number): void {
    const list = this.steps().map((s, idx) => {
      if (idx !== stepIdx) return s;
      return branch === 'hit'
        ? { ...s, hitEffects: s.hitEffects.filter((_, i) => i !== effIdx) }
        : { ...s, missEffects: s.missEffects.filter((_, i) => i !== effIdx) };
    });
    this.emitSteps(list);
  }

  moveStep(stepIdx: number, direction: -1 | 1): void {
    const current = [...this.steps()];
    const targetIdx = stepIdx + direction;
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const [moved] = current.splice(stepIdx, 1);
    current.splice(targetIdx, 0, moved);
    this.emitSteps(current);
  }

  deleteStep(stepIdx: number): void {
    const current = this.steps().filter((_, idx) => idx !== stepIdx);
    this.emitSteps(current);
  }

  toggleInsertMenu(afterIdx: number): void {
    this.insertMenuIndex.update((cur) => (cur === afterIdx ? null : afterIdx));
  }

  insertStepAt(insertIndex: number, stepType: ResolutionStepType): void {
    const current = [...this.steps()];
    const newStep = createStepOfType(stepType, insertIndex + 1, this.rule());
    current.splice(insertIndex, 0, newStep);
    this.expandedStepIds.update((map) => ({ ...map, [newStep.id]: true }));
    this.insertMenuIndex.set(null);
    this.emitSteps(current);
  }

  appendStep(stepType: ResolutionStepType): void {
    this.insertStepAt(this.steps().length, stepType);
  }

  private emitSteps(steps: ActionResolutionStep[]): void {
    const synced = syncRuleFromResolutionSteps(this.rule(), steps);
    this.ruleChange.emit(synced);
  }
}
