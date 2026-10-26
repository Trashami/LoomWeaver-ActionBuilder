import {
  Color3, Constants, Mesh, MeshBuilder, PointLight, Scene, ShaderMaterial,
  StandardMaterial, TransformNode, Vector3,
} from '@babylonjs/core';
import {
  CINEMATIC_ELEMENTS, ensureEffectBuilderShadersRegistered, excludeMeshFromGlow,
  getParticleAtlasTextures, seeded,
} from './effect-glsl-shaders.registry';
import { LayerExecutionParams } from './extracted-core-fx.engine';
import { StudioTokenMiniatureInstance } from './token-miniature.builder';

/**
 * First-Wave Priority New Effects from the Vtt3d Engine Analysis:
 * 1. Chain Lightning (multi-target sequential jumping arcs)
 * 2. Wall (straight/curved/segmented vertical barrier)
 * 3. Shield / Dome (enclosing spherical ward shell)
 * 4. Ground Area (persistent magical terrain)
 * 5. Particle Emitter (general sprite/mesh motes, leaves, snow, spores)
 * 6. Sound (WebAudio procedural spatial cue synthesis)
 */
export class NewPriorityFxEngine {
  /**
   * True multi-target Chain Lightning: jumps from Caster -> Target 1 -> Target 2 -> Target 3
   * with branching jagged lightning arcs, ozone flashes, and sequential hit recoil.
   */
  playChainLightning(
    scene: Scene, casterPos: Vector3, targets: readonly StudioTokenMiniatureInstance[],
    p: LayerExecutionParams, onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    const hopCount = Math.max(1, Math.min(targets.length, p.count || 3));
    const chainNodes: Vector3[] = [casterPos.add(new Vector3(0.3, 1.35, 0))];
    for (let i = 0; i < hopCount; i++) {
      chainNodes.push(targets[i].root.position.add(new Vector3(0, 1.15, 0)));
    }

    for (let hop = 0; hop < chainNodes.length - 1; hop++) {
      const fromPt = chainNodes[hop];
      const toPt = chainNodes[hop + 1];
      const hitTok = targets[hop];

      setTimeout(() => {
        const hopRoot = new TransformNode(`eb-chain-hop-${hop}-${Date.now()}`, scene);
        const mat = new StandardMaterial(`eb-chain-mat-${hop}-${Date.now()}`, scene);
        mat.emissiveColor = Color3.FromHexString(p.coreHex);
        mat.diffuseColor = Color3.FromHexString(p.mainHex);
        mat.disableLighting = true;
        mat.alphaMode = Constants.ALPHA_ADD;

        const arcMeshes: Mesh[] = [];
        // Main jagged arc + 2 secondary branching forks per hop
        for (let strand = 0; strand < 3; strand++) {
          const pts: Vector3[] = [];
          const steps = 14;
          for (let s = 0; s <= steps; s++) {
            const u = s / steps;
            const base = Vector3.Lerp(fromPt, toPt, u);
            if (s > 0 && s < steps) {
              const jitter = (strand === 0 ? 0.24 : 0.42) * p.scale;
              base.x += (Math.random() - 0.5) * jitter;
              base.y += (Math.random() - 0.5) * jitter;
              base.z += (Math.random() - 0.5) * jitter;
            }
            pts.push(base);
          }
          const tube = MeshBuilder.CreateTube(
            `eb-chain-tube-${hop}-${strand}`,
            { path: pts, radius: strand === 0 ? 0.055 * p.scale : 0.028 * p.scale, tessellation: 8 },
            scene,
          );
          tube.material = mat;
          tube.isPickable = false;
          tube.parent = hopRoot;
          arcMeshes.push(tube);
        }

        const flash = new PointLight(`eb-chain-flash-${hop}`, toPt.clone(), scene);
        flash.diffuse = Color3.FromHexString(p.mainHex);
        flash.intensity = 4.5 * p.opacity;
        flash.range = 10;

        if (hitTok && onHitTarget) onHitTarget(hitTok);

        const t0 = performance.now();
        const hopDur = Math.max(380, p.durationMs * 0.55);
        const obs = scene.onBeforeRenderObservable.add(() => {
          const u = Math.min(1, (performance.now() - t0) / hopDur);
          mat.alpha = p.opacity * (1 - u) * (0.7 + Math.random() * 0.3);
          flash.intensity = 4.5 * (1 - u);
          if (u >= 1) {
            scene.onBeforeRenderObservable.remove(obs);
            flash.dispose();
            mat.dispose();
            hopRoot.dispose();
          }
        });
      }, hop * 140);
    }
  }

