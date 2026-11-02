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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FullscreenDiceOverlayService,
  FullscreenDieEntry,
} from '../dice/engine/fullscreen-dice-overlay.service';
import type { DicePolyhedronType } from '../dice/engine/models';
import { LwIconComponent } from '../../shared/ui/icon/icon.component';
import { LwModalComponent } from '../../shared/ui/modal/modal.component';
import { renderEntries, renderInlineTags } from './book-entry-html';
import {
  LwBookNodeVm,
  LwBookSpellDetailVm,
  LwSourceDetailVm,
  SourceBookApiService,
} from './sourcebook-api.service';

@Component({
  selector: 'lw-sourcebook-reader-page',
  standalone: true,
  imports: [FormsModule, RouterLink, LwIconComponent, LwModalComponent],
  templateUrl: './sourcebook-reader.page.html',
  styleUrl: './sourcebook-reader.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SourceBookReaderPageComponent {
  private readonly api = inject(SourceBookApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly diceOverlay = inject(FullscreenDiceOverlayService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly code = this.route.snapshot.paramMap.get('code') ?? '';

  readonly source = signal<LwSourceDetailVm | null>(null);
  readonly node = signal<LwBookNodeVm | null>(null);
  readonly activeSpell = signal<LwBookSpellDetailVm | null>(null);
  readonly spellLoading = signal(false);
  readonly selectedId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly tocSearch = signal('');
  readonly spellImageBroken = signal(false);

  readonly sections = computed(() => this.source()?.sections ?? []);
  readonly title = computed(() => this.node()?.data_json?.name ?? this.node()?.name ?? '');
  readonly bodyHtml = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(renderEntries(this.node()?.data_json?.entries ?? [])),
  );

  readonly spellBodyHtml = computed<SafeHtml>(() => {
    const sp = this.activeSpell();
    if (!sp) return this.sanitizer.bypassSecurityTrustHtml('');
    const rawEntries = sp.raw_json?.entries;
    const mainHtml = Array.isArray(rawEntries) && rawEntries.length
      ? renderEntries(rawEntries)
      : (sp.description ?? '')
          .split(/\n+/)
          .filter((p) => p.trim().length > 0)
          .map((p) => `<p>${renderInlineTags(p)}</p>`)
          .join('');
    const higherEntries = sp.raw_json?.entriesHigherLevel;
    const higherHtml = Array.isArray(higherEntries) && higherEntries.length
      ? renderEntries(higherEntries)
      : sp.higher_levels
        ? `<div class="book-block"><h4>At Higher Levels</h4><p>${renderInlineTags(sp.higher_levels.replace(/^(At Higher Levels:|Using a Higher-Level Spell Slot:)\s*/i, ''))}</p></div>`
        : '';
    return this.sanitizer.bypassSecurityTrustHtml(mainHtml + higherHtml);
  });

  readonly spellSubtitle = computed(() => {
    const sp = this.activeSpell();
    if (!sp) return '';
    const school = sp.school || 'Arcane';
    if (!sp.level || sp.level <= 0) {
      return `${school} Cantrip`;
    }
    const ord = sp.level === 1 ? '1st' : sp.level === 2 ? '2nd' : sp.level === 3 ? '3rd' : `${sp.level}th`;
    return `${ord}-Level ${school}`;
  });

  readonly spellComponentsText = computed(() => {
    const sp = this.activeSpell();
    if (!sp || !sp.components_json) return 'V, S';
    const c = sp.components_json as Record<string, unknown>;
    if (typeof c === 'string') return c;
    const parts: string[] = [];
    if (c['v']) parts.push('V');
    if (c['s']) parts.push('S');
    if (c['m']) {
      const mat = typeof c['m'] === 'string'
        ? c['m']
        : typeof c['m'] === 'object' && c['m'] && 'text' in (c['m'] as Record<string, unknown>)
          ? String((c['m'] as Record<string, unknown>)['text'])
          : '';
      parts.push(mat ? `M (${mat})` : 'M');
    }
    return parts.join(', ') || 'None';
  });

  readonly spellClassesText = computed(() => {
    const sp = this.activeSpell();
    if (!sp || !sp.classes_json) return '';
    const cj = sp.classes_json;
    if (Array.isArray(cj)) {
      return cj.map((item) => String(item)).join(', ');
    }
    if (typeof cj === 'object' && cj !== null) {
      const obj = cj as Record<string, unknown>;
      const classMap = obj['class'] as Record<string, Record<string, unknown>> | undefined;
      if (classMap && typeof classMap === 'object') {
        const names = new Set<string>();
        for (const srcKey of Object.keys(classMap)) {
          const byBook = classMap[srcKey];
          if (byBook && typeof byBook === 'object') {
            for (const clsName of Object.keys(byBook)) {
              names.add(clsName);
            }
          }
        }
        return Array.from(names).sort().join(', ');
      }
    }
    return '';
  });

  readonly activeChapterId = computed<number | null>(() => {
    const current = this.node();
    if (!current) return this.selectedId();
    return current.root_chapter_id ?? current.parent_id ?? current.id;
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
            queryParamsHandling: 'merge',
            replaceUrl: true,
          });
        }
      },
      error: () => this.errorMessage.set('Could not load this sourcebook.'),
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = Number(params.get('section'));
      const spellName = params.get('spell')?.trim() || '';
      const spellSource = params.get('spellSource')?.trim() || '';

      if (Number.isFinite(id) && id > 0 && id !== this.selectedId()) {
        this.selectedId.set(id);
        this.loadNode(id);
      }

      if (spellName) {
        this.loadSpell(spellName, spellSource || this.code);
      } else {
        this.activeSpell.set(null);
      }
    });
  }

  closeSpellView(): void {
    this.activeSpell.set(null);
    if (this.route.snapshot.queryParamMap.has('spell')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { section: this.selectedId(), spell: null, spellSource: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  openSpellByName(spellName: string, spellSource?: string): void {
    const src = spellSource || this.activeSpell()?.source_book || this.code;
    this.loadSpell(spellName, src);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        section: this.selectedId(),
        spell: spellName,
        spellSource: src,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    // 1. Spell link: opens the Spell Modal without leaving the current chapter
    const spellLink = target.closest<HTMLAnchorElement>('.book-spell-link');
    if (spellLink) {
      event.preventDefault();
      let spellName = spellLink.getAttribute('data-spell-name') || '';
      if (!spellName) {
        const href = spellLink.getAttribute('href') || '';
        const qIndex = href.indexOf('?');
        if (qIndex >= 0) {
          spellName = new URLSearchParams(href.slice(qIndex)).get('spell') || '';
        }
      }
      const spellSource = spellLink.getAttribute('data-spell-source') || this.code;
      if (spellName) {
        this.openSpellByName(spellName, spellSource);
      }
      return;
    }

    // 2. Creature link or Statblock "View in Bestiary" button: jumps to Bestiary
    const creatureLink = target.closest<HTMLAnchorElement>('.book-creature-link, .book-statblock-bestiary-btn');
    if (creatureLink) {
      event.preventDefault();
      const key = creatureLink.getAttribute('data-monster-key') || '';
      const name = creatureLink.getAttribute('data-monster-name') || (creatureLink.textContent ?? '').trim();
      const src = creatureLink.getAttribute('data-monster-source') || '';
      const monsterParam = key || (src ? `${name}|${src}` : name);
      if (monsterParam) {
        void this.router.navigate(['/bestiary'], {
          queryParams: {
            monster: monsterParam,
            search: name || undefined,
          },
        });
      }
      return;
    }

    // 3. Item link: {@item ...}
    const itemLink = target.closest<HTMLAnchorElement>('.book-item-link');
    if (itemLink) {
      event.preventDefault();
      const itemName = itemLink.getAttribute('data-item-name') || (itemLink.textContent ?? '').trim();
      if (itemName) {
        void this.router.navigate(['/items'], {
          queryParams: { search: itemName },
        });
      }
      return;
    }

    // 4. Roll button (table roll button or inline dice tag)
    const rollBtn = target.closest<HTMLButtonElement>('.book-roll-btn, .book-dice-btn');
    if (rollBtn) {
      event.preventDefault();
      const diceExpr = rollBtn.getAttribute('data-dice') || '1d20';
      const tableWrapper = rollBtn.closest<HTMLElement>('.book-table-wrapper');
      const tableId = rollBtn.getAttribute('data-table-id') || tableWrapper?.id || null;
      const caption =
        rollBtn.getAttribute('data-caption') ||
        tableWrapper?.querySelector('caption')?.textContent?.trim() ||
        undefined;
      this.rollDice(diceExpr, tableId, caption);
      return;
    }

    // 5. Chapter / TOC / Bottom Section / Next Chapter navigation: scroll page to top
    const navLink = target.closest<HTMLAnchorElement>('.toc-link, .toc-sub-link, .reader-subsection-card, .pager-btn');
    if (navLink) {
      this.scrollToTop();
    }
  }

  rollDice(diceExpr: string, tableId: string | null, caption?: string): void {
    const normalizedExpr = diceExpr.trim().replace(/d%/gi, '1d100');
    const diceEntries: FullscreenDieEntry[] = [];
    const diceValues: number[] = [];
    let total = 0;
    let modifier = 0;

    const resolvePolyhedronType = (sides: number): DicePolyhedronType => {
      if (sides === 4) return 'd4';
      if (sides === 6) return 'd6';
      if (sides === 8) return 'd8';
      if (sides === 10) return 'd10';
      if (sides === 12) return 'd12';
      if (sides === 100) return 'd100';
      return 'd20';
    };

    const dieRegex = /([+-]?)\s*(\d*)d(\d+)/gi;
    let dieMatch: RegExpExecArray | null;
    while ((dieMatch = dieRegex.exec(normalizedExpr)) !== null) {
      const sign = dieMatch[1] === '-' ? -1 : 1;
      const count = dieMatch[2] ? Math.max(1, parseInt(dieMatch[2], 10)) : 1;
      const sides = Math.max(2, parseInt(dieMatch[3], 10) || 20);
      const dieType = resolvePolyhedronType(sides);

      for (let i = 0; i < count; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        diceValues.push(val);
        total += sign * val;

        if (sides === 100) {
          const normalized100 = val === 100 ? 0 : val;
          const tensFace = Math.floor(normalized100 / 10) * 10;
          const onesFace = normalized100 % 10 === 0 ? 10 : normalized100 % 10;
          diceEntries.push({ dieType: 'd100', value: tensFace });
          diceEntries.push({ dieType: 'd10', value: onesFace });
        } else {
          diceEntries.push({ dieType, value: val });
        }
      }
    }

    const strippedMod = normalizedExpr.replace(/([+-]?)\s*(\d*)d(\d+)/gi, '');
    const modRegex = /([+-])\s*(\d+)/g;
    let modMatch: RegExpExecArray | null;
    while ((modMatch = modRegex.exec(strippedMod)) !== null) {
      const sign = modMatch[1] === '-' ? -1 : 1;
      const modVal = parseInt(modMatch[2], 10) || 0;
      modifier += sign * modVal;
      total += sign * modVal;
    }

    if (diceValues.length === 0) {
      const val = Math.floor(Math.random() * 20) + 1;
      diceValues.push(val);
      diceEntries.push({ dieType: 'd20', value: val });
      total = val;
    }

    const rollLabel = caption || `${normalizedExpr.toUpperCase()} Roll`;

    this.diceOverlay.triggerFullScreenRoll({
      label: rollLabel,
      expression: normalizedExpr,
      diceValues,
      diceEntries,
      total,
      alert: {
        whoRolled: this.source()?.name || 'Tome Library',
        rollType: rollLabel,
        formula: normalizedExpr.toUpperCase(),
        naturalDie: diceValues[0] ?? total,
        rawRolls: diceValues,
        modifier,
        adjustedTotal: total,
      },
      onComplete: () => {
        if (tableId) {
          this.highlightTableRow(tableId, total);
        }
      },
    });

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
    this.scrollToTop();
    this.api.getNode(this.code, id).subscribe({
      next: (node) => {
        this.node.set(node);
        this.loading.set(false);
        this.scrollToTop();
        setTimeout(() => this.scrollToTop(), 30);
      },
      error: () => {
        this.errorMessage.set('Could not load this section.');
        this.loading.set(false);
      },
    });
  }

  private loadSpell(spellName: string, spellSource: string): void {
    this.spellLoading.set(true);
    this.errorMessage.set('');
    this.spellImageBroken.set(false);
    this.api.getSpell(this.code, spellName, spellSource).subscribe({
      next: (spell) => {
        this.activeSpell.set(spell);
        this.spellLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(`Could not load description for spell "${spellName}".`);
        this.spellLoading.set(false);
      },
    });
  }

  scrollToTop(): void {
    if (typeof document === 'undefined') return;
    const scrollContainers = document.querySelectorAll<HTMLElement>(
      '.lw-main .lw-scroll-area, .lw-scroll-area, .reader-main, main.lw-main',
    );
    scrollContainers.forEach((el) => {
      el.scrollTop = 0;
      try {
        el.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      } catch {
        el.scrollTop = 0;
      }
    });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }
}
