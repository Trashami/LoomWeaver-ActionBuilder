import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface CreatureCardVm {
  readonly id: string;
  readonly name: string;
  readonly creatureType: string;
  readonly challengeRating: string;
  readonly xpValue: number;
  readonly armorClass: number;
  readonly maxHp: number;
  readonly speedFeet: number;
  readonly attackBonus: number;
  readonly saveDc: number;
  readonly signatureAttack: string;
  readonly damageFormula: string;
  readonly summary: string;
}

@Component({
  selector: 'lw-creature-card',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './creature-card.component.html',
  styleUrl: './creature-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCreatureCardComponent {
  readonly creature = input.required<CreatureCardVm>();
  readonly mode = input<'compact' | 'standard' | 'detailed'>('standard');
  readonly selected = input<boolean>(false);

  readonly creatureSelected = output<CreatureCardVm>();
  readonly spawnRequested = output<CreatureCardVm>();
}
