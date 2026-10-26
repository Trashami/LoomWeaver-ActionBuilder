import {
  Color3,
  Color4,
  DynamicTexture,
  GlowLayer,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  PointLight,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import {
  EffectEmitterCardVm,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../models/effect-studio.models';
import {
  ensureEffectBuilderShadersRegistered,
  getParticleAtlasTextures,
} from './effect-glsl-shaders.registry';

export class RuneVortexShaderBuilder {
  private effectRoot: TransformNode | null = null;
  private sigilDisc: Mesh | null = null;
  private outerRuneRing: Mesh | null = null;
  private innerRuneRing: Mesh | null = null;
  private floorGlowDisc: Mesh | null = null;
  private vortexRibbons: Mesh[] = [];
  private ribbonMaterials: ShaderMaterial[] = [];
  private verticalRays: Mesh[] = [];
  private sparkSystem: ParticleSystem | null = null;
  private emberSystem: ParticleSystem | null = null;
  private effectLight: PointLight | null = null;
  private glowLayer: GlowLayer | null = null;

  buildOrUpdateEffectMeshes(
    scene: Scene,
    props: EffectEmitterCardVm,
    forces: EffectMotionForceConfigVm,
  ): void {
    ensureEffectBuilderShadersRegistered();

    if (!this.glowLayer) {
      this.glowLayer = new GlowLayer('lw-fx-glow', scene, { blurKernelSize: 48 });
      this.glowLayer.intensity = 0.56;
    }

    this.disposeCurrentEffect();

    this.effectRoot = new TransformNode('lw-fx-active-root', scene);
    const primary = Color3.FromHexString(props.colorPrimaryHex || '#fcd34d');
    const secondary = Color3.FromHexString(props.colorSecondaryHex || '#fffbeb');
    const radius = Math.max(1.2, props.radius * 0.65);
    const height = Math.max(2.2, props.height * 0.92);
    const alpha = Math.max(0.2, Math.min(1.0, props.opacityPercent / 100));

    // 1. Dynamic Point Light at Center of Rune Vortex
    this.effectLight = new PointLight('lw-fx-center-light', new Vector3(0, 1.85, 0), scene);
    this.effectLight.diffuse = primary;
    this.effectLight.specular = secondary;
    this.effectLight.intensity = props.castLight ? props.lightIntensity * 2.4 : 0.2;
    this.effectLight.range = radius * 5.2;
    this.effectLight.parent = this.effectRoot;

    // 2. Warm Stone Floor Illumination Disc with Paver Normal Map
    this.floorGlowDisc = MeshBuilder.CreateGround(
      'lw-fx-floor-illum',
      { width: radius * 2.55, height: radius * 2.55, subdivisions: 2 },
      scene,
    );
    this.floorGlowDisc.position.set(0, 0.025, 0);
    const floorGlowMat = new StandardMaterial('lw-fx-floor-illum-mat', scene);
    const paverDiff = new Texture('/lighting/dungeon_pavers.png', scene);
    paverDiff.uScale = 3.2;
    paverDiff.vScale = 3.2;
    const paverNorm = new Texture('/lighting/dungeon_pavers_normal.png', scene);
    paverNorm.uScale = 3.2;
    paverNorm.vScale = 3.2;
    paverNorm.level = 1.35;
    floorGlowMat.diffuseTexture = paverDiff;
    floorGlowMat.bumpTexture = paverNorm;
    floorGlowMat.emissiveColor = primary.scale(0.32);
    floorGlowMat.diffuseColor = primary.scale(0.85);
    floorGlowMat.alpha = alpha * 0.42;
    floorGlowMat.alphaMode = 1;
    this.floorGlowDisc.material = floorGlowMat;
    this.floorGlowDisc.parent = this.effectRoot;

    // 3. Intricate Golden Arcane Rune Circle on Dungeon Floor
    this.sigilDisc = MeshBuilder.CreateGround(
      'lw-fx-rune-disc',
      { width: radius * 2.15, height: radius * 2.15, subdivisions: 4 },
      scene,
    );
    this.sigilDisc.position.set(0, 0.042, 0);
    const runeMat = new StandardMaterial('lw-fx-rune-mat', scene);
    const runeTex = this.createRunicCircleTexture(
      scene,
      props.colorPrimaryHex || '#fcd34d',
      props.colorSecondaryHex || '#fffbeb',
    );
    runeMat.diffuseTexture = runeTex;
    runeMat.emissiveTexture = runeTex;
    runeMat.opacityTexture = runeTex;
    runeMat.emissiveColor = primary;
    runeMat.disableLighting = true;
    runeMat.backFaceCulling = false;
    runeMat.alpha = alpha * 0.96;
    runeMat.alphaMode = 1;
    this.sigilDisc.material = runeMat;
    this.sigilDisc.parent = this.effectRoot;

    // 4. Thin Precision Outer & Inner Glowing Rings
    const ringMat = new StandardMaterial('lw-fx-ring-mat', scene);
    ringMat.emissiveColor = secondary;
    ringMat.diffuseColor = primary;
    ringMat.disableLighting = true;
    ringMat.alpha = alpha * 0.85;
    ringMat.alphaMode = 1;

    this.outerRuneRing = MeshBuilder.CreateTorus(
      'lw-fx-outer-torus',
      { diameter: radius * 1.96, thickness: 0.032, tessellation: 64 },
      scene,
    );
    this.outerRuneRing.position.set(0, 0.055, 0);
    this.outerRuneRing.material = ringMat;
    this.outerRuneRing.parent = this.effectRoot;

    this.innerRuneRing = MeshBuilder.CreateTorus(
      'lw-fx-inner-torus',
      { diameter: radius * 1.24, thickness: 0.024, tessellation: 48 },
      scene,
    );
    this.innerRuneRing.position.set(0, 0.065, 0);
    this.innerRuneRing.material = ringMat;
    this.innerRuneRing.parent = this.effectRoot;

    // 5. Graceful S-Curved Ascending Shader Ribbons (loomFireRibbon)
    const ribbonCount = 5;
    const freq = Math.max(1.15, Math.min(2.4, forces.spiralFrequency * 0.58));
    for (let r = 0; r < ribbonCount; r++) {
      const phaseOffset = (r * Math.PI * 2) / ribbonCount;
      const pathA: Vector3[] = [];
      const pathB: Vector3[] = [];
      const steps = 64;
      const baseWidth = r % 2 === 0 ? 0.24 : 0.16;

      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const angle = u * Math.PI * 2 * freq + phaseOffset;
        const waist =
          radius * (0.78 * Math.pow(1 - u, 0.52) + 0.18 * Math.sin(u * Math.PI * 1.65));
        const x = Math.cos(angle) * waist;
        const z = Math.sin(angle) * waist;
        const y = 0.06 + u * height;

        const taper = Math.sin(u * Math.PI) * baseWidth + 0.025;
        const nx = -Math.sin(angle) * taper;
        const nz = Math.cos(angle) * taper;
        const ny = taper * 0.35;

        pathA.push(new Vector3(x - nx, y - ny, z - nz));
        pathB.push(new Vector3(x + nx, y + ny, z + nz));
      }

      const ribbon = MeshBuilder.CreateRibbon(
        `lw-fx-vortex-ribbon-${r}`,
        { pathArray: [pathA, pathB], sideOrientation: Mesh.DOUBLESIDE, updatable: false },
        scene,
      );

      const shaderMat = new ShaderMaterial(
        `lw-fx-ribbon-shader-${r}`,
        scene,
        { vertex: 'loomFireRibbon', fragment: 'loomFireRibbon' },
        {
          attributes: ['position', 'uv'],
          uniforms: ['worldViewProjection', 'uFlame', 'uCore', 'uClock', 'uStrength'],
          needAlphaBlending: true,
        },
      );
      shaderMat.setFloat('uClock', r * 1.3);
      shaderMat.setFloat('uStrength', alpha * (r % 2 === 0 ? 1.15 : 0.9));
      shaderMat.setColor3('uFlame', primary);
      shaderMat.setColor3('uCore', secondary);
      shaderMat.backFaceCulling = false;
      shaderMat.alphaMode = 1;
      ribbon.material = shaderMat;
      ribbon.parent = this.effectRoot;

      this.vortexRibbons.push(ribbon);
      this.ribbonMaterials.push(shaderMat);
    }

    // 6. Vertical Golden Ascension Light Rays
    const rayTex = this.createVerticalRayTexture(
      scene,
      props.colorPrimaryHex || '#fcd34d',
      props.colorSecondaryHex || '#fffbeb',
    );
    const rayMat = new StandardMaterial('lw-fx-ray-mat', scene);
    rayMat.diffuseTexture = rayTex;
    rayMat.emissiveTexture = rayTex;
    rayMat.opacityTexture = rayTex;
    rayMat.emissiveColor = primary;
    rayMat.disableLighting = true;
    rayMat.backFaceCulling = false;
    rayMat.alpha = alpha * 0.58;
    rayMat.alphaMode = 1;

    for (let i = 0; i < 4; i++) {
      const rayPlane = MeshBuilder.CreatePlane(
        `lw-fx-vertical-ray-${i}`,
        { width: radius * 1.35, height: height * 1.05 },
        scene,
      );
      rayPlane.position.set(0, height * 0.52, 0);
      rayPlane.rotation.y = (i * Math.PI) / 4;
      rayPlane.material = rayMat;
      rayPlane.parent = this.effectRoot;
      this.verticalRays.push(rayPlane);
    }

    // 7. Crisp Golden Starlight Sparkles & Soft Rising Embers (ParticleSystem)
    const atlas = getParticleAtlasTextures(scene);
    const sparkEmitter = new TransformNode('lw-fx-spark-emitter', scene);
    sparkEmitter.position.set(0, 0.12, 0);
    sparkEmitter.parent = this.effectRoot;

    const sparks = new ParticleSystem('lw-fx-vortex-sparks', 900, scene);
    sparks.particleTexture = atlas.sparkTex;
    sparks.emitter = sparkEmitter as unknown as Mesh;
    sparks.createCylinderEmitter(radius * 0.88, height * 0.92, 0.15, 0);
    sparks.color1 = new Color4(secondary.r, secondary.g, secondary.b, alpha);
    sparks.color2 = new Color4(primary.r, primary.g, primary.b, alpha * 0.92);
    sparks.colorDead = new Color4(primary.r * 0.6, primary.g * 0.4, 0.05, 0);
    sparks.minSize = Math.max(0.08, props.sizeMin * 0.22);
    sparks.maxSize = Math.min(0.42, Math.max(0.18, props.sizeMax * 0.16));
    sparks.minLifeTime = Math.max(0.5, props.lifetimeSeconds * 0.45);
    sparks.maxLifeTime = Math.max(1.2, props.lifetimeSeconds * 0.85);
    sparks.emitRate = Math.max(45, props.emissionRate * 1.85);
    sparks.blendMode =
      props.blendMode === 'AlphaBlend'
        ? ParticleSystem.BLENDMODE_STANDARD
        : ParticleSystem.BLENDMODE_ADD;
    sparks.gravity = new Vector3(0, Math.max(1.2, forces.gravityY * 1.1), 0);
    sparks.minEmitPower = Math.max(0.4, props.speed * 0.25);
    sparks.maxEmitPower = Math.max(1.1, props.speed * 0.65);
    sparks.minAngularSpeed = -2.2;
    sparks.maxAngularSpeed = 2.2;
    sparks.updateSpeed = 0.016;
    sparks.start();
    this.sparkSystem = sparks;

    const embers = new ParticleSystem('lw-fx-vortex-embers', 550, scene);
    embers.particleTexture = atlas.glowTex;
    embers.emitter = sparkEmitter as unknown as Mesh;
    embers.createCylinderEmitter(radius * 0.95, 0.45, 0, 0);
    embers.color1 = new Color4(primary.r, primary.g, primary.b, alpha * 0.85);
    embers.color2 = new Color4(secondary.r, secondary.g, secondary.b, alpha * 0.75);
    embers.colorDead = new Color4(primary.r * 0.4, primary.g * 0.2, 0.02, 0);
    embers.minSize = 0.06;
    embers.maxSize = 0.22;
    embers.minLifeTime = 0.8;
    embers.maxLifeTime = 2.1;
    embers.emitRate = Math.max(35, props.emissionRate * 1.15);
    embers.blendMode = ParticleSystem.BLENDMODE_ADD;
    embers.gravity = new Vector3(0, 2.2, 0);
    embers.minEmitPower = 0.5;
    embers.maxEmitPower = 1.65;
    embers.updateSpeed = 0.016;
    embers.start();
    this.emberSystem = embers;
  }

  animateAtTime(
    timeSeconds: number,
    props: EffectEmitterCardVm,
    forces: EffectMotionForceConfigVm,
    tracks: readonly EffectTimelineTrackVm[],
    reducedMotion: boolean,
  ): void {
    if (!this.effectRoot) return;

    const isRuneVisible = tracks.find((t) => t.id === 'trk-rune-circle')?.visible ?? true;
    const isBeamVisible = tracks.find((t) => t.id === 'trk-light-beam')?.visible ?? true;
    const isParticlesVisible =
      tracks.find((t) => t.id === 'trk-rising-particles')?.visible ?? true;

    if (this.sigilDisc) this.sigilDisc.setEnabled(isRuneVisible);
    if (this.floorGlowDisc) this.floorGlowDisc.setEnabled(isRuneVisible);
    if (this.outerRuneRing) this.outerRuneRing.setEnabled(isRuneVisible);
    if (this.innerRuneRing) this.innerRuneRing.setEnabled(isRuneVisible);
    this.vortexRibbons.forEach((r) => r.setEnabled(isBeamVisible));
    this.verticalRays.forEach((r) => r.setEnabled(isBeamVisible));

    if (this.sparkSystem) {
      this.sparkSystem.emitRate = isParticlesVisible ? Math.max(45, props.emissionRate * 1.85) : 0;
    }
    if (this.emberSystem) {
      this.emberSystem.emitRate = isParticlesVisible ? Math.max(35, props.emissionRate * 1.15) : 0;
    }

    if (reducedMotion) return;

    const speed = Math.max(0.25, props.speed * 0.35);
    const vortex = Math.max(0.3, forces.vortexStrength * 0.22);

    if (this.sigilDisc) this.sigilDisc.rotation.y = timeSeconds * 0.42 * speed;
    if (this.outerRuneRing) this.outerRuneRing.rotation.y = -timeSeconds * 0.65 * speed;
    if (this.innerRuneRing) this.innerRuneRing.rotation.y = timeSeconds * 0.95 * speed;

    this.vortexRibbons.forEach((ribbon, idx) => {
      const dir = idx % 2 === 0 ? 1 : -0.75;
      ribbon.rotation.y = timeSeconds * (0.85 + idx * 0.16) * vortex * dir;
      const pulse = 0.95 + Math.sin(timeSeconds * 2.8 + idx * 1.2) * 0.06;
      ribbon.scaling.set(pulse, 1, pulse);
    });

    this.ribbonMaterials.forEach((mat, idx) => {
      mat.setFloat('uClock', timeSeconds * (1.2 + idx * 0.15) + idx * 0.9);
    });

    if (this.effectLight && props.castLight) {
      this.effectLight.intensity =
        props.lightIntensity * (2.2 + Math.sin(timeSeconds * 5.2) * 0.32);
    }
  }

  private disposeCurrentEffect(): void {
    this.sparkSystem?.dispose();
    this.sparkSystem = null;
    this.emberSystem?.dispose();
    this.emberSystem = null;
    this.ribbonMaterials.forEach((m) => m.dispose());
    this.ribbonMaterials = [];
    this.vortexRibbons = [];
    this.verticalRays = [];
    if (this.effectRoot) {
      this.effectRoot.dispose();
      this.effectRoot = null;
    }
  }

  private createVerticalRayTexture(
    scene: Scene,
    primaryHex: string,
    secondaryHex: string,
  ): DynamicTexture {
    const tex = new DynamicTexture('lw-fx-ray-tex', { width: 256, height: 512 }, scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 256, 512);

    const hGrad = ctx.createLinearGradient(0, 0, 256, 0);
    hGrad.addColorStop(0, 'rgba(0,0,0,0)');
    hGrad.addColorStop(0.32, `${primaryHex}33`);
    hGrad.addColorStop(0.5, `${secondaryHex}aa`);
    hGrad.addColorStop(0.68, `${primaryHex}33`);
    hGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hGrad;
    ctx.fillRect(0, 0, 256, 512);

    const vGrad = ctx.createLinearGradient(0, 512, 0, 0);
    vGrad.addColorStop(0, `${secondaryHex}dd`);
    vGrad.addColorStop(0.45, `${primaryHex}66`);
    vGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, 256, 512);
    ctx.globalCompositeOperation = 'source-over';
    tex.update();
    return tex;
  }

  private createRunicCircleTexture(
    scene: Scene,
    primaryHex: string,
    secondaryHex: string,
  ): DynamicTexture {
    const tex = new DynamicTexture('lw-fx-rune-tex', { width: 1024, height: 1024 }, scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 1024, 1024);

    const cx = 512;
    const cy = 512;
    const grad = ctx.createRadialGradient(cx, cy, 24, cx, cy, 496);
    grad.addColorStop(0, `${secondaryHex}aa`);
    grad.addColorStop(0.35, `${primaryHex}55`);
    grad.addColorStop(0.75, `${primaryHex}99`);
    grad.addColorStop(0.94, `${secondaryHex}ee`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 496, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = secondaryHex;
    for (const [r, w] of [[476, 7], [442, 4], [388, 6], [296, 4], [184, 5]]) {
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = primaryHex;
    for (let i = 0; i < 16; i++) {
      const a1 = (i * Math.PI) / 8;
      const a2 = ((i + 5) * Math.PI) / 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1) * 388, cy + Math.sin(a1) * 388);
      ctx.lineTo(cx + Math.cos(a2) * 388, cy + Math.sin(a2) * 388);
      ctx.stroke();
    }

    ctx.fillStyle = secondaryHex;
    ctx.font = 'bold 28px Georgia, serif';
    const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛊ'];
    for (let i = 0; i < 32; i++) {
      const angle = (i * Math.PI * 2) / 32;
      const gx = cx + Math.cos(angle) * 415;
      const gy = cy + Math.sin(angle) * 415;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(runes[i % runes.length], -10, 10);
      ctx.restore();
    }
    tex.update();
    return tex;
  }
}
