import { Injectable, signal } from '@angular/core';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { SceneLightingController } from '../lighting/scene-lighting.controller';
import {
  MapRenderMode,
  MapSceneGraphState,
  MapStampNode,
} from '../map-scene-contract';
import { SeededScatterEngine } from '../scatter/seeded-scatter.engine';
import { TerrainMeshBuilder } from '../terrain/terrain-mesh.builder';
import { WaterSplineBuilder } from '../water/water-spline.builder';

@Injectable({ providedIn: 'root' })
export class BabylonMapStageService {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;

  readonly fps = signal<number>(60);
  readonly activeInstanceCount = signal<number>(24);
  readonly lastPickedCoords = signal<{ x: number; z: number }>({ x: 0, z: 0 });

  mountCanvas(
    canvas: HTMLCanvasElement,
    initialState: MapSceneGraphState,
    onGroundClicked: (x: number, z: number) => void,
  ): void {
    this.dispose();

    try {
      this.engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0.03, 0.06, 0.05, 1);

      this.camera = new ArcRotateCamera(
        'lw-map-cam',
        -Math.PI / 2,
        0.72,
        28,
        Vector3.Zero(),
        this.scene,
      );
      this.camera.lowerRadiusLimit = 10;
      this.camera.upperRadiusLimit = 52;
      this.camera.attachControl(canvas, true);

      this.scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          const pick = pointerInfo.pickInfo;
          if (pick?.hit && pick.pickedPoint) {
            const rx = Math.round(pick.pickedPoint.x * 10) / 10;
            const rz = Math.round(pick.pickedPoint.z * 10) / 10;
            this.lastPickedCoords.set({ x: rx, z: rz });
            onGroundClicked(rx, rz);
          }
        }
      });

      this.syncSceneGraph(initialState);

      this.engine.runRenderLoop(() => {
        if (this.scene && this.engine) {
          this.scene.render();
          this.fps.set(Math.round(this.engine.getFps()));
        }
      });
    } catch {
      // Headless or non-WebGL browser environment fallback
    }
  }

  setCameraMode(mode: MapRenderMode): void {
    if (!this.camera) return;
    if (mode === '2D Blueprint') {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.02;
      this.camera.radius = 32;
    } else if (mode === '3D Tabletop') {
      this.camera.alpha = -Math.PI / 2.35;
      this.camera.beta = 0.85;
      this.camera.radius = 25;
    } else {
      this.camera.alpha = -Math.PI / 2.15;
      this.camera.beta = 0.62;
      this.camera.radius = 27;
    }
  }

  syncSceneGraph(state: MapSceneGraphState): void {
    if (!this.scene) return;

    TerrainMeshBuilder.buildTerrainAndGrid(this.scene, state.biome, state.terrainRelief);
    WaterSplineBuilder.rebuildWaterSplines(this.scene, state.waterSplines);
    SceneLightingController.syncLights(this.scene, state.lights);
    const scatterCount = SeededScatterEngine.rebuildScatterInstances(
      this.scene,
      state.scatterSeed,
      state.scatterDensity,
    );
    this.rebuildStamps(this.scene, state.stamps);
    this.activeInstanceCount.set(scatterCount + state.stamps.length + state.lights.length);
  }

  private rebuildStamps(scene: Scene, stamps: readonly MapStampNode[]): void {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-stamp-'))
      .forEach((m) => m.dispose());

    for (const st of stamps) {
      const mesh =
        st.category === 'Token'
          ? MeshBuilder.CreateCylinder(
              `lw-stamp-${st.id}`,
              { height: 0.55, diameter: 1.5 * st.scale, tessellation: 24 },
              scene,
            )
          : MeshBuilder.CreateBox(
              `lw-stamp-${st.id}`,
              { width: 1.6 * st.scale, height: 1.9 * st.scale, depth: 1.6 * st.scale },
              scene,
            );

      mesh.position.set(st.x, st.category === 'Token' ? 0.35 : 0.95 * st.scale, st.z);
      mesh.rotation.y = st.rotationY;

      const mat = new StandardMaterial(`lw-stamp-mat-${st.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(st.colorHex);
      mat.emissiveColor = Color3.FromHexString(st.colorHex).scale(0.28);
      mesh.material = mat;
    }
  }

  dispose(): void {
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
