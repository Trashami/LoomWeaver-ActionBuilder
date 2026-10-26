import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import {
  PartyJourneyWaypointVm,
  WorldMapMarkerVm,
  WorldMapRegionOverlayVm,
  WorldMapSummaryVm,
} from '../../../core/models/world-lore.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-world-atlas',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgpButton,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
  ],
  templateUrl: './world-atlas.component.html',
  styleUrl: './world-atlas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorldAtlasComponent {
  readonly map = input<WorldMapSummaryVm | null>(null);
  readonly overlays = input<readonly WorldMapRegionOverlayVm[]>([]);
  readonly markers = input<readonly WorldMapMarkerVm[]>([]);
  readonly waypoints = input<readonly PartyJourneyWaypointVm[]>([]);
  readonly selectedLocationKey = input<string | null>(null);
  readonly isGm = input<boolean>(false);

  readonly markerSelected = output<WorldMapMarkerVm>();
  readonly childMapRequested = output<string>();
  readonly parentMapRequested = output<string>();
  readonly createMapRequested = output<{
    name: string;
    scopeLevel: 'World' | 'Continent' | 'Region' | 'Settlement' | 'District' | 'Building';
    imageUrl: string;
  }>();
  readonly canvasPinPlaced = output<{ xPercent: number; yPercent: number }>();

  readonly zoom = signal<number>(1);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly isPanning = signal<boolean>(false);
  readonly pinPlacementMode = signal<boolean>(false);
  readonly newMapName = signal<string>('Nocturne Domain City Atlas');
  readonly newMapScope = signal<'World' | 'Region' | 'Settlement'>('Region');

  private dragStartX = 0;
  private dragStartY = 0;

  readonly transformStyle = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`,
  );

  readonly playerRoutePolyline = computed(() => {
    const pts = this.waypoints().filter((w) => w.status !== 'gm_planned');
    if (pts.length < 2) return '';
    return pts.map((w) => `${w.xPercent * 10},${w.yPercent * 5.6}`).join(' ');
  });

  readonly gmPlannedPolyline = computed(() => {
    const pts = this.waypoints();
    if (pts.length < 2) return '';
    const current = pts.find((w) => w.status === 'current');
    const planned = pts.find((w) => w.status === 'gm_planned');
    if (!current || !planned) return '';
    return `${current.xPercent * 10},${current.yPercent * 5.6} ${planned.xPercent * 10},${planned.yPercent * 5.6}`;
  });

  readonly activePopupMarker = computed(() => {
    const sel = this.selectedLocationKey();
    if (!sel) return null;
    return (
      this.markers().find(
        (m) => m.locationKey === sel || m.compositeKey === sel || m.markerId === sel,
      ) ?? null
    );
  });

  zoomIn(): void {
    this.zoom.update((z) => Math.min(2.4, +(z + 0.2).toFixed(2)));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.85, +(z - 0.2).toFixed(2)));
  }

  resetViewport(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  onPointerDown(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.closest('button, a, .lw-atlas-marker')) return;
    if (this.pinPlacementMode() && this.isGm()) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const xPct = Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10;
      const yPct = Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10;
      this.pinPlacementMode.set(false);
      this.canvasPinPlaced.emit({ xPercent: xPct, yPercent: yPct });
      return;
    }
    this.isPanning.set(true);
    this.dragStartX = event.clientX - this.panX();
    this.dragStartY = event.clientY - this.panY();
  }

  onPointerMove(event: MouseEvent): void {
    if (!this.isPanning()) return;
    this.panX.set(Math.max(-260, Math.min(260, event.clientX - this.dragStartX)));
    this.panY.set(Math.max(-180, Math.min(180, event.clientY - this.dragStartY)));
  }

  onPointerUp(): void {
    this.isPanning.set(false);
  }

  selectMarker(marker: WorldMapMarkerVm, event: MouseEvent): void {
    event.stopPropagation();
    this.markerSelected.emit(marker);
  }

  submitCreateWorldMap(): void {
    const name = this.newMapName().trim() || 'Campaign World Map';
    this.createMapRequested.emit({
      name,
      scopeLevel: this.newMapScope(),
      imageUrl: '/icrandor_world_dashboard.jpg',
    });
  }

  markerIcon(category: string): string {
    switch (category) {
      case 'Settlements':
        return 'landmark';
      case 'Quests':
        return 'alert-circle';
      case 'Factions':
        return 'shield';
      case 'Encounters':
        return 'swords';
      case 'Secrets':
        return 'eye';
      case 'Regions':
        return 'map';
      default:
        return 'map-pin';
    }
  }
}
