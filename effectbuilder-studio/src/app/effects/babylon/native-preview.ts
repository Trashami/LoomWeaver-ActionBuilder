import { teleportFrame } from '../teleport-preview';
import {
  Color3,
  Color4,
  DefaultRenderingPipeline,
  Engine,
  FreeCamera,
  HemisphericLight,
  ImageProcessingConfiguration,
  Matrix,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Plane,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core';
import { BabylonEffectRuntime } from './native-runtime';
import { Scene3dAssetController } from './scene-3d-assets';
import { EffectDefinition } from '../effect-definition';
import { EffectWorld, FxPoint } from '../fireball-motion';
import { riderPoint } from '../gameplay-preview';

export interface PreviewRenderSettings {
  background: boolean;
  forestMap?: boolean;
  tokens3d?: boolean;
  ambient: number;
  bump: number;
  height?: number;
  grid: boolean;
  ground: boolean;
}

/** Standalone editor host for the exact world-space VTT runtime + 3D Forest Map & 3D GLB Tokens. */
export class BabylonEffectPreview {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly runtime: BabylonEffectRuntime;
  readonly assets3d: Scene3dAssetController;

  private heightPixels?: Uint8ClampedArray;
  private heightWidth = 0;
  private heightDepth = 0.18;
  private terrainKey = '';
  private azimuth = 0;
  private tilt = 0.62;
  private zoom = 1;
  private floor: Mesh;
  private floorMaterial: PBRMaterial;
  private ambientLight: HemisphericLight;
  private grid?: Mesh;
  private markers: Mesh[] = [];
  private walls: Mesh[] = [];
  private lastLayout = '';
  private shadow?: ShadowGenerator;
  private shadowSource?: PointLight;
  private perspective = true;

  private surfaceHeight(x: number, z: number): number {
    if (!this.heightPixels) return 0;
    const u = (((x / 4) % 1) + 1) % 1;
    const v = (((1 - z / 4) % 1) + 1) % 1;
    const i = (Math.floor(v * this.heightWidth) * this.heightWidth + Math.floor(u * this.heightWidth)) * 4;
    return Math.pow(this.heightPixels[i] / 255, 1.3) * this.heightDepth;
  }

  inspect(turn = 0, tilt = 0, zoom = 1): void {
    this.azimuth += turn;
    this.tilt = Math.max(0.22, Math.min(1.42, this.tilt + tilt));
    this.zoom = Math.max(0.45, Math.min(2.6, this.zoom * zoom));
    this.resize();
  }

  resetView(): void {
    this.azimuth = 0;
    this.tilt = 0.62;
    this.zoom = 1;
    this.resize();
  }

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly width: () => number,
    readonly height: () => number
  ) {
    this.engine = new Engine(
      canvas,
      true,
      { preserveDrawingBuffer: false, stencil: true, powerPreference: 'high-performance' },
      true
    );
    this.engine.setHardwareScalingLevel(1 / Math.min(devicePixelRatio, 1.5));
    this.scene = new Scene(this.engine);
    this.scene.useRightHandedSystem = true;
    this.scene.clearColor = new Color4(0.02, 0.035, 0.048, 1);
    this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
    this.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;

    this.camera = new FreeCamera('effectbuilder-camera', new Vector3(0, 18, 12), this.scene);
    this.camera.fov = 0.68;
    this.camera.minZ = 0.05;
    this.camera.maxZ = 220;

    this.ambientLight = new HemisphericLight('editor-ambient', Vector3.Up(), this.scene);
    this.ambientLight.intensity = 0.36;
    this.ambientLight.groundColor = new Color3(0.12, 0.15, 0.2);

    this.floor = MeshBuilder.CreateGround(
      'editor-normal-mapped-floor',
      { width: 1, height: 1, subdivisions: 180, updatable: true },
      this.scene
    );
    this.floor.receiveShadows = true;
    this.floor.isPickable = false;

    this.floorMaterial = new PBRMaterial('editor-pavers', this.scene);
    const albedo = new Texture('/lighting/dungeon_pavers.png', this.scene);
    const normal = new Texture('/lighting/dungeon_pavers_normal.png', this.scene);
    this.floorMaterial.albedoTexture = albedo;
    this.floorMaterial.bumpTexture = normal;
    this.floorMaterial.roughness = 0.74;
    this.floorMaterial.metallic = 0.04;
    this.floorMaterial.maxSimultaneousLights = 4;
    this.floor.material = this.floorMaterial;

    const image = new Image();
    image.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(image, 0, 0, 256, 256);
        this.heightPixels = ctx.getImageData(0, 0, 256, 256).data;
        this.heightWidth = 256;
        this.terrainKey = '';
      }
    };
    image.src = '/lighting/dungeon_pavers.png';

    this.runtime = new BabylonEffectRuntime(this.scene, {
      elevationAt: (x, z) => this.surfaceHeight(x, z),
    });
    this.assets3d = new Scene3dAssetController(this.scene);

    const pipeline = new DefaultRenderingPipeline('effectbuilder-hdr', true, this.scene, [this.camera]);
    pipeline.bloomEnabled = true;
    pipeline.bloomThreshold = 0.88;
    pipeline.bloomWeight = 0.24;
    pipeline.bloomKernel = 32;
    pipeline.bloomScale = 0.5;
    pipeline.fxaaEnabled = true;
    pipeline.samples = 1;
    this.resize();
  }

  setView(perspective: boolean): void {
    this.perspective = perspective;
    this.resize();
  }

  project(p: FxPoint): FxPoint {
    if (!this.perspective) return p;
    const w = this.width();
    const h = this.height();
    const q = Vector3.Project(
      new Vector3((p.x * w) / 66, this.surfaceHeight((p.x * w) / 66, (p.y * h) / 66) + 0.12, (p.y * h) / 66),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(w, h)
    );
    return { x: q.x / w, y: q.y / h };
  }

  designPoint(x: number, y: number): FxPoint {
    if (!this.perspective) return { x, y };
    const ray = this.scene.createPickingRay(
      (x * this.engine.getRenderWidth()) / this.width(),
      (y * this.engine.getRenderHeight()) / this.height(),
      Matrix.Identity(),
      this.camera
    );
    const distance = ray.intersectsPlane(new Plane(0, 1, 0, 0));
    if (distance === null) return { x, y };
    const p = ray.origin.add(ray.direction.scale(distance));
    return { x: p.x * 66, y: p.z * 66 };
  }

  resize(): void {
    this.engine.resize();
    const w = this.width() / 66;
    const h = this.height() / 66;
    if (this.perspective) {
      this.camera.mode = FreeCamera.PERSPECTIVE_CAMERA;
      this.camera.upVector = Vector3.Up();
      const dist = Math.max(w * 0.88, h * 1.45, 9.5) * this.zoom;
      this.camera.position.set(
        w / 2 + Math.sin(this.azimuth) * dist * Math.cos(this.tilt),
        dist * Math.sin(this.tilt),
        h / 2 + Math.cos(this.azimuth) * dist * Math.cos(this.tilt)
      );
      this.camera.setTarget(new Vector3(w / 2, 0.35, h / 2));
    } else {
      this.camera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
      this.camera.upVector = new Vector3(0, 0, -1);
      this.camera.position.set(w / 2, 24, h / 2 - 0.0001);
      this.camera.setTarget(new Vector3(w / 2, 0, h / 2));
      const pad = this.zoom;
      this.camera.orthoLeft = (-w / 2) * pad;
      this.camera.orthoRight = (w / 2) * pad;
      this.camera.orthoTop = (h / 2) * pad;
      this.camera.orthoBottom = (-h / 2) * pad;
    }
    this.camera.getViewMatrix(true);
    this.camera.getProjectionMatrix(true);
    this.scene.updateTransformMatrix(true);
    this.floor.position.set(w / 2, 0, h / 2);
    this.floor.scaling.set(w, 1, h);
    for (const t of [this.floorMaterial.albedoTexture, this.floorMaterial.bumpTexture]) {
      if (t instanceof Texture) {
        t.uScale = w / 4;
        t.vScale = h / 4;
      }
    }
    this.lastLayout = '';
  }

  render(
    def: EffectDefinition,
    time: number,
    from: FxPoint,
    targets: FxPoint[],
    scale: number,
    world: EffectWorld,
    settings: PreviewRenderSettings
  ): void {
    const w = this.width();
    const h = this.height();
    const showForestMap = settings.forestMap !== false;
    const show3dTokens = settings.tokens3d !== false;
    this.heightDepth = showForestMap ? 0.02 : (settings.height ?? 0.18);

    const terrainKey = JSON.stringify([w, h, this.heightDepth, !!this.heightPixels, showForestMap]);
    if (terrainKey !== this.terrainKey) {
      this.terrainKey = terrainKey;
      const positions = this.floor.getVerticesData('position')!;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = showForestMap
          ? 0
          : this.surfaceHeight(((positions[i] + 0.5) * w) / 66, ((positions[i + 2] + 0.5) * h) / 66);
      }
      const normals: number[] = [];
      VertexData.ComputeNormals(positions, this.floor.getIndices()!, normals);
      this.floor.updateVerticesData('position', positions);
      this.floor.updateVerticesData('normal', normals);
      this.floor.refreshBoundingInfo();
      this.lastLayout = '';
    }

    const key = JSON.stringify([w, h, settings.grid, world.walls, this.terrainKey]);
    this.ambientLight.intensity = settings.ambient;
    this.floorMaterial.bumpTexture!.level = settings.bump;
    this.floor.setEnabled(!showForestMap && (settings.background || settings.ground));
    this.floorMaterial.albedoTexture!.level = settings.background ? 1 : 0;

    if (key !== this.lastLayout) {
      this.lastLayout = key;
      this.grid?.dispose();
      this.walls.forEach((m) => m.dispose(false, true));
      this.walls = [];
      if (settings.grid) {
        const cell = 66 * scale;
        const lines: Vector3[][] = [];
        for (let x = (w / 2) % cell; x < w; x += cell) {
          lines.push(
            Array.from(
              { length: 121 },
              (_, i) => new Vector3(x / 66, this.surfaceHeight(x / 66, ((h / 66) * i) / 120) + 0.025, ((h / 66) * i) / 120)
            )
          );
        }
        for (let y = (h / 2) % cell; y < h; y += cell) {
          lines.push(
            Array.from(
              { length: 121 },
              (_, i) => new Vector3(((w / 66) * i) / 120, this.surfaceHeight(((w / 66) * i) / 120, y / 66) + 0.025, y / 66)
            )
          );
        }
        this.grid = MeshBuilder.CreateLineSystem('editor-grid', { lines }, this.scene);
        (this.grid as any).color = new Color3(0.16, 0.28, 0.26);
        this.grid.isPickable = false;
      } else {
        this.grid = undefined;
      }
      for (const wall of world.walls ?? []) {
        const dx = wall.b.x - wall.a.x;
        const dy = wall.b.y - wall.a.y;
        const m = MeshBuilder.CreateBox(
          'editor-wall',
          { width: Math.hypot(dx, dy) / 66, height: 0.55, depth: 0.1 },
          this.scene
        );
        m.position.set((wall.a.x + wall.b.x) / 132, 0.275, (wall.a.y + wall.b.y) / 132);
        m.rotation.y = -Math.atan2(dy, dx);
        const mat = new StandardMaterial('wall-material', this.scene);
        mat.diffuseColor = new Color3(0.22, 0.32, 0.34);
        m.material = mat;
        m.receiveShadows = true;
        m.isPickable = false;
        this.walls.push(m);
      }
    }

    const teleport = def.previewScene.teleport;
    const landing = teleport ? { x: teleport.destination.x * w, y: teleport.destination.y * h } : from;
    const pose = teleportFrame(teleport, time, from, landing);
    const allTargets = targets.slice(0, 3).map((raw, idx) =>
      idx === 0 ? riderPoint(def.gameplay, time, from, raw, 66 * scale) : raw
    );

    const points = [pose.point, ...allTargets];
    points.forEach((p, i) => {
      let m = this.markers[i];
      if (!m) {
        m = MeshBuilder.CreateCylinder('editor-token-' + i, { diameter: 0.72, height: 0.06, tessellation: 48 }, this.scene);
        const mat = new StandardMaterial('editor-token-material-' + i, this.scene);
        mat.diffuseColor = Color3.FromHexString(i ? '#8a4c58' : '#49e892');
        mat.emissiveColor = Color3.FromHexString(i ? '#3b1c22' : '#184d32');
        mat.specularColor = new Color3(0.25, 0.3, 0.3);
        m.material = mat;
        m.receiveShadows = true;
        m.isPickable = false;
        this.markers.push(m);
      }
      (m.material as StandardMaterial).alpha = (i ? 1 : pose.alpha) * (show3dTokens ? 0.55 : 1);
      m.setEnabled(i > 0 || pose.alpha > 0.001);
      m.position.set(p.x / 66, (showForestMap ? 0 : this.surfaceHeight(p.x / 66, p.y / 66)) + 0.03, p.y / 66);
      m.scaling.setAll(scale);
    });
    for (let i = points.length; i < this.markers.length; i++) {
      this.markers[i].setEnabled(false);
    }

    const proneFirstTarget = !!def.gameplay?.enabled && !!def.gameplay.prone && time >= def.gameplay.impactMs;
    const modelShadows = this.assets3d.sync(
      w / 66,
      h / 66,
      pose.point,
      pose.alpha,
      allTargets,
      scale,
      (x, z) => this.surfaceHeight(x, z),
      {
        showForestMap,
        show3dTokens,
        proneFirstTarget,
        ambient: settings.ambient,
      }
    );

    const effectTarget = teleport?.enabled ? { x: teleport.destination.x * w, y: teleport.destination.y * h } : allTargets[0];
    this.runtime.draw(
      def,
      time,
      from,
      effectTarget,
      scale,
      teleport?.enabled ? [effectTarget, ...allTargets.slice(1)] : allTargets,
      world
    );

    const strongest = this.scene.lights
      .filter((l): l is PointLight => l instanceof PointLight && l.isEnabled() && l.intensity > 0.5)
      .sort((a, b) => b.intensity - a.intensity)[0];
    if (strongest !== this.shadowSource) {
      this.shadow?.dispose();
      this.shadow = undefined;
      this.shadowSource = strongest;
      if (strongest) {
        this.shadow = new ShadowGenerator(256, strongest);
        this.shadow.bias = 0.004;
        this.shadow.normalBias = 0.03;
        const map = this.shadow.getShadowMap();
        if (map) map.refreshRate = 2;
      }
    }
    if (this.shadow) {
      const map = this.shadow.getShadowMap();
      if (map) map.renderList = [...this.markers, ...this.walls, ...(modelShadows as Mesh[])];
    }
    this.scene.render();
  }

  dispose(): void {
    this.shadow?.dispose();
    this.assets3d.dispose();
    this.runtime.dispose();
    this.scene.dispose();
    this.engine.dispose();
  }
}
