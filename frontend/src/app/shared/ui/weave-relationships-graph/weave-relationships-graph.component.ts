import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';

export interface PositionedGraphNodeVm {
  readonly id: string;
  readonly label: string;
  readonly subtitle: string;
  readonly summary: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly secret: boolean;
}

export interface PositionedGraphEdgeVm {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label: string;
  readonly secret: boolean;
}

@Component({
  selector: 'lw-weave-relationships-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weave-relationships-graph.component.html',
  styleUrl: './weave-relationships-graph.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LwWeaveRelationshipsGraphComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly worldLore = inject(WorldLoreFacadeService);
  readonly inspectLocationRequested = output<string>();

  readonly graphFilter = signal<string>('all');
  readonly selectedNodeId = signal<string | null>(null);

  readonly filterTypes = [
    { key: 'all', label: 'All Connections' },
    { key: 'Location', label: 'Locations' },
    { key: 'NPC', label: 'NPCs' },
    { key: 'Faction', label: 'Factions' },
    { key: 'Quest', label: 'Quests' },
    { key: 'PlayerCharacter', label: 'Party' }
  ];

  readonly visibleNodes = computed<PositionedGraphNodeVm[]>(() => {
    const filter = this.graphFilter();
    const entities = this.store
      .authorizedEntities()
      .filter((e) => (filter === 'all' ? true : e.entityType === filter))
      .slice(0, 12);

    const cx = 450;
    const cy = 230;
    const rx = 310;
    const ry = 165;
    const count = Math.max(1, entities.length);

    return entities.map((e, idx) => {
      const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
      return {
        id: e.compositeKey,
        label: e.name,
        subtitle: e.subtitle,
        summary: e.summary,
        type: e.entityType,
        x: Math.round(cx + Math.cos(angle) * rx),
        y: Math.round(cy + Math.sin(angle) * ry),
        secret: e.visibility === 'gm'
      };
    });
  });

  readonly visibleEdges = computed<PositionedGraphEdgeVm[]>(() => {
    const ids = new Set(this.visibleNodes().map((node) => node.id));
    return this.store
      .authorizedGraphEdges()
      .filter((edge) => ids.has(edge.sourceKey) && ids.has(edge.targetKey))
      .map((edge, idx) => ({
        id: `edge-${idx}-${edge.sourceKey}-${edge.targetKey}`,
        from: edge.sourceKey,
        to: edge.targetKey,
        label: edge.label || edge.relationshipType,
        secret: edge.visibility === 'gm'
      }));
  });

  readonly selectedNode = computed<PositionedGraphNodeVm | null>(() => {
    const id = this.selectedNodeId();
    return this.visibleNodes().find((node) => node.id === id) ?? this.visibleNodes()[0] ?? null;
  });

  nodeById(id: string): PositionedGraphNodeVm | undefined {
    return this.visibleNodes().find((node) => node.id === id);
  }

  edgeMidX(edge: PositionedGraphEdgeVm): number {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    return from && to ? (from.x + to.x) / 2 : 0;
  }

  edgeMidY(edge: PositionedGraphEdgeVm): number {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    return from && to ? (from.y + to.y) / 2 : 0;
  }

  selectGraphNode(node: PositionedGraphNodeVm): void {
    this.selectedNodeId.set(node.id);
    const matchingLocation = this.worldLore
      .locationsState()
      .find(
        (loc) =>
          loc.name.toLowerCase() === node.label.toLowerCase() ||
          loc.locationKey === node.id ||
          loc.compositeKey === node.id
      );
    if (matchingLocation) {
      this.worldLore.selectLocation(matchingLocation.locationKey);
    } else {
      this.store.inspectEntity(node.id);
    }
  }
}
