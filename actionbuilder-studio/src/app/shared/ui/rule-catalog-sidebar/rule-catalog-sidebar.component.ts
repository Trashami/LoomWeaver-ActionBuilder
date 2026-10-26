import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CampaignActionRule } from '../../../core/models/action-studio.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-rule-catalog-sidebar',
  standalone: true,
  imports: [FormsModule, LwIconComponent, LwButtonComponent, LwBadgeComponent],
  templateUrl: './rule-catalog-sidebar.component.html',
  styleUrl: './rule-catalog-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwRuleCatalogSidebarComponent {
  readonly rules = input<CampaignActionRule[]>([]);
  readonly selectedRuleId = input<string>('');
  readonly searchQuery = model<string>('');
  readonly activeSourceFilter = model<'all' | 'modified' | 'core'>('all');
  readonly activeCategory = model<string>('All Categories');

  readonly ruleSelected = output<CampaignActionRule>();

  readonly categories = [
    'All Categories',
    'Reactions & Interrupts',
    'Core Rules',
    'Movement & Terrain',
    'Saving Throws & Vitals',
    'Class & Party Actions',
    'Campaign Custom',
  ];

  readonly filteredRules = computed(() => {
    const q = (this.searchQuery() || '').trim().toLowerCase();
    const src = this.activeSourceFilter();
    const cat = this.activeCategory();

    return this.rules().filter((r) => {
      if (src === 'modified' && !r.isCustomizedForCampaign) return false;
      if (src === 'core' && r.isCustomizedForCampaign) return false;
      if (cat !== 'All Categories' && r.category !== cat) return false;
      if (!q) return true;

      return (
        r.name.toLowerCase().includes(q) ||
        r.ruleCode.toLowerCase().includes(q) ||
        r.primaryClassName.toLowerCase().includes(q) ||
        r.primaryMethodName.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
      );
    });
  });

  readonly modifiedCount = computed(
    () => this.rules().filter((r) => r.isCustomizedForCampaign).length
  );
}
