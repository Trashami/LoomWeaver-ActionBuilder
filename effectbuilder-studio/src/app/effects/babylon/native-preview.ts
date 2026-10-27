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
import { Scene3dAssetController, VisualQualityTier } from './scene-3d-assets';
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

const RIVERBANK_2D_ALBEDO = '/models-3d/riverbank_topdown_4k.jpg';
const RIVERBANK_2D_NORMAL = '/models-3d/riverbank_normal_2k.jpg';

/** Standalone editor host for the world-space VTT runtime + 3D Riverbank Terrain, 2D Top-Down HD Map & 3D GLB Tokens. */
export class BabylonEffectPreview {
  readonly engine: Engine;
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly runtime: BabylonEffectRuntime;
  readonly assets3d: Scene3dAssetController;

  private pipeline: DefaultRenderingPipeline;
  private quality: VisualQualityTier = 'high';
  private heightPixels?: Uint8ClampedArray;
  private heightWidth = 0;
  private heightDepth = 0.18;
  private terrainKey = '';
  private azimuth = 0;
  private tilt = 0.62;
  private zoom = 1;
  private panX = 0;
  private panZ = 0;
  private floor: Mesh;
  private floorMaterial: PBRMaterial;
  private paverAlbedo: Texture;
  private paverNormal: Texture;
  private river2dAlbedo: Texture;
  private river2dNormal: Texture;
  private ambientLight: HemisphericLight;
  private grid?: Mesh;
  private markers: Mesh[] = [];
  private walls: Mesh[] = [];
  private lastLayout = '';
  private shadow?: ShadowGenerator;
  private shadowSource?: PointLight;
  private perspective = true;
  private using3dTerrain = true;

  private surfaceHeight(x: number, z: number): number {
    if (!this.perspective) return 0;
    if (this.using3dTerrain) {
      return this.assets3d.terrainElevationAt(x, z);
    }
    if (!this.heightPixels) return 0;
    const u = (((x / 4) % 1) + 1) % 1;
    const v = (((1 - z / 4) % 1) + 1) % 1;
    const i = (Math.floor(v * this.heightWidth) * this.heightWidth + Math.floor(u * this.heightWidth)) * 4;
    return Math.pow(this.heightPixels[i] / 255, 1.3) * this.heightDepth;
  }

  inspect(turn = 0, tilt = 0, zoom = 1): void {
    // In 2D Top-Down mode, lock out any 3D orbit/tilt/Z camera movements; only allow zoom & X/Y pan
    if (this.perspective) {
      this.azimuth += turn;
      this.tilt = Math.max(0.22, Math.min(1.42, this.tilt + tilt));
    }
    this.zoom = Math.max(0.32, Math.min(2.6, this.zoom * zoom));
    this.resize();
  }

  panBy(dxUnits: number, dzUnits: number): void {
    this.panX = Math.max(-16, Math.min(16, this.panX + dxUnits));
    this.panZ = Math.max(-16, Math.min(16, this.panZ + dzUnits));
    this.resize();
  }

  panScreenPixels(prevX: number, prevY: number, curX: number, curY: number): void {
    const a = this.worldGroundPoint(prevX, prevY);
    const b = this.worldGroundPoint(curX, curY);
    if (!a || !b) return;
    this.panBy(a.x - b.x, a.z - b.z);
  }

  private worldGroundPoint(x: number, y: number): Vector3 | null {
    const w = Math.max(1, this.width());
    const h = Math.max(1, this.height());
    const ray = this.scene.createPickingRay(
      (x * this.engine.getRenderWidth()) / w,
      (y * this.engine.getRenderHeight()) / h,
      Matrix.Identity(),
      this.camera
    );
    const dist = ray.intersectsPlane(new Plane(0, 1, 0, 0));
    if (dist === null) return null;
    return ray.origin.add(ray.direction.scale(dist));
  }

  resetView(): void {
    this.azimuth = 0;
    this.tilt = 0.62;
    this.zoom = 1;
    this.panX = 0;
    this.panZ = 0;
    this.resize();
  }

  moveTerrainBy(dxUnits: number, dzUnits: number): void {
    // Pan the camera so the map AND all tokens move together in lockstep
    this.panBy(-dxUnits, -dzUnits);
  }

  rotateTerrainBy(dRad: number): void {
    if (!this.perspective) return;
    this.assets3d.mapTransform.rotationY += dRad;
  }

  resetTerrainTransform(): void {
    this.assets3d.mapTransform = { offsetX: 0, offsetZ: 0, rotationY: 0, scale: 1 };
    this.panX = 0;
    this.panZ = 0;
    this.resize();
  }

