import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { CampaignActionRule } from '../../../core/models/action-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-catalog-sidebar',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpInput, LwIconComponent],
  templateUrl: './rule-catalog-sidebar.component.html',
  styleUrl: './rule-catalog-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleCatalogSidebarComponent {
  readonly rules = input<CampaignActionRule[]>([]);
  readonly selectedRuleId = input<string>('');
  readonly globalSearch = input<string>('');
  readonly draftRuleIds = input<string[]>([]);
  readonly campaignName = input<string>('Shadow of the Mountain');

  readonly searchQuery = model<string>('');
  readonly activeTypeFilter = model<string>('all');
  readonly activeSourceFilter = model<'all' | 'custom' | 'srd'>('all');
  readonly visibleLimit = signal<number>(120);

  readonly ruleSelected = output<CampaignActionRule>();
  readonly deleteCustomRule = output<CampaignActionRule>();

  readonly allCount = computed(() => this.rules().length);
  readonly customCount = computed(
    () => this.rules().filter((r) => r.isCustomizedForCampaign && !r.isCoreEngineRule).length
  );

  readonly filteredRules = computed(() => {
    const localQ = (this.searchQuery() || '').trim().toLowerCase();
    const globalQ = (this.globalSearch() || '').trim().toLowerCase();
    const q = localQ || globalQ;
    const src = this.activeSourceFilter();
    const typeFilter = this.activeTypeFilter();

    return this.rules().filter((r) => {
      const isCustom = r.isCustomizedForCampaign && !r.isCoreEngineRule;
      if (src === 'custom' && !isCustom) return false;
      if (src === 'srd' && isCustom) return false;

      if (typeFilter !== 'all') {
        const label = this.shortTypeLabel(r).toLowerCase();
        if (label !== typeFilter.toLowerCase()) return false;
      }

      if (!q) return true;

      return (
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.actionCost.toLowerCase().includes(q) ||
        r.actionType.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  });

  readonly visibleRules = computed(() => this.filteredRules().slice(0, this.visibleLimit()));
  readonly hasMoreRules = computed(() => this.filteredRules().length > this.visibleLimit());

  shortTypeLabel(rule: CampaignActionRule): string {
    const cat = (rule.category || '').toLowerCase();
    const cost = (rule.actionCost || '').toLowerCase();
    const name = (rule.name || '').toLowerCase();
    if (name.includes('concentration')) return 'Save';
    if (cat === 'spells') return 'Spell';
    if (cat.includes('feature')) return 'Feature';
    if (cat.includes('condition')) return 'Save';
    if (cost.includes('reaction')) return 'Reaction';
    if (cost.includes('bonus')) return 'Bonus Action';
    return 'Action';
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.visibleLimit.set(120);
  }

  onTypeFilterChange(value: string): void {
    this.activeTypeFilter.set(value);
    this.visibleLimit.set(120);
  }

  onSourceFilterChange(filter: 'all' | 'custom' | 'srd'): void {
    this.activeSourceFilter.set(filter);
    this.visibleLimit.set(120);
  }

  onListScroll(event: Event): void {
    const el = event.target as HTMLElement | null;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
      if (this.visibleLimit() < this.filteredRules().length) {
        this.visibleLimit.update((n) => n + 120);
      }
    }
  }

  showMore(): void {
    this.visibleLimit.update((n) => n + 200);
  }

  onDeleteCustomClick(event: Event, rule: CampaignActionRule): void {
    event.stopPropagation();
    if (!rule.isCustomizedForCampaign || rule.isCoreEngineRule) return;
    this.deleteCustomRule.emit(rule);
  }
}
