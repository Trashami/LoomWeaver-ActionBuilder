import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';

interface EffectRulePreset {
  readonly id: string;
  readonly name: string;
  readonly triggerWhen: string;
  readonly conditionIf: string;
  readonly executeThen: string;
  readonly trajectory: string;
}

@Component({
  selector: 'lw-effects-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwAssetCardComponent,
  ],
  templateUrl: './effects.page.html',
  styleUrl: './effects.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly activePresetId = signal<string>('fx-anelith-seal');
  readonly lastFiredLog = signal<string>(
    'Ready: Select a When / If / Then rule preset and click Test Trajectory on VTT Stage.',
  );

  readonly presets: readonly EffectRulePreset[] = [
    {
      id: 'fx-anelith-seal',
      name: 'Anelith Hexagonal Binding Pulse',
      triggerWhen: 'WHEN: Ability Cast or Rune Triggered',
      conditionIf: 'IF: Target within 30ft Hex Radius & Failed DEX/WIS Save',
      executeThen: 'THEN: Spawn Gold Geometric Decal + Apply Restrained + Deal 4d10 Radiant',
      trajectory: 'Ground AoE Sigil + Vertical Beam',
    },
    {
      id: 'fx-laksis-drake',
      name: 'Laksis Fire Drake Cinder Cone',
      triggerWhen: 'WHEN: Familiar Bonus Action Triggered',
      conditionIf: 'IF: Line of Sight Clear (15ft Cone)',
      executeThen: 'THEN: Emit Ember Particle Cone + Ignite Flammable Props',
      trajectory: '15ft Directional Cone',
    },
    {
      id: 'fx-dolly-gullet',
      name: 'Dolly Pocket-Maw Containment Snap',
      triggerWhen: 'WHEN: Melee Grapple / Swallow Check Succeeds',
      conditionIf: 'IF: Target Size <= Medium',
      executeThen: 'THEN: Play Fey Stitch Portal Ripple + Transfer Token to Non-Lethal Pocket',
      trajectory: 'Point-Blank Tether Arc',
    },
  ];

  readonly spellAssets = computed(() =>
    this.store.assets().filter((a) => a.category === 'Spell FX'),
  );

  triggerPreset(preset: EffectRulePreset): void {
    this.activePresetId.set(preset.id);
    this.lastFiredLog.set(
      `Executed [${preset.name}] -> ${preset.trajectory} -> ${preset.executeThen}`,
    );
  }
}
