import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LwPageHeaderComponent } from '../../shared/ui/public-api';
import { LwRollTableSummaryVm, RollTablesApiService } from './roll-tables-api.service';

const PAGE_SIZE = 60;

@Component({
  selector: 'lw-roll-tables-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LwPageHeaderComponent],
  templateUrl: './roll-tables.page.html',
  styleUrl: './roll-tables.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RollTablesPageComponent {
  private readonly api = inject(RollTablesApiService);

  readonly search = signal('');
  readonly source = signal('');
  readonly tables = signal<readonly LwRollTableSummaryVm[]>([]);
  readonly hasMore = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  constructor() {
    this.load(true);
  }

  load(reset: boolean): void {
    const offset = reset ? 0 : this.tables().length;
    this.loading.set(true);
    this.errorMessage.set('');
    this.api
      .listTables({
        search: this.search(),
        source: this.source(),
        limit: PAGE_SIZE,
        offset,
      })
      .subscribe({
        next: (res) => {
          this.tables.set(reset ? res.tables : [...this.tables(), ...res.tables]);
          this.hasMore.set(res.hasMore);
          this.loading.set(false);
        },
        error: () => {
          this.errorMessage.set('Could not load roll tables.');
          this.loading.set(false);
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.load(true);
  }

  onSourceChange(value: string): void {
    this.source.set(value);
    this.load(true);
  }

  dieLabel(table: LwRollTableSummaryVm): string {
    return table.die?.expression ?? 'No die';
  }
}
