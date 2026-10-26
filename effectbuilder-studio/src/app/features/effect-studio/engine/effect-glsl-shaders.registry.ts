import {
  Color3,
  Constants,
  DynamicTexture,
  Effect,
  Mesh,
  Scene,
  ShaderMaterial,
} from '@babylonjs/core';

let shadersRegistered = false;

export const FIREBALL_FLIGHT_FRACTION = 0.6;

export const CINEMATIC_STYLES = ['beam', 'cone', 'column', 'nova', 'cube'] as const;
export type CinematicStyleKind = (typeof CINEMATIC_STYLES)[number];

export const CINEMATIC_ELEMENTS = ['force', 'fire', 'ice', 'gas', 'radiant', 'lightning', 'acid', 'shadow'] as const;
export type CinematicElementKind = (typeof CINEMATIC_ELEMENTS)[number];

export interface ParticleAtlasTextures {
  readonly smokeTex: DynamicTexture;
  readonly glowTex: DynamicTexture;
  readonly sparkTex: DynamicTexture;
  readonly debrisTex: DynamicTexture;
}

const ATLAS_CACHE = new WeakMap<Scene, ParticleAtlasTextures>();

export function seeded(i: number, seed: number): number {
  const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

export function fireballCurveXZ(
  from: { x: number; z: number },
  to: { x: number; z: number },
  t: number,
  arcWorldUnits: number,
): { x: number; z: number } {
  const p = Math.max(0, Math.min(1, t));
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const d = Math.hypot(dx, dz) || 1;
  const u = p * p * (1.45 - 0.45 * p);
  const bow = Math.sin(u * Math.PI) * arcWorldUnits;
  return { x: from.x + dx * u - (dz / d) * bow, z: from.z + dz * u + (dx / d) * bow };
}

export function excludeMeshFromGlow(scene: Scene, mesh: Mesh): void {
  scene.effectLayers?.forEach((layer: unknown) => {
    const glowLayer = layer as { addExcludedMesh?: (m: Mesh) => void };
    if (typeof glowLayer.addExcludedMesh === 'function') {
      glowLayer.addExcludedMesh(mesh);
    }
  });
}

/**
 * Registers the exact EffectBuilder GLSL shaders ported from
 * `C:\repos\Jane\Jane\MythWeaver\Vtt3d.client\src\app\engine\spell-fx-builder.ts`.
 */
export function ensureEffectBuilderShadersRegistered(): void {
  if (shadersRegistered) return;
  shadersRegistered = true;

  const sharedVertex = `
    precision highp float;
    attribute vec3 position;
    attribute vec2 uv;
    uniform mat4 worldViewProjection;
    varying vec2 vUV;
    void main() {
      vUV = uv;
      gl_Position = worldViewProjection * vec4(position, 1.0);
    }
  `;

  Effect.ShadersStore['loomFireHitVertexShader'] = sharedVertex;
  Effect.ShadersStore['loomFireHitPixelShader'] = `
    precision highp float;
    varying vec2 vUV;
    uniform vec4 uColor;
    uniform float uProgress;
    uniform float uMode;
    uniform float uClock;
    uniform float uBloom;
    uniform float uDistortion;
    uniform float uScorch;
    uniform float uSeed;
    uniform float uSmoke;
    uniform float uLight;
    uniform float uShadow;
    uniform float uTurbulence;
    uniform float uEmbers;
    uniform vec3 uFlame;
    uniform vec3 uCore;
    uniform vec3 uSmokeColor;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uSeed) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      float n = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) {
        n += a * noise(p);
        p = mat2(1.6, -1.2, 1.2, 1.6) * p + 3.1;
        a *= 0.5;
      }
      return n;
    }
    void over(inout vec4 dst, vec3 color, float alpha) {
      alpha = clamp(alpha, 0.0, 1.0);
      dst = vec4(color * alpha + dst.rgb * (1.0 - alpha), alpha + dst.a * (1.0 - alpha));
    }
    void main() {
      vec2 p = (vUV - 0.5) * 5.6;
      float t = clamp(uProgress, 0.0, 1.0);
      float onset = smoothstep(0.0, 0.018, t);
      float tail = 1.0 - smoothstep(0.68, 1.0, t);
      float fireLife = 1.0 - smoothstep(0.22, 0.68, t);

      if (uMode < 0.5) {
        onset = smoothstep(0.0, 0.3, t);
        fireLife = (0.3 + 0.7 * t) * (1.0 - smoothstep(0.72, 1.0, t));
        tail = fireLife;
      } else if (uMode < 1.5) {
        onset = 1.0;
        fireLife = 1.0;
        tail = 0.0;
      }

      float radius = uMode < 0.5 ? 0.6 + t * 0.25 : uMode < 1.5 ? 0.7 : 0.12 + 1.05 * (1.0 - exp(-t * 18.0));
      vec2 warp = vec2(fbm(p * 2.0 + uClock), fbm(p * 2.1 - uClock));
      vec2 flow = p * 3.4 + vec2(-uClock * 2.3, uClock * 1.6) + (warp - 0.5) * uDistortion * 2.0;
      float n = fbm(flow);
      float detail = fbm(flow * 2.1 + vec2(t * 3.0, -t * 2.0));
      float dist = length(p * vec2(1.0, 1.1));
      float density = (radius - dist) + (n - 0.5) * (0.35 + uTurbulence * 0.8) + (detail - 0.5) * 0.19;
      float flame = smoothstep(-0.08, 0.22, density) * fireLife;
      if (uMode < 0.5) flame *= smoothstep(0.35, 0.52, dist);

      float smokeNoise = fbm(p * 2.6 + vec2(-t * 0.8, t * 2.0));
      vec2 smokeP = p - vec2(0.12, -t * 0.78);
      float smokeBody = smoothstep(0.0, 0.42, (0.5 + t * 0.95) - length(smokeP * vec2(1.0, 0.9)) + (smokeNoise - 0.5) * 0.65);
      float smoke = smokeBody * uSmoke * smoothstep(0.06, 0.4, t) * tail;
      if (uMode < 1.5) smoke = 0.0;

      vec4 result = vec4(0.0);
      float shadow = exp(-dot((p - vec2(0.3, 0.42)) * vec2(2.4, 4.0), (p - vec2(0.3, 0.42)) * vec2(2.4, 4.0))) * uShadow * tail;
      float scorch = exp(-dist * dist * 2.4) * smoothstep(0.12, 0.45, t) * tail * uShadow * 0.4;
      over(result, vec3(0.015, 0.012, 0.018), (uMode > 1.5 ? max(shadow, scorch * uScorch) : 0.0) * 0.8);

      float illumination = exp(-dist * dist * 0.65) * uLight * fireLife;
      over(result, uFlame, illumination * (0.12 + uBloom * 0.18));

      float dx = fbm(flow + vec2(0.07, 0.0)) - n;
      float dy = fbm(flow + vec2(0.0, 0.07)) - n;
      vec3 normal = normalize(vec3(-dx * 8.0, -dy * 8.0, 0.7));
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.6, -0.65, 1.0))));
      vec3 smokeLit = uSmokeColor * (0.32 + diffuse * 0.55) + uFlame * illumination * 0.32;
      over(result, smokeLit, smoke * 0.85);

      float heat = clamp(density * 0.7 + detail * 0.65, 0.0, 1.0);
      vec3 fireColor = mix(uFlame * 0.55, uFlame, clamp(heat * 2.0, 0.0, 1.0));
      fireColor = mix(fireColor, uCore, smoothstep(0.64, 1.0, heat));
      over(result, fireColor, flame * 0.96);

      float flash = exp(-dist * dist * 12.0) * exp(-t * 23.0);
      over(result, uCore, flash * 0.9 * (uMode > 1.5 ? 1.0 : 0.0));

      float waveRadius = 0.15 + t * 3.8;
      float wave = exp(-pow((dist - waveRadius) * 19.0, 2.0)) * (1.0 - smoothstep(0.05, 0.42, t));
      over(result, mix(uFlame, uCore, 0.5), wave * 0.5 * (uMode > 1.5 ? 1.0 : 0.0));

      if (uMode > 1.5 && uEmbers > 0.0) {
        for (int i = 0; i < 18; i++) {
          float fi = float(i);
          float h = hash(vec2(fi, 4.0));
          float a = fi * 2.39996 + h;
          vec2 ember = vec2(cos(a), sin(a)) * (0.15 + t * (1.8 + h * 2.0));
          ember.y += t * t * 0.65;
          float spark = exp(-dot(p - ember, p - ember) / (0.0003 + 0.001 * h));
          over(result, mix(uFlame, uCore, h), spark * uEmbers * tail * fireLife);
        }
      }

      float rim = exp(-pow((dist - 0.21) * 65.0, 2.0)) * max(0.0, dot(normalize(p + vec2(0.0001)), normalize(vec2(-0.6, -0.8))));
      over(result, uCore, rim * illumination * 0.7);
      result *= onset;
      vec4 premul = result * uColor;
      gl_FragColor = vec4(premul.rgb / max(premul.a, 0.0001), clamp(premul.a, 0.0, 1.0));
    }
  `;

  Effect.ShadersStore['loomFireRibbonVertexShader'] = sharedVertex;
  Effect.ShadersStore['loomFireRibbonPixelShader'] = `
    precision highp float;
    varying vec2 vUV;
    uniform vec3 uFlame;
    uniform vec3 uCore;
    uniform float uClock;
    uniform float uStrength;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    void main() {
      float curl = sin(vUV.x * 16.0 - uClock * 8.0) * 0.08;
      float v = abs(vUV.y - 0.5 + curl);
      float breakup = noise(vec2(vUV.x * 14.0 - uClock * 6.0, vUV.y * 7.0));
      float flame = (1.0 - smoothstep(0.03, 0.48, v + breakup * 0.14)) * smoothstep(0.0, 0.16, vUV.x) * (1.0 - smoothstep(0.82, 1.0, vUV.x));
      float strands = pow(max(0.0, 1.0 - v * 3.2), 3.6);
      vec3 color = mix(uFlame * 0.75, uCore, strands * 0.72);
      float a = clamp(flame * uStrength * (0.45 + 0.55 * (1.0 - abs(vUV.x - 0.5) * 1.4)), 0.0, 1.0);
      gl_FragColor = vec4(color, a);
    }
  `;

  Effect.ShadersStore['loomCinematicVolumeVertexShader'] = sharedVertex;
  Effect.ShadersStore['loomCinematicVolumePixelShader'] = `
    precision highp float;
    varying vec2 vUV;
    uniform vec3 uMain;
    uniform vec3 uCore;
    uniform float uClock;
    uniform float uProgress;
    uniform float uStyle;
    uniform float uElement;
    uniform float uTurbulence;
    uniform float uAlpha;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      return 0.57 * noise(p) + 0.28 * noise(p * 2.07 + 7.0) + 0.15 * noise(p * 4.13);
    }
    void main() {
      vec2 p = vec2(vUV.x, vUV.y * 2.0 - 1.0);
      float t = uClock;
      float n = fbm(p * vec2(12.0, 7.0) - vec2(t * 5.0, t));
      float w = fbm(p * vec2(28.0, 13.0) + n * 3.0 - vec2(t * 11.0, 0.0));
      float density = 0.0;
      float hot = 0.0;

      if (uStyle < 0.5) {
        float head = min(1.0, uProgress * 4.5);
        float bend = sin(p.x * 38.0 - t * 18.0) * 0.07 + sin(p.x * 93.0 + t * 23.0) * 0.025;
        float d = abs(p.y + bend * uTurbulence);
        density = exp(-d * d * 22.0) * (0.4 + n * 0.8) + exp(-d * d * 180.0) * 0.8;
        hot = exp(-d * d * 900.0);
        density *= smoothstep(0.0, 0.025, p.x) * (1.0 - smoothstep(head - 0.025, head, p.x));
      } else if (uStyle < 1.5) {
        float front = min(1.0, uProgress * 2.6);
        float fan = max(0.03, p.x);
        float edge = 1.0 - smoothstep(fan * 0.92, fan, abs(p.y));
        float ends = smoothstep(0.0, 0.045, p.x) * (1.0 - smoothstep(front - 0.06, front, p.x));
        float tongues = fbm(vec2(p.x * 9.0 - t * 5.0, p.y * 7.0 / fan) + n * 2.0);
        density = edge * ends * (0.15 + pow(tongues, 1.4) * 1.6);
        hot = pow(max(0.0, 1.0 - abs(p.y) / fan), 3.0) * (0.3 + w) * max(0.0, 1.0 - p.x * 0.7);
      } else {
        vec2 q = vec2((vUV.x - 0.5) * 2.0, p.y);
        float r = length(q);
        float theta = atan(q.y, q.x);
        float wave = 0.08 + uProgress * 0.85;
        float d = uStyle > 3.5 ? max(abs(q.x), abs(q.y)) : r;
        float ring = exp(-pow((d - wave) * 25.0, 2.0));
        density = ring * (0.4 + n) + exp(-r * r * 7.0) * (1.0 - uProgress) * w;
        hot = exp(-r * r * 22.0) * (1.0 - uProgress);
        float rays = pow(max(0.0, cos(theta * 13.0 + n * 0.7)), 28.0) * exp(-pow(r - wave * 0.6, 2.0) * 18.0) * (1.0 - uProgress);
        density += rays * 0.9;
        hot += rays * 0.8;
        if (uStyle < 2.5) {
          density = (1.0 - smoothstep(0.25, 1.0, r)) * (0.3 + n * 0.7) + pow(max(0.0, cos(theta * 9.0 + r * 12.0 - t * 4.0)), 12.0) * (1.0 - r) * 0.3;
          hot = exp(-r * r * 8.0);
        }
      }

      float a = clamp(density * 0.75, 0.0, 0.94) * uAlpha;
      vec3 color = mix(uMain * 0.7, uCore, clamp(hot * 0.85 + w * 0.15, 0.0, 1.0));
      color += uCore * hot * (uStyle < 0.5 ? 1.8 : 0.75);
      gl_FragColor = vec4(color, a);
    }
  `;

  Effect.ShadersStore['loomArcaneVolumeVertexShader'] = sharedVertex;
  Effect.ShadersStore['loomArcaneVolumePixelShader'] = `
    precision highp float;
    varying vec2 vUV;
    uniform vec3 uMain;
    uniform vec3 uCore;
    uniform float uTime;
    uniform float uProgress;
    uniform float uMode;
    uniform float uVariant;
    uniform float uStrength;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
      );
    }
    float fbm(vec2 p) {
      return noise(p) * 0.57 + noise(p * 2.07 + 3.0) * 0.28 + noise(p * 4.1) * 0.15;
    }
    void main() {
      vec2 p = (vUV - 0.5) * 2.0;
      float r = length(p);
      float a = atan(p.y, p.x);
      float t = uTime;
      float n = fbm(p * 4.0 + vec2(t * 0.35, -t * 0.6));
      float w = fbm(p * 7.0 + vec2(n * 2.0, t * 0.8));
      float density = 0.0;
      float hot = 0.0;

      if (uMode < 4.5) {
        float curl = sin(a * (3.0 + uVariant) + r * 10.0 - t * 3.0 + n * 4.0);
        density = pow(max(0.0, 1.0 - r), 1.4) * (0.18 + max(0.0, curl) * 0.48) * w;
        hot = exp(-pow(r - 0.65, 2.0) * 160.0) * 0.45;
      } else {
        float ring = abs(r - (0.64 + 0.025 * sin(a * 12.0 - t * 2.0)));
        density = exp(-ring * ring * 280.0) * (0.25 + w * 0.5);
        hot = exp(-ring * ring * 1200.0) * 0.65;
      }

      float light = exp(-r * r * 4.0) * 0.065;
      float alpha = clamp((density * 0.6 + light) * uStrength, 0.0, 0.9);
      vec3 color = mix(uMain * 0.62, uCore, clamp(hot * 0.8 + w * 0.18, 0.0, 1.0));
      gl_FragColor = vec4(color, alpha);
    }
  `;
}

/**
 * Exact port of `bakeParticleAtlas()` from `MythWeaver/Vtt3d.client/src/app/engine/spell-fx-builder.ts`.
 */
export function getParticleAtlasTextures(scene: Scene): ParticleAtlasTextures {
  const existing = ATLAS_CACHE.get(scene);
  if (existing) return existing;

  const size = 64;
  const noise = (x: number, y: number): number => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const h = (a: number, b: number) => seeded(a + b * 157, 93);
    return (
      (h(ix, iy) * (1 - u) + h(ix + 1, iy) * u) * (1 - v) +
      (h(ix, iy + 1) * (1 - u) + h(ix + 1, iy + 1) * u) * v
    );
  };

  const makeTileTexture = (tile: number, name: string): DynamicTexture => {
    const dt = new DynamicTexture(name, { width: size, height: size }, scene, true);
    dt.hasAlpha = true;
    const ctx = dt.getContext() as unknown as CanvasRenderingContext2D;
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const px = (x - 31.5) / 31.5;
        const py = (y - 31.5) / 31.5;
        const r = Math.hypot(px, py);
        const n =
          noise(x / 10, y / 10) * 0.55 +
          noise(x / 4, y / 4) * 0.3 +
          noise(x / 2, y / 2) * 0.15;
        const edge = Math.max(0, 1 - r * r);
        let alpha = 0;
        if (tile === 0) alpha = edge * edge * Math.max(0, (n - 0.13) * 1.5);
        if (tile === 1) {
          alpha =
            Math.exp(-(px * px + py * py) * 6.5) *
            Math.max(0, 1 - r) *
            (0.75 + n * 0.25);
        }
        if (tile === 2) {
          const core = Math.exp(-(px * px + py * py) * 18);
          const starX = Math.exp(-(py * py * 95 + px * px * 4.5));
          const starY = Math.exp(-(px * px * 95 + py * py * 4.5));
          alpha = Math.min(1, core + (starX + starY) * 0.65) * Math.max(0, 1 - r);
        }
        if (tile === 3) {
          alpha =
            r < 0.48 + n * 0.2 && Math.abs(px * 0.7 + py) < 0.45
              ? Math.max(0, 1 - r) * 0.9
              : 0;
        }

        const at = (y * size + x) * 4;
        const v = Math.round(Math.min(1, alpha) * 255);
        data[at] = 255;
        data[at + 1] = 255;
        data[at + 2] = 255;
        data[at + 3] = v;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    dt.update();
    return dt;
  };

  const built: ParticleAtlasTextures = {
    smokeTex: makeTileTexture(0, 'eb-atlas-smoke'),
    glowTex: makeTileTexture(1, 'eb-atlas-glow'),
    sparkTex: makeTileTexture(2, 'eb-atlas-spark'),
    debrisTex: makeTileTexture(3, 'eb-atlas-debris'),
  };
  ATLAS_CACHE.set(scene, built);
  return built;
}

