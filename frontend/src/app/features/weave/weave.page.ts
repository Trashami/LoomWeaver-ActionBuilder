import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwEmptyStateComponent,
  LwEntityCardComponent,
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

@Component({
  selector: 'lw-weave-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwEntityCardComponent,
    LwEmptyStateComponent,
  ],
  templateUrl: './weave.page.html',
  styleUrl: './weave.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeavePageComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly positionedNodes = computed<readonly PositionedNode[]>(() => {
    const entities = this.store.authorizedEntities().slice(0, 14);
    const cx = 420;
    const cy = 200;
    return entities.map((e, idx) => {
      const ring = idx < 6 ? 115 : 175;
      const countInRing = idx < 6 ? 6 : Math.max(1, entities.length - 6);
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

  readonly draftEntities = computed(() =>
    this.store.authorizedEntities().filter((e) => e.canonStatus === 'draft'),
  );
}
