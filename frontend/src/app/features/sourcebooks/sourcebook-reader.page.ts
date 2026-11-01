import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FullscreenDiceOverlayService } from '../dice/engine/fullscreen-dice-overlay.service';
import { LwIconComponent } from '../../shared/ui/icon/icon.component';
import { renderEntries } from './book-entry-html';
import {
  LwBookNodeVm,
  LwSourceDetailVm,
  SourceBookApiService,
} from './sourcebook-api.service';

@Component({
  selector: 'lw-sourcebook-reader-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LwIconComponent],
  templateUrl: './sourcebook-reader.page.html',
  styleUrl: './sourcebook-reader.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceBookReaderPageComponent {
  private readonly api = inject(SourceBookApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly diceOverlay = inject(FullscreenDiceOverlayService);

  readonly code = this.route.snapshot.paramMap.get('code') ?? '';

  readonly source = signal<LwSourceDetailVm | null>(null);
  readonly node = signal<LwBookNodeVm | null>(null);
  readonly selectedId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly tocSearch = signal('');

  readonly sections = computed(() => this.source()?.sections ?? []);
  readonly title = computed(() => this.node()?.data_json?.name ?? this.node()?.name ?? '');
  readonly bodyHtml = computed(() => renderEntries(this.node()?.data_json?.entries ?? []));

  readonly activeChapterId = computed<number | null>(() => {
    const current = this.node();
    if (!current) return this.selectedId();
    return current.parent_id ?? current.id;
  });

  readonly filteredSections = computed(() => {
    const q = this.tocSearch().trim().toLowerCase();
    const all = this.sections();
    if (!q) return all;
    return all.filter((s) => s.name.toLowerCase().includes(q) || (s.page && String(s.page).includes(q)));
  });

  readonly prevSection = computed(() => {
    const index = this.sections().findIndex((s) => s.id === this.activeChapterId());
    return index > 0 ? this.sections()[index - 1] : null;
  });

  readonly nextSection = computed(() => {
    const index = this.sections().findIndex((s) => s.id === this.activeChapterId());
    return index >= 0 && index < this.sections().length - 1 ? this.sections()[index + 1] : null;
  });

  constructor() {
    this.api.getSource(this.code).subscribe({
      next: (detail) => {
        this.source.set(detail);
        if (!this.selectedId() && detail.sections.length) {
          void this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { section: detail.sections[0].id },
            replaceUrl: true,
          });
        }
      },
      error: () => this.errorMessage.set('Could not load this sourcebook.'),
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('section'));
      if (Number.isFinite(id) && id > 0) {
        this.selectedId.set(id);
        this.loadNode(id);
      }
    });
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // 1. Check for item link: {@item ...}
    const itemLink = target.closest<HTMLAnchorElement>('.book-item-link');
    if (itemLink) {
      event.preventDefault();
      const itemName = itemLink.getAttribute('data-item-name');
      if (itemName) {
        void this.router.navigate(['/items'], {
          queryParams: { search: itemName },
        });
      }
      return;
    }

    // 2. Check for roll button (table roll button or inline dice tag)
    const rollBtn = target.closest<HTMLButtonElement>('.book-roll-btn, .book-dice-btn');
    if (rollBtn) {
      event.preventDefault();
      const diceExpr = rollBtn.getAttribute('data-dice') || '1d20';
      const tableId = rollBtn.getAttribute('data-table-id');
      const caption = rollBtn.getAttribute('data-caption') || undefined;
      this.rollDice(diceExpr, tableId, caption);
      return;
    }
  }

  rollDice(diceExpr: string, tableId: string | null, caption?: string): void {
    const match = /(\d*)d(\d+)/i.exec(diceExpr);
    const count = match && match[1] ? Math.max(1, parseInt(match[1], 10)) : 1;
    const sides = match && match[2] ? parseInt(match[2], 10) : 20;

    const diceValues: number[] = [];
    let total = 0;
    for (let i = 0; i < count; i++) {
      const val = Math.floor(Math.random() * sides) + 1;
      diceValues.push(val);
      total += val;
    }

    const rollLabel = caption || `${diceExpr.toUpperCase()} Roll`;

    // Trigger full screen 3D dice overlay using the user's selected 3D dice set & theme
    this.diceOverlay.triggerFullScreenRoll({
      label: rollLabel,
      expression: diceExpr,
      diceValues,
      total,
      alert: {
        whoRolled: this.source()?.name || 'Tome Library',
        rollType: rollLabel,
        formula: diceExpr,
        naturalDie: diceValues[0] ?? total,
        rawRolls: diceValues,
        modifier: 0,
        adjustedTotal: total,
      },
      onComplete: () => {
        if (tableId) {
          this.highlightTableRow(tableId, total);
        }
      },
    });

    // Also update table row immediately
    if (tableId) {
      this.highlightTableRow(tableId, total);
    }
  }

  private highlightTableRow(tableId: string, rolledValue: number): void {
    const container = document.getElementById(tableId);
    if (!container) return;

    const resultSpan = container.querySelector<HTMLElement>(`#${tableId}-result`);
    const rows = container.querySelectorAll<HTMLTableRowElement>('tbody tr');
    let matchedRow: HTMLTableRowElement | null = null;
    let matchedOutcome = '';

    rows.forEach((row) => {
      row.classList.remove('book-table-row--highlighted');
      const minAttr = row.getAttribute('data-roll-min');
      const maxAttr = row.getAttribute('data-roll-max');
      if (minAttr !== null && maxAttr !== null) {
        const min = parseInt(minAttr, 10);
        const max = parseInt(maxAttr, 10);
        if (rolledValue >= min && rolledValue <= max) {
          matchedRow = row;
          row.classList.add('book-table-row--highlighted');
          const cells = row.querySelectorAll('td');
          matchedOutcome = cells.length > 1 ? (cells[1].textContent || '').trim() : '';
        }
      }
    });

    if (resultSpan) {
      resultSpan.textContent = matchedOutcome
        ? `Rolled ${rolledValue}: ${matchedOutcome}`
        : `Rolled ${rolledValue}`;
      resultSpan.classList.add('book-table-result--active');
    }

    if (matchedRow) {
      (matchedRow as HTMLTableRowElement).scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }

  private loadNode(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getNode(this.code, id).subscribe({
      next: (node) => {
        this.node.set(node);
        this.loading.set(false);
        // Scroll tome reader to top
        const main = document.querySelector('.reader-main');
        if (main) {
          main.scrollTop = 0;
        }
      },
      error: () => {
        this.errorMessage.set('Could not load this section.');
        this.loading.set(false);
      },
    });
  }
}
