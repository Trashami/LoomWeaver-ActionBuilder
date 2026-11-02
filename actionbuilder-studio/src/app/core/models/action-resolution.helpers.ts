import {
  ActionResolutionStep,
  ActionRuleClause,
  CampaignActionRule,
  ResolutionStepType,
} from './action-studio.models';
import { createEffectItem } from './action-resolution.options';

export * from './action-resolution.options';

function makeBaseStep(
  id: string,
  order: number,
  stepType: ResolutionStepType,
  title: string,
  subtitle: string,
  overrides: Partial<ActionResolutionStep> = {}
): ActionResolutionStep {
  return {
    id,
    order,
    stepType,
    title,
    subtitle,
    checkCombiner: 'ALL',
    requirements: [],
    promptTarget: 'Caster / Attacker',
    promptTrigger: 'When casting',
    promptMessage: '',
    promptOptions: [],
    rollActor: 'Caster / Attacker',
    rollType: 'Attack Roll vs Target AC',
    rollFormula: '',
    reactionAskTarget: 'Eligible creatures',
    reactionContinueMode: 'After responses or timeout',
    reactionOptions: [],
    hitEffects: [],
    missEffects: [],
    spawnTokenName: '',
    spawnPlacementMode: 'Appear on map next to (adjacent to) Caster',
    spawnRangeFt: 'Adjacent (5 ft)',
    spawnController: 'Caster / Attacker',
    transformTarget: 'Caster / Attacker',
    transformTokenName: '',
    transformSize: 'Match new form size',
    transformHpMode: 'Visual token swap only',
    ...overrides,
  };
}

