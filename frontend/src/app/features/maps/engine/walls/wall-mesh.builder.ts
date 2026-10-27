import { Color3, MeshBuilder, Scene, StandardMaterial } from '@babylonjs/core';
import { MapWallSegmentNode, WallDrawMode } from '../map-scene-contract';
import { CutawayWallEngine } from './cutaway-wall.engine';

export class WallMeshBuilder {
  static buildShapePoints(
    mode: WallDrawMode,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
  ): (readonly [number, number])[] {
    if (mode === 'line') {
      return [
        [startX, startZ],
        [endX, endZ],
      ];
    }
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minZ = Math.min(startZ, endZ);
    const maxZ = Math.max(startZ, endZ);
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const rx = Math.max(1.5, (maxX - minX) / 2);
    const rz = Math.max(1.5, (maxZ - minZ) / 2);

    if (mode === 'room') {
      return [
        [minX, minZ],
        [maxX, minZ],
        [maxX, maxZ],
        [minX, maxZ],
      ];
    }
    if (mode === 'l_shape') {
      const midX = minX + (maxX - minX) * 0.55;
      const midZ = minZ + (maxZ - minZ) * 0.55;
      return [
        [minX, minZ],
        [maxX, minZ],
        [maxX, midZ],
        [midX, midZ],
        [midX, maxZ],
        [minX, maxZ],
      ];
    }
    const sides = mode === 'circle' ? 16 : 8;
    const pts: [number, number][] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      pts.push([
        Math.round((cx + Math.cos(a) * rx) * 100) / 100,
        Math.round((cz + Math.sin(a) * rz) * 100) / 100,
      ]);
    }
    return pts;
  }

  static rebuildWallMeshes(
    scene: Scene,
    walls: readonly MapWallSegmentNode[] | undefined,
    hideSecrets = false,
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
        false,
      );
      const colorHex = CutawayWallEngine.materialHex(wall.material);

      const mat = new StandardMaterial(`lw-wall-mat-${wall.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(colorHex);
      mat.emissiveColor = Color3.FromHexString(colorHex).scale(0.14);

      const segCount = closed ? pts.length : pts.length - 1;
      for (let i = 0; i < segCount; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const totalLen = Math.hypot(dx, dz);
        if (totalLen < 0.08) continue;

        // Subdivide into gapless 3D wall blocks (nominal 2.0m per block, exact fit with +0.04m seam overlap)
        const blockCount = Math.max(1, Math.round(totalLen / 2.0));
        const blockLen = totalLen / blockCount;
        const angleY = -Math.atan2(dz, dx);

        for (let bIdx = 0; bIdx < blockCount; bIdx++) {
          const tMid = (bIdx + 0.5) / blockCount;
          const bx = a[0] + dx * tMid;
          const bz = a[1] + dz * tMid;

          const segMesh = MeshBuilder.CreateBox(
            `lw-wall-${wall.id}-seg-${i}-${bIdx}`,
            {
              width: blockLen + 0.04,
              height,
              depth: wall.thicknessMeters,
            },
            scene,
          );
          segMesh.position.set(bx, height / 2, bz);
          segMesh.rotation.y = angleY;
          segMesh.material = mat;
          segMesh.receiveShadows = true;
          meshCount++;
        }
      }

      // Place gapless corner/end posts at every vertex so corners and line joints never gap
      for (let pIdx = 0; pIdx < pts.length; pIdx++) {
        const pt = pts[pIdx];
        const post = MeshBuilder.CreateCylinder(
          `lw-wall-${wall.id}-post-${pIdx}`,
          {
            height: height * 1.04,
            diameter: wall.thicknessMeters * 1.18,
            tessellation: 14,
          },
          scene,
        );
        post.position.set(pt[0], (height * 1.04) / 2, pt[1]);
        post.material = mat;
        post.receiveShadows = true;
        meshCount++;
      }

      for (const opening of wall.openings) {
        if (hideSecrets && opening.isSecret && !opening.isRevealedToPlayers) {
          continue;
        }
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
        portalMat.emissiveColor = Color3.FromHexString(portalHex).scale(0.32);

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

  static renderGhostWallPreview(
    scene: Scene,
    drawMode: WallDrawMode,
    startX: number,
    startZ: number,
    endX: number,
    endZ: number,
    heightMeters: number,
    thicknessMeters: number,
  ): void {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-ghost-wall-'))
      .forEach((m) => m.dispose());

    const pts = this.buildShapePoints(drawMode, startX, startZ, endX, endZ);
    if (pts.length < 2) return;

    const closed = drawMode !== 'line';
    const mat = new StandardMaterial('lw-ghost-wall-mat', scene);
    mat.diffuseColor = Color3.FromHexString('#49e892');
    mat.emissiveColor = Color3.FromHexString('#2ee66b').scale(0.55);
    mat.alpha = 0.48;

    const segCount = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < segCount; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.05) continue;

      const mesh = MeshBuilder.CreateBox(
        `lw-ghost-wall-seg-${i}`,
        { width: len + 0.04, height: heightMeters, depth: thicknessMeters },
        scene,
      );
      mesh.position.set((a[0] + b[0]) / 2, heightMeters / 2, (a[1] + b[1]) / 2);
      mesh.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      mesh.material = mat;
      mesh.isPickable = false;
    }
  }
}
