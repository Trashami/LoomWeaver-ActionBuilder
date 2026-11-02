import { Injectable, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import {
  AbstractMesh,
  ArcRotateCamera,
  ArcRotateCameraPointersInput,
  AssetContainer,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  MeshoptCompression,
  PointLight,
  Scene,
  SceneLoader,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import {
  EffectTimelinePresetVm,
  VttTokenVm,
} from './effect-timeline.contract';
import { TokenDragController, TokenPlacement } from './token-drag-controller';
import { BabylonFogPlane } from './babylon-fog-plane';

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
  private animHandle: number | null = null;
  private dragController: TokenDragController | null = null;
  private fogPlane: BabylonFogPlane | null = null;
  private readonly draggedSubject = new Subject<TokenPlacement>();
  private readonly droppedSubject = new Subject<TokenPlacement>();
  private cleanupHandlers: (() => void)[] = [];
  private ground: Mesh | null = null;
  private groundMat: StandardMaterial | null = null;
  private gridLines: Mesh | null = null;
  private backdropUrl = '';
  private readonly glbContainerCache = new Map<string, AssetContainer>();
  private readonly loadingGlbUrls = new Set<string>();
  private latestTokens: readonly VttTokenVm[] = [];
  private latestAttackerKey?: string;
  private latestTargetKey?: string;
  private latestTargetedKeys: readonly string[] = [];
  private latestOpacityByKey: ReadonlyMap<string, number> = new Map();
  camera: ArcRotateCamera | null = null;

  readonly zoomPercent = signal<number>(100);

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
    this.camera.radius = 22;
    this.camera.alpha = -Math.PI / 2.2;
    this.camera.beta = 0.82;
    this.camera.target.set(0, 0, 0);
    this.updateZoomPercent();
  }

  private updateZoomPercent(): void {
    if (!this.camera) return;
    const minR = this.camera.lowerRadiusLimit ?? 6;
    const maxR = this.camera.upperRadiusLimit ?? 38;
    const pct = Math.round(100 + ((maxR - this.camera.radius) / (maxR - minR)) * 250);
    this.zoomPercent.set(Math.max(100, Math.min(350, pct)));
  }

  /** Paints the battlemap artwork onto the ground plane, keeping its aspect ratio. */
  setBackdrop(url: string): void {
    if (!this.scene || !this.ground || !this.groundMat || !url || url === this.backdropUrl) return;
    this.backdropUrl = url;
    const tex = new Texture(url, this.scene);
    const ground = this.ground;
    tex.onLoadObservable.addOnce(() => {
      const size = tex.getSize();
      if (size.width > 0 && size.height > 0) {
        ground.scaling.z = size.height / size.width / (20 / 28);
      }
    });
    this.groundMat.diffuseTexture = tex;
    this.groundMat.diffuseColor = Color3.White();
    this.groundMat.emissiveColor = new Color3(0.22, 0.22, 0.22);
  }

  setGridVisible(visible: boolean): void {
    if (this.gridLines) this.gridLines.isVisible = visible;
  }

  /** Direct mouse drag orbits/pans camera; Spacebar held compatibility preserved. */
  setRotateHeld(_held: boolean): void {
    // Both left-drag (orbit) and right/middle-drag (pan) are always active on the 3D stage
  }

  readonly activeKeyframeLabel = signal<string>('Ready');
  readonly reducedMotion = signal<boolean>(false);
  /** Live positions while a token is being dragged on the ground plane. */
  readonly tokenDragged: Observable<TokenPlacement> = this.draggedSubject.asObservable();
  /** Final grid-snapped position when a dragged token is released at a new spot. */
  readonly tokenDropped: Observable<TokenPlacement> = this.droppedSubject.asObservable();

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
      this.scene.clearColor = new Color4(0.03, 0.06, 0.05, 1);

      // Prevent browser context menu on 3D canvas so right-drag pan is smooth
      const preventContextMenu = (e: MouseEvent) => e.preventDefault();
      canvas.addEventListener('contextmenu', preventContextMenu);
      this.cleanupHandlers.push(() => canvas.removeEventListener('contextmenu', preventContextMenu));

      const camera = new ArcRotateCamera(
        'lw-vtt-cam',
        -Math.PI / 2.2,
        0.82,
        22,
        new Vector3(0, 0, 0),
        this.scene,
      );
      camera.lowerRadiusLimit = 6;
      camera.upperRadiusLimit = 38; // Clamped to battlemap extent
      camera.lowerBetaLimit = 0.1; // Prevent flipping upside down
      camera.upperBetaLimit = Math.PI / 2.05; // Prevent clipping beneath ground plane
      camera.panningSensibility = 80; // Smooth right-click & middle-click panning
      camera.panningAxis = new Vector3(1, 0, 1); // Pan strictly on horizontal X-Z ground plane
      this.camera = camera;
      camera.attachControl(canvas, true);

      // Configure pointer buttons: Left = orbit, Middle = pan, Right = pan
      const pointers = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
      if (pointers) pointers.buttons = [0, 1, 2];

      camera.inputs.removeByType('ArcRotateCameraMouseWheelInput');
      this.updateZoomPercent();

      const hemi = new HemisphericLight('lw-vtt-hemi', new Vector3(0, 1, 0), this.scene);
      hemi.intensity = 0.85;
      hemi.diffuse = new Color3(0.95, 0.98, 0.95);
      hemi.groundColor = Color3.FromHexString('#091410');

      const pt = new PointLight('lw-vtt-pt', new Vector3(0, 8, 0), this.scene);
      pt.intensity = 1.35;
      pt.diffuse = Color3.FromHexString('#ffcf75');

      const ground = MeshBuilder.CreateGround(
        'lw-vtt-ground',
        { width: 28, height: 20, subdivisions: 16 },
        this.scene,
      );
      const gMat = new StandardMaterial('lw-vtt-gmat', this.scene);
      gMat.diffuseColor = Color3.FromHexString('#101d18');
      gMat.specularColor = Color3.FromHexString('#1c3028');
      ground.material = gMat;
      this.ground = ground;
      this.groundMat = gMat;

      const lines: Vector3[][] = [];
      for (let x = -14; x <= 14; x += 2) {
        lines.push([new Vector3(x, 0.03, -10), new Vector3(x, 0.03, 10)]);
      }
      for (let z = -10; z <= 10; z += 2) {
        lines.push([new Vector3(-14, 0.03, z), new Vector3(14, 0.03, z)]);
      }
      const grid = MeshBuilder.CreateLineSystem('lw-vtt-grid', { lines }, this.scene);
      grid.color = Color3.FromHexString('#264035');
      grid.isVisible = false;
      this.gridLines = grid;
      this.backdropUrl = '';
      this.fogPlane = new BabylonFogPlane(this.scene);

      this.dragController = new TokenDragController(this.scene, ground, {
        onDragStart: () => camera.detachControl(),
        onDragEnd: () => {
          camera.attachControl(canvas, true);
          const p = camera.inputs.attached['pointers'] as ArcRotateCameraPointersInput | undefined;
          if (p) p.buttons = [0, 1, 2];
        },
        onDragged: (placement) => this.draggedSubject.next(placement),
        onDropped: (placement) => this.droppedSubject.next(placement),
      });
      this.dragController.attach();

      this.syncTokens(tokens, attackerKey, targetKey, targetKey ? [targetKey] : []);

      this.scene.registerBeforeRender(() => {
        if (!this.scene) return;

        // Clamp camera target so the view stays anchored to the map extent
        if (this.camera) {
          this.camera.target.x = Math.max(-14, Math.min(14, this.camera.target.x));
          this.camera.target.z = Math.max(-10, Math.min(10, this.camera.target.z));
          this.camera.target.y = 0;
          this.updateZoomPercent();
        }

        if (this.reducedMotion()) return;
        for (const m of this.scene.meshes) {
          if (m.name.startsWith('lw-target-reticle-root-')) {
            m.rotation.y += 0.026;
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

  /** Sets the fog layer from the player view. A null layer hides the fog. */
  syncFog(layer: HTMLCanvasElement | null): void {
    this.fogPlane?.setLayer(layer);
  }

  syncTokens(
    tokens: readonly VttTokenVm[],
    attackerKey?: string,
    targetKey?: string,
    targetedKeys: readonly string[] = [],
    opacityByKey: ReadonlyMap<string, number> = new Map(),
  ): void {
    this.latestTokens = tokens;
    this.latestAttackerKey = attackerKey;
    this.latestTargetKey = targetKey;
    this.latestTargetedKeys = targetedKeys;
    this.latestOpacityByKey = opacityByKey;

    if (!this.scene) return;
    this.scene.meshes
      .filter(
        (m) =>
          m.name.startsWith('lw-token-') ||
          m.name.startsWith('lw-target-reticle-') ||
          m.name === 'lw-tether-line',
      )
      .forEach((m) => m.dispose());

    const activeTargetSet = new Set<string>(
      targetedKeys.length > 0 ? targetedKeys : targetKey ? [targetKey] : [],
    );

    for (const t of tokens) {
      const isDead = t.currentHp <= 0;
      const isTargeted = activeTargetSet.has(t.key);

      // Base miniature pedestal / puck
      const baseMesh = MeshBuilder.CreateCylinder(
        `lw-token-${t.key}`,
        { height: isDead ? 0.12 : 0.22, diameter: 1.5, tessellation: 36 },
        this.scene,
      );
      baseMesh.position.set(t.x, isDead ? 0.06 : 0.11, t.z);
      baseMesh.metadata = { tokenKey: t.key };
      baseMesh.visibility = opacityByKey.get(t.key) ?? 1;

      const baseMat = new StandardMaterial(`lw-tmat-${t.key}`, this.scene);
      baseMat.diffuseColor = isTargeted
        ? Color3.FromHexString('#ff2438')
        : Color3.FromHexString(t.colorHex);
      baseMat.specularColor = new Color3(0.25, 0.25, 0.25);
      if (isTargeted) {
        baseMat.emissiveColor = Color3.FromHexString('#ff2438').scale(0.65);
      } else if (t.key === attackerKey) {
        baseMat.emissiveColor = Color3.FromHexString('#49e892').scale(0.5);
      }
      baseMesh.material = baseMat;

      // Real 3D GLB Miniature Model vs Basic Token Puck
      if (t.glbUrl) {
        this.attachGlbMiniature(t, baseMesh, isDead);
      } else {
        this.attachBasicPuckFace(t, baseMesh);
      }

      if (isTargeted) {
        this.createSpinningBaseTargetReticle(t.key, t.x, t.z);
      }
    }

    const src = tokens.find((t) => t.key === attackerKey);
    const dst = tokens.find((t) => t.key === targetKey);
    if (src && dst && src.key !== dst.key) {
      const tether = MeshBuilder.CreateLines(
        'lw-tether-line',
        {
          points: [
            new Vector3(src.x, 0.65, src.z),
            new Vector3((src.x + dst.x) / 2, 1.8, (src.z + dst.z) / 2),
            new Vector3(dst.x, 0.65, dst.z),
          ],
        },
        this.scene,
      );
      tether.color = Color3.FromHexString('#49e892');
    }
  }

  /** Attaches a real 3D miniature GLB model onto the token pedestal. */
  private attachGlbMiniature(token: VttTokenVm, baseMesh: Mesh, isDead: boolean): void {
    if (!this.scene || !token.glbUrl) return;
    const glbUrl = token.glbUrl;

    if (this.glbContainerCache.has(glbUrl)) {
      this.instantiateGlbToToken(this.glbContainerCache.get(glbUrl)!, token, baseMesh, isDead);
      return;
    }

    // Fall back immediately to basic puck face while GLB loads asynchronously
    this.attachBasicPuckFace(token, baseMesh);

    if (this.loadingGlbUrls.has(glbUrl)) return;
    this.loadingGlbUrls.add(glbUrl);

    const lastSlash = glbUrl.lastIndexOf('/');
    const rootUrl = lastSlash >= 0 ? glbUrl.slice(0, lastSlash + 1) : '';
    const fileName = lastSlash >= 0 ? glbUrl.slice(lastSlash + 1) : glbUrl;

    SceneLoader.LoadAssetContainerAsync(rootUrl, fileName, this.scene)
      .then((container) => {
        this.glbContainerCache.set(glbUrl, container);
        this.loadingGlbUrls.delete(glbUrl);
        // Refresh token meshes now that model is cached
        this.syncTokens(
          this.latestTokens,
          this.latestAttackerKey,
          this.latestTargetKey,
          this.latestTargetedKeys,
          this.latestOpacityByKey,
        );
      })
      .catch(() => {
        this.loadingGlbUrls.delete(glbUrl);
        // Failed to load GLB (e.g. offline/missing model): basic puck remains
      });
  }

  private instantiateGlbToToken(
    container: AssetContainer,
    token: VttTokenVm,
    baseMesh: Mesh,
    isDead: boolean,
  ): void {
    if (!this.scene) return;
    try {
      const instance = container.instantiateModelsToScene(
        (name) => `lw-token-mini-${token.key}-${name}`,
        false,
      );
      const rootNode = new TransformNode(`lw-token-root-${token.key}`, this.scene);
      rootNode.parent = baseMesh;
      rootNode.position.set(0, 0.11, 0);

      instance.rootNodes.forEach((node) => {
        node.parent = rootNode;
      });

      rootNode.computeWorldMatrix(true);
      instance.rootNodes.forEach((node) => {
        if (node instanceof AbstractMesh) node.computeWorldMatrix(true);
      });

      // Normalize size to miniature scale (~1.8 units tall, 5-ft scale)
      let min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
      let max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
      let foundBounds = false;

      for (const m of instance.rootNodes) {
        if (m instanceof AbstractMesh) {
          const b = m.getHierarchyBoundingVectors(true);
          min = Vector3.Minimize(min, b.min);
          max = Vector3.Maximize(max, b.max);
          foundBounds = true;
        }
      }

      if (foundBounds) {
        const sizeY = Math.max(0.01, max.y - min.y);
        const targetHeight = 1.75;
        const scale = targetHeight / sizeY;
        rootNode.scaling.set(scale, scale, scale);
        rootNode.position.y = 0.11;
      }

      // Propagate tokenKey metadata to all meshes for interaction & dragging
      const tagMesh = (m: AbstractMesh) => {
        m.metadata = { tokenKey: token.key };
        m.name = `lw-token-part-${token.key}-${m.name}`;
        m.getChildMeshes().forEach(tagMesh);
      };
      instance.rootNodes.forEach((node) => {
        if (node instanceof AbstractMesh) tagMesh(node);
      });

      if (isDead) {
        rootNode.rotation.z = Math.PI / 2.2;
        rootNode.position.y = 0.15;
      }
    } catch {
      // Fall back safely if instantiation fails
      this.attachBasicPuckFace(token, baseMesh);
    }
  }

  /** Attaches a 2.5D miniature puck face (character portrait or faction ring) to the basic token. */
  private attachBasicPuckFace(token: VttTokenVm, baseMesh: Mesh): void {
    if (!this.scene) return;

    if (token.avatarUrl) {
      const disc = MeshBuilder.CreateDisc(
        `lw-token-puck-disc-${token.key}`,
        { radius: 0.68, tessellation: 36 },
        this.scene,
      );
      disc.parent = baseMesh;
      disc.position.y = 0.115;
      disc.rotation.x = Math.PI / 2;
      disc.metadata = { tokenKey: token.key };

      const discMat = new StandardMaterial(`lw-mat-puck-${token.key}`, this.scene);
      discMat.diffuseTexture = new Texture(token.avatarUrl, this.scene);
      discMat.specularColor = new Color3(0.15, 0.15, 0.15);
      disc.material = discMat;
    }

    const rim = MeshBuilder.CreateTorus(
      `lw-token-puck-rim-${token.key}`,
      { diameter: 1.48, thickness: 0.05, tessellation: 36 },
      this.scene,
    );
    rim.parent = baseMesh;
    rim.position.y = 0.11;
    rim.metadata = { tokenKey: token.key };

    const rimMat = new StandardMaterial(`lw-mat-rim-${token.key}`, this.scene);
    rimMat.diffuseColor = Color3.FromHexString(token.colorHex);
    rimMat.emissiveColor = Color3.FromHexString(token.colorHex).scale(0.35);
    rim.material = rimMat;
  }

  private createSpinningBaseTargetReticle(tokenKey: string, x: number, z: number): void {
    if (!this.scene) return;
    const root = new Mesh(`lw-target-reticle-root-${tokenKey}`, this.scene);
    root.position.set(x, 0.06, z);

    const reticleMat = new StandardMaterial(`lw-target-reticle-mat-${tokenKey}`, this.scene);
    reticleMat.diffuseColor = Color3.FromHexString('#ff2438');
    reticleMat.emissiveColor = Color3.FromHexString('#ff2438');
    reticleMat.specularColor = Color3.FromHexString('#ff7a85');
    reticleMat.alpha = 0.92;

    const outerRing = MeshBuilder.CreateTorus(
      `lw-target-reticle-outer-${tokenKey}`,
      { diameter: 2.35, thickness: 0.11, tessellation: 36 },
      this.scene,
    );
    outerRing.parent = root;
    outerRing.material = reticleMat;

    const innerRing = MeshBuilder.CreateTorus(
      `lw-target-reticle-inner-${tokenKey}`,
      { diameter: 0.95, thickness: 0.1, tessellation: 28 },
      this.scene,
    );
    innerRing.parent = root;
    innerRing.material = reticleMat;

    const crossH = MeshBuilder.CreateBox(
      `lw-target-reticle-ch-${tokenKey}`,
      { width: 3.1, height: 0.04, depth: 0.1 },
      this.scene,
    );
    crossH.parent = root;
    crossH.material = reticleMat;

    const crossV = MeshBuilder.CreateBox(
      `lw-target-reticle-cv-${tokenKey}`,
      { width: 0.1, height: 0.04, depth: 3.1 },
      this.scene,
    );
    crossV.parent = root;
    crossV.material = reticleMat;
  }

  playTrajectoryEffect(
    preset: EffectTimelinePresetVm,
    startPos: { x: number; z: number } = { x: -5, z: 0 },
    endPos: { x: number; z: number } = { x: 5, z: 0 },
  ): void {
    if (!this.scene) return;
    if (this.animHandle !== null) {
      cancelAnimationFrame(this.animHandle);
      this.animHandle = null;
    }

    this.scene.meshes
      .filter((m) => m.name.startsWith('lw-fx-'))
      .forEach((m) => m.dispose());

    const primary = Color3.FromHexString(preset.primaryColorHex);
    const secondary = Color3.FromHexString(preset.secondaryColorHex);
    const mat = new StandardMaterial('lw-fx-mat', this.scene);
    mat.diffuseColor = primary;
    mat.emissiveColor = primary.scale(0.85);
    mat.specularColor = secondary;
    mat.alpha = 0.88;

    const fxMeshes: Mesh[] = [];

    if (preset.trajectoryType === 'arc') {
      const orb = MeshBuilder.CreateSphere('lw-fx-orb', { diameter: 0.9, segments: 12 }, this.scene);
      orb.material = mat;
      fxMeshes.push(orb);
    } else if (preset.trajectoryType === 'cone') {
      const cone = MeshBuilder.CreateCylinder(
        'lw-fx-cone',
        { height: 6, diameterTop: 3.8, diameterBottom: 0.35, tessellation: 18 },
        this.scene,
      );
      cone.rotation.z = -Math.PI / 2;
      cone.position.set((startPos.x + endPos.x) / 2, 1.1, (startPos.z + endPos.z) / 2);
      cone.material = mat;
      fxMeshes.push(cone);
    } else if (preset.trajectoryType === 'beam') {
      const beam = MeshBuilder.CreateCylinder(
        'lw-fx-beam',
        { height: 10, diameter: 1.6, tessellation: 20 },
        this.scene,
      );
      beam.position.set(endPos.x, 5, endPos.z);
      beam.material = mat;
      fxMeshes.push(beam);
    } else {
      const sigil = MeshBuilder.CreateTorus(
        'lw-fx-sigil',
        { diameter: 5.5, thickness: 0.28, tessellation: 6 },
        this.scene,
      );
      sigil.position.set(endPos.x, 0.25, endPos.z);
      sigil.material = mat;
      fxMeshes.push(sigil);
    }

    const ring = MeshBuilder.CreateTorus(
      'lw-fx-ring',
      { diameter: 2.8, thickness: 0.16, tessellation: 24 },
      this.scene,
    );
    ring.position.set(endPos.x, 0.2, endPos.z);
    ring.material = mat;
    fxMeshes.push(ring);

    if (this.reducedMotion()) {
      this.activeKeyframeLabel.set(`${preset.name} (Static Reduced-Motion Preview)`);
      return;
    }

    const startTime = performance.now();
    const duration = Math.max(600, preset.durationMs);

    const step = (now: number): void => {
      const t = Math.min(1, (now - startTime) / duration);
      const kfIdx = Math.min(
        preset.keyframes.length - 1,
        Math.floor(t * preset.keyframes.length),
      );
      this.activeKeyframeLabel.set(preset.keyframes[kfIdx] ?? 'Playing');

      const orb = fxMeshes[0];
      if (orb && preset.trajectoryType === 'arc') {
        const x = startPos.x + (endPos.x - startPos.x) * t;
        const z = startPos.z + (endPos.z - startPos.z) * t;
        const y = 0.8 + Math.sin(t * Math.PI) * 3.8;
        orb.position.set(x, y, z);
      } else if (orb) {
        orb.rotation.y += 0.08;
        const s = 0.75 + Math.sin(t * Math.PI) * 0.45;
        orb.scaling.set(s, 1, s);
      }

      ring.scaling.set(0.5 + t * 1.4, 1, 0.5 + t * 1.4);

      if (t < 1) {
        this.animHandle = requestAnimationFrame(step);
      } else {
        this.activeKeyframeLabel.set('Complete');
      }
    };

    this.animHandle = requestAnimationFrame(step);
  }

  dispose(): void {
    for (const h of this.cleanupHandlers) h();
    this.cleanupHandlers = [];
    if (this.animHandle !== null) {
      cancelAnimationFrame(this.animHandle);
      this.animHandle = null;
    }
    this.dragController?.detach();
    this.dragController = null;
    this.fogPlane?.dispose();
    this.fogPlane = null;
    this.glbContainerCache.forEach((c) => c.dispose());
    this.glbContainerCache.clear();
    this.loadingGlbUrls.clear();
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
