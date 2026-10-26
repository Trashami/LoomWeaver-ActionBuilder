import { EffectLayer } from '../effect-definition';
import { MaterialFrame } from '../arcane-motion';
import { FxPoint, seeded } from '../fireball-motion';
import { NativeField, NativeLayerFrame, NativePoint } from './native-frame';

const TAU = Math.PI * 2;
const pt = (p: FxPoint, height = 12): NativePoint => ({ ...p, height });

export function evaluateExtendedLayer(
  l: EffectLayer,
  f: MaterialFrame,
  out: NativeLayerFrame,
  from: FxPoint,
  to: FxPoint,
  scale: number,
  targets: FxPoint[],
  offset: (q: FxPoint) => FxPoint
): boolean {
  const p = f.p;
  const size = l.size * scale;
  const extent = f.extent;
  const angle = f.angle;
  const v = f.variant;

  const ribbon = (points: NativePoint[], width = size, color = l.color, taper = false) =>
    out.ribbons.push({ points, width: Math.max(0.35 * scale, width), color, taper });

  const field = (
    q: FxPoint,
    width: number,
    depth = width,
    family: NativeField['family'] = 'arcane',
    mode = 2,
    height = 10 * scale,
    rotation = 0,
    progress = p,
    vertical = false
  ) =>
    out.fields.push({
      point: pt(q, height),
      width,
      depth,
      angle: rotation,
      family,
      mode,
      progress,
      variant: v,
      vertical,
    });

  const particle = (
    q: FxPoint,
    r: number,
    alpha: number,
    tile = 1,
    height = 16 * scale,
    rotation = 0,
    stretch = 1,
    color = l.color
  ) =>
    out.particles.push({
      ...pt(q, height),
      size: Math.max(0.1, r),
      alpha: Math.max(0, alpha),
      tile,
      rotation,
      stretch,
      color,
    });

  switch (l.kind) {
    case 'chain_lightning': {
      const chainNodes: FxPoint[] = [
        offset(from),
        offset(targets[0] ?? to),
        offset(targets[1] ?? { x: to.x - 45 * scale, y: to.y - 55 * scale }),
        offset(targets[2] ?? { x: to.x + 35 * scale, y: to.y + 55 * scale }),
      ];
      const legCount = 3;
      for (let leg = 0; leg < legCount; leg++) {
        const legStart = leg * 0.22;
        const legProg = Math.max(0, Math.min(1, (p - legStart) / (1 - legStart * 0.8)));
        if (legProg <= 0) continue;
        const a = chainNodes[leg];
        const b = chainNodes[leg + 1];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dir = Math.atan2(dy, dx);
        const strands = v === 2 ? 2 : v === 3 ? 3 : 1;
        for (let s = 0; s < strands; s++) {
          const pts: NativePoint[] = [];
          const steps = 28;
          for (let i = 0; i <= steps; i++) {
            const u = (i / steps) * legProg;
            const jitter =
              (seeded(i + leg * 41 + s * 97 + Math.floor(f.clock * 16) * 53, l.motion.seed) - 0.5) *
              (12 + v * 5) *
              scale *
              Math.sin((i / steps) * Math.PI);
            pts.push(
              pt(
                {
                  x: a.x + Math.cos(dir) * dist * u - Math.sin(dir) * jitter,
                  y: a.y + Math.sin(dir) * dist * u + Math.cos(dir) * jitter,
                },
                (20 + (v === 1 ? 8 : 0) + Math.sin(u * Math.PI) * (6 + v * 3)) * scale
              )
            );
          }
          ribbon(pts, Math.max(1.2 * scale, size * (0.32 + s * 0.12)), s === 0 ? l.color : l.secondaryColor);
        }
        field(b, (28 + v * 6) * scale, (28 + v * 6) * scale, 'arcane', 2 + (v % 3), 18 * scale, f.clock, legProg);
        for (let k = 0; k < 6 + v * 2; k++) {
          const ang = k * 2.399 + leg + v * 0.4;
          const rad = legProg * (10 + seeded(k + leg * 19, l.motion.seed) * (18 + v * 4)) * scale;
          particle(
            { x: b.x + Math.cos(ang) * rad, y: b.y + Math.sin(ang) * rad },
            (1.6 + v * 0.25) * scale,
            (1 - legProg * 0.6) * 0.85,
            2,
            (16 + k) * scale,
            ang,
            2.2,
            l.secondaryColor
          );
        }
      }
      return true;
    }

    case 'shield': {
      const rings = 3 + (v % 3);
      const isWall = v === 1;
      for (let r = 0; r < rings; r++) {
        const elev = (r / Math.max(1, rings - 1)) * extent * 0.85;
        const rad = isWall ? extent * (0.9 - r * 0.12) : Math.sqrt(Math.max(0.08, 1 - (r / rings) ** 2)) * extent;
        const segs = v === 0 ? 6 : v === 2 ? 8 : 40;
        const span = isWall ? Math.PI * 0.85 : TAU;
        const startA = isWall ? angle - span / 2 : f.clock * 0.35 * (r % 2 ? -1 : 1) + v * 0.3;
        const pts = Array.from({ length: segs + 1 }, (_, i) => {
          const a = startA + (i / segs) * span;
          return pt({ x: f.anchor.x + Math.cos(a) * rad, y: f.anchor.y + Math.sin(a) * rad }, 6 * scale + elev);
        });
        ribbon(pts, Math.max(1.2 * scale, size * (0.04 + v * 0.005)), r % 2 ? l.secondaryColor : l.color);
      }
      field(f.anchor, extent * (2.1 + v * 0.12), extent * (2.1 + v * 0.12), 'barrier', v, 22 * scale, angle, p, isWall);
      return true;
    }

    case 'ground': {
      const fam = v === 0 ? 'fire' : 'arcane';
      field(f.anchor, extent * (2.6 + v * 0.15), extent * (2.6 + v * 0.15), fam, v % 5, (2 + v * 0.5) * scale, f.clock * 0.15);
      const spokes = 4 + v * 2;
      for (let s = 0; s < spokes; s++) {
        const baseA = (s / spokes) * TAU + v * 0.25;
        const pts = Array.from({ length: 14 }, (_, i) => {
          const u = i / 13;
          const r = u * extent * (0.85 + 0.15 * Math.sin(s + v));
          const w = Math.sin(u * (6 + v * 2) + f.clock * 2) * (4 + v * 2) * scale;
          return pt(
            { x: f.anchor.x + Math.cos(baseA) * r - Math.sin(baseA) * w, y: f.anchor.y + Math.sin(baseA) * r + Math.cos(baseA) * w },
            (1.5 + v * 0.4) * scale
          );
        });
        ribbon(pts, Math.max(1.1 * scale, size * 0.03), s % 2 ? l.secondaryColor : l.color, true);
      }
      for (let i = 0; i < 24 + v * 3; i++) {
        const a = seeded(i, l.motion.seed) * TAU;
        const d = Math.sqrt(seeded(i + 71, l.motion.seed)) * extent * 0.9;
        const age = (f.clock * 0.45 + seeded(i + 19, l.motion.seed)) % 1;
        particle(
          { x: f.anchor.x + Math.cos(a) * d, y: f.anchor.y + Math.sin(a) * d },
          (3 + v + age * 8) * scale,
          Math.sin(age * Math.PI) * 0.55,
          v === 0 ? 4 : v === 1 ? 5 : 0,
          (3 + age * (14 + v * 4)) * scale,
          a,
          1,
          i % 3 === 0 ? l.secondaryColor : l.color
        );
      }
      return true;
    }

    case 'emitter': {
      const count = Math.min(90, Math.max(16, l.count + v * 4));
      for (let i = 0; i < count; i++) {
        const sx = seeded(i + 13, l.motion.seed);
        const sy = seeded(i + 97, l.motion.seed);
        const phase = (f.clock * (0.7 + v * 0.15) * Math.max(0.2, l.motion.speed) + seeded(i + 211, l.motion.seed)) % 1;
        const fall = v <= 2 ? 1 - phase : phase;
        const drift = Math.sin(phase * TAU + i) * (6 + v * 4) * scale;
        const q = {
          x: f.anchor.x + (sx - 0.5) * extent * 2.2 + drift,
          y: f.anchor.y + (sy - 0.5) * extent * 2.2,
        };
        const h = (4 + fall * (65 + v * 6)) * scale;
        const stretch = v === 0 ? 4.2 : v === 2 ? 1.8 : 1.1;
        particle(q, (1.8 + v * 0.45) * scale, Math.sin(phase * Math.PI) * 0.85, v === 1 ? 5 : 1, h, v === 0 ? -0.25 : phase * TAU, stretch, i % 2 ? l.color : l.secondaryColor);
      }
      field(f.anchor, extent * (1.8 + v * 0.1), extent * (1.8 + v * 0.1), 'arcane', 4, 4 * scale, f.clock * 0.2);
      return true;
    }

    case 'vortex': {
      const arms = 3 + (v % 3);
      for (let arm = 0; arm < arms; arm++) {
        const pts = Array.from({ length: 48 }, (_, i) => {
          const u = i / 47;
          const turns = 2.4 + v * 0.45;
          const a = u * TAU * turns + f.clock * (2.2 + v * 0.3) * (v === 3 ? -1 : 1) + (arm * TAU) / arms;
          const rad = extent * (v === 3 ? (1 - u * 0.82) : (0.18 + u * (0.85 + v * 0.06)));
          return pt({ x: f.anchor.x + Math.cos(a) * rad, y: f.anchor.y + Math.sin(a) * rad }, (4 + u * (54 + v * 8)) * scale);
        });
        ribbon(pts, Math.max(1.2 * scale, size * (0.035 + v * 0.004)), arm % 2 ? l.secondaryColor : l.color, true);
      }
      field(f.anchor, extent * (2.2 + v * 0.12), extent * (2.2 + v * 0.12), v === 1 ? 'fire' : 'arcane', 2 + (v % 3), 14 * scale, f.clock);
      return true;
    }

    case 'portal': {
      const openScale = Math.min(1, p * 4, (1 - p) * 4 + 0.15);
      const rx = extent * (0.65 + v * 0.06) * openScale;
      const ry = extent * (1.05 + v * 0.08) * openScale;
      const rimPts = Array.from({ length: 56 }, (_, i) => {
        const a = (i / 55) * TAU + v * 0.2;
        return pt(
          {
            x: f.anchor.x + Math.cos(angle) * Math.cos(a) * rx,
            y: f.anchor.y + Math.sin(angle) * Math.cos(a) * rx,
          },
          (34 + Math.sin(a) * ry * 0.85) * scale
        );
      });
      ribbon(rimPts, Math.max(1.8 * scale, size * (0.055 + v * 0.006)), l.color);
      field(f.anchor, rx * 2.2, ry * 2.1, v === 3 ? 'fire' : 'arcane', v % 5, 34 * scale, angle, p, true);
      for (let i = 0; i < 20 + v * 3; i++) {
        const a = (i / (20 + v * 3)) * TAU + f.clock * (1.5 + v * 0.2);
        particle(
          { x: f.anchor.x + Math.cos(angle) * Math.cos(a) * rx, y: f.anchor.y + Math.sin(angle) * Math.cos(a) * rx },
          (2.2 + v * 0.3) * scale,
          0.85,
          2,
          (34 + Math.sin(a) * ry * 0.85) * scale,
          a,
          2,
          l.secondaryColor
        );
      }
      return true;
    }

    case 'orbit': {
      const satCount = 3 + v;
      for (let s = 0; s < satCount; s++) {
        const baseA = f.clock * (2.4 + v * 0.25) * Math.max(0.25, l.motion.speed) + (s * TAU) / satCount;
        const rad = extent * (0.72 + (s % 2) * 0.14);
        const h = (22 + Math.sin(baseA * 2 + s) * (8 + v * 2)) * scale;
        const head = { x: f.anchor.x + Math.cos(baseA) * rad, y: f.anchor.y + Math.sin(baseA) * rad };
        const tailPts = Array.from({ length: 16 }, (_, i) => {
          const a = baseA - (i / 15) * (0.65 + v * 0.08);
          return pt({ x: f.anchor.x + Math.cos(a) * rad, y: f.anchor.y + Math.sin(a) * rad }, h);
        }).reverse();
        ribbon(tailPts, Math.max(1.4 * scale, size * (0.045 + v * 0.005)), s % 2 ? l.secondaryColor : l.color, true);
        particle(head, (4.5 + v * 0.6) * scale, 0.95, 2, h, baseA, v === 0 ? 3.2 : 1.4, l.secondaryColor);
      }
      field(f.anchor, extent * 1.6, extent * 1.6, 'arcane', v % 5, 10 * scale, f.clock);
      return true;
    }

    case 'slash': {
      const slashes = v === 1 ? 2 : 1;
      for (let s = 0; s < slashes; s++) {
        const sweepSpan = v === 3 ? TAU * 0.92 : v === 4 ? 0.35 : Math.PI * (0.78 + v * 0.08);
        const dirSign = s % 2 ? -1 : 1;
        const pts = Array.from({ length: 36 }, (_, i) => {
          const u = (i / 35) * Math.min(1, p * 1.6);
          const a = angle + (u - 0.5) * sweepSpan * dirSign;
          const reach = v === 4 ? extent * (0.3 + u * 1.4) : extent * (0.85 + Math.sin(u * Math.PI) * (0.25 + v * 0.05));
          const h = v === 2 ? (12 + Math.sin(u * Math.PI) * 42) * scale : (22 + (s - 0.5) * 8) * scale;
          return pt({ x: f.anchor.x + Math.cos(a) * reach, y: f.anchor.y + Math.sin(a) * reach }, h);
        });
        ribbon(pts, Math.max(2.2 * scale, size * (0.09 + v * 0.01)), s ? l.secondaryColor : l.color, true);
      }
      field(f.anchor, extent * (1.8 + v * 0.1), extent * (1.8 + v * 0.1), 'arcane', 3, 20 * scale, angle);
      return true;
    }

    case 'symbol': {
      const hoverH = (44 + v * 4 + Math.sin(f.clock * 3) * 4) * scale;
      const sides = 3 + v;
      const polyPts = Array.from({ length: sides + 1 }, (_, i) => {
        const a = ((i * (v === 1 ? 2 : 1)) / sides) * TAU + f.clock * 0.6;
        const r = extent * (0.55 + v * 0.04);
        return pt({ x: f.anchor.x + Math.cos(a) * r, y: f.anchor.y + Math.sin(a) * r }, hoverH);
      });
      ribbon(polyPts, Math.max(1.5 * scale, size * 0.035), l.color);
      const outerPts = Array.from({ length: 40 }, (_, i) => {
        const a = (i / 39) * TAU - f.clock * 0.4;
        const r = extent * (0.72 + v * 0.04);
        return pt({ x: f.anchor.x + Math.cos(a) * r, y: f.anchor.y + Math.sin(a) * r }, hoverH);
      });
      ribbon(outerPts, Math.max(1.2 * scale, size * 0.025), l.secondaryColor);
      field(f.anchor, extent * (1.5 + v * 0.1), extent * (1.5 + v * 0.1), 'arcane', v % 5, hoverH, f.clock);
      return true;
    }

    case 'eruption': {
      const spikes = 5 + v * 2;
      const rise = Math.sin(Math.min(1, p * 1.4) * Math.PI);
      for (let s = 0; s < spikes; s++) {
        const a = (s / spikes) * TAU + v * 0.3;
        const dist = extent * (0.22 + seeded(s + v * 17, l.motion.seed) * 0.68);
        const base = { x: f.anchor.x + Math.cos(a) * dist, y: f.anchor.y + Math.sin(a) * dist };
        const tip = {
          x: base.x + Math.cos(a) * (8 + v * 3) * scale * rise,
          y: base.y + Math.sin(a) * (8 + v * 3) * scale * rise,
        };
        const spikeH = (26 + seeded(s + 31, l.motion.seed) * 28 + v * 5) * scale * rise;
        ribbon([pt(base, 1 * scale), pt(tip, spikeH)], Math.max(2.2 * scale, size * (0.065 + v * 0.006)), s % 2 ? l.secondaryColor : l.color, true);
        particle(tip, (3 + v * 0.5) * scale, rise * 0.9, v === 2 ? 4 : v === 3 ? 5 : 2, spikeH, a, 1.8, l.secondaryColor);
      }
      field(f.anchor, extent * (2.3 + v * 0.1), extent * (2.3 + v * 0.1), v === 2 ? 'fire' : 'arcane', v % 5, 4 * scale, f.clock * 0.1);
      return true;
    }

    case 'distortion': {
      const waves = 3 + (v % 3);
      for (let w = 0; w < waves; w++) {
        const phase = (p + w / waves) % 1;
        const rad = extent * (0.25 + phase * (0.95 + v * 0.08));
        const pts = Array.from({ length: 48 }, (_, i) => {
          const a = (i / 47) * TAU;
          const warp = Math.sin(a * (3 + v) + f.clock * 5) * (4 + v * 2) * scale;
          return pt({ x: f.anchor.x + Math.cos(a) * (rad + warp), y: f.anchor.y + Math.sin(a) * (rad + warp) }, (14 + w * 6) * scale);
        });
        ribbon(pts, Math.max(1.1 * scale, size * (0.028 + v * 0.004)), w % 2 ? l.secondaryColor : l.color);
      }
      field(f.anchor, extent * (2.5 + v * 0.15), extent * (2.5 + v * 0.15), 'arcane', v % 5, 18 * scale, f.clock * 0.6);
      return true;
    }

    case 'trail': {
      if (v <= 2) {
        const headU = Math.min(1, p * 1.25);
        const sample = (u: number): FxPoint => {
          const arc = Math.sin(u * Math.PI) * (l.spread * 0.65 + v * 8) * scale;
          return offset({
            x: from.x + (to.x - from.x) * u - Math.sin(angle) * arc,
            y: from.y + (to.y - from.y) * u + Math.cos(angle) * arc,
          });
        };
        const trailPts = Array.from({ length: 32 }, (_, i) => {
          const u = Math.max(0, headU - ((31 - i) / 31) * (0.28 + v * 0.05));
          return pt(sample(u), (22 + Math.sin(u * Math.PI) * 18) * scale);
        });
        ribbon(trailPts, Math.max(1.5 * scale, size * (0.55 + v * 0.1)), l.color, true);
        const head = sample(headU);
        if (v === 2) {
          const spin = f.clock * 18;
          const bladeLen = Math.max(8 * scale, size * 1.1);
          ribbon(
            [
              pt({ x: head.x - Math.cos(spin) * bladeLen, y: head.y - Math.sin(spin) * bladeLen }, 24 * scale),
              pt({ x: head.x + Math.cos(spin) * bladeLen, y: head.y + Math.sin(spin) * bladeLen }, 24 * scale),
            ],
            Math.max(2.2 * scale, size * 0.35),
            l.secondaryColor,
            true
          );
        }
        field(head, (24 + v * 6) * scale, (24 + v * 6) * scale, 'arcane', 2, 22 * scale, f.clock * 8);
      } else {
        const fragCount = 18 + v * 4;
        for (let i = 0; i < fragCount; i++) {
          const a = seeded(i, l.motion.seed) * TAU;
          const speed = 0.35 + seeded(i + 41, l.motion.seed) * 0.95;
          const dist = p * extent * (1.2 + v * 0.15) * speed;
          const h = Math.max(2, Math.sin(p * Math.PI) * (34 + (i % 5) * 6) * scale);
          const pos = { x: f.anchor.x + Math.cos(a) * dist, y: f.anchor.y + Math.sin(a) * dist };
          particle(pos, (2.6 + (i % 3) * 1.2 + v * 0.3) * scale, (1 - p * 0.75) * 0.95, v === 4 ? 5 : 2, h, a + f.clock * 9, 1.6, i % 2 ? l.color : l.secondaryColor);
        }
        field(f.anchor, extent * (1.6 + v * 0.1), extent * (1.6 + v * 0.1), 'arcane', v % 5, 8 * scale);
      }
      return true;
    }

    case 'sound': {
      const rings = 3 + (v % 3);
      for (let r = 0; r < rings; r++) {
        const phase = (p * (1.2 + v * 0.15) + r / rings) % 1;
        const rad = extent * (0.2 + phase * (1.05 + v * 0.08));
        const pts = Array.from({ length: 44 }, (_, i) => {
          const a = (i / 43) * TAU;
          const amp = Math.sin(a * (6 + v * 2) + f.clock * 12) * (2.5 + v * 1.2) * scale * (1 - phase);
          return pt({ x: f.anchor.x + Math.cos(a) * (rad + amp), y: f.anchor.y + Math.sin(a) * (rad + amp) }, (14 + r * 3) * scale);
        });
        ribbon(pts, Math.max(1.1 * scale, size * (0.025 + v * 0.004)), r % 2 ? l.secondaryColor : l.color);
      }
      field(f.anchor, extent * (1.8 + v * 0.12), extent * (1.8 + v * 0.12), 'arcane', v % 5, 14 * scale, f.clock);
      return true;
    }

    default:
      return false;
  }
}
