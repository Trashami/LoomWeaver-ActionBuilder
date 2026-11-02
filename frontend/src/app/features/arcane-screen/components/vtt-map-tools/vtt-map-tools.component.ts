import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { LoomWeaverStoreService } from '../../../../core/services/loomweaver-store.service';
import { LwIconComponent } from '../../../../shared/ui/icon/icon.component';
import { VttBattleStateService } from '../../services/vtt-battle-state.service';
import { VttCombatService } from '../../services/vtt-combat.service';
import { VttServerSyncService } from '../../services/vtt-server-sync.service';
import {
  DndSizeCategory,
  DND_SIZE_ORDER,
  DND_SIZE_METRICS,
} from '../../../effects/engine/effect-timeline.contract';
import { VttDisplaySettingsService } from '../../services/vtt-display-settings.service';
import { SEED_VTT_WALL_SEGMENTS } from '../../services/vtt-battle.seed';

export type LeftMapTool =
  | 'select'
  | 'draw'
  | 'light'
  | 'tokens'
  | 'view'
  | 'measure';

@Component({
  selector: 'lw-vtt-map-tools',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './vtt-map-tools.component.html',
  styleUrl: './vtt-map-tools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VttMapToolsComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly battle = inject(VttBattleStateService);
  readonly vtt = inject(VttCombatService);
  readonly serverSync = inject(VttServerSyncService);
  readonly vttDisplay = inject(VttDisplaySettingsService);

  readonly gridEnabled = model<boolean>(false);
  readonly railOpen = model<boolean>(false);
  readonly rollDice = output<void>();
  readonly openShortcuts = output<void>();

  readonly showMapTools = signal<boolean>(true);
  readonly activeLeftTool = signal<LeftMapTool | null>(null);

  readonly isGm = computed(() => this.store.viewerRole() === 'gm');
  readonly partyCount = computed(() => this.vtt.partyTokensInScene().length);
  readonly hostileCount = computed(() =>
    this.battle.visibleMapTokens().filter((t) => t.faction === 'hostile').length,
  );
  readonly totalTokensCount = computed(() => this.battle.visibleMapTokens().length);

  readonly fogTitle = computed(() => {
    const mode = this.battle.fogMode();
    return mode === 'los-only'
      ? 'LoS Only'
      : mode === 'explored-los'
        ? 'Traveled + LoS'
        : 'Fog Off';
  });

  toggleLeftTool(tool: LeftMapTool): void {
    if (this.activeLeftTool() === tool) {
      this.activeLeftTool.set(null);
    } else {
      this.activeLeftTool.set(tool);
    }
  }

  deselectAll(): void {
    this.battle.queuedTargetSequence.set([]);
    this.battle.cancelAllInteractiveModes();
    this.activeLeftTool.set(null);
  }

  toggleTargeting(): void {
    this.battle.targetSelectionMode.set(!this.battle.targetSelectionMode());
  }

  toggleFogMode(): void {
    const cur = this.battle.fogMode();
    if (cur === 'no-fog') {
      this.battle.fogMode.set('explored-los');
    } else if (cur === 'explored-los') {
      this.battle.fogMode.set('los-only');
    } else {
      this.battle.fogMode.set('no-fog');
    }
  }

  clearAllWalls(): void {
    (this.battle.walls as any).set([]);
  }

  resetDefaultWalls(): void {
    (this.battle.walls as any).set(SEED_VTT_WALL_SEGMENTS);
  }

  // Grid Scale Controls (D&D 5e 5-ft square scaling)
  readonly gridScale = computed(() => this.vttDisplay.gridScale());
  readonly gridScalePercent = computed(() => Math.round(this.vttDisplay.gridScale() * 100));

  setGridScale(scale: number): void {
    this.vttDisplay.setGridScale(scale);
  }

  increaseGridScale(): void {
    const next = Math.round((this.vttDisplay.gridScale() + 0.1) * 10) / 10;
    this.vttDisplay.setGridScale(Math.min(2.5, next));
  }

  decreaseGridScale(): void {
    const next = Math.round((this.vttDisplay.gridScale() - 0.1) * 10) / 10;
    this.vttDisplay.setGridScale(Math.max(0.4, next));
  }

  onGridScaleInput(event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    if (!isNaN(val)) this.vttDisplay.setGridScale(val);
  }

  // Token Size Controls (D&D core rules)
  readonly activeTokenForSize = computed(() => {
    const key = this.vtt.selectedAttackerKey() || this.battle.activeObserverToken()?.key;
    return this.vtt.tokens().find((t) => t.key === key) ?? this.vtt.tokens()[0] ?? null;
  });

  readonly activeTokenSize = computed<DndSizeCategory>(() => {
    return (this.activeTokenForSize()?.sizeCategory || 'medium') as DndSizeCategory;
  });

  readonly dndSizes: readonly { id: DndSizeCategory; label: string; space: string; squares: string }[] = [
    { id: 'tiny', label: 'Tiny', space: '2.5 ft', squares: '1/4 sq' },
    { id: 'small', label: 'Small', space: '5 ft', squares: '1 sq' },
    { id: 'medium', label: 'Medium', space: '5 ft', squares: '1 sq' },
    { id: 'large', label: 'Large', space: '10 ft', squares: '2x2' },
    { id: 'huge', label: 'Huge', space: '15 ft', squares: '3x3' },
    { id: 'gargantuan', label: 'Gargantuan', space: '20+ ft', squares: '4x4' },
  ];

  selectTokenForSize(key: string): void {
    this.vtt.selectedAttackerKey.set(key);
  }

  setTokenSize(size: DndSizeCategory): void {
    const t = this.activeTokenForSize();
    if (!t) return;
    this.vtt.setTokenSizeCategory(t.key, size);
  }

  increaseActiveTokenSize(): void {
    const t = this.activeTokenForSize();
    if (!t) return;
    this.vtt.cycleTokenSize(t.key, 'increase');
  }

  decreaseActiveTokenSize(): void {
    const t = this.activeTokenForSize();
    if (!t) return;
    this.vtt.cycleTokenSize(t.key, 'decrease');
  }
}
