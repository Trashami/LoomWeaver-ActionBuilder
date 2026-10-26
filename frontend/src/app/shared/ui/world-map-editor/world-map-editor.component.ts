import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  LocationInspectorDetailVm,
  LocationRelatedEntityVm,
  MarkerFontFamily,
  MarkerLabelPosition,
  MarkerVisualStyleVm,
  PlayerVisibilityMode,
  WorldMapMarkerVm,
  WorldMapRegionOverlayVm,
  WorldMapSummaryVm,
} from '../../../core/models/world-lore.models';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import {
  CAMPAIGN_SESSION_OPTIONS,
  DEFAULT_MARKER_ICONS,
  MARKER_COLOR_SWATCHES,
  MARKER_FONT_OPTIONS,
  OLD_WORLD_STAMP_OPTIONS,
} from '../../../core/services/world-lore-stamps.data';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface MapEditorSavePayload {
  locationKey?: string;
  name: string;
  locationType: string;
  hierarchyLevel: string;
  parentLocationKey?: string | null;
  mapId?: string | null;
  childMapId?: string | null;
  linkedSceneKey?: string | null;
  attachedSessionId?: string | number | null;
  attachedSessionLabel?: string | null;
  playerVisibilityPolicy?: PlayerVisibilityMode;
  style?: MarkerVisualStyleVm;
  xPercent: number;
  yPercent: number;
  discoveryStatus: string;
  visibility: 'players' | 'gm' | 'public';
  artworkUrl?: string;
  description: string;
  silent?: boolean;
}

