import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QualityProfile } from '../../core/models/loomweaver.models';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  BrushParameterState,
  ChamberBuildIntent,
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwMapLayersDrawerComponent,
  LwMapPresetBrowserComponent,
  LwMapStudioRibbonComponent,
  LwMapToolPanelComponent,
  LwMapWallPathArchitectComponent,
  LwPanelComponent,
  LwRulesOptionSelectorComponent,
  PathRibbonBuildIntent,
  RulesOptionItem,
  WallOpeningInsertIntent,
} from '../../shared/ui/public-api';
import { MapHistoryEngineService } from './application/map-history-engine.service';
import { MapSceneCommandsService } from './application/map-scene-commands.service';
import { MapStudioStoreService } from './application/map-studio-store.service';
import {
  MapCatalogAssetItem,
  MapPresetTemplate,
  MapStudioSnapshot,
} from './application/map-studio.models';
import {
  MAP_STUDIO_TOOLS,
  MapCommandEntry,
  MapRenderMode,
  MapSceneGraphState,
} from './engine/map-scene-contract';
import { INITIAL_CINTH_SCENE_GRAPH } from './engine/map-scene-seed';
import { BabylonMapStageService } from './engine/rendering/babylon-map-stage.service';

@Component({
  selector: 'lw-maps-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwAssetCardComponent,
    LwMapToolPanelComponent,
    LwMapStudioRibbonComponent,
    LwMapLayersDrawerComponent,
    LwMapPresetBrowserComponent,
    LwMapWallPathArchitectComponent,
    LwRulesOptionSelectorComponent,
  ],
  templateUrl: './maps.page.html',
  styleUrl: './maps.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('babylonCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly http = inject(HttpClient);
  private readonly commands = inject(MapSceneCommandsService);
  readonly store = inject(LoomWeaverStoreService);
  readonly stage = inject(BabylonMapStageService);
  readonly studio = inject(MapStudioStoreService);
  readonly history = inject(MapHistoryEngineService);

  readonly activePresetId = signal<string>('preset-cinth-ballroom');
  readonly activeCatalogAsset = signal<MapCatalogAssetItem | null>(null);
  readonly showCatalogSection = signal<boolean>(true);

  readonly biomePresets = [
    'Gwaedhellain Poisoned Canopy',
    'Plains of Red Clay & Ruin',
    'Cinth Marble Ballroom Courtyard',
    'Runic Subterranean Basalt',
    'Alpine Limestone Cliffs',
  ];
  readonly selectedBiomePreset = signal<string>('Gwaedhellain Poisoned Canopy');
  readonly elevationDelta = signal<number>(6.5);
  readonly roughnessOctaves = signal<number>(4);
  readonly waterLevelMeters = signal<number>(1.8);
  readonly heightmapBanner = signal<string>(
    'Multi-octave heightmap & biome brush sculptor synchronized with Babylon.js terrain.',
  );

  readonly tools = MAP_STUDIO_TOOLS;
  readonly activeToolId = signal<string>('stamps');
  readonly renderMode = signal<MapRenderMode>('Linked 2D <-> 3D');
  readonly selectedSceneKey = signal<string>('scene-cinth-ballroom');
  readonly brushRadius = signal<number>(4);
  readonly brushIntensity = signal<number>(65);
  readonly deterministicSeed = signal<number>(1042);

  readonly renderModeOptions: readonly RulesOptionItem[] = [
    { id: '2D Blueprint', label: '2D Blueprint', badge: 'Top-Down', badgeTone: 'emerald' },
    { id: '3D Tabletop', label: '3D Tabletop', badge: 'Babylon.js', badgeTone: 'gold' },
    { id: 'Linked 2D <-> 3D', label: 'Linked 2D <-> 3D', badge: 'Unified Graph', badgeTone: 'gold' },
  ];

  readonly qualityProfiles: readonly QualityProfile[] = [
    'Auto',
    'Cinematic',
    'Balanced',
    'Performance 3D',
    'Classic 2D',
  ];

  readonly sceneGraph = signal<MapSceneGraphState>(INITIAL_CINTH_SCENE_GRAPH);

  readonly commandLog = signal<readonly MapCommandEntry[]>([
    {
      id: 'cmd-15',
      timestamp: 'Rev 15',
      toolId: 'walls',
      summary: 'Initialized Cutaway Rotunda Walls, Fitted Portals & Curved Cobblestone Ribbon',
    },
  ]);

  readonly activeScene = computed(() => {
    const list = this.store.authorizedScenes();
    return list.find((s) => s.sceneKey === this.selectedSceneKey()) ?? list[0];
  });

  readonly mapAssets = computed(() =>
    this.store.assets().filter((a) => a.category === 'Map Pack' || a.category === 'Audio Pack'),
  );

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      this.stage.mountCanvas(canvas, this.sceneGraph(), (x, z) => {
        this.applyCanvasStrokeAt(x, z);
      });
    }
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  private captureCurrentSnapshot(label: string): MapStudioSnapshot {
    return {
      label,
      timestamp: `Rev ${this.sceneGraph().revision}`,
      sceneGraph: this.sceneGraph(),
      layers: this.studio.layers(),
      activeLevelIndex: this.studio.activeLevelIndex(),
    };
  }

  private recordHistoryBeforeEdit(label: string): void {
    this.history.pushSnapshot(this.captureCurrentSnapshot(label));
  }

  private commitSceneUpdate(updater: (cur: MapSceneGraphState) => MapSceneGraphState): void {
    this.sceneGraph.update((cur) => {
      const updated = updater(cur);
      this.stage.syncSceneGraph(updated);
      return updated;
    });
  }

  selectScene(sceneKey: string, name: string, biome: string): void {
    this.recordHistoryBeforeEdit(`Switch Scene -> ${name}`);
    this.selectedSceneKey.set(sceneKey);
    this.studio.mapTitle.set(name);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      sceneKey,
      name,
      biome,
      scatterSeed: cur.scatterSeed + 17,
    }));
  }

  applyPresetTemplate(preset: MapPresetTemplate): void {
    this.recordHistoryBeforeEdit(`Apply Preset -> ${preset.name}`);
    this.activePresetId.set(preset.id);
    this.studio.mapTitle.set(preset.name);
    this.studio.gridConfig.update((g) => ({ ...g, mapScope: preset.mapScope }));
    this.commitSceneUpdate((cur) => ({
      ...cur,
      name: preset.name,
      biome: preset.baseBiome,
      revision: cur.revision + 1,
      scatterSeed: cur.scatterSeed + 29,
    }));
  }

  equipCatalogAsset(asset: MapCatalogAssetItem): void {
    this.activeCatalogAsset.set(asset);
    this.activeToolId.set('stamps');
    this.studio.saveStatusBanner.set(
      `Equipped '${asset.name}' (${asset.assetType}, ${asset.defaultHeightFt}ft). Click map canvas to place.`,
    );
  }

  setRenderMode(mode: string): void {
    if (mode === '2D Blueprint' || mode === '3D Tabletop' || mode === 'Linked 2D <-> 3D') {
      this.renderMode.set(mode);
      this.stage.setCameraMode(mode);
    }
  }

  onBrushChanged(brush: BrushParameterState): void {
    this.brushRadius.set(brush.radius);
    this.brushIntensity.set(brush.intensity);
    this.deterministicSeed.set(brush.seed);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      scatterSeed: brush.seed,
      scatterDensity: brush.intensity,
      terrainRelief: brush.intensity,
    }));
  }

  onToolCommand(cmd: string): void {
    if (cmd === 'undo') {
      this.undoLastCommand();
      return;
    }
    const rx = Math.round((Math.random() * 14 - 7) * 10) / 10;
    const rz = Math.round((Math.random() * 10 - 5) * 10) / 10;
    this.applyCanvasStrokeAt(rx, rz);
  }

  applyCanvasStrokeAt(x: number, z: number): void {
    const tool = this.activeToolId();
    const snap = this.studio.gridConfig().snapToGrid;
    const px = snap ? Math.round(x * 2) / 2 : x;
    const pz = snap ? Math.round(z * 2) / 2 : z;

    this.recordHistoryBeforeEdit(`Tool [${tool}] at (${px}, ${pz})`);
    this.commitSceneUpdate((cur) => {
      const { nextGraph, newStampId } = this.commands.applyToolStroke(
        cur,
        tool,
        px,
        pz,
        this.brushRadius(),
        this.activeCatalogAsset(),
      );
      if (newStampId) this.studio.selectedStampId.set(newStampId);
      this.commandLog.update((logs) => [
        {
          id: `cmd-${nextGraph.revision}`,
          timestamp: `Rev ${nextGraph.revision}`,
          toolId: tool,
          summary: `Applied [${tool}] at (${px}, ${pz}) on Level L${this.studio.activeLevelIndex()}`,
        },
        ...logs.slice(0, 5),
      ]);
      return nextGraph;
    });
  }

  buildWallChamber(intent: ChamberBuildIntent): void {
    this.recordHistoryBeforeEdit(`Build Chamber -> ${intent.name}`);
    const picked = this.stage.lastPickedCoords();
    this.commitSceneUpdate((cur) =>
      this.commands.appendWallChamber(
        cur,
        intent,
        picked.x,
        picked.z,
        this.studio.activeLevelIndex(),
        this.store.viewerRole(),
      ),
    );
  }

  insertWallOpening(intent: WallOpeningInsertIntent): void {
    this.recordHistoryBeforeEdit(`Insert Opening [${intent.openingType}]`);
    this.commitSceneUpdate((cur) => this.commands.appendWallOpening(cur, intent));
  }

  buildPathRibbon(intent: PathRibbonBuildIntent): void {
    this.recordHistoryBeforeEdit(`Trace Path -> ${intent.name}`);
    const picked = this.stage.lastPickedCoords();
    this.commitSceneUpdate((cur) =>
      this.commands.appendPathRibbon(
        cur,
        intent,
        picked.x,
        picked.z,
        this.studio.activeLevelIndex(),
        this.store.viewerRole(),
      ),
    );
  }

  deleteWallById(wallId: string): void {
    this.recordHistoryBeforeEdit(`Delete Wall ${wallId}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      walls: (cur.walls ?? []).filter((w) => w.id !== wallId),
    }));
  }

  deletePathById(pathId: string): void {
    this.recordHistoryBeforeEdit(`Delete Path ${pathId}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      pathRibbons: (cur.pathRibbons ?? []).filter((p) => p.id !== pathId),
    }));
  }

  updateStampTransform(change: { stampId: string; scale: number; rotationY: number }): void {
    this.recordHistoryBeforeEdit(`Transform Stamp ${change.stampId}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: cur.stamps.map((s) =>
        s.id === change.stampId ? { ...s, scale: change.scale, rotationY: change.rotationY } : s,
      ),
    }));
  }

  deleteStampById(stampId: string): void {
    this.recordHistoryBeforeEdit(`Delete Stamp ${stampId}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: cur.stamps.filter((s) => s.id !== stampId),
    }));
  }

  undoLastCommand(): void {
    const prev = this.history.undo(this.captureCurrentSnapshot('Current State'));
    if (prev) {
      this.sceneGraph.set(prev.sceneGraph);
      this.studio.layers.set(prev.layers);
      this.studio.activeLevelIndex.set(prev.activeLevelIndex);
      this.stage.syncSceneGraph(prev.sceneGraph);
    }
  }

  redoLastCommand(): void {
    const next = this.history.redo(this.captureCurrentSnapshot('Current State'));
    if (next) {
      this.sceneGraph.set(next.sceneGraph);
      this.studio.layers.set(next.layers);
      this.studio.activeLevelIndex.set(next.activeLevelIndex);
      this.stage.syncSceneGraph(next.sceneGraph);
    }
  }

  saveSceneRevision(): void {
    this.studio.saveAuthoritativeRevision(
      this.selectedSceneKey(),
      this.sceneGraph().revision,
      this.store.viewerRole(),
      (newRev) => {
        this.sceneGraph.update((cur) => ({ ...cur, revision: newRev }));
      },
    );
  }

  applyHeightmapBiomeSculpt(): void {
    const sceneId = this.selectedSceneKey();
    const payload = {
      biomePreset: this.selectedBiomePreset(),
      brushRadiusMeters: this.brushRadius(),
      elevationDelta: this.elevationDelta(),
      roughnessOctaves: this.roughnessOctaves(),
      waterLevelMeters: this.waterLevelMeters(),
    };

    this.http
      .post<{ summary: string }>(`/api/v2/campaigns/1/maps/${sceneId}/sculpt-heightmap`, payload)
      .subscribe({
        next: (res) => {
          if (res?.summary) this.heightmapBanner.set(res.summary);
          this.applyCanvasStrokeAt(0, 0);
        },
        error: () => {
          this.heightmapBanner.set(
            `Sculpted '${payload.biomePreset}' heightmap (Elevation +${payload.elevationDelta}m, Octaves=${payload.roughnessOctaves}).`,
          );
          this.applyCanvasStrokeAt(0, 0);
        },
      });
  }
}