  setQuality(tier: VisualQualityTier): void {
    this.quality = tier;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1;
    if (tier === 'low') {
      this.engine.setHardwareScalingLevel(1.35);
      this.pipeline.bloomEnabled = false;
      this.pipeline.fxaaEnabled = false;
      this.pipeline.samples = 1;
      this.floorMaterial.maxSimultaneousLights = 4;
    } else if (tier === 'med') {
      this.engine.setHardwareScalingLevel(1.0);
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomScale = 0.45;
      this.pipeline.fxaaEnabled = true;
      this.pipeline.samples = 1;
      this.floorMaterial.maxSimultaneousLights = 6;
    } else {
      this.engine.setHardwareScalingLevel(1 / Math.min(dpr, 2));
      this.pipeline.bloomEnabled = true;
      this.pipeline.bloomScale = 0.75;
      this.pipeline.fxaaEnabled = true;
      this.pipeline.samples = 4;
      this.floorMaterial.maxSimultaneousLights = 8;
    }
    const aniso = tier === 'low' ? 2 : tier === 'med' ? 8 : 16;
    const sampling = tier === 'low' ? Texture.BILINEAR_SAMPLINGMODE : Texture.TRILINEAR_SAMPLINGMODE;
    for (const tex of [this.paverAlbedo, this.paverNormal, this.river2dAlbedo, this.river2dNormal]) {
      tex.updateSamplingMode(sampling);
      tex.anisotropicFilteringLevel = aniso;
    }
    this.assets3d.setQuality(tier);
    this.resize();
  }

