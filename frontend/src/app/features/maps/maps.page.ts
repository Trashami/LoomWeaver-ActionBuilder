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
  LwCelestialBodyMode,
  LwCreateMapLaunchIntent,
  LwCustomLightKind,
  LwExistingMapSummary,
  LwIconComponent,
  LwMapCameraView,
  LwMapDimensionMode,
  LwMapLayerStatusItem,
  LwMapMaterialPreset,
  LwMapPngAssetBrowserComponent,
  LwMapPngAssetItem,
  LwMapPropertiesInspectorComponent,
  LwMapQualityPreset,
  LwMapStudioLandingComponent,
  LwMapStudioSubbarComponent,
  LwMapToolDockComponent,
  LwMapViewportBarComponent,
  LwSelectedSceneNode,
  LwTerrainSculptOp,
  MapEditorModeTab,
} from '../../shared/ui/public-api';
import { MapHistoryEngineService } from './application/map-history-engine.service';
import { MapPngAssetApiService } from './application/map-png-asset-api.service';
import { MapSceneCommandsService } from './application/map-scene-commands.service';
import { MapStudioStoreService } from './application/map-studio-store.service';
import { MapCatalogAssetItem, MapStudioSnapshot } from './application/map-studio.models';
import {
  MapSceneGraphState,
  MapWallSegmentNode,
  WallDrawMode,
} from './engine/map-scene-contract';
import { INITIAL_CINTH_SCENE_GRAPH } from './engine/map-scene-seed';
import {
  DEFAULT_CAMPAIGN_ENCOUNTERS,
  DEFAULT_CAMPAIGN_SESSIONS,
  DEFAULT_EDITOR_DATA_LAYERS,
  DEFAULT_EXISTING_MAPS,
  DEFAULT_MAP_MATERIALS,
  INITIAL_SELECTED_WALL_NODE,
} from './engine/map-studio-presets';
import { BabylonMapStageService } from './engine/rendering/babylon-map-stage.service';
import { Real2dMapRenderer } from './engine/rendering/real-2d-map-renderer';
import { WallMeshBuilder } from './engine/walls/wall-mesh.builder';

