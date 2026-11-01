import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LwPageHeaderComponent } from '../../shared/ui/public-api';
import { LwModalComponent } from '../../shared/ui/modal/modal.component';
import { FullscreenDiceOverlayService } from '../dice/engine/fullscreen-dice-overlay.service';
import type { FullscreenDieEntry } from '../dice/engine/fullscreen-dice-overlay.service';
import type { DicePolyhedronType } from '../dice/engine/models/dice-model.types';
import {
  LwRollDieVm,
  LwRollTableDetailVm,
  LwRollTableRowVm,
  RollTablesApiService,
} from './roll-tables-api.service';

const SUPPORTED_SIDES = new Set([4, 6, 8, 10, 12, 20, 100]);

@Component({
  selector: 'lw-roll-table-page',
  standalone: true,
  imports: [RouterLink, LwPageHeaderComponent, LwModalComponent],
  templateUrl: './roll-table.page.html',
  styleUrl: './roll-table.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RollTablePageComponent {
  private readonly api = inject(RollTablesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly overlay = inject(FullscreenDiceOverlayService);

  readonly table = signal<LwRollTableDetailVm | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly rolling = signal(false);
  readonly lastTotal = signal<number | null>(null);
  readonly matchedRow = signal<LwRollTableRowVm | null>(null);
  readonly modalOpen = signal(false);

  readonly die = computed<LwRollDieVm | null>(() => {
    const d = this.table()?.die;
    if (!d || !SUPPORTED_SIDES.has(d.sides) || d.count < 1) return null;
    return d;
  });

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.errorMessage.set('Roll table not found.');
      return;
    }
    this.loading.set(true);
    this.api.getTable(id).subscribe({
      next: (detail) => {
        this.table.set(detail);
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Could not load this roll table.');
        this.loading.set(false);
      },
    });
  }

  roll(): void {
    const t = this.table();
    const d = this.die();
    if (!t || !d || this.rolling()) return;

    const dieType = `d${d.sides}` as DicePolyhedronType;
    const values = Array.from({ length: d.count }, () => 1 + Math.floor(Math.random() * d.sides));
    const entries: FullscreenDieEntry[] = values.map((value) => ({ dieType, value }));
    const total = values.reduce((sum, v) => sum + v, 0);

    this.rolling.set(true);
    this.lastTotal.set(total);
    this.overlay.triggerFullScreenRoll({
      label: t.name,
      expression: d.expression,
      diceValues: values,
      diceEntries: entries,
      total,
      onComplete: () => {
        this.rolling.set(false);
        this.matchedRow.set(this.findRow(t.rows, total));
        this.modalOpen.set(true);
      },
    });
  }

  findRow(rows: readonly LwRollTableRowVm[], total: number): LwRollTableRowVm | null {
    return rows.find((r) => r.min != null && r.max != null && total >= r.min && total <= r.max) ?? null;
  }

  cellLabel(index: number): string {
    return this.table()?.colLabels[index] ?? '';
  }
}
