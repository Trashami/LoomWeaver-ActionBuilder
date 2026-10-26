import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AudienceVisibility } from '../../../core/models/loomweaver.models';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface NpcCardVm {
  readonly compositeKey: string;
  readonly name: string;
  readonly title: string;
  readonly faction: string;
  readonly locationName: string;
  readonly disposition: 'Friendly' | 'Guarded' | 'Deceptive' | 'Hostile';
  readonly summary: string;
  readonly gmSecret?: string;
  readonly visibility: AudienceVisibility;
}

@Component({
  selector: 'lw-npc-card',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './npc-card.component.html',
  styleUrl: './npc-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwNpcCardComponent {
  readonly npc = input.required<NpcCardVm>();
  readonly variant = input<'compact' | 'standard' | 'detailed'>('standard');
  readonly showGmSecret = input<boolean>(false);
  readonly selected = input<boolean>(false);

  readonly npcSelected = output<NpcCardVm>();
  readonly spawnRequested = output<NpcCardVm>();

  readonly dispositionTone = computed<LwBadgeTone>(() => {
    switch (this.npc().disposition) {
      case 'Friendly':
        return 'emerald';
      case 'Deceptive':
        return 'gold';
      case 'Hostile':
        return 'crimson';
      default:
        return 'neutral';
    }
  });
}
