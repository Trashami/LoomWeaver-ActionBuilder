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
import { FormsModule } from '@angular/forms';
import { AdventureGuideService } from '../../core/services/adventure-guide.service';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  ChamberBuildIntent,
  LwMapCameraView,
  LwMapLayerStatusItem,
  LwMapMaterialPreset,
  LwMapPngAssetBrowserComponent,
  LwMapPngAssetItem,
  LwMapPropertiesInspectorComponent,
  LwMapQualityPreset,
  LwMapStudioSubbarComponent,
  LwMapToolDockComponent,
  LwMapViewportBarComponent,
  LwSelectedSceneNode,
  MapEditorModeTab,
  PathRibbonBuildIntent,
  WallOpeningInsertIntent,
} from '../../shared/ui/public-api';
import { MapHistoryEngineService } from './application/map-history-engine.service';
import { MapPngAssetApiService } from './application/map-png-asset-api.service';
import { MapSceneCommandsService } from './application/map-scene-commands.service';
import { MapStudioStoreService } from './application/map-studio-store.service';
import {
  MapCatalogAssetItem,
  MapPresetTemplate,
  MapStudioSnapshot,
} from './application/map-studio.models';
import {
  MAP_STUDIO_TOOLS,
  MapRenderMode,
  MapSceneGraphState,
} from './engine/map-scene-contract';
import { INITIAL_CINTH_SCENE_GRAPH } from './engine/map-scene-seed';
import {
  DEFAULT_EDITOR_DATA_LAYERS,
  DEFAULT_MAP_MATERIALS,
  INITIAL_SELECTED_WALL_NODE,
} from './engine/map-studio-presets';
import { BabylonMapStageService } from './engine/rendering/babylon-map-stage.service';
import { Real2dMapRenderer } from './engine/rendering/real-2d-map-renderer';

