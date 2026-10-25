import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

interface CombatantRow {
  readonly key: string;
  readonly name: string;
  readonly role: string;
  readonly initiative: number;
  readonly hp: string;
  readonly ac: number;
  actionUsed: boolean;
  bonusUsed: boolean;
  reactionUsed: boolean;
  movementFeet: number;
}

@Component({
  selector: 'lw-arcane-screen-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
  ],
  templateUrl: './arcane-screen.page.html',
  styleUrl: './arcane-screen.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcaneScreenPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly activeRound = signal<number>(3);
  readonly activeTurnIndex = signal<number>(0);
  readonly sessionNote = signal<string>(
    'Session 14 Live Note: Emrys greets the party near the Cinth chandelier balcony while vampire infiltrators circle the musicians.',
  );

  readonly combatants = signal<CombatantRow[]>([
    {
      key: '1:Character:char-dal',
      name: 'Dallas (Dal)',
      role: 'Party · Ranger/Scout',
      initiative: 21,
      hp: '64 / 68',
      ac: 17,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 35,
    },
    {
      key: '1:Character:char-fivi',
      name: 'Fivi & Dolly',
      role: 'Party · Fey Outcast',
      initiative: 19,
      hp: '51 / 51',
      ac: 16,
      actionUsed: true,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 30,
    },
    {
      key: '1:Encounter:enc-cinth-vampires',
      name: 'Cinth Vampire Noble',
      role: 'Hostile · Undead Coven',
      initiative: 17,
      hp: '98 / 144',
      ac: 16,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 40,
    },
    {
      key: '1:Character:char-munk',
      name: 'Munk',
      role: 'Party · Frontline Vanguard',
      initiative: 15,
      hp: '88 / 92',
      ac: 18,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 30,
    },
    {
      key: '1:Character:char-kildrid',
      name: 'Kildrid',
      role: 'Party · Stone & Rune Scholar',
      initiative: 13,
      hp: '58 / 62',
      ac: 18,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 25,
    },
    {
      key: '1:Character:char-kycius',
      name: 'Kycius & Laksis',
      role: 'Party · Truth-Watcher',
      initiative: 12,
      hp: '54 / 54',
      ac: 15,
      actionUsed: false,
      bonusUsed: false,
      reactionUsed: false,
      movementFeet: 35,
    },
  ]);

  nextTurn(): void {
    const total = this.combatants().length;
    const next = (this.activeTurnIndex() + 1) % total;
    if (next === 0) {
      this.activeRound.update((r) => r + 1);
    }
    this.activeTurnIndex.set(next);
  }

  toggleActionSlot(index: number, slot: 'actionUsed' | 'bonusUsed' | 'reactionUsed'): void {
    this.combatants.update((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, [slot]: !row[slot] } : row)),
    );
  }
}
