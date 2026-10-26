import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { WeaveGraphEdge, WeaveGraphNode } from '../../../core/models/loomweaver.models';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-weave-relationships-graph',
  standalone: true,
  imports: [CommonModule, LwIconComponent],
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
    { key: 'location', label: 'Locations' },
    { key: 'npc', label: 'NPCs' },
    { key: 'faction', label: 'Factions' },
    { key: 'quest', label: 'Quests' },
    { key: 'party', label: 'Party' }
  ];

  readonly visibleNodes = computed<WeaveGraphNode[]>(() => {
    const filter = this.graphFilter();
    const isGm = this.worldLore.isGm();
    return this.store
      .weaveNodes()
      .filter((node) => (isGm ? true : !node.secret))
      .filter((node) => (filter === 'all' ? true : node.type === filter));
  });

  readonly visibleEdges = computed<WeaveGraphEdge[]>(() => {
    const ids = new Set(this.visibleNodes().map((node) => node.id));
    const isGm = this.worldLore.isGm();
    return this.store
      .weaveEdges()
      .filter((edge) => (isGm ? true : !edge.secret))
      .filter((edge) => ids.has(edge.from) && ids.has(edge.to));
  });

  readonly selectedNode = computed<WeaveGraphNode | null>(() => {
    const id = this.selectedNodeId();
    return this.visibleNodes().find((node) => node.id === id) ?? this.visibleNodes()[0] ?? null;
  });

  nodeById(id: string): WeaveGraphNode | undefined {
    return this.visibleNodes().find((node) => node.id === id);
  }

  edgeMidX(edge: WeaveGraphEdge): number {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    return from && to ? (from.x + to.x) / 2 : 0;
  }

  edgeMidY(edge: WeaveGraphEdge): number {
    const from = this.nodeById(edge.from);
    const to = this.nodeById(edge.to);
    return from && to ? (from.x && to.x ? (from.y + to.y) / 2 : 0) : 0;
  }

  selectGraphNode(node: WeaveGraphNode): void {
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
    }
  }
}