  pickDraggableRole(x: number, y: number): string | null {
    const rw = this.engine.getRenderWidth();
    const rh = this.engine.getRenderHeight();
    const sx = (x * rw) / Math.max(1, this.width());
    const sy = (y * rh) / Math.max(1, this.height());
    const hit = this.scene.pick(sx, sy, (m) => !!m.isPickable && !!m.metadata?.ebDragRole);
    return hit?.hit ? (hit.pickedMesh?.metadata?.ebDragRole ?? null) : null;
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
    this.engine.setHardwareScalingLevel(1 / Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2));
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
      { width: 1, height: 1, subdivisions: 120, updatable: true },
      this.scene
    );
    this.floor.receiveShadows = true;
    this.floor.isPickable = false;

    this.floorMaterial = new PBRMaterial('editor-pavers', this.scene);
    this.paverAlbedo = new Texture('/lighting/dungeon_pavers.png', this.scene);
    this.paverNormal = new Texture('/lighting/dungeon_pavers_normal.png', this.scene);
    this.river2dAlbedo = new Texture(RIVERBANK_2D_ALBEDO, this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
    this.river2dNormal = new Texture(RIVERBANK_2D_NORMAL, this.scene, false, true, Texture.TRILINEAR_SAMPLINGMODE);
    this.river2dAlbedo.anisotropicFilteringLevel = 16;
    this.river2dNormal.anisotropicFilteringLevel = 16;

    this.floorMaterial.albedoTexture = this.paverAlbedo;
    this.floorMaterial.bumpTexture = this.paverNormal;
    this.floorMaterial.roughness = 0.78;
    this.floorMaterial.metallic = 0.03;
    this.floorMaterial.directIntensity = 1.5;
    this.floorMaterial.maxSimultaneousLights = 8;
    this.floorMaterial.usePhysicalLightFalloff = false;
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

    this.assets3d = new Scene3dAssetController(this.scene);
    this.runtime = new BabylonEffectRuntime(this.scene, {
      elevationAt: (x, z) => this.surfaceHeight(x, z),
      lightGain: 3.8,
    });

    this.pipeline = new DefaultRenderingPipeline('effectbuilder-hdr', true, this.scene, [this.camera]);
    this.pipeline.bloomEnabled = true;
    this.pipeline.bloomThreshold = 0.88;
    this.pipeline.bloomWeight = 0.24;
    this.pipeline.bloomKernel = 32;
    this.pipeline.bloomScale = 0.75;
    this.pipeline.fxaaEnabled = true;
    this.pipeline.samples = 4;
    this.resize();
  }

  setView(perspective: boolean): void {
    this.perspective = perspective;
    this.terrainKey = '';
    this.resize();
  }

  project(p: FxPoint): FxPoint {
    const w = Math.max(1, this.width());
    const h = Math.max(1, this.height());
    const wx = (p.x * w) / 66;
    const wz = (p.y * h) / 66;
    const baseElev =
      this.perspective && this.using3dTerrain ? this.assets3d.tokenElevationAt(wx, wz) : this.surfaceHeight(wx, wz);
    const wy = this.perspective ? baseElev + 0.14 : 0.04;
    const q = Vector3.Project(
      new Vector3(wx, wy, wz),
      Matrix.Identity(),
      this.scene.getTransformMatrix(),
      this.camera.viewport.toGlobal(w, h)
    );
    return { x: q.x / w, y: q.y / h };
  }

  designPoint(x: number, y: number): FxPoint {
    const w = Math.max(1, this.width());
    const h = Math.max(1, this.height());
    const ray = this.scene.createPickingRay(
      (x * this.engine.getRenderWidth()) / w,
      (y * this.engine.getRenderHeight()) / h,
      Matrix.Identity(),
      this.camera
    );
    const refY =
      this.perspective && this.using3dTerrain ? this.assets3d.terrainElevationAt(w / 132, h / 132) : 0;
    const distance = ray.intersectsPlane(new Plane(0, 1, 0, -refY));
    if (distance === null) return { x, y };
    const p = ray.origin.add(ray.direction.scale(distance));
    return { x: p.x * 66, y: p.z * 66 };
  }

  resize(): void {
    this.engine.resize();
    const w = this.width() / 66;
    const h = this.height() / 66;
    const cx = w / 2 + this.panX;
    const cz = h / 2 + this.panZ;
    if (this.perspective) {
      this.camera.mode = FreeCamera.PERSPECTIVE_CAMERA;
      this.camera.upVector = Vector3.Up();
      const dist = Math.max(w * 0.88, h * 1.45, 9.5) * this.zoom;
      this.camera.position.set(
        cx + Math.sin(this.azimuth) * dist * Math.cos(this.tilt),
        dist * Math.sin(this.tilt),
        cz + Math.cos(this.azimuth) * dist * Math.cos(this.tilt)
      );
      this.camera.setTarget(new Vector3(cx, 0.35, cz));
    } else {
      // Strictly 2D Top-Down Orthographic view: X/Y pan and zoom only, zero Z camera movements
      this.camera.mode = FreeCamera.ORTHOGRAPHIC_CAMERA;
      this.camera.upVector = new Vector3(0, 0, -1);
      this.camera.position.set(cx, 24, cz);
      this.camera.setTarget(new Vector3(cx, 0, cz));
      const pad = this.zoom;
      this.camera.orthoLeft = (-w / 2) * pad;
      this.camera.orthoRight = (w / 2) * pad;
      this.camera.orthoTop = (h / 2) * pad;
      this.camera.orthoBottom = (-h / 2) * pad;
    }
    this.camera.getViewMatrix(true);
    this.camera.getProjectionMatrix(true);
    this.scene.updateTransformMatrix(true);
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
    const wUnits = w / 66;
    const hUnits = h / 66;
    const showForestMap = settings.forestMap !== false;
    const show3dTerrain = showForestMap && this.perspective;
    const show2dRiverbank = showForestMap && !this.perspective;
    const show3dTokens = settings.tokens3d !== false && this.perspective;
    this.using3dTerrain = show3dTerrain;
    this.heightDepth = showForestMap || !this.perspective ? 0 : (settings.height ?? 0.18);

    const terrainKey = JSON.stringify([w, h, this.heightDepth, !!this.heightPixels, showForestMap, this.perspective]);
    if (terrainKey !== this.terrainKey) {
      this.terrainKey = terrainKey;
      const positions = this.floor.getVerticesData('position')!;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] =
          showForestMap || !this.perspective
            ? 0
            : this.surfaceHeight(((positions[i] + 0.5) * w) / 66, ((positions[i + 2] + 0.5) * h) / 66);
      }
      const normals: number[] = [];
      VertexData.ComputeNormals(positions, this.floor.getIndices()!, normals);
      this.floor.updateVerticesData('position', positions);
      this.floor.updateVerticesData('normal', normals);
      this.floor.refreshBoundingInfo();

      if (show2dRiverbank) {
        const spanX = Math.max(wUnits * 1.18, 11.5);
        const spanZ = Math.max(hUnits * 1.25, 6.8);
        this.floor.position.set(wUnits / 2, 0, hUnits / 2);
        this.floor.scaling.set(spanX, 1, spanZ);
        this.floorMaterial.albedoTexture = this.river2dAlbedo;
        this.floorMaterial.bumpTexture = this.river2dNormal;
        this.river2dAlbedo.uScale = 1;
        this.river2dAlbedo.vScale = 1;
        this.river2dNormal.uScale = 1;
        this.river2dNormal.vScale = 1;
      } else {
        this.floor.position.set(wUnits / 2, 0, hUnits / 2);
        this.floor.scaling.set(wUnits, 1, hUnits);
        this.floorMaterial.albedoTexture = this.paverAlbedo;
        this.floorMaterial.bumpTexture = this.paverNormal;
        this.paverAlbedo.uScale = wUnits / 4;
        this.paverAlbedo.vScale = hUnits / 4;
        this.paverNormal.uScale = wUnits / 4;
        this.paverNormal.vScale = hUnits / 4;
      }
      this.lastLayout = '';
    }

    const teleport = def.previewScene.teleport;
    const landing = teleport ? { x: teleport.destination.x * w, y: teleport.destination.y * h } : from;
    const pose = teleportFrame(teleport, time, from, landing);
    const allTargets = targets.slice(0, 3).map((raw, idx) =>
      idx === 0 ? riderPoint(def.gameplay, time, from, raw, 66 * scale) : raw
    );

    const proneFirstTarget = !!def.gameplay?.enabled && !!def.gameplay.prone && time >= def.gameplay.impactMs;
    this.assets3d.sync(
      wUnits,
      hUnits,
      pose.point,
      pose.alpha,
      allTargets,
      scale,
      (x, z) => this.surfaceHeight(x, z),
      {
        showForestMap: show3dTerrain,
        show3dTokens,
        proneFirstTarget,
        ambient: settings.ambient,
      }
    );

    const key = JSON.stringify([w, h, settings.grid, world.walls, this.terrainKey]);
    this.ambientLight.intensity = this.perspective ? settings.ambient : Math.max(0.58, settings.ambient * 1.45);
    this.floorMaterial.bumpTexture!.level = show2dRiverbank ? Math.min(1.35, settings.bump * 0.65) : settings.bump;
    this.floor.setEnabled(!show3dTerrain && (show2dRiverbank || settings.background || settings.ground));
    this.floorMaterial.albedoTexture!.level = show2dRiverbank || settings.background ? 1 : 0;

    if (key !== this.lastLayout) {
      this.lastLayout = key;
      this.grid?.dispose();
      this.walls.forEach((m) => m.dispose(false, true));
      this.walls = [];
      if (settings.grid) {
        const cell = 66 * scale;
        const lines: Vector3[][] = [];
        for (let x = (w / 2) % cell; x < w; x += cell) {
          lines.push(Array.from({ length: 61 }, (_, i) => new Vector3(x / 66, 0.025, (hUnits * i) / 60)));
        }
        for (let y = (h / 2) % cell; y < h; y += cell) {
          lines.push(Array.from({ length: 61 }, (_, i) => new Vector3((wUnits * i) / 60, 0.025, y / 66)));
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
        m.isPickable = true;
        m.metadata = { ebDragRole: i === 0 ? 'caster' : `target-${i - 1}` };
        this.markers.push(m);
      }
      (m.material as StandardMaterial).alpha = (i ? 1 : pose.alpha) * (show3dTokens ? 0.55 : 0.92);
      m.setEnabled(i > 0 || pose.alpha > 0.001);
      const wx = p.x / 66;
      const wz = p.y / 66;
      const markerY = show3dTerrain
        ? this.assets3d.tokenElevationAt(wx, wz) + 0.02
        : this.surfaceHeight(wx, wz) + 0.03;
      m.position.set(wx, markerY, wz);
      m.scaling.setAll(scale);
    });
    for (let i = points.length; i < this.markers.length; i++) {
      this.markers[i].setEnabled(false);
    }

    const effectTarget = teleport?.enabled ? { x: teleport.destination.x * w, y: teleport.destination.y * h } : allTargets[0];
    const sourceY = show3dTerrain
      ? this.assets3d.tokenElevationAt(from.x / 66, from.y / 66)
      : this.surfaceHeight(from.x / 66, from.y / 66);
    const targetY = show3dTerrain
      ? this.assets3d.tokenElevationAt(effectTarget.x / 66, effectTarget.y / 66)
      : this.surfaceHeight(effectTarget.x / 66, effectTarget.y / 66);
    try {
      this.runtime.draw(
        def,
        time,
        from,
        effectTarget,
        scale,
        teleport?.enabled ? [effectTarget, ...allTargets.slice(1)] : allTargets,
        world,
        sourceY,
        targetY
      );
    } catch (err) {
      console.warn('Effect runtime frame error:', err);
    }

    if (this.walls.length > 0) {
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
        if (map) map.renderList = [...this.walls];
      }
    } else if (this.shadow) {
      this.shadow.dispose();
      this.shadow = undefined;
      this.shadowSource = undefined;
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
