import { Injectable, computed, signal } from '@angular/core';

type ViewDragMode = 'pan' | 'rotate';

const MIN_ZOOM = 25;
const MAX_ZOOM = 400;
const ROTATE_DEG_PER_PX = 0.4;
const CLICK_SUPPRESS_PX = 4;

/** Top-down 2D viewport state: zoom, pan, and in-plane rotation (Space + drag). */
@Injectable({ providedIn: 'root' })
export class VttMapView2dService {
  readonly zoom = signal<number>(100);
  readonly pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  readonly rotation = signal<number>(0);

  readonly transform = computed(
    () => `translate(${this.pan().x}px, ${this.pan().y}px) rotate(${this.rotation()}deg) scale(${this.zoom() / 100})`,
  );

  private spaceHeld = false;
  private drag: { mode: ViewDragMode; x: number; y: number; travel: number } | null = null;
  private dragMoved = false;

  zoomBy(amount: number): void {
    this.zoom.update((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + amount)));
  }

  wheel(deltaY: number): void {
    this.zoomBy(deltaY < 0 ? 10 : -10);
  }

  reset(): void {
    this.zoom.set(100);
    this.pan.set({ x: 0, y: 0 });
    this.rotation.set(0);
  }

  setSpaceHeld(held: boolean): void {
    this.spaceHeld = held;
    if (!held && this.drag?.mode === 'rotate') this.drag = null;
  }

  /** Starts a pan (middle button) or rotate (Space + left button) drag. Returns true when consumed. */
  start(event: MouseEvent): boolean {
    if (event.button !== 1 && !(event.button === 0 && this.spaceHeld)) return false;
    event.preventDefault();
    this.drag = { mode: event.button === 0 ? 'rotate' : 'pan', x: event.clientX, y: event.clientY, travel: 0 };
    this.dragMoved = false;
    return true;
  }

  move(event: MouseEvent): boolean {
    const drag = this.drag;
    if (!drag) return false;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.travel += Math.abs(dx) + Math.abs(dy);
    if (drag.travel > CLICK_SUPPRESS_PX) this.dragMoved = true;
    if (drag.mode === 'rotate') {
      this.rotation.update((r) => r + dx * ROTATE_DEG_PER_PX);
    } else {
      this.pan.update((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
    return true;
  }

  end(): void {
    this.drag = null;
  }

  /** True when the last pointer gesture was a drag, so its trailing click should be ignored. */
  consumeDragClick(): boolean {
    const moved = this.dragMoved;
    this.dragMoved = false;
    return moved;
  }
}
