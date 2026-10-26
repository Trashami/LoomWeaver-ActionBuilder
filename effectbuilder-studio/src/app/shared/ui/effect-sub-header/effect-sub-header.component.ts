import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { EffectStudioMode } from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-effect-sub-header',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './effect-sub-header.component.html',
  styleUrl: './effect-sub-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectSubHeaderComponent {
  readonly effectName = input<string>('Unnamed Effect');
  readonly effectSubtitle = input<string>('Custom Visual Effect');
  readonly statusLabel = input<string>('Not Saved');
  readonly activeMode = input<EffectStudioMode>('design');
  readonly canUndo = input<boolean>(false);
  readonly canRedo = input<boolean>(false);

  readonly editingTitle = signal<boolean>(false);

  readonly nameChanged = output<string>();
  readonly modeChanged = output<EffectStudioMode>();
  readonly undoRequested = output<void>();
  readonly redoRequested = output<void>();
  readonly saveRequested = output<void>();
  readonly exportRequested = output<void>();
  readonly backRequested = output<void>();

  startEditing(): void {
    this.editingTitle.set(true);
  }

  commitTitle(value: string): void {
    this.editingTitle.set(false);
    const trimmed = value.trim();
    if (trimmed) {
      this.nameChanged.emit(trimmed);
    }
  }
}
