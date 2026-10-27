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

  readonly searchQuery = model<string>('');
  readonly activeSourceFilter = model<'all' | 'custom' | 'srd'>('all');

  readonly ruleSelected = output<CampaignActionRule>();

  readonly filteredRules = computed(() => {
    const localQ = (this.searchQuery() || '').trim().toLowerCase();
    const globalQ = (this.globalSearch() || '').trim().toLowerCase();
    const q = localQ || globalQ;
    const src = this.activeSourceFilter();
    const cat = this.externalCategory();

    return this.rules().filter((r) => {
      if (src === 'custom' && !r.isCustomizedForCampaign) return false;
      if (src === 'srd' && r.isCustomizedForCampaign) return false;
      if (cat && cat !== 'All') {
        if (cat === 'Campaign Custom') {
          if (!r.isCustomizedForCampaign && r.category !== 'Campaign Custom') return false;
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
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  });

  hasDraft(ruleId: string): boolean {
    return this.draftRuleIds().includes(ruleId);
  }
}
