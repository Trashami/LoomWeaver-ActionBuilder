import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import {
  ActionStudioContext,
  CampaignActionRule,
  EvaluateRuleLogicRequest,
  EvaluateRuleLogicResponse,
  RuleDraftDiffItem,
  RuleLogicClause,
  WorkspaceTabMode,
} from './core/models/action-studio.models';
import { FALLBACK_RULES, FALLBACK_STUDIO_CONTEXT } from './core/models/action-studio.fallback';
import { ActionStudioApiService } from './core/services/action-studio-api.service';
import { LwActionTopNavbarComponent } from './shared/ui/action-top-navbar/action-top-navbar.component';
import { LwBadgeComponent } from './shared/ui/badge/badge.component';
import { LwButtonComponent } from './shared/ui/button/button.component';
import { LwClauseSentenceEditorComponent } from './shared/ui/clause-sentence-editor/clause-sentence-editor.component';
import { LwDmAccessGateComponent } from './shared/ui/dm-access-gate/dm-access-gate.component';
import { LwGuidedRuleGroupsComponent } from './shared/ui/guided-rule-groups/guided-rule-groups.component';
import { LwIconComponent } from './shared/ui/icon/icon.component';
import { LwRuleCatalogSidebarComponent } from './shared/ui/rule-catalog-sidebar/rule-catalog-sidebar.component';
import { LwRuleParametersEditorComponent } from './shared/ui/rule-parameters-editor/rule-parameters-editor.component';
import { LwRulePreviewInspectorComponent } from './shared/ui/rule-preview-inspector/rule-preview-inspector.component';
import { LwRuleTestSandboxComponent } from './shared/ui/rule-test-sandbox/rule-test-sandbox.component';

