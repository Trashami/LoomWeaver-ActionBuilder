import { Color3, MeshBuilder, Scene, StandardMaterial } from '@babylonjs/core';
import { MapWallSegmentNode } from '../map-scene-contract';
import { CutawayWallEngine } from './cutaway-wall.engine';

export class WallMeshBuilder {
  static rebuildWallMeshes(
    scene: Scene,
    walls: readonly MapWallSegmentNode[] | undefined,
    is2DBlueprint = false,
  ): number {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-wall-') || m.name.startsWith('lw-portal-'))
      .forEach((m) => m.dispose());

    if (!walls || walls.length === 0) return 0;

    let meshCount = 0;

    for (const wall of walls) {
      const pts = wall.points;
      if (pts.length < 2) continue;

      const closed = wall.drawMode !== 'line';
      const height = CutawayWallEngine.computeCutawayHeight(
        wall.heightMeters,
        wall.perspective,
        is2DBlueprint,
      );
      const colorHex = CutawayWallEngine.materialHex(wall.material);

      const mat = new StandardMaterial(`lw-wall-mat-${wall.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(colorHex);
      mat.emissiveColor = Color3.FromHexString(colorHex).scale(0.18);

      const segCount = closed ? pts.length : pts.length - 1;
      for (let i = 0; i < segCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (len < 0.1) continue;

        const segMesh = MeshBuilder.CreateBox(
          `lw-wall-${wall.id}-seg-${i}`,
          {
            width: len,
            height,
            depth: wall.thicknessMeters,
          },
          scene,
        );
        segMesh.position.set((a[0] + b[0]) / 2, height / 2, (a[1] + b[1]) / 2);
        segMesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
        segMesh.material = mat;
        meshCount++;

        if (wall.hasCornerPosts) {
          const post = MeshBuilder.CreateCylinder(
            `lw-wall-${wall.id}-post-${i}`,
            {
              height: height * 1.08,
              diameter: wall.thicknessMeters * 1.45,
              tessellation: 12,
            },
            scene,
          );
          post.position.set(a[0], (height * 1.08) / 2, a[1]);
          post.material = mat;
          meshCount++;
        }
      }

      for (const opening of wall.openings) {
        const pose = CutawayWallEngine.fitPolylineOpening(
          pts,
          opening.t,
          opening.widthMeters,
          wall.thicknessMeters,
          closed,
        );
        if (!pose) continue;

        const portalMat = new StandardMaterial(`lw-portal-mat-${opening.id}`, scene);
        const portalHex = opening.isSecret ? '#ef5d72' : opening.isOpen ? '#2ed39a' : '#d4a853';
        portalMat.diffuseColor = Color3.FromHexString(portalHex);
        portalMat.emissiveColor = Color3.FromHexString(portalHex).scale(0.38);

        const portalMesh = MeshBuilder.CreateBox(
          `lw-portal-${wall.id}-${opening.id}`,
          {
            width: pose.widthMeters,
            height: height * 0.92,
            depth: wall.thicknessMeters * 1.35,
          },
          scene,
        );
        portalMesh.position.set(pose.x, (height * 0.92) / 2, pose.z);
        portalMesh.rotation.y = -pose.angleRad;
        portalMesh.material = portalMat;
        meshCount++;
      }
    }

    return meshCount;
  }
}
