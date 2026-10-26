import { WallDrawMode } from '../map-scene-contract';

export class WallPolygonBuilder {
  static generatePolygonVertices(
    mode: WallDrawMode,
    cx: number,
    cz: number,
    widthMeters: number,
    depthMeters: number,
  ): readonly (readonly [number, number])[] {
    const hw = widthMeters / 2;
    const hd = depthMeters / 2;

    if (mode === 'triangle') {
      return [
        [this.round(cx), this.round(cz - hd)],
        [this.round(cx + hw), this.round(cz + hd)],
        [this.round(cx - hw), this.round(cz + hd)],
      ];
    }

    if (mode === 'hexagon') {
      const pts: [number, number][] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        pts.push([this.round(cx + hw * Math.cos(angle)), this.round(cz + hd * Math.sin(angle))]);
      }
      return pts;
    }

    if (mode === 'octagon') {
      const pts: [number, number][] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 - Math.PI / 8;
        pts.push([this.round(cx + hw * Math.cos(angle)), this.round(cz + hd * Math.sin(angle))]);
      }
      return pts;
    }

    if (mode === 'l_shape') {
      return [
        [this.round(cx - hw), this.round(cz - hd)],
        [this.round(cx + hw), this.round(cz - hd)],
        [this.round(cx + hw), this.round(cz)],
        [this.round(cx), this.round(cz)],
        [this.round(cx), this.round(cz + hd)],
        [this.round(cx - hw), this.round(cz + hd)],
      ];
    }

    if (mode === 'circle') {
      const pts: [number, number][] = [];
      const steps = 16;
      for (let i = 0; i < steps; i++) {
        const angle = (i * Math.PI * 2) / steps;
        pts.push([this.round(cx + hw * Math.cos(angle)), this.round(cz + hd * Math.sin(angle))]);
      }
      return pts;
    }

    if (mode === 'cave') {
      const rough: [number, number][] = [
        [cx - hw, cz - hd * 0.7],
        [cx - hw * 0.3, cz - hd * 1.05],
        [cx + hw * 0.65, cz - hd * 0.85],
        [cx + hw * 1.05, cz - hd * 0.1],
        [cx + hw * 0.75, cz + hd * 0.9],
        [cx - hw * 0.25, cz + hd * 1.05],
        [cx - hw * 0.95, cz + hd * 0.5],
      ];
      return this.smoothChaikinPolyline(rough, 1);
    }

    if (mode === 'line') {
      return [
        [this.round(cx - hw), this.round(cz)],
        [this.round(cx + hw), this.round(cz)],
      ];
    }

    return [
      [this.round(cx - hw), this.round(cz - hd)],
      [this.round(cx + hw), this.round(cz - hd)],
      [this.round(cx + hw), this.round(cz + hd)],
      [this.round(cx - hw), this.round(cz + hd)],
    ];
  }

  static smoothChaikinPolyline(
    points: readonly (readonly [number, number])[],
    iterations = 1,
  ): readonly (readonly [number, number])[] {
    if (points.length < 3) return points;
    let current = points.map((p) => [p[0], p[1]] as [number, number]);
    for (let iter = 0; iter < iterations; iter++) {
      const next: [number, number][] = [];
      for (let i = 0; i < current.length; i++) {
        const p0 = current[i];
        const p1 = current[(i + 1) % current.length];
        next.push([
          this.round(0.75 * p0[0] + 0.25 * p1[0]),
          this.round(0.75 * p0[1] + 0.25 * p1[1]),
        ]);
        next.push([
          this.round(0.25 * p0[0] + 0.75 * p1[0]),
          this.round(0.25 * p0[1] + 0.75 * p1[1]),
        ]);
      }
      current = next;
    }
    return current;
  }

  private static round(val: number): number {
    return Math.round(val * 100) / 100;
  }
}