export function buildDefaultResolutionSteps(rule: CampaignActionRule): ActionResolutionStep[] {
  const idLower = (rule.id || '').toLowerCase();
  const nameLower = (rule.name || '').toLowerCase();
  const isSummon =
    nameLower.includes('find familiar') ||
    nameLower.includes('summon ') ||
    nameLower.includes('conjure ') ||
    nameLower.includes('spiritual weapon') ||
    nameLower.includes('unseen servant');
  const isTransform =
    nameLower.includes('wild shape') ||
    nameLower.includes('polymorph') ||
    nameLower.includes('shapechange') ||
    nameLower.includes('alter self');
  const isReaction = (rule.actionCost || '').toLowerCase().includes('reaction');
  const isSave =
    (rule.attackOrSaveLabel || '').toLowerCase().includes('save') || (rule.saveDc ?? 0) > 0;

  if (idLower === 'rule-action-attack' || nameLower === 'attack') {
    return [
      makeBaseStep('step-attack-1', 1, 'CHECK', 'Check requirements', 'Weapon equipped · Target in range · Attacker can act', {
        requirements: ['Weapon equipped', 'Target in range', 'Attacker can act'],
        promptTrigger: 'When attacking',
      }),
      makeBaseStep('step-attack-2', 2, 'PROMPT', 'Choose target', 'Ask the player to select one creature.', {
        promptTrigger: 'When attacking',
        promptMessage: 'Select one target creature within weapon range.',
        promptOptions: ['Standard Attack', 'Two-handed / Versatile', 'Non-lethal strike'],
      }),
      makeBaseStep('step-attack-3', 3, 'ROLL', 'Roll attack', 'd20 + attack modifier vs. target AC', {
        promptTrigger: 'When attacking',
        rollFormula: '1d20 + Attack Modifier vs Target AC',
      }),
      makeBaseStep('step-attack-4', 4, 'BRANCH', 'On a hit: offer reactions', 'Pause for eligible reactions before applying damage.', {
        promptTarget: 'Target(s)',
        promptTrigger: 'When attacking',
        promptMessage: 'An attack hits you. Use an available reaction?',
        reactionOptions: ['Shield (+5 AC)', 'Uncanny Dodge (Half damage)', 'Parry / Deflect Attack'],
      }),
      makeBaseStep('step-attack-5', 5, 'EFFECT', 'Resolve result', 'Apply damage or miss effects based on roll and reactions.', {
        hitEffects: [
          createEffectItem('On Hit', 'Roll weapon damage', 'Target(s)', rule.damageOrEffectFormula || '1d8 + STR/DEX', 'Weapon damage'),
          createEffectItem('On Hit', 'Apply damage', 'Target(s)', 'Rolled total', 'Weapon damage'),
        ],
        missEffects: [createEffectItem('On Miss', 'No damage', 'Target(s)', '0', 'None')],
      }),
    ];
  }

  const steps: ActionResolutionStep[] = [
    makeBaseStep(
      `${rule.id}-step-1`,
      1,
      'CHECK',
      'Check requirements',
      `${rule.actionCost || '1 Action'} available · ${rule.rangeLabel || 'In range'}`,
      {
        requirements: [
          `${rule.actionCost || '1 Action'} available`,
          rule.category === 'Spells' ? 'Spell slot or ritual available' : 'Actor can act',
          `Range: ${rule.rangeLabel || 'Self'}`,
        ],
      }
    ),
    makeBaseStep(
      `${rule.id}-step-2`,
      2,
      'PROMPT',
      isSummon ? 'Prompt caster for placement & form' : isTransform ? 'Choose new token form' : 'Choose target',
      isSummon
        ? `Prompt caster to place summoned token within ${rule.rangeLabel || 'range'}.`
        : `Ask player to confirm ${rule.targetLabel || 'target'}.`,
      {
        promptTrigger: isSummon ? 'When placing token' : 'When casting',
        promptMessage: `Choose target or placement for ${rule.name} (${rule.rangeLabel || 'Self'}).`,
        promptOptions: isSummon
          ? ['Place within spell range', 'Place adjacent to caster']
          : isTransform
            ? ['Wolf / Dire Wolf', 'Brown Bear', 'Giant Spider']
            : ['Confirm target', 'Upcast with higher slot'],
      }
    ),
  ];

  if (!isReaction && (isSave || (rule.attackOrSaveLabel || '').toLowerCase().includes('attack'))) {
    steps.push(
      makeBaseStep(
        `${rule.id}-step-roll`,
        steps.length + 1,
        'ROLL',
        isSave ? 'Roll saving throw' : 'Roll spell / weapon attack',
        rule.attackOrSaveLabel || '1d20 vs Target AC / Save DC',
        {
          rollActor: isSave ? 'Target(s)' : 'Caster / Attacker',
          rollType: isSave ? 'Saving Throw vs Spell Save DC' : 'Attack Roll vs Target AC',
          rollFormula: rule.attackOrSaveLabel || '1d20 + Modifier',
        }
      )
    );
  }

  if (isSummon) {
    steps.push(
      makeBaseStep(
        `${rule.id}-step-spawn`,
        steps.length + 1,
        'SPAWN_TOKEN',
        'Spawn token on map',
        `Places summoned token on the map (${rule.rangeLabel || 'within range'}).`,
        {
          spawnTokenName: nameLower.includes('familiar') ? 'Familiar Token' : `${rule.name} Token`,
          spawnPlacementMode: 'Prompt caster to place token within spell range',
          spawnRangeFt: rule.rangeLabel || 'Within 30 ft',
        }
      )
    );
  }

  if (isTransform) {
    steps.push(
      makeBaseStep(
        `${rule.id}-step-transform`,
        steps.length + 1,
        'CHANGE_TOKEN',
        'Change / shapeshift token',
        'Replaces creature token on the map with the new form.',
        {
          transformTarget: nameLower.includes('polymorph') ? 'Target(s)' : 'Caster / Attacker',
          transformTokenName: nameLower.includes('wild shape')
            ? 'Beast Form Token (Wild Shape)'
            : 'Shapeshifted Creature Token',
          transformHpMode: "Grant form's HP as Temporary HP (revert at 0 HP)",
        }
      )
    );
  }

  if (!isReaction && (rule.category === 'Spells' || rule.category === 'Actions')) {
    steps.push(
      makeBaseStep(
        `${rule.id}-step-branch`,
        steps.length + 1,
        'BRANCH',
        rule.category === 'Spells' ? 'Offer Counterspell / reactions' : 'Offer target reactions',
        'Pause for eligible reactions before applying results.',
        {
          promptMessage: `A creature uses ${rule.name}. Declare a reaction?`,
          reactionOptions:
            rule.category === 'Spells'
              ? ['Counterspell', 'Absorb Elements', 'Shield (+5 AC)']
              : ['Shield (+5 AC)', 'Uncanny Dodge (Half damage)'],
        }
      )
    );
  }

  steps.push(
    makeBaseStep(
      `${rule.id}-step-effect`,
      steps.length + 1,
      'EFFECT',
      'Resolve result',
      `Apply ${rule.damageOrEffectFormula || 'effect'} to target(s).`,
      {
        hitEffects: [
          createEffectItem(
            isSave ? 'If Target Fails Save' : 'On Hit',
            (rule.acBonus ?? 0) > 0 ? 'Grant AC bonus' : 'Apply damage',
            (rule.targetLabel || '').toLowerCase().includes('self') ? 'Caster / Attacker' : 'Target(s)',
            rule.damageOrEffectFormula || '1d8',
            rule.category === 'Spells' ? 'Force' : 'Weapon damage'
          ),
        ],
        missEffects: [
          createEffectItem(
            isSave ? 'If Target Succeeds Save' : 'On Miss',
            isSave ? 'Apply half damage' : 'No damage',
            'Target(s)',
            isSave ? 'Half damage' : '0',
            'None'
          ),
        ],
      }
    )
  );

  return steps;
}

