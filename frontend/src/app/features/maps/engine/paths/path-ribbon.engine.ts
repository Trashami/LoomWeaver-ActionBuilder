import { Color3, MeshBuilder, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { MapPathRibbonNode } from '../map-scene-contract';

export class PathRibbonEngine {
  static sampleCurvedWaypoints(
    waypoints: readonly (readonly [number, number])[],
    curveAngleDeg: number,
  ): Vector3[] {
    if (waypoints.length < 2) return [];
    const pts: Vector3[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[i];
      const p1 = waypoints[i + 1];
      if (i === 0) {
        pts.push(new Vector3(p0[0], 0.08, p0[1]));
      }

      const arcPts = this.generateArcSegment(p0, p1, curveAngleDeg, 8);
      for (const ap of arcPts) {
        pts.push(new Vector3(ap[0], 0.08, ap[1]));
      }
    }

    return pts;
  }

  static generateArcSegment(
    p0: readonly [number, number],
    p1: readonly [number, number],
    sweepDeg: number,
    samples = 8,
  ): [number, number][] {
    const dx = p1[0] - p0[0];
    const dz = p1[1] - p0[1];
    const chord = Math.hypot(dx, dz);
    if (chord < 0.01 || Math.abs(sweepDeg) < 1) {
      return [[p1[0], p1[1]]];
    }

    const rad = (Math.min(150, Math.abs(sweepDeg)) * Math.PI) / 180;
    const sign = sweepDeg >= 0 ? 1 : -1;
    const sagitta = (chord / 2) * Math.tan(rad / 4) * sign;
    const nx = -dz / chord;
    const nz = dx / chord;

    const out: [number, number][] = [];
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const bell = 4 * t * (1 - t);
      out.push([
        Math.round((p0[0] + dx * t + nx * sagitta * bell) * 100) / 100,
        Math.round((p0[1] + dz * t + nz * sagitta * bell) * 100) / 100,
      ]);
    }
    return out;
  }

  static rebuildPathRibbonMeshes(
    scene: Scene,
    paths: readonly MapPathRibbonNode[] | undefined,
  ): number {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-path-ribbon-'))
      .forEach((m) => m.dispose());

    if (!paths || paths.length === 0) return 0;

    let count = 0;
    for (const path of paths) {
      const curve = this.sampleCurvedWaypoints(path.waypoints, path.curveAngleDeg);
      if (curve.length < 2) continue;

      const tube = MeshBuilder.CreateTube(
        `lw-path-ribbon-${path.id}`,
        {
          path: curve,
          radius: Math.max(0.25, path.widthMeters * 0.28),
          tessellation: 10,
        },
        scene,
      );
      tube.scaling.y = path.style === 'cliff_ridge' ? 0.55 : 0.14;

      const mat = new StandardMaterial(`lw-path-mat-${path.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(path.colorHex || '#8c7a62');
      mat.emissiveColor = Color3.FromHexString(path.colorHex || '#8c7a62').scale(0.2);
      tube.material = mat;
      count++;
    }

    return count;
  }
}
