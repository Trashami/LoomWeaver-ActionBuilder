import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { CampaignActionRule } from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-catalog-sidebar',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent, LwBadgeComponent],
  templateUrl: './rule-catalog-sidebar.component.html',
  styleUrl: './rule-catalog-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleCatalogSidebarComponent {
  readonly rules = input<CampaignActionRule[]>([]);
  readonly selectedRuleId = input<string>('');
  readonly externalCategory = input<string>('All');
  readonly globalSearch = input<string>('');
  readonly draftRuleIds = input<string[]>([]);
  readonly campaignName = input<string>('Shadow of the Mountain');

  readonly searchQuery = model<string>('');
  readonly activeSourceFilter = model<'all' | 'custom' | 'srd'>('all');

  readonly ruleSelected = output<CampaignActionRule>();

  readonly allCount = computed(() => this.rules().length);
  readonly customCount = computed(
    () => this.rules().filter((r) => r.isCustomizedForCampaign && !r.isCoreEngineRule).length
  );
  readonly coreCount = computed(
    () => this.rules().filter((r) => r.isCoreEngineRule !== false && !r.isCustomizedForCampaign).length
  );

  readonly filteredRules = computed(() => {
    const localQ = (this.searchQuery() || '').trim().toLowerCase();
    const globalQ = (this.globalSearch() || '').trim().toLowerCase();
    const q = localQ || globalQ;
    const src = this.activeSourceFilter();
    const cat = this.externalCategory();

    return this.rules().filter((r) => {
      const isCustom = r.isCustomizedForCampaign && !r.isCoreEngineRule;
      if (src === 'custom' && !isCustom) return false;
      if (src === 'srd' && isCustom) return false;

      if (cat && cat !== 'All') {
        if (cat === 'Campaign Custom') {
          if (!isCustom && r.category !== 'Campaign Custom') return false;
        } else if (!r.category.toLowerCase().includes(cat.toLowerCase())) {
          return false;
        }
      }
      if (!q) return true;

      return (
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.actionCost.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.ruleCode.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  });

  hasDraft(ruleId: string): boolean {
    return this.draftRuleIds().includes(ruleId);
  }
}
