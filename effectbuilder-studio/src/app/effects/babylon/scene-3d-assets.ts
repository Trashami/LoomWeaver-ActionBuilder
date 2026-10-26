import '@babylonjs/loaders/glTF';
import {
  AbstractMesh,
  Color3,
  HemisphericLight,
  Mesh,
  Scene,
  SceneLoader,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { FxPoint } from '../fireball-motion';

export const FOREST_MAP_GLB = '/models-3d/a_forest_3_with_a_road_at_night_for_game.glb';
export const SORCERESS_GLB = '/models-3d/Meshy_AI_Eclipse_Abyss_Sorcere_1026221004_texture.glb';
export const GOBLIN_MALE_GLB = '/models-3d/Meshy_AI_Goblin_Male_1026221232_texture.glb';

interface NormalizedModel {
  wrapper: TransformNode;
  pivot: TransformNode;
  meshes: AbstractMesh[];
  unitScale: number;
  spanX: number;
  spanZ: number;
}

export class Scene3dAssetController {
  private envModel?: NormalizedModel;
  private casterModel?: NormalizedModel;
  private goblinModels: NormalizedModel[] = [];
  private fillLight: HemisphericLight;
  private disposed = false;
  private loading = false;
  private loaded = false;

  constructor(private readonly scene: Scene) {
    this.fillLight = new HemisphericLight('eb-3d-model-fill', new Vector3(0.25, 1, -0.35), this.scene);
    this.fillLight.intensity = 0.85;
    this.fillLight.groundColor = new Color3(0.16, 0.2, 0.28);
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
        this.loadNormalizedModel('forest-night-map', FOREST_MAP_GLB, 1),
        this.loadNormalizedModel('caster-sorceress', SORCERESS_GLB, 1.65),
        this.loadNormalizedModel('target-goblin-0', GOBLIN_MALE_GLB, 1.32),
      ]);
      if (this.disposed) return;
      this.envModel = env;
      this.casterModel = caster;
      if (goblin0) {
        const goblin1 = this.cloneNormalizedModel(goblin0, 'target-goblin-1');
        const goblin2 = this.cloneNormalizedModel(goblin0, 'target-goblin-2');
        this.goblinModels = [goblin0, goblin1, goblin2];
      }
      this.loaded = true;
      onReady?.();
    } catch (err) {
      console.warn('3D scene asset load warning:', err);
    } finally {
      this.loading = false;
    }
  }

  private async loadNormalizedModel(
    name: string,
    url: string,
    targetHeight: number
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
    for (const m of result.meshes) {
      m.isPickable = false;
      m.receiveShadows = true;
    }

    pivot.computeWorldMatrix(true);
    result.meshes.forEach((m) => m.computeWorldMatrix(true));
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
      meshes: result.meshes,
      unitScale,
      spanX: spanX * unitScale,
      spanZ: spanZ * unitScale,
    };
  }

  private cloneNormalizedModel(source: NormalizedModel, name: string): NormalizedModel {
    const wrapper = new TransformNode(`eb-3d-wrap-${name}`, this.scene);
    const pivot = source.pivot.clone(`eb-3d-pivot-${name}`, wrapper)!;
    const meshes = pivot.getChildMeshes(false);
    for (const m of meshes) {
      m.isPickable = false;
      m.receiveShadows = true;
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
    this.fillLight.intensity = Math.max(0.55, options.ambient * 2.2);

    if (this.envModel) {
      this.envModel.wrapper.setEnabled(options.showForestMap);
      if (options.showForestMap) {
        const targetSpanX = Math.max(wUnits * 1.35, 14);
        const targetSpanZ = Math.max(hUnits * 1.45, 8);
        const envScale = Math.max(targetSpanX / this.envModel.spanX, targetSpanZ / this.envModel.spanZ);
        this.envModel.wrapper.position.set(wUnits / 2, -0.04, hUnits / 2);
        this.envModel.wrapper.scaling.setAll(envScale);
      }
    }

    const shadowCasters: AbstractMesh[] = [];
    const primaryTarget = targetPositions[0] ?? { x: casterPos.x + 200, y: casterPos.y };

    if (this.casterModel) {
      const visible = options.show3dTokens && casterAlpha > 0.02;
      this.casterModel.wrapper.setEnabled(visible);
      if (visible) {
        const cx = casterPos.x / 66;
        const cz = casterPos.y / 66;
        const tx = primaryTarget.x / 66;
        const tz = primaryTarget.y / 66;
        const y = options.showForestMap ? 0.02 : surfaceHeight(cx, cz) + 0.04;
        this.casterModel.wrapper.position.set(cx, y, cz);
        this.casterModel.wrapper.scaling.setAll(Math.max(0.65, scale));
        this.casterModel.wrapper.rotation.y = Math.atan2(tx - cx, tz - cz);
        for (const m of this.casterModel.meshes) {
          m.visibility = casterAlpha;
          if (m instanceof Mesh) shadowCasters.push(m);
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
        const y = options.showForestMap ? 0.02 : surfaceHeight(gx, gz) + 0.04;
        goblin.wrapper.position.set(gx, y, gz);
        goblin.wrapper.scaling.setAll(Math.max(0.65, scale));
        const faceAngle = Math.atan2(cx - gx, cz - gz);
        goblin.wrapper.rotation.set(i === 0 && options.proneFirstTarget ? Math.PI / 2 : 0, faceAngle, 0);
        for (const m of goblin.meshes) {
          if (m instanceof Mesh) shadowCasters.push(m);
        }
      }
    }

    return shadowCasters;
  }

  dispose(): void {
    this.disposed = true;
    this.envModel?.wrapper.dispose(false, true);
    this.casterModel?.wrapper.dispose(false, true);
    this.goblinModels.forEach((g) => g.wrapper.dispose(false, true));
    this.fillLight.dispose();
  }
}
