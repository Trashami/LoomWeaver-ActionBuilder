export const EASINGS = ['linear', 'ease-in', 'ease-out', 'ease-in-out'] as const;
export type Easing = typeof EASINGS[number];
export interface OpacityKeyframe { id: string; time: number; value: number; easing: Easing; }
export const clamp = (v: number, min = 0, max = 1) => Math.max(min, Math.min(max, v));
export function ease(progress: number, curve: Easing = 'linear'): number {
  const t = clamp(progress);
  switch (curve) {
    case 'ease-in': return t * t * t;
    case 'ease-out': return 1 - (1 - t) ** 3;
    case 'ease-in-out': return t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    default: return t;
  }
}
/** Opacity uses real clip time, independently of eased motion. Hold outside keyed range. */
export function opacityAt(frames: readonly OpacityKeyframe[], progress: number): number {
  if (!frames.length) return 1;
  if (progress <= frames[0].time) return frames[0].value;
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1], b = frames[i];
    if (progress <= b.time) {
      const t = ease((progress - a.time) / Math.max(.000001, b.time - a.time), a.easing);
      return clamp(a.value + (b.value - a.value) * t);
    }
  }
  return frames[frames.length - 1].value;
}
