import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';

export class DungeonEnvironmentBuilder {
  buildDungeonStage(scene: Scene): TransformNode {
    const root = new TransformNode('lw-fx-dungeon-root', scene);

    const floorMat = new StandardMaterial('lw-fx-floor-mat', scene);
    floorMat.diffuseTexture = this.createStoneTileTexture(scene);
    floorMat.specularColor = Color3.FromHexString('#2b2418');
    floorMat.emissiveColor = Color3.FromHexString('#0d0b08');

    const ground = MeshBuilder.CreateGround(
      'lw-fx-ground',
      { width: 22, height: 22, subdivisions: 24 },
      scene,
    );
    ground.material = floorMat;
    ground.parent = root;

    this.buildGridOverlay(scene, root);
    this.buildDungeonWallsAndTorches(scene, root);
    this.buildCombatMinis(scene, root);

    return root;
  }

  private buildGridOverlay(scene: Scene, root: TransformNode): void {
    const lines: Vector3[][] = [];
    for (let i = -10; i <= 10; i += 2) {
      lines.push([new Vector3(i, 0.02, -10), new Vector3(i, 0.02, 10)]);
      lines.push([new Vector3(-10, 0.02, i), new Vector3(10, 0.02, i)]);
    }
    const grid = MeshBuilder.CreateLineSystem('lw-fx-grid-lines', { lines }, scene);
    grid.color = Color3.FromHexString('#362d1e');
    grid.alpha = 0.45;
    grid.parent = root;
  }

  private buildDungeonWallsAndTorches(scene: Scene, root: TransformNode): void {
    const wallMat = new StandardMaterial('lw-fx-wall-mat', scene);
    wallMat.diffuseColor = Color3.FromHexString('#27231e');
    wallMat.specularColor = Color3.FromHexString('#14110d');

    const northWall = MeshBuilder.CreateBox(
      'lw-fx-wall-north',
      { width: 22, height: 6.5, depth: 1.4 },
      scene,
    );
    northWall.position.set(0, 3.25, 10.5);
    northWall.material = wallMat;
    northWall.parent = root;

    const westWall = MeshBuilder.CreateBox(
      'lw-fx-wall-west',
      { width: 1.4, height: 6.5, depth: 22 },
      scene,
    );
    westWall.position.set(-10.5, 3.25, 0);
    westWall.material = wallMat;
    westWall.parent = root;

    for (let i = -8; i <= 8; i += 4) {
      const pillarN = MeshBuilder.CreateBox(
        `lw-fx-pillar-n-${i}`,
        { width: 1.2, height: 6.8, depth: 1.8 },
        scene,
      );
      pillarN.position.set(i, 3.4, 9.8);
      pillarN.material = wallMat;
      pillarN.parent = root;

      const pillarW = MeshBuilder.CreateBox(
        `lw-fx-pillar-w-${i}`,
        { width: 1.8, height: 6.8, depth: 1.2 },
        scene,
      );
      pillarW.position.set(-9.8, 3.4, i);
      pillarW.material = wallMat;
      pillarW.parent = root;
    }

    const torchCoords: [number, number, number][] = [
      [-6, 3.8, 9.1],
      [4, 3.8, 9.1],
      [-9.1, 3.8, -3],
    ];
    torchCoords.forEach(([x, y, z], idx) => {
      const sconce = MeshBuilder.CreateCylinder(
        `lw-fx-sconce-${idx}`,
        { height: 0.7, diameterTop: 0.28, diameterBottom: 0.12 },
        scene,
      );
      sconce.position.set(x, y, z);
      sconce.parent = root;

      const flame = MeshBuilder.CreateSphere(
        `lw-fx-torch-flame-${idx}`,
        { diameter: 0.36, segments: 10 },
        scene,
      );
      flame.position.set(x, y + 0.45, z);
      const fMat = new StandardMaterial(`lw-fx-torch-mat-${idx}`, scene);
      fMat.emissiveColor = Color3.FromHexString('#fb923c');
      fMat.diffuseColor = Color3.FromHexString('#fde047');
      flame.material = fMat;
      flame.parent = root;

      const pt = new PointLight(`lw-fx-torch-pt-${idx}`, new Vector3(x, y + 0.6, z), scene);
      pt.diffuse = Color3.FromHexString('#f59e0b');
      pt.intensity = 0.85;
      pt.range = 11;
    });
  }

  private buildCombatMinis(scene: Scene, root: TransformNode): void {
    this.createMageCasterMini(scene, root, new Vector3(-5.2, 0, -1.2));
    this.createSkeletonMini(scene, root, 'skel-north', new Vector3(4.2, 0, 3.6));
    this.createSkeletonMini(scene, root, 'skel-east', new Vector3(6.0, 0, -0.4));
    this.createSkeletonMini(scene, root, 'skel-south', new Vector3(3.6, 0, -4.6));
  }

