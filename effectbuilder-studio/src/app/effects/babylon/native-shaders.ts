// Native Babylon shader materials shared by the editor and the VTT.
export const FIRE_FRAGMENT = `
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
      float scorch = exp(-dist * dist * 2.8) * smoothstep(0.12, 0.45, t) * tail * uShadow * 0.22;
      over(result, vec3(0.03, 0.02, 0.02), (uMode > 1.5 ? scorch * uScorch : 0.0));

      float illumination = exp(-dist * dist * 0.65) * uLight * fireLife;
      over(result, uFlame, illumination * (0.12 + uBloom * 0.18));

      // Density-derived normals create lit and self-shadowed rolling smoke
      float dx = fbm(flow + vec2(0.07, 0.0)) - n;
      float dy = fbm(flow + vec2(0.0, 0.07)) - n;
      vec3 normal = normalize(vec3(-dx * 8.0, -dy * 8.0, 0.7));
      float diffuse = max(0.0, dot(normal, normalize(vec3(-0.6, -0.65, 1.0))));
      vec3 smokeLit = uSmokeColor * (0.32 + diffuse * 0.55) + uFlame * illumination * 0.32;
      over(result, smokeLit, smoke * 0.72);

      float heat = clamp(density * 0.7 + detail * 0.65, 0.0, 1.0);
      vec3 fireColor = mix(uFlame * 0.55, uFlame, clamp(heat * 2.0, 0.0, 1.0));
      fireColor = mix(fireColor, uCore, smoothstep(0.64, 1.0, heat));
      over(result, fireColor, flame * 0.96);

      float flash = exp(-dist * dist * 12.0) * exp(-t * 23.0);
      over(result, uCore, flash * 0.9 * (uMode > 1.5 ? 1.0 : 0.0));

      float waveRadius = 0.15 + t * 3.8;
      float wave = exp(-pow((dist - waveRadius) * 19.0, 2.0)) * (1.0 - smoothstep(0.05, 0.42, t));
      over(result, mix(uFlame, uCore, 0.5), wave * 0.5 * (uMode > 1.5 ? 1.0 : 0.0));

      // Fixed budget of 18 ballistic embers evaluated in parallel per fragment
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

      result *= onset;
      vec4 premul = result * uColor;
      gl_FragColor = vec4(premul.rgb / max(premul.a, 0.0001), clamp(premul.a, 0.0, 1.0));
    }
  `;
export const CINEMATIC_FRAGMENT = `
    precision highp float;
    varying vec2 vUV;
    uniform vec3 uMain;
    uniform vec3 uCore;
    uniform float uClock;
    uniform float uProgress;
    uniform float uStyle;
    uniform float uVariant;
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
      float t = uClock * (1.0 + uVariant * 0.13);
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
        if (uElement > 1.5 && uElement < 2.5) {
          float crystals = pow(max(0.0, 1.0 - abs(sin(p.x * 95.0 - t * 25.0 + p.y * 42.0))), 18.0);
          density += crystals * edge * ends * 0.3;
          hot *= 0.5;
        }
        if (uElement > 2.5 && uElement < 3.5) {
          density *= 0.6;
          hot = 0.0;
        }
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

      if (uElement > 6.5) {
        hot = 0.0;
        density *= 0.75;
      }
      float a = clamp(density * 0.75, 0.0, 0.94) * uAlpha;
      vec3 color = mix(uMain * 0.7, uCore, clamp(hot * 0.85 + w * 0.15, 0.0, 1.0));
      color += uCore * hot * (uStyle < 0.5 ? 1.8 : 0.75);
      gl_FragColor = vec4(color, a);
    }
  `;
export const ARCANE_FRAGMENT = `
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

      if (uMode < 0.5) {
        float band = abs(p.y + sin(p.x * 17.0 - t * 8.0) * 0.045 * (1.0 + uVariant));
        density = exp(-band * band * 80.0) * (0.25 + n * 0.7) * (1.0 - smoothstep(0.7, 1.0, abs(p.x)));
        hot = exp(-band * band * 650.0);
      } else if (uMode < 1.5) {
        float edge = abs(p.y + sin(p.x * 31.0 + t * 17.0) * 0.12 * (0.4 + w));
        density = exp(-edge * edge * 65.0) * (0.25 + w * 0.5) * (1.0 - smoothstep(0.75, 1.0, abs(p.x)));
        hot = pow(max(0.0, 1.0 - edge * 5.0), 5.0);
      } else if (uMode < 2.5) {
        float shell = r + (w - 0.5) * 0.3;
        density = pow(max(0.0, 1.0 - shell), 2.0) * (0.45 + n);
        hot = exp(-r * r * 16.0);
      } else if (uMode < 3.5) {
        float shock = abs(r - (0.08 + uProgress * 0.72));
        density = exp(-shock * shock * 180.0) * (0.3 + n * 0.8) + pow(max(0.0, 1.0 - r * 1.2), 3.0) * (1.0 - uProgress) * w;
        hot = exp(-r * r * 18.0) * (1.0 - uProgress);
      } else if (uMode < 4.5) {
        float curl = sin(a * (3.0 + uVariant) + r * 10.0 - t * 3.0 + n * 4.0);
        density = pow(max(0.0, 1.0 - r), 1.4) * (0.15 + max(0.0, curl) * 0.45) * w;
        hot = exp(-pow(r - 0.65, 2.0) * 160.0) * 0.4;
      } else if (uMode < 7.5) {
        density = (1.0 - smoothstep(0.45, 1.0, r)) * smoothstep(0.18, 0.8, n + w * 0.3) * 0.8;
        hot = 0.0;
      } else {
        float ring = abs(r - (0.64 + 0.025 * sin(a * 12.0 - t * 2.0)));
        density = exp(-ring * ring * 280.0) * (0.2 + w * 0.5);
        hot = exp(-ring * ring * 1200.0) * 0.6;
      }

      float light = exp(-r * r * 4.0) * 0.055;
      float alpha = clamp((density * 0.55 + light) * uStrength, 0.0, 0.88);
      vec3 color = mix(uMain * 0.62, uCore, clamp(hot * 0.8 + w * 0.18, 0.0, 1.0));
      gl_FragColor = vec4(color, alpha);
    }
  `;