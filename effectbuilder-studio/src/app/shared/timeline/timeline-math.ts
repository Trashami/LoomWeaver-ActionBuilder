export type ClipEdit = 'move' | 'start' | 'end';
export function editClip(start: number, duration: number, delta: number, mode: ClipEdit, snap = true): { start: number; duration: number } {
  const rounded = snap ? Math.round(delta / 50) * 50 : Math.round(delta);
  const end = start + duration;
  if (mode === 'move') return { start: Math.max(0, Math.min(5000, start + rounded)), duration };
  if (mode === 'start') { const next = Math.max(0, Math.min(5000, end - 100, start + rounded)); return { start: Math.max(next, end - 5000), duration: Math.min(5000, end - next) }; }
  return { start, duration: Math.max(100, Math.min(5000, duration + rounded)) };
}
