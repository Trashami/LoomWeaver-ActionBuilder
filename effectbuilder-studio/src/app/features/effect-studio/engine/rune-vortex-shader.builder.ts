import {
  Color3,
  DynamicTexture,
  GlowLayer,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import {
  EffectEmitterCardVm,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../models/effect-studio.models';

export class RuneVortexShaderBuilder {
  private effectRoot: TransformNode | null = null;
  private sigilDisc: Mesh | null = null;
  private outerRuneRing: Mesh | null = null;
  private innerRuneRing: Mesh | null = null;
  private vortexRibbons: Mesh[] = [];
  private sparkParticles: Mesh[] = [];
  private effectLight: PointLight | null = null;
  private glowLayer: GlowLayer | null = null;

  buildOrUpdateEffectMeshes(
    scene: Scene,
    props: EffectEmitterCardVm,
    forces: EffectMotionForceConfigVm,
  ): void {
    if (!this.glowLayer) {
      this.glowLayer = new GlowLayer('lw-fx-glow', scene, {
        blurKernelSize: 32,
      });
      this.glowLayer.intensity = 0.85;
    }

    if (this.effectRoot) {
      this.effectRoot.dispose();
    }
    this.vortexRibbons = [];
    this.sparkParticles = [];

    this.effectRoot = new TransformNode('lw-fx-active-root', scene);
    const primary = Color3.FromHexString(props.colorPrimaryHex || '#fcd34d');
    const secondary = Color3.FromHexString(props.colorSecondaryHex || '#fffbeb');
    const radius = Math.max(1.0, props.radius);
    const height = Math.max(1.2, props.height);
    const alpha = Math.max(0.15, Math.min(1.0, props.opacityPercent / 100));

    // 1. Dynamic Point Light at Center of Rune Vortex
    this.effectLight = new PointLight('lw-fx-center-light', new Vector3(0, 2.4, 0), scene);
    this.effectLight.diffuse = primary;
    this.effectLight.specular = secondary;
    this.effectLight.intensity = props.castLight ? props.lightIntensity * 2.2 : 0.15;
    this.effectLight.range = radius * 4.5;
    this.effectLight.parent = this.effectRoot;

    // 2. Concentric Inscribed Arcane Rune Circle on Dungeon Floor
    this.sigilDisc = MeshBuilder.CreateGround(
      'lw-fx-rune-disc',
      { width: radius * 2.25, height: radius * 2.25, subdivisions: 4 },
      scene,
    );
    this.sigilDisc.position.set(0, 0.05, 0);
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
    runeMat.alpha = alpha;
    this.sigilDisc.material = runeMat;
    this.sigilDisc.parent = this.effectRoot;

    // 3. Outer & Inner Glowing Torus Rings
    const ringMat = new StandardMaterial('lw-fx-ring-mat', scene);
    ringMat.emissiveColor = primary;
    ringMat.diffuseColor = secondary;
    ringMat.alpha = alpha * 0.9;

    this.outerRuneRing = MeshBuilder.CreateTorus(
      'lw-fx-outer-torus',
      { diameter: radius * 2.05, thickness: 0.09, tessellation: 48 },
      scene,
    );
    this.outerRuneRing.position.set(0, 0.08, 0);
    this.outerRuneRing.material = ringMat;
    this.outerRuneRing.parent = this.effectRoot;

    this.innerRuneRing = MeshBuilder.CreateTorus(
      'lw-fx-inner-torus',
      { diameter: radius * 1.32, thickness: 0.07, tessellation: 36 },
      scene,
    );
    this.innerRuneRing.position.set(0, 0.1, 0);
    this.innerRuneRing.material = ringMat;
    this.innerRuneRing.parent = this.effectRoot;

    // 4. Helical Ascending Light Ribbons (Swirling Vortex Pillar)
    const ribbonCount = 3;
    const freq = Math.max(1.2, forces.spiralFrequency);
    for (let r = 0; r < ribbonCount; r++) {
      const phaseOffset = (r * Math.PI * 2) / ribbonCount;
      const path: Vector3[] = [];
      const steps = 44;
      for (let s = 0; s <= steps; s++) {
        const u = s / steps;
        const angle = u * Math.PI * 2 * freq + phaseOffset;
        const currentR = radius * (0.72 - u * 0.48) + Math.sin(u * Math.PI) * 0.35;
        const x = Math.cos(angle) * currentR;
        const z = Math.sin(angle) * currentR;
        const y = 0.12 + u * height;
        path.push(new Vector3(x, y, z));
      }

      const tube = MeshBuilder.CreateTube(
        `lw-fx-vortex-ribbon-${r}`,
        {
          path,
          radiusFunction: (idx) => {
            const norm = idx / steps;
            return Math.sin(norm * Math.PI) * 0.14 + 0.03;
          },
          tessellation: 12,
          cap: Mesh.CAP_ALL,
        },
        scene,
      );
      const tubeMat = new StandardMaterial(`lw-fx-tube-mat-${r}`, scene);
      tubeMat.emissiveColor = r % 2 === 0 ? primary : secondary;
      tubeMat.diffuseColor = primary;
      tubeMat.alpha = alpha * 0.88;
      tubeMat.disableLighting = true;
      tube.material = tubeMat;
      tube.parent = this.effectRoot;
      this.vortexRibbons.push(tube);
    }

    // 5. Rising Golden Spark & Ember Particles
    const sparkCount = Math.min(96, Math.max(24, Math.floor(props.emissionRate * 0.55)));
    const sparkMat = new StandardMaterial('lw-fx-spark-mat', scene);
    sparkMat.emissiveColor = secondary;
    sparkMat.diffuseColor = primary;
    sparkMat.disableLighting = true;
    sparkMat.alpha = alpha;

    for (let i = 0; i < sparkCount; i++) {
      const seedAngle = (i * 137.5 * Math.PI) / 180;
      const seedRadius = ((i % 17) / 17) * radius * 0.95;
      const seedHeight = ((i * 29) % 100) / 100;
      const size =
        props.sizeMin + ((i % 7) / 7) * Math.max(0.08, (props.sizeMax - props.sizeMin) * 0.22);

      const spark = MeshBuilder.CreateSphere(
        `lw-fx-spark-${i}`,
        { diameter: Math.min(0.26, Math.max(0.07, size * 0.18)), segments: 6 },
        scene,
      );
      spark.material = sparkMat;
      spark.metadata = {
        seedAngle,
        seedRadius,
        seedHeight,
        speedFactor: 0.65 + (i % 5) * 0.22,
      };
      spark.parent = this.effectRoot;
      this.sparkParticles.push(spark);
    }
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
    if (this.outerRuneRing) this.outerRuneRing.setEnabled(isRuneVisible);
    if (this.innerRuneRing) this.innerRuneRing.setEnabled(isRuneVisible);
    this.vortexRibbons.forEach((r) => r.setEnabled(isBeamVisible));
    this.sparkParticles.forEach((s) => s.setEnabled(isParticlesVisible));

    if (reducedMotion) return;

    const speed = Math.max(0.2, props.speed);
    const height = Math.max(1.2, props.height);

    if (this.sigilDisc) {
      this.sigilDisc.rotation.y = timeSeconds * 0.55 * speed;
    }
    if (this.outerRuneRing) {
      this.outerRuneRing.rotation.y = -timeSeconds * 0.8 * speed;
    }
    if (this.innerRuneRing) {
      this.innerRuneRing.rotation.y = timeSeconds * 1.15 * speed;
    }

    this.vortexRibbons.forEach((tube, idx) => {
      tube.rotation.y = timeSeconds * (1.25 + idx * 0.25) * speed;
      const pulse = 0.94 + Math.sin(timeSeconds * 3.5 + idx) * 0.08;
      tube.scaling.set(pulse, 1, pulse);
    });

    for (const spark of this.sparkParticles) {
      const meta = spark.metadata as {
        seedAngle: number;
        seedRadius: number;
        seedHeight: number;
        speedFactor: number;
      };
      const cycle = (meta.seedHeight + timeSeconds * 0.38 * speed * meta.speedFactor) % 1;
      const angle = meta.seedAngle + timeSeconds * forces.vortexStrength * 0.65 + cycle * 4.2;
      const curR = meta.seedRadius * (1.0 - cycle * 0.35);
      spark.position.set(
        Math.cos(angle) * curR,
        0.15 + cycle * height,
        Math.sin(angle) * curR,
      );
    }

    if (this.effectLight && props.castLight) {
      this.effectLight.intensity =
        props.lightIntensity * (2.0 + Math.sin(timeSeconds * 6.0) * 0.28);
    }
  }

  private createRunicCircleTexture(
    scene: Scene,
    primaryHex: string,
    secondaryHex: string,
  ): DynamicTexture {
    const tex = new DynamicTexture('lw-fx-rune-tex', { width: 512, height: 512 }, scene, false);
    tex.hasAlpha = true;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, 512, 512);

    const cx = 256;
    const cy = 256;

    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 248);
    grad.addColorStop(0, `${secondaryHex}cc`);
    grad.addColorStop(0.45, `${primaryHex}88`);
    grad.addColorStop(0.85, `${primaryHex}ee`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 248, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = secondaryHex;
    ctx.lineWidth = 5;
    for (const r of [232, 198, 146, 88]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Hexagram & Octagram Geometric Lines (No star icon font, pure geometric runic circle)
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
      const a1 = (i * Math.PI) / 6;
      const a2 = ((i + 5) * Math.PI) / 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a1) * 196, cy + Math.sin(a1) * 196);
      ctx.lineTo(cx + Math.cos(a2) * 196, cy + Math.sin(a2) * 196);
      ctx.stroke();
    }

    // Arcane Runic Marks around Outer Rim
    ctx.fillStyle = secondaryHex;
    ctx.font = 'bold 20px Georgia, serif';
    const glyphs = ['I', 'V', 'X', 'M', 'D', 'C', 'L', 'A', 'E', 'O', 'U', 'N', 'R', 'S', 'T', 'K'];
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      const gx = cx + Math.cos(angle) * 214;
      const gy = cy + Math.sin(angle) * 214;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle + Math.PI / 2);
      ctx.fillText(glyphs[i % glyphs.length], -6, 6);
      ctx.restore();
    }

    tex.update();
    return tex;
  }
}
