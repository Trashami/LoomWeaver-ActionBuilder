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
  readonly repositioningLocationKey = input<string | null>(null);
  readonly isGm = input<boolean>(false);

  readonly markerSelected = output<WorldMapMarkerVm>();
  readonly markerPositionCommitted = output<{ locationKey: string; xPercent: number; yPercent: number }>();
  readonly repositionCancelled = output<void>();
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
  readonly isDraggingMarker = signal<boolean>(false);
  readonly pendingCoords = signal<{ xPercent: number; yPercent: number } | null>(null);
  readonly pinPlacementMode = signal<boolean>(false);
  readonly newMapName = signal<string>('Nocturne Domain City Atlas');
  readonly newMapScope = signal<'World' | 'Region' | 'Settlement'>('Region');

  private dragStartX = 0;
  private dragStartY = 0;
  private hasMovedMarker = false;
  private suppressNextMarkerClick = false;

  readonly transformStyle = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`,
  );

  readonly markerZoomScale = computed(() => {
    const z = this.zoom();
    if (z <= 1) return 1;
    return +(1 / Math.pow(z, 1.22)).toFixed(4);
  });

  readonly zoomPercentLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

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
    this.zoom.update((z) => Math.min(12.0, +(z * 1.25).toFixed(2)));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.65, +(z / 1.25).toFixed(2)));
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const factor = event.deltaY < 0 ? 1.14 : 1 / 1.14;
    this.zoom.update((z) => Math.max(0.65, Math.min(12.0, +(z * factor).toFixed(3))));
  }

  resetViewport(): void {
    this.zoom.set(1);
    this.panX.set(0);
    this.panY.set(0);
  }

  markerX(marker: WorldMapMarkerVm): number {
    const pending = this.pendingCoords();
    if (pending && this.repositioningLocationKey() === marker.locationKey) {
      return pending.xPercent;
    }
    return marker.xPercent;
  }

  markerY(marker: WorldMapMarkerVm): number {
    const pending = this.pendingCoords();
    if (pending && this.repositioningLocationKey() === marker.locationKey) {
      return pending.yPercent;
    }
    return marker.yPercent;
  }

  onMarkerMouseDown(marker: WorldMapMarkerVm, event: MouseEvent): void {
    if (this.repositioningLocationKey() === marker.locationKey && this.isGm()) {
      event.stopPropagation();
      event.preventDefault();
      this.isDraggingMarker.set(true);
      this.hasMovedMarker = false;
      this.pendingCoords.set({ xPercent: marker.xPercent, yPercent: marker.yPercent });
    }
  }

  onPointerDown(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.closest('button, a, .lw-atlas-marker')) return;
    const viewportEl = (event.currentTarget as HTMLElement).querySelector('.lw-atlas-viewport') as HTMLElement | null;
    const rect = (viewportEl ?? (event.currentTarget as HTMLElement)).getBoundingClientRect();
    const xPct = Math.max(2, Math.min(98, Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10));
    const yPct = Math.max(2, Math.min(98, Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10));

    if (this.repositioningLocationKey() && this.isGm()) {
      this.pendingCoords.set({ xPercent: xPct, yPercent: yPct });
      this.isDraggingMarker.set(true);
      this.hasMovedMarker = true;
      return;
    }

    if (this.pinPlacementMode() && this.isGm()) {
      this.pinPlacementMode.set(false);
      this.canvasPinPlaced.emit({ xPercent: xPct, yPercent: yPct });
      return;
    }

    this.isPanning.set(true);
    this.dragStartX = event.clientX - this.panX();
    this.dragStartY = event.clientY - this.panY();
  }

  onPointerMove(event: MouseEvent): void {
    if (this.isDraggingMarker() && this.repositioningLocationKey()) {
      const viewportEl = (event.currentTarget as HTMLElement).querySelector('.lw-atlas-viewport') as HTMLElement | null;
      if (viewportEl) {
        const rect = viewportEl.getBoundingClientRect();
        const xPct = Math.max(2, Math.min(98, Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10));
        const yPct = Math.max(2, Math.min(98, Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10));
        this.pendingCoords.set({ xPercent: xPct, yPercent: yPct });
        this.hasMovedMarker = true;
      }
      return;
    }
    if (!this.isPanning()) return;
    const maxPanX = Math.max(380, (this.zoom() - 0.5) * 650);
    const maxPanY = Math.max(260, (this.zoom() - 0.5) * 450);
    this.panX.set(Math.max(-maxPanX, Math.min(maxPanX, event.clientX - this.dragStartX)));
    this.panY.set(Math.max(-maxPanY, Math.min(maxPanY, event.clientY - this.dragStartY)));
  }

  onPointerUp(): void {
    const wasDraggingMarker = this.isDraggingMarker() && this.hasMovedMarker;
    this.isPanning.set(false);
    this.isDraggingMarker.set(false);
    if (wasDraggingMarker) {
      this.suppressNextMarkerClick = true;
      this.commitReposition();
    }
    this.hasMovedMarker = false;
  }

  commitReposition(): void {
    const key = this.repositioningLocationKey();
    if (!key) return;
    const existing = this.markers().find((m) => m.locationKey === key);
    const coords = this.pendingCoords() ?? (existing ? { xPercent: existing.xPercent, yPercent: existing.yPercent } : null);
    if (coords) {
      this.markerPositionCommitted.emit({ locationKey: key, xPercent: coords.xPercent, yPercent: coords.yPercent });
    }
    this.pendingCoords.set(null);
  }

  cancelReposition(): void {
    this.pendingCoords.set(null);
    this.repositionCancelled.emit();
  }

  selectMarker(marker: WorldMapMarkerVm, event: MouseEvent): void {
    event.stopPropagation();
    if (this.suppressNextMarkerClick || this.repositioningLocationKey() === marker.locationKey) {
      this.suppressNextMarkerClick = false;
      return;
    }
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

  markerIcon(marker: WorldMapMarkerVm): string {
    if (marker.style?.defaultIconName) return marker.style.defaultIconName;
    switch (marker.category) {
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
