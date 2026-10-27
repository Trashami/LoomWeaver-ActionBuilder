import '@babylonjs/loaders/glTF';
import {
  AbstractMesh,
  Color3,
  DirectionalLight,
  HemisphericLight,
  PBRMaterial,
  Scene,
  SceneLoader,
  StandardMaterial,
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
  private fallbackGroundY = 0;

  mapTransform: MapTransformState = {
    offsetX: 0,
    offsetZ: 0,
    rotationY: 0,
    scale: 1,
  };

  constructor(private readonly scene: Scene) {
    this.fillLight = new HemisphericLight('eb-3d-model-fill', new Vector3(0.2, 1, -0.3), this.scene);
    this.fillLight.intensity = 0.45;
    this.fillLight.groundColor = new Color3(0.14, 0.18, 0.24);
    this.fillLight.specular = new Color3(0.18, 0.2, 0.22);

    this.sunLight = new DirectionalLight('eb-3d-model-sun', new Vector3(-0.45, -0.85, 0.35).normalize(), this.scene);
    this.sunLight.intensity = 0.55;
    this.sunLight.diffuse = new Color3(1.0, 0.96, 0.88);
    this.sunLight.specular = new Color3(0.28, 0.28, 0.28);
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
        // Allow ambient + fill + sun + all 4 dynamic spell PointLights to illuminate 3D GLB models
        mat.maxSimultaneousLights = 8;
        // Disable inverse-square glTF physical falloff so PointLight range & intensity light up the 3D terrain & tokens
        mat.usePhysicalLightFalloff = false;
        if (isTerrain) {
          mat.roughness = 0.84;
          mat.metallic = 0.02;
          mat.directIntensity = 1.65;
          mat.environmentIntensity = 0.55;
        } else {
          mat.roughness = Math.max(0.5, mat.roughness ?? 0.65);
          mat.metallic = Math.min(0.25, mat.metallic ?? 0.1);
          mat.directIntensity = 1.45;
          mat.environmentIntensity = 0.65;
        }
      } else if (mat instanceof StandardMaterial) {
        mat.maxSimultaneousLights = 8;
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
    this.tuneMaterialQuality(meshes, false);
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
   * Rasterizes the world-space triangles of the 3D terrain into a 128x128 heightfield whenever
   * the terrain loads or moves. Separates walkable ground/riverbank/rock elevation (bottom 58%
   * of model height) from upper tree foliage canopies so tokens never sink under the floor
   * AND never jump to the top of tree branches.
   */
  private bakeHeightGrid(): void {
    if (!this.envModel) return;
    this.heightGrid.fill(-999);
    const bounds = this.envModel.wrapper.getHierarchyBoundingVectors(true);
    this.gridMinX = bounds.min.x - 0.25;
    this.gridMaxX = bounds.max.x + 0.25;
    this.gridMinZ = bounds.min.z - 0.25;
    this.gridMaxZ = bounds.max.z + 0.25;
    const spanX = Math.max(0.01, this.gridMaxX - this.gridMinX);
    const spanZ = Math.max(0.01, this.gridMaxZ - this.gridMinZ);
    const totalHeight = Math.max(0.1, bounds.max.y - bounds.min.y);
    // All riverbanks, rocks, and water lie within 0..58% of total height; >58% is north-bank tree canopy
    const groundCapY = bounds.min.y + totalHeight * 0.58;
    this.fallbackGroundY = bounds.min.y + totalHeight * 0.32;

    const v0 = new Vector3();
    const v1 = new Vector3();
    const v2 = new Vector3();
    const invSpanX = (HEIGHT_GRID_RES - 1) / spanX;
    const invSpanZ = (HEIGHT_GRID_RES - 1) / spanZ;

    for (const m of this.envModel.meshes) {
      const pos = m.getVerticesData('position');
      const indices = m.getIndices();
      if (!pos || pos.length < 9) continue;
      const wm = m.getWorldMatrix();

      if (indices && indices.length >= 3) {
        for (let i = 0; i < indices.length; i += 3) {
          const i0 = indices[i] * 3;
          const i1 = indices[i + 1] * 3;
          const i2 = indices[i + 2] * 3;
          Vector3.TransformCoordinatesFromFloatsToRef(pos[i0], pos[i0 + 1], pos[i0 + 2], wm, v0);
          Vector3.TransformCoordinatesFromFloatsToRef(pos[i1], pos[i1 + 1], pos[i1 + 2], wm, v1);
          Vector3.TransformCoordinatesFromFloatsToRef(pos[i2], pos[i2 + 1], pos[i2 + 2], wm, v2);

          // Skip upper tree canopy triangles so ground underneath trees uses bank height
          const minTriY = Math.min(v0.y, v1.y, v2.y);
          if (minTriY > groundCapY) continue;

          const gx0 = (v0.x - this.gridMinX) * invSpanX;
          const gz0 = (v0.z - this.gridMinZ) * invSpanZ;
          const gx1 = (v1.x - this.gridMinX) * invSpanX;
          const gz1 = (v1.z - this.gridMinZ) * invSpanZ;
          const gx2 = (v2.x - this.gridMinX) * invSpanX;
          const gz2 = (v2.z - this.gridMinZ) * invSpanZ;

          const minX = Math.max(0, Math.floor(Math.min(gx0, gx1, gx2)));
          const maxX = Math.min(HEIGHT_GRID_RES - 1, Math.ceil(Math.max(gx0, gx1, gx2)));
          const minZ = Math.max(0, Math.floor(Math.min(gz0, gz1, gz2)));
          const maxZ = Math.min(HEIGHT_GRID_RES - 1, Math.ceil(Math.max(gz0, gz1, gz2)));

          const denom = (gz1 - gz2) * (gx0 - gx2) + (gx2 - gx1) * (gz0 - gz2);
          if (Math.abs(denom) < 1e-5) {
            const cx = Math.min(HEIGHT_GRID_RES - 1, Math.max(0, Math.round((gx0 + gx1 + gx2) / 3)));
            const cz = Math.min(HEIGHT_GRID_RES - 1, Math.max(0, Math.round((gz0 + gz1 + gz2) / 3)));
            const idx = cz * HEIGHT_GRID_RES + cx;
            const yVal = Math.min(groundCapY, Math.max(v0.y, v1.y, v2.y));
            if (yVal > this.heightGrid[idx]) this.heightGrid[idx] = yVal;
            continue;
          }
          const invDenom = 1 / denom;
          for (let gz = minZ; gz <= maxZ; gz++) {
            for (let gx = minX; gx <= maxX; gx++) {
              const w0 = ((gz1 - gz2) * (gx - gx2) + (gx2 - gx1) * (gz - gz2)) * invDenom;
              const w1 = ((gz2 - gz0) * (gx - gx2) + (gx0 - gx2) * (gz - gz2)) * invDenom;
              const w2 = 1 - w0 - w1;
              if (w0 >= -0.05 && w1 >= -0.05 && w2 >= -0.05) {
                const yVal = Math.min(groundCapY, w0 * v0.y + w1 * v1.y + w2 * v2.y);
                const idx = gz * HEIGHT_GRID_RES + gx;
                if (yVal > this.heightGrid[idx]) {
                  this.heightGrid[idx] = yVal;
                }
              }
            }
          }
        }
      }
    }

    // Multi-pass dilation to smoothly fill any cells directly underneath tall tree canopies
    const work = new Float32Array(this.heightGrid);
    for (let pass = 0; pass < 6; pass++) {
      const src = pass % 2 === 0 ? this.heightGrid : work;
      const dst = pass % 2 === 0 ? work : this.heightGrid;
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
          dst[idx] = count > 0 ? sum / count : -999;
        }
      }
    }

    for (let i = 0; i < this.heightGrid.length; i++) {
      this.heightGrid[i] = this.heightGrid[i] > -900 ? Math.max(0, this.heightGrid[i]) : this.fallbackGroundY;
    }
    this.hasHeightGrid = true;
  }

  /** O(1) bilinear heightfield lookup (< 0.0001 ms per call, zero runtime triangle raycasts). */
  terrainElevationAt(x: number, z: number): number {
    if (!this.hasHeightGrid || !this.envModel || !this.envModel.wrapper.isEnabled()) return 0;
    const fx = Math.max(
      0,
      Math.min(
        HEIGHT_GRID_RES - 1.001,
        ((x - this.gridMinX) / Math.max(0.01, this.gridMaxX - this.gridMinX)) * (HEIGHT_GRID_RES - 1)
      )
    );
    const fz = Math.max(
      0,
      Math.min(
        HEIGHT_GRID_RES - 1.001,
        ((z - this.gridMinZ) / Math.max(0.01, this.gridMaxZ - this.gridMinZ)) * (HEIGHT_GRID_RES - 1)
      )
    );
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

  /** Samples the token's circular footprint so neither the 3D token nor its base ring clips into sloped banks. */
  tokenElevationAt(x: number, z: number, radius = 0.24): number {
    const hc = this.terrainElevationAt(x, z);
    const hMax = Math.max(
      hc,
      this.terrainElevationAt(x - radius, z),
      this.terrainElevationAt(x + radius, z),
      this.terrainElevationAt(x, z - radius),
      this.terrainElevationAt(x, z + radius)
    );
    return hc * 0.3 + hMax * 0.7;
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
    // Scale 3D scene lighting directly with the Ambient slider so lowering Ambient darkens the 3D terrain
    // and allows dynamic spell PointLights to vividly illuminate the riverbank and 3D tokens.
    this.fillLight.intensity = Math.max(0.02, options.ambient * 1.15);
    this.sunLight.intensity = Math.max(0.03, options.ambient * 1.45);

    if (this.envModel) {
      this.envModel.wrapper.setEnabled(options.showForestMap);
      if (options.showForestMap) {
        const envKey = `${wUnits.toFixed(2)}:${hUnits.toFixed(2)}:${this.mapTransform.offsetX.toFixed(3)}:${this.mapTransform.offsetZ.toFixed(3)}:${this.mapTransform.rotationY.toFixed(3)}:${this.mapTransform.scale.toFixed(3)}`;
        if (envKey !== this.lastEnvKey) {
          this.lastEnvKey = envKey;
          const targetSpanX = Math.max(wUnits * 1.18, 11.5);
          const targetSpanZ = Math.max(hUnits * 1.25, 6.8);
          const mapScale = Math.max(0.4, this.mapTransform.scale);
          const envScaleXZ = Math.max(targetSpanX / this.envModel.spanX, targetSpanZ / this.envModel.spanZ) * mapScale;
          const envScaleY = Math.min(envScaleXZ, 2.2) * mapScale;
          this.envModel.wrapper.position.set(
            wUnits / 2 + this.mapTransform.offsetX,
            -0.04,
            hUnits / 2 + this.mapTransform.offsetZ
          );
          this.envModel.wrapper.rotation.y = this.mapTransform.rotationY;
          this.envModel.wrapper.scaling.set(envScaleXZ, envScaleY, envScaleXZ);
          this.envModel.wrapper.computeWorldMatrix(true);
          this.envModel.meshes.forEach((m) => m.computeWorldMatrix(true));
          this.bakeHeightGrid();
        }
      }
    }

    const resolveY = (x: number, z: number) =>
      options.showForestMap ? this.tokenElevationAt(x, z) + 0.04 : surfaceHeight(x, z) + 0.04;

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
        this.casterModel.wrapper.scaling.setAll(Math.max(0.75, scale));
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
        goblin.wrapper.scaling.setAll(Math.max(0.75, scale));
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
