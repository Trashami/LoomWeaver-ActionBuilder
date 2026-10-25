import {
  Color3,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { LightSourceNode } from '../map-scene-contract';

export class SceneLightingController {
  static syncLights(scene: Scene, lightNodes: readonly LightSourceNode[]): void {
    scene.lights
      .filter((l) => l.name.startsWith('lw-point-light-'))
      .forEach((l) => l.dispose());
    scene.meshes
      .filter((m) => m.name.startsWith('lw-light-orb-'))
      .forEach((m) => m.dispose());

    let hemi = scene.getLightByName('lw-hemi-light') as HemisphericLight | null;
    if (!hemi) {
      hemi = new HemisphericLight('lw-hemi-light', new Vector3(0, 1, 0), scene);
      hemi.intensity = 0.55;
      hemi.groundColor = Color3.FromHexString('#091310');
    }

    for (const node of lightNodes) {
      const pt = new PointLight(
        `lw-point-light-${node.id}`,
        new Vector3(node.x, node.y, node.z),
        scene,
      );
      pt.diffuse = Color3.FromHexString(node.colorHex);
      pt.range = node.range;
      pt.intensity = node.intensity;

      const orb = MeshBuilder.CreateSphere(
        `lw-light-orb-${node.id}`,
        { diameter: 0.55, segments: 8 },
        scene,
      );
      orb.position.set(node.x, Math.min(2.6, node.y * 0.5), node.z);
      const orbMat = new StandardMaterial(`lw-light-mat-${node.id}`, scene);
      orbMat.emissiveColor = Color3.FromHexString(node.colorHex);
      orb.material = orbMat;
      orb.isPickable = false;
    }
  }
}
