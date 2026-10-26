import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwEmptyStateComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

interface PositionedNode {
  readonly compositeKey: string;
  readonly name: string;
  readonly entityType: string;
  readonly visibility: string;
  readonly x: number;
  readonly y: number;
}

interface WeaveDraftItem {
  readonly id: string;
  readonly compositeKey: string;
  readonly category: string;
  readonly name: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly groundedContext: string;
  readonly suggestedEdges: readonly string[];
  readonly status: 'draft' | 'approved' | 'rejected' | string;
  readonly visibility: string;
}

const DEFAULT_WEAVE_DRAFTS: readonly WeaveDraftItem[] = [
  {
    id: 'draft-cinth-artificer',
    compositeKey: '1:NPC:draft-master-vael',
    category: 'NPC',
    name: 'Master Artificer Vaelen Thorne',
    subtitle: 'Chief Aether-wright of the Cinth Guildhall',
    summary:
      'A non-magical engineer scarred during the Moonlight Wars who builds phosphor-bronze arc condensers so ordinary citizens never kneel to the Council of Magic again.',
    groundedContext: 'Grounded in Cinth Artificers Guild & post-Moonlight Wars class tension.',
    suggestedEdges: ['ALLY_OF -> 1:Faction:fac-artificers', 'OPPOSES -> 1:NPC:npc-emrys'],
    status: 'draft',
    visibility: 'players',
  },
  {
    id: 'draft-chokrah-vault',
    compositeKey: '1:Quest:draft-chokrah-convoy',
    category: 'Quest',
    name: 'The Chokrah Siphon Ledgers of Lost Isles',
    subtitle: "Follow Captain Kutler's skyship intelligence into the Priors' titration vaults",
    summary:
      'Investigate the ritual Chokrah shipments brought from the Lost Isles and expose how the Priors siphon innate magic from street-born initiates.',
    groundedContext: "Grounded in Captain Kutler's skyship return & Ekkos Priors distortion.",
    suggestedEdges: ['INVOLVES -> 1:NPC:npc-kutler', 'EXPOSES -> 1:Secret:sec-priors-siphon'],
    status: 'draft',
    visibility: 'gm',
  },
  {
    id: 'draft-orc-vanguard',
    compositeKey: '1:Encounter:draft-village-siege',
    category: 'Monster',
    name: 'Iron-Tusk Full-Blood Orc Siegebreaker',
    subtitle: 'Book Two Village Assault Vanguard (CR 7)',
    summary:
      'Heavy siege infantry massing near the timber village where Munk was raised and trained before the skyship crash.',
    groundedContext: "Grounded in Book Two opening arc & Munk's mentor storyline.",
    suggestedEdges: ['THREATENS -> 1:Character:char-munk'],
    status: 'draft',
    visibility: 'gm',
  },
];

