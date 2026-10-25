import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
} from '@babylonjs/core';

export class SeededScatterEngine {
  static rebuildScatterInstances(
    scene: Scene,
    seed: number,
    densityPercent: number,
  ): number {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-scatter-'))
      .forEach((m) => m.dispose());

    const masterCrystal = MeshBuilder.CreateCylinder(
      'lw-scatter-master',
      { height: 1.35, diameterTop: 0.15, diameterBottom: 0.65, tessellation: 6 },
      scene,
    );
    const mat = new StandardMaterial('lw-scatter-mat', scene);
    mat.diffuseColor = Color3.FromHexString('#2ed39a');
    mat.emissiveColor = Color3.FromHexString('#0d3b2b');
    masterCrystal.material = mat;
    masterCrystal.isVisible = false;
    masterCrystal.isPickable = false;

    const count = Math.max(4, Math.min(48, Math.round((densityPercent / 100) * 36)));
    let state = seed || 1042;
    const nextRand = (): number => {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const inst = masterCrystal.createInstance(`lw-scatter-inst-${i}`);
      const angle = nextRand() * Math.PI * 2;
      const radius = 6.5 + nextRand() * 9.5;
      inst.position.x = Math.cos(angle) * radius;
      inst.position.z = Math.sin(angle) * (radius * 0.75);
      inst.position.y = 0.65;
      const s = 0.6 + nextRand() * 0.85;
      inst.scaling.set(s, s * (0.8 + nextRand() * 0.7), s);
      inst.rotation.y = nextRand() * Math.PI;
      inst.isPickable = false;
    }

    return count;
  }
}
