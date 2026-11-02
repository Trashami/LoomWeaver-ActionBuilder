import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  MeshoptCompression,
  PointLight,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {
  EffectTimelinePresetVm,
  VttTokenVm,
} from './effect-timeline.contract';
import { TokenDragController, TokenPlacement } from './token-drag-controller';
import { BabylonFogPlane } from './babylon-fog-plane';
import {
  BabylonVttMapSceneBuilder,
  VttMapSceneDataPayload,
} from './babylon-vtt-map-scene.builder';
import { BabylonTokenMeshBuilder } from './babylon-token-mesh.builder';
import { BabylonFxTrajectoryPlayer } from './babylon-fx-trajectory.player';
import { MapSceneGraphState } from '../../maps/engine/map-scene-contract';
import { GlbModelCache } from '../../maps/engine/rendering/glb-model-cache';
import { TerrainMeshBuilder } from '../../maps/engine/terrain/terrain-mesh.builder';
import { WaterChannelTerrain } from '../../maps/engine/water/water-channel-terrain';
import { WaterSplineBuilder } from '../../maps/engine/water/water-spline.builder';
import { SceneLightingController } from '../../maps/engine/lighting/scene-lighting.controller';
import { SeededScatterEngine } from '../../maps/engine/scatter/seeded-scatter.engine';
import { WallMeshBuilder } from '../../maps/engine/walls/wall-mesh.builder';
import { PathRibbonEngine } from '../../maps/engine/paths/path-ribbon.engine';
import { StampSceneBuilder } from '../../maps/engine/rendering/stamp-scene.builder';

if (typeof window !== 'undefined') {
  MeshoptCompression.Configuration = {
    decoder: {
      url: '/assets/object-library/meshopt_decoder.js',
    },
  };
}

@Injectable({ providedIn: 'root' })
export class BabylonEffectStageService {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private dragController: TokenDragController | null = null;
  private fogPlane: BabylonFogPlane | null = null;
  private readonly draggedSubject = new Subject<TokenPlacement>();
  private readonly droppedSubject = new Subject<TokenPlacement>();
  private cleanupHandlers: (() => void)[] = [];
  private ground: Mesh | null = null;
  private groundMat: StandardMaterial | null = null;
  private gridLines: Mesh | null = null;
  private backdropUrl = '';

  private latestSceneData: VttMapSceneDataPayload | MapSceneGraphState | string | null = null;
  private latestBackdropUrl = '';
  private last3dSceneState: MapSceneGraphState | null = null;
  private resyncTimer: ReturnType<typeof setTimeout> | null = null;
  private latestGridVisible = false;

  private latestTokens: readonly VttTokenVm[] = [];
  private latestAttackerKey?: string;
  private latestTargetKey?: string;
  private latestTargetedKeys: readonly string[] = [];
  private latestOpacityByKey: ReadonlyMap<string, number> = new Map();
  private latestGridScale = 1.0;

  private readonly mapSceneBuilder = new BabylonVttMapSceneBuilder();
  private readonly tokenBuilder = new BabylonTokenMeshBuilder();
  private readonly fxPlayer = new BabylonFxTrajectoryPlayer();

  /** Defaults to true so the battlemap always opens in 2D top-down mode unless switched to 3D. */
  private isForcedTopDown = true;

  camera: ArcRotateCamera | null = null;
  readonly has3dSceneLoaded = signal<boolean>(false);
  readonly zoomPercent = signal<number>(100);
  readonly activeKeyframeLabel = signal<string>('Ready');
  readonly reducedMotion = signal<boolean>(false);
  readonly tokenDragged: Observable<TokenPlacement> = this.draggedSubject.asObservable();
  readonly tokenDropped: Observable<TokenPlacement> = this.droppedSubject.asObservable();

  resize(): void {
    this.engine?.resize();
  }

  zoomCamera(delta: number): void {
    if (this.camera) {
      this.camera.radius = Math.max(
        this.camera.lowerRadiusLimit ?? 6,
        Math.min(this.camera.upperRadiusLimit ?? 58, this.camera.radius + delta),
      );
      this.updateZoomPercent();
    }
  }

  resetCamera(): void {
    if (!this.camera) return;
    this.camera.radius = this.has3dSceneLoaded() ? 26 : 20;
    this.camera.target.set(0, 0, 0);
    this.setForcedTopDown(this.isForcedTopDown);
    this.updateZoomPercent();
  }

