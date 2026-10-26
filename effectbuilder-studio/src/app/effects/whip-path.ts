import { WhipSettings } from './effect-definition';
export type WhipPoint = { x: number; y: number };
export type WhipPhase = 'windup' | 'strike' | 'retract';
const clamp = (t: number) => Math.max(0, Math.min(1, t));
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Material points respond later down the lash over a shorter interval.
 * The traveling curl accelerates the tip; legacy hold settings add no pause.
 */
export function whipFrame(progress: number, distance: number, scale: number, w: WhipSettings): { phase: WhipPhase; points: WhipPoint[]; impact: number } {
  const total = w.windup + w.strike + w.retract;
  const time = clamp(progress) * total, contact = w.windup + w.strike;
  const phase: WhipPhase = time < w.windup ? 'windup' : time < contact ? 'strike' : 'retract';
  const reach = distance * w.reach, back = Math.min(distance, 180 * scale) * w.backswing;
  const height = 100 * scale * w.height;
  const points: WhipPoint[] = [];
  for (let i = 0; i <= 80; i++) {
    const u = i / 80, envelope = Math.sin(Math.PI * u);
    let x: number, y: number;
    if (phase === 'windup') {
      const lag = w.windup * .42 * u;
      const b = smooth(clamp((time - lag) / (w.windup - lag)));
      // One monotonic draw behind the caster, without a second wind-up.
      x = -back * u * b;
      y = -height * Math.sin(Math.PI * u * .9) * b;
      y += height * .2 * w.curl * envelope * Math.sin(u * Math.PI * 2 - time / w.windup * Math.PI) * b * (1 - b);
    } else if (phase === 'strike') {
      const cast = (time - w.windup) / w.strike;
      const lag = .48 * u;
      const q = clamp((cast - lag) / (1 - lag));
      // The base reverses first; the delayed tip catches up faster at contact.
      x = u * (-back + (reach + back) * q ** (1 + u));
      y = -height * Math.sin(Math.PI * u * .9) * (1 - q);
      y += height * .6 * w.curl * envelope * Math.sin(Math.PI * q) * Math.sin(Math.PI * 2 * (u - cast));
    } else {
      const r = clamp((time - contact) / w.retract);
      // Recoil begins immediately, including at the tip.
      const pull = 1 - (1 - r) ** (1 + 2 * u);
      x = reach * u * (1 - pull);
      y = height * envelope * Math.sin(Math.PI * r) * (.6 + .35 * w.curl * Math.sin(Math.PI * 2 * (u + r)));
    }
    points.push({ x, y });
  }
  const flashWidth = Math.max(.001, total * .025);
  return { phase, points, impact: Math.max(0, 1 - Math.abs(time - contact) / flashWidth) };
}
