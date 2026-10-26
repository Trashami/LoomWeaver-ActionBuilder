import { Injectable } from '@angular/core';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

export interface DiceStageSkinConfig {
  readonly baseColorHex: string;
  readonly runeColorHex: string;
  readonly metallic: number;
  readonly roughness: number;
}

@Injectable({ providedIn: 'root' })
export class BabylonDiceStageService {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private diceMeshes: Mesh[] = [];
  private fxMeshes: Mesh[] = [];
  private activeSkin: DiceStageSkinConfig = {
    baseColorHex: '#17151c',
    runeColorHex: '#e5b85c',
    metallic: 0.82,
    roughness: 0.22,
  };

  initializeStage(canvas: HTMLCanvasElement): void {
    this.dispose();
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.05, 0.05, 0.08, 1);

    const camera = new ArcRotateCamera(
      'diceForgeCam',
      -Math.PI / 2,
      Math.PI / 3.1,
      14,
      Vector3.Zero(),
      this.scene,
    );
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 22;
    camera.attachControl(canvas, true);

    const hemi = new HemisphericLight('diceHemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.85;
    hemi.groundColor = new Color3(0.1, 0.08, 0.14);

    const keyLight = new PointLight('diceKey', new Vector3(5, 9, -4), this.scene);
    keyLight.intensity = 1.15;
    keyLight.diffuse = Color3.FromHexString('#ffe299');

    this.buildOctagonalTray();
    this.spawnShowcaseSet();

    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });
  }

  applySkin(skin: DiceStageSkinConfig): void {
    this.activeSkin = skin;
    if (!this.scene) return;
    for (const mesh of this.diceMeshes) {
      const mat = mesh.material as StandardMaterial | null;
      if (mat) {
        mat.diffuseColor = Color3.FromHexString(skin.baseColorHex);
        mat.emissiveColor = Color3.FromHexString(skin.runeColorHex).scale(0.32);
        mat.specularColor = Color3.FromHexString(skin.runeColorHex).scale(skin.metallic);
        mat.specularPower = Math.max(8, Math.round((1 - skin.roughness) * 96));
      }
    }
  }

  animateRoll(
    sides: number,
    count: number,
    isNat20: boolean,
    isNat1: boolean,
    reducedMotion: boolean,
  ): void {
    if (!this.scene) return;
    this.clearDiceAndFx();

    const safeCount = Math.min(Math.max(count, 1), 8);
    const polyType = this.mapSidesToPolyhedronType(sides);

    for (let i = 0; i < safeCount; i++) {
      const die = MeshBuilder.CreatePolyhedron(
        `rolled-die-${i}`,
        { type: polyType, size: 0.92 },
        this.scene,
      );
      die.material = this.createDieMaterial(`die-mat-${i}`);

      const angle = (i / safeCount) * Math.PI * 2;
      const radius = safeCount === 1 ? 0 : 2.1;
      const targetX = Math.cos(angle) * radius;
      const targetZ = Math.sin(angle) * radius;

      if (reducedMotion) {
        die.position = new Vector3(targetX, 0.85, targetZ);
        die.rotation = new Vector3(0.4 * i, 0.8 * i, 0.25);
      } else {
        die.position = new Vector3(targetX * 0.4, 5.2 + i * 0.4, -3.5);
        this.animateSingleDieTumble(die, new Vector3(targetX, 0.85, targetZ));
      }

      this.diceMeshes.push(die);
    }

    if (isNat20) {
      this.spawnOutcomeBurst('#ffe299', true, reducedMotion);
    } else if (isNat1) {
      this.spawnOutcomeBurst('#ff4d6d', false, reducedMotion);
    }
  }

  dispose(): void {
    this.clearDiceAndFx();
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
  }

  private buildOctagonalTray(): void {
    if (!this.scene) return;

    const felt = MeshBuilder.CreateCylinder(
      'trayFelt',
      { diameter: 11.2, height: 0.3, tessellation: 8 },
      this.scene,
    );
    felt.position.y = -0.15;
    const feltMat = new StandardMaterial('trayFeltMat', this.scene);
    feltMat.diffuseColor = Color3.FromHexString('#161324');
    feltMat.specularColor = new Color3(0.08, 0.08, 0.1);
    felt.material = feltMat;

    const rim = MeshBuilder.CreateTorus(
      'trayRim',
      { diameter: 11.5, thickness: 0.65, tessellation: 8 },
      this.scene,
    );
    rim.position.y = 0.25;
    const rimMat = new StandardMaterial('trayRimMat', this.scene);
    rimMat.diffuseColor = Color3.FromHexString('#3b2d1d');
    rimMat.specularColor = Color3.FromHexString('#e5b85c');
    rim.material = rimMat;
  }

  private spawnShowcaseSet(): void {
    if (!this.scene) return;
    this.clearDiceAndFx();
    const showcaseSides = [4, 6, 8, 12, 20];
    showcaseSides.forEach((sides, idx) => {
      const die = MeshBuilder.CreatePolyhedron(
        `showcase-d${sides}`,
        { type: this.mapSidesToPolyhedronType(sides), size: sides === 20 ? 1.05 : 0.82 },
        this.scene!,
      );
      die.material = this.createDieMaterial(`showcase-mat-${sides}`);
      const spread = (idx - 2) * 2.05;
      die.position = new Vector3(spread, 0.9, idx % 2 === 0 ? 0.35 : -0.45);
      die.rotation = new Vector3(0.35 * idx, 0.6 * idx, 0.2);
      this.diceMeshes.push(die);
    });
  }

  private animateSingleDieTumble(die: Mesh, target: Vector3): void {
    if (!this.scene) return;
    const start = die.position.clone();
    const startTime = performance.now();
    const durationMs = 720;

    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const t = Math.min(1, (performance.now() - startTime) / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const bounce = Math.abs(Math.sin(t * Math.PI * 2.5)) * (1 - t) * 2.2;

      die.position.x = start.x + (target.x - start.x) * ease;
      die.position.z = start.z + (target.z - start.z) * ease;
      die.position.y = target.y + (1 - ease) * 3.8 + bounce;

      die.rotation.x += (1 - t) * 0.32;
      die.rotation.y += (1 - t) * 0.28;
      die.rotation.z += (1 - t) * 0.24;

      if (t >= 1 && this.scene) {
        this.scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  private spawnOutcomeBurst(hexColor: string, isCriticalSuccess: boolean, reducedMotion: boolean): void {
    if (!this.scene) return;
    const ring = MeshBuilder.CreateTorus(
      'outcomeRing',
      { diameter: 2.4, thickness: 0.18, tessellation: 36 },
      this.scene,
    );
    ring.position.y = 0.25;
    const mat = new StandardMaterial('outcomeMat', this.scene);
    mat.emissiveColor = Color3.FromHexString(hexColor);
    mat.diffuseColor = Color3.FromHexString(hexColor);
    mat.alpha = 0.85;
    ring.material = mat;
    this.fxMeshes.push(ring);

    if (isCriticalSuccess) {
      const pillar = MeshBuilder.CreateCylinder(
        'nat20Pillar',
        { diameterTop: 0.4, diameterBottom: 1.8, height: 5.5, tessellation: 24 },
        this.scene,
      );
      pillar.position.y = 2.75;
      const pMat = new StandardMaterial('pillarMat', this.scene);
      pMat.emissiveColor = Color3.FromHexString(hexColor);
      pMat.alpha = 0.32;
      pillar.material = pMat;
      this.fxMeshes.push(pillar);
    }

    if (reducedMotion) return;

    const startTime = performance.now();
    const obs = this.scene.onBeforeRenderObservable.add(() => {
      const t = Math.min(1, (performance.now() - startTime) / 1100);
      const scale = 1 + t * 2.8;
      ring.scaling = new Vector3(scale, 1, scale);
      mat.alpha = Math.max(0, 0.85 * (1 - t));
      if (t >= 1 && this.scene) {
        this.scene.onBeforeRenderObservable.remove(obs);
      }
    });
  }

  private createDieMaterial(name: string): StandardMaterial {
    const mat = new StandardMaterial(name, this.scene!);
    mat.diffuseColor = Color3.FromHexString(this.activeSkin.baseColorHex);
    mat.emissiveColor = Color3.FromHexString(this.activeSkin.runeColorHex).scale(0.32);
    mat.specularColor = Color3.FromHexString(this.activeSkin.runeColorHex).scale(this.activeSkin.metallic);
    mat.specularPower = Math.max(8, Math.round((1 - this.activeSkin.roughness) * 96));
    return mat;
  }

  private mapSidesToPolyhedronType(sides: number): number {
    switch (sides) {
      case 4:
        return 0; // Tetrahedron
      case 6:
        return 1; // Octahedron/Hexahedron proxy
      case 8:
        return 1; // Octahedron
      case 10:
      case 12:
        return 2; // Dodecahedron
      default:
        return 3; // Icosahedron (d20 / d100)
    }
  }

  private clearDiceAndFx(): void {
    for (const m of this.diceMeshes) m.dispose();
    for (const f of this.fxMeshes) f.dispose();
    this.diceMeshes = [];
    this.fxMeshes = [];
  }
}
