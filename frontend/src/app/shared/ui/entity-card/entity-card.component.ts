import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntityCardVm } from '../../../core/models/loomweaver.models';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type EntityCardVariant = 'compact' | 'standard' | 'detailed';

@Component({
  selector: 'lw-entity-card',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './entity-card.component.html',
  styleUrl: './entity-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEntityCardComponent {
  readonly entity = input.required<EntityCardVm>();
  readonly variant = input<EntityCardVariant>('standard');
  readonly active = input<boolean>(false);
  readonly canApprove = input<boolean>(false);

  readonly inspectRequested = output<EntityCardVm>();
  readonly approveRequested = output<EntityCardVm>();

  readonly visibilityTone = computed<LwBadgeTone>(() => {
    const vis = this.entity().visibility;
    if (vis === 'gm') return 'gm';
    return 'emerald';
  });

  readonly entityIcon = computed<string>(() => {
    switch (this.entity().entityType) {
      case 'Character':
        return 'users';
      case 'NPC':
        return 'user';
      case 'Location':
        return 'map-pin';
      case 'Quest':
        return 'compass';
      case 'Faction':
        return 'shield';
      case 'Encounter':
        return 'swords';
      case 'Secret':
        return 'lock';
      case 'Clue':
        return 'search';
      default:
        return 'sparkles';
    }
  });
}