  private updateZoomPercent(): void {
    if (!this.camera) return;
    const minR = this.camera.lowerRadiusLimit ?? 6;
    const maxR = this.camera.upperRadiusLimit ?? 58;
    const pct = Math.round(100 + ((maxR - this.camera.radius) / (maxR - minR)) * 250);
    this.zoomPercent.set(Math.max(100, Math.min(350, pct)));
  }

  setBackdrop(url: string): void {
    this.latestBackdropUrl = url || '';
    if (this.has3dSceneLoaded()) return;
    if (!this.scene || !this.ground || !this.groundMat || !url || url === this.backdropUrl) return;
    this.backdropUrl = url;
    const tex = new Texture(url, this.scene);
    const ground = this.ground;
    tex.onLoadObservable.addOnce(() => {
      const size = tex.getSize();
      if (size.width > 0 && size.height > 0) {
        ground.scaling.z = size.height / size.width / (16 / 24);
      }
    });
    this.groundMat.diffuseTexture = tex;
    this.groundMat.diffuseColor = Color3.White();
    this.groundMat.specularColor = Color3.Black();
    this.groundMat.emissiveColor = new Color3(0.24, 0.24, 0.24);
  }

  private isMapSceneGraphState(obj: unknown): obj is MapSceneGraphState {
    if (!obj || typeof obj !== 'object') return false;
    const rec = obj as Record<string, unknown>;
    if (typeof rec['biome'] === 'string' && typeof rec['terrainRelief'] === 'number') return true;
    if (Array.isArray(rec['waterSplines']) || Array.isArray(rec['customElevations'])) return true;
    if (typeof rec['floorAlbedoUrl'] === 'string') return true;
    if (
      Array.isArray(rec['walls']) &&
      rec['walls'].some((w) => w && typeof w === 'object' && Array.isArray((w as Record<string, unknown>)['points']))
    ) {
      return true;
    }
    return false;
  }

  private schedule3dSceneResync(): void {
    if (this.resyncTimer !== null) return;
    this.resyncTimer = setTimeout(() => {
      this.resyncTimer = null;
      if (this.scene && this.last3dSceneState) {
        this.sync3dSceneGraph(this.last3dSceneState);
      }
    }, 150);
  }

  private sync3dSceneGraph(state: MapSceneGraphState): void {
    if (!this.scene) return;
    this.last3dSceneState = state;
    this.has3dSceneLoaded.set(true);

    if (this.ground) {
      this.ground.isVisible = false;
      this.ground.isPickable = false;
    }

    this.scene.getLightByName('lw-vtt-hemi')?.setEnabled(false);
    this.scene.getLightByName('lw-vtt-pt')?.setEnabled(false);

    GlbModelCache.ensureScene(this.scene);
    TerrainMeshBuilder.importElevations(state.customElevations ?? null);
    TerrainMeshBuilder.setPaintDabs(this.scene, state.floorPaintDabs ?? []);
    WaterChannelTerrain.configure(this.scene, state.waterSplines ?? []);

    const terrainGround = TerrainMeshBuilder.buildTerrainAndGrid(
      this.scene,
      state.biome || 'Abandoned Crypt',
      state.terrainRelief ?? 0.35,
    );
    if (state.floorAlbedoUrl && state.floorNormalUrl) {
      TerrainMeshBuilder.applyFloorBumpTexture(
        this.scene,
        state.floorAlbedoUrl,
        state.floorNormalUrl,
        state.floorTilingScale ?? 10,
        state.floorHeightUrl,
      );
    }
    TerrainMeshBuilder.configureFloorProperties(this.scene, {
      albedoUrl: state.floorAlbedoUrl,
      normalUrl: state.floorNormalUrl,
      heightUrl: state.floorHeightUrl,
      tilingScale: state.floorTilingScale,
      bumpIntensity: state.floorBumpIntensity,
      heightScale: state.floorHeightScale,
      colorHex: state.floorColorHex,
      colorStrength: state.floorColorStrength,
      colorBlendMode: state.floorColorBlendMode,
    });
    TerrainMeshBuilder.syncReliefAndGridIfChanged(
      this.scene,
      terrainGround,
      state.terrainRelief ?? 0.35,
      state.waterSplines?.length ?? 0,
    );

    const terrainGrid = this.scene.getMeshByName('lw-terrain-grid');
    if (terrainGrid) {
      terrainGrid.isVisible = this.latestGridVisible;
      terrainGrid.isPickable = false;
    }

    WaterSplineBuilder.rebuildWaterSplines(this.scene, state.waterSplines ?? []);
    SceneLightingController.syncLights(this.scene, state.lights ?? []);
    SeededScatterEngine.rebuildScatterInstances(
      this.scene,
      state.scatterSeed ?? 104729,
      state.scatterDensity ?? 0,
      state.scatterClusters,
      () => this.schedule3dSceneResync(),
    );
    WallMeshBuilder.rebuildWallMeshes(
      this.scene,
      state.walls,
      false,
      () => this.schedule3dSceneResync(),
    );
    PathRibbonEngine.rebuildPathRibbonMeshes(this.scene, state.pathRibbons);
    StampSceneBuilder.rebuild(
      this.scene,
      state.stamps ?? [],
      false,
      () => this.schedule3dSceneResync(),
    );
    SceneLightingController.refreshShadowCasters(this.scene);

    if (this.latestTokens.length > 0) {
      this.refreshTokens();
    }
  }

