import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

export interface LwCompendiumEntryItem {
  readonly id: string;
  readonly name: string;
  readonly category: 'Spell' | 'Equipment' | 'Feat' | string;
  readonly systemCode: string;
  readonly levelOrTier: string;
  readonly actionEconomy: string;
  readonly summary: string;
  readonly mechanicalPayload: string;
}

@Component({
  selector: 'lw-compendium-importer',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent],
  templateUrl: './compendium-importer.component.html',
  styleUrl: './compendium-importer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCompendiumImporterComponent {
  readonly entries = input.required<readonly LwCompendiumEntryItem[]>();
  readonly targetLabel = input<string>('Active Adventurer Sheet');
  readonly entryImported = output<LwCompendiumEntryItem>();

  readonly categories = ['All', 'Spell', 'Equipment', 'Feat'];
  readonly selectedCategory = signal<string>('All');
  readonly searchQuery = signal<string>('');

  readonly filteredEntries = computed(() => {
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();
    return this.entries().filter(
      (e) =>
        (cat === 'All' || e.category === cat) &&
        (!q ||
          e.name.toLowerCase().includes(q) ||
          e.summary.toLowerCase().includes(q) ||
          e.mechanicalPayload.toLowerCase().includes(q)),
    );
  });

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }
}
