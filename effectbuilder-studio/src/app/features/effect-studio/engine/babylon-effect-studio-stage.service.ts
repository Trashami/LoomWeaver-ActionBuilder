import { Injectable, NgZone, inject } from '@angular/core';
import {
  ArcRotateCamera,
  Camera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  ImageProcessingConfiguration,
  Scene,
  Vector3,
} from '@babylonjs/core';
import {
  EffectCameraPreset,
  EffectEmitterCardVm,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
  EffectViewDimensionMode,
} from '../models/effect-studio.models';
import {
  DungeonEnvironmentBuilder,
  DungeonEnvironmentNodes,
} from './dungeon-environment.builder';
import { StructuralSpellFxEngine } from './structural-spell-fx.engine';

export interface EffectSurfaceControlSettings {
  readonly stoneSample: boolean;
  readonly gridVisible: boolean;
  readonly ambientIntensity: number;
  readonly bumpStrength: number;
  readonly movingTarget: boolean;
}

@Injectable({ providedIn: 'root' })
export class BabylonEffectStudioStageService {
  private readonly zone = inject(NgZone);
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private dungeonNodes: DungeonEnvironmentNodes | null = null;
  private readonly dungeonBuilder = new DungeonEnvironmentBuilder();
  private readonly structuralFx = new StructuralSpellFxEngine();
  private resizeObserver: ResizeObserver | null = null;
  private lastTickTime = 0;
  private dimensionMode: EffectViewDimensionMode = '3d';
  private movingTargetEnabled = false;
  private lastAutoCastAt = 0;