  private clear3dSceneGraph(): void {
    this.last3dSceneState = null;
    this.has3dSceneLoaded.set(false);
    TerrainMeshBuilder.resetElevations();
    if (!this.scene) return;
    StampSceneBuilder.evictScene(this.scene);
    WallMeshBuilder.evictScene(this.scene);
    this.scene.transformNodes
      .filter((n) => /^lw-(stamp-node|wall-node|door-node|scatter-node)-/.test(n.name))
      .forEach((n) => n.dispose(false, false));
    this.scene.meshes
      .filter((m) =>
        /^lw-(terrain-ground|terrain-grid|water-|stamp-|wall-|portal-|door-|scatter-|path-)/.test(
          m.name,
        ),
      )
      .forEach((m) => m.dispose(false, false));
    if (this.ground) {
      this.ground.isVisible = true;
      this.ground.isPickable = true;
    }
    this.scene.getLightByName('lw-vtt-hemi')?.setEnabled(true);
    this.scene.getLightByName('lw-vtt-pt')?.setEnabled(true);
  }

  loadMapScene(
    sceneData?: VttMapSceneDataPayload | MapSceneGraphState | string | null,
    backdropUrl?: string,
  ): void {
    this.latestSceneData = sceneData ?? null;
    if (backdropUrl !== undefined) {
      this.latestBackdropUrl = backdropUrl;
    }
    if (!this.scene) return;

    let parsed: VttMapSceneDataPayload | MapSceneGraphState | null = null;
    if (sceneData) {
      if (typeof sceneData === 'string') {
        try {
          parsed = JSON.parse(sceneData);
        } catch {}
      } else {
        parsed = sceneData;
      }
    }

    if (parsed && this.isMapSceneGraphState(parsed)) {
      this.mapSceneBuilder.clear(this.scene);
      if (this.gridLines) {
        this.gridLines.dispose();
        this.gridLines = null;
      }
      this.sync3dSceneGraph(parsed);
      return;
    }

    if (this.has3dSceneLoaded()) {
      this.clear3dSceneGraph();
    }
    if (this.latestBackdropUrl) {
      this.setBackdrop(this.latestBackdropUrl);
    }
    if (parsed) {
      this.mapSceneBuilder.buildScene(this.scene, parsed as VttMapSceneDataPayload);
    } else {
      this.mapSceneBuilder.clear(this.scene);
    }
    SceneLightingController.syncCelestialDirectionalLight(this.scene, {
      mode: 'sun',
      azimuthDeg: 135,
      altitudeDeg: 42,
      shadowDarkness: 72,
      showSkyOrb: false,
    });
    SceneLightingController.refreshShadowCasters(this.scene);
  }