export function ensureRuleResolutionSteps(rule: CampaignActionRule): CampaignActionRule {
  const steps =
    rule.resolutionSteps && rule.resolutionSteps.length > 0
      ? rule.resolutionSteps.map((s, idx) => {
          const rawHits = s.hitEffects && s.hitEffects.length > 0 ? s.hitEffects : (s.thenEffects ?? []);
          const rawMisses = s.missEffects && s.missEffects.length > 0 ? s.missEffects : (s.elseEffects ?? []);
          return {
            ...s,
            order: idx + 1,
            stepType: (s.stepType || 'EFFECT') as ResolutionStepType,
            checkCombiner: s.checkCombiner || s.checkMode || 'ALL',
            requirements: [...(s.requirements ?? [])],
            promptTarget: s.promptTarget || 'Caster / Attacker',
            promptTrigger: s.promptTrigger || 'When casting',
            promptMessage: s.promptMessage || '',
            promptOptions: [...(s.promptOptions ?? [])],
            rollActor: s.rollActor || 'Caster / Attacker',
            rollType: s.rollType || 'Attack Roll vs Target AC',
            rollFormula: s.rollFormula || '',
            reactionAskTarget: s.reactionAskTarget || s.promptTarget || 'Eligible creatures',
            reactionContinueMode: s.reactionContinueMode || s.continueMode || 'After responses or timeout',
            reactionOptions:
              s.reactionOptions && s.reactionOptions.length > 0
                ? [...s.reactionOptions]
                : [...(s.promptOptions ?? [])],
            hitEffects: rawHits.map((e) => ({
              id: e.id || `eff-${idx}`,
              conditionLabel: e.conditionLabel || s.ifCondition || 'On Hit',
              actionVerb: e.actionVerb || 'Apply damage',
              targetActor: e.targetActor || e.targetRecipient || 'Target(s)',
              formula: e.formula ?? e.formulaOrValue ?? '',
              damageType: e.damageType || e.damageOrEffectType || 'Weapon damage',
              targetRecipient: e.targetActor || e.targetRecipient || 'Target(s)',
              formulaOrValue: e.formula ?? e.formulaOrValue ?? '',
              damageOrEffectType: e.damageType || e.damageOrEffectType || 'Weapon damage',
            })),
            missEffects: rawMisses.map((e) => ({
              id: e.id || `eff-miss-${idx}`,
              conditionLabel: e.conditionLabel || s.elseCondition || 'On Miss',
              actionVerb: e.actionVerb || 'No damage',
              targetActor: e.targetActor || e.targetRecipient || 'Target(s)',
              formula: e.formula ?? e.formulaOrValue ?? '0',
              damageType: e.damageType || e.damageOrEffectType || 'None',
              targetRecipient: e.targetActor || e.targetRecipient || 'Target(s)',
              formulaOrValue: e.formula ?? e.formulaOrValue ?? '0',
              damageOrEffectType: e.damageType || e.damageOrEffectType || 'None',
            })),
            spawnTokenName: s.spawnTokenName || '',
            spawnPlacementMode: s.spawnPlacementMode || 'Prompt caster to place token within spell range',
            spawnRangeFt: s.spawnRangeFt || s.spawnRange || 'Within 30 ft',
            spawnController: s.spawnController || 'Caster / Attacker',
            transformTarget: s.transformTarget || s.transformSubject || 'Caster / Attacker',
            transformTokenName: s.transformTokenName || s.transformFormName || '',
            transformSize: s.transformSize || 'Match new form size',
            transformHpMode: s.transformHpMode || "Grant form's HP as Temporary HP (revert at 0 HP)",
          };
        })
      : buildDefaultResolutionSteps(rule);
  return { ...rule, resolutionSteps: steps };
}

