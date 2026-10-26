import {
  Color3,
  Constants,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
  VertexData,
} from '@babylonjs/core';
import { EffectEmitterCardVm } from '../models/effect-studio.models';
import {
  CINEMATIC_ELEMENTS,
  CINEMATIC_STYLES,
  CinematicElementKind,
  CinematicStyleKind,
  createFireHitShaderMaterial,
  ensureEffectBuilderShadersRegistered,
  excludeMeshFromGlow,
  FIREBALL_FLIGHT_FRACTION,
  fireballCurveXZ,
  getParticleAtlasTextures,
  seeded,
} from './effect-glsl-shaders.registry';
import { StudioTokenMiniatureInstance } from './token-miniature.builder';

/**
 * Refactored structural spell FX engine from
 * `C:\repos\Jane\Jane\MythWeaver\Vtt3d.client\src\app\engine\spell-fx-builder.ts`.
 * Executes multi-layer GPU shader compositions (Fireball/Pyroclasm, Magic Missile 3-bolt
 * Bezier ribbons, Cinematic Beams/Cones/Columns/Novas, and Arcane Sigils) in the 3D studio.
 */
export class StructuralSpellFxEngine {
  playStructuralEffectForEmitter(
    scene: Scene,
    emitter: EffectEmitterCardVm,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const primaryTarget = targetTokens[1] ?? targetTokens[0];
    const targetPos = primaryTarget ? primaryTarget.root.position.clone() : new Vector3(2.8, 0, 0);
    const c1 = emitter.colorPrimaryHex || '#f59e0b';
    const c2 = emitter.colorSecondaryHex || '#fffbeb';
    const id = emitter.id;

    if (id === 'emit-magic-bolt') {
      this.playMagicMissile3D(scene, casterPos, targetTokens, c1, c2, onHitTarget);
      return;
    }

    if (id === 'emit-fire-burst' || id === 'emit-embers') {
      this.playFireballPyroclasm3D(
        scene,
        casterPos,
        targetPos,
        c1,
        c2,
        '#4a4149',
        primaryTarget,
        onHitTarget,
      );
      return;
    }

    if (id === 'emit-lightning-arc' || id === 'emit-energy-beam') {
      this.playCinematicSpellVolume3D(
        scene,
        casterPos,
        targetPos,
        'beam',
        id === 'emit-lightning-arc' ? 'lightning' : 'force',
        c1,
        c2,
        primaryTarget,
        onHitTarget,
      );
      return;
    }

    if (id === 'emit-ice-shards' || id === 'emit-wind-gust') {
      this.playCinematicSpellVolume3D(
        scene,
        casterPos,
        targetPos,
        'cone',
        id === 'emit-ice-shards' ? 'ice' : 'force',
        c1,
        c2,
        primaryTarget,
        onHitTarget,
      );
      return;
    }

    if (id === 'emit-holy-light' || id === 'emit-healing-aura' || id === 'emit-portal') {
      this.playCinematicSpellVolume3D(
        scene,
        casterPos,
        new Vector3(0, 0, 0),
        'column',
        'radiant',
        c1,
        c2,
        primaryTarget,
        onHitTarget,
      );
      return;
    }

    // Default: Arcane Sigil + Nova Wave at center vortex
    this.playArcaneVolumeLayer3D(scene, new Vector3(0, 0, 0), c1, c2, 8, 1350);
    this.playCinematicSpellVolume3D(
      scene,
      casterPos,
      new Vector3(0, 0, 0),
      'nova',
      'force',
      c1,
      c2,
      primaryTarget,
      onHitTarget,
    );
  }

