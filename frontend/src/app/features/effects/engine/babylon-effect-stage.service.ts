import { Injectable, signal } from '@angular/core';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import {
  EffectTimelinePresetVm,
  VttTokenVm,
} from './effect-timeline.contract';

@Injectable({ providedIn: 'root' })
export class BabylonEffectStageService {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private animHandle: number | null = null;

  readonly activeKeyframeLabel = signal<string>('Ready');
  readonly reducedMotion = signal<boolean>(false);

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

      const camera = new ArcRotateCamera(
        'lw-vtt-cam',
        -Math.PI / 2.2,
        0.78,
        24,
        Vector3.Zero(),
        this.scene,
      );
      camera.lowerRadiusLimit = 10;
      camera.upperRadiusLimit = 44;
      camera.attachControl(canvas, true);

      const hemi = new HemisphericLight('lw-vtt-hemi', new Vector3(0, 1, 0), this.scene);
      hemi.intensity = 0.65;
      hemi.groundColor = Color3.FromHexString('#091410');

      const pt = new PointLight('lw-vtt-pt', new Vector3(0, 7, 0), this.scene);
      pt.intensity = 1.25;
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

      const lines: Vector3[][] = [];
      for (let x = -14; x <= 14; x += 2) {
        lines.push([new Vector3(x, 0.03, -10), new Vector3(x, 0.03, 10)]);
      }
      for (let z = -10; z <= 10; z += 2) {
        lines.push([new Vector3(-14, 0.03, z), new Vector3(14, 0.03, z)]);
      }
      const grid = MeshBuilder.CreateLineSystem('lw-vtt-grid', { lines }, this.scene);
      grid.color = Color3.FromHexString('#264035');

      this.syncTokens(tokens, attackerKey, targetKey);

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

  syncTokens(
    tokens: readonly VttTokenVm[],
    attackerKey?: string,
    targetKey?: string,
  ): void {
    if (!this.scene) return;
    this.scene.meshes
      .filter((m) => m.name.startsWith('lw-token-') || m.name === 'lw-tether-line')
      .forEach((m) => m.dispose());

    for (const t of tokens) {
      const isDead = t.currentHp <= 0;
      const cyl = MeshBuilder.CreateCylinder(
        `lw-token-${t.key}`,
        { height: isDead ? 0.2 : 0.9, diameter: 1.5, tessellation: 24 },
        this.scene,
      );
      cyl.position.set(t.x, isDead ? 0.12 : 0.45, t.z);
      cyl.metadata = { tokenKey: t.key };

      const mat = new StandardMaterial(`lw-tmat-${t.key}`, this.scene);
      mat.diffuseColor = Color3.FromHexString(t.colorHex);
      if (t.key === attackerKey || t.key === targetKey) {
        mat.emissiveColor = Color3.FromHexString(t.colorHex).scale(0.55);
      }
      cyl.material = mat;
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
      tether.color = Color3.FromHexString('#d4a853');
    }
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
    if (this.animHandle !== null) {
      cancelAnimationFrame(this.animHandle);
      this.animHandle = null;
    }
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
  }
}
