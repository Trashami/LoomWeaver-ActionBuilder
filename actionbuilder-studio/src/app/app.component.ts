import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ActionStudioContext,
  CampaignActionRule,
  EvaluateRuleLogicRequest,
  EvaluateRuleLogicResponse,
  RuleLogicClause,
} from './core/models/action-studio.models';
import {
  FALLBACK_RULES,
  FALLBACK_STUDIO_CONTEXT,
} from './core/models/action-studio.fallback';
import { ActionStudioApiService } from './core/services/action-studio-api.service';
import { LwActionTopNavbarComponent } from './shared/ui/action-top-navbar/action-top-navbar.component';
import { LwBadgeComponent } from './shared/ui/badge/badge.component';
import { LwClauseSentenceEditorComponent } from './shared/ui/clause-sentence-editor/clause-sentence-editor.component';
import { LwDmAccessGateComponent } from './shared/ui/dm-access-gate/dm-access-gate.component';
import { LwIconComponent } from './shared/ui/icon/icon.component';
import { LwRuleCatalogSidebarComponent } from './shared/ui/rule-catalog-sidebar/rule-catalog-sidebar.component';
import { LwRuleParametersEditorComponent } from './shared/ui/rule-parameters-editor/rule-parameters-editor.component';
import { LwRulePreviewInspectorComponent } from './shared/ui/rule-preview-inspector/rule-preview-inspector.component';

