import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  EffectAppearancePresetVm,
  EffectCompositePresetVm,
  EffectEmitterCardVm,
  EffectLibrarySectionId,
} from '../../../features/effect-studio/models/effect-studio.models';
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
  readonly title = input<string>('Effect Library');
  readonly activeSection = input<EffectLibrarySectionId>('effects');
  readonly emitters = input<readonly EffectEmitterCardVm[]>([]);
  readonly appearances = input<readonly EffectAppearancePresetVm[]>([]);
  readonly presets = input<readonly EffectCompositePresetVm[]>([]);
  readonly activeEmitterId = input<string>('emit-energy-column');
  readonly activeAppearanceId = input<string>('Radiant');
  readonly activePresetId = input<string>('preset-luminary-pillar');
  readonly searchQuery = input<string>('');
  readonly selectedCategory = input<string>('All Categories');
  readonly categories = input<readonly string[]>(['All Categories']);

  readonly sectionChanged = output<EffectLibrarySectionId>();
  readonly searchChanged = output<string>();
  readonly categoryChanged = output<string>();
  readonly emitterSelected = output<EffectEmitterCardVm>();
  readonly appearanceSelected = output<EffectAppearancePresetVm>();
  readonly presetSelected = output<EffectCompositePresetVm>();
}
