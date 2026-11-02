import { Injectable, computed, signal } from '@angular/core';

const MIN_ZOOM = 100;
const MAX_ZOOM = 350;
const CLICK_SUPPRESS_PX = 4;

/** Top-down 2D viewport state: strictly top-down zoom and click-to-pan across the map extent. */
@Injectable({ providedIn: 'root' })
export class VttMapView2dService {
  readonly zoom = signal<number>(100);
  readonly pan = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  readonly rotation = signal<number>(0);

  /** Strictly top-down orthographic transform: no tilt, no in-plane rotation. */
  readonly transform = computed(
    () => `translate(${this.pan().x}px, ${this.pan().y}px) scale(${this.zoom() / 100})`,
  );

  private drag: { x: number; y: number; travel: number } | null = null;
  private dragMoved = false;

  zoomBy(amount: number): void {
    this.zoom.update((z) => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + amount));
      if (next <= 100) {
        this.pan.set({ x: 0, y: 0 });
      }
      return next;
    });
  }

  wheel(deltaY: number): void {
    this.zoomBy(deltaY < 0 ? 10 : -10);
  }

  reset(): void {
    this.zoom.set(100);
    this.pan.set({ x: 0, y: 0 });
    this.rotation.set(0);
  }

  setSpaceHeld(_held: boolean): void {
    // Top-down 2D view is strictly top-down; Space rotation is retired.
  }

  /** Starts a pan drag on left, middle, or right button when clicking empty map space. */
  start(event: MouseEvent): boolean {
    if (event.button !== 0 && event.button !== 1 && event.button !== 2) return false;
    if (event.button === 2) event.preventDefault();
    this.drag = { x: event.clientX, y: event.clientY, travel: 0 };
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
    if (drag.travel > CLICK_SUPPRESS_PX) {
      this.dragMoved = true;
    }

    this.pan.update((p) => {
      const newX = p.x + dx;
      const newY = p.y + dy;
      const zoom = this.zoom();

      if (zoom <= 100) {
        // At map extent, clamp tightly around center
        const maxSlack = 60;
        return {
          x: Math.max(-maxSlack, Math.min(maxSlack, newX)),
          y: Math.max(-maxSlack, Math.min(maxSlack, newY)),
        };
      }

      // When zoomed in, allow panning across the zoomed map without losing the map
      const factor = (zoom - 100) / 100;
      const maxPanX = 600 * factor + 100;
      const maxPanY = 400 * factor + 100;
      return {
        x: Math.max(-maxPanX, Math.min(maxPanX, newX)),
        y: Math.max(-maxPanY, Math.min(maxPanY, newY)),
      };
    });
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