  mountDungeonStage(
    canvas: HTMLCanvasElement,
    props: EffectEmitterCardVm,
    _forces: EffectMotionForceConfigVm,
    getState: () => {
      isPlaying: boolean;
      playhead: number;
      duration: number;
      reducedMotion: boolean;
      props: EffectEmitterCardVm;
      forces: EffectMotionForceConfigVm;
      tracks: readonly EffectTimelineTrackVm[];
    },
    onPlayheadAdvance: (nextSeconds: number) => void,
  ): void {
    this.dispose();
    this.canvas = canvas;

    this.zone.runOutsideAngular(() => {
      try {
        this.engine = new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
          antialias: true,
        });
        this.scene = new Scene(this.engine);
        this.scene.clearColor = new Color4(0.028, 0.024, 0.02, 1.0);

        this.scene.imageProcessingConfiguration.toneMappingEnabled = true;
        this.scene.imageProcessingConfiguration.toneMappingType =
          ImageProcessingConfiguration.TONEMAPPING_ACES;
        this.scene.imageProcessingConfiguration.exposure = 1.08;
        this.scene.imageProcessingConfiguration.contrast = 1.16;

        this.camera = new ArcRotateCamera(
          'lw-fx-studio-cam',
          -Math.PI * 0.72,
          1.02,
          12.4,
          new Vector3(0, 1.2, 0),
          this.scene,
        );
        this.camera.lowerRadiusLimit = 5.0;
        this.camera.upperRadiusLimit = 28;
        this.camera.lowerBetaLimit = 0.15;
        this.camera.upperBetaLimit = 1.44;
        this.camera.wheelPrecision = 36;
        this.camera.attachControl(canvas, true);

        const hemi = new HemisphericLight(
          'lw-fx-studio-hemi',
          new Vector3(0.2, 1, -0.2),
          this.scene,
        );
        hemi.intensity = 0.36;
        hemi.diffuse = Color3.FromHexString('#e7e5e4');
        hemi.groundColor = Color3.FromHexString('#120f0c');

        this.dungeonNodes = this.dungeonBuilder.build(this.scene);
        this.setViewDimensionMode(this.dimensionMode);

        // Trigger initial composition cast once on stage load (no persistent center vortex)
        setTimeout(() => {
          const st = getState();
          this.triggerTimelineComposition(st.tracks, st.props);
          this.lastAutoCastAt = performance.now();
        }, 180);

        this.lastTickTime = performance.now();
        this.engine.runRenderLoop(() => {
          if (!this.scene) return;
          const now = performance.now();
          const dt = Math.min(0.1, (now - this.lastTickTime) / 1000);
          this.lastTickTime = now;

          if (this.movingTargetEnabled && this.dungeonNodes?.targetTokens[1]) {
            const primaryTarget = this.dungeonNodes.targetTokens[1];
            primaryTarget.root.position.z = Math.sin(now * 0.0016) * 2.2;
          }

          const st = getState();
          const dur = Math.max(1.0, st.duration);
          if (st.isPlaying && !st.reducedMotion) {
            const rawNext = st.playhead + dt;
            const wrapped = rawNext >= dur;
            const nextTime = rawNext % dur;
            onPlayheadAdvance(nextTime);
            if (wrapped && now - this.lastAutoCastAt > 650) {
              this.lastAutoCastAt = now;
              this.triggerTimelineComposition(st.tracks, st.props);
            }
          }

          this.scene.render();
        });

        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => {
            this.engine?.resize();
            if (this.dimensionMode === '2d') {
              this.syncOrthographicFrustum();
            }
          });
          this.resizeObserver.observe(canvas);
        }
      } catch {
        // Headless fallback
      }
    });
  }

  rebuildActiveEffect(_props: EffectEmitterCardVm, _forces: EffectMotionForceConfigVm): void {
    // Persistent center vortex removed; layers execute explicitly via timeline or cast trigger.
  }

  setViewDimensionMode(mode: EffectViewDimensionMode): void {
    this.dimensionMode = mode;
    if (!this.camera) return;

    if (mode === '2d') {
      this.camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
      this.camera.lowerBetaLimit = 0.001;
      this.camera.upperBetaLimit = 0.001;
      this.camera.alpha = -Math.PI / 2;
      this.camera.beta = 0.001;
      this.camera.setTarget(new Vector3(0, 0.2, 0));
      this.syncOrthographicFrustum();
      this.dungeonNodes?.wallMeshes.forEach((m) => m.setEnabled(false));
    } else {
      this.camera.mode = Camera.PERSPECTIVE_CAMERA;
      this.camera.lowerBetaLimit = 0.15;
      this.camera.upperBetaLimit = 1.44;
      this.camera.alpha = -Math.PI * 0.72;
      this.camera.beta = 1.02;
      this.camera.radius = Math.max(6.5, Math.min(24, this.camera.radius || 12.4));
      this.camera.setTarget(new Vector3(0, 1.2, 0));
      this.dungeonNodes?.wallMeshes.forEach((m) => m.setEnabled(true));
    }
  }

  setSurfaceSettings(settings: Partial<EffectSurfaceControlSettings>): void {
    if (!this.dungeonNodes) return;
    if (settings.stoneSample !== undefined) {
      this.dungeonNodes.floorMesh.setEnabled(settings.stoneSample);
    }
    if (settings.gridVisible !== undefined) {
      this.dungeonNodes.gridOverlayMesh.setEnabled(settings.gridVisible);
    }
    if (settings.ambientIntensity !== undefined) {
      this.dungeonNodes.hemiLight.intensity = settings.ambientIntensity;
    }
    if (settings.bumpStrength !== undefined && this.dungeonNodes.floorMaterial.bumpTexture) {
      this.dungeonNodes.floorMaterial.bumpTexture.level = settings.bumpStrength;
    }
    if (settings.movingTarget !== undefined) {
      this.movingTargetEnabled = settings.movingTarget;
      if (!settings.movingTarget && this.dungeonNodes.targetTokens[1]) {
        this.dungeonNodes.targetTokens[1].root.position.z = 0;
      }
    }
  }

  zoomByDelta(deltaY: number): void {
    if (!this.camera) return;
    const step = deltaY > 0 ? 0.95 : -0.95;
    this.camera.radius = Math.max(
      this.camera.lowerRadiusLimit ?? 5.0,
      Math.min(this.camera.upperRadiusLimit ?? 28, this.camera.radius + step),
    );
    if (this.dimensionMode === '2d') {
      this.syncOrthographicFrustum();
    }
  }

  resetView(): void {
    if (!this.camera) return;
    this.camera.radius = 12.4;
    this.setViewDimensionMode(this.dimensionMode);
  }

  private syncOrthographicFrustum(): void {
    if (!this.camera) return;
    const w = this.canvas?.clientWidth || 1000;
    const h = Math.max(1, this.canvas?.clientHeight || 600);
    const aspect = w / h;
    const halfHeight = Math.max(3.5, Math.min(14, (this.camera.radius || 12.4) * 0.56));
    const halfWidth = halfHeight * aspect;
    this.camera.orthoTop = halfHeight;
    this.camera.orthoBottom = -halfHeight;
    this.camera.orthoLeft = -halfWidth;
    this.camera.orthoRight = halfWidth;
  }

  triggerStructuralSpellCast(emitter: EffectEmitterCardVm): void {
    if (!this.scene || !this.dungeonNodes) return;
    this.zone.runOutsideAngular(() => {
      if (!this.scene || !this.dungeonNodes) return;
      const sceneRef = this.scene;
      const casterPos = this.dungeonNodes.casterToken.root.position.clone();
      const targetTokens = this.dungeonNodes.targetTokens;
      this.structuralFx.playStructuralEffectForEmitter(
        sceneRef,
        emitter,
        casterPos,
        targetTokens,
        (hitTarget) => {
          this.dungeonBuilder.triggerTargetRecoil(sceneRef, hitTarget);
        },
      );
    });
  }

  triggerTimelineComposition(
    tracks: readonly EffectTimelineTrackVm[],
    activeProps: EffectEmitterCardVm,
    soundVolumePercent: number = 85,
  ): void {
    if (!this.scene || !this.dungeonNodes) return;
    this.zone.runOutsideAngular(() => {
      if (!this.scene || !this.dungeonNodes) return;
      const sceneRef = this.scene;
      const casterPos = this.dungeonNodes.casterToken.root.position.clone();
      const targetTokens = this.dungeonNodes.targetTokens;
      this.structuralFx.playTimelineComposition(
        sceneRef,
        tracks,
        activeProps,
        casterPos,
        targetTokens,
        soundVolumePercent,
        (hitTarget) => {
          this.dungeonBuilder.triggerTargetRecoil(sceneRef, hitTarget);
        },
      );
    });
  }

  applyCameraPreset(preset: EffectCameraPreset): void {
    if (!this.camera) return;
    if (preset === 'Top-Down') {
      this.setViewDimensionMode('2d');
      return;
    }
    if (this.dimensionMode === '2d') {
      this.setViewDimensionMode('3d');
    }
    switch (preset) {
      case 'Isometric':
        this.camera.alpha = -Math.PI * 0.72;
        this.camera.beta = 1.02;
        this.camera.radius = 12.4;
        this.camera.setTarget(new Vector3(0, 1.2, 0));
        break;
      case 'Tactical Orbit':
        this.camera.alpha = -Math.PI * 0.58;
        this.camera.beta = 1.08;
        this.camera.radius = 11.2;
        this.camera.setTarget(new Vector3(0.3, 1.2, 0));
        break;
      case 'Caster POV':
        this.camera.alpha = -Math.PI * 0.88;
        this.camera.beta = 1.16;
        this.camera.radius = 9.4;
        this.camera.setTarget(new Vector3(0.8, 1.35, 0.1));
        break;
    }
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.dungeonNodes = null;
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
    this.canvas = null;
  }
}
