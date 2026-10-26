import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  CreatureCardVm,
  EncounterCardVm,
  LwBadgeComponent,
  LwCreatureCardComponent,
  LwEncounterCardComponent,
  LwNpcCardComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';
import { VttCombatService } from '../arcane-screen/services/vtt-combat.service';

@Component({
  selector: 'lw-encounters-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwEncounterCardComponent,
    LwCreatureCardComponent,
    LwNpcCardComponent,
  ],
  templateUrl: './encounters.page.html',
  styleUrl: './encounters.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncountersPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly vtt = inject(VttCombatService);
  private readonly router = inject(Router);

  openArcaneScreen(): void {
    this.router.navigateByUrl('/arcane-screen');
  }

  launchEncounter(enc: EncounterCardVm): void {
    this.vtt.activeEncounterId.set(enc.id);
    this.router.navigateByUrl('/arcane-screen');
  }

  spawnCreatureAndOpenVtt(creature: CreatureCardVm): void {
    this.vtt.spawnCreatureIntoVtt(creature);
    this.router.navigateByUrl('/arcane-screen');
  }
}
