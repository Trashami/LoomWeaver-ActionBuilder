import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  EffectAnimationModifierId,
  EffectAppearanceId,
  EffectEmitterCardVm,
  EffectInspectorTabId,
  EffectLayerAnchor,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../../../features/effect-studio/models/effect-studio.models';

@Component({
  selector: 'lw-effect-properties-inspector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './effect-properties-inspector.component.html',
  styleUrl: './effect-properties-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectPropertiesInspectorComponent {
  readonly activeTab = input<EffectInspectorTabId>('properties');
  readonly properties = input.required<EffectEmitterCardVm>();
  readonly motionForces = input.required<EffectMotionForceConfigVm>();
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly selectedTrackId = input<string>('trk-cast-charge');

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
  readonly blendModes: readonly string[] = ['Additive', 'AlphaBlend', 'Multiply', 'Screen'];

  readonly objectModels: readonly string[] = [
    'Tooth (Fivi Slingshot)',
    'Runed Dagger',
    'Spinning Hammer',
    'Hurled Boulder',
    'Crystal Shard',
    'Iron Spear',
    'Chokrah Vessel',
  ];

  readonly circlePatterns: readonly string[] = [
    'Arcane Sigil',
    'Six-Point Luminary Hex',
    'Eldritch Binding Ward',
    'Celestial Astrolabe',
    'Dwarven Rune Ring',
  ];

  readonly debrisMaterials: readonly string[] = [
    'Charred Stone',
    'Shattered Ice',
    'Splintered Wood',
    'Obsidian Shards',
    'Bone Fragments',
  ];

  readonly soundCues: readonly string[] = [
    'Arcane Invocation',
    'Fireball Detonation',
    'Lightning Arc Crack',
    'Frost Crystalline Shatter',
    'Void Rift Hum',
    'Radiant Bell Chord',
  ];

  readonly selectedTrack = computed<EffectTimelineTrackVm | null>(
    () => this.tracks().find((t) => t.id === this.selectedTrackId()) ?? this.tracks()[0] ?? null,
  );

  readonly activeEffectType = computed<string>(() => {
    return this.selectedTrack()?.trackType || this.properties().emitterType || 'Projectile';
  });

  // --- Context-Sensitive Visibility Computeds ---
  readonly isSoundEffect = computed(() => {
    const t = this.activeEffectType();
    return t === 'Sound' || t === 'Audio';
  });

  readonly isAnchorRelevant = computed(() => {
    const t = this.activeEffectType();
    const spanning = [
      'Projectile', 'Projectile Volley', 'Object Projectile',
      'Trail', 'Beam', 'Cone Spray', 'Chain Lightning', 'Sound', 'Audio',
    ];
    return !spanning.includes(t);
  });

  readonly isFlightPathEffect = computed(() =>
    ['Projectile', 'Projectile Volley', 'Object Projectile', 'Trail'].includes(this.activeEffectType()),
  );

  readonly isVolleyEffect = computed(() => this.activeEffectType() === 'Projectile Volley');
  readonly isObjectProjectile = computed(() => this.activeEffectType() === 'Object Projectile');

  readonly isBeamOrLightning = computed(() =>
    ['Beam', 'Chain Lightning'].includes(this.activeEffectType()),
  );

  readonly isChainLightning = computed(() => this.activeEffectType() === 'Chain Lightning');
  readonly isConeEffect = computed(() => this.activeEffectType() === 'Cone Spray');

  readonly isRadialOrAreaEffect = computed(() =>
    [
      'Energy Column', 'Burst', 'Box Burst', 'Shockwave', 'Magic Circle',
      'Swirling Aura', 'Shield / Dome', 'Ground Area', 'Surface Mark', 'Light',
    ].includes(this.activeEffectType()),
  );

  readonly isHeightEffect = computed(() =>
    ['Energy Column', 'Wall', 'Shield / Dome', 'Swirling Aura', 'Box Burst'].includes(
      this.activeEffectType(),
    ),
  );

  readonly isBurstOrShockwave = computed(() =>
    ['Burst', 'Box Burst', 'Shockwave'].includes(this.activeEffectType()),
  );

  readonly isMagicCircle = computed(() => this.activeEffectType() === 'Magic Circle');
  readonly isWallEffect = computed(() => this.activeEffectType() === 'Wall');
  readonly isDebrisEffect = computed(() => this.activeEffectType() === 'Debris');

  readonly isParticleCloudEffect = computed(() =>
    [
      'Smoke / Mist', 'Sparks / Embers', 'Debris', 'Particle Emitter', 'Casting Charge',
    ].includes(this.activeEffectType()),
  );

  readonly isSwirlOrVortexEffect = computed(() =>
    ['Swirling Aura', 'Energy Column', 'Casting Charge', 'Smoke / Mist'].includes(
      this.activeEffectType(),
    ),
  );

  readonly tabChanged = output<EffectInspectorTabId>();
  readonly propertiesPatched = output<Partial<EffectEmitterCardVm>>();
  readonly motionPatched = output<Partial<EffectMotionForceConfigVm>>();
  readonly trackVisibilityToggled = output<string>();
  readonly trackPatched = output<{ trackId: string; patch: Partial<EffectTimelineTrackVm> }>();
  readonly addLayerRequested = output<void>();

  updateEffectType(nextType: string): void {
    this.propertiesPatched.emit({ emitterType: nextType });
    this.patchSelectedTrack({ trackType: nextType });
  }

  updateAppearance(nextApp: EffectAppearanceId): void {
    this.propertiesPatched.emit({ appearanceId: nextApp });
    this.patchSelectedTrack({ appearanceId: nextApp });
  }

  updatePrimaryColor(hex: string): void {
    this.propertiesPatched.emit({ colorPrimaryHex: hex });
    this.patchSelectedTrack({ colorHex: hex });
  }

  updateSecondaryColor(hex: string): void {
    this.propertiesPatched.emit({ colorSecondaryHex: hex });
    this.patchSelectedTrack({ accentHex: hex });
  }

  updateScale(scale: number): void {
    this.propertiesPatched.emit({ scale });
    this.patchSelectedTrack({ scale });
  }

  updateCount(count: number): void {
    this.propertiesPatched.emit({ count });
    this.patchSelectedTrack({ count });
  }

  updateOpacity(opacityPercent: number): void {
    this.propertiesPatched.emit({ opacityPercent });
    this.patchSelectedTrack({ opacityPercent });
  }

  updateAnimationModifier(animationModifier: EffectAnimationModifierId): void {
    this.propertiesPatched.emit({ animationModifier });
    this.patchSelectedTrack({ animationModifier });
  }

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
