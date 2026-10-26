import {
  Color3, Constants, Mesh, MeshBuilder, PointLight, Scene, ShaderMaterial,
  StandardMaterial, Texture, TransformNode, Vector3, VertexData,
} from '@babylonjs/core';
import {
  CINEMATIC_ELEMENTS, CINEMATIC_STYLES, CinematicElementKind, CinematicStyleKind,
  createFireHitShaderMaterial, ensureEffectBuilderShadersRegistered, excludeMeshFromGlow,
  fireballCurveXZ, getParticleAtlasTextures, seeded,
} from './effect-glsl-shaders.registry';
import { StudioTokenMiniatureInstance } from './token-miniature.builder';

export interface LayerExecutionParams {
  readonly mainHex: string;
  readonly coreHex: string;
  readonly smokeHex: string;
  readonly element: CinematicElementKind;
  readonly durationMs: number;
  readonly scale: number;
  readonly count: number;
  readonly opacity: number;
  readonly variant: string;
}

/**
 * Independently executes each of the 18 Extracted Core Building Blocks from `spell-fx-builder.ts`
 * with full support for `count`, `scale`, `opacity`, and decoupled `element` / `appearance`.
 */
export class ExtractedCoreFxEngine {
  playCastingCharge(scene: Scene, casterPos: Vector3, p: LayerExecutionParams): void {
    ensureEffectBuilderShadersRegistered();
    const mat = createFireHitShaderMaterial(scene, `eb-cast-${Date.now()}`, p.mainHex, p.coreHex, p.smokeHex, 0, 42);
    const quad = MeshBuilder.CreateGround('eb-cast-quad', { width: 3.2 * p.scale, height: 3.2 * p.scale }, scene);
    quad.position.set(casterPos.x, casterPos.y + 0.12, casterPos.z);
    quad.material = mat;
    quad.isPickable = false;
    excludeMeshFromGlow(scene, quad);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      mat.setFloat('uProgress', u);
      mat.setFloat('uClock', (performance.now() - t0) / 1000);
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        quad.dispose();
        mat.dispose();
      }
    });
  }

  playProjectile(
    scene: Scene, casterPos: Vector3, targetPos: Vector3, p: LayerExecutionParams,
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const mat = createFireHitShaderMaterial(scene, `eb-proj-${Date.now()}`, p.mainHex, p.coreHex, p.smokeHex, 1, 42);
    const head = MeshBuilder.CreatePlane('eb-proj-head', { width: 1.85 * p.scale, height: 1.85 * p.scale }, scene);
    head.billboardMode = Mesh.BILLBOARDMODE_ALL;
    head.material = mat;
    head.isPickable = false;
    excludeMeshFromGlow(scene, head);

    const dist = Math.hypot(targetPos.x - casterPos.x, targetPos.z - casterPos.z) || 1;
    const arc = -Math.min(1.8, Math.max(0.75, dist * 0.16));
    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      const pt = fireballCurveXZ(casterPos, targetPos, u, arc);
      const y = 0.95 + Math.sin(u * Math.PI) * 0.45;
      head.position.set(pt.x, y, pt.z);
      mat.setFloat('uProgress', u);
      mat.setFloat('uClock', (performance.now() - t0) / 1000);
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        if (targetInstance && onHitTarget) onHitTarget(targetInstance);
        head.dispose();
        mat.dispose();
      }
    });
  }

  playProjectileVolley(
    scene: Scene, casterPos: Vector3, targets: readonly StudioTokenMiniatureInstance[],
    p: LayerExecutionParams, onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const atlas = getParticleAtlasTextures(scene);
    const boltCount = Math.max(1, Math.min(9, p.count || 3));
    const launchGap = 85;

    for (let b = 0; b < boltCount; b++) {
      const lane = b - (boltCount - 1) / 2;
      const tok = targets[b % Math.max(1, targets.length)];
      const destPos = tok ? tok.root.position.clone() : new Vector3(2.8, 0, lane * 1.4);

      setTimeout(() => {
        const root = new TransformNode(`eb-volley-${b}-${Date.now()}`, scene);
        const { ribbonMesh, ribbonPositions, ribbonMat } = this.createRibbonTrail(scene, root, `eb-v-rib-${b}`, p.mainHex, p.coreHex);
        const head = MeshBuilder.CreatePlane(`eb-v-head-${b}`, { width: 1.05 * p.scale, height: 1.05 * p.scale }, scene);
        head.billboardMode = Mesh.BILLBOARDMODE_ALL;
        head.isPickable = false;
        head.parent = root;
        const headMat = new StandardMaterial(`eb-v-hmat-${b}`, scene);
        headMat.diffuseTexture = atlas.glowTex;
        headMat.opacityTexture = atlas.glowTex;
        headMat.emissiveTexture = atlas.glowTex;
        headMat.emissiveColor = Color3.FromHexString(p.coreHex);
        headMat.disableLighting = true;
        headMat.alphaMode = Constants.ALPHA_ADD;
        head.material = headMat;

        const sample = (u: number): Vector3 => {
          const dx = destPos.x - casterPos.x;
          const dz = destPos.z - casterPos.z;
          const d = Math.max(1, Math.hypot(dx, dz));
          const spawn = new Vector3(casterPos.x + 0.4, 1.35, casterPos.z + lane * 0.28);
          const dest = new Vector3(destPos.x, 1.1, destPos.z);
          const bend = 1.45 * (lane === 0 ? 0.35 : lane);
          const mid = Vector3.Lerp(spawn, dest, 0.5).add(new Vector3((-dz / d) * bend, 0.8, (dx / d) * bend));
          const inv = 1 - u;
          return spawn.scale(inv * inv).add(mid.scale(2 * inv * u)).add(dest.scale(u * u));
        };

        const t0 = performance.now();
        const obs = scene.onBeforeRenderObservable.add(() => {
          const elapsed = performance.now() - t0;
          const u = Math.min(1, elapsed / p.durationMs);
          head.position.copyFrom(sample(u));
          const begin = Math.max(0, u - 0.34);
          for (let i = 0; i < 34; i++) {
            const f = i / 33;
            const s = begin + (u - begin) * f;
            const q = sample(s);
            const nxt = sample(Math.min(1, s + 0.006));
            const segD = Math.hypot(nxt.x - q.x, nxt.z - q.z) || 1;
            const nx = -(nxt.z - q.z) / segD;
            const nz = (nxt.x - q.x) / segD;
            const w = 0.25 * p.scale * Math.pow(f, 0.85);
            ribbonPositions.set([q.x + nx * w, q.y, q.z + nz * w, q.x - nx * w, q.y, q.z - nz * w], i * 6);
          }
          ribbonMesh.updateVerticesData('position', ribbonPositions);
          ribbonMat.setFloat('uClock', elapsed / 1000);
          ribbonMat.setFloat('uStrength', p.opacity * (u < 0.85 ? 1 : Math.max(0, 1 - (u - 0.85) / 0.15)));
          if (u >= 1) {
            scene.onBeforeRenderObservable.remove(obs);
            if (tok && onHitTarget) onHitTarget(tok);
            ribbonMat.dispose();
            headMat.dispose();
            root.dispose();
          }
        });
      }, b * launchGap);
    }
  }

  playObjectProjectile(
    scene: Scene, casterPos: Vector3, targetPos: Vector3, p: LayerExecutionParams,
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    const model = (p.variant || 'Tooth').toLowerCase();
    const mesh = model.includes('boulder') || model.includes('orb')
      ? MeshBuilder.CreatePolyhedron('eb-obj-proj', { type: 2, size: 0.28 * p.scale }, scene)
      : MeshBuilder.CreateCylinder('eb-obj-proj', { diameterTop: 0.04, diameterBottom: 0.24 * p.scale, height: 0.56 * p.scale, tessellation: 10 }, scene);
    const mat = new StandardMaterial('eb-obj-mat', scene);
    mat.diffuseColor = Color3.FromHexString(p.coreHex);
    mat.emissiveColor = Color3.FromHexString(p.mainHex).scale(0.65);
    mesh.material = mat;
    mesh.isPickable = false;

    const origin = casterPos.add(new Vector3(0, 1.35, 0));
    const impact = targetPos.add(new Vector3(0, 1.1, 0));
    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      const pos = Vector3.Lerp(origin, impact, u);
      pos.y += Math.sin(u * Math.PI) * 0.65;
      mesh.position.copyFrom(pos);
      mesh.rotation.x += 0.35;
      mesh.rotation.y += 0.45;
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        if (targetInstance && onHitTarget) onHitTarget(targetInstance);
        mesh.dispose();
        mat.dispose();
      }
    });
  }

  playTrail(scene: Scene, casterPos: Vector3, targetPos: Vector3, p: LayerExecutionParams): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-trail-${Date.now()}`, scene);
    const { ribbonMesh, ribbonPositions, ribbonMat } = this.createRibbonTrail(scene, root, 'eb-standalone-trail', p.mainHex, p.coreHex);
    const dist = Math.hypot(targetPos.x - casterPos.x, targetPos.z - casterPos.z) || 1;
    const arc = -Math.min(1.8, Math.max(0.75, dist * 0.16));
    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      const begin = Math.max(0, u - 0.42);
      for (let i = 0; i < 34; i++) {
        const f = i / 33;
        const s = begin + (u - begin) * f;
        const q = fireballCurveXZ(casterPos, targetPos, s, arc);
        const nxt = fireballCurveXZ(casterPos, targetPos, Math.min(1, s + 0.005), arc);
        const segD = Math.hypot(nxt.x - q.x, nxt.z - q.z) || 1;
        const nx = -(nxt.z - q.z) / segD;
        const nz = (nxt.x - q.x) / segD;
        const w = 0.52 * p.scale * Math.pow(f, 0.8);
        const ry = 0.85 + Math.sin(s * Math.PI) * 0.35;
        ribbonPositions.set([q.x + nx * w, ry, q.z + nz * w, q.x - nx * w, ry, q.z - nz * w], i * 6);
      }
      ribbonMesh.updateVerticesData('position', ribbonPositions);
      ribbonMat.setFloat('uClock', elapsed / 1000);
      ribbonMat.setFloat('uStrength', p.opacity * (1 - Math.max(0, (u - 0.8) / 0.2)));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        ribbonMat.dispose();
        root.dispose();
      }
    });
  }

  playCinematicVolume(
    scene: Scene, casterPos: Vector3, targetPos: Vector3,
    style: CinematicStyleKind, p: LayerExecutionParams,
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-cin-${style}-${Date.now()}`, scene);
    const mat = new ShaderMaterial(
      `eb-cin-mat-${Date.now()}`, scene,
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
    mat.setFloat('uStyle', CINEMATIC_STYLES.indexOf(style));
    mat.setFloat('uElement', CINEMATIC_ELEMENTS.indexOf(p.element));
    mat.setFloat('uTurbulence', 1.15);

    const dx = targetPos.x - casterPos.x;
    const dz = targetPos.z - casterPos.z;
    const dist = Math.max(1.5, Math.hypot(dx, dz));
    const angle = Math.atan2(dz, dx);
    const along = style === 'beam' || style === 'cone';
    const length = (along ? dist : 5.2) * p.scale;
    const width = (style === 'beam' ? 2.2 : style === 'cone' ? Math.max(3.8, dist * 0.8) : 5.2) * p.scale;

    const ground = MeshBuilder.CreateGround('eb-cin-ground', { width: length, height: width }, scene);
    if (along) {
      ground.position.set(casterPos.x + Math.cos(angle) * (length * 0.5), 0.18, casterPos.z + Math.sin(angle) * (length * 0.5));
      ground.rotation.y = -angle;
    } else {
      ground.position.set(targetPos.x, 0.16, targetPos.z);
    }
    ground.material = mat;
    ground.isPickable = false;
    ground.parent = root;
    excludeMeshFromGlow(scene, ground);

    // If Box Burst ('cube'), add a true 3D volumetric box shell so it isn't just a flat plane
    if (style === 'cube') {
      const cubeBox = MeshBuilder.CreateBox('eb-box-burst-vol', { size: 3.4 * p.scale }, scene);
      cubeBox.position.set(targetPos.x, 1.75 * p.scale, targetPos.z);
      cubeBox.material = mat;
      cubeBox.isPickable = false;
      cubeBox.parent = root;
      excludeMeshFromGlow(scene, cubeBox);
    }

    if (targetInstance && onHitTarget) onHitTarget(targetInstance);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      mat.setFloat('uClock', elapsed / 1000);
      mat.setFloat('uProgress', u);
      mat.setFloat('uAlpha', p.opacity * Math.min(1, u * 8) * Math.min(1, (1 - u) * 4.5));
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  playDetailedBurst(
    scene: Scene, targetPos: Vector3, p: LayerExecutionParams,
    targetInstance?: StudioTokenMiniatureInstance,
    onHitTarget?: (t: StudioTokenMiniatureInstance) => void,
  ): void {
    if (p.variant === 'simple') {
      this.playCinematicVolume(scene, targetPos, targetPos, 'nova', p, targetInstance, onHitTarget);
      return;
    }
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-burst-${Date.now()}`, scene);
    const mat = createFireHitShaderMaterial(scene, `eb-burst-mat-${Date.now()}`, p.mainHex, p.coreHex, p.smokeHex, 2, 42);
    const ground = MeshBuilder.CreateGround('eb-burst-g', { width: 7.8 * p.scale, height: 7.8 * p.scale }, scene);
    ground.position.set(targetPos.x, targetPos.y + 0.14, targetPos.z);
    ground.material = mat;
    ground.isPickable = false;
    ground.parent = root;
    excludeMeshFromGlow(scene, ground);

    const bb = MeshBuilder.CreatePlane('eb-burst-bb', { width: 7.0 * p.scale, height: 7.0 * p.scale }, scene);
    bb.position.set(targetPos.x, targetPos.y + 1.25, targetPos.z);
    bb.billboardMode = Mesh.BILLBOARDMODE_ALL;
    bb.material = mat;
    bb.isPickable = false;
    bb.parent = root;
    excludeMeshFromGlow(scene, bb);

    if (targetInstance && onHitTarget) onHitTarget(targetInstance);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      mat.setFloat('uProgress', u);
      mat.setFloat('uClock', elapsed / 1000);
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  playShockwave(scene: Scene, anchorPos: Vector3, p: LayerExecutionParams): void {
    const ring = MeshBuilder.CreateTorus('eb-shockwave', { diameter: 1.4, thickness: 0.08, tessellation: 48 }, scene);
    ring.position.set(anchorPos.x, anchorPos.y + 0.18, anchorPos.z);
    ring.isPickable = false;
    const mat = new StandardMaterial(`eb-sw-mat-${Date.now()}`, scene);
    mat.emissiveColor = Color3.FromHexString(p.coreHex);
    mat.diffuseColor = Color3.FromHexString(p.mainHex);
    mat.disableLighting = true;
    mat.alphaMode = Constants.ALPHA_ADD;
    ring.material = mat;

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      const s = (0.5 + u * 4.2) * p.scale;
      ring.scaling.set(s, 1, s);
      mat.alpha = p.opacity * (1 - u);
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        ring.dispose();
        mat.dispose();
      }
    });
  }

  playMagicCircleOrAura(scene: Scene, anchorPos: Vector3, isAura: boolean, p: LayerExecutionParams): void {
    ensureEffectBuilderShadersRegistered();
    const root = new TransformNode(`eb-arcane-${Date.now()}`, scene);
    const mat = new ShaderMaterial(
      `eb-arc-mat-${Date.now()}`, scene,
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
    mat.setFloat('uMode', isAura ? 4 : 8);
    mat.setFloat('uVariant', 1);

    const ground = MeshBuilder.CreateGround('eb-arc-g', { width: 4.8 * p.scale, height: 4.8 * p.scale }, scene);
    ground.position.set(anchorPos.x, anchorPos.y + 0.08, anchorPos.z);
    ground.material = mat;
    ground.isPickable = false;
    ground.parent = root;
    excludeMeshFromGlow(scene, ground);

    // If Swirling Aura, add ascending 3D cylindrical shell around the anchor (not just a flat ground plane!)
    if (isAura) {
      const cyl = MeshBuilder.CreateCylinder(
        'eb-aura-cyl',
        { diameterTop: 2.2 * p.scale, diameterBottom: 2.8 * p.scale, height: 2.8 * p.scale, tessellation: 28, sideOrientation: Mesh.DOUBLESIDE },
        scene,
      );
      cyl.position.set(anchorPos.x, anchorPos.y + 1.45 * p.scale, anchorPos.z);
      cyl.material = mat;
      cyl.isPickable = false;
      cyl.parent = root;
      excludeMeshFromGlow(scene, cyl);
    }

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / p.durationMs);
      mat.setFloat('uTime', elapsed / 1000);
      mat.setFloat('uProgress', u);
      mat.setFloat('uStrength', p.opacity * Math.min(1, u * 6) * (1 - u) * 1.25);
      ground.rotation.y += 0.025;
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  playSmokeSparksOrDebris(
    scene: Scene, anchorPos: Vector3, kind: 'smoke' | 'sparks' | 'debris', p: LayerExecutionParams,
  ): void {
    const atlas = getParticleAtlasTextures(scene);
    const root = new TransformNode(`eb-part-${kind}-${Date.now()}`, scene);
    const count = Math.max(6, Math.min(48, p.count || 20));
    const mat = new StandardMaterial(`eb-pmat-${kind}-${Date.now()}`, scene);
    const tex = kind === 'smoke' ? atlas.smokeTex : kind === 'sparks' ? atlas.sparkTex : atlas.debrisTex;
    mat.diffuseTexture = tex;
    mat.opacityTexture = tex;
    mat.emissiveTexture = tex;
    mat.emissiveColor = Color3.FromHexString(kind === 'smoke' ? p.mainHex : p.coreHex);
    mat.disableLighting = true;
    mat.alphaMode = kind === 'smoke' ? Constants.ALPHA_COMBINE : Constants.ALPHA_ADD;

    const items: { mesh: Mesh; vx: number; vy: number; vz: number }[] = [];
    for (let i = 0; i < count; i++) {
      const sz = (kind === 'smoke' ? 1.4 : kind === 'sparks' ? 0.42 : 0.28) * p.scale;
      const m = MeshBuilder.CreatePlane(`eb-p-${i}`, { width: sz, height: sz }, scene);
      m.billboardMode = Mesh.BILLBOARDMODE_ALL;
      m.isPickable = false;
      m.material = mat;
      m.parent = root;
      const a = seeded(i, 1) * Math.PI * 2;
      const spd = (0.8 + seeded(i, 2) * 2.6) * p.scale;
      items.push({ mesh: m, vx: Math.cos(a) * spd, vy: 1.4 + seeded(i, 3) * 2.8, vz: Math.sin(a) * spd });
    }

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const dt = (performance.now() - t0) / 1000;
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      const grav = kind === 'smoke' ? -0.4 : 4.2;
      for (const it of items) {
        it.mesh.position.set(
          anchorPos.x + it.vx * dt,
          Math.max(0.12, anchorPos.y + 0.35 + it.vy * dt - 0.5 * grav * dt * dt),
          anchorPos.z + it.vz * dt,
        );
      }
      mat.alpha = p.opacity * (1 - u);
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        mat.dispose();
        root.dispose();
      }
    });
  }

  playLightAndSurfaceMark(
    scene: Scene, anchorPos: Vector3, includeScorch: boolean, p: LayerExecutionParams,
  ): void {
    const atlas = getParticleAtlasTextures(scene);
    const root = new TransformNode(`eb-light-mark-${Date.now()}`, scene);
    const light = new PointLight('eb-layer-light', new Vector3(anchorPos.x, anchorPos.y + 1.6, anchorPos.z), scene);
    light.diffuse = Color3.FromHexString(p.mainHex);
    light.specular = Color3.FromHexString(p.coreHex);
    light.range = 14 * p.scale;

    const patch = MeshBuilder.CreateGround('eb-mark-patch', { width: 5.5 * p.scale, height: 5.5 * p.scale }, scene);
    patch.position.set(anchorPos.x, anchorPos.y + 0.03, anchorPos.z);
    patch.isPickable = false;
    patch.parent = root;
    const mat = new StandardMaterial('eb-mark-mat', scene);
    const diff = new Texture('/lighting/dungeon_pavers.png', scene);
    const norm = new Texture('/lighting/dungeon_pavers_normal.png', scene);
    mat.diffuseTexture = diff;
    mat.bumpTexture = norm;
    mat.opacityTexture = includeScorch ? atlas.smokeTex : atlas.glowTex;
    mat.emissiveColor = Color3.FromHexString(p.mainHex).scale(includeScorch ? 0.25 : 0.65);
    patch.material = mat;
    excludeMeshFromGlow(scene, patch);

    const t0 = performance.now();
    const obs = scene.onBeforeRenderObservable.add(() => {
      const u = Math.min(1, (performance.now() - t0) / p.durationMs);
      const gain = Math.pow(1 - u, 0.7) * p.opacity;
      light.intensity = (includeScorch ? 1.8 : 4.5) * gain;
      mat.alpha = 0.8 * gain;
      if (u >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        light.dispose();
        mat.dispose();
        diff.dispose();
        norm.dispose();
        root.dispose();
      }
    });
  }

  private createRibbonTrail(
    scene: Scene, parent: TransformNode, name: string, flameHex: string, coreHex: string,
  ): { ribbonMesh: Mesh; ribbonPositions: Float32Array; ribbonMat: ShaderMaterial } {
    const ribbonMesh = new Mesh(name, scene);
    ribbonMesh.isPickable = false;
    ribbonMesh.parent = parent;
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
    const vd = new VertexData();
    vd.positions = ribbonPositions;
    vd.normals = ribbonNormals;
    vd.uvs = ribbonUVs;
    vd.indices = ribbonIndices;
    vd.applyToMesh(ribbonMesh, true);

    const ribbonMat = new ShaderMaterial(
      `${name}-mat`, scene,
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
    return { ribbonMesh, ribbonPositions, ribbonMat };
  }
}
