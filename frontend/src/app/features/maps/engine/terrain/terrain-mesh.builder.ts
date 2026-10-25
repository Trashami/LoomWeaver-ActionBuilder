import {
  Color3,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  VertexData,
} from '@babylonjs/core';

export class TerrainMeshBuilder {
  static buildTerrainAndGrid(
    scene: Scene,
    biome: string,
    reliefScale: number,
  ): Mesh {
    const existing = scene.getMeshByName('lw-terrain-ground');
    if (existing) {
      existing.dispose();
    }
    const existingGrid = scene.getMeshByName('lw-terrain-grid');
    if (existingGrid) {
      existingGrid.dispose();
    }

    const ground = MeshBuilder.CreateGround(
      'lw-terrain-ground',
      { width: 36, height: 28, subdivisions: 32, updatable: true },
      scene,
    );

    const positions = ground.getVerticesData('position');
    if (positions) {
      const amp = (Math.max(10, Math.min(100, reliefScale)) / 100) * 0.85;
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const distFromCenter = Math.sqrt(x * x + z * z);
        const edgeFactor = Math.min(1, Math.max(0, (distFromCenter - 6) / 12));
        positions[i + 1] =
          Math.sin(x * 0.35) * Math.cos(z * 0.35) * amp * edgeFactor;
      }
      ground.updateVerticesData('position', positions);
      const normals: number[] = [];
      const indices = ground.getIndices();
      if (indices) {
        VertexData.ComputeNormals(positions, indices, normals);
        ground.updateVerticesData('normal', normals);
      }
    }

    const mat = new StandardMaterial('lw-terrain-mat', scene);
    if (biome.toLowerCase().includes('forest') || biome.toLowerCase().includes('mountain')) {
      mat.diffuseColor = Color3.FromHexString('#142820');
      mat.specularColor = Color3.FromHexString('#1f3d31');
    } else if (biome.toLowerCase().includes('sky') || biome.toLowerCase().includes('dock')) {
      mat.diffuseColor = Color3.FromHexString('#162230');
      mat.specularColor = Color3.FromHexString('#283e54');
    } else {
      mat.diffuseColor = Color3.FromHexString('#131924');
      mat.specularColor = Color3.FromHexString('#2c2418');
    }
    ground.material = mat;
    ground.isPickable = true;

    const lines: Vector3[][] = [];
    for (let x = -18; x <= 18; x += 2) {
      lines.push([new Vector3(x, 0.04, -14), new Vector3(x, 0.04, 14)]);
    }
    for (let z = -14; z <= 14; z += 2) {
      lines.push([new Vector3(-18, 0.04, z), new Vector3(18, 0.04, z)]);
    }
    const grid = MeshBuilder.CreateLineSystem('lw-terrain-grid', { lines }, scene);
    grid.color = Color3.FromHexString('#2b4238');
    grid.isPickable = false;

    return ground;
  }
}
