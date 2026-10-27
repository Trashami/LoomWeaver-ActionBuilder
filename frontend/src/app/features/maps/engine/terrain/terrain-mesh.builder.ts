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
        const amp = (Math.max(10, Math.min(100, reliefScale)) / 100) * 0.55;
        for (let i = 0; i < positions.length; i += 3) {
          const x = positions[i];
          const z = positions[i + 2];
          const distFromCenter = Math.sqrt(x * x + z * z);
          const edgeFactor = Math.min(1, Math.max(0, (distFromCenter - 7) / 12));
          positions[i + 1] =
            Math.sin(x * 0.35) * Math.cos(z * 0.35) * amp * edgeFactor;
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
        lines.push([new Vector3(x, 0.05, -14), new Vector3(x, 0.05, 14)]);
      }
      for (let z = -14; z <= 14; z += 1.5) {
        lines.push([new Vector3(-18, 0.05, z), new Vector3(18, 0.05, z)]);
      }
      const grid = MeshBuilder.CreateLineSystem('lw-terrain-grid', { lines }, scene);
      grid.color = Color3.FromHexString('#2b4a3c');
      grid.isPickable = false;
    }

    return ground;
  }

  static applyFloorBumpTexture(
    scene: Scene,
    albedoUrl: string,
    normalUrl: string,
  ): void {
    this.activeAlbedoUrl = albedoUrl;
    this.activeNormalUrl = normalUrl;
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
    mat.diffuseColor = Color3.FromHexString('#8ea396');
    mat.specularColor = Color3.FromHexString('#222e27');
    mat.roughness = 0.85;

    try {
      if (this.activeAlbedoUrl) {
        const diffTex = new Texture(this.activeAlbedoUrl, scene);
        diffTex.uScale = 10;
        diffTex.vScale = 8;
        mat.diffuseTexture = diffTex;
      }
      if (this.activeNormalUrl) {
        const bumpTex = new Texture(this.activeNormalUrl, scene);
        bumpTex.uScale = 10;
        bumpTex.vScale = 8;
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
