import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

@Component({
  selector: 'lw-loom-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
  ],
  templateUrl: './loom.page.html',
  styleUrl: './loom.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoomPageComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly presetPrompts = [
    'What did Kildrid sense beneath the mountain on the road to Cinth?',
    'Who is Lord Emrys and what does he claim about the Council of Magic?',
    'What did Kycius sew inside Dolly and why?',
    'What is the Chokrah cargo manifest clue connected to the Priors?',
  ];
}
