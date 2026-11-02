import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { ensureRuleResolutionSteps } from './core/models/action-resolution.helpers';
import {
  ActionStudioContext,
  CampaignActionRule,
} from './core/models/action-studio.models';
import { FALLBACK_RULES, FALLBACK_STUDIO_CONTEXT } from './core/models/action-studio.fallback';
import { ActionStudioApiService } from './core/services/action-studio-api.service';
import { LwActionTopNavbarComponent } from './shared/ui/action-top-navbar/action-top-navbar.component';
import { LwBadgeComponent } from './shared/ui/badge/badge.component';
import { LwButtonComponent } from './shared/ui/button/button.component';
import { LwDmAccessGateComponent } from './shared/ui/dm-access-gate/dm-access-gate.component';
import { LwGuidedRuleGroupsComponent } from './shared/ui/guided-rule-groups/guided-rule-groups.component';
import { LwIconComponent } from './shared/ui/icon/icon.component';
import { LwRuleCatalogSidebarComponent } from './shared/ui/rule-catalog-sidebar/rule-catalog-sidebar.component';
import { LwRuleParametersEditorComponent } from './shared/ui/rule-parameters-editor/rule-parameters-editor.component';
import { LwRulePreviewInspectorComponent } from './shared/ui/rule-preview-inspector/rule-preview-inspector.component';

