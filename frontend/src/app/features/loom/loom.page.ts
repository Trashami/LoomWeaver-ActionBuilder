import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwPanelComponent,
  LwScopedNoteCardComponent,
  LwScopedNoteItem,
} from '../../shared/ui/public-api';

interface GraphRagPathItem {
  readonly pathSummary: string;
  readonly sourceKey: string;
  readonly relationshipType: string;
  readonly targetKey: string;
  readonly visibility: string;
}

const DEFAULT_NOTES: readonly LwScopedNoteItem[] = [
  {
    id: 'note-kildrid-stone',
    campaignId: 1,
    title: 'Stone-Sense Tremor Along the Northeast Cinth Road',
    content:
      'Passing the southern mountain forest on the road from Vandia to Cinth, Kildrid felt rhythmic, centuries-old clawing against runic bedrock—an ancient dragon bound alive beneath the mountain.',
    scope: 'party_shared',
    authorName: 'Kildrid',
    witnessCharacter: 'Kildrid',
    sessionNumber: 9,
    deepLinkRoute: '/maps',
    linkedEntityKeys: ['1:Location:loc-mountain-cavern', '1:Character:char-kildrid'],
  },
  {
    id: 'note-kycius-dolly',
    campaignId: 1,
    title: 'The Quiet Maw Sewn Inside Dolly',
    content:
      "On the road to Cinth, Kycius stitched an extradimensional containment pocket inside Dolly's mouth so Fivi's companion swallows targets into stasis rather than killing them outright.",
    scope: 'party_shared',
    authorName: 'Kycius',
    witnessCharacter: 'Kycius',
    sessionNumber: 10,
    deepLinkRoute: '/characters',
    linkedEntityKeys: ['1:Character:char-kycius', '1:Character:char-fivi'],
  },
  {
    id: 'note-fivi-private',
    campaignId: 1,
    title: "Fivi's Fear of the Feywild Outcast Road",
    content:
      "Fivi jokes loudest when the party talks of home. She was cast out of the Feywild and fears she belongs nowhere, which is why she claims Captain Kutler's skyship as already hers.",
    scope: 'private_player',
    authorName: 'Fivi',
    witnessCharacter: 'Fivi',
    sessionNumber: 12,
    deepLinkRoute: '/characters',
    linkedEntityKeys: ['1:Character:char-fivi'],
  },
  {
    id: 'note-dal-private',
    campaignId: 1,
    title: 'Missing Pages of the Edhellainian Crown',
    content:
      'Dal suspects the torn ledger pages in Edhellain name his bloodline as the true royal lineage, though he has not yet chosen whether to claim the throne.',
    scope: 'private_player',
    authorName: 'Dal',
    witnessCharacter: 'Dal',
    sessionNumber: 14,
    deepLinkRoute: '/campaigns',
    linkedEntityKeys: ['1:Character:char-dal'],
  },
  {
    id: 'note-gm-emrys-trap',
    campaignId: 1,
    title: "GM Secret: Emrys's Life-Bound Dragon & The Priors' Siphon",
    content:
      'Emrys cannot slay the mountain dragon himself because the dragon bound its life to his before containment. He is diverting the party into the cavern so they kill it and let him extract the final Luminary location.',
    scope: 'gm_only',
    authorName: 'Game Master',
    witnessCharacter: 'GM',
    sessionNumber: 15,
    deepLinkRoute: '/arcane-screen',
    linkedEntityKeys: ['1:NPC:npc-emrys', '1:Secret:sec-priors-siphon'],
  },
];

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
    LwScopedNoteCardComponent,
  ],
  templateUrl: './loom.page.html',
  styleUrl: './loom.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoomPageComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);

  readonly witnessOptions = ['All Party', 'Dal', 'Fivi', 'Kildrid', 'Kycius', 'Munk'];
  readonly activeWitness = signal<string>('All Party');
  readonly notes = signal<readonly LwScopedNoteItem[]>(DEFAULT_NOTES);
  readonly synthesisBanner = signal<string>(
    '[The Loom · Zero-Generation GraphRAG]: Grounded strictly in authorized MySQL canon, Neo4j relationship paths, and role-scoped session notes.',
  );

  readonly graphPaths = signal<readonly GraphRagPathItem[]>([
    {
      pathSummary: '(Kildrid)-[:SENSED_TREMOR_BENEATH]->(Southern Mountain Cavern)',
      sourceKey: '1:Character:char-kildrid',
      relationshipType: 'SENSED_TREMOR_BENEATH',
      targetKey: '1:Location:loc-mountain-cavern',
      visibility: 'players',
    },
    {
      pathSummary: '(Kycius)-[:STITCHED_QUIET_MAW_FOR]->(Fivi & Dolly)',
      sourceKey: '1:Character:char-kycius',
      relationshipType: 'STITCHED_QUIET_MAW_FOR',
      targetKey: '1:Character:char-fivi',
      visibility: 'players',
    },
    {
      pathSummary: '(Lord Emrys)-[:LIFE_BOUND_TO]->(Trapped Dragon Beneath the Mountain)',
      sourceKey: '1:NPC:npc-emrys',
      relationshipType: 'LIFE_BOUND_TO',
      targetKey: '1:Location:loc-mountain-cavern',
      visibility: 'gm',
    },
  ]);

  readonly newNoteTitle = signal<string>('');
  readonly newNoteContent = signal<string>('');
  readonly newNoteScope = signal<'party_shared' | 'private_player' | 'gm_only'>('party_shared');
  readonly newNoteWitness = signal<string>('Kildrid');
  readonly newNoteRoute = signal<string>('/campaigns');

  readonly presetPrompts = [
    'What did Kildrid sense beneath the mountain on the road to Cinth?',
    'Who is Lord Emrys and what does he claim about the Council of Magic?',
    'What did Kycius sew inside Dolly and why?',
    'What is the Chokrah cargo manifest clue connected to the Priors?',
  ];

  readonly visibleNotes = computed(() => {
    const isGm = this.store.viewerRole() === 'gm';
    const witness = this.activeWitness();
    return this.notes().filter((n) => {
      if (n.scope === 'gm_only' && !isGm) return false;
      if (
        n.scope === 'private_player' &&
        !isGm &&
        witness !== 'All Party' &&
        n.witnessCharacter !== witness
      ) {
        return false;
      }
      if (witness !== 'All Party' && n.witnessCharacter !== witness && n.scope === 'private_player') {
        return false;
      }
      return true;
    });
  });

  readonly visibleGraphPaths = computed(() => {
    const isGm = this.store.viewerRole() === 'gm';
    return this.graphPaths().filter((p) => isGm || p.visibility !== 'gm');
  });

  constructor() {
    this.fetchNotes();
  }

  selectWitness(witness: string): void {
    this.activeWitness.set(witness);
    this.executeGraphRagSearch(this.store.loomQuery());
  }

  executeGraphRagSearch(promptText: string): void {
    this.store.loomQuery.set(promptText);
    this.http
      .post<{
        synthesis: string;
        graphPaths: readonly GraphRagPathItem[];
      }>('/api/v2/campaigns/1/loom/query', {
        query: promptText,
        role: this.store.viewerRole(),
        witnessCharacter: this.activeWitness(),
        includePrivateNotes: true,
      })
      .subscribe({
        next: (res) => {
          if (res?.synthesis) this.synthesisBanner.set(res.synthesis);
          if (res?.graphPaths?.length) this.graphPaths.set(res.graphPaths);
        },
        error: () => {},
      });
  }

  saveScopedNote(): void {
    const title = this.newNoteTitle().trim();
    const content = this.newNoteContent().trim();
    if (!title || !content) return;

    const payload = {
      title,
      content,
      scope: this.newNoteScope(),
      authorName: this.newNoteWitness(),
      witnessCharacter: this.newNoteWitness(),
      sessionNumber: 18,
      deepLinkRoute: this.newNoteRoute(),
      linkedEntityKeys: ['1:Location:loc-cinth'],
    };

    this.http.post<LwScopedNoteItem>('/api/v2/campaigns/1/notes', payload).subscribe({
      next: (created) => {
        this.notes.update((prev) => [created, ...prev]);
        this.newNoteTitle.set('');
        this.newNoteContent.set('');
      },
      error: () => {
        const localNote: LwScopedNoteItem = {
          id: `note-${Date.now()}`,
          campaignId: 1,
          ...payload,
        };
        this.notes.update((prev) => [localNote, ...prev]);
        this.newNoteTitle.set('');
        this.newNoteContent.set('');
      },
    });
  }

  private fetchNotes(): void {
    this.http
      .get<readonly LwScopedNoteItem[]>(
        `/api/v2/campaigns/1/notes?role=${this.store.viewerRole()}`,
      )
      .subscribe({
        next: (res) => {
          if (res?.length) this.notes.set(res);
        },
        error: () => {},
      });
  }
}