  private createMageCasterMini(scene: Scene, root: TransformNode, pos: Vector3): Mesh {
    const base = this.createTokenBase(scene, root, 'mage-base', pos, '#ef4444');
    const robeMat = new StandardMaterial('lw-fx-mage-robe', scene);
    robeMat.diffuseColor = Color3.FromHexString('#1e3a8a');
    robeMat.specularColor = Color3.FromHexString('#60a5fa');

    const body = MeshBuilder.CreateCylinder(
      'lw-fx-mage-body',
      { height: 2.1, diameterTop: 0.45, diameterBottom: 1.15, tessellation: 18 },
      scene,
    );
    body.position.set(pos.x, 1.15, pos.z);
    body.material = robeMat;
    body.parent = root;

    const hood = MeshBuilder.CreateSphere('lw-fx-mage-hood', { diameter: 0.62 }, scene);
    hood.position.set(pos.x, 2.35, pos.z);
    hood.material = robeMat;
    hood.parent = root;

    const staff = MeshBuilder.CreateCylinder(
      'lw-fx-mage-staff',
      { height: 2.8, diameter: 0.09 },
      scene,
    );
    staff.position.set(pos.x + 0.65, 1.45, pos.z + 0.35);
    staff.rotation.z = -0.18;
    staff.parent = root;

    const orb = MeshBuilder.CreateSphere('lw-fx-mage-orb', { diameter: 0.28 }, scene);
    orb.position.set(pos.x + 0.88, 2.82, pos.z + 0.35);
    const orbMat = new StandardMaterial('lw-fx-mage-orb-mat', scene);
    orbMat.emissiveColor = Color3.FromHexString('#fde047');
    orb.material = orbMat;
    orb.parent = root;

    return base;
  }

  private createSkeletonMini(
    scene: Scene,
    root: TransformNode,
    id: string,
    pos: Vector3,
  ): Mesh {
    const base = this.createTokenBase(scene, root, `${id}-base`, pos, '#ef4444');
    const boneMat = new StandardMaterial(`lw-fx-bone-${id}`, scene);
    boneMat.diffuseColor = Color3.FromHexString('#d6d3d1');
    boneMat.specularColor = Color3.FromHexString('#78716c');

    const torso = MeshBuilder.CreateCylinder(
      `lw-fx-${id}-torso`,
      { height: 1.65, diameterTop: 0.55, diameterBottom: 0.42, tessellation: 12 },
      scene,
    );
    torso.position.set(pos.x, 0.95, pos.z);
    torso.material = boneMat;
    torso.parent = root;

    const skull = MeshBuilder.CreateSphere(`lw-fx-${id}-skull`, { diameter: 0.48 }, scene);
    skull.position.set(pos.x, 1.98, pos.z);
    skull.material = boneMat;
    skull.parent = root;

    const blade = MeshBuilder.CreateBox(
      `lw-fx-${id}-blade`,
      { width: 0.08, height: 1.35, depth: 0.22 },
      scene,
    );
    blade.position.set(pos.x - 0.45, 1.35, pos.z - 0.2);
    blade.rotation.x = 0.45;
    blade.material = boneMat;
    blade.parent = root;

    return base;
  }

  private createTokenBase(
    scene: Scene,
    root: TransformNode,
    id: string,
    pos: Vector3,
    ringHex: string,
  ): Mesh {
    const plinth = MeshBuilder.CreateCylinder(
      `lw-fx-plinth-${id}`,
      { height: 0.16, diameter: 1.75, tessellation: 28 },
      scene,
    );
    plinth.position.set(pos.x, 0.08, pos.z);
    const pMat = new StandardMaterial(`lw-fx-pmat-${id}`, scene);
    pMat.diffuseColor = Color3.FromHexString('#1c1917');
    plinth.material = pMat;
    plinth.parent = root;

    const ring = MeshBuilder.CreateTorus(
      `lw-fx-ring-${id}`,
      { diameter: 1.88, thickness: 0.07, tessellation: 32 },
      scene,
    );
    ring.position.set(pos.x, 0.09, pos.z);
    const rMat = new StandardMaterial(`lw-fx-rmat-${id}`, scene);
    rMat.emissiveColor = Color3.FromHexString(ringHex);
    ring.material = rMat;
    ring.parent = root;

    return plinth;
  }

  private createStoneTileTexture(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('lw-fx-stone-tex', { width: 512, height: 512 }, scene, false);
    const ctx = tex.getContext();
    ctx.fillStyle = '#1b1713';
    ctx.fillRect(0, 0, 512, 512);

    const tile = 64;
    for (let y = 0; y < 512; y += tile) {
      for (let x = 0; x < 512; x += tile) {
        const shade = 22 + ((x * 7 + y * 13) % 14);
        ctx.fillStyle = `rgb(${shade + 5}, ${shade + 2}, ${shade - 2})`;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        ctx.strokeStyle = 'rgba(10, 8, 6, 0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, y + 1, tile - 2, tile - 2);
      }
    }
    tex.update();
    return tex;
  }
}