@Component({
  selector: 'lw-world-map-editor',
  standalone: true,
  imports: [
    FormsModule,
    NgpButton,
    LwButtonComponent,
    LwIconComponent,
  ],
  templateUrl: './world-map-editor.component.html',
  styleUrl: './world-map-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwWorldMapEditorComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly map = input.required<WorldMapSummaryVm>();
  readonly maps = input<readonly WorldMapSummaryVm[]>([]);
  readonly overlays = input<readonly WorldMapRegionOverlayVm[]>([]);
  readonly markers = input<readonly WorldMapMarkerVm[]>([]);
  readonly selectedLocation = input<LocationInspectorDetailVm | null>(null);

  readonly closeRequested = output<void>();
  readonly markerSelected = output<string>();
  readonly childMapRequested = output<string>();
  readonly relatedEntitySelected = output<LocationRelatedEntityVm>();
  readonly loreSelected = output<string>();
  readonly locationSaved = output<MapEditorSavePayload>();

  readonly stampCatalog = OLD_WORLD_STAMP_OPTIONS;
  readonly vectorIcons = DEFAULT_MARKER_ICONS;
  readonly colorSwatches = MARKER_COLOR_SWATCHES;
  readonly fontOptions = MARKER_FONT_OPTIONS;
  readonly sessionOptions = CAMPAIGN_SESSION_OPTIONS;

  readonly zoom = signal<number>(1.15);
  readonly panX = signal<number>(0);
  readonly panY = signal<number>(0);
  readonly isPanning = signal<boolean>(false);
  readonly dragModeActive = signal<boolean>(false);
  readonly isDraggingPin = signal<boolean>(false);
  readonly saveNotice = signal<string | null>(null);

  readonly stampArtistFilter = signal<'All' | 'Muller Old World' | 'Harrewyn Classic'>('All');
  readonly rightPaneSection = signal<'properties' | 'customize' | 'attachments'>('properties');

  readonly editName = signal<string>('');
  readonly editSubtitle = signal<string>('');
  readonly editHierarchy = signal<string>('Settlement');
  readonly editXPercent = signal<number>(48);
  readonly editYPercent = signal<number>(44);
  readonly editDiscovery = signal<string>('visited');
  readonly editVisibility = signal<'players' | 'gm'>('players');
  readonly editVisibilityPolicy = signal<PlayerVisibilityMode>('auto_lore_revealed');
  readonly editSessionId = signal<string | number | null>('sess-15');
  readonly editChildMapId = signal<string>('');
  readonly editSceneKey = signal<string>('');
  readonly editDescription = signal<string>('');

  readonly iconMode = signal<'default' | 'stamp'>('default');
  readonly defaultIconName = signal<string>('landmark');
  readonly stampImageUrl = signal<string>(OLD_WORLD_STAMP_OPTIONS[0].imageUrl);
  readonly showIcon = signal<boolean>(true);
  readonly colorHex = signal<string>('#d9b77a');
  readonly fontFamily = signal<MarkerFontFamily>('Cinzel');
  readonly labelPosition = signal<MarkerLabelPosition>('right');
  readonly iconScale = signal<number>(1.0);

  private hydratedLocationKey: string | null = null;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasMovedPinDuringDrag = false;
  private suppressNextMarkerClick = false;

  constructor() {
    effect(() => {
      const loc = this.selectedLocation();
      if (!loc) {
        this.hydratedLocationKey = null;
        return;
      }
      if (this.hydratedLocationKey === loc.locationKey) {
        return;
      }
      this.hydratedLocationKey = loc.locationKey;
      const m = untracked(() => this.markers().find((mk) => mk.locationKey === loc.locationKey));
      this.editName.set(loc.name);
      this.editSubtitle.set(m?.subtitle || loc.locationType);
      this.editHierarchy.set(loc.hierarchyLevel);
      this.editXPercent.set(m?.xPercent ?? 48);
      this.editYPercent.set(m?.yPercent ?? 44);
      this.editDiscovery.set(loc.discoveryStatus);
      this.editVisibility.set(loc.visibility === 'gm' ? 'gm' : 'players');
      this.editVisibilityPolicy.set(loc.playerVisibilityPolicy ?? m?.playerVisibilityPolicy ?? 'auto_lore_revealed');
      this.editSessionId.set(loc.attachedSessionId ?? m?.attachedSessionId ?? 'sess-15');
      this.editChildMapId.set(loc.childMapId ?? m?.childMapId ?? '');
      this.editSceneKey.set(loc.linkedSceneKey ?? m?.linkedSceneKey ?? '');
      this.editDescription.set(loc.description);

      const st = loc.style ?? m?.style;
      this.iconMode.set(st?.iconMode ?? 'default');
      this.defaultIconName.set(st?.defaultIconName ?? 'landmark');
      this.stampImageUrl.set(st?.stampImageUrl ?? OLD_WORLD_STAMP_OPTIONS[0].imageUrl);
      this.showIcon.set(st?.showIcon ?? true);
      this.colorHex.set(st?.colorHex ?? '#d9b77a');
      this.fontFamily.set(st?.fontFamily ?? 'Cinzel');
      this.labelPosition.set(st?.labelPosition ?? 'right');
      this.iconScale.set(st?.iconScale ?? 1.0);
    });
  }

  readonly transformStyle = computed(
    () => `translate(${this.panX()}px, ${this.panY()}px) scale(${this.zoom()})`,
  );

  readonly markerZoomScale = computed(() => {
    const z = this.zoom();
    if (z <= 1) return 1;
    return +(1 / Math.pow(z, 1.22)).toFixed(4);
  });

  readonly zoomPercentLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);

  readonly filteredStamps = computed(() => {
    const f = this.stampArtistFilter();
    return f === 'All' ? this.stampCatalog : this.stampCatalog.filter((s) => s.collection === f);
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
    this.zoom.set(1.15);
    this.panX.set(0);
    this.panY.set(0);
  }

  onMarkerClick(marker: WorldMapMarkerVm, event: MouseEvent): void {
    event.stopPropagation();
    if (this.suppressNextMarkerClick) {
      this.suppressNextMarkerClick = false;
      return;
    }
    if (this.selectedLocation()?.locationKey === marker.locationKey) {
      return;
    }
    this.markerSelected.emit(marker.locationKey);
  }

  onMarkerMouseDown(marker: WorldMapMarkerVm, event: MouseEvent): void {
    if (event.button !== 0) return;
    if (this.dragModeActive() || this.selectedLocation()?.locationKey === marker.locationKey) {
      event.preventDefault();
      event.stopPropagation();
      this.hasMovedPinDuringDrag = false;
      this.isDraggingPin.set(true);
    }
  }

  onPointerDown(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.closest('button, a, .lw-editor-marker')) return;
    const vp = (event.currentTarget as HTMLElement).querySelector('.lw-editor-viewport') as HTMLElement | null;
    if (this.dragModeActive() && vp && this.selectedLocation()) {
      const rect = vp.getBoundingClientRect();
      this.editXPercent.set(Math.max(2, Math.min(98, Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10)));
      this.editYPercent.set(Math.max(2, Math.min(98, Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10)));
      this.hasMovedPinDuringDrag = true;
      this.isDraggingPin.set(true);
      return;
    }
    this.isPanning.set(true);
    this.dragStartX = event.clientX - this.panX();
    this.dragStartY = event.clientY - this.panY();
  }

  onPointerMove(event: MouseEvent): void {
    if (this.isDraggingPin()) {
      const vp = (event.currentTarget as HTMLElement).querySelector('.lw-editor-viewport') as HTMLElement | null;
      if (vp) {
        const rect = vp.getBoundingClientRect();
        this.editXPercent.set(Math.max(2, Math.min(98, Math.round(((event.clientX - rect.left) / rect.width) * 1000) / 10)));
        this.editYPercent.set(Math.max(2, Math.min(98, Math.round(((event.clientY - rect.top) / rect.height) * 1000) / 10)));
        this.hasMovedPinDuringDrag = true;
      }
      return;
    }
    if (!this.isPanning()) return;
    const maxPanX = Math.max(420, (this.zoom() - 0.5) * 700);
    const maxPanY = Math.max(300, (this.zoom() - 0.5) * 500);
    this.panX.set(Math.max(-maxPanX, Math.min(maxPanX, event.clientX - this.dragStartX)));
    this.panY.set(Math.max(-maxPanY, Math.min(maxPanY, event.clientY - this.dragStartY)));
  }

  onPointerUp(): void {
    const wasDraggingPin = this.isDraggingPin();
    this.isPanning.set(false);
    this.isDraggingPin.set(false);
    if (wasDraggingPin && this.hasMovedPinDuringDrag) {
      this.suppressNextMarkerClick = true;
      this.hasMovedPinDuringDrag = false;
      this.emitSave(true, 'Location coordinates updated on map.');
    }
  }

  setIconMode(mode: 'default' | 'stamp'): void {
    this.iconMode.set(mode);
    this.emitSave(true);
  }

  setDefaultIcon(iconId: string): void {
    this.iconMode.set('default');
    this.defaultIconName.set(iconId);
    this.emitSave(true);
  }

  selectStamp(url: string): void {
    this.iconMode.set('stamp');
    this.stampImageUrl.set(url);
    this.emitSave(true);
  }

  setShowIcon(val: boolean): void {
    this.showIcon.set(val);
    this.emitSave(true);
  }

  setColorHex(hex: string): void {
    this.colorHex.set(hex);
    this.emitSave(true);
  }

  setFontFamily(font: MarkerFontFamily): void {
    this.fontFamily.set(font);
    this.emitSave(true);
  }

  setLabelPosition(pos: MarkerLabelPosition): void {
    this.labelPosition.set(pos);
    this.emitSave(true);
  }

  setIconScale(scale: number): void {
    this.iconScale.set(scale);
    this.emitSave(true);
  }

  markerDisplayX(m: WorldMapMarkerVm): number {
    return this.selectedLocation()?.locationKey === m.locationKey ? this.editXPercent() : m.xPercent;
  }

  markerDisplayY(m: WorldMapMarkerVm): number {
    return this.selectedLocation()?.locationKey === m.locationKey ? this.editYPercent() : m.yPercent;
  }

  saveSelectedLocation(): void {
    this.emitSave(false, `Saved "${this.editName() || this.selectedLocation()?.name}" to Atlas.`);
    this.dragModeActive.set(false);
  }

  emitSave(silent: boolean, feedbackMessage?: string): void {
    const loc = this.selectedLocation();
    if (!loc) return;
    const sess = this.sessionOptions.find((s) => s.id === String(this.editSessionId()) || s.number === Number(this.editSessionId()));
    const style: MarkerVisualStyleVm = {
      iconMode: this.iconMode(),
      defaultIconName: this.defaultIconName(),
      stampImageUrl: this.iconMode() === 'stamp' ? this.stampImageUrl() : null,
      showIcon: this.showIcon(),
      colorHex: this.colorHex(),
      fontFamily: this.fontFamily(),
      labelPosition: this.labelPosition(),
      iconScale: this.iconScale(),
    };

    this.locationSaved.emit({
      locationKey: loc.locationKey,
      name: this.editName().trim() || loc.name,
      locationType: this.editSubtitle().trim() || loc.locationType,
      hierarchyLevel: this.editHierarchy(),
      parentLocationKey: loc.parentLocationKey,
      mapId: this.map().mapId,
      childMapId: this.editChildMapId() || null,
      linkedSceneKey: this.editSceneKey() || null,
      attachedSessionId: sess?.id ?? null,
      attachedSessionLabel: sess?.label ?? null,
      playerVisibilityPolicy: this.editVisibilityPolicy(),
      style,
      xPercent: this.editXPercent(),
      yPercent: this.editYPercent(),
      discoveryStatus: this.editDiscovery(),
      visibility: this.editVisibility(),
      artworkUrl: loc.artworkUrl,
      description: this.editDescription().trim() || loc.description,
      silent,
    });

    if (feedbackMessage) {
      this.saveNotice.set(feedbackMessage);
    }
  }

  createNewLocationOnMap(): void {
    this.hydratedLocationKey = null;
    this.locationSaved.emit({
      name: 'New Charted Landmark',
      locationType: 'Settlement',
      hierarchyLevel: 'Settlement',
      mapId: this.map().mapId,
      xPercent: 50,
      yPercent: 50,
      discoveryStatus: 'known',
      visibility: 'players',
      description: 'New world landmark added in the Map Editor Studio.',
    });
  }
}
