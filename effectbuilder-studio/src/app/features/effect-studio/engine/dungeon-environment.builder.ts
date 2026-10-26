import {
  Color3,
  Color4,
  DynamicTexture,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import { getParticleAtlasTextures } from './effect-glsl-shaders.registry';
import {
  StudioTokenMiniatureInstance,
  TokenMiniatureBuilder,
} from './token-miniature.builder';

export interface DungeonEnvironmentNodes {
  readonly root: TransformNode;
  readonly hemiLight: HemisphericLight;
  readonly floorMesh: Mesh;
  readonly floorMaterial: StandardMaterial;
  readonly gridOverlayMesh: Mesh;
  readonly wallMeshes: readonly Mesh[];
  readonly torchLights: readonly PointLight[];
  readonly shadowGenerators: readonly ShadowGenerator[];
  readonly casterToken: StudioTokenMiniatureInstance;
  readonly targetTokens: readonly StudioTokenMiniatureInstance[];
}

const BOARD_CELLS = 14;
const CELL_SIZE = 1.0;
const HALF_BOARD = (BOARD_CELLS * CELL_SIZE) / 2;

/**
 * Refactored from `C:\repos\Jane\Jane\MythWeaver\Vtt3d.client\src\app\engine\dungeon-builder.ts`.
 * Builds the 3D beveled stone dungeon chamber, normal-mapped pavers, masonry walls,
 * flickering torch braziers with ParticleSystem fire & ShadowGenerators, cutaway foreground
 * parapet wall, and the sculpted Wizard & Skeleton Warrior miniatures matching Image 2.
 */
export class DungeonEnvironmentBuilder {
  private readonly tokenBuilder = new TokenMiniatureBuilder();

  build(scene: Scene): DungeonEnvironmentNodes {
    const root = new TransformNode('dungeon-env-root', scene);
    const atlas = getParticleAtlasTextures(scene);

    // 1. Ambient & Warm Dungeon Rim Lighting (tuned to match Image 2's warm stone contrast)
    const hemi = new HemisphericLight(
      'dungeon-hemi',
      new Vector3(0.25, 1.0, -0.3),
      scene,
    );
    hemi.intensity = 0.44;
    hemi.diffuse = new Color3(0.68, 0.56, 0.44);
    hemi.groundColor = new Color3(0.16, 0.12, 0.09);

    // 2. Normal-Mapped & Painted 2048x2048 Dungeon Stone Floor + Merged 3D Beveled Cobblestones
    const floorTex = this.createPaintedStoneFloorTexture(scene);
    const bumpTex = new Texture('/lighting/dungeon_pavers_normal.png', scene);
    bumpTex.uScale = 4.5;
    bumpTex.vScale = 4.5;
    bumpTex.level = 1.25;

    const floorMat = new StandardMaterial('dungeon-stone-mat', scene);
    floorMat.diffuseTexture = floorTex;
    floorMat.bumpTexture = bumpTex;
    floorMat.specularColor = new Color3(0.45, 0.34, 0.22);
    floorMat.specularPower = 32;
    floorMat.maxSimultaneousLights = 10;

    const floorMesh = MeshBuilder.CreateGround(
      'dungeon-floor-base',
      { width: BOARD_CELLS, height: BOARD_CELLS, subdivisions: 16 },
      scene,
    );
    floorMesh.position.y = -0.02;
    floorMesh.material = floorMat;
    floorMesh.receiveShadows = true;
    floorMesh.isPickable = false;
    floorMesh.parent = root;

    // Merged 3D Beveled Stone Pavers (exact technique from `dungeon-builder.ts` lines 222-264)
    const cobbleChunks: Mesh[] = [];
    for (let gx = 0; gx < BOARD_CELLS; gx++) {
      for (let gz = 0; gz < BOARD_CELLS; gz++) {
        const hash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453) % 1;
        const tileH = 0.12 + (hash - 0.5) * 0.032;
        const tile = MeshBuilder.CreateBox(
          `cobble-${gx}-${gz}`,
          { width: 0.94, height: tileH, depth: 0.94 },
          scene,
        );
        const wx = -HALF_BOARD + gx * CELL_SIZE + 0.5;
        const wz = -HALF_BOARD + gz * CELL_SIZE + 0.5;
        tile.position.set(wx, tileH / 2 - 0.05, wz);

        const u0 = gx / BOARD_CELLS;
        const v0 = gz / BOARD_CELLS;
        const u1 = (gx + 1) / BOARD_CELLS;
        const v1 = (gz + 1) / BOARD_CELLS;
        const uvs = tile.getVerticesData('uv');
        if (uvs) {
          for (let i = 0; i < uvs.length; i += 2) {
            uvs[i] = u0 + uvs[i] * (u1 - u0);
            uvs[i + 1] = v0 + uvs[i + 1] * (v1 - v0);
          }
          tile.setVerticesData('uv', uvs);
        }
        cobbleChunks.push(tile);
      }
    }

    const mergedCobble = Mesh.MergeMeshes(cobbleChunks, true, true, undefined, false, false);
    if (mergedCobble) {
      mergedCobble.name = 'merged-3d-beveled-cobblestones';
      mergedCobble.material = floorMat;
      mergedCobble.receiveShadows = true;
      mergedCobble.isPickable = false;
      mergedCobble.parent = root;
    }

    // 3. Tactical Grid Overlay Plane (toggled by Viewport Grid Gizmo)
    const gridOverlayMesh = MeshBuilder.CreateGround(
      'dungeon-grid-overlay',
      { width: BOARD_CELLS, height: BOARD_CELLS, subdivisions: 2 },
      scene,
    );
    gridOverlayMesh.position.y = 0.022;
    gridOverlayMesh.parent = root;
    const gridMat = new StandardMaterial('dungeon-grid-mat', scene);
    const gridTex = this.createGridOverlayTexture(scene);
    gridMat.diffuseTexture = gridTex;
    gridMat.opacityTexture = gridTex;
    gridMat.emissiveColor = new Color3(0.86, 0.68, 0.36);
    gridMat.alpha = 0.42;
    gridOverlayMesh.material = gridMat;

    // 4. Masonry Back Walls, Buttress Columns & Foreground Cutaway Wall (matching Image 2)
    const wallMat = new StandardMaterial('dungeon-wall-mat', scene);
    wallMat.diffuseTexture = floorTex;
    wallMat.bumpTexture = bumpTex;
    wallMat.diffuseColor = new Color3(0.38, 0.31, 0.25);
    wallMat.specularColor = new Color3(0.24, 0.19, 0.14);
    wallMat.maxSimultaneousLights = 10;

    const capstoneMat = new StandardMaterial('dungeon-capstone-mat', scene);
    capstoneMat.diffuseColor = new Color3(0.22, 0.18, 0.15);
    capstoneMat.specularColor = new Color3(0.3, 0.25, 0.2);
    capstoneMat.maxSimultaneousLights = 10;

    // North-West & North-East Isometric Back Walls
    const wallMeshes: Mesh[] = [];
    const backWallLeft = MeshBuilder.CreateBox(
      'wall-back-left',
      { width: 0.9, height: 4.8, depth: BOARD_CELLS + 0.6 },
      scene,
    );
    backWallLeft.position.set(-HALF_BOARD - 0.35, 2.3, 0);
    backWallLeft.material = wallMat;
    backWallLeft.receiveShadows = true;
    backWallLeft.parent = root;
    wallMeshes.push(backWallLeft);

    const backWallRight = MeshBuilder.CreateBox(
      'wall-back-right',
      { width: BOARD_CELLS + 0.6, height: 4.8, depth: 0.9 },
      scene,
    );
    backWallRight.position.set(0, 2.3, HALF_BOARD + 0.35);
    backWallRight.material = wallMat;
    backWallRight.receiveShadows = true;
    backWallRight.parent = root;
    wallMeshes.push(backWallRight);

    // Heavy Stone Buttress Pillars along both back walls
    const pillarCoords: [number, number][] = [
      [-HALF_BOARD + 0.2, -4.5],
      [-HALF_BOARD + 0.2, -1.2],
      [-HALF_BOARD + 0.2, 2.4],
      [-HALF_BOARD + 0.2, 5.8],
      [-4.2, HALF_BOARD - 0.2],
      [-0.8, HALF_BOARD - 0.2],
      [2.8, HALF_BOARD - 0.2],
      [6.0, HALF_BOARD - 0.2],
    ];
    pillarCoords.forEach(([px, pz], idx) => {
      const col = MeshBuilder.CreateBox(
        `wall-buttress-${idx}`,
        { width: 1.05, height: 5.0, depth: 1.05 },
        scene,
      );
      col.position.set(px, 2.45, pz);
      col.material = capstoneMat;
      col.receiveShadows = true;
      col.parent = root;
      wallMeshes.push(col);
    });

    // Bottom-Left Foreground Cutaway Stone Parapet Wall (matches bottom-left corner of Image 2!)
    for (let b = 0; b < 7; b++) {
      const blockH = 0.72 + (b % 3) * 0.16;
      const block = MeshBuilder.CreateBox(
        `foreground-parapet-${b}`,
        { width: 1.15, height: blockH, depth: 0.68 },
        scene,
      );
      block.position.set(-HALF_BOARD + 0.8 + b * 0.95, blockH / 2, -HALF_BOARD + 0.45);
      block.material = wallMat;
      block.receiveShadows = true;
      block.parent = root;
      wallMeshes.push(block);
    }

    // 5. Flickering Wall Torches / Braziers with ParticleSystem Flames & ShadowGenerators
    const ironMat = new StandardMaterial('torch-iron-mat', scene);
    ironMat.diffuseColor = new Color3(0.14, 0.13, 0.12);
    ironMat.specularColor = new Color3(0.5, 0.45, 0.38);

    const torchSpecs: { pos: Vector3; castShadows: boolean; intensity: number }[] = [
      { pos: new Vector3(-HALF_BOARD + 0.65, 2.85, 0.6), castShadows: true, intensity: 1.85 },
      { pos: new Vector3(-2.4, 2.85, HALF_BOARD - 0.65), castShadows: true, intensity: 1.85 },
      { pos: new Vector3(4.5, 2.55, HALF_BOARD - 0.65), castShadows: false, intensity: 1.45 },
    ];

    const torchLights: PointLight[] = [];
    const shadowGenerators: ShadowGenerator[] = [];

    torchSpecs.forEach((spec, idx) => {
      const sconce = MeshBuilder.CreateCylinder(
        `torch-sconce-${idx}`,
        { diameterTop: 0.34, diameterBottom: 0.12, height: 0.68, tessellation: 10 },
        scene,
      );
      sconce.position.set(spec.pos.x, spec.pos.y - 0.32, spec.pos.z);
      sconce.material = ironMat;
      sconce.parent = root;
      wallMeshes.push(sconce);

      const firePs = new ParticleSystem(`torch-fire-ps-${idx}`, 90, scene);
      firePs.particleTexture = atlas.glowTex;
      firePs.emitter = new Vector3(spec.pos.x, spec.pos.y + 0.08, spec.pos.z);
      firePs.minEmitBox = new Vector3(-0.08, 0, -0.08);
      firePs.maxEmitBox = new Vector3(0.08, 0.08, 0.08);
      firePs.color1 = new Color4(1.0, 0.85, 0.32, 0.96);
      firePs.color2 = new Color4(1.0, 0.42, 0.08, 0.88);
      firePs.colorDead = new Color4(0.25, 0.06, 0.01, 0.0);
      firePs.minSize = 0.2;
      firePs.maxSize = 0.46;
      firePs.minLifeTime = 0.28;
      firePs.maxLifeTime = 0.62;
      firePs.emitRate = 58;
      firePs.blendMode = ParticleSystem.BLENDMODE_ONEONE;
      firePs.gravity = new Vector3(0, 2.4, 0);
      firePs.start();

      const tLight = new PointLight(
        `torch-light-${idx}`,
        new Vector3(spec.pos.x, spec.pos.y + 0.35, spec.pos.z),
        scene,
      );
      tLight.diffuse = new Color3(1.0, 0.64, 0.24);
      tLight.specular = new Color3(1.0, 0.82, 0.48);
      tLight.intensity = spec.intensity;
      tLight.range = 16;
      torchLights.push(tLight);

      if (spec.castShadows && shadowGenerators.length < 2) {
        const sg = new ShadowGenerator(1024, tLight);
        sg.useBlurExponentialShadowMap = true;
        sg.blurKernel = 16;
        sg.darkness = 0.32;
        shadowGenerators.push(sg);
      }
    });

    // 6. Sculpted Hooded Wizard Caster & 3 Skeleton Warrior Miniatures
    const { caster, targets } = this.tokenBuilder.buildStudioMiniatures(
      scene,
      root,
      shadowGenerators,
    );

    return {
      root,
      hemiLight: hemi,
      floorMesh,
      floorMaterial: floorMat,
      gridOverlayMesh,
      wallMeshes,
      torchLights,
      shadowGenerators,
      casterToken: caster,
      targetTokens: targets,
    };
  }

  triggerTargetRecoil(scene: Scene, target: StudioTokenMiniatureInstance): void {
    this.tokenBuilder.triggerHitRecoil(scene, target);
  }

  private createPaintedStoneFloorTexture(scene: Scene): DynamicTexture {
    const size = 1024;
    const tex = new DynamicTexture('dungeon-painted-stone-tex', size, scene, true);
    const ctx = tex.getContext();
    const step = size / BOARD_CELLS;

    ctx.fillStyle = '#1c1612';
    ctx.fillRect(0, 0, size, size);

    const subStep = step / 2;
    for (let gx = 0; gx < BOARD_CELLS * 2; gx++) {
      for (let gz = 0; gz < BOARD_CELLS * 2; gz++) {
        const hash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453) % 1;
        const distCenter = Math.hypot(gx - BOARD_CELLS, gz - BOARD_CELLS) / BOARD_CELLS;
        const warmBoost = Math.max(0, 1 - distCenter * 0.85) * 18;
        const base = 36 + Math.floor(hash * 20);
        const r = Math.min(255, Math.floor(base + 14 + warmBoost));
        const g = Math.min(255, Math.floor(base + 6 + warmBoost * 0.65));
        const b = Math.min(255, Math.floor(base - 2));

        const x = gx * subStep;
        const y = gz * subStep;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 2, y + 2, subStep - 4, subStep - 4);

        ctx.strokeStyle = 'rgba(255, 224, 170, 0.09)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x + 2.5, y + 2.5, subStep - 5, subStep - 5);
      }
    }

    tex.update();
    return tex;
  }

  private createGridOverlayTexture(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('dungeon-grid-tex', 512, scene, true);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = 'rgba(217, 183, 122, 0.35)';
    ctx.lineWidth = 2;
    const step = 512 / 8;
    for (let i = 0; i <= 8; i++) {
      const p = i * step;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(512, p);
      ctx.stroke();
    }
    tex.update();
    return tex;
  }
}
