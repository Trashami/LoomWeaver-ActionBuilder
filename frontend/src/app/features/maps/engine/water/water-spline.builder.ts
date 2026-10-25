import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { WaterSplineNode } from '../map-scene-contract';

export class WaterSplineBuilder {
  static rebuildWaterSplines(scene: Scene, splines: readonly WaterSplineNode[]): void {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-water-spline-'))
      .forEach((m) => m.dispose());

    for (const spline of splines) {
      if (spline.points.length < 2) continue;
      const leftPath: Vector3[] = [];
      const rightPath: Vector3[] = [];
      const halfW = spline.width * 0.5;

      for (const pt of spline.points) {
        leftPath.push(new Vector3(pt[0], pt[1], pt[2] - halfW));
        rightPath.push(new Vector3(pt[0], pt[1], pt[2] + halfW));
      }

      const ribbon = MeshBuilder.CreateRibbon(
        `lw-water-spline-${spline.id}`,
        {
          pathArray: [leftPath, rightPath],
          sideOrientation: 2,
        },
        scene,
      );

      const mat = new StandardMaterial(`lw-water-mat-${spline.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(spline.colorHex);
      mat.emissiveColor = Color3.FromHexString('#0d3b49');
      mat.specularColor = Color3.FromHexString('#7de2ff');
      mat.alpha = 0.82;
      ribbon.material = mat;
      ribbon.isPickable = false;
    }
  }
}
