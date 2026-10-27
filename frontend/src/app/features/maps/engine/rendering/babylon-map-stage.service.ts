import { Injectable, signal } from '@angular/core';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import {
  CelestialLightConfig,
  SceneLightingController,
} from '../lighting/scene-lighting.controller';
import {
  MapRenderMode,
  MapSceneGraphState,
  MapStampNode,
  WallDrawMode,
} from '../map-scene-contract';
import { SeededScatterEngine } from '../scatter/seeded-scatter.engine';
import { TerrainMeshBuilder } from '../terrain/terrain-mesh.builder';
import { WallMeshBuilder } from '../walls/wall-mesh.builder';
import { PathRibbonEngine } from '../paths/path-ribbon.engine';
import { WaterSplineBuilder } from '../water/water-spline.builder';

export interface GhostAssetConfig {
  readonly enabled: boolean;
  readonly label: string;
  readonly kind: 'prop' | 'wall' | 'light' | 'terrain';
  readonly scale: number;
  readonly rotationRad: number;
  readonly heightMeters: number;
  readonly thicknessMeters: number;
  readonly wallDrawMode: WallDrawMode;
}

@Injectable({ providedIn: 'root' })
export class BabylonMapStageService {
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private selectedPosition: Vector3 = new Vector3(-2.5, 1.4, 1.5);
  private hideGmSecrets = false;
  private snapToGrid = true;
  private ghostConfig: GhostAssetConfig = {
    enabled: true,
    label: 'Stone Wall Segment',
    kind: 'wall',
    scale: 1,
    rotationRad: 0,
    heightMeters: 3.0,
    thicknessMeters: 0.45,
    wallDrawMode: 'line',
  };
  private wallStartAnchor: { x: number; z: number } | null = null;

  readonly fps = signal<number>(60);
  readonly activeInstanceCount = signal<number>(24);
  readonly lastPickedCoords = signal<{ x: number; z: number }>({ x: 0, z: 0 });
  readonly hoverCoords = signal<{ x: number; z: number }>({ x: 0, z: 0 });

  mountCanvas(
    canvas: HTMLCanvasElement,
    initialState: MapSceneGraphState,
    onGroundClicked: (x: number, z: number, pickedMeshName?: string) => void,
    onGroundHovered?: (x: number, z: number) => void,
  ): void {
    this.dispose();

    try {
      this.engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });
      this.scene = new Scene(this.engine);
      this.scene.clearColor = new Color4(0.02, 0.06, 0.04, 1);
      this.scene.shadowsEnabled = true;

      this.camera = new ArcRotateCamera(
        'lw-map-cam',
        -Math.PI / 2.25,
        0.78,
        26,
        Vector3.Zero(),
        this.scene,
      );
      this.camera.lowerRadiusLimit = 7;
      this.camera.upperRadiusLimit = 54;
      this.camera.attachControl(canvas, true);