@Component({
  selector: 'lw-action-studio-root',
  standalone: true,
  imports: [
    NgpButton,
    LwActionTopNavbarComponent,
    LwRuleCatalogSidebarComponent,
    LwGuidedRuleGroupsComponent,
    LwRuleParametersEditorComponent,
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
  readonly baselineRule = signal<CampaignActionRule>(ensureRuleResolutionSteps(FALLBACK_RULES[0]));
  readonly activeRule = signal<CampaignActionRule>(ensureRuleResolutionSteps(FALLBACK_RULES[0]));
  readonly savedDrafts = signal<Record<string, CampaignActionRule>>({});
  readonly globalSearchQuery = signal<string>('');

  readonly hasUnsavedChanges = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly creatingCampaign = signal<boolean>(false);
  readonly statusBanner = signal<string | null>(null);

  readonly activeCampaign = computed(() => this.studioContext().activeCampaign);
  readonly canAccess = computed(() => this.studioContext().canAccessActionBuilder);
  readonly rules = computed(() => this.studioContext().rules);
  readonly draftRuleIds = computed(() => Object.keys(this.savedDrafts()));
  readonly canDeleteActiveRule = computed(() =>
    Boolean(this.activeRule()?.isCustomizedForCampaign && !this.activeRule()?.isCoreEngineRule)
  );

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
    const ensured = ensureRuleResolutionSteps(this.cloneRule(rule));
    this.baselineRule.set(ensured);
    const draft = this.savedDrafts()[rule.id];
    this.activeRule.set(draft ? ensureRuleResolutionSteps(this.cloneRule(draft)) : this.cloneRule(ensured));
    this.hasUnsavedChanges.set(Boolean(draft));
  }

  onRuleUpdated(updated: CampaignActionRule): void {
    this.activeRule.set(ensureRuleResolutionSteps(this.cloneRule(updated)));
    this.hasUnsavedChanges.set(true);
  }

  onCreateNewRule(): void {
    const campName = this.activeCampaign()?.name || 'Campaign';
    const customRule = ensureRuleResolutionSteps({
      id: `rule-custom-${Date.now()}`,
      ruleCode: 'Campaign.CustomActionRule',
      name: `New ${campName} Action`,
      category: 'Actions',
      sourceLabel: 'Custom Action',
      rulesetCode: 'dnd5e-2024',
      summary: 'Custom campaign action resolved through the D&D 5e combat engine.',
      actionCost: '1 Action',
      actionType: 'Custom Campaign Action',
      rangeLabel: '30 feet',
      targetLabel: 'One target',
      attackOrSaveLabel: '1d20 + Attack Modifier vs Target AC',
      damageOrEffectFormula: '1d8 + STR/DEX',
      saveDc: 0,
      acBonus: 0,
      durationLabel: 'Instantaneous',
      requiresConcentration: false,
      primaryClassName: 'MidiCombatAutomationService',
      primaryMethodName: 'executeWorkflow',
      sourceFilePath: 'frontend/src/app/services/midi-combat-automation.service.ts',
      clauses: [],
      scalingTiers: [],
      worksWith: [],
      conflictsWith: [],
      tags: ['Action', 'Custom'],
      isCustomizedForCampaign: true,
      isCoreEngineRule: false,
      updatedByUsername: this.studioContext().username,
      updatedAt: new Date().toISOString(),
    });
    this.baselineRule.set(this.cloneRule(customRule));
    this.activeRule.set(customRule);
    this.hasUnsavedChanges.set(true);
    this.statusBanner.set(`Created draft for '${customRule.name}'. Edit the resolution steps below and click Save to campaign.`);
  }

  onApplyRuleToCampaign(): void {
    const camp = this.activeCampaign();
    if (!camp) return;
    this.saving.set(true);
    const payload = ensureRuleResolutionSteps(this.activeRule());
    this.api.applyRuleToCampaign(camp.id, payload, this.selectedAccountId()).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.hasUnsavedChanges.set(false);
        this.statusBanner.set(res.message);
        const saved = ensureRuleResolutionSteps(this.cloneRule(res.rule));
        this.baselineRule.set(saved);
        this.activeRule.set(this.cloneRule(saved));
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
        this.statusBanner.set(err?.error?.error || 'Only the Dungeon Master of this campaign can save rules.');
      },
    });
  }

  onDeleteCustomRule(ruleToDelete?: CampaignActionRule): void {
    const camp = this.activeCampaign();
    const target = ruleToDelete ?? this.activeRule();
    if (!camp || !target) return;
    if (!target.isCustomizedForCampaign || target.isCoreEngineRule) {
      this.statusBanner.set('Core rules cannot be deleted. Only custom campaign actions can be deleted.');
      return;
    }

    const ruleId = target.id;
    const ruleName = target.name;
    const bypassedCoreId = target.bypassesCoreRuleId;

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
          const ensured = ensureRuleResolutionSteps(this.cloneRule(fallback));
          this.baselineRule.set(ensured);
          this.activeRule.set(this.cloneRule(ensured));
        }
        this.hasUnsavedChanges.set(false);
      },
      error: (err) => {
        this.statusBanner.set(err?.error?.error || 'Only custom campaign actions can be deleted.');
      },
    });
  }

  onExportRuleJson(): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(this.activeRule(), null, 2));
      this.statusBanner.set(`Copied JSON for '${this.activeRule().name}' to clipboard.`);
    }
  }

  onCreateOwnDmCampaign(payload: { name: string; rulesetLabel: string }): void {
    this.creatingCampaign.set(true);
    this.api.createQuickDmCampaign(payload.name, payload.rulesetLabel, this.selectedAccountId()).subscribe({
      next: (ctx) => {
        this.creatingCampaign.set(false);
        this.applyLoadedContext(ctx);
        this.statusBanner.set(`Created your DM campaign '${ctx.activeCampaign?.name}'.`);
      },
      error: () => {
        this.creatingCampaign.set(false);
      },
    });
  }

  private applyLoadedContext(ctx: ActionStudioContext): void {
    this.studioContext.set(ctx);
    if (ctx.rules && ctx.rules.length > 0) {
      const currentId = this.activeRule()?.id;
      const preferred =
        ctx.rules.find((r) => r.id === currentId && currentId !== 'rule-shield-reaction') ||
        ctx.rules.find((r) => r.id === 'rule-action-attack') ||
        ctx.rules[0];
      const ensured = ensureRuleResolutionSteps(this.cloneRule(preferred));
      this.baselineRule.set(ensured);
      this.activeRule.set(this.cloneRule(ensured));
    }
    this.hasUnsavedChanges.set(false);
  }

  private cloneRule(rule: CampaignActionRule): CampaignActionRule {
    return JSON.parse(JSON.stringify(rule)) as CampaignActionRule;
  }
}