  /**
   * Switches between forced top-down 2D camera (default) and free 3D perspective orbit camera.
   * Both modes render the real 3D map scene when a 3D map is loaded.
   */
  setForcedTopDown(forced: boolean): void {
    const modeChanged = this.isForcedTopDown !== forced;
    this.isForcedTopDown = forced;
    if (!this.camera) return;
    this.camera.inertialAlphaOffset = 0;
    this.camera.inertialBetaOffset = 0;
    this.camera.inertialPanningX = 0;
    this.camera.inertialPanningY = 0;
    if (forced) {
      this.camera.lowerAlphaLimit = -Math.PI / 2;
      this.camera.upperAlphaLimit = -Math.PI / 2;
      this.camera.lowerBetaLimit = 0.0001;
      this.camera.upperBetaLimit = 0.0001;
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.0001;
      this.camera.panningAxis = new Vector3(1, 1, 0);
      (this.camera as unknown as { _panningMouseButton: number })._panningMouseButton = 0;
    } else {
      this.camera.lowerAlphaLimit = null;
      this.camera.upperAlphaLimit = null;
      this.camera.lowerBetaLimit = 0.1;
      this.camera.upperBetaLimit = Math.PI / 2.05;
      if (modeChanged) {
        this.camera.alpha = -Math.PI / 2.2;
        this.camera.beta = 0.82;
      }
      this.camera.panningAxis = new Vector3(1, 1, 0);
      (this.camera as unknown as { _panningMouseButton: number })._panningMouseButton = 2;
    }
    if (modeChanged && this.scene && this.latestTokens.length > 0) {
      this.refreshTokens();
    }
  }

  setGridVisible(
    visible: boolean,
    gridScale: number = 1.0,
    gridOffsetX: number = 0.0,
    gridOffsetY: number = 0.0,
  ): void {
    this.latestGridVisible = visible;
    this.latestGridScale = gridScale;
    if (!this.scene) return;
    if (this.gridLines) {
      this.gridLines.dispose();
      this.gridLines = null;
    }
    const terrainGrid = this.scene.getMeshByName('lw-terrain-grid');
    if (this.has3dSceneLoaded()) {
      if (terrainGrid) {
        terrainGrid.isVisible = visible;
        terrainGrid.isPickable = false;
      }
      return;
    }
    if (!visible) return;
    const step = Math.max(0.25, 1.0 * gridScale);
    const offsetXWorld = ((gridOffsetX / 50) % step + step) % step;
    const offsetZWorld = ((gridOffsetY / 50) % step + step) % step;

    const lines: Vector3[][] = [];
    for (let x = -12 + offsetXWorld; x <= 12.001; x += step) {
      lines.push([new Vector3(x, 0.025, -8), new Vector3(x, 0.025, 8)]);
    }
    for (let z = -8 - offsetZWorld; z <= 8.001; z += step) {
      lines.push([new Vector3(-12, 0.025, z), new Vector3(12, 0.025, z)]);
    }
    const grid = MeshBuilder.CreateLineSystem('lw-vtt-grid', { lines }, this.scene);
    grid.color = Color3.FromHexString('#1e3d2f');
    grid.isVisible = true;
    grid.isPickable = false;
    this.gridLines = grid;
  }

  setRotateHeld(_held: boolean): void {}

  pickGroundPoint(clientX: number, clientY: number): { x: number; z: number } | null {
    if (!this.scene || !this.engine) return null;
    const canvas = this.engine.getRenderingCanvas();
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pick = this.scene.pick(
      x,
      y,
      (m) => m === this.ground || m.name === 'lw-terrain-ground',
    );
    if (pick?.hit && pick.pickedPoint) {
      return { x: pick.pickedPoint.x, z: pick.pickedPoint.z };
    }
    return null;
  }