@Component({
  selector: 'lw-action-studio-root',
  standalone: true,
  imports: [
    LwActionTopNavbarComponent,
    LwRuleCatalogSidebarComponent,
    LwRuleParametersEditorComponent,
    LwClauseSentenceEditorComponent,
    LwRulePreviewInspectorComponent,
    LwDmAccessGateComponent,
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
  readonly activeRule = signal<CampaignActionRule>(FALLBACK_RULES[0]);
  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly creatingCampaign = signal<boolean>(false);
  readonly evaluating = signal<boolean>(false);
  readonly evaluationResult = signal<EvaluateRuleLogicResponse | null>(null);
  readonly statusBanner = signal<string | null>(null);

  readonly activeCampaign = computed(() => this.studioContext().activeCampaign);
  readonly canAccess = computed(() => this.studioContext().canAccessActionBuilder);
  readonly rules = computed(() => this.studioContext().rules);

  ngOnInit(): void {
    let initialCampaignId: number | null = null;
    let initialAccount: string | null = null;
    if (typeof window !== 'undefined') {
      if (window.location.pathname && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/' + window.location.search);
      }
      const params = new URLSearchParams(window.location.search);
      const cidParam = params.get('campaignId');
      if (cidParam && !Number.isNaN(Number(cidParam))) {
        initialCampaignId = Number(cidParam);
      }
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
    // Pass campaignId = 1 when switching to a player account so the backend demonstrates
    // filtering out Campaign 1 and defaulting to the player's own DM campaign (or blocking if none).
    const requestedCid = accountId === 'acc-gm-geojason' ? 1 : 1;
    this.fetchContext(requestedCid, accountId);
  }

  onRuleSelected(rule: CampaignActionRule): void {
    this.activeRule.set(this.cloneRule(rule));
    this.hasUnsavedChanges.set(false);
    this.evaluationResult.set(null);
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

  onCreateNewRule(): void {
    const campName = this.activeCampaign()?.name || 'Campaign';
    const customRule: CampaignActionRule = {
      id: `rule-custom-${Date.now()}`,
      ruleCode: 'Campaign.CustomActionRule',
      name: `Custom ${campName} Rule`,
      category: 'Campaign Custom',
      sourceLabel: 'Campaign Modified',
      rulesetCode: 'dnd5e-2024',
      summary: 'Custom campaign-scoped combat rule bound to the LoomWeaver Rules Engine.',
      actionCost: '1 Reaction',
      actionType: 'Custom Campaign Rule',
      rangeLabel: '60 ft',
      targetLabel: '1 Creature in Sight',
      attackOrSaveLabel: 'Triggered Reaction / Save',
      damageOrEffectFormula: '2d8 + 4 Force',
      saveDc: 15,
      acBonus: 2,
      durationLabel: '1 Round',
      requiresConcentration: false,
      primaryClassName: 'CombatRuleInterpreter',
      primaryMethodName: 'ResolveShieldReactionWindow',
      sourceFilePath: 'LoomWeaver.Modules/ActionStudio/Engine/CombatRuleEngineInterpreter.cs',
      clauses: [
        {
          id: `c-${Date.now()}-1`,
          keyword: 'When',
          tokens: ['Attack Roll Hits Self'],
          boundClass: 'MidiCombatAutomationService',
          boundMethod: 'openReactionWindow',
          notes: 'Opens reaction window on incoming attack.',
        },
        {
          id: `c-${Date.now()}-2`,
          keyword: 'Contains',
          tokens: ["Action.Tags Contains 'Reaction'"],
          boundClass: 'CombatRuleInterpreter',
          boundMethod: 'ResolveShieldReactionWindow',
          notes: 'Checks reaction tag membership.',
        },
        {
          id: `c-${Date.now()}-3`,
          keyword: 'If',
          tokens: ['Reaction Available', 'AttackTotal >= TargetAC'],
          boundClass: 'CombatRuleInterpreter',
          boundMethod: 'ResolveShieldReactionWindow',
          notes: 'Verifies reaction availability and hit threshold.',
        },
        {
          id: `c-${Date.now()}-4`,
          keyword: 'Then',
          tokens: ['Consume Reaction & Grant +5 AC'],
          boundClass: 'CombatRuleInterpreter',
          boundMethod: 'ResolveShieldReactionWindow',
          notes: 'Applies campaign rule outcome.',
        },
      ],
      scalingTiers: [
        {
          levelRange: 'Levels 1-10',
          diceOrValue: '+2 AC / 2d8',
          label: 'Base Tier',
          summary: 'Standard campaign rule scaling.',
        },
      ],
      worksWith: ['Mage Armor', 'War Caster'],
      conflictsWith: ['Incapacitated'],
      tags: ['Campaign Custom', 'Reaction'],
      isCustomizedForCampaign: true,
      updatedByUsername: this.studioContext().username,
      updatedAt: new Date().toISOString(),
    };
    this.activeRule.set(customRule);
    this.hasUnsavedChanges.set(true);
    this.statusBanner.set(`Drafting new custom rule for ${campName}. Click 'Apply to ${campName}' to save.`);
  }

  onApplyRuleToCampaign(): void {
    const camp = this.activeCampaign();
    if (!camp) return;
    this.saving.set(true);
    this.api
      .applyRuleToCampaign(camp.id, this.activeRule(), this.selectedAccountId())
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.hasUnsavedChanges.set(false);
          this.statusBanner.set(res.message);
          this.activeRule.set(this.cloneRule(res.rule));
          this.studioContext.update((ctx) => {
            const exists = ctx.rules.some((r) => r.id === res.rule.id);
            const nextRules = exists
              ? ctx.rules.map((r) => (r.id === res.rule.id ? res.rule : r))
              : [res.rule, ...ctx.rules];
            const nextActive = ctx.activeCampaign
              ? { ...ctx.activeCampaign, customizedRuleCount: res.customizedRuleCount }
              : null;
            return {
              ...ctx,
              activeCampaign: nextActive,
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

  onResetCurrentRule(): void {
    const camp = this.activeCampaign();
    if (!camp) return;
    const ruleId = this.activeRule().id;
    this.api.resetRuleToDefault(camp.id, ruleId, this.selectedAccountId()).subscribe({
      next: (res) => {
        this.statusBanner.set(res.message);
        this.studioContext.update((ctx) => ({ ...ctx, rules: res.rules }));
        const match = res.rules.find((r) => r.id === ruleId) || res.rules[0];
        if (match) {
          this.activeRule.set(this.cloneRule(match));
        }
        this.hasUnsavedChanges.set(false);
      },
    });
  }

  onCreateOwnDmCampaign(payload: { name: string; rulesetLabel: string }): void {
    this.creatingCampaign.set(true);
    this.api
      .createQuickDmCampaign(payload.name, payload.rulesetLabel, this.selectedAccountId())
      .subscribe({
        next: (ctx) => {
          this.creatingCampaign.set(false);
          this.applyLoadedContext(ctx);
          this.statusBanner.set(
            `Created your DM campaign '${ctx.activeCampaign?.name}' and defaulted ActionBuilder to it.`
          );
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

  private applyLoadedContext(ctx: ActionStudioContext): void {
    this.studioContext.set(ctx);
    if (ctx.rules && ctx.rules.length > 0) {
      const currentId = this.activeRule()?.id;
      const keep = ctx.rules.find((r) => r.id === currentId) || ctx.rules[0];
      this.activeRule.set(this.cloneRule(keep));
    }
    this.hasUnsavedChanges.set(false);
    this.evaluationResult.set(null);
  }

  private cloneRule(rule: CampaignActionRule): CampaignActionRule {
    return JSON.parse(JSON.stringify(rule)) as CampaignActionRule;
  }
}