export function createStepOfType(
  stepType: ResolutionStepType,
  order: number,
  rule: CampaignActionRule
): ActionResolutionStep {
  const id = `step-${stepType.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const defaults = makeBaseStep(id, order, stepType, 'Check requirements', 'All conditions must pass to continue.', {
    requirements: ['Action available', 'Target in range'],
    promptMessage: `Confirm parameters for ${rule.name}.`,
    promptOptions: ['Standard option'],
    rollFormula: '1d20 + Modifier',
    reactionOptions: ['Shield (+5 AC)', 'Counterspell'],
    hitEffects: [
      createEffectItem('On Hit', 'Apply damage', 'Target(s)', rule.damageOrEffectFormula || '1d8', 'Weapon damage'),
    ],
    missEffects: [createEffectItem('On Miss', 'No damage', 'Target(s)', '0', 'None')],
    spawnTokenName: `${rule.name} Token`,
    spawnPlacementMode: 'Prompt caster to place token within spell range',
    spawnRangeFt: rule.rangeLabel || 'Within 30 ft',
    transformTokenName: 'Beast Form Token (Wild Shape)',
    transformHpMode: "Grant form's HP as Temporary HP (revert at 0 HP)",
  });

  switch (stepType) {
    case 'CHECK':
      return { ...defaults, title: 'Check requirements', subtitle: 'Verify resources, range, and conditions.' };
    case 'PROMPT':
      return { ...defaults, title: 'Prompt caster or target', subtitle: 'Ask player for target, placement, or attack option.' };
    case 'ROLL':
      return { ...defaults, title: 'Roll attack or save', subtitle: '1d20 + modifier vs AC or Save DC.' };
    case 'BRANCH':
      return { ...defaults, title: 'Offer reactions', subtitle: 'Pause for eligible reactions before applying effects.' };
    case 'EFFECT':
      return { ...defaults, title: 'Resolve result', subtitle: 'Apply If / Then / Else damage and effects.' };
    case 'SPAWN_TOKEN':
      return { ...defaults, title: 'Spawn token on map', subtitle: 'Place summoned or conjured token on the battlemap.' };
    case 'CHANGE_TOKEN':
      return { ...defaults, title: 'Change / shapeshift token', subtitle: 'Transform caster or target token into a new creature form.' };
  }
}

export function syncRuleFromResolutionSteps(
  rule: CampaignActionRule,
  rawSteps: ActionResolutionStep[]
): CampaignActionRule {
  const steps = rawSteps.map((step, index) => ({
    ...step,
    order: index + 1,
    checkMode: step.checkCombiner,
    continueMode: step.reactionContinueMode || step.continueMode || 'After responses or timeout',
    promptOptions:
      step.stepType === 'BRANCH' && step.reactionOptions.length > 0
        ? [...step.reactionOptions]
        : [...step.promptOptions],
    ifCondition: step.hitEffects[0]?.conditionLabel || step.ifCondition || 'On Hit',
    thenEffects: step.hitEffects.map((e) => ({
      ...e,
      targetRecipient: e.targetActor,
      formulaOrValue: e.formula,
      damageOrEffectType: e.damageType,
    })),
    elseCondition: step.missEffects[0]?.conditionLabel || step.elseCondition || 'On Miss',
    elseEffects: step.missEffects.map((e) => ({
      ...e,
      targetRecipient: e.targetActor,
      formulaOrValue: e.formula,
      damageOrEffectType: e.damageType,
    })),
    spawnRange: step.spawnRangeFt,
    transformSubject: step.transformTarget,
    transformFormName: step.transformTokenName,
  }));
  const clauses: ActionRuleClause[] = [];
  let primaryFormula = rule.damageOrEffectFormula;

  for (const step of steps) {
    if (step.stepType === 'CHECK' && step.requirements.length > 0) {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'Has',
        combiner: step.checkCombiner === 'ANY' ? 'ANY' : 'ALL',
        tokens: [...step.requirements],
        boundClass: 'CombatSessionStateService',
        boundMethod: 'consumeActionResource',
        notes: step.title,
      });
    } else if (step.stepType === 'PROMPT') {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'When',
        combiner: 'ALL',
        tokens: [`${step.promptTrigger}: Prompt ${step.promptTarget} ("${step.promptMessage}")`],
        boundClass: 'MidiCombatAutomationService',
        boundMethod: 'executeWorkflow',
        notes: step.title,
      });
    } else if (step.stepType === 'ROLL') {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'If',
        combiner: 'ALL',
        tokens: [`${step.rollActor} rolls ${step.rollType} (${step.rollFormula})`],
        boundClass: 'MidiCombatAutomationService',
        boundMethod: 'executeWorkflow',
        notes: step.title,
      });
    } else if (step.stepType === 'BRANCH') {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'When',
        combiner: 'ANY',
        tokens:
          step.reactionOptions.length > 0
            ? step.reactionOptions.map((r) => `Prompt ${step.reactionAskTarget}: ${r}`)
            : [`Prompt ${step.reactionAskTarget} for reaction`],
        boundClass: 'MidiCombatAutomationService',
        boundMethod: 'openReactionWindow',
        notes: step.title,
      });
    } else if (step.stepType === 'SPAWN_TOKEN') {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'Then',
        combiner: 'ALL',
        tokens: [
          `Spawn Token '${step.spawnTokenName}' (${step.spawnPlacementMode}, ${step.spawnRangeFt}, Controlled by ${step.spawnController})`,
        ],
        boundClass: 'MidiCombatAutomationService',
        boundMethod: 'executeWorkflow',
        notes: step.title,
      });
    } else if (step.stepType === 'CHANGE_TOKEN') {
      clauses.push({
        id: `c-${step.id}`,
        keyword: 'Then',
        combiner: 'ALL',
        tokens: [
          `Change Token for ${step.transformTarget} -> '${step.transformTokenName}' (Size: ${step.transformSize}, ${step.transformHpMode})`,
        ],
        boundClass: 'MidiCombatAutomationService',
        boundMethod: 'executeWorkflow',
        notes: step.title,
      });
    } else if (step.stepType === 'EFFECT') {
      const hitTokens = step.hitEffects.map(
        (e) => `${e.conditionLabel}: ${e.actionVerb} -> ${e.targetActor} (${e.formula} ${e.damageType})`
      );
      const missTokens = step.missEffects.map(
        (e) => `${e.conditionLabel}: ${e.actionVerb} -> ${e.targetActor} (${e.formula} ${e.damageType})`
      );
      if (step.hitEffects.length > 0 && step.hitEffects[0].formula) {
        primaryFormula = `${step.hitEffects[0].formula} ${step.hitEffects[0].damageType}`.trim();
      }
      if (hitTokens.length > 0) {
        clauses.push({
          id: `c-${step.id}-then`,
          keyword: 'Then',
          combiner: 'ALL',
          tokens: hitTokens,
          boundClass: 'CombatRuleInterpreter',
          boundMethod: 'ResolveShieldReactionWindow',
          notes: 'Hit / Then Effects',
        });
      }
      if (missTokens.length > 0) {
        clauses.push({
          id: `c-${step.id}-else`,
          keyword: 'Else',
          combiner: 'ALL',
          tokens: missTokens,
          boundClass: 'MidiCombatAutomationService',
          boundMethod: 'executeWorkflow',
          notes: 'Miss / Else Effects',
        });
      }
    }
  }

  return {
    ...rule,
    damageOrEffectFormula: primaryFormula,
    resolutionSteps: steps,
    clauses: clauses.length > 0 ? clauses : rule.clauses,
  };
}
