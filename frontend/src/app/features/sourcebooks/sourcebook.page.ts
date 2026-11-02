import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LwIconComponent } from '../../shared/ui/icon/icon.component';
import { LwPageHeaderComponent } from '../../shared/ui/public-api';
import {
  LwSourceDetailVm,
  LwSourceSummaryVm,
  SourceBookApiService,
} from './sourcebook-api.service';

export type LibraryCategoryTab = 'all' | 'core' | 'adventure' | 'setting' | 'supplement';

@Component({
  selector: 'lw-sourcebook-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LwIconComponent, LwPageHeaderComponent],
  templateUrl: './sourcebook.page.html',
  styleUrl: './sourcebook.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceBookPageComponent {
  private readonly api = inject(SourceBookApiService);
  private readonly route = inject(ActivatedRoute);

  readonly code = this.route.snapshot.paramMap.get('code');

  readonly search = signal('');
  readonly selectedTab = signal<LibraryCategoryTab>('all');
  readonly sources = signal<readonly LwSourceSummaryVm[]>([]);
  readonly source = signal<LwSourceDetailVm | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly brokenCovers = signal<ReadonlySet<string>>(new Set());

  readonly filteredSources = computed(() => {
    const list = this.sources();
    const tab = this.selectedTab();
    const query = this.search().trim().toLowerCase();

    return list.filter((s) => {
      if (tab === 'core') {
        const isCore = (s.source_group || '').toLowerCase().includes('core') || s.source_type === 'core';
        if (!isCore) return false;
      } else if (tab === 'adventure') {
        const isAdv = s.source_type === 'adventure' || (s.source_group || '').toLowerCase().includes('adventure');
        if (!isAdv) return false;
      } else if (tab === 'setting') {
        const isSetting = (s.source_group || '').toLowerCase().includes('setting');
        if (!isSetting) return false;
      } else if (tab === 'supplement') {
        const isSupp = (s.source_group || '').toLowerCase().includes('supplement');
        if (!isSupp) return false;
      }

      if (query) {
        const nameMatch = s.name.toLowerCase().includes(query);
        const codeMatch = s.id.toLowerCase().includes(query);
        const authorMatch = (s.author || '').toLowerCase().includes(query);
        const groupMatch = (s.source_group || '').toLowerCase().includes(query);
        if (!nameMatch && !codeMatch && !authorMatch && !groupMatch) return false;
      }

      return true;
    });
  });

  constructor() {
    if (this.code) {
      this.loadSource(this.code);
    } else {
      this.loadList();
    }
  }

  loadList(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.listSources('').subscribe({
      next: (res) => {
        this.sources.set(res.sources);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load sourcebooks.');
        this.loading.set(false);
      },
    });
  }

  loadSource(code: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getSource(code).subscribe({
      next: (detail) => {
        this.source.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load this sourcebook.');
        this.loading.set(false);
      },
    });
  }

  setTab(tab: LibraryCategoryTab): void {
    this.selectedTab.set(tab);
  }

  hasValidCover(book: { id: string; cover_path: string | null }): boolean {
    if (!book.cover_path) return false;
    if (book.id !== 'PHB' && book.cover_path.endsWith('/PHB.webp')) return false;
    return !this.brokenCovers().has(book.id);
  }

  markCoverBroken(bookId: string): void {
    const next = new Set(this.brokenCovers());
    next.add(bookId);
    this.brokenCovers.set(next);
  }
}
