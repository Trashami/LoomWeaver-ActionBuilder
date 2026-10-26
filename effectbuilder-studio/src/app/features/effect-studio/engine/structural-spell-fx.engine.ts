import { Scene, Vector3 } from '@babylonjs/core';
import {
  EffectAppearanceId,
  EffectEmitterCardVm,
  EffectTimelineTrackVm,
} from '../models/effect-studio.models';
import { EFFECT_APPEARANCES_SEED } from '../models/effect-studio.seed';
import { CinematicElementKind, ensureEffectBuilderShadersRegistered } from './effect-glsl-shaders.registry';
import { ExtractedCoreFxEngine, LayerExecutionParams } from './extracted-core-fx.engine';
import { NewPriorityFxEngine } from './new-priority-fx.engine';
import { StudioTokenMiniatureInstance } from './token-miniature.builder';

/**
 * Explicit Timeline Layer Orchestrator (`structural-spell-fx.engine.ts`).
 * Executes each visible timeline track explicitly according to its authored building block,
 * start/end window, anchor (`caster`, `path`, `target`, `area`), `appearanceId`, `count`,
 * `scale`, and `opacity` — never bypassing the timeline with hardcoded preset overrides.
 */
export class StructuralSpellFxEngine {
  private readonly coreEngine = new ExtractedCoreFxEngine();
  private readonly newPriorityEngine = new NewPriorityFxEngine();

  /**
   * Executes every visible track in the timeline composition explicitly.
   */
  playTimelineComposition(
    scene: Scene,
    tracks: readonly EffectTimelineTrackVm[],
    activeProps: EffectEmitterCardVm,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    soundVolumePercent: number = 85,
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const visibleTracks = tracks.filter((t) => t.visible);
    if (visibleTracks.length === 0) {
      this.playSingleEffectBuildingBlock(scene, activeProps, casterPos, targetTokens, onHitTarget);
      return;
    }

    for (const track of visibleTracks) {
      const delayMs = Math.max(0, Math.floor(track.startTimeSeconds * 1000));
      const durMs = Math.max(280, Math.floor((track.endTimeSeconds - track.startTimeSeconds) * 1000));
      const params = this.resolveLayerParams(track, activeProps, durMs);

      setTimeout(() => {
        this.dispatchBuildingBlock(
          scene,
          track.trackType,
          track.anchor ?? 'target',
          params,
          casterPos,
          targetTokens,
          soundVolumePercent,
          onHitTarget,
        );
      }, delayMs);
    }
  }

  /**
   * Plays a single selected Effect Building Block card from the library for instant preview.
   */
  playStructuralEffectForEmitter(
    scene: Scene,
    emitter: EffectEmitterCardVm,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    this.playSingleEffectBuildingBlock(scene, emitter, casterPos, targetTokens, onHitTarget);
  }

  playSingleEffectBuildingBlock(
    scene: Scene,
    emitter: EffectEmitterCardVm,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const appearance = this.findAppearance(emitter.appearanceId);
    const params: LayerExecutionParams = {
      mainHex: emitter.colorPrimaryHex || appearance.colorPrimaryHex,
      coreHex: emitter.colorSecondaryHex || appearance.colorSecondaryHex,
      smokeHex: appearance.smokeHex,
      element: appearance.shaderElement,
      durationMs: Math.max(450, Math.floor(emitter.lifetimeSeconds * 750)),
      scale: emitter.scale ?? 1.0,
      count: emitter.count ?? 3,
      opacity: Math.max(0.2, Math.min(1, emitter.opacityPercent / 100)),
      variant: emitter.objectModel || emitter.circlePattern || emitter.debrisMaterial || 'detailed',
    };

    const anchor =
      emitter.emitterType === 'Casting Charge' || emitter.emitterType === 'Shield / Dome'
        ? 'caster'
        : 'target';

    this.dispatchBuildingBlock(
      scene,
      emitter.emitterType,
      anchor,
      params,
      casterPos,
      targetTokens,
      85,
      onHitTarget,
    );
  }

