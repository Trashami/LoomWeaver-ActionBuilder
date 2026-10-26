import { Injectable, computed, signal } from '@angular/core';
import { MapStudioSnapshot } from './map-studio.models';

@Injectable({ providedIn: 'root' })
export class MapHistoryEngineService {
  private readonly maxStackSize = 40;
  private undoStack: MapStudioSnapshot[] = [];
  private redoStack: MapStudioSnapshot[] = [];

  readonly undoCount = signal<number>(0);
  readonly redoCount = signal<number>(0);
  readonly lastActionLabel = signal<string>('Initial Scene Ready');

  readonly canUndo = computed(() => this.undoCount() > 0);
  readonly canRedo = computed(() => this.redoCount() > 0);

  pushSnapshot(snapshot: MapStudioSnapshot): void {
    const cloned: MapStudioSnapshot = JSON.parse(JSON.stringify(snapshot));
    this.undoStack.push(cloned);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    this.undoCount.set(this.undoStack.length);
    this.redoStack = [];
    this.redoCount.set(0);
    this.lastActionLabel.set(snapshot.label);
  }

  undo(current: MapStudioSnapshot): MapStudioSnapshot | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(JSON.parse(JSON.stringify(current)));
    this.redoCount.set(this.redoStack.length);

    const prev = this.undoStack.pop()!;
    this.undoCount.set(this.undoStack.length);
    this.lastActionLabel.set(`Undid: ${current.label}`);
    return prev;
  }

  redo(current: MapStudioSnapshot): MapStudioSnapshot | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(JSON.parse(JSON.stringify(current)));
    this.undoCount.set(this.undoStack.length);

    const next = this.redoStack.pop()!;
    this.redoCount.set(this.redoStack.length);
    this.lastActionLabel.set(`Redid: ${next.label}`);
    return next;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.undoCount.set(0);
    this.redoCount.set(0);
    this.lastActionLabel.set('History Cleared');
  }
}
