import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  VertexData,
} from '@babylonjs/core';

export class TerrainMeshBuilder {
  private static customElevations: Float32Array | null = null;
  private static activeAlbedoUrl = '/assets/sewer-dungeon-wall-library-v1/512/worn-castle-flagstone.png';
  private static activeNormalUrl = '/assets/sewer-dungeon-wall-library-v1/512/worn-castle-flagstone_normal.png';
  private static floorTilingScale = 10;

  static resetElevations(): void {
    this.customElevations = null;
  }

  static buildTerrainAndGrid(
    scene: Scene,
    biome: string,
    reliefScale: number,
  ): Mesh {
    let ground = scene.getMeshByName('lw-terrain-ground') as Mesh | null;
    if (!ground) {
      ground = MeshBuilder.CreateGround(
        'lw-terrain-ground',
        { width: 36, height: 28, subdivisions: 48, updatable: true },
        scene,
      );
      ground.isPickable = true;
      ground.receiveShadows = true;

      const positions = ground.getVerticesData('position');
      if (positions) {
        const amp = reliefScale <= 0 ? 0 : (Math.min(100, reliefScale) / 100) * 0.55;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const z = positions[i + 2];
          const distFromCenter = Math.sqrt(x * x + z * z);
          const edgeFactor = Math.min(1, Math.max(0, (distFromCenter - 7) / 12));
          positions[i + 1] =
            amp === 0 ? 0 : Math.sin(x * 0.35) * Math.cos(z * 0.35) * amp * edgeFactor;
        }
        if (this.customElevations && this.customElevations.length === positions.length / 3) {
          for (let v = 0; v < this.customElevations.length; v++) {
            positions[v * 3 + 1] += this.customElevations[v];
          }
        } else {
          this.customElevations = new Float32Array(positions.length / 3);
        }
        ground.updateVerticesData('position', positions);
        this.recomputeNormals(ground, positions);
      }

      this.applyMaterialAndBump(scene, ground, biome);
    }

    const existingGrid = scene.getMeshByName('lw-terrain-grid');
    if (!existingGrid) {
      const lines: Vector3[][] = [];
      for (let x = -18; x <= 18; x += 1.5) {
        lines.push([new Vector3(x, 0.03, -14), new Vector3(x, 0.03, 14)]);
      }
      for (let z = -14; z <= 14; z += 1.5) {
        lines.push([new Vector3(-18, 0.03, z), new Vector3(18, 0.03, z)]);
      }
      const grid = MeshBuilder.CreateLineSystem('lw-terrain-grid', { lines }, scene);
      grid.color = Color3.FromHexString('#2b4a3c');
      grid.isPickable = false;
    }

    return ground;
  }

  static sampleElevationAt(scene: Scene, worldX: number, worldZ: number): number {
    const ground = scene.getMeshByName('lw-terrain-ground') as Mesh | null;
    if (!ground) return 0;
    const positions = ground.getVerticesData('position');
    if (!positions) return 0;
    let bestY = 0;
    let bestDistSq = Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      const dx = positions[i] - worldX;
      const dz = positions[i + 2] - worldZ;
      const dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestY = positions[i + 1];
      }
    }
    return bestY;
  }

  static applyFloorBumpTexture(
    scene: Scene,
    albedoUrl: string,
    normalUrl: string,
    tilingScale = 10,
  ): void {
    this.activeAlbedoUrl = albedoUrl;
    this.activeNormalUrl = normalUrl;
    this.floorTilingScale = tilingScale;
    const ground = scene.getMeshByName('lw-terrain-ground') as Mesh | null;
    if (ground) {
      this.applyMaterialAndBump(scene, ground, '');
    }
  }

  private static applyMaterialAndBump(scene: Scene, ground: Mesh, biome: string): void {
    const existingMat = scene.getMaterialByName('lw-terrain-mat') as StandardMaterial | null;
    if (existingMat) {
      existingMat.dispose();
    }
    const mat = new StandardMaterial('lw-terrain-mat', scene);
    mat.diffuseColor = Color3.FromHexString('#9aaea1');
    mat.specularColor = Color3.FromHexString('#1e2923');
    mat.roughness = 0.85;

    try {
      const uScale = this.floorTilingScale;
      const vScale = Math.round(this.floorTilingScale * 0.8);
      if (this.activeAlbedoUrl) {
        const diffTex = new Texture(this.activeAlbedoUrl, scene);
        diffTex.uScale = uScale;
        diffTex.vScale = vScale;
        mat.diffuseTexture = diffTex;
      }
      if (this.activeNormalUrl) {
        const bumpTex = new Texture(this.activeNormalUrl, scene);
        bumpTex.uScale = uScale;
        bumpTex.vScale = vScale;
        bumpTex.level = 1.35;
        mat.bumpTexture = bumpTex;
      }
    } catch {
      if (biome.toLowerCase().includes('forest')) {
        mat.diffuseColor = Color3.FromHexString('#183326');
      }
    }

    ground.material = mat;
    ground.receiveShadows = true;
  }

  static sculptElevationAt(
    scene: Scene,
    worldX: number,
    worldZ: number,
    radius: number,
    deltaY: number,
    mode: 'raise' | 'lower' | 'flatten',
  ): void {
    const ground = scene.getMeshByName('lw-terrain-ground') as Mesh | null;
    if (!ground) return;
    const positions = ground.getVerticesData('position');
    if (!positions) return;

    if (!this.customElevations || this.customElevations.length !== positions.length / 3) {
      this.customElevations = new Float32Array(positions.length / 3);
    }

    const r = Math.max(1.2, radius);
    const signedDelta = mode === 'lower' ? -Math.abs(deltaY) : Math.abs(deltaY);

    for (let i = 0; i < positions.length; i += 3) {
      const vx = positions[i];
      const vz = positions[i + 2];
      const dist = Math.hypot(vx - worldX, vz - worldZ);
      if (dist <= r) {
        const falloff = 0.5 * (1 + Math.cos((Math.PI * dist) / r));
        const vIdx = i / 3;
        if (mode === 'flatten') {
          positions[i + 1] = positions[i + 1] * (1 - falloff * 0.65);
          this.customElevations[vIdx] = positions[i + 1];
        } else {
          const step = signedDelta * falloff * 0.45;
          positions[i + 1] = Math.max(-4.5, Math.min(8.5, positions[i + 1] + step));
          this.customElevations[vIdx] += step;
        }
      }
    }

    ground.updateVerticesData('position', positions);
    this.recomputeNormals(ground, positions);
  }

  private static recomputeNormals(ground: Mesh, positions: number[] | Float32Array): void {
    const indices = ground.getIndices();
    if (!indices) return;
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    ground.updateVerticesData('normal', normals);
  }
}