  /**
   * Segmented vertical elemental/arcane Wall barrier between caster and targets.
   */
  playWall(scene: Scene, anchorPos: Vector3, p: LayerExecutionParams): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-wall-${Date.now()}`, scene);
    const mat = new ShaderMaterial(
      `eb-wall-mat-${Date.now()}`, scene,
      { vertex: 'loomCinematicVolume', fragment: 'loomCinematicVolume' },
      {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'uMain', 'uCore', 'uClock', 'uProgress', 'uStyle', 'uElement', 'uTurbulence', 'uAlpha'],
        needAlphaBlending: true,
      },
    );
    mat.backFaceCulling = false;
    mat.alphaMode = Constants.ALPHA_COMBINE;
    mat.setColor3('uMain', Color3.FromHexString(p.mainHex));
    mat.setColor3('uCore', Color3.FromHexString(p.coreHex));
    mat.setFloat('uStyle', 2); // column/wall vertical shader
    mat.setFloat('uElement', CINEMATIC_ELEMENTS.indexOf(p.element));
    mat.setFloat('uTurbulence', 1.25);

    const segCount = Math.max(3, Math.min(9, p.count || 5));
    const wallWidth = 5.4 * p.scale;
    const segW = wallWidth / segCount;
    const wallH = 2.8 * p.scale;

    for (let i = 0; i < segCount; i++) {
      const offset = (i - (segCount - 1) / 2) * (segW * 0.92);
      const curveZ = Math.sin((i / Math.max(1, segCount - 1)) * Math.PI) * 0.55;
      const panel = MeshBuilder.CreatePlane(`eb-wall-seg-${i}`, { width: segW * 1.1, height: wallH, sideOrientation: Mesh.DOUBLESIDE }, scene);
      panel.position.set(anchorPos.x + curveZ, wallH * 0.5, anchorPos.z + offset);
      panel.rotation.y = Math.PI / 2;
      panel.material = mat;
      panel.isPickable = false;
      panel.parent = root;
      excludeMeshFromGlow(scene, panel);
    }

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      const rise = Math.min(1, u * 6);
      root.scaling.y = rise;
      mat.setFloat('uClock', elapsed / 1000);
      mat.setFloat('uProgress', u * 0.5);
      mat.setFloat('uAlpha', p.opacity * (1 - Math.max(0, (u - 0.78) / 0.22)));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  /**
   * Enclosing hemispherical Shield / Dome shell + rotating base ward ring.
   */
  playShieldDome(scene: Scene, anchorPos: Vector3, p: LayerExecutionParams): void {
    const root = new TransformNode(`eb-dome-${Date.now()}`, scene);
    root.position.copyFrom(anchorPos);

    const dome = MeshBuilder.CreateSphere(
      'eb-shield-dome-sphere',
      { diameter: 3.4 * p.scale, segments: 24, slice: 0.55, sideOrientation: Mesh.DOUBLESIDE },
      scene,
    );
    dome.position.y = 0.05;
    dome.isPickable = false;
    dome.parent = root;

    const mat = new StandardMaterial(`eb-dome-mat-${Date.now()}`, scene);
    mat.emissiveColor = Color3.FromHexString(p.mainHex);
    mat.diffuseColor = Color3.FromHexString(p.coreHex);
    mat.alpha = 0.38 * p.opacity;
    mat.alphaMode = Constants.ALPHA_ADD;
    mat.backFaceCulling = false;
    dome.material = mat;

    const rim = MeshBuilder.CreateTorus('eb-dome-rim', { diameter: 3.35 * p.scale, thickness: 0.055, tessellation: 48 }, scene);
    rim.position.y = 0.08;
    rim.material = mat;
    rim.isPickable = false;
    rim.parent = root;

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      const pulse = 0.97 + Math.sin(elapsed * 0.008) * 0.04;
      dome.scaling.set(pulse, pulse, pulse);
      dome.rotation.y += 0.015;
      mat.alpha = 0.42 * p.opacity * Math.min(1, u * 6) * (1 - Math.max(0, (u - 0.8) / 0.2));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  /**
   * Persistent Ground Area (Fire, Ice, Acid, Grease, Webs, Chokrah Ritual) + rising surface bubbles/spores.
   */
  playGroundArea(scene: Scene, anchorPos: Vector3, p: LayerExecutionParams): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-ground-area-${Date.now()}`, scene);
    const mat = new ShaderMaterial(
      `eb-ga-mat-${Date.now()}`, scene,
      { vertex: 'loomArcaneVolume', fragment: 'loomArcaneVolume' },
      {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'uMain', 'uCore', 'uTime', 'uProgress', 'uMode', 'uVariant', 'uStrength'],
        needAlphaBlending: true,
      },
    );
    mat.backFaceCulling = false;
    mat.alphaMode = Constants.ALPHA_COMBINE;
    mat.setColor3('uMain', Color3.FromHexString(p.mainHex));
    mat.setColor3('uCore', Color3.FromHexString(p.coreHex));
    mat.setFloat('uMode', 5); // ground wave / pool mode
    mat.setFloat('uVariant', 2);

    const disc = MeshBuilder.CreateGround('eb-ga-disc', { width: 5.6 * p.scale, height: 5.6 * p.scale }, scene);
    disc.position.set(anchorPos.x, anchorPos.y + 0.06, anchorPos.z);
    disc.material = mat;
    disc.isPickable = false;
    disc.parent = root;
    excludeMeshFromGlow(scene, disc);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      mat.setFloat('uTime', elapsed / 1000);
      mat.setFloat('uProgress', u * 0.65);
      mat.setFloat('uStrength', p.opacity * Math.min(1, u * 5) * (1 - Math.max(0, (u - 0.82) / 0.18)));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  /**
   * General Particle Emitter for custom sprites/meshes: Rain, Snow, Fey Leaves, Spores, Motes.
   */
  playParticleEmitter(scene: Scene, anchorPos: Vector3, p: LayerExecutionParams): void {
    const atlas = getParticleAtlasTextures(scene);
    const root = new TransformNode(`eb-gen-emitter-${Date.now()}`, scene);
    const count = Math.max(12, Math.min(60, p.count || 32));
    const mat = new StandardMaterial(`eb-gen-pmat-${Date.now()}`, scene);
    mat.diffuseTexture = atlas.sparkTex;
    mat.opacityTexture = atlas.sparkTex;
    mat.emissiveTexture = atlas.sparkTex;
    mat.emissiveColor = Color3.FromHexString(p.coreHex);
    mat.diffuseColor = Color3.FromHexString(p.mainHex);
    mat.disableLighting = true;
    mat.alphaMode = Constants.ALPHA_ADD;

    const motes: { mesh: Mesh; angle: number; radius: number; y0: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const m = MeshBuilder.CreatePlane(`eb-mote-${i}`, { width: 0.28 * p.scale, height: 0.28 * p.scale }, scene);
      m.billboardMode = Mesh.BILLBOARDMODE_ALL;
      m.material = mat;
      m.isPickable = false;
      m.parent = root;
      motes.push({
        mesh: m,
        angle: seeded(i, 11) * Math.PI * 2,
        radius: (0.4 + seeded(i, 12) * 2.4) * p.scale,
        y0: seeded(i, 13) * 2.5,
        speed: 0.8 + seeded(i, 14) * 1.6,
      });
    }

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = (performance.now() - t0) / 1000;
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      for (const mt of motes) {
        const a = mt.angle + elapsed * mt.speed * 1.8;
        const y = 0.2 + ((mt.y0 + elapsed * mt.speed * 1.4) % (3.6 * p.scale));
        mt.mesh.position.set(
          anchorPos.x + Math.cos(a) * mt.radius,
          y,
          anchorPos.z + Math.sin(a) * mt.radius,
        );
      }
      mat.alpha = p.opacity * (1 - Math.max(0, (u - 0.8) / 0.2));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  /**
   * Positioned WebAudio procedural sound synthesis for the Sound timeline track.
   */
  playSoundCue(cueVariant: string, volumePercent: number = 85): void {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const v = Math.max(0.02, Math.min(0.35, (volumePercent / 100) * 0.22));
      const now = ctx.currentTime;
      const low = (cueVariant || '').toLowerCase();

      if (low.includes('boom') || low.includes('pyroclasm')) {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(36, now + 0.65);
      } else if (low.includes('thunder') || low.includes('lightning')) {
        osc.type = 'square';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);
      } else if (low.includes('choir') || low.includes('radiant')) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.75);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
      }

      gain.gain.setValueAtTime(v, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.78);
      setTimeout(() => ctx.close().catch(() => {}), 900);
    } catch {
      // AudioContext blocked until user gesture
    }
  }
}
