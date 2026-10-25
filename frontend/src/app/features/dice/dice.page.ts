import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

interface RollResult {
  readonly id: string;
  readonly formula: string;
  readonly values: readonly number[];
  readonly total: number;
  readonly outcome: string;
  readonly skinName: string;
}

@Component({
  selector: 'lw-dice-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwAssetCardComponent,
  ],
  templateUrl: './dice.page.html',
  styleUrl: './dice.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DicePageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly activeSkinId = signal<string>('asset-dice-runed-obsidian');

  readonly diceSkins = computed(() =>
    this.store.assets().filter((a) => a.category === 'Dice Skin'),
  );

  readonly rollHistory = signal<readonly RollResult[]>([
    {
      id: 'roll-101',
      formula: '1d20 + 8 (Fivi Slingshot Tooth Strike)',
      values: [20],
      total: 28,
      outcome: 'Natural 20 · Critical Hit FX',
      skinName: 'Runed Obsidian & Molten Gold Set',
    },
    {
      id: 'roll-100',
      formula: '2d6 + 5 (Munk Greatsword Cleave)',
      values: [6, 5],
      total: 16,
      outcome: 'Solid Hit · Heavy Basalt Impact',
      skinName: 'Runed Obsidian & Molten Gold Set',
    },
  ]);

  rollDice(sides: number, count: number, modifier: number, label: string): void {
    const rolled: number[] = [];
    for (let i = 0; i < count; i++) {
      rolled.push(Math.floor(Math.random() * sides) + 1);
    }
    const sum = rolled.reduce((a, b) => a + b, 0) + modifier;
    const isNat20 = sides === 20 && rolled.includes(20);
    const isNat1 = sides === 20 && rolled.includes(1);
    const activeSkin =
      this.diceSkins().find((s) => s.id === this.activeSkinId())?.name ?? 'Standard Polyhedral';

    this.rollHistory.update((prev) => [
      {
        id: `roll-${Date.now()}`,
        formula: `${count}d${sides}${modifier >= 0 ? ' + ' + modifier : ' - ' + Math.abs(modifier)} (${label})`,
        values: rolled,
        total: sum,
        outcome: isNat20
          ? 'Natural 20 · Critical Burst Shader'
          : isNat1
            ? 'Natural 1 · Shatter Decal'
            : 'Authoritative Physics Roll Verified',
        skinName: activeSkin,
      },
      ...prev.slice(0, 5),
    ]);
  }
}