@Component({
  selector: 'lw-maps-page',
  standalone: true,
  imports: [
    FormsModule,
    LwIconComponent,
    LwMapStudioLandingComponent,
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

  readonly showLandingHub = signal<boolean>(true);
  readonly dimensionMode = signal<LwMapDimensionMode>('3d');
  readonly leftDockCollapsed = signal<boolean>(true);
  readonly rightDockCollapsed = signal<boolean>(true);

  readonly mapTitle = signal<string>('The Forgotten Crypt');
  readonly gridCols = signal<number>(50);
  readonly gridRows = signal<number>(50);
  readonly studioMode = signal<MapEditorModeTab>('build');
  readonly activeDockToolId = signal<string>('wall');
  readonly cameraView = signal<LwMapCameraView>('isometric');
  readonly activeTheme = signal<string>('Abandoned Crypt');
  readonly activeQuality = signal<LwMapQualityPreset>('Balanced 3D');
  readonly gridSizeLabel = signal<string>('5 ft');
  readonly snapEnabled = signal<boolean>(true);
  readonly showPlayerSafeOnly = signal<boolean>(false);

  readonly existingMaps = signal<readonly LwExistingMapSummary[]>(DEFAULT_EXISTING_MAPS);
  readonly campaigns = computed(() =>
    this.store.campaigns().map((c) => ({ id: c.id, name: c.name })),
  );
  readonly sessions = signal(DEFAULT_CAMPAIGN_SESSIONS);
  readonly encounters = signal(DEFAULT_CAMPAIGN_ENCOUNTERS);
  readonly assignSessionId = signal<string>('session-15');
  readonly assignEncounterId = signal<string>('enc-cinth-masquerade');
  readonly assignLocationNodeId = signal<string>('node-loc-ruined-chapel');

  readonly batchBusy = this.pngApi.batchBusy;
  readonly pngPipelineBanner = this.pngApi.pngPipelineBanner;
  readonly selectedPngAssetId = signal<string>('obj-4f9776736fb571f1');
  readonly materials = signal<readonly LwMapMaterialPreset[]>(DEFAULT_MAP_MATERIALS);
  readonly editorLayers = signal<readonly LwMapLayerStatusItem[]>(DEFAULT_EDITOR_DATA_LAYERS);
  readonly selectedNode = signal<LwSelectedSceneNode>(INITIAL_SELECTED_WALL_NODE);

  readonly wallDrawMode = signal<WallDrawMode>('line');
  readonly wallStartAnchor = signal<{ x: number; z: number } | null>(null);
  readonly terrainSculptOp = signal<LwTerrainSculptOp>('raise');
  readonly terrainBrushRadius = signal<number>(4.5);
  readonly terrainBrushDelta = signal<number>(1.4);

  readonly celestialMode = signal<LwCelestialBodyMode>('sun');
  readonly celestialAzimuthDeg = signal<number>(135);
  readonly celestialAltitudeDeg = signal<number>(42);
  readonly shadowDarkness = signal<number>(72);
  readonly customLightKind = signal<LwCustomLightKind>('point');
  readonly customLightColor = signal<string>('#ffae52');
  readonly customLightRange = signal<number>(25);
  readonly torchIntensity = signal<number>(115);

  readonly scatterDensity = signal<number>(68);
  readonly waterFlowSpeed = signal<number>(1.4);
  readonly activeCatalogAsset = signal<MapCatalogAssetItem | null>(null);
  readonly activeToolId = signal<string>('walls');
  readonly selectedSceneKey = signal<string>('scene-forgotten-crypt');
  readonly sceneGraph = signal<MapSceneGraphState>(INITIAL_CINTH_SCENE_GRAPH);

  readonly displayedAssets = computed<readonly LwMapPngAssetItem[]>(() => {
    if (this.dimensionMode() === '2d') return this.pngApi.bumpHeightAssets2d();
    const floors = this.pngApi.bumpHeightAssets2d().filter((a) => a.isFloor);
    const models = this.pngApi.pngAssets3d().filter((a) => !a.isFloor);
    return [...floors, ...models];
  });

  readonly displayedCategories = computed<readonly string[]>(() =>
    this.dimensionMode() === '2d'
      ? ['All', 'Flooring (Bump/Height)', 'Walls & Cliffs (Bump/Height)', 'Stamps & Props (Bump/Height)']
      : ['All', 'Flooring (Bump/Height)', 'Architecture', 'Furniture', 'Props', 'Nature', 'Rocks & Cliffs', 'Lighting', 'Tokens'],
  );

  readonly show3dCanvas = computed(() => this.dimensionMode() === '3d' && this.cameraView() !== 'real-2d');
  readonly show2dCanvas = computed(
    () => this.dimensionMode() === '2d' || this.cameraView() === 'real-2d' || this.cameraView() === 'split-2d-3d',
  );

  ngAfterViewInit(): void {
    this.pngApi.loadPngAssetManifest();
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  private mountStudioViewports(): void {
    setTimeout(() => {
      const canvas = this.canvasRef?.nativeElement;
      if (canvas) {
        this.stage.mountCanvas(
          canvas,
          this.sceneGraph(),
          (x, z) => this.applyCanvasStrokeAt(x, z),
          (hx, hz) => this.onCanvasHoverAt(hx, hz),
        );
        this.syncGhostCursorToStage();
        this.pushCelestialLightToStage();
      }
      this.render2dViewport();
    }, 35);
  }

  onCreateMapFromLanding(intent: LwCreateMapLaunchIntent): void {
    this.mapTitle.set(intent.name);
    this.studio.mapTitle.set(intent.name);
    this.gridCols.set(intent.gridCols);
    this.gridRows.set(intent.gridRows);
    this.store.setCampaign(intent.campaignId);
    this.assignSessionId.set(intent.sessionId);
    this.assignEncounterId.set(intent.encounterId);
    this.dimensionMode.set(intent.dimensionMode);
    this.cameraView.set(intent.dimensionMode === '2d' ? 'real-2d' : 'isometric');
    this.leftDockCollapsed.set(true);
    this.rightDockCollapsed.set(true);
    this.showLandingHub.set(false);
    this.mountStudioViewports();
    const starterFloor = this.pngApi.bumpHeightAssets2d().find((f) => f.id === intent.starterFloorBumpId);
    if (starterFloor?.albedoUrl && starterFloor.normalUrl) {
      setTimeout(() => this.stage.applyFloorBumpMap(starterFloor.albedoUrl!, starterFloor.normalUrl!), 90);
    }
  }

  onOpenExistingMapFromLanding(summary: LwExistingMapSummary): void {
    this.selectedSceneKey.set(summary.sceneKey);
    this.mapTitle.set(summary.name);
    this.studio.mapTitle.set(summary.name);
    this.store.setCampaign(summary.campaignId);
    this.dimensionMode.set(summary.dimensionMode);
    this.cameraView.set(summary.dimensionMode === '2d' ? 'real-2d' : 'isometric');
    this.leftDockCollapsed.set(true);
    this.rightDockCollapsed.set(true);
    this.showLandingHub.set(false);
    this.mountStudioViewports();
  }

  onDimensionModeSwitch(mode: LwMapDimensionMode): void {
    this.dimensionMode.set(mode);
    this.onCameraViewChange(mode === '2d' ? 'real-2d' : 'isometric');
    if (mode === '3d') this.mountStudioViewports();
  }

  onDockToolSelected(dockToolId: string): void {
    this.activeDockToolId.set(dockToolId);
    this.wallStartAnchor.set(null);
    if (dockToolId === 'room') this.wallDrawMode.set('room');
    else if (dockToolId === 'wall') this.wallDrawMode.set('line');
    const mapToEngineTool: Record<string, string> = {
      select: 'stamps', 'floor-bump': 'terrain', terrain: 'terrain',
      wall: 'walls', room: 'walls', door: 'walls', objects: 'stamps',
      lighting: 'lighting', 'sun-moon': 'lighting', water: 'water', scatter: 'scatter', annotate: 'stamps',
    };
    this.activeToolId.set(mapToEngineTool[dockToolId] ?? 'stamps');
    this.syncGhostCursorToStage();
  }

  onSelectPngAsset(asset: LwMapPngAssetItem): void {
    this.selectedPngAssetId.set(asset.id);
    if (asset.isFloor && asset.albedoUrl && asset.normalUrl) {
      this.stage.applyFloorBumpMap(asset.albedoUrl, asset.normalUrl);
      this.pngPipelineBanner.set(`Applied 2D Bump/Height Flooring: ${asset.name}`);
      return;
    }
    const isWall = asset.category.toLowerCase().includes('wall') || asset.name.toLowerCase().includes('wall');
    this.activeDockToolId.set(isWall ? 'wall' : 'objects');
    this.selectedNode.update((cur) => ({
      ...cur,
      id: asset.id,
      name: asset.name,
      kind: isWall ? 'wall' : 'prop',
      subtitle: `${asset.category} · Ghost Ready`,
      thumbnailUrl: asset.thumbnailUrl,
    }));
    this.syncGhostCursorToStage();
  }

  onPlacePngAssetInScene(asset: LwMapPngAssetItem): void {
    this.onSelectPngAsset(asset);
    if (asset.isFloor) return;
    const coords = this.stage.hoverCoords();
    this.placeStampAt(asset.name, asset.category, coords.x, coords.z);
  }

  private placeStampAt(label: string, category: string, x: number, z: number): void {
    const node = this.selectedNode();
    this.recordHistoryBeforeEdit(`Place Asset -> ${label}`);
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: [
        ...cur.stamps,
        {
          id: `st-${cur.revision + 1}`,
          label,
          category: category === 'Tokens' ? 'Token' : category === 'Architecture' ? 'Architecture' : 'Prop',
          x, z,
          scale: node.scale,
          rotationY: (node.rotationDeg * Math.PI) / 180,
          colorHex: category === 'Lighting' ? '#ffae52' : '#56b886',
        },
      ],
    }));
    this.stage.focusGizmoAt(x, 1.3, z);
  }

  syncGhostCursorToStage(): void {
    const tool = this.activeDockToolId();
    const node = this.selectedNode();
    const kind = tool === 'wall' || tool === 'room' ? 'wall' : tool === 'terrain' ? 'terrain' : tool === 'lighting' || tool === 'sun-moon' ? 'light' : 'prop';
    this.stage.setGhostConfig(
      {
        enabled: tool !== 'select',
        label: node.name,
        kind,
        scale: tool === 'terrain' ? this.terrainBrushRadius() : node.scale,
        rotationRad: (node.rotationDeg * Math.PI) / 180,
        heightMeters: node.heightSquares * 1.5,
        thicknessMeters: 0.45 * node.thickness,
        wallDrawMode: this.wallDrawMode(),
      },
      this.wallStartAnchor(),
    );
  }

  onCanvasHoverAt(hx: number, hz: number): void {
    if (this.activeDockToolId() === 'sun-moon') {
      this.celestialAzimuthDeg.set(Math.round(((Math.atan2(hz, hx) * 180) / Math.PI + 360) % 360));
      this.pushCelestialLightToStage();
    }
    if (this.show2dCanvas()) this.render2dViewport(hx, hz);
  }

  applyCanvasStrokeAt(x: number, z: number): void {
    const dockTool = this.activeDockToolId();
    const px = this.snapEnabled() ? Math.round(x * 2) / 2 : x;
    const pz = this.snapEnabled() ? Math.round(z * 2) / 2 : z;
    this.selectedNode.update((cur) => ({ ...cur, gridX: px, gridZ: pz }));

    if (dockTool === 'terrain') {
      this.stage.sculptTerrainAt(px, pz, this.terrainBrushRadius(), this.terrainBrushDelta(), this.terrainSculptOp());
      return;
    }
    if (dockTool === 'sun-moon') {
      this.celestialAzimuthDeg.set(Math.round(((Math.atan2(pz, px) * 180) / Math.PI + 360) % 360));
      this.celestialAltitudeDeg.set(Math.max(10, Math.min(86, Math.round(85 - Math.min(20, Math.hypot(px, pz)) * 3.4))));
      this.pushCelestialLightToStage();
      return;
    }
    if (dockTool === 'lighting') {
      this.onSpawnCustomLightAt(px, pz);
      return;
    }
    if (dockTool === 'wall' || dockTool === 'room') {
      const anchor = this.wallStartAnchor();
      if (!anchor) {
        this.wallStartAnchor.set({ x: px, z: pz });
        this.syncGhostCursorToStage();
        return;
      }
      const pts = WallMeshBuilder.buildShapePoints(this.wallDrawMode(), anchor.x, anchor.z, px, pz);
      const node = this.selectedNode();
      const newWall: MapWallSegmentNode = {
        id: `wall-${this.sceneGraph().revision + 1}`,
        name: node.name,
        drawMode: this.wallDrawMode(),
        material: 'Crypt Ashlar Stone',
        heightMeters: node.heightSquares * 1.5,
        thicknessMeters: 0.45 * node.thickness,
        perspective: 'auto',
        projection: 'inward',
        hasCornerPosts: true,
        levelIndex: 0,
        points: pts,
        openings: [],
      };
      this.wallStartAnchor.set(null);
      this.syncGhostCursorToStage();
      this.recordHistoryBeforeEdit(`Draw Gapless 3D Wall (${this.wallDrawMode()})`);
      this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, walls: [...(cur.walls ?? []), newWall] }));
      return;
    }
    if (dockTool === 'objects') {
      this.placeStampAt(this.selectedNode().name, 'Prop', px, pz);
      return;
    }
    this.recordHistoryBeforeEdit(`Tool [${dockTool}] at (${px}, ${pz})`);
    this.commitSceneUpdate((cur) => this.commands.applyToolStroke(cur, this.activeToolId(), px, pz, this.terrainBrushRadius(), this.activeCatalogAsset()).nextGraph);
  }

  onSpawnCustomLightAt(x?: number, z?: number): void {
    const coords = this.stage.lastPickedCoords();
    this.recordHistoryBeforeEdit('Add Custom Scene Light');
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      lights: [
        ...cur.lights,
        {
          id: `light-${cur.revision + 1}`,
          label: `${this.customLightKind().toUpperCase()} Light`,
          colorHex: this.customLightColor(),
          intensity: this.torchIntensity() / 100,
          range: this.customLightRange(),
          x: x ?? coords.x,
          y: 2.8,
          z: z ?? coords.z,
        },
      ],
    }));
  }

  pushCelestialLightToStage(): void {
    this.stage.updateCelestialLight({
      mode: this.celestialMode(),
      azimuthDeg: this.celestialAzimuthDeg(),
      altitudeDeg: this.celestialAltitudeDeg(),
      shadowDarkness: this.shadowDarkness(),
    });
  }

  on2dCanvasMove(event: MouseEvent): void {
    const canvas = this.canvas2dRef?.nativeElement;
    if (!canvas) return;
    const coords = Real2dMapRenderer.screenToWorld(canvas, event.clientX, event.clientY);
    this.render2dViewport(coords.x, coords.z);
  }

  on2dCanvasClick(event: MouseEvent): void {
    const canvas = this.canvas2dRef?.nativeElement;
    if (!canvas) return;
    const coords = Real2dMapRenderer.screenToWorld(canvas, event.clientX, event.clientY);
    this.applyCanvasStrokeAt(coords.x, coords.z);
  }

  private render2dViewport(ghostX?: number, ghostZ?: number): void {
    const canvas = this.canvas2dRef?.nativeElement;
    if (!canvas) return;
    Real2dMapRenderer.renderSceneToCanvas(canvas, this.sceneGraph(), {
      hideGmSecrets: this.showPlayerSafeOnly(),
      selectedNodeId: this.selectedNode().id,
      ghostX,
      ghostZ,
      ghostLabel: this.selectedNode().name,
      wallStartAnchor: this.wallStartAnchor(),
      celestialMode: this.celestialMode(),
      celestialAzimuthDeg: this.celestialAzimuthDeg(),
      celestialAltitudeDeg: this.celestialAltitudeDeg(),
    });
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
    this.commitSceneUpdate((cur) => ({ ...cur, biome: theme, revision: cur.revision + 1 }));
  }

  onQualityChange(preset: LwMapQualityPreset): void {
    this.activeQuality.set(preset);
    this.stage.setQualityPreset(preset);
  }

  onTogglePlayerSafeView(): void {
    this.showPlayerSafeOnly.update((v) => !v);
    this.stage.setPlayerSafeFilter(this.showPlayerSafeOnly(), this.sceneGraph());
    this.render2dViewport();
  }

  onExportScenePng(variant: 'gm' | 'player-safe'): void {
    this.showPlayerSafeOnly.set(variant === 'player-safe');
    this.stage.setPlayerSafeFilter(variant === 'player-safe', this.sceneGraph());
    this.render2dViewport();
    this.pngPipelineBanner.set(`Exported ${variant === 'player-safe' ? 'Player-Safe' : 'GM Master'} PNG.`);
  }

  onInspectorPositionChange(axis: 'x' | 'z', value: number): void {
    this.selectedNode.update((cur) => (axis === 'x' ? { ...cur, gridX: value } : { ...cur, gridZ: value }));
    this.commitSceneUpdate((cur) => ({
      ...cur,
      revision: cur.revision + 1,
      stamps: cur.stamps.map((s, idx) => (idx === cur.stamps.length - 1 ? (axis === 'x' ? { ...s, x: value } : { ...s, z: value }) : s)),
    }));
  }

  onInspectorMaterialChange(materialId: string): void {
    const found = this.materials().find((m) => m.id === materialId);
    this.selectedNode.update((cur) => ({ ...cur, materialId }));
    if (found) {
      this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, walls: (cur.walls ?? []).map((w) => ({ ...w, material: found.name })) }));
    }
  }

  onInspectorHeightChange(heightSquares: number): void {
    this.selectedNode.update((cur) => ({ ...cur, heightSquares, subtitle: `Wall · ${heightSquares * 5} ft` }));
    this.syncGhostCursorToStage();
    this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, walls: (cur.walls ?? []).map((w) => ({ ...w, heightMeters: heightSquares * 1.5 })) }));
  }

  onInspectorThicknessChange(thickness: number): void {
    this.selectedNode.update((cur) => ({ ...cur, thickness }));
    this.syncGhostCursorToStage();
    this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, walls: (cur.walls ?? []).map((w) => ({ ...w, thicknessMeters: 0.45 * thickness })) }));
  }

  onInspectorRotationChange(rotationDeg: number): void {
    this.selectedNode.update((cur) => ({ ...cur, rotationDeg }));
    this.syncGhostCursorToStage();
    const rad = (rotationDeg * Math.PI) / 180;
    this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, stamps: cur.stamps.map((s, idx) => (idx === cur.stamps.length - 1 ? { ...s, rotationY: rad } : s)) }));
  }

  onInspectorScaleChange(scale: number): void {
    this.selectedNode.update((cur) => ({ ...cur, scale }));
    this.syncGhostCursorToStage();
    this.commitSceneUpdate((cur) => ({ ...cur, revision: cur.revision + 1, stamps: cur.stamps.map((s, idx) => (idx === cur.stamps.length - 1 ? { ...s, scale } : s)) }));
  }

  onInspectorSecretToggle(): void {
    this.selectedNode.update((cur) => ({ ...cur, gmSecretOnly: !cur.gmSecretOnly }));
    this.render2dViewport();
  }

  onLayerToggleVisible(layerId: string): void {
    this.editorLayers.update((layers) => layers.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)));
  }

  onLayerToggleSecret(layerId: string): void {
    this.editorLayers.update((layers) => layers.map((l) => (l.id === layerId ? { ...l, gmSecretOnly: !l.gmSecretOnly } : l)));
  }

  triggerPythonBatchPngSync(): void {
    this.pngApi.triggerPythonBatchPngSync();
  }

  onUploadSingleGlb(file: File): void {
    this.pngApi.uploadSingleGlb(file, (asset) => this.onSelectPngAsset(asset));
  }

  private captureCurrentSnapshot(label: string): MapStudioSnapshot {
    return { label, timestamp: `Rev ${this.sceneGraph().revision}`, sceneGraph: this.sceneGraph(), layers: this.studio.layers(), activeLevelIndex: this.studio.activeLevelIndex() };
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
    this.studio.saveAuthoritativeRevision(this.selectedSceneKey(), this.sceneGraph().revision, this.store.viewerRole(), (newRev) => this.sceneGraph.update((cur) => ({ ...cur, revision: newRev })));
    this.pngPipelineBanner.set(`Saved '${this.mapTitle()}' (Rev ${this.sceneGraph().revision}).`);
  }

  publishMapToCoreCampaign(): void {
    this.saveSceneRevision();
    const campName = this.store.activeCampaign().name;
    const sessLabel = this.sessions().find((s) => s.id === this.assignSessionId())?.label ?? this.assignSessionId();
    const encLabel = this.encounters().find((e) => e.id === this.assignEncounterId())?.label ?? this.assignEncounterId();
    this.adventureGuide.assignBattlemapToSessionAndPlace({
      sceneKey: this.selectedSceneKey(), sceneTitle: this.mapTitle(), sessionId: this.assignSessionId(),
      locationNodeId: this.assignLocationNodeId(), artworkUrl: '/battlemap-showcase.jpg', biome: this.activeTheme(),
    });
    this.pngPipelineBanner.set(`Published '${this.mapTitle()}' (${this.dimensionMode().toUpperCase()}) -> ${campName} · ${sessLabel} · ${encLabel}`);
  }
}
