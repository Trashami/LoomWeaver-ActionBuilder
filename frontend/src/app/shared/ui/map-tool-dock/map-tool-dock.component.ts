import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { LwIconComponent } from '../icon/icon.component';

export interface MapDockToolItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly layerHint: string;
}

export const DEFAULT_MAP_DOCK_TOOLS: readonly MapDockToolItem[] = [
  { id: 'select', label: 'Select', icon: 'cursor', layerHint: 'Transform & Gizmo' },
  { id: 'room', label: 'Room', icon: 'grid', layerHint: 'Grid-Snapped Rooms & Floors' },
  { id: 'wall', label: 'Wall', icon: 'shield', layerHint: 'Cutaway Stone & Timber Walls' },
  { id: 'door', label: 'Door', icon: 'key-round', layerHint: 'Portals, Archways & Secret Doors' },
  { id: 'paint', label: 'Paint', icon: 'pipette', layerHint: 'PBR Blend & Roughness Brushes' },
  { id: 'objects', label: 'Objects', icon: 'cube', layerHint: '3D Props, Furniture & Tokens' },
  { id: 'terrain', label: 'Terrain', icon: 'map', layerHint: 'Chunked Heightfield & Cliffs' },
  { id: 'scatter', label: 'Scatter', icon: 'layers', layerHint: 'Seeded Foliage & Rock Brush' },
  { id: 'water', label: 'Water', icon: 'globe', layerHint: 'Spline Rivers, Pools & Ocean' },
  { id: 'lighting', label: 'Lighting', icon: 'zap', layerHint: 'Torches, Sun/Moon & Fog' },
  { id: 'stairs', label: 'Stairs', icon: 'arrow-up', layerHint: 'Multi-Level Stairs & Elevations' },
  { id: 'annotate', label: 'Annotate', icon: 'pen', layerHint: 'World Overlays & GM Secrets' },
];

@Component({
  selector: 'lw-map-tool-dock',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  templateUrl: './map-tool-dock.component.html',
  styleUrl: './map-tool-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapToolDockComponent {
  readonly tools = input<readonly MapDockToolItem[]>(DEFAULT_MAP_DOCK_TOOLS);
  readonly activeToolId = input<string>('select');

  readonly toolSelected = output<string>();
}
