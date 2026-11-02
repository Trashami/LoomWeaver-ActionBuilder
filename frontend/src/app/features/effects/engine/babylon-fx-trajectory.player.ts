import { WritableSignal } from '@angular/core';
import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from '@babylonjs/core';
import { EffectTimelinePresetVm } from './effect-timeline.contract';

export class BabylonFxTrajectoryPlayer {
  private animHandle: number | null = null;

  stop(): void {
    if (this.animHandle !== null) {
      cancelAnimationFrame(this.animHandle);
      this.animHandle = null;
    }
  }

  play(
    scene: Scene,
    preset: EffectTimelinePresetVm,
    startPos: { x: number; z: number },
    endPos: { x: number; z: number },
    reducedMotion: boolean,
    activeKeyframeLabel: WritableSignal<string>,
  ): void {
    this.stop();

    scene.meshes
      .filter((m) => m.name.startsWith('lw-fx-'))
      .forEach((m) => m.dispose());

    const primary = Color3.FromHexString(preset.primaryColorHex);
    const secondary = Color3.FromHexString(preset.secondaryColorHex);
    const mat = new StandardMaterial('lw-fx-mat', scene);
    mat.diffuseColor = primary;
    mat.emissiveColor = primary.scale(0.85);
    mat.specularColor = secondary;
    mat.alpha = 0.88;

    const fxMeshes: Mesh[] = [];

    if (preset.trajectoryType === 'arc') {
      const orb = MeshBuilder.CreateSphere('lw-fx-orb', { diameter: 0.9, segments: 12 }, scene);
      orb.material = mat;
      fxMeshes.push(orb);
    } else if (preset.trajectoryType === 'cone') {
      const cone = MeshBuilder.CreateCylinder(
        'lw-fx-cone',
        { height: 6, diameterTop: 3.8, diameterBottom: 0.35, tessellation: 18 },
        scene,
      );
      cone.rotation.z = -Math.PI / 2;
      cone.position.set((startPos.x + endPos.x) / 2, 1.1, (startPos.z + endPos.z) / 2);
      cone.material = mat;
      fxMeshes.push(cone);
    } else if (preset.trajectoryType === 'beam') {
      const beam = MeshBuilder.CreateCylinder(
        'lw-fx-beam',
        { height: 10, diameter: 1.6, tessellation: 20 },
        scene,
      );
      beam.position.set(endPos.x, 5, endPos.z);
      beam.material = mat;
      fxMeshes.push(beam);
    } else {
      const sigil = MeshBuilder.CreateTorus(
        'lw-fx-sigil',
        { diameter: 5.5, thickness: 0.28, tessellation: 6 },
        scene,
      );
      sigil.position.set(endPos.x, 0.25, endPos.z);
      sigil.material = mat;
      fxMeshes.push(sigil);
    }

    const ring = MeshBuilder.CreateTorus(
      'lw-fx-ring',
      { diameter: 2.2, thickness: 0.14, tessellation: 24 },
      scene,
    );
    ring.position.set(endPos.x, 0.2, endPos.z);
    ring.material = mat;
    fxMeshes.push(ring);

    if (reducedMotion) {
      activeKeyframeLabel.set(`${preset.name} (Static Reduced-Motion Preview)`);
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
      activeKeyframeLabel.set(preset.keyframes[kfIdx] ?? 'Playing');

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
        activeKeyframeLabel.set('Complete');
      }
    };

    this.animHandle = requestAnimationFrame(step);
  }
}
