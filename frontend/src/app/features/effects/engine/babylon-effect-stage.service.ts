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
        Math.min(this.camera.upperRadiusLimit ?? 38, this.camera.radius + delta),
      );
      this.updateZoomPercent();
    }
  }

  resetCamera(): void {
    if (!this.camera) return;
    this.camera.radius = 20;
    this.camera.target.set(0, 0, 0);
    this.setForcedTopDown(this.isForcedTopDown);
    this.updateZoomPercent();
  }

  private updateZoomPercent(): void {
    if (!this.camera) return;
    const minR = this.camera.lowerRadiusLimit ?? 6;
    const maxR = this.camera.upperRadiusLimit ?? 38;
    const pct = Math.round(100 + ((maxR - this.camera.radius) / (maxR - minR)) * 250);
    this.zoomPercent.set(Math.max(100, Math.min(350, pct)));
  }

  setBackdrop(url: string): void {
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

  loadMapScene(sceneData?: VttMapSceneDataPayload | string | null, backdropUrl?: string): void {
    if (backdropUrl) {
      this.setBackdrop(backdropUrl);
    }
    if (!this.scene) return;
    if (sceneData) {
      let parsed: VttMapSceneDataPayload | null = null;
      if (typeof sceneData === 'string') {
        try { parsed = JSON.parse(sceneData); } catch {}
      } else {
        parsed = sceneData;
      }
      if (parsed) {
        this.mapSceneBuilder.buildScene(this.scene, parsed);
      }
    }
  }

  /**
   * Switches between forced top-down 2D camera (default) and free 3D perspective orbit camera.
   */
  setForcedTopDown(forced: boolean): void {
    const modeChanged = this.isForcedTopDown !== forced;
    this.isForcedTopDown = forced;
    if (!this.camera) return;
    if (forced) {
      this.camera.lowerAlphaLimit = -Math.PI / 2;
      this.camera.upperAlphaLimit = -Math.PI / 2;
      this.camera.lowerBetaLimit = 0.0001;
      this.camera.upperBetaLimit = 0.0001;
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.0001;
      this.camera.panningAxis = new Vector3(1, 0, 1);
      (this.camera as unknown as { _panningMouseButton: number })._panningMouseButton = 0;
    } else {
      this.camera.lowerAlphaLimit = null;
      this.camera.upperAlphaLimit = null;
      this.camera.lowerBetaLimit = 0.1;
      this.camera.upperBetaLimit = Math.PI / 2.05;
      this.camera.alpha = -Math.PI / 2.2;
      this.camera.beta = 0.82;
      this.camera.panningAxis = new Vector3(1, 0, 1);
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
    this.latestGridScale = gridScale;
    if (!this.scene) return;
    if (this.gridLines) {
      this.gridLines.dispose();
      this.gridLines = null;
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
    this.gridLines = grid;
  }

  setRotateHeld(_held: boolean): void {}

  pickGroundPoint(clientX: number, clientY: number): { x: number; z: number } | null {
    if (!this.scene || !this.ground || !this.engine) return null;
    const canvas = this.engine.getRenderingCanvas();
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const pick = this.scene.pick(x, y, (m) => m === this.ground);
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
    onTokenClicked?: (tokenKey: string) => void,
  ): void {
    this.dispose();

    try {
      this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0.02, 0.05, 0.04, 1);

      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      canvas.addEventListener('contextmenu', preventContextMenu);
      this.cleanupHandlers.push(() => canvas.removeEventListener('contextmenu', preventContextMenu));

      const camera = new ArcRotateCamera(
        'lw-vtt-cam',
        -Math.PI / 2,
        0.0001,
        20,
        new Vector3(0, 0, 0),
        this.scene,
      );
      camera.lowerRadiusLimit = 6;
      camera.upperRadiusLimit = 38;
      camera.panningSensibility = 80;
      camera.panningAxis = new Vector3(1, 0, 1);
      this.camera = camera;
      camera.attachControl(canvas, true);

      const pointers = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
      if (pointers) pointers.buttons = [0, 1, 2];

      camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
      this.setForcedTopDown(this.isForcedTopDown);
      this.updateZoomPercent();

      const hemi = new HemisphericLight('lw-vtt-hemi', new Vector3(0, 1, 0), this.scene);
      hemi.intensity = 0.92;
      hemi.diffuse = new Color3(0.94, 0.96, 0.94);
      hemi.groundColor = Color3.FromHexString('#091410');

      const pt = new PointLight('lw-vtt-pt', new Vector3(0, 8, 0), this.scene);
      pt.intensity = 1.05;
      pt.diffuse = Color3.FromHexString('#e4c283');

      const ground = MeshBuilder.CreateGround(
        'lw-vtt-ground',
        { width: 24, height: 16, subdivisions: 16 },
        this.scene,
      );
      const gMat = new StandardMaterial('lw-vtt-gmat', this.scene);
      gMat.diffuseColor = Color3.FromHexString('#0d1914');
      gMat.specularColor = Color3.Black();
      ground.material = gMat;
      this.ground = ground;
      this.groundMat = gMat;

      this.backdropUrl = '';
      this.fogPlane = new BabylonFogPlane(this.scene);

      this.dragController = new TokenDragController(this.scene, ground, {
        onDragStart: () => camera.detachControl(),
        onDragEnd: () => {
          camera.attachControl(canvas, true);
          const p = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
          if (p) p.buttons = [0, 1, 2];
          this.setForcedTopDown(this.isForcedTopDown);
        },
        onDragged: (placement) => this.draggedSubject.next(placement),
        onDropped: (placement) => this.droppedSubject.next(placement),
      });
      this.dragController.attach();

      this.syncTokens(tokens, attackerKey, targetKey, targetKey ? [targetKey] : []);

      this.scene.registerBeforeRender(() => {
        if (!this.scene) return;
        if (this.camera) {
          this.camera.target.x = Math.max(-12, Math.min(12, this.camera.target.x));
          this.camera.target.z = Math.max(-8, Math.min(8, this.camera.target.z));
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

      this.scene.onPointerDown = (_evt, pickInfo) => {
        if (pickInfo?.hit && pickInfo.pickedMesh?.metadata?.tokenKey && onTokenClicked) {
          onTokenClicked(pickInfo.pickedMesh.metadata.tokenKey);
        }
      };

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
    for (const h of this.cleanupHandlers) h();
    this.cleanupHandlers = [];
    this.fxPlayer.stop();
    this.dragController?.detach();
    this.dragController = null;
    this.fogPlane?.dispose();
    this.fogPlane = null;
    this.tokenBuilder.clearCache();
    if (this.scene) this.mapSceneBuilder.clear(this.scene);
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