export function createFireHitShaderMaterial(
  scene: Scene,
  name: string,
  flameHex: string,
  coreHex: string,
  smokeHex: string = '#4a4149',
  mode: number = 2,
  seed: number = 42,
): ShaderMaterial {
  ensureEffectBuilderShadersRegistered();
  const mat = new ShaderMaterial(
    name,
    scene,
    { vertex: 'loomFireHit', fragment: 'loomFireHit' },
    {
      attributes: ['position', 'uv'],
      uniforms: [
        'worldViewProjection', 'uColor', 'uProgress', 'uMode', 'uClock', 'uBloom',
        'uDistortion', 'uScorch', 'uSeed', 'uSmoke', 'uLight', 'uShadow',
        'uTurbulence', 'uEmbers', 'uFlame', 'uCore', 'uSmokeColor',
      ],
      needAlphaBlending: true,
    },
  );
  mat.backFaceCulling = false;
  mat.alphaMode = Constants.ALPHA_COMBINE;
  mat.setVector4('uColor', { x: 1, y: 1, z: 1, w: 1 } as never);
  mat.setFloat('uProgress', 0);
  mat.setFloat('uMode', mode);
  mat.setFloat('uClock', 0);
  mat.setFloat('uBloom', 0.78);
  mat.setFloat('uDistortion', 0.45);
  mat.setFloat('uScorch', 0.85);
  mat.setFloat('uSeed', seed);
  mat.setFloat('uSmoke', 0.78);
  mat.setFloat('uLight', 1.2);
  mat.setFloat('uShadow', 0.65);
  mat.setFloat('uTurbulence', 0.85);
  mat.setFloat('uEmbers', 1.15);
  mat.setColor3('uFlame', Color3.FromHexString(flameHex));
  mat.setColor3('uCore', Color3.FromHexString(coreHex));
  mat.setColor3('uSmokeColor', Color3.FromHexString(smokeHex));
  return mat;
}