  mountStage(
    canvas: HTMLCanvasElement,
    tokens: readonly VttTokenVm[],
    attackerKey?: string,
    targetKey?: string,
    onTokenClicked?: (tokenKey: string, shiftKey?: boolean) => void,
  ): void {
    this.dispose();

    try {
      this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0.02, 0.05, 0.04, 1);
      this.scene.shadowsEnabled = true;

      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      canvas.addEventListener('contextmenu', preventContextMenu);
      this.cleanupHandlers.push(() => canvas.removeEventListener('contextmenu', preventContextMenu));

      const camera = new ArcRotateCamera(
        'lw-vtt-cam',
        -Math.PI / 2,
        0.0001,
        24,
        new Vector3(0, 0, 0),
        this.scene,
      );
      camera.lowerRadiusLimit = 5;
      camera.upperRadiusLimit = 58;
      camera.panningSensibility = 65;
      camera.panningInertia = 0.15;
      camera.panningAxis = new Vector3(1, 1, 0);
      this.camera = camera;
      camera.attachControl(canvas, true);

      const pointers = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
      if (pointers) pointers.buttons = [0, 1, 2];

      camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
      this.setForcedTopDown(this.isForcedTopDown);
      this.updateZoomPercent();

      const hemi = new HemisphericLight('lw-vtt-hemi', new Vector3(0, 1, 0), this.scene);
      hemi.intensity = 0.68;
      hemi.diffuse = new Color3(0.94, 0.96, 0.94);
      hemi.groundColor = Color3.FromHexString('#091410');

      const pt = new PointLight('lw-vtt-pt', new Vector3(0, 8, 0), this.scene);
      pt.intensity = 0.65;
      pt.diffuse = Color3.FromHexString('#e4c283');

      const ground = MeshBuilder.CreateGround(
        'lw-vtt-ground',
        { width: 24, height: 16, subdivisions: 16 },
        this.scene,
      );
      ground.receiveShadows = true;
      const gMat = new StandardMaterial('lw-vtt-gmat', this.scene);
      gMat.maxSimultaneousLights = 8;
      gMat.diffuseColor = Color3.FromHexString('#0d1914');
      gMat.specularColor = Color3.Black();
      ground.material = gMat;
      this.ground = ground;
      this.groundMat = gMat;

      this.backdropUrl = '';
      this.fogPlane = new BabylonFogPlane(this.scene);

      let savedAlpha = camera.alpha;
      let savedBeta = camera.beta;

      this.dragController = new TokenDragController(this.scene, ground, {
        onDragStart: () => {
          savedAlpha = camera.alpha;
          savedBeta = camera.beta;
          camera.inertialAlphaOffset = 0;
          camera.inertialBetaOffset = 0;
          camera.inertialPanningX = 0;
          camera.inertialPanningY = 0;
          camera.lowerAlphaLimit = savedAlpha;
          camera.upperAlphaLimit = savedAlpha;
          camera.lowerBetaLimit = savedBeta;
          camera.upperBetaLimit = savedBeta;
          camera.detachControl();
        },
        onDragEnd: () => {
          camera.inertialAlphaOffset = 0;
          camera.inertialBetaOffset = 0;
          camera.inertialPanningX = 0;
          camera.inertialPanningY = 0;
          camera.alpha = savedAlpha;
          camera.beta = savedBeta;
          setTimeout(() => {
            if (!this.camera || this.camera !== camera) return;
            camera.inertialAlphaOffset = 0;
            camera.inertialBetaOffset = 0;
            camera.alpha = savedAlpha;
            camera.beta = savedBeta;
            if (this.isForcedTopDown) {
              camera.lowerAlphaLimit = -Math.PI / 2;
              camera.upperAlphaLimit = -Math.PI / 2;
              camera.lowerBetaLimit = 0.0001;
              camera.upperBetaLimit = 0.0001;
            } else {
              camera.lowerAlphaLimit = null;
              camera.upperAlphaLimit = null;
              camera.lowerBetaLimit = 0.1;
              camera.upperBetaLimit = Math.PI / 2.05;
            }
            camera.attachControl(canvas, true);
            const p = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
            if (p) p.buttons = [0, 1, 2];
          }, 0);
        },
        onTokenSelected: (key, shiftKey) => {
          onTokenClicked?.(key, shiftKey);
        },
        onDragged: (placement) => this.draggedSubject.next(placement),
        onDropped: (placement) => this.droppedSubject.next(placement),
      });
      this.dragController.attach();

      let pan2dActive = false;
      let panLastClientX = 0;
      let panLastClientY = 0;
      const panObserver = this.scene.onPointerObservable.add((info) => {
        if (!this.isForcedTopDown || !this.camera || !this.engine) return;
        const evt = info.event as PointerEvent;
        if (info.type === PointerEventTypes.POINTERDOWN) {
          if (evt.button !== 0 || this.dragController?.isDragging()) {
            pan2dActive = false;
            return;
          }
          pan2dActive = true;
          panLastClientX = evt.clientX;
          panLastClientY = evt.clientY;
        } else if (info.type === PointerEventTypes.POINTERMOVE) {
          if (!pan2dActive || this.dragController?.isDragging()) {
            pan2dActive = false;
            return;
          }
          if ((evt.buttons & 1) === 0) {
            pan2dActive = false;
            return;
          }
          const dx = evt.clientX - panLastClientX;
          const dy = evt.clientY - panLastClientY;
          panLastClientX = evt.clientX;
          panLastClientY = evt.clientY;
          const renderH = Math.max(240, this.engine.getRenderHeight());
          const worldPerPx = (2 * this.camera.radius * Math.tan(this.camera.fov / 2)) / renderH;
          this.camera.target.x -= dx * worldPerPx;
          this.camera.target.z += dy * worldPerPx;
          this.camera.inertialPanningX = 0;
          this.camera.inertialPanningY = 0;
        } else if (info.type === PointerEventTypes.POINTERUP) {
          pan2dActive = false;
        }
      });
      this.cleanupHandlers.push(() => {
        if (panObserver) this.scene?.onPointerObservable.remove(panObserver);
      });

      if (this.latestSceneData || this.latestBackdropUrl) {
        this.loadMapScene(this.latestSceneData, this.latestBackdropUrl);
      }

      this.syncTokens(tokens, attackerKey, targetKey, targetKey ? [targetKey] : []);

      this.scene.registerBeforeRender(() => {
        if (!this.scene) return;
        if (this.camera) {
          const maxX = this.has3dSceneLoaded() ? 18 : 12;
          const maxZ = this.has3dSceneLoaded() ? 13.5 : 8;
          this.camera.target.x = Math.max(-maxX, Math.min(maxX, this.camera.target.x));
          this.camera.target.z = Math.max(-maxZ, Math.min(maxZ, this.camera.target.z));
          this.camera.target.y = 0;
          this.updateZoomPercent();
        }
        this.mapSceneBuilder.updateLightFlicker(performance.now(), this.reducedMotion());
        if (this.reducedMotion()) return;
        for (const m of this.scene.meshes) {
          if (m.name.startsWith('lw-target-reticle-root-')) {
            m.rotation.y += 0.022;
          }
        }
      });

      this.engine.runRenderLoop(() => {
        this.scene?.render();
      });
    } catch {
      // Fallback for non-WebGL headless environments
    }
  }

  syncFog(layer: HTMLCanvasElement | null): void {
    this.fogPlane?.setLayer(layer);
  }

  syncTokens(
    tokens: readonly VttTokenVm[],
    attackerKey?: string,
    targetKey?: string,
    targetedKeys: readonly string[] = [],
    opacityByKey: ReadonlyMap<string, number> = new Map(),
    gridScale: number = 1.0,
  ): void {
    this.latestTokens = tokens;
    this.latestAttackerKey = attackerKey;
    this.latestTargetKey = targetKey;
    this.latestTargetedKeys = targetedKeys;
    this.latestOpacityByKey = opacityByKey;
    this.latestGridScale = gridScale;
    this.refreshTokens();
  }

  private refreshTokens(): void {
    if (!this.scene) return;
    this.tokenBuilder.syncTokens(
      this.scene,
      this.latestTokens,
      this.isForcedTopDown,
      this.latestAttackerKey,
      this.latestTargetKey,
      this.latestTargetedKeys,
      this.latestOpacityByKey,
      this.latestGridScale,
      () => this.refreshTokens(),
    );
    SceneLightingController.refreshShadowCasters(this.scene);
  }

  playTrajectoryEffect(
    preset: EffectTimelinePresetVm,
    startPos: { x: number; z: number } = { x: -5, z: 0 },
    endPos: { x: number; z: number } = { x: 5, z: 0 },
  ): void {
    if (!this.scene) return;
    this.fxPlayer.play(
      this.scene,
      preset,
      startPos,
      endPos,
      this.reducedMotion(),
      this.activeKeyframeLabel,
    );
  }

  dispose(): void {
    if (this.resyncTimer !== null) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }
    for (const h of this.cleanupHandlers) h();
    this.cleanupHandlers = [];
    this.fxPlayer.stop();
    this.dragController?.detach();
    this.dragController = null;
    this.fogPlane?.dispose();
    this.fogPlane = null;
    this.tokenBuilder.clearCache();
    if (this.scene) {
      this.mapSceneBuilder.clear(this.scene);
      StampSceneBuilder.evictScene(this.scene);
      WallMeshBuilder.evictScene(this.scene);
    }
    this.last3dSceneState = null;
    this.has3dSceneLoaded.set(false);
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
