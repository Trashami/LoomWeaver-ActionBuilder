import { Injectable, NgZone, inject } from '@angular/core';
import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
} from '@babylonjs/core';
import {
  EffectCameraPreset,
  EffectEmitterCardVm,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../models/effect-studio.models';
import { DungeonEnvironmentBuilder } from './dungeon-environment.builder';
import { RuneVortexShaderBuilder } from './rune-vortex-shader.builder';

@Injectable({ providedIn: 'root' })
export class BabylonEffectStudioStageService {
  private readonly zone = inject(NgZone);
  private engine: Engine | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private readonly dungeonBuilder = new DungeonEnvironmentBuilder();
  private readonly vortexBuilder = new RuneVortexShaderBuilder();
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
        this.scene.clearColor = new Color4(0.04, 0.035, 0.03, 1.0);

        this.camera = new ArcRotateCamera(
          'lw-fx-studio-cam',
          -Math.PI / 3.8,
          0.92,
          17.5,
          new Vector3(0, 1.8, 0),
          this.scene,
        );
        this.camera.lowerRadiusLimit = 7;
        this.camera.upperRadiusLimit = 34;
        this.camera.lowerBetaLimit = 0.25;
        this.camera.upperBetaLimit = 1.42;
        this.camera.attachControl(canvas, true);

        const hemi = new HemisphericLight(
          'lw-fx-studio-hemi',
          new Vector3(0.2, 1, -0.2),
          this.scene,
        );
        hemi.intensity = 0.42;
        hemi.diffuse = Color3.FromHexString('#e7e5e4');
        hemi.groundColor = Color3.FromHexString('#14110e');

        this.dungeonBuilder.buildDungeonStage(this.scene);
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

  applyCameraPreset(preset: EffectCameraPreset): void {
    if (!this.camera) return;
    switch (preset) {
      case 'Isometric':
        this.camera.alpha = -Math.PI / 3.8;
        this.camera.beta = 0.92;
        this.camera.radius = 17.5;
        this.camera.setTarget(new Vector3(0, 1.8, 0));
        break;
      case 'Top-Down':
        this.camera.alpha = -Math.PI / 2;
        this.camera.beta = 0.26;
        this.camera.radius = 21.0;
        this.camera.setTarget(new Vector3(0, 0.5, 0));
        break;
      case 'Tactical Orbit':
        this.camera.alpha = -Math.PI / 1.75;
        this.camera.beta = 1.05;
        this.camera.radius = 15.5;
        this.camera.setTarget(new Vector3(0.5, 1.6, 0));
        break;
      case 'Caster POV':
        this.camera.alpha = -0.18;
        this.camera.beta = 1.18;
        this.camera.radius = 12.0;
        this.camera.setTarget(new Vector3(1.2, 2.0, 0.2));
        break;
    }
  }

  dispose(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.scene?.dispose();
    this.engine?.dispose();
    this.scene = null;
    this.engine = null;
    this.camera = null;
  }
}