@Component({
  selector: 'lw-weave-page',
  standalone: true,
  imports: [
    FormsModule,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwEmptyStateComponent,
  ],
  templateUrl: './weave.page.html',
  styleUrl: './weave.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeavePageComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);

  readonly graphFilterType = signal<string>('All');
  readonly graphTypes = ['All', 'Character', 'NPC', 'Location', 'Faction', 'Quest', 'Secret'];

  readonly weaveCategories = [
    'NPC',
    'Monster',
    'Faction',
    'Quest',
    'Item',
    'Spell',
    'Loot Table',
    'Session Outline',
    'Battle Map',
  ];
  readonly selectedGenerateCategory = signal<string>('NPC');
  readonly generatePrompt = signal<string>(
    'Artificer skyship quartermaster who distrusts the Council of Magic',
  );
  readonly generateLocation = signal<string>('Cinth Guildhall & Sky-Dock');
  readonly reviewBanner = signal<string>('100% GM Authorship enforced on all drafts');

  readonly drafts = signal<readonly WeaveDraftItem[]>(DEFAULT_WEAVE_DRAFTS);

  readonly activeDrafts = computed(() =>
    this.drafts().filter((d) => d.status !== 'rejected'),
  );

  readonly positionedNodes = computed<readonly PositionedNode[]>(() => {
    const filter = this.graphFilterType();
    const entities = this.store
      .authorizedEntities()
      .filter((e) => filter === 'All' || e.entityType === filter)
      .slice(0, 14);
    const cx = 420;
    const cy = 200;
    return entities.map((e, idx) => {
      const ring = idx < 6 ? 115 : 175;
      const countInRing = idx < 6 ? Math.min(6, entities.length) : Math.max(1, entities.length - 6);
      const posInRing = idx < 6 ? idx : idx - 6;
      const angle = (Math.PI * 2 * posInRing) / countInRing - Math.PI / 2;
      return {
        compositeKey: e.compositeKey,
        name: e.name,
        entityType: e.entityType,
        visibility: e.visibility,
        x: Math.round(cx + ring * 1.65 * Math.cos(angle)),
        y: Math.round(cy + ring * 0.88 * Math.sin(angle)),
      };
    });
  });

  readonly positionedEdges = computed(() => {
    const nodes = this.positionedNodes();
    const map = new Map(nodes.map((n) => [n.compositeKey, n]));
    return this.store
      .authorizedGraphEdges()
      .map((edge) => {
        const src = map.get(edge.sourceKey);
        const tgt = map.get(edge.targetKey);
        if (!src || !tgt) return null;
        return {
          id: `${edge.sourceKey}->${edge.targetKey}:${edge.relationshipType}`,
          x1: src.x,
          y1: src.y,
          x2: tgt.x,
          y2: tgt.y,
          midX: Math.round((src.x + tgt.x) / 2),
          midY: Math.round((src.y + tgt.y) / 2),
          label: edge.relationshipType,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  });

  constructor() {
    this.http.get<readonly WeaveDraftItem[]>('/api/v2/campaigns/1/weave/drafts').subscribe({
      next: (res) => {
        if (res?.length) this.drafts.set(res);
      },
      error: () => {},
    });
  }

  generateDraft(): void {
    const prompt = this.generatePrompt().trim();
    if (!prompt) return;

    const payload = {
      category: this.selectedGenerateCategory(),
      prompt,
      groundedLocation: this.generateLocation(),
      visibility: this.store.viewerRole(),
    };

    this.http.post<WeaveDraftItem>('/api/v2/campaigns/1/weave/generate', payload).subscribe({
      next: (created) => {
        this.drafts.update((prev) => [created, ...prev]);
        this.reviewBanner.set(`Drafted "${created.name}" — awaiting GM review.`);
      },
      error: () => {
        const fallback: WeaveDraftItem = {
          id: `draft-${Date.now()}`,
          compositeKey: `1:${payload.category}:draft-${Date.now()}`,
          category: payload.category,
          name: `[Weave Draft] ${prompt}`,
          subtitle: `${payload.category} Concept · Grounded in ${payload.groundedLocation}`,
          summary: `Context-grounded ${payload.category} draft generated in ${payload.groundedLocation}. Requires GM review before committing to canon.`,
          groundedContext: `Grounded in ${payload.groundedLocation}`,
          suggestedEdges: ['LOCATED_IN -> 1:Location:loc-cinth'],
          status: 'draft',
          visibility: payload.visibility,
        };
        this.drafts.update((prev) => [fallback, ...prev]);
      },
    });
  }

  reviewDraft(draft: WeaveDraftItem, action: 'approve' | 'reweave' | 'reject'): void {
    const refinementNote =
      action === 'reweave' ? 'Sharpen connection to Cinth Artificers & Chokrah route' : undefined;

    this.http
      .post<WeaveDraftItem>(`/api/v2/campaigns/1/weave/drafts/${draft.id}/review`, {
        action,
        refinementNote,
      })
      .subscribe({
        next: (updated) => {
          this.drafts.update((list) =>
            list.map((d) => (d.id === draft.id ? updated : d)),
          );
          this.reviewBanner.set(
            action === 'approve'
              ? `Approved "${updated.name}" into MySQL canon & projected to Neo4j graph.`
              : action === 'reweave'
                ? `Re-wove "${updated.name}" with GM refinement notes.`
                : `Rejected draft "${updated.name}".`,
          );
        },
        error: () => {
          this.drafts.update((list) =>
            list.map((d) =>
              d.id === draft.id
                ? {
                    ...d,
                    status: action === 'reject' ? 'rejected' : action === 'approve' ? 'approved' : 'draft',
                    summary:
                      action === 'reweave'
                        ? `${d.summary} [Re-Woven with GM direction]`
                        : d.summary,
                  }
                : d,
            ),
          );
        },
      });
  }
}
