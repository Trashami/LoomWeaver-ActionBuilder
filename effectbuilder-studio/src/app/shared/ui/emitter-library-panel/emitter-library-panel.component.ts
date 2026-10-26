import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { EffectEmitterCardVm } from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-emitter-library-panel',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './emitter-library-panel.component.html',
  styleUrl: './emitter-library-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEmitterLibraryPanelComponent {
  readonly title = input<string>('Emitter Library');
  readonly emitters = input<readonly EffectEmitterCardVm[]>([]);
  readonly activeEmitterId = input<string>('emit-holy-light');
  readonly searchQuery = input<string>('');
  readonly selectedCategory = input<string>('All Categories');
  readonly categories = input<readonly string[]>(['All Categories']);

  readonly searchChanged = output<string>();
  readonly categoryChanged = output<string>();
  readonly emitterSelected = output<EffectEmitterCardVm>();
}
