import '@babylonjs/loaders/glTF';
import {
  AbstractMesh,
  Color3,
  DirectionalLight,
  HemisphericLight,
  Mesh,
  PBRMaterial,
  Scene,
  SceneLoader,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { FxPoint } from '../fireball-motion';

export const RIVERBANK_MAP_GLB = '/models-3d/Meshy_AI_Riverbank_Terrain_Mod_1023195705_texture.glb';
export const SORCERESS_GLB = '/models-3d/Meshy_AI_Eclipse_Abyss_Sorcere_1026221004_texture.glb';
export const GOBLIN_MALE_GLB = '/models-3d/Meshy_AI_Goblin_Male_1026221232_texture.glb';

export interface MapTransformState {
  offsetX: number;
  offsetZ: number;
  rotationY: number;
  scale: number;
}

interface NormalizedModel {
  wrapper: TransformNode;
  pivot: TransformNode;
  meshes: AbstractMesh[];
  unitScale: number;
  spanX: number;
  spanZ: number;
}

const HEIGHT_GRID_RES = 128;

export class Scene3dAssetController {
  private envModel?: NormalizedModel;
  private casterModel?: NormalizedModel;
  private goblinModels: NormalizedModel[] = [];
  private fillLight: HemisphericLight;
  private sunLight: DirectionalLight;
  private disposed = false;
  private loading = false;
  private loaded = false;

  private lastEnvKey = '';
  private heightGrid = new Float32Array(HEIGHT_GRID_RES * HEIGHT_GRID_RES);
  private gridMinX = -10;
  private gridMaxX = 20;
  private gridMinZ = -10;
  private gridMaxZ = 20;
  private hasHeightGrid = false;

  mapTransform: MapTransformState = {
    offsetX: 0,
    offsetZ: 0,
    rotationY: 0,
    scale: 1,
  };

  constructor(private readonly scene: Scene) {
    this.fillLight = new HemisphericLight('eb-3d-model-fill', new Vector3(0.2, 1, -0.3), this.scene);
    this.fillLight.intensity = 0.95;
    this.fillLight.groundColor = new Color3(0.22, 0.26, 0.32);
    this.fillLight.specular = new Color3(0.18, 0.2, 0.22);

    this.sunLight = new DirectionalLight('eb-3d-model-sun', new Vector3(-0.45, -0.85, 0.35).normalize(), this.scene);
    this.sunLight.intensity = 1.15;
    this.sunLight.diffuse = new Color3(1.0, 0.96, 0.88);
    this.sunLight.specular = new Color3(0.25, 0.25, 0.25);
  }

  ensureLoaded(onReady?: () => void): void {
    if (this.loaded || this.loading || this.disposed) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    this.loading = true;
    void this.loadAll(onReady);
  }

  private async loadAll(onReady?: () => void): Promise<void> {
    try {
      const [env, caster, goblin0] = await Promise.all([
        this.loadNormalizedModel('riverbank-terrain-map', RIVERBANK_MAP_GLB, 1.35, 'terrain', true),
        this.loadNormalizedModel('caster-sorceress', SORCERESS_GLB, 1.55, 'caster', false),
        this.loadNormalizedModel('target-goblin-0', GOBLIN_MALE_GLB, 1.25, 'target-0', false),
      ]);
      if (this.disposed) return;
      this.envModel = env;
      this.casterModel = caster;
      if (goblin0) {
        const goblin1 = this.cloneNormalizedModel(goblin0, 'target-goblin-1', 'target-1');
        const goblin2 = this.cloneNormalizedModel(goblin0, 'target-goblin-2', 'target-2');
        this.goblinModels = [goblin0, goblin1, goblin2];
      }
      this.lastEnvKey = '';
      this.loaded = true;
      onReady?.();
    } catch (err) {
      console.warn('3D scene asset load warning:', err);
    } finally {
      this.loading = false;
    }
  }

  private tuneMaterialQuality(meshes: AbstractMesh[], isTerrain: boolean): void {
    for (const m of meshes) {
      const mat = m.material;
      if (!mat) continue;
      if (mat instanceof PBRMaterial) {
        if (isTerrain) {
          mat.roughness = 0.9;
          mat.metallic = 0.0;
          mat.directIntensity = 1.15;
          mat.environmentIntensity = 0.85;
        } else {
          mat.roughness = Math.max(0.55, mat.roughness ?? 0.7);
          mat.metallic = Math.min(0.25, mat.metallic ?? 0.1);
        }
      }
      for (const tex of mat.getActiveTextures()) {
        if (tex instanceof Texture) {
          tex.updateSamplingMode(Texture.TRILINEAR_SAMPLINGMODE);
          tex.anisotropicFilteringLevel = 16;
        }
      }
    }
  }

  private pruneDetachedSideMeshes(meshes: AbstractMesh[]): AbstractMesh[] {
    const geomMeshes = meshes.filter((m) => m.getTotalVertices() > 0);
    if (geomMeshes.length <= 1) return meshes;

    let largest: AbstractMesh = geomMeshes[0];
    let maxVolume = -1;
    for (const m of geomMeshes) {
      m.computeWorldMatrix(true);
      const b = m.getBoundingInfo().boundingBox;
      const size = b.maximumWorld.subtract(b.minimumWorld);
      const vol = Math.max(0.001, size.x) * Math.max(0.001, size.z);
      if (vol > maxVolume) {
        maxVolume = vol;
        largest = m;
      }
    }

    const mainBox = largest.getBoundingInfo().boundingBox;
    const padX = (mainBox.maximumWorld.x - mainBox.minimumWorld.x) * 0.15;
    const padZ = (mainBox.maximumWorld.z - mainBox.minimumWorld.z) * 0.15;

    const kept: AbstractMesh[] = [];
    for (const m of meshes) {
      if (m.getTotalVertices() === 0) {
        kept.push(m);
        continue;
      }
      const c = m.getBoundingInfo().boundingBox.centerWorld;
      const insideMain =
        c.x >= mainBox.minimumWorld.x - padX &&
        c.x <= mainBox.maximumWorld.x + padX &&
        c.z >= mainBox.minimumWorld.z - padZ &&
        c.z <= mainBox.maximumWorld.z + padZ;
      if (insideMain) {
        kept.push(m);
      } else {
        m.setEnabled(false);
        m.dispose(false, false);
      }
    }
    return kept;
  }

  private async loadNormalizedModel(
    name: string,
    url: string,
    targetHeight: number,
    dragRole: string,
    pruneSideProps: boolean
  ): Promise<NormalizedModel | undefined> {
    const lastSlash = url.lastIndexOf('/');
    const rootUrl = url.slice(0, lastSlash + 1);
    const fileName = url.slice(lastSlash + 1);
    const result = await SceneLoader.ImportMeshAsync('', rootUrl, fileName, this.scene);
    if (this.disposed) {
      result.meshes.forEach((m) => m.dispose());
      return undefined;
    }
    const wrapper = new TransformNode(`eb-3d-wrap-${name}`, this.scene);
    const pivot = new TransformNode(`eb-3d-pivot-${name}`, this.scene);
    pivot.parent = wrapper;

    const rootMesh = result.meshes[0];
    if (rootMesh) {
      rootMesh.parent = pivot;
    }

    const activeMeshes = pruneSideProps ? this.pruneDetachedSideMeshes(result.meshes) : result.meshes;
    this.tuneMaterialQuality(activeMeshes, pruneSideProps);
    for (const m of activeMeshes) {
      m.isPickable = m.getTotalVertices() > 0;
      m.receiveShadows = pruneSideProps;
      m.metadata = { ...(m.metadata || {}), ebDragRole: dragRole };
    }

    pivot.computeWorldMatrix(true);
    activeMeshes.forEach((m) => m.computeWorldMatrix(true));
    const bounds = pivot.getHierarchyBoundingVectors(true);
    const size = bounds.max.subtract(bounds.min);
    const height = Math.max(0.001, size.y);
    const spanX = Math.max(0.001, size.x);
    const spanZ = Math.max(0.001, size.z);
    const center = bounds.min.add(bounds.max).scale(0.5);

    const unitScale = targetHeight / height;
    pivot.scaling.setAll(unitScale);
    pivot.position.set(-center.x * unitScale, -bounds.min.y * unitScale, -center.z * unitScale);

    return {
      wrapper,
      pivot,
      meshes: activeMeshes,
      unitScale,
      spanX: spanX * unitScale,
      spanZ: spanZ * unitScale,
    };
  }

  private cloneNormalizedModel(source: NormalizedModel, name: string, dragRole: string): NormalizedModel {
    const wrapper = new TransformNode(`eb-3d-wrap-${name}`, this.scene);
    const pivot = source.pivot.clone(`eb-3d-pivot-${name}`, wrapper)!;
    const meshes = pivot.getChildMeshes(false);
    for (const m of meshes) {
      m.isPickable = m.getTotalVertices() > 0;
      m.receiveShadows = false;
      m.metadata = { ...(m.metadata || {}), ebDragRole: dragRole };
    }
    return {
      wrapper,
      pivot,
      meshes,
      unitScale: source.unitScale,
      spanX: source.spanX,
      spanZ: source.spanZ,
    };
  }

  /**
   * Bakes a fast 128x128 world-space heightfield from the terrain vertices whenever the terrain
   * loads or moves. Eliminates per-frame CPU raycasting against 100k+ triangles!
   */
  private bakeHeightGrid(): void {
    if (!this.envModel) return;
    this.heightGrid.fill(-999);
    const bounds = this.envModel.wrapper.getHierarchyBoundingVectors(true);
    this.gridMinX = bounds.min.x - 0.5;
    this.gridMaxX = bounds.max.x + 0.5;
    this.gridMinZ = bounds.min.z - 0.5;
    this.gridMaxZ = bounds.max.z + 0.5;
    const spanX = Math.max(0.01, this.gridMaxX - this.gridMinX);
    const spanZ = Math.max(0.01, this.gridMaxZ - this.gridMinZ);
    const tmp = new Vector3();

    for (const m of this.envModel.meshes) {
      const pos = m.getVerticesData('position');
      if (!pos || pos.length < 3) continue;
      const wm = m.getWorldMatrix();
      // Sample every vertex (or stride 2 for very dense meshes) into the 128x128 height grid
      const step = pos.length > 180000 ? 6 : 3;
      for (let i = 0; i < pos.length; i += step) {
        Vector3.TransformCoordinatesFromFloatsToRef(pos[i], pos[i + 1], pos[i + 2], wm, tmp);
        const gx = Math.floor(((tmp.x - this.gridMinX) / spanX) * (HEIGHT_GRID_RES - 1));
        const gz = Math.floor(((tmp.z - this.gridMinZ) / spanZ) * (HEIGHT_GRID_RES - 1));
        if (gx >= 0 && gx < HEIGHT_GRID_RES && gz >= 0 && gz < HEIGHT_GRID_RES) {
          const idx = gz * HEIGHT_GRID_RES + gx;
          if (tmp.y > this.heightGrid[idx]) {
            this.heightGrid[idx] = tmp.y;
          }
        }
      }
    }

    // Fill any empty cells from 3x3 neighbors so lookup is smooth everywhere
    const copy = new Float32Array(this.heightGrid);
    for (let pass = 0; pass < 2; pass++) {
      const src = pass === 0 ? copy : this.heightGrid;
      const dst = pass === 0 ? this.heightGrid : copy;
      for (let z = 0; z < HEIGHT_GRID_RES; z++) {
        for (let x = 0; x < HEIGHT_GRID_RES; x++) {
          const idx = z * HEIGHT_GRID_RES + x;
          if (src[idx] > -900) {
            dst[idx] = src[idx];
            continue;
          }
          let sum = 0;
          let count = 0;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const nz = z + dz;
              if (nx >= 0 && nx < HEIGHT_GRID_RES && nz >= 0 && nz < HEIGHT_GRID_RES) {
                const v = src[nz * HEIGHT_GRID_RES + nx];
                if (v > -900) {
                  sum += v;
                  count++;
                }
              }
            }
          }
          dst[idx] = count > 0 ? sum / count : 0;
        }
      }
    }
    for (let i = 0; i < copy.length; i++) {
      this.heightGrid[i] = copy[i] > -900 ? Math.min(0.65, Math.max(0, copy[i])) : 0;
    }
    this.hasHeightGrid = true;
  }

  /** O(1) bilinear heightfield lookup (< 0.0001 ms per call, zero triangle raycasts). */
  terrainElevationAt(x: number, z: number): number {
    if (!this.hasHeightGrid || !this.envModel || !this.envModel.wrapper.isEnabled()) return 0;
    const fx = ((x - this.gridMinX) / Math.max(0.01, this.gridMaxX - this.gridMinX)) * (HEIGHT_GRID_RES - 1);
    const fz = ((z - this.gridMinZ) / Math.max(0.01, this.gridMaxZ - this.gridMinZ)) * (HEIGHT_GRID_RES - 1);
    if (fx < 0 || fx >= HEIGHT_GRID_RES - 1 || fz < 0 || fz >= HEIGHT_GRID_RES - 1) return 0;
    const x0 = Math.floor(fx);
    const z0 = Math.floor(fz);
    const tx = fx - x0;
    const tz = fz - z0;
    const h00 = this.heightGrid[z0 * HEIGHT_GRID_RES + x0];
    const h10 = this.heightGrid[z0 * HEIGHT_GRID_RES + x0 + 1];
    const h01 = this.heightGrid[(z0 + 1) * HEIGHT_GRID_RES + x0];
    const h11 = this.heightGrid[(z0 + 1) * HEIGHT_GRID_RES + x0 + 1];
    return h00 * (1 - tx) * (1 - tz) + h10 * tx * (1 - tz) + h01 * (1 - tx) * tz + h11 * tx * tz;
  }

  sync(
    wUnits: number,
    hUnits: number,
    casterPos: FxPoint,
    casterAlpha: number,
    targetPositions: FxPoint[],
    scale: number,
    surfaceHeight: (x: number, z: number) => number,
    options: { showForestMap: boolean; show3dTokens: boolean; proneFirstTarget: boolean; ambient: number }
  ): AbstractMesh[] {
    this.ensureLoaded();
    this.fillLight.intensity = Math.max(0.65, options.ambient * 2.1);
    this.sunLight.intensity = Math.max(0.85, options.ambient * 2.4);

    if (this.envModel) {
      this.envModel.wrapper.setEnabled(options.showForestMap);
      if (options.showForestMap) {
        const envKey = `${wUnits.toFixed(2)}:${hUnits.toFixed(2)}:${this.mapTransform.offsetX.toFixed(3)}:${this.mapTransform.offsetZ.toFixed(3)}:${this.mapTransform.rotationY.toFixed(3)}:${this.mapTransform.scale.toFixed(3)}`;
        if (envKey !== this.lastEnvKey) {
          this.lastEnvKey = envKey;
          const targetSpanX = Math.max(wUnits * 1.18, 11.5);
          const targetSpanZ = Math.max(hUnits * 1.25, 6.8);
          const envScale =
            Math.max(targetSpanX / this.envModel.spanX, targetSpanZ / this.envModel.spanZ) *
            Math.max(0.4, this.mapTransform.scale);
          this.envModel.wrapper.position.set(
            wUnits / 2 + this.mapTransform.offsetX,
            -0.06,
            hUnits / 2 + this.mapTransform.offsetZ
          );
          this.envModel.wrapper.rotation.y = this.mapTransform.rotationY;
          this.envModel.wrapper.scaling.setAll(envScale);
          this.envModel.wrapper.computeWorldMatrix(true);
          this.envModel.meshes.forEach((m) => m.computeWorldMatrix(true));
          this.bakeHeightGrid();
        }
      }
    }

    const resolveY = (x: number, z: number) =>
      options.showForestMap ? this.terrainElevationAt(x, z) + 0.03 : surfaceHeight(x, z) + 0.04;

    const primaryTarget = targetPositions[0] ?? { x: casterPos.x + 200, y: casterPos.y };

    if (this.casterModel) {
      const visible = options.show3dTokens && casterAlpha > 0.02;
      this.casterModel.wrapper.setEnabled(visible);
      if (visible) {
        const cx = casterPos.x / 66;
        const cz = casterPos.y / 66;
        const tx = primaryTarget.x / 66;
        const tz = primaryTarget.y / 66;
        const y = resolveY(cx, cz);
        this.casterModel.wrapper.position.set(cx, y, cz);
        this.casterModel.wrapper.scaling.setAll(Math.max(0.65, scale));
        this.casterModel.wrapper.rotation.y = Math.atan2(tx - cx, tz - cz);
        for (const m of this.casterModel.meshes) {
          m.visibility = casterAlpha;
        }
      }
    }

    for (let i = 0; i < this.goblinModels.length; i++) {
      const goblin = this.goblinModels[i];
      const pos = targetPositions[i];
      const visible = options.show3dTokens && !!pos;
      goblin.wrapper.setEnabled(visible);
      if (visible && pos) {
        const gx = pos.x / 66;
        const gz = pos.y / 66;
        const cx = casterPos.x / 66;
        const cz = casterPos.y / 66;
        const y = resolveY(gx, gz);
        goblin.wrapper.position.set(gx, y, gz);
        goblin.wrapper.scaling.setAll(Math.max(0.65, scale));
        const faceAngle = Math.atan2(cx - gx, cz - gz);
        goblin.wrapper.rotation.set(i === 0 && options.proneFirstTarget ? Math.PI / 2 : 0, faceAngle, 0);
      }
    }

    return [];
  }

  dispose(): void {
    this.disposed = true;
    this.envModel?.wrapper.dispose(false, true);
    this.casterModel?.wrapper.dispose(false, true);
    this.goblinModels.forEach((g) => g.wrapper.dispose(false, true));
    this.fillLight.dispose();
    this.sunLight.dispose();
  }
}