      this.scene.onPointerObservable.add((pointerInfo) => {
        if (!this.scene) return;
        const pick = this.scene.pick(
          this.scene.pointerX,
          this.scene.pointerY,
          (m) => m.name === 'lw-terrain-ground' || m.name.startsWith('lw-wall-') || m.name.startsWith('lw-stamp-'),
        );
        if (!pick?.hit || !pick.pickedPoint) return;

        const rawX = pick.pickedPoint.x;
        const rawZ = pick.pickedPoint.z;
        const gx = this.snapToGrid ? Math.round(rawX * 2) / 2 : Math.round(rawX * 10) / 10;
        const gz = this.snapToGrid ? Math.round(rawZ * 2) / 2 : Math.round(rawZ * 10) / 10;

        if (pointerInfo.type === PointerEventTypes.POINTERMOVE) {
          this.hoverCoords.set({ x: gx, z: gz });
          this.updateGhostMeshAt(gx, gz);
          if (onGroundHovered) {
            onGroundHovered(gx, gz);
          }
        } else if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          this.lastPickedCoords.set({ x: gx, z: gz });
          this.selectedPosition = new Vector3(gx, Math.max(1.1, pick.pickedPoint.y + 0.9), gz);
          this.rebuildSelectionGizmo();
          onGroundClicked(gx, gz, pick.pickedMesh?.name);
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

  setSnapToGrid(snap: boolean): void {
    this.snapToGrid = snap;
  }

  setGhostConfig(config: GhostAssetConfig, wallAnchor: { x: number; z: number } | null): void {
    this.ghostConfig = config;
    this.wallStartAnchor = wallAnchor;
    const h = this.hoverCoords();
    this.updateGhostMeshAt(h.x, h.z);
  }

  private updateGhostMeshAt(gx: number, gz: number): void {
    if (!this.scene) return;

    this.scene.meshes
      .filter((m) => m.name.startsWith('lw-ghost-'))
      .forEach((m) => m.dispose());

    if (!this.ghostConfig.enabled) return;

    if (this.ghostConfig.kind === 'wall' && this.wallStartAnchor) {
      WallMeshBuilder.renderGhostWallPreview(
        this.scene,
        this.ghostConfig.wallDrawMode,
        this.wallStartAnchor.x,
        this.wallStartAnchor.z,
        gx,
        gz,
        this.ghostConfig.heightMeters,
        this.ghostConfig.thicknessMeters,
      );
      return;
    }

    const mat = new StandardMaterial('lw-ghost-cursor-mat', this.scene);
    mat.diffuseColor = Color3.FromHexString('#49e892');
    mat.emissiveColor = Color3.FromHexString('#2ee66b').scale(0.55);
    mat.alpha = 0.45;

    let ghost: Mesh;
    if (this.ghostConfig.kind === 'terrain') {
      ghost = MeshBuilder.CreateCylinder(
        'lw-ghost-cursor-mesh',
        { height: 0.18, diameter: this.ghostConfig.scale * 2, tessellation: 28 },
        this.scene,
      );
      ghost.position.set(gx, 0.15, gz);
    } else if (this.ghostConfig.kind === 'light') {
      ghost = MeshBuilder.CreateSphere(
        'lw-ghost-cursor-mesh',
        { diameter: 0.9, segments: 12 },
        this.scene,
      );
      ghost.position.set(gx, 2.2, gz);
    } else if (this.ghostConfig.kind === 'wall') {
      ghost = MeshBuilder.CreateBox(
        'lw-ghost-cursor-mesh',
        {
          width: 2.0,
          height: this.ghostConfig.heightMeters,
          depth: this.ghostConfig.thicknessMeters,
        },
        this.scene,
      );
      ghost.position.set(gx, this.ghostConfig.heightMeters / 2, gz);
      ghost.rotation.y = this.ghostConfig.rotationRad;
    } else {
      ghost = MeshBuilder.CreateBox(
        'lw-ghost-cursor-mesh',
        {
          width: 1.7 * this.ghostConfig.scale,
          height: 1.5 * this.ghostConfig.scale,
          depth: 1.4 * this.ghostConfig.scale,
        },
        this.scene,
      );
      ghost.position.set(gx, 0.75 * this.ghostConfig.scale, gz);
      ghost.rotation.y = this.ghostConfig.rotationRad;
    }

    ghost.material = mat;
    ghost.isPickable = false;
  }

  applyFloorBumpMap(albedoUrl: string, normalUrl: string): void {
    if (!this.scene) return;
    TerrainMeshBuilder.applyFloorBumpTexture(this.scene, albedoUrl, normalUrl);
  }

  sculptTerrainAt(
    worldX: number,
    worldZ: number,
    radius: number,
    deltaY: number,
    mode: 'raise' | 'lower' | 'flatten',
  ): void {
    if (!this.scene) return;
    TerrainMeshBuilder.sculptElevationAt(this.scene, worldX, worldZ, radius, deltaY, mode);
  }

  updateCelestialLight(config: CelestialLightConfig): void {
    if (!this.scene) return;
    SceneLightingController.syncCelestialDirectionalLight(this.scene, config);
    SceneLightingController.refreshShadowCasters(this.scene);
  }

  setCameraMode(mode: MapRenderMode | string): void {
    if (!this.camera) return;
    if (mode === '2D Blueprint' || mode === 'top-down' || mode === 'real-2d') {
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.02;
      this.camera.radius = 31;
    } else if (mode === 'first-person') {
      this.camera.alpha = -Math.PI / 2.1;
      this.camera.beta = 1.32;
      this.camera.radius = 11;
    } else if (mode === '3D Tabletop' || mode === 'isometric') {
      this.camera.alpha = -Math.PI / 2.3;
      this.camera.beta = 0.78;
      this.camera.radius = 25;
    } else {
      this.camera.alpha = -Math.PI / 2.15;
      this.camera.beta = 0.65;
      this.camera.radius = 26;
    }
  }

  setQualityPreset(preset: string): void {
    if (!this.engine) return;
    if (preset === 'Cinematic 3D') {
      this.engine.setHardwareScalingLevel(0.85);
    } else if (preset === 'Performance 3D' || preset === 'Classic 2D') {
      this.engine.setHardwareScalingLevel(1.5);
    } else {
      this.engine.setHardwareScalingLevel(1.0);
    }
  }

  setPlayerSafeFilter(hideSecrets: boolean, state: MapSceneGraphState): void {
    this.hideGmSecrets = hideSecrets;
    this.syncSceneGraph(state);
  }

  focusGizmoAt(x: number, y: number, z: number): void {
    this.selectedPosition = new Vector3(x, y, z);
    this.rebuildSelectionGizmo();
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
    const wallCount = WallMeshBuilder.rebuildWallMeshes(
      this.scene,
      state.walls,
      this.hideGmSecrets,
    );
    const pathCount = PathRibbonEngine.rebuildPathRibbonMeshes(this.scene, state.pathRibbons);
    this.rebuildStamps(this.scene, state.stamps);
    SceneLightingController.refreshShadowCasters(this.scene);
    this.rebuildSelectionGizmo();
    this.activeInstanceCount.set(
      scatterCount + state.stamps.length + state.lights.length + wallCount + pathCount,
    );
  }

  private rebuildStamps(scene: Scene, stamps: readonly MapStampNode[]): void {
    scene.meshes
      .filter((m) => m.name.startsWith('lw-stamp-'))
      .forEach((m) => m.dispose());

    for (const st of stamps) {
      if (this.hideGmSecrets && st.label.toLowerCase().includes('secret')) {
        continue;
      }
      const mesh =
        st.category === 'Token'
          ? MeshBuilder.CreateCylinder(
              `lw-stamp-${st.id}`,
              { height: 0.65, diameter: 1.55 * st.scale, tessellation: 24 },
              scene,
            )
          : st.category === 'Architecture'
            ? MeshBuilder.CreateCylinder(
                `lw-stamp-${st.id}`,
                { height: 2.9 * st.scale, diameter: 1.15 * st.scale, tessellation: 16 },
                scene,
              )
            : MeshBuilder.CreateBox(
                `lw-stamp-${st.id}`,
                { width: 1.7 * st.scale, height: 1.35 * st.scale, depth: 1.2 * st.scale },
                scene,
              );

      mesh.position.set(
        st.x,
        st.category === 'Token'
          ? 0.35
          : st.category === 'Architecture'
            ? 1.45 * st.scale
            : 0.7 * st.scale,
        st.z,
      );
      mesh.rotation.y = st.rotationY;
      mesh.receiveShadows = true;

      const mat = new StandardMaterial(`lw-stamp-mat-${st.id}`, scene);
      mat.diffuseColor = Color3.FromHexString(st.colorHex || '#7d8a82');
      mat.emissiveColor = Color3.FromHexString(st.colorHex || '#49e892').scale(0.2);
      mesh.material = mat;
    }
  }

  private rebuildSelectionGizmo(): void {
    if (!this.scene) return;
    this.scene.meshes
      .filter((m) => m.name.startsWith('lw-gizmo-'))
      .forEach((m) => m.dispose());

    const pos = this.selectedPosition;
    const highlightBox = MeshBuilder.CreateBox(
      'lw-gizmo-highlight-box',
      { width: 3.1, height: 2.6, depth: 0.85 },
      this.scene,
    );
    highlightBox.position.copyFrom(pos);
    const boxMat = new StandardMaterial('lw-gizmo-box-mat', this.scene);
    boxMat.diffuseColor = Color3.FromHexString('#2ee66b');
    boxMat.emissiveColor = Color3.FromHexString('#49e892');
    boxMat.alpha = 0.24;
    boxMat.wireframe = true;
    highlightBox.material = boxMat;
    highlightBox.isPickable = false;

    this.createGizmoAxis('x', pos, new Vector3(1.9, 0, 0), '#ff4d4d');
    this.createGizmoAxis('y', pos, new Vector3(0, 1.9, 0), '#2ee66b');
    this.createGizmoAxis('z', pos, new Vector3(0, 0, 1.9), '#3b9eff');
  }

  private createGizmoAxis(
    axis: 'x' | 'y' | 'z',
    origin: Vector3,
    offset: Vector3,
    hexColor: string,
  ): void {
    if (!this.scene) return;
    const tip = origin.add(offset);
    const shaft = MeshBuilder.CreateLines(
      `lw-gizmo-axis-${axis}`,
      { points: [origin, tip] },
      this.scene,
    );
    shaft.color = Color3.FromHexString(hexColor);
    shaft.isPickable = false;

    const head = MeshBuilder.CreateSphere(
      `lw-gizmo-tip-${axis}`,
      { diameter: 0.34, segments: 8 },
      this.scene,
    );
    head.position.copyFrom(tip);
    const mat = new StandardMaterial(`lw-gizmo-mat-${axis}`, this.scene);
    mat.emissiveColor = Color3.FromHexString(hexColor);
    mat.diffuseColor = Color3.FromHexString(hexColor);
    head.material = mat;
    head.isPickable = false;
  }

  resize(): void {
    this.engine?.resize();
  }

  dispose(): void {
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
