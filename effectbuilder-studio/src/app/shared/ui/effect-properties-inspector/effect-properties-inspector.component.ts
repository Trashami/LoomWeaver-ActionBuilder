import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  EffectAnimationModifierId,
  EffectAppearanceId,
  EffectEmitterCardVm,
  EffectInspectorTabId,
  EffectLayerAnchor,
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
  readonly motionExpanded = signal<boolean>(true);
  readonly collisionExpanded = signal<boolean>(false);
  readonly modelsExpanded = signal<boolean>(false);
  readonly soundExpanded = signal<boolean>(false);

  readonly emitterTypes: readonly string[] = [
    'Projectile', 'Projectile Volley', 'Object Projectile', 'Trail',
    'Beam', 'Cone Spray', 'Energy Column', 'Burst', 'Box Burst',
    'Shockwave', 'Casting Charge', 'Magic Circle', 'Swirling Aura',
    'Smoke / Mist', 'Sparks / Embers', 'Debris', 'Light', 'Surface Mark',
    'Chain Lightning', 'Wall', 'Shield / Dome', 'Ground Area',
    'Particle Emitter', 'Sound',
  ];

  readonly appearances: readonly EffectAppearanceId[] = [
    'Fire', 'Ice', 'Lightning', 'Acid', 'Shadow', 'Radiant', 'Spectral', 'Chokrah', 'Custom',
  ];

  readonly animationModifiers: readonly EffectAnimationModifierId[] = [
    'None', 'Move Along Path', 'Attach / Follow', 'Grow / Shrink', 'Rotate / Orbit',
    'Fade / Pulse', 'Change Color', 'Dissolve / Reform', 'Reveal / Conceal',
    'Change Appearance', 'Duplicate / Afterimage',
  ];

  readonly anchors: readonly EffectLayerAnchor[] = ['caster', 'path', 'target', 'area'];

  readonly shapes: readonly string[] = [
    'Circle (Area)', 'Curved Flight', 'Bezier Multi-Arc', 'Ballistic Spin',
    'Tapered Ribbon', 'Directional Cone', 'Sphere Burst', 'Cube Volume',
    'Cylinder Pillar', 'Spiral Funnel', 'Arc Chain', 'Ring Fountain', 'Linear Ray',
  ];

  readonly materials: readonly string[] = [
    'Golden Light', 'Arcane Plasma', 'Solar Ember', 'Crystalline Frost',
    'Abyssal Mist', 'Emerald Vitality', 'High-Voltage Arc', 'Anelith Glyph', 'Spore Vapor',
  ];

  readonly blendModes: readonly string[] = ['Additive', 'AlphaBlend', 'Multiply', 'Screen'];

  readonly selectedTrack = computed(
    () => this.tracks().find((t) => t.id === this.selectedTrackId()) ?? this.tracks()[0] ?? null,
  );

  readonly tabChanged = output<EffectInspectorTabId>();
  readonly propertiesPatched = output<Partial<EffectEmitterCardVm>>();
  readonly motionPatched = output<Partial<EffectMotionForceConfigVm>>();
  readonly trackVisibilityToggled = output<string>();
  readonly trackPatched = output<{ trackId: string; patch: Partial<EffectTimelineTrackVm> }>();
  readonly addLayerRequested = output<void>();

  patchProp(patch: Partial<EffectEmitterCardVm>): void {
    this.propertiesPatched.emit(patch);
  }

  patchMotion(patch: Partial<EffectMotionForceConfigVm>): void {
    this.motionPatched.emit(patch);
  }

  patchSelectedTrack(patch: Partial<EffectTimelineTrackVm>): void {
    const trk = this.selectedTrack();
    if (!trk) return;
    this.trackPatched.emit({ trackId: trk.id, patch });
  }
}