  private dispatchBuildingBlock(
    scene: Scene,
    blockType: string,
    anchor: 'caster' | 'path' | 'target' | 'area',
    params: LayerExecutionParams,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    soundVolumePercent: number,
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    const primaryTarget = targetTokens[1] ?? targetTokens[0];
    const targetPos = primaryTarget ? primaryTarget.root.position.clone() : new Vector3(2.8, 0, 0);
    const anchorPos =
      anchor === 'caster'
        ? casterPos
        : anchor === 'area'
          ? new Vector3(0, 0, 0)
          : targetPos;

    switch (blockType) {
      case 'Casting Charge':
        this.coreEngine.playCastingCharge(scene, casterPos, params);
        break;
      case 'Projectile':
        this.coreEngine.playProjectile(scene, casterPos, targetPos, params, primaryTarget, onHitTarget);
        break;
      case 'Projectile Volley':
        this.coreEngine.playProjectileVolley(scene, casterPos, targetTokens, params, onHitTarget);
        break;
      case 'Object Projectile':
        this.coreEngine.playObjectProjectile(scene, casterPos, targetPos, params, primaryTarget, onHitTarget);
        break;
      case 'Trail':
        this.coreEngine.playTrail(scene, casterPos, targetPos, params);
        break;
      case 'Beam':
        this.coreEngine.playCinematicVolume(scene, casterPos, targetPos, 'beam', params, primaryTarget, onHitTarget);
        break;
      case 'Cone Spray':
        this.coreEngine.playCinematicVolume(scene, casterPos, targetPos, 'cone', params, primaryTarget, onHitTarget);
        break;
      case 'Energy Column':
        this.coreEngine.playCinematicVolume(scene, casterPos, anchorPos, 'column', params, primaryTarget, onHitTarget);
        break;
      case 'Burst':
        this.coreEngine.playDetailedBurst(scene, anchorPos, params, primaryTarget, onHitTarget);
        break;
      case 'Box Burst':
        this.coreEngine.playCinematicVolume(scene, casterPos, anchorPos, 'cube', params, primaryTarget, onHitTarget);
        break;
      case 'Shockwave':
        this.coreEngine.playShockwave(scene, anchorPos, params);
        break;
      case 'Magic Circle':
      case 'Sigil':
        this.coreEngine.playMagicCircleOrAura(scene, anchorPos, false, params);
        break;
      case 'Swirling Aura':
        this.coreEngine.playMagicCircleOrAura(scene, anchorPos, true, params);
        break;
      case 'Smoke / Mist':
      case 'Atmospheric':
        this.coreEngine.playSmokeSparksOrDebris(scene, anchorPos, 'smoke', params);
        break;
      case 'Sparks / Embers':
      case 'Particle':
        this.coreEngine.playSmokeSparksOrDebris(scene, anchorPos, 'sparks', params);
        break;
      case 'Debris':
        this.coreEngine.playSmokeSparksOrDebris(scene, anchorPos, 'debris', params);
        break;
      case 'Light':
        this.coreEngine.playLightAndSurfaceMark(scene, anchorPos, false, params);
        break;
      case 'Surface Mark':
        this.coreEngine.playLightAndSurfaceMark(scene, anchorPos, true, params);
        break;
      case 'Chain Lightning':
        this.newPriorityEngine.playChainLightning(scene, casterPos, targetTokens, params, onHitTarget);
        break;
      case 'Wall':
        this.newPriorityEngine.playWall(scene, new Vector3(0.4, 0, 0), params);
        break;
      case 'Shield / Dome':
        this.newPriorityEngine.playShieldDome(scene, anchorPos, params);
        break;
      case 'Ground Area':
        this.newPriorityEngine.playGroundArea(scene, anchorPos, params);
        break;
      case 'Particle Emitter':
        this.newPriorityEngine.playParticleEmitter(scene, anchorPos, params);
        break;
      case 'Sound':
      case 'Audio':
        this.newPriorityEngine.playSoundCue(params.variant, soundVolumePercent);
        break;
      default:
        this.coreEngine.playCinematicVolume(scene, casterPos, anchorPos, 'nova', params, primaryTarget, onHitTarget);
        break;
    }
  }

  private resolveLayerParams(
    track: EffectTimelineTrackVm,
    activeProps: EffectEmitterCardVm,
    durMs: number,
  ): LayerExecutionParams {
    const app = this.findAppearance(track.appearanceId ?? activeProps.appearanceId);
    return {
      mainHex: track.colorHex || activeProps.colorPrimaryHex || app.colorPrimaryHex,
      coreHex: track.accentHex || activeProps.colorSecondaryHex || app.colorSecondaryHex,
      smokeHex: app.smokeHex,
      element: app.shaderElement as CinematicElementKind,
      durationMs: durMs,
      scale: track.scale ?? activeProps.scale ?? 1.0,
      count: track.count ?? activeProps.count ?? 3,
      opacity: Math.max(0.15, Math.min(1, (track.opacityPercent ?? activeProps.opacityPercent ?? 90) / 100)),
      variant: track.variant ?? activeProps.objectModel ?? 'detailed',
    };
  }

  private findAppearance(id?: EffectAppearanceId) {
    return EFFECT_APPEARANCES_SEED.find((a) => a.id === id) ?? EFFECT_APPEARANCES_SEED[5];
  }
}
