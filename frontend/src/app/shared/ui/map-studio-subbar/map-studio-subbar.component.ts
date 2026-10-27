import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export type MapEditorModeTab = 'build' | 'playtest' | 'encounter';
export type MapSceneScopeMode = 'battlemap' | 'world_overlay';

@Component({
  selector: 'lw-map-studio-subbar',
  standalone: true,
  imports: [FormsModule, NgpButton, LwBadgeComponent, LwIconComponent],
  templateUrl: './map-studio-subbar.component.html',
  styleUrl: './map-studio-subbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapStudioSubbarComponent {
  readonly mapTitle = input<string>('The Forgotten Crypt');
  readonly gridCols = input<number>(30);
  readonly gridRows = input<number>(24);
  readonly gridCellFeet = input<number>(5);
  readonly revision = input<number>(15);
  readonly sceneScope = input<MapSceneScopeMode>('battlemap');
  readonly activeMode = input<MapEditorModeTab>('build');
  readonly canUndo = input<boolean>(false);
  readonly canRedo = input<boolean>(false);
  readonly saving = input<boolean>(false);
  readonly viewerRole = input<'gm' | 'players'>('gm');

  readonly titleChanged = output<string>();
  readonly scopeChanged = output<MapSceneScopeMode>();
  readonly modeChanged = output<MapEditorModeTab>();
  readonly undoRequested = output<void>();
  readonly redoRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly exportRequested = output<'gm' | 'player-safe'>();
  readonly backRequested = output<void>();

  readonly editingTitle = signal<boolean>(false);
  readonly moreMenuOpen = signal<boolean>(false);

  toggleTitleEdit(): void {
    this.editingTitle.update((v) => !v);
  }

  onExportClick(variant: 'gm' | 'player-safe'): void {
    this.moreMenuOpen.set(false);
    this.exportRequested.emit(variant);
  }
}
