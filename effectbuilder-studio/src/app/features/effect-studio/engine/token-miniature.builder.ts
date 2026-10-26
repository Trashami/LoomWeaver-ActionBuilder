import {
  Color3,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';

export interface StudioTokenMiniatureInstance {
  readonly id: string;
  readonly name: string;
  readonly role: 'caster' | 'target';
  readonly root: TransformNode;
  readonly figureNode: TransformNode;
  readonly selectionRing: Mesh;
  readonly allMeshes: Mesh[];
  readonly staffLight?: PointLight;
}

/**
 * Refactored from `C:\repos\Jane\Jane\MythWeaver\Vtt3d.client\src\app\engine\token-builder.ts`
 * (`create3DTokenMiniature` & `triggerTokenHitRecoil`).
 * Builds the sculpted Hooded Wizard Caster miniature and 3 Skeleton Warrior miniatures on
 * double-rimmed tabletop pedestals with glowing crimson-orange faction rings.
 */
export class TokenMiniatureBuilder {
  buildStudioMiniatures(
    scene: Scene,
    parent: TransformNode,
    shadowGenerators: ShadowGenerator[],
  ): {
    caster: StudioTokenMiniatureInstance;
    targets: StudioTokenMiniatureInstance[];
  } {
    const caster = this.createWizardCasterMiniature(
      scene,
      parent,
      new Vector3(-3.35, 0, -0.55),
      shadowGenerators,
    );

    const skeletonPositions: { id: string; name: string; pos: Vector3; yaw: number }[] = [
      {
        id: 'tok-skeleton-north',
        name: 'Skeleton Vanguard I',
        pos: new Vector3(2.55, 0, 2.35),
        yaw: -Math.PI * 0.68,
      },
      {
        id: 'tok-skeleton-mid',
        name: 'Skeleton Vanguard II',
        pos: new Vector3(3.65, 0, 0.15),
        yaw: -Math.PI * 0.52,
      },
      {
        id: 'tok-skeleton-south',
        name: 'Skeleton Vanguard III',
        pos: new Vector3(2.35, 0, -2.45),
        yaw: -Math.PI * 0.34,
      },
    ];

    const targets = skeletonPositions.map((cfg) =>
      this.createSkeletonWarriorMiniature(
        scene,
        parent,
        cfg.id,
        cfg.name,
        cfg.pos,
        cfg.yaw,
        shadowGenerators,
      ),
    );

    return { caster, targets };
  }

  triggerHitRecoil(scene: Scene, target: StudioTokenMiniatureInstance): void {
    const start = performance.now();
    const dur = 320;
    const obs = scene.onBeforeRenderObservable.add(() => {
      const p = Math.min(1, (performance.now() - start) / dur);
      target.figureNode.rotation.x = Math.sin(p * Math.PI * 2.5) * 0.28 * (1 - p);
      target.figureNode.rotation.z = Math.cos(p * Math.PI * 2) * 0.14 * (1 - p);
      if (p >= 1) {
        target.figureNode.rotation.x = 0;
        target.figureNode.rotation.z = 0;
        scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  private createDoubleRimmedPedestal(
    scene: Scene,
    id: string,
    root: TransformNode,
    figureNode: TransformNode,
    ringHex: string,
    allMeshes: Mesh[],
  ): Mesh {
    const baseRadius = 0.56;
    const baseMat = new StandardMaterial(`plinth-mat-${id}`, scene);
    baseMat.diffuseColor = new Color3(0.1, 0.12, 0.15);
    baseMat.specularColor = new Color3(0.38, 0.4, 0.45);
    baseMat.specularPower = 48;
    baseMat.maxSimultaneousLights = 8;

    const lowerPlinth = MeshBuilder.CreateCylinder(
      `token-plinth-lower-${id}`,
      {
        diameterTop: baseRadius * 2.02,
        diameterBottom: baseRadius * 2.14,
        height: 0.1,
        tessellation: 36,
      },
      scene,
    );
    lowerPlinth.position.y = 0.05;
    lowerPlinth.material = baseMat;
    lowerPlinth.isPickable = false;
    lowerPlinth.parent = figureNode;
    allMeshes.push(lowerPlinth);

    const upperPlinth = MeshBuilder.CreateCylinder(
      `token-plinth-upper-${id}`,
      {
        diameterTop: baseRadius * 1.78,
        diameterBottom: baseRadius * 1.92,
        height: 0.1,
        tessellation: 36,
      },
      scene,
    );
    upperPlinth.position.y = 0.14;
    upperPlinth.material = baseMat;
    upperPlinth.isPickable = false;
    upperPlinth.parent = figureNode;
    allMeshes.push(upperPlinth);

    const glowCol = Color3.FromHexString(ringHex);
    const ringMat = new StandardMaterial(`ring-mat-${id}`, scene);
    ringMat.emissiveColor = glowCol;
    ringMat.diffuseColor = glowCol;

    const pedestalRimRing = MeshBuilder.CreateTorus(
      `token-pedestal-rim-${id}`,
      { diameter: baseRadius * 1.98, thickness: 0.042, tessellation: 40 },
      scene,
    );
    pedestalRimRing.position.y = 0.09;
    pedestalRimRing.material = ringMat;
    pedestalRimRing.isPickable = false;
    pedestalRimRing.parent = figureNode;
    allMeshes.push(pedestalRimRing);

    const selectionRing = MeshBuilder.CreateTorus(
      `token-sel-ring-${id}`,
      { diameter: baseRadius * 2.24, thickness: 0.055, tessellation: 44 },
      scene,
    );
    selectionRing.position.y = 0.035;
    selectionRing.material = ringMat;
    selectionRing.isPickable = false;
    selectionRing.parent = root;

    return selectionRing;
  }

  private createWizardCasterMiniature(
    scene: Scene,
    parent: TransformNode,
    pos: Vector3,
    shadowGenerators: ShadowGenerator[],
  ): StudioTokenMiniatureInstance {
    const id = 'tok-mage-caster';
    const root = new TransformNode(`token-root-${id}`, scene);
    root.position.copyFrom(pos);
    root.parent = parent;

    const figureNode = new TransformNode(`token-figure-${id}`, scene);
    figureNode.rotation.y = Math.PI * 0.42;
    figureNode.parent = root;

    const allMeshes: Mesh[] = [];
    const selectionRing = this.createDoubleRimmedPedestal(
      scene,
      id,
      root,
      figureNode,
      '#ef4444',
      allMeshes,
    );

    const robeMat = new StandardMaterial('mage-robe-mat', scene);
    robeMat.diffuseColor = new Color3(0.14, 0.2, 0.32);
    robeMat.specularColor = new Color3(0.28, 0.35, 0.48);
    robeMat.specularPower = 36;
    robeMat.maxSimultaneousLights = 8;

    const cloakMat = new StandardMaterial('mage-cloak-mat', scene);
    cloakMat.diffuseColor = new Color3(0.1, 0.14, 0.24);
    cloakMat.specularColor = new Color3(0.22, 0.28, 0.38);
    cloakMat.maxSimultaneousLights = 8;

    const goldTrimMat = new StandardMaterial('mage-gold-trim-mat', scene);
    goldTrimMat.diffuseColor = new Color3(0.76, 0.56, 0.24);
    goldTrimMat.emissiveColor = new Color3(0.18, 0.11, 0.03);
    goldTrimMat.specularColor = new Color3(0.95, 0.82, 0.45);
    goldTrimMat.maxSimultaneousLights = 8;

    // Lower flowing robe skirt + pleated folds
    const lowerRobe = MeshBuilder.CreateCylinder(
      'mage-lower-robe',
      { diameterTop: 0.48, diameterBottom: 0.88, height: 0.85, tessellation: 18 },
      scene,
    );
    lowerRobe.position.y = 0.58;
    lowerRobe.material = robeMat;
    lowerRobe.isPickable = false;
    lowerRobe.parent = figureNode;
    allMeshes.push(lowerRobe);

    // Sweeping back cloak
    const backCloak = MeshBuilder.CreateCylinder(
      'mage-back-cloak',
      { diameterTop: 0.44, diameterBottom: 0.94, height: 1.15, tessellation: 14 },
      scene,
    );
    backCloak.position.set(0, 0.72, -0.09);
    backCloak.rotation.x = 0.14;
    backCloak.material = cloakMat;
    backCloak.isPickable = false;
    backCloak.parent = figureNode;
    allMeshes.push(backCloak);

    // Upper torso
    const torso = MeshBuilder.CreateCylinder(
      'mage-torso',
      { diameterTop: 0.46, diameterBottom: 0.42, height: 0.62, tessellation: 16 },
      scene,
    );
    torso.position.y = 1.18;
    torso.material = robeMat;
    torso.isPickable = false;
    torso.parent = figureNode;
    allMeshes.push(torso);

    // Ornate shoulder pauldrons & collar
    [-0.26, 0.26].forEach((sx, idx) => {
      const pauldron = MeshBuilder.CreateSphere(
        `mage-pauldron-${idx}`,
        { diameter: 0.25, segments: 12 },
        scene,
      );
      pauldron.position.set(sx, 1.42, 0.02);
      pauldron.scaling.set(1.1, 0.75, 1.0);
      pauldron.material = goldTrimMat;
      pauldron.isPickable = false;
      pauldron.parent = figureNode;
      allMeshes.push(pauldron);
    });

    // Hooded head + peaked arcane cowl
    const headShadow = MeshBuilder.CreateSphere(
      'mage-head-shadow',
      { diameter: 0.28, segments: 12 },
      scene,
    );
    headShadow.position.set(0, 1.66, 0.04);
    const darkVisageMat = new StandardMaterial('mage-visage-mat', scene);
    darkVisageMat.diffuseColor = new Color3(0.05, 0.06, 0.09);
    headShadow.material = darkVisageMat;
    headShadow.isPickable = false;
    headShadow.parent = figureNode;
    allMeshes.push(headShadow);

    const hoodCowl = MeshBuilder.CreateCylinder(
      'mage-hood-cowl',
      { diameterTop: 0.06, diameterBottom: 0.4, height: 0.48, tessellation: 14 },
      scene,
    );
    hoodCowl.position.set(0, 1.78, -0.02);
    hoodCowl.rotation.x = -0.18;
    hoodCowl.material = cloakMat;
    hoodCowl.isPickable = false;
    hoodCowl.parent = figureNode;
    allMeshes.push(hoodCowl);

    // Outstretched left casting arm & wide wizard sleeve
    const leftArm = MeshBuilder.CreateCylinder(
      'mage-left-arm',
      { diameterTop: 0.14, diameterBottom: 0.24, height: 0.58, tessellation: 12 },
      scene,
    );
    leftArm.position.set(-0.36, 1.28, 0.22);
    leftArm.rotation.x = Math.PI / 3;
    leftArm.rotation.z = 0.35;
    leftArm.material = robeMat;
    leftArm.isPickable = false;
    leftArm.parent = figureNode;
    allMeshes.push(leftArm);

    // Right arm holding the tall ornate staff
    const rightArm = MeshBuilder.CreateCylinder(
      'mage-right-arm',
      { diameterTop: 0.14, diameterBottom: 0.22, height: 0.54, tessellation: 12 },
      scene,
    );
    rightArm.position.set(0.34, 1.26, 0.18);
    rightArm.rotation.x = Math.PI / 3.4;
    rightArm.rotation.z = -0.25;
    rightArm.material = robeMat;
    rightArm.isPickable = false;
    rightArm.parent = figureNode;
    allMeshes.push(rightArm);

    const staffShaft = MeshBuilder.CreateCylinder(
      'mage-staff-shaft',
      { diameterTop: 0.065, diameterBottom: 0.048, height: 2.25, tessellation: 12 },
      scene,
    );
    staffShaft.position.set(0.46, 1.18, 0.36);
    staffShaft.rotation.x = 0.12;
    staffShaft.rotation.z = -0.08;
    staffShaft.material = goldTrimMat;
    staffShaft.isPickable = false;
    staffShaft.parent = figureNode;
    allMeshes.push(staffShaft);

    // Finial cradle & glowing golden diamond crystal at top of staff
    const orbMat = new StandardMaterial('mage-staff-orb-mat', scene);
    orbMat.emissiveColor = new Color3(1.0, 0.82, 0.32);
    orbMat.diffuseColor = new Color3(1.0, 0.94, 0.65);

    const staffCrystal = MeshBuilder.CreatePolyhedron(
      'mage-staff-crystal',
      { type: 1, size: 0.15 },
      scene,
    );
    staffCrystal.position.set(0.55, 2.34, 0.49);
    staffCrystal.scaling.set(0.85, 1.35, 0.85);
    staffCrystal.material = orbMat;
    staffCrystal.isPickable = false;
    staffCrystal.parent = figureNode;
    allMeshes.push(staffCrystal);

    const staffLight = new PointLight(
      'mage-staff-point-light',
      new Vector3(pos.x + 0.45, 2.38, pos.z + 0.35),
      scene,
    );
    staffLight.diffuse = new Color3(1.0, 0.78, 0.28);
    staffLight.intensity = 0.85;
    staffLight.range = 6.5;

    shadowGenerators.forEach((sg) => {
      allMeshes.forEach((m) => sg.addShadowCaster(m));
    });

    return {
      id,
      name: 'Archmage Caster',
      role: 'caster',
      root,
      figureNode,
      selectionRing,
      allMeshes,
      staffLight,
    };
  }

  private createSkeletonWarriorMiniature(
    scene: Scene,
    parent: TransformNode,
    id: string,
    name: string,
    pos: Vector3,
    yaw: number,
    shadowGenerators: ShadowGenerator[],
  ): StudioTokenMiniatureInstance {
    const root = new TransformNode(`token-root-${id}`, scene);
    root.position.copyFrom(pos);
    root.parent = parent;

    const figureNode = new TransformNode(`token-figure-${id}`, scene);
    figureNode.rotation.y = yaw;
    figureNode.parent = root;

    const allMeshes: Mesh[] = [];
    const selectionRing = this.createDoubleRimmedPedestal(
      scene,
      id,
      root,
      figureNode,
      '#dc2626',
      allMeshes,
    );

    const boneMat = new StandardMaterial(`skel-bone-mat-${id}`, scene);
    boneMat.diffuseColor = new Color3(0.76, 0.71, 0.61);
    boneMat.specularColor = new Color3(0.32, 0.3, 0.25);
    boneMat.specularPower = 28;
    boneMat.maxSimultaneousLights = 8;

    const armorMat = new StandardMaterial(`skel-armor-mat-${id}`, scene);
    armorMat.diffuseColor = new Color3(0.24, 0.22, 0.21);
    armorMat.specularColor = new Color3(0.52, 0.48, 0.42);
    armorMat.specularPower = 48;
    armorMat.maxSimultaneousLights = 8;

    const steelMat = new StandardMaterial(`skel-steel-mat-${id}`, scene);
    steelMat.diffuseColor = new Color3(0.62, 0.66, 0.72);
    steelMat.specularColor = new Color3(0.9, 0.92, 0.96);
    steelMat.specularPower = 64;
    steelMat.maxSimultaneousLights = 8;

    // Skeletal Legs (Left & Right Femur/Tibia)
    [-0.14, 0.14].forEach((lx, idx) => {
      const leg = MeshBuilder.CreateCylinder(
        `skel-leg-${id}-${idx}`,
        { diameterTop: 0.1, diameterBottom: 0.08, height: 0.66, tessellation: 10 },
        scene,
      );
      leg.position.set(lx, 0.48, idx === 0 ? 0.06 : -0.06);
      leg.rotation.x = idx === 0 ? -0.15 : 0.15;
      leg.material = boneMat;
      leg.isPickable = false;
      leg.parent = figureNode;
      allMeshes.push(leg);
    });

    // Pelvis & Tattered Fauld Armor
    const pelvis = MeshBuilder.CreateCylinder(
      `skel-pelvis-${id}`,
      { diameterTop: 0.32, diameterBottom: 0.38, height: 0.24, tessellation: 12 },
      scene,
    );
    pelvis.position.y = 0.82;
    pelvis.material = armorMat;
    pelvis.isPickable = false;
    pelvis.parent = figureNode;
    allMeshes.push(pelvis);

    // Spine & Ribcage
    const spine = MeshBuilder.CreateCylinder(
      `skel-spine-${id}`,
      { diameter: 0.11, height: 0.56, tessellation: 10 },
      scene,
    );
    spine.position.y = 1.14;
    spine.material = boneMat;
    spine.isPickable = false;
    spine.parent = figureNode;
    allMeshes.push(spine);

    const ribcage = MeshBuilder.CreateSphere(
      `skel-ribcage-${id}`,
      { diameterX: 0.38, diameterY: 0.42, diameterZ: 0.28, segments: 10 },
      scene,
    );
    ribcage.position.y = 1.22;
    ribcage.material = boneMat;
    ribcage.isPickable = false;
    ribcage.parent = figureNode;
    allMeshes.push(ribcage);

    // Pauldrons
    [-0.24, 0.24].forEach((sx, idx) => {
      const pauldron = MeshBuilder.CreateSphere(
        `skel-pauldron-${id}-${idx}`,
        { diameter: 0.2, segments: 10 },
        scene,
      );
      pauldron.position.set(sx, 1.38, 0);
      pauldron.material = armorMat;
      pauldron.isPickable = false;
      pauldron.parent = figureNode;
      allMeshes.push(pauldron);
    });

    // Skull & Jaw
    const skull = MeshBuilder.CreateSphere(
      `skel-skull-${id}`,
      { diameter: 0.27, segments: 12 },
      scene,
    );
    skull.position.set(0, 1.58, 0.02);
    skull.scaling.set(0.92, 1.08, 1.02);
    skull.material = boneMat;
    skull.isPickable = false;
    skull.parent = figureNode;
    allMeshes.push(skull);

    // Sword in Right Hand
    const swordBlade = MeshBuilder.CreateBox(
      `skel-sword-${id}`,
      { width: 0.05, height: 0.88, depth: 0.11 },
      scene,
    );
    swordBlade.position.set(0.34, 1.36, 0.26);
    swordBlade.rotation.x = Math.PI / 3.2;
    swordBlade.rotation.z = -0.18;
    swordBlade.material = steelMat;
    swordBlade.isPickable = false;
    swordBlade.parent = figureNode;
    allMeshes.push(swordBlade);

    // Round Battle Shield in Left Hand
    const shield = MeshBuilder.CreateCylinder(
      `skel-shield-${id}`,
      { diameter: 0.56, height: 0.06, tessellation: 18 },
      scene,
    );
    shield.rotation.z = Math.PI / 2.2;
    shield.rotation.y = 0.35;
    shield.position.set(-0.32, 1.16, 0.16);
    shield.material = armorMat;
    shield.isPickable = false;
    shield.parent = figureNode;
    allMeshes.push(shield);

    shadowGenerators.forEach((sg) => {
      allMeshes.forEach((m) => sg.addShadowCaster(m));
    });

    return {
      id,
      name,
      role: 'target',
      root,
      figureNode,
      selectionRing,
      allMeshes,
    };
  }
}
