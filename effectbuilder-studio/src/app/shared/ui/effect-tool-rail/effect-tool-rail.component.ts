import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { EffectRailToolId } from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

export interface LwEffectRailItem {
  readonly id: EffectRailToolId;
  readonly label: string;
  readonly icon: string;
}

@Component({
  selector: 'lw-effect-tool-rail',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  templateUrl: './effect-tool-rail.component.html',
  styleUrl: './effect-tool-rail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectToolRailComponent {
  readonly activeTool = input<EffectRailToolId>('emitters');
  readonly tools = input<readonly LwEffectRailItem[]>([
    { id: 'emitters', label: 'Emitters', icon: 'target' },
    { id: 'forces', label: 'Forces', icon: 'compass' },
    { id: 'lights', label: 'Lights', icon: 'zap' },
    { id: 'materials', label: 'Materials', icon: 'cube' },
    { id: 'models', label: 'Models', icon: 'layers' },
    { id: 'sounds', label: 'Sounds', icon: 'music' },
    { id: 'timeline', label: 'Timeline', icon: 'chart' },
    { id: 'presets', label: 'Presets', icon: 'settings' },
  ]);

  readonly toolSelected = output<EffectRailToolId>();
}