  /**
   * Exact port of `playEffectBuilderFireball3D` from `spell-fx-builder.ts` (lines 694-1180).
   */
  playFireballPyroclasm3D(
    scene: Scene,
    casterPos: Vector3,
    targetPos: Vector3,
    flameHex: string = '#ff5b16',
    coreHex: string = '#fff1bd',
    smokeHex: string = '#4a4149',
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const atlas = getParticleAtlasTextures(scene);
    const root = new TransformNode(`eb-fireball-root-${Date.now()}`, scene);

    const groundY = Math.max(casterPos.y, targetPos.y);
    const dx = targetPos.x - casterPos.x;
    const dz = targetPos.z - casterPos.z;
    const dist = Math.hypot(dx, dz) || 1;

    const releaseXZ = {
      x: casterPos.x + (dx / dist) * 0.45,
      z: casterPos.z + (dz / dist) * 0.45,
    };
    const destXZ = { x: targetPos.x, z: targetPos.z };
    const arcWorldUnits = -Math.min(1.8, Math.max(0.75, dist * 0.16));
    const sampleCurve = (q: number) => fireballCurveXZ(releaseXZ, destXZ, q, arcWorldUnits);

    const stoneLightPlane = MeshBuilder.CreateGround(
      'eb-stone-light-patch',
      { width: 7.5, height: 7.5, subdivisions: 4 },
      scene,
    );
    stoneLightPlane.position.set(casterPos.x, groundY + 0.03, casterPos.z);
    stoneLightPlane.isPickable = false;
    stoneLightPlane.parent = root;

    const stonePatchMat = new StandardMaterial('eb-stone-patch-mat', scene);
    const paversDiff = new Texture('/lighting/dungeon_pavers.png', scene);
    paversDiff.uScale = 2.5;
    paversDiff.vScale = 2.5;
    const paversNorm = new Texture('/lighting/dungeon_pavers_normal.png', scene);
    paversNorm.uScale = 2.5;
    paversNorm.vScale = 2.5;
    paversNorm.level = 1.45;
    stonePatchMat.diffuseTexture = paversDiff;
    stonePatchMat.bumpTexture = paversNorm;
    stonePatchMat.opacityTexture = atlas.glowTex;
    stonePatchMat.specularColor = Color3.FromHexString(flameHex).scale(0.85);
    stonePatchMat.specularPower = 24;
    stonePatchMat.alpha = 0.0;
    stoneLightPlane.material = stonePatchMat;
    excludeMeshFromGlow(scene, stoneLightPlane);

    const spellLight = new PointLight(
      'eb-spell-surface-light',
      new Vector3(casterPos.x, groundY + 1.35, casterPos.z),
      scene,
    );
    spellLight.diffuse = Color3.FromHexString(flameHex);
    spellLight.specular = Color3.FromHexString(coreHex);
    spellLight.intensity = 3.6;
    spellLight.range = 16;

    const casterMat = createFireHitShaderMaterial(scene, 'eb-caster-fire', flameHex, coreHex, smokeHex, 0, 42);
    const casterGroundQuad = MeshBuilder.CreateGround('eb-caster-ground', { width: 3.2, height: 3.2 }, scene);
    casterGroundQuad.position.set(casterPos.x, casterPos.y + 0.12, casterPos.z);
    casterGroundQuad.material = casterMat;
    casterGroundQuad.isPickable = false;
    casterGroundQuad.parent = root;
    excludeMeshFromGlow(scene, casterGroundQuad);

    const projMat = createFireHitShaderMaterial(scene, 'eb-proj-fire', flameHex, coreHex, smokeHex, 1, 42);
    const projHeadBillboard = MeshBuilder.CreatePlane('eb-proj-head-bb', { width: 1.9, height: 1.9 }, scene);
    projHeadBillboard.billboardMode = Mesh.BILLBOARDMODE_ALL;
    projHeadBillboard.material = projMat;
    projHeadBillboard.isPickable = false;
    projHeadBillboard.isVisible = false;
    projHeadBillboard.parent = root;
    excludeMeshFromGlow(scene, projHeadBillboard);

    // 34-Segment Dynamic Tapered Fire Ribbon
    const ribbonMesh = new Mesh('eb-fire-trail-ribbon', scene);
    ribbonMesh.isPickable = false;
    ribbonMesh.parent = root;
    excludeMeshFromGlow(scene, ribbonMesh);

    const ribbonPositions = new Float32Array(34 * 2 * 3);
    const ribbonNormals = new Float32Array(34 * 2 * 3);
    const ribbonUVs = new Float32Array(34 * 2 * 2);
    const ribbonIndices: number[] = [];
    for (let i = 0; i < 34; i++) {
      ribbonUVs.set([i / 33, 0, i / 33, 1], i * 4);
      ribbonNormals.set([0, 1, 0, 0, 1, 0], i * 6);
      if (i < 33) {
        const j = i * 2;
        ribbonIndices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
      }
    }
    const ribbonVD = new VertexData();
    ribbonVD.positions = ribbonPositions;
    ribbonVD.normals = ribbonNormals;
    ribbonVD.uvs = ribbonUVs;
    ribbonVD.indices = ribbonIndices;
    ribbonVD.applyToMesh(ribbonMesh, true);

    const ribbonMat = new ShaderMaterial(
      'eb-fire-ribbon-mat',
      scene,
      { vertex: 'loomFireRibbon', fragment: 'loomFireRibbon' },
      {
        attributes: ['position', 'uv'],
        uniforms: ['worldViewProjection', 'uFlame', 'uCore', 'uClock', 'uStrength'],
        needAlphaBlending: true,
      },
    );
    ribbonMat.backFaceCulling = false;
    ribbonMat.alphaMode = Constants.ALPHA_COMBINE;
    ribbonMat.setColor3('uFlame', Color3.FromHexString(flameHex));
    ribbonMat.setColor3('uCore', Color3.FromHexString(coreHex));
    ribbonMesh.material = ribbonMat;
    ribbonMesh.isVisible = false;

    const impactMat = createFireHitShaderMaterial(scene, 'eb-impact-fire', flameHex, coreHex, smokeHex, 2, 42);
    const impactGround = MeshBuilder.CreateGround('eb-impact-ground', { width: 8.2, height: 8.2 }, scene);
    impactGround.position.set(targetPos.x, targetPos.y + 0.14, targetPos.z);
    impactGround.material = impactMat;
    impactGround.isPickable = false;
    impactGround.isVisible = false;
    impactGround.parent = root;
    excludeMeshFromGlow(scene, impactGround);

    const impactBillboard = MeshBuilder.CreatePlane('eb-impact-bb', { width: 7.4, height: 7.4 }, scene);
    impactBillboard.position.set(targetPos.x, targetPos.y + 1.25, targetPos.z);
    impactBillboard.billboardMode = Mesh.BILLBOARDMODE_ALL;
    impactBillboard.material = impactMat;
    impactBillboard.isPickable = false;
    impactBillboard.isVisible = false;
    impactBillboard.parent = root;
    excludeMeshFromGlow(scene, impactBillboard);

    const startTime = performance.now();
    const casterDuration = 680;
    const projDelay = 160;
    const projDuration = 950;
    const impactDelay = 720;
    const impactDuration = 1850;
    const totalDuration = impactDelay + impactDuration;
    let impactTriggered = false;

    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - startTime;
      const pCaster = elapsed / casterDuration;
      if (pCaster >= 0 && pCaster <= 1) {
        casterGroundQuad.isVisible = true;
        casterMat.setFloat('uProgress', pCaster);
        casterMat.setFloat('uClock', elapsed / 1000);
      } else {
        casterGroundQuad.isVisible = false;
      }

      const localProj = elapsed - projDelay;
      const pProj = localProj / projDuration;
      const flight = Math.min(1, Math.max(0, pProj / FIREBALL_FLIGHT_FRACTION));
      const projClock = Math.max(0, localProj / 1000);
      const projEnvelope =
        pProj >= 0 && pProj <= 1
          ? Math.max(0, 1 - Math.max(0, pProj - FIREBALL_FLIGHT_FRACTION) * 12)
          : 0;

      if (pProj >= 0 && flight < 1) {
        const headPt = sampleCurve(flight);
        const flightArcY =
          casterPos.y * (1 - flight) +
          targetPos.y * flight +
          0.95 +
          Math.sin(flight * Math.PI) * 0.45;
        projHeadBillboard.isVisible = true;
        projHeadBillboard.position.set(headPt.x, flightArcY, headPt.z);
        projMat.setFloat('uProgress', flight);
        projMat.setFloat('uClock', projClock);
        stoneLightPlane.position.set(headPt.x, groundY + 0.03, headPt.z);
        stonePatchMat.alpha = 0.7 * projEnvelope;
        spellLight.position.set(headPt.x, flightArcY + 0.7, headPt.z);
        spellLight.intensity = 4.2 * projEnvelope;
      } else {
        projHeadBillboard.isVisible = false;
      }

      if (projEnvelope > 0.01 && flight > 0.01) {
        ribbonMesh.isVisible = true;
        const begin = Math.max(0, flight - 0.38);
        const width = 0.56;
        for (let i = 0; i < 34; i++) {
          const u = i / 33;
          const p = begin + (flight - begin) * u;
          const q = sampleCurve(p);
          const next = sampleCurve(Math.min(1, p + 0.004));
          const before = sampleCurve(Math.max(0, p - 0.004));
          const segD = Math.hypot(next.x - before.x, next.z - before.z) || 1;
          const nx = -(next.z - before.z) / segD;
          const nz = (next.x - before.x) / segD;
          const taper = Math.pow(u, 0.8);
          const w = width * taper;
          const ry = 0.85 + Math.sin(p * Math.PI) * 0.35;
          ribbonPositions.set(
            [q.x + nx * w, ry, q.z + nz * w, q.x - nx * w, ry, q.z - nz * w],
            i * 6,
          );
        }
        ribbonMesh.updateVerticesData('position', ribbonPositions);
        ribbonMat.setFloat('uClock', projClock);
        ribbonMat.setFloat('uStrength', projEnvelope);
      } else {
        ribbonMesh.isVisible = false;
      }

      const localImpact = elapsed - impactDelay;
      const pImpact = localImpact / impactDuration;
      if (pImpact >= 0 && pImpact <= 1) {
        if (!impactTriggered) {
          impactTriggered = true;
          if (targetInstance && onHitTarget) onHitTarget(targetInstance);
        }
        impactGround.isVisible = true;
        impactBillboard.isVisible = true;
        impactMat.setFloat('uProgress', pImpact);
        impactMat.setFloat('uClock', localImpact / 1000);
        const gain = Math.pow(1 - pImpact, 0.7);
        stoneLightPlane.position.set(targetPos.x, targetPos.y + 0.03, targetPos.z);
        stonePatchMat.alpha = 0.82 * gain;
        spellLight.position.set(targetPos.x, targetPos.y + 1.8, targetPos.z);
        spellLight.intensity = 6.2 * gain;
      }

      if (elapsed >= totalDuration) {
        scene.onBeforeRenderObservable.remove(obs);
        spellLight.dispose();
        casterMat.dispose();
        projMat.dispose();
        ribbonMat.dispose();
        impactMat.dispose();
        stonePatchMat.dispose();
        paversDiff.dispose();
        paversNorm.dispose();
        root.dispose();
      }
    });
  }

  /**
   * Exact port of `playEffectBuilderMagicMissile3D` from `spell-fx-builder.ts` (lines 1186-1370).
   */
  playMagicMissile3D(
    scene: Scene,
    casterPos: Vector3,
    targetTokens: readonly StudioTokenMiniatureInstance[],
    mainHex: string = '#38bdf8',
    coreHex: string = '#e0f2fe',
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const atlas = getParticleAtlasTextures(scene);
    const launchGap = 95;
    const flightMs = 1150;

    for (let bolt = 0; bolt < 3; bolt++) {
      const lane = bolt - 1;
      const targetTok = targetTokens[bolt % Math.max(1, targetTokens.length)];
      const targetPos = targetTok ? targetTok.root.position.clone() : new Vector3(2.8, 0, lane * 2.0);

      setTimeout(() => {
        const boltRoot = new TransformNode(`eb-mm-bolt-${bolt}-${Date.now()}`, scene);
        const ribbonMesh = new Mesh(`eb-mm-ribbon-${bolt}`, scene);
        ribbonMesh.isPickable = false;
        ribbonMesh.parent = boltRoot;
        excludeMeshFromGlow(scene, ribbonMesh);

        const positions = new Float32Array(34 * 2 * 3);
        const normals = new Float32Array(34 * 2 * 3);
        const uvs = new Float32Array(34 * 2 * 2);
        const indices: number[] = [];
        for (let i = 0; i < 34; i++) {
          uvs.set([i / 33, 0, i / 33, 1], i * 4);
          normals.set([0, 1, 0, 0, 1, 0], i * 6);
          if (i < 33) {
            const j = i * 2;
            indices.push(j, j + 1, j + 2, j + 1, j + 3, j + 2);
          }
        }
        const vd = new VertexData();
        vd.positions = positions;
        vd.normals = normals;
        vd.uvs = uvs;
        vd.indices = indices;
        vd.applyToMesh(ribbonMesh, true);

        const ribbonMat = new ShaderMaterial(
          `eb-mm-ribbon-mat-${bolt}`,
          scene,
          { vertex: 'loomFireRibbon', fragment: 'loomFireRibbon' },
          {
            attributes: ['position', 'uv'],
            uniforms: ['worldViewProjection', 'uFlame', 'uCore', 'uClock', 'uStrength'],
            needAlphaBlending: true,
          },
        );
        ribbonMat.backFaceCulling = false;
        ribbonMat.alphaMode = Constants.ALPHA_COMBINE;
        ribbonMat.setColor3('uFlame', Color3.FromHexString(mainHex));
        ribbonMat.setColor3('uCore', Color3.FromHexString(coreHex));
        ribbonMesh.material = ribbonMat;

        const headPlane = MeshBuilder.CreatePlane(`eb-mm-head-${bolt}`, { width: 1.1, height: 1.1 }, scene);
        headPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
        headPlane.isPickable = false;
        headPlane.parent = boltRoot;
        const headMat = new StandardMaterial(`eb-mm-head-mat-${bolt}`, scene);
        headMat.diffuseTexture = atlas.glowTex;
        headMat.opacityTexture = atlas.glowTex;
        headMat.emissiveTexture = atlas.glowTex;
        headMat.emissiveColor = Color3.FromHexString(coreHex);
        headMat.disableLighting = true;
        headMat.alphaMode = Constants.ALPHA_ADD;
        headPlane.material = headMat;

        const sampleMissile = (progress: number): Vector3 => {
          const p = Math.max(0, Math.min(1, progress));
          const dx = targetPos.x - casterPos.x;
          const dz = targetPos.z - casterPos.z;
          const d = Math.max(1, Math.hypot(dx, dz));
          const nx = -dz / d;
          const nz = dx / d;
          const spawn = new Vector3(casterPos.x + 0.4, 1.35, casterPos.z + lane * 0.35);
          const dest = new Vector3(targetPos.x, 1.1, targetPos.z);
          const bend = 1.65 * (lane === 0 ? 0.35 : lane);
          const mid = Vector3.Lerp(spawn, dest, 0.5).add(new Vector3(nx * bend, 0.85, nz * bend));
          const u = 1 - p;
          return spawn.scale(u * u).add(mid.scale(2 * u * p)).add(dest.scale(p * p));
        };

        const t0 = performance.now();
        const obs = scene.onBeforeRenderObservable.add(() => {
          const elapsed = performance.now() - t0;
          const p = Math.min(1, elapsed / flightMs);
          const pos = sampleMissile(p);
          headPlane.position.copyFrom(pos);

          const begin = Math.max(0, p - 0.32);
          for (let i = 0; i < 34; i++) {
            const u = i / 33;
            const s = begin + (p - begin) * u;
            const q = sampleMissile(s);
            const next = sampleMissile(Math.min(1, s + 0.006));
            const segDx = next.x - q.x;
            const segDz = next.z - q.z;
            const segD = Math.hypot(segDx, segDz) || 1;
            const nx = -segDz / segD;
            const nz = segDx / segD;
            const w = 0.26 * Math.pow(u, 0.85);
            positions.set(
              [q.x + nx * w, q.y, q.z + nz * w, q.x - nx * w, q.y, q.z - nz * w],
              i * 6,
            );
          }
          ribbonMesh.updateVerticesData('position', positions);
          ribbonMat.setFloat('uClock', elapsed / 1000);
          ribbonMat.setFloat('uStrength', p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15));

          if (p >= 1) {
            scene.onBeforeRenderObservable.remove(obs);
            if (targetTok && onHitTarget) onHitTarget(targetTok);
            ribbonMat.dispose();
            headMat.dispose();
            boltRoot.dispose();
          }
        });
      }, bolt * launchGap);
    }
  }

  /**
   * Exact port of `playEffectBuilderCinematicSpell3D` from `spell-fx-builder.ts` (lines 1380-1521).
   */
  playCinematicSpellVolume3D(
    scene: Scene,
    casterPos: Vector3,
    targetPos: Vector3,
    style: CinematicStyleKind,
    element: CinematicElementKind,
    mainHex: string,
    coreHex: string,
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (target: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-cinematic-${style}-${Date.now()}`, scene);

    const mat = new ShaderMaterial(
      `eb-cinematic-mat-${Date.now()}`,
      scene,
      { vertex: 'loomCinematicVolume', fragment: 'loomCinematicVolume' },
      {
        attributes: ['position', 'uv'],
        uniforms: [
          'worldViewProjection',
          'uMain',
          'uCore',
          'uClock',
          'uProgress',
          'uStyle',
          'uElement',
          'uTurbulence',
          'uAlpha',
        ],
        needAlphaBlending: true,
      },
    );
    mat.backFaceCulling = false;
    mat.alphaMode = Constants.ALPHA_COMBINE;
    mat.setColor3('uMain', Color3.FromHexString(mainHex));
    mat.setColor3('uCore', Color3.FromHexString(coreHex));
    mat.setFloat('uStyle', CINEMATIC_STYLES.indexOf(style));
    mat.setFloat('uElement', CINEMATIC_ELEMENTS.indexOf(element));
    mat.setFloat('uTurbulence', 1.15);
    mat.setFloat('uAlpha', 1.0);

    const dx = targetPos.x - casterPos.x;
    const dz = targetPos.z - casterPos.z;
    const dist = Math.max(1.5, Math.hypot(dx, dz));
    const angle = Math.atan2(dz, dx);
    const along = style === 'beam' || style === 'cone';
    const length = along ? dist : 5.4;
    const width = style === 'beam' ? 2.2 : style === 'cone' ? Math.max(3.8, dist * 0.8) : length;

    const groundPlane = MeshBuilder.CreateGround('eb-cinematic-ground', { width: length, height: width }, scene);
    if (along) {
      groundPlane.position.set(
        casterPos.x + Math.cos(angle) * (length * 0.5),
        0.18,
        casterPos.z + Math.sin(angle) * (length * 0.5),
      );
      groundPlane.rotation.y = -angle;
    } else {
      groundPlane.position.set(targetPos.x, 0.16, targetPos.z);
    }
    groundPlane.material = mat;
    groundPlane.isPickable = false;
    groundPlane.parent = root;
    excludeMeshFromGlow(scene, groundPlane);

    if (targetInstance && onHitTarget) onHitTarget(targetInstance);

    const t0 = performance.now();
    const dur = 1150;
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const p = Math.min(1, elapsed / dur);
      const alpha = Math.min(1, p * 8) * Math.min(1, (1 - p) * 4.5);
      mat.setFloat('uClock', elapsed / 1000);
      mat.setFloat('uProgress', p);
      mat.setFloat('uAlpha', alpha);
      if (p >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  playArcaneVolumeLayer3D(
    scene: Scene,
    anchorPos: Vector3,
    mainHex: string,
    coreHex: string,
    mode: number,
    durationMs: number,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const mat = new ShaderMaterial(
      `eb-arcane-vol-${Date.now()}`,
      scene,
      { vertex: 'loomArcaneVolume', fragment: 'loomArcaneVolume' },
      {
        attributes: ['position', 'uv'],
        uniforms: [
          'worldViewProjection',
          'uMain',
          'uCore',
          'uTime',
          'uProgress',
          'uMode',
          'uVariant',
          'uStrength',
        ],
        needAlphaBlending: true,
      },
    );
    mat.backFaceCulling = false;
    mat.alphaMode = Constants.ALPHA_COMBINE;
    mat.setColor3('uMain', Color3.FromHexString(mainHex));
    mat.setColor3('uCore', Color3.FromHexString(coreHex));
    mat.setFloat('uMode', mode);
    mat.setFloat('uVariant', 1);
    mat.setFloat('uStrength', 1);

    const ground = MeshBuilder.CreateGround('eb-arcane-ground', { width: 5.2, height: 5.2 }, scene);
    ground.position.set(anchorPos.x, anchorPos.y + 0.08, anchorPos.z);
    ground.material = mat;
    ground.isPickable = false;
    excludeMeshFromGlow(scene, ground);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const p = Math.min(1, elapsed / durationMs);
      const envelope = Math.min(1, p * 6) * (1 - p);
      mat.setFloat('uTime', elapsed / 1000);
      mat.setFloat('uProgress', p);
      mat.setFloat('uStrength', envelope * 1.25);
      ground.rotation.y += 0.025;
      if (p >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        ground.dispose();
        mat.dispose();
      }
    });
  }
}
