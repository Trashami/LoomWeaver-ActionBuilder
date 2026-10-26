import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  EffectEmitterCardVm,
  EffectInspectorTabId,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-effect-properties-inspector',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './effect-properties-inspector.component.html',
  styleUrl: './effect-properties-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectPropertiesInspectorComponent {
  readonly activeTab = input<EffectInspectorTabId>('properties');
  readonly properties = input.required<EffectEmitterCardVm>();
  readonly motionForces = input.required<EffectMotionForceConfigVm>();
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly selectedTrackId = input<string>('trk-light-beam');

  readonly appearanceExpanded = signal<boolean>(true);
  readonly motionExpanded = signal<boolean>(false);
  readonly collisionExpanded = signal<boolean>(false);
  readonly modelsExpanded = signal<boolean>(false);
  readonly soundExpanded = signal<boolean>(false);

  readonly emitterTypes: readonly string[] = [
    'Particle',
    'Ribbon Vortex',
    'Ground Sigil',
    'Shader Beam',
    'Volumetric Fog',
    'Mesh Shard',
  ];

  readonly shapes: readonly string[] = [
    'Circle (Area)',
    'Directional Cone',
    'Sphere Burst',
    'Cylinder Pillar',
    'Spiral Funnel',
    'Arc Chain',
    'Ring Fountain',
    'Vertical Ring',
    'Linear Ray',
  ];

  readonly materials: readonly string[] = [
    'Golden Light',
    'Arcane Plasma',
    'Solar Ember',
    'Crystalline Frost',
    'Abyssal Mist',
    'Emerald Vitality',
    'High-Voltage Arc',
    'Anelith Glyph',
  ];

  readonly blendModes: readonly string[] = ['Additive', 'AlphaBlend', 'Multiply', 'Screen'];

  readonly tabChanged = output<EffectInspectorTabId>();
  readonly propertiesPatched = output<Partial<EffectEmitterCardVm>>();
  readonly motionPatched = output<Partial<EffectMotionForceConfigVm>>();
  readonly trackVisibilityToggled = output<string>();
  readonly addLayerRequested = output<void>();

  patchProp(patch: Partial<EffectEmitterCardVm>): void {
    this.propertiesPatched.emit(patch);
  }

  patchMotion(patch: Partial<EffectMotionForceConfigVm>): void {
    this.motionPatched.emit(patch);
  }
}