@Component({
  selector: 'lw-action-studio-root',
  standalone: true,
  imports: [
    NgpButton,
    LwActionTopNavbarComponent,
    LwRuleCatalogSidebarComponent,
    LwGuidedRuleGroupsComponent,
    LwRuleParametersEditorComponent,
    LwRuleTestSandboxComponent,
    LwClauseSentenceEditorComponent,
    LwRulePreviewInspectorComponent,
    LwDmAccessGateComponent,
    LwButtonComponent,
    LwBadgeComponent,
    LwIconComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionStudioAppComponent implements OnInit {
  private readonly api = inject(ActionStudioApiService);

  readonly studioContext = signal<ActionStudioContext>(FALLBACK_STUDIO_CONTEXT);
  readonly selectedAccountId = signal<string>('acc-gm-geojason');
  readonly baselineRule = signal<CampaignActionRule>(FALLBACK_RULES[0]);
  readonly activeRule = signal<CampaignActionRule>(FALLBACK_RULES[0]);
  readonly savedDrafts = signal<Record<string, CampaignActionRule>>({});
  readonly workspaceTab = signal<WorkspaceTabMode>('build');
  readonly activeCategory = signal<string>('All');
  readonly globalSearchQuery = signal<string>('');
  readonly secondaryMenuOpen = signal<boolean>(false);

  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly creatingCampaign = signal<boolean>(false);
  readonly evaluating = signal<boolean>(false);
  readonly evaluationResult = signal<EvaluateRuleLogicResponse | null>(null);
  readonly statusBanner = signal<string | null>(null);

  readonly activeCampaign = computed(() => this.studioContext().activeCampaign);
  readonly canAccess = computed(() => this.studioContext().canAccessActionBuilder);
  readonly rules = computed(() => this.studioContext().rules);
  readonly draftRuleIds = computed(() => Object.keys(this.savedDrafts()));
  readonly hasDraftForCurrent = computed(() => Boolean(this.savedDrafts()[this.activeRule().id]));
  readonly canDeleteActiveRule = computed(() =>
    Boolean(this.activeRule()?.isCustomizedForCampaign && !this.activeRule()?.isCoreEngineRule)
  );

  readonly draftDiffs = computed<RuleDraftDiffItem[]>(() => {
    const base = this.baselineRule();
    const cur = this.activeRule();
    if (!base || !cur) return [];
    const diffs: RuleDraftDiffItem[] = [];
    if (base.name !== cur.name) diffs.push({ label: 'Name', before: base.name, after: cur.name });
    if (base.actionCost !== cur.actionCost) diffs.push({ label: 'Action Cost', before: base.actionCost, after: cur.actionCost });
    if (base.acBonus !== cur.acBonus) diffs.push({ label: 'AC Bonus', before: `+${base.acBonus}`, after: `+${cur.acBonus}` });
    if (base.saveDc !== cur.saveDc) diffs.push({ label: 'Save DC', before: `DC ${base.saveDc}`, after: `DC ${cur.saveDc}` });
    if (base.rangeLabel !== cur.rangeLabel) diffs.push({ label: 'Range', before: base.rangeLabel, after: cur.rangeLabel });
    if (base.durationLabel !== cur.durationLabel) diffs.push({ label: 'Duration', before: base.durationLabel, after: cur.durationLabel });
    if (base.damageOrEffectFormula !== cur.damageOrEffectFormula) {
      diffs.push({ label: 'Outcome Formula', before: base.damageOrEffectFormula, after: cur.damageOrEffectFormula });
    }
    const baseTrigger = this.summarizeClauseType(base, 'when');
    const curTrigger = this.summarizeClauseType(cur, 'when');
    if (baseTrigger !== curTrigger) diffs.push({ label: 'Trigger', before: baseTrigger, after: curTrigger });

    const baseReq = this.summarizeRequirements(base);
    const curReq = this.summarizeRequirements(cur);
    if (baseReq !== curReq) diffs.push({ label: 'Requirements', before: baseReq, after: curReq });

    const baseEff = this.summarizeClauseType(base, 'then');
    const curEff = this.summarizeClauseType(cur, 'then');
    if (baseEff !== curEff) diffs.push({ label: 'Effects', before: baseEff, after: curEff });

    return diffs;
  });

  ngOnInit(): void {
    let initialCampaignId: number | null = null;
    let initialAccount: string | null = null;
    if (typeof window !== 'undefined') {
      if (window.location.pathname && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/' + window.location.search);
      }
      const params = new URLSearchParams(window.location.search);
      const cidParam = params.get('campaignId');
      if (cidParam && !Number.isNaN(Number(cidParam))) initialCampaignId = Number(cidParam);
      const accParam = params.get('accountId');
      if (accParam) {
        initialAccount = accParam;
        this.selectedAccountId.set(accParam);
      }
    }
    this.fetchContext(initialCampaignId, initialAccount);
  }

  fetchContext(campaignId?: number | null, accountId?: string | null): void {
    const resolvedAccount = accountId ?? this.selectedAccountId();
    this.api.loadStudioContext(campaignId, resolvedAccount).subscribe((ctx) => {
      this.applyLoadedContext(ctx);
    });
  }

  onCampaignSelected(campaignId: number): void {
    this.statusBanner.set(null);
    this.fetchContext(campaignId, this.selectedAccountId());
  }

  onAccountSwitched(accountId: string): void {
    this.selectedAccountId.set(accountId);
    this.statusBanner.set(null);
    this.fetchContext(1, accountId);
  }

  onRuleSelected(rule: CampaignActionRule): void {
    this.baselineRule.set(this.cloneRule(rule));
    const draft = this.savedDrafts()[rule.id];
    this.activeRule.set(this.cloneRule(draft ?? rule));
    this.hasUnsavedChanges.set(Boolean(draft));
    this.secondaryMenuOpen.set(false);
    this.runDefaultEvaluationForRule(draft ?? rule);
  }

  onRuleUpdated(updated: CampaignActionRule): void {
    this.activeRule.set(this.cloneRule(updated));
    this.hasUnsavedChanges.set(true);
  }

  onClausesChanged(clauses: RuleLogicClause[]): void {
    this.activeRule.update((curr) => ({
      ...curr,
      clauses: clauses.map((c) => ({ ...c, tokens: [...c.tokens] })),
    }));
    this.hasUnsavedChanges.set(true);
  }

  onPrimaryBindingChanged(binding: { primaryClassName: string; primaryMethodName: string; sourceFilePath: string }): void {
    this.activeRule.update((curr) => ({
      ...curr,
      primaryClassName: binding.primaryClassName,
      primaryMethodName: binding.primaryMethodName,
      sourceFilePath: binding.sourceFilePath || curr.sourceFilePath,
    }));
    this.hasUnsavedChanges.set(true);
  }

  onSaveDraft(): void {
    const rule = this.cloneRule(this.activeRule());
    this.savedDrafts.update((map) => ({ ...map, [rule.id]: rule }));
    this.statusBanner.set(
      `Saved working draft for '${rule.name}'. Review the change summary on the right before applying to ${this.activeCampaign()?.name || 'your campaign'}.`
    );
  }

  onDiscardDraft(): void {
    const id = this.activeRule().id;
    this.savedDrafts.update((map) => {
      const next = { ...map };
      delete next[id];
      return next;
    });
    this.activeRule.set(this.cloneRule(this.baselineRule()));
    this.hasUnsavedChanges.set(false);
    this.secondaryMenuOpen.set(false);
    this.statusBanner.set(`Reverted unsaved draft changes for '${this.baselineRule().name}'.`);
  }

  onDuplicateRule(): void {
    const base = this.activeRule();
    const copy: CampaignActionRule = {
      ...this.cloneRule(base),
      id: `rule-copy-${Date.now()}`,
      name: `${base.name} (Campaign Variant)`,
      sourceLabel: 'Custom Action',
      isCustomizedForCampaign: true,
      isCoreEngineRule: false,
    };
    this.baselineRule.set(this.cloneRule(base));
    this.activeRule.set(copy);
    this.hasUnsavedChanges.set(true);
    this.secondaryMenuOpen.set(false);
    this.statusBanner.set(`Duplicated '${base.name}' as a new custom action draft.`);
  }

  onCreateNewRule(): void {
    const campName = this.activeCampaign()?.name || 'Campaign';
    const customRule: CampaignActionRule = {
      id: `rule-custom-${Date.now()}`,
      ruleCode: 'Campaign.CustomActionRule',
      name: `New ${campName} Ability`,
      category: 'Actions',
      sourceLabel: 'Custom Action',
      rulesetCode: 'dnd5e-2024',
      summary: 'Describe what this ability does at the table and when it can be used.',
      actionCost: '1 Reaction',
      actionType: 'Custom Campaign Ability',
      rangeLabel: 'Self',
      targetLabel: 'Self',
      attackOrSaveLabel: 'Interrupts Attack Roll vs AC',
      damageOrEffectFormula: '+5 AC until start of next turn',
      saveDc: 0,
      acBonus: 5,
      durationLabel: 'Until the start of your next turn',
      requiresConcentration: false,
      primaryClassName: 'CombatRuleInterpreter',
      primaryMethodName: 'ResolveShieldReactionWindow',
      sourceFilePath: 'LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs',
      clauses: [
        {
          id: `c-${Date.now()}-1`,
          keyword: 'When',
          combiner: 'ANY',
          tokens: ['An attack hits you'],
          boundClass: 'MidiCombatAutomationService',
          boundMethod: 'openReactionWindow',
          notes: 'Trigger condition',
        },
        {
          id: `c-${Date.now()}-2`,
          keyword: 'Has',
          combiner: 'ALL',
          tokens: ['Reaction available', 'Appropriate 1st-level spell slot available'],
          boundClass: 'CombatSessionStateService',
          boundMethod: 'consumeActionResource',
          notes: 'Resource requirement',
        },
        {
          id: `c-${Date.now()}-3`,
          keyword: 'Then',
          combiner: 'ALL',
          tokens: [
            'Spend the required resources (1 Reaction + 1st-level Spell Slot)',
            'Grant +5 AC until the start of your next turn',
            'Resolve the triggering attack or Magic Missile interaction',
          ],
          boundClass: 'CombatRuleInterpreter',
          boundMethod: 'ResolveShieldReactionWindow',
          notes: 'Effects',
        },
      ],
      scalingTiers: [{ levelRange: '1-4', diceOrValue: 'Self', label: 'Base Tier', summary: '+5 AC until start of your next turn.' }],
      worksWith: ['Mage Armor'],
      conflictsWith: ['Incapacitated'],
      tags: ['Reaction', 'Custom'],
      isCustomizedForCampaign: true,
      isCoreEngineRule: false,
      updatedByUsername: this.studioContext().username,
      updatedAt: new Date().toISOString(),
    };
    this.baselineRule.set(this.cloneRule(customRule));
    this.activeRule.set(customRule);
    this.workspaceTab.set('build');
    this.hasUnsavedChanges.set(true);
    this.statusBanner.set(`Drafting new custom action for ${campName}.`);
  }

  onApplyRuleToCampaign(): void {
    const camp = this.activeCampaign();
    if (!camp) return;
    this.saving.set(true);
    this.api.applyRuleToCampaign(camp.id, this.activeRule(), this.selectedAccountId()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.hasUnsavedChanges.set(false);
        this.statusBanner.set(res.message);
        this.baselineRule.set(this.cloneRule(res.rule));
        this.activeRule.set(this.cloneRule(res.rule));
        this.savedDrafts.update((map) => {
          const next = { ...map };
          delete next[res.rule.id];
          return next;
        });
        this.studioContext.update((ctx) => {
          const nextRules =
            res.rules && res.rules.length > 0
              ? res.rules
              : ctx.rules.some((r) => r.id === res.rule.id)
                ? ctx.rules.map((r) => (r.id === res.rule.id ? res.rule : r))
                : [res.rule, ...ctx.rules];
          return {
            ...ctx,
            activeCampaign: ctx.activeCampaign ? { ...ctx.activeCampaign, customizedRuleCount: res.customizedRuleCount } : null,
            dmCampaigns: ctx.dmCampaigns.map((c) => (c.id === res.campaignId ? { ...c, customizedRuleCount: res.customizedRuleCount } : c)),
            rules: nextRules,
          };
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.statusBanner.set(err?.error?.error || 'Only the Dungeon Master of this campaign can apply rules.');
      },
    });
  }

  onDeleteCustomRule(ruleToDelete?: CampaignActionRule): void {
    const camp = this.activeCampaign();
    const target = ruleToDelete ?? this.activeRule();
    if (!camp || !target) return;
    if (!target.isCustomizedForCampaign || target.isCoreEngineRule) {
      this.statusBanner.set('Core Engine SQL actions cannot be deleted. Only custom campaign actions can be deleted.');
      return;
    }

    const ruleId = target.id;
    const ruleName = target.name;
    const bypassedCoreId = target.bypassesCoreRuleId;
    this.secondaryMenuOpen.set(false);

    this.savedDrafts.update((map) => {
      const next = { ...map };
      delete next[ruleId];
      return next;
    });

    this.api.deleteCustomRule(camp.id, ruleId, this.selectedAccountId()).subscribe({
      next: (res) => {
        const nextRules = res.rules.filter((r) => r.id !== ruleId);
        const customCount = nextRules.filter((r) => r.isCustomizedForCampaign && !r.isCoreEngineRule).length;
        this.statusBanner.set(`Deleted custom action '${ruleName}' from ${camp.name}.`);
        this.studioContext.update((ctx) => ({
          ...ctx,
          activeCampaign: ctx.activeCampaign ? { ...ctx.activeCampaign, customizedRuleCount: customCount } : null,
          dmCampaigns: ctx.dmCampaigns.map((c) => (c.id === camp.id ? { ...c, customizedRuleCount: customCount } : c)),
          rules: nextRules,
        }));
        const fallback = (bypassedCoreId && nextRules.find((r) => r.id === bypassedCoreId)) || nextRules[0];
        if (fallback && this.activeRule().id === ruleId) {
          this.baselineRule.set(this.cloneRule(fallback));
          this.activeRule.set(this.cloneRule(fallback));
        }
        this.hasUnsavedChanges.set(false);
      },
      error: (err) => {
        this.statusBanner.set(err?.error?.error || 'Only custom campaign actions can be deleted.');
      },
    });
  }

  onExportRuleJson(): void {
    this.secondaryMenuOpen.set(false);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(this.activeRule(), null, 2));
      this.statusBanner.set(`Copied portable JSON for '${this.activeRule().name}' to clipboard.`);
    }
  }

  openTestTabAndRun(): void {
    this.workspaceTab.set('test');
    this.runDefaultEvaluationForRule(this.activeRule());
  }

  onCreateOwnDmCampaign(payload: { name: string; rulesetLabel: string }): void {
    this.creatingCampaign.set(true);
    this.api.createQuickDmCampaign(payload.name, payload.rulesetLabel, this.selectedAccountId()).subscribe({
      next: (ctx) => {
        this.creatingCampaign.set(false);
        this.applyLoadedContext(ctx);
        this.statusBanner.set(`Created your DM campaign '${ctx.activeCampaign?.name}' and defaulted ActionBuilder to it.`);
      },
      error: () => {
        this.creatingCampaign.set(false);
      },
    });
  }

  onRunSimulation(req: EvaluateRuleLogicRequest): void {
    this.evaluating.set(true);
    this.api.evaluateRuleLogic(req).subscribe({
      next: (res) => {
        this.evaluating.set(false);
        this.evaluationResult.set(res);
      },
      error: () => {
        this.evaluating.set(false);
      },
    });
  }

  private runDefaultEvaluationForRule(rule: CampaignActionRule): void {
    this.onRunSimulation({
      campaignId: this.activeCampaign()?.id || 1,
      ruleId: rule.id,
      ruleName: rule.name,
      primaryClassName: rule.primaryClassName,
      primaryMethodName: rule.primaryMethodName,
      clauses: rule.clauses,
      actionCost: rule.actionCost,
      damageOrEffectFormula: rule.damageOrEffectFormula,
      saveDc: rule.saveDc,
      acBonus: rule.acBonus,
      attackerName: 'Vaelkorath (Boss)',
      defenderName: 'Kycius',
      attackRollTotal: 17,
      targetAc: 15,
      distanceFeet: 30,
      reactionAvailable: true,
      hasSpellSlot: true,
      damageRolled: 11,
      isMagicMissile: false,
    });
  }

  private applyLoadedContext(ctx: ActionStudioContext): void {
    this.studioContext.set(ctx);
    if (ctx.rules && ctx.rules.length > 0) {
      const currentId = this.activeRule()?.id;
      const keep = ctx.rules.find((r) => r.id === currentId) || ctx.rules[0];
      this.baselineRule.set(this.cloneRule(keep));
      this.activeRule.set(this.cloneRule(keep));
      this.runDefaultEvaluationForRule(keep);
    }
    this.hasUnsavedChanges.set(false);
  }

  private summarizeClauseType(rule: CampaignActionRule, kwLower: string): string {
    const c = rule.clauses.find((x) => x.keyword.toLowerCase() === kwLower);
    if (!c) return 'None';
    const joiner = (c.combiner || 'ALL') === 'ANY' ? ' OR ' : ' AND ';
    return c.tokens.join(joiner);
  }

  private summarizeRequirements(rule: CampaignActionRule): string {
    const reqs = rule.clauses.filter((c) => ['has', 'contains', 'where', 'if', 'has not'].includes(c.keyword.toLowerCase()));
    if (reqs.length === 0) return 'None';
    const combiner = (reqs[0].combiner || 'ALL') === 'ANY' ? ' OR ' : ' AND ';
    return reqs.flatMap((c) => c.tokens).join(combiner);
  }

  private cloneRule(rule: CampaignActionRule): CampaignActionRule {
    return JSON.parse(JSON.stringify(rule)) as CampaignActionRule;
  }
}