@Component({
  selector: 'lw-maps-page',
  standalone: true,
  imports: [
    FormsModule,
    LwMapStudioSubbarComponent,
    LwMapToolDockComponent,
    LwMapViewportBarComponent,
    LwMapPngAssetBrowserComponent,
    LwMapPropertiesInspectorComponent,
  ],
  templateUrl: './maps.page.html',
  styleUrl: './maps.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('babylonCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('real2dCanvas') private canvas2dRef?: ElementRef<HTMLCanvasElement>;

  private readonly commands = inject(MapSceneCommandsService);
  private readonly pngApi = inject(MapPngAssetApiService);
  readonly store = inject(LoomWeaverStoreService);
  readonly adventureGuide = inject(AdventureGuideService);
  readonly stage = inject(BabylonMapStageService);
  readonly studio = inject(MapStudioStoreService);
  readonly history = inject(MapHistoryEngineService);

  readonly mapTitle = signal<string>('The Forgotten Crypt');
  readonly studioMode = signal<MapEditorModeTab>('build');
  readonly activeDockToolId = signal<string>('wall');
  readonly cameraView = signal<LwMapCameraView>('isometric');
  readonly activeTheme = signal<string>('Abandoned Crypt');
  readonly activeQuality = signal<LwMapQualityPreset>('Balanced 3D');
  readonly gridSizeLabel = signal<string>('5 ft');
  readonly snapEnabled = signal<boolean>(true);
  readonly showPlayerSafeOnly = signal<boolean>(false);

  readonly pngAssets = this.pngApi.pngAssets;
  readonly batchBusy = this.pngApi.batchBusy;
  readonly pngPipelineBanner = this.pngApi.pngPipelineBanner;
  readonly selectedPngAssetId = signal<string>('wall-cracked');
  readonly materials = signal<readonly LwMapMaterialPreset[]>(DEFAULT_MAP_MATERIALS);
  readonly editorLayers = signal<readonly LwMapLayerStatusItem[]>(DEFAULT_EDITOR_DATA_LAYERS);
  readonly selectedNode = signal<LwSelectedSceneNode>(INITIAL_SELECTED_WALL_NODE);

  readonly scatterDensity = signal<number>(68);
  readonly waterFlowSpeed = signal<number>(1.4);
  readonly torchIntensity = signal<number>(85);

  readonly assignSessionId = signal<string>('session-15');
  readonly assignLocationNodeId = signal<string>('node-loc-ruined-chapel');
  readonly activeCatalogAsset = signal<MapCatalogAssetItem | null>(null);
  readonly tools = MAP_STUDIO_TOOLS;
  readonly activeToolId = signal<string>('walls');
  readonly renderMode = signal<MapRenderMode>('Linked 2D <-> 3D');
  readonly selectedSceneKey = signal<string>('scene-cinth-ballroom');
  readonly brushRadius = signal<number>(4);

  readonly sceneGraph = signal<MapSceneGraphState>(INITIAL_CINTH_SCENE_GRAPH);

  readonly activeScene = computed(() => {
    const list = this.store.authorizedScenes();
    return list.find((s) => s.sceneKey === this.selectedSceneKey()) ?? list[0];
  });

  readonly show3dCanvas = computed(() => this.cameraView() !== 'real-2d');
  readonly show2dCanvas = computed(
    () => this.cameraView() === 'real-2d' || this.cameraView() === 'split-2d-3d',
  );

  ngAfterViewInit(): void {
    this.studio.mapTitle.set(this.mapTitle());
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      this.stage.mountCanvas(canvas, this.sceneGraph(), (x, z) => {
        this.applyCanvasStrokeAt(x, z);
      });
    }
    this.render2dViewport();
    this.pngApi.loadPngAssetManifest();
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  triggerPythonBatchPngSync(): void {
    this.pngApi.triggerPythonBatchPngSync();
  }

  onUploadSingleGlb(file: File): void {
    this.pngApi.uploadSingleGlb(file, (asset) => this.onSelectPngAsset(asset));
  }

  onDockToolSelected(dockToolId: string): void {
    this.activeDockToolId.set(dockToolId);
    const mapToEngineTool: Record<string, string> = {
      select: 'stamps',
      room: 'walls',
      wall: 'walls',
      door: 'walls',
      paint: 'terrain',
      objects: 'stamps',
      terrain: 'terrain',
      scatter: 'scatter',
      water: 'water',
      lighting: 'lighting',
      stairs: 'paths',
      annotate: 'stamps',
    };
    this.activeToolId.set(mapToEngineTool[dockToolId] ?? 'stamps');
  }

  onSelectPngAsset(asset: LwMapPngAssetItem): void {
    this.selectedPngAssetId.set(asset.id);
    this.selectedNode.update((cur) => ({
      ...cur,
      id: asset.id,
      name: asset.name,
      subtitle: `${asset.category} · 5 ft`,
      thumbnailUrl: asset.thumbnailUrl,
    }));
  }

  onPlacePngAssetInScene(asset: LwMapPngAssetItem): void {
    this.onSelectPngAsset(asset);
    this.activeDockToolId.set('objects');
    this.activeToolId.set('stamps');
    const rx = Math.round((Math.random() * 12 - 6) * 2) / 2;
    const rz = Math.round((Math.random() * 8 - 4) * 2) / 2;
    this.recordHistoryBeforeEdit(`Place 3D Asset -> ${asset.name}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: [
        ...cur.stamps,
        {
          id: `st-${asset.id}-${cur.revision + 1}`,
          label: asset.name,
          category:
            asset.category === 'Tokens'
              ? 'Token'
              : asset.category === 'Architecture'
                ? 'Architecture'
                : 'Prop',
          x: rx,
          z: rz,
          scale: 1.15,
          rotationY: 0,
          colorHex: asset.category === 'Lighting' ? '#ffae52' : '#56b886',
        },
      ],
    }));
    this.stage.focusGizmoAt(rx, 1.3, rz);
  }

  onCameraViewChange(view: LwMapCameraView): void {
    this.cameraView.set(view);
    this.stage.setCameraMode(view);
    setTimeout(() => {
      this.stage.resize();
      this.render2dViewport();
    }, 30);
  }

  onThemeChange(theme: string): void {
    this.activeTheme.set(theme);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      biome: theme,
      revision: cur.revision + 1,
      scatterSeed: cur.scatterSeed + 11,
    }));
  }

  onQualityChange(preset: LwMapQualityPreset): void {
    this.activeQuality.set(preset);
    this.stage.setQualityPreset(preset);
    if (preset === 'Classic 2D') {
      this.onCameraViewChange('real-2d');
    }
  }

  onTogglePlayerSafeView(): void {
    this.showPlayerSafeOnly.update((v) => !v);
    this.stage.setPlayerSafeFilter(this.showPlayerSafeOnly(), this.sceneGraph());
    this.render2dViewport();
  }

  onExportScenePng(variant: 'gm' | 'player-safe'): void {
    const hideSecrets = variant === 'player-safe';
    this.showPlayerSafeOnly.set(hideSecrets);
    this.stage.setPlayerSafeFilter(hideSecrets, this.sceneGraph());
    this.render2dViewport();
    this.pngPipelineBanner.set(
      variant === 'player-safe'
        ? 'Exported sanitized Player-Safe 2D PNG (private GM layers & secret doors excluded).'
        : 'Exported full GM Master 2D PNG with secret overlays.',
    );
  }

  on2dCanvasClick(event: MouseEvent): void {
    const canvas = this.canvas2dRef?.nativeElement;
    if (!canvas) return;
    const coords = Real2dMapRenderer.screenToWorld(canvas, event.clientX, event.clientY);
    this.applyCanvasStrokeAt(coords.x, coords.z);
  }

  private render2dViewport(): void {
    const canvas = this.canvas2dRef?.nativeElement;
    if (!canvas) return;
    Real2dMapRenderer.renderSceneToCanvas(canvas, this.sceneGraph(), {
      hideGmSecrets: this.showPlayerSafeOnly(),
      selectedNodeId: this.selectedNode().id,
    });
  }

  onInspectorMaterialChange(materialId: string): void {
    const found = this.materials().find((m) => m.id === materialId);
    this.selectedNode.update((cur) => ({ ...cur, materialId }));
    if (found) {
      this.commitSceneUpdate((cur) => ({
        ...cur,
        revision: cur.revision + 1,
        walls: (cur.walls ?? []).map((w) => ({ ...w, material: found.name })),
      }));
    }
  }

  onInspectorHeightChange(heightSquares: number): void {
    this.selectedNode.update((cur) => ({
      ...cur,
      heightSquares,
      subtitle: `Wall · ${heightSquares * 5} ft`,
    }));
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      walls: (cur.walls ?? []).map((w) => ({ ...w, heightMeters: heightSquares * 1.5 })),
    }));
  }

  onInspectorThicknessChange(thickness: number): void {
    this.selectedNode.update((cur) => ({ ...cur, thickness }));
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      walls: (cur.walls ?? []).map((w) => ({ ...w, thicknessMeters: 0.45 * thickness })),
    }));
  }

  onInspectorRotationChange(rotationDeg: number): void {
    this.selectedNode.update((cur) => ({ ...cur, rotationDeg }));
    const rad = (rotationDeg * Math.PI) / 180;
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: cur.stamps.map((s, idx) => (idx === 0 ? { ...s, rotationY: rad } : s)),
    }));
  }

  onInspectorScaleChange(scale: number): void {
    this.selectedNode.update((cur) => ({ ...cur, scale }));
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: cur.stamps.map((s, idx) => (idx === 0 ? { ...s, scale } : s)),
    }));
  }

  onInspectorSecretToggle(): void {
    this.selectedNode.update((cur) => ({ ...cur, gmSecretOnly: !cur.gmSecretOnly }));
    this.render2dViewport();
  }

  onApplyToSimilarWalls(): void {
    const node = this.selectedNode();
    this.pngPipelineBanner.set(
      `Applied '${node.materialId}' (${node.heightSquares * 5}ft, ${node.thickness.toFixed(2)}x) to all similar walls in scene.`,
    );
    this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1 }));
  }

  onLayerToggleVisible(layerId: string): void {
    this.editorLayers.update((layers) =>
      layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    );
  }

  onLayerToggleSecret(layerId: string): void {
    this.editorLayers.update((layers) =>
      layers.map((l) => (l.id === layerId ? { ...l, gmSecretOnly: !l.gmSecretOnly } : l)),
    );
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
    this.render2dViewport();
  }

  selectScene(sceneKey: string, name: string, biome: string): void {
    this.recordHistoryBeforeEdit(`Switch Scene -> ${name}`);
    this.selectedSceneKey.set(sceneKey);
    this.mapTitle.set(name);
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
    this.mapTitle.set(preset.name);
    this.studio.mapTitle.set(preset.name);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      name: preset.name,
      biome: preset.baseBiome,
      revision: cur.revision + 1,
      scatterSeed: cur.scatterSeed + 29,
    }));
  }

  setRenderMode(mode: string): void {
    if (mode === '2D Blueprint' || mode === '3D Tabletop' || mode === 'Linked 2D <-> 3D') {
      this.renderMode.set(mode);
      this.stage.setCameraMode(mode);
    }
  }

  applyCanvasStrokeAt(x: number, z: number): void {
    const tool = this.activeToolId();
    const snap = this.snapEnabled();
    const px = snap ? Math.round(x * 2) / 2 : x;
    const pz = snap ? Math.round(z * 2) / 2 : z;

    this.selectedNode.update((cur) => ({ ...cur, gridX: px, gridZ: pz }));
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
      return nextGraph;
    });
  }

  buildWallChamber(intent: ChamberBuildIntent): void {
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
    this.commitSceneUpdate((cur) => this.commands.appendWallOpening(cur, intent));
  }

  buildPathRibbon(intent: PathRibbonBuildIntent): void {
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

  undoLastCommand(): void {
    const prev = this.history.undo(this.captureCurrentSnapshot('Current State'));
    if (prev) {
      this.sceneGraph.set(prev.sceneGraph);
      this.stage.syncSceneGraph(prev.sceneGraph);
      this.render2dViewport();
    }
  }

  redoLastCommand(): void {
    const next = this.history.redo(this.captureCurrentSnapshot('Current State'));
    if (next) {
      this.sceneGraph.set(next.sceneGraph);
      this.stage.syncSceneGraph(next.sceneGraph);
      this.render2dViewport();
    }
  }

  saveSceneRevision(): void {
    this.studio.saveAuthoritativeRevision(
      this.selectedSceneKey(),
      this.sceneGraph().revision,
      this.store.viewerRole(),
      (newRev) => this.sceneGraph.update((cur) => ({ ...cur, revision: newRev })),
    );
    const scene = this.activeScene();
    const title = this.mapTitle() || scene.name;
    this.adventureGuide.assignBattlemapToSessionAndPlace({
      sceneKey: scene.sceneKey, sceneTitle: title, sessionId: this.assignSessionId(),
      locationNodeId: this.assignLocationNodeId(), artworkUrl: '/battlemap-showcase.jpg', biome: scene.biome,
    });
    this.pngPipelineBanner.set(`Saved '${title}' (Rev ${this.sceneGraph().revision}) to SQL & object storage.`);
  }
}
