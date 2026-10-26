import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';

export interface LwScopedNoteItem {
  readonly id: string;
  readonly campaignId: number;
  readonly title: string;
  readonly content: string;
  readonly scope: 'private_player' | 'gm_only' | 'party_shared' | string;
  readonly authorName: string;
  readonly witnessCharacter: string;
  readonly sessionNumber: number;
  readonly deepLinkRoute: string;
  readonly linkedEntityKeys: readonly string[];
}

@Component({
  selector: 'lw-scoped-note-card',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent],
  templateUrl: './scoped-note-card.component.html',
  styleUrl: './scoped-note-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwScopedNoteCardComponent {
  readonly note = input.required<LwScopedNoteItem>();
  readonly inspectEntityRequested = output<string>();

  readonly scopeLabel = computed(() => {
    switch (this.note().scope) {
      case 'private_player':
        return `Private · ${this.note().witnessCharacter} Only`;
      case 'gm_only':
        return 'GM Secret · Hidden from Party';
      default:
        return 'Party Shared · Canon Memory';
    }
  });

  readonly scopeTone = computed<LwBadgeTone>(() => {
    switch (this.note().scope) {
      case 'private_player':
        return 'gold';
      case 'gm_only':
        return 'gm';
      default:
        return 'emerald';
    }
  });
}
