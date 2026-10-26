import { Injectable, NgZone, inject } from '@angular/core';
import {
  ArcRotateCamera,
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
} from '../models/effect-studio.models';
import {
  DungeonEnvironmentBuilder,
  DungeonEnvironmentNodes,
} from './dungeon-environment.builder';
import { RuneVortexShaderBuilder } from './rune-vortex-shader.builder';
import { StructuralSpellFxEngine } from './structural-spell-fx.engine';

@Injectable({ providedIn: 'root' })
export class BabylonEffectStudioStageService {
  private readonly zone = inject(NgZone);
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private dungeonNodes: DungeonEnvironmentNodes | null = null;
  private readonly dungeonBuilder = new DungeonEnvironmentBuilder();
  private readonly vortexBuilder = new RuneVortexShaderBuilder();
  private readonly structuralFx = new StructuralSpellFxEngine();
  private resizeObserver: ResizeObserver | null = null;
  private lastTickTime = 0;

  mountDungeonStage(
    canvas: HTMLCanvasElement,
    props: EffectEmitterCardVm,
    forces: EffectMotionForceConfigVm,
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
          new Vector3(0, 1.45, 0),
          this.scene,
        );
        this.camera.lowerRadiusLimit = 6.5;
        this.camera.upperRadiusLimit = 28;
        this.camera.lowerBetaLimit = 0.25;
        this.camera.upperBetaLimit = 1.42;
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
        this.vortexBuilder.buildOrUpdateEffectMeshes(this.scene, props, forces);

        this.lastTickTime = performance.now();
        this.engine.runRenderLoop(() => {
          if (!this.scene) return;
          const now = performance.now();
          const dt = Math.min(0.1, (now - this.lastTickTime) / 1000);
          this.lastTickTime = now;

          const st = getState();
          let nextTime = st.playhead;
          if (st.isPlaying && !st.reducedMotion) {
            nextTime = (st.playhead + dt) % Math.max(1.0, st.duration);
            onPlayheadAdvance(nextTime);
          }

          this.vortexBuilder.animateAtTime(
            nextTime,
            st.props,
            st.forces,
            st.tracks,
            st.reducedMotion,
          );
          this.scene.render();
        });

        if (typeof ResizeObserver !== 'undefined') {
          this.resizeObserver = new ResizeObserver(() => {
            this.engine?.resize();
          });
          this.resizeObserver.observe(canvas);
        }
      } catch {
        // Headless fallback
      }
    });
  }

  rebuildActiveEffect(props: EffectEmitterCardVm, forces: EffectMotionForceConfigVm): void {
    if (!this.scene) return;
    this.zone.runOutsideAngular(() => {
      if (this.scene) {
        this.vortexBuilder.buildOrUpdateEffectMeshes(this.scene, props, forces);
      }
    });
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

  applyCameraPreset(preset: EffectCameraPreset): void {
    if (!this.camera) return;
    switch (preset) {
      case 'Isometric':
        this.camera.alpha = -Math.PI * 0.72;
        this.camera.beta = 1.02;
        this.camera.radius = 12.4;
        this.camera.setTarget(new Vector3(0, 1.45, 0));
        break;
      case 'Top-Down':
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = 0.24;
        this.camera.radius = 16.5;
        this.camera.setTarget(new Vector3(0, 0.5, 0));
        break;
      case 'Tactical Orbit':
        this.camera.alpha = -Math.PI * 0.58;
        this.camera.beta = 1.08;
        this.camera.radius = 11.2;
        this.camera.setTarget(new Vector3(0.3, 1.4, 0));
        break;
      case 'Caster POV':
        this.camera.alpha = -Math.PI * 0.88;
        this.camera.beta = 1.16;
        this.camera.radius = 9.4;
        this.camera.setTarget(new Vector3(0.8, 1.55, 0.1));
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
  }
}
