import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetPickerComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
  LwRulesOptionSelectorComponent,
  LwStatRadarComponent,
  PickableAssetItem,
  RulesOptionItem,
} from '../../shared/ui/public-api';
import { CharacterStudioService } from './services/character-studio.service';

@Component({
  selector: 'lw-characters-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwRulesOptionSelectorComponent,
    LwAssetPickerComponent,
    LwStatRadarComponent,
  ],
  templateUrl: './characters.page.html',
  styleUrl: './characters.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharactersPageComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly studio = inject(CharacterStudioService);

  readonly newCharName = signal<string>('');
  readonly newCharAncestry = signal<string>('Cinth Artificer Guildborn');
  readonly newCharArchetype = signal<string>('Clockwork Aegis Artificer');
  readonly selectedPerk = signal<string>('Anelith Resonance Mastery (+1 Feat & Ward)');

  readonly ruleSystemOptions: readonly RulesOptionItem[] = [
    {
      id: 'dnd5e',
      label: 'D&D 5e (2024 / SRD)',
      subtitle: 'd20 Ability Modifiers · Proficiency +3/+4 · Action / Bonus / Reaction',
      badge: 'Active Ruleset',
      badgeTone: 'gold',
      icon: 'shield',
    },
    {
      id: 'pf2e',
      label: 'Pathfinder 2e',
      subtitle: 'Level-Scaled Proficiency (TEML) · 3-Action Economy · Focus Pool',
      badge: 'Supported',
      badgeTone: 'emerald',
      icon: 'swords',
    },
    {
      id: 'vampire_v5',
      label: 'Vampire: The Masquerade V5',
      subtitle: 'Attribute + Skill Dice Pools (1-5 Dots) · Hunger & Rouse Checks',
      badge: 'Supported',
      badgeTone: 'neutral',
      icon: 'sparkles',
    },
  ];

  readonly levelUpPerkOptions: readonly RulesOptionItem[] = [
    {
      id: 'Anelith Resonance Mastery (+1 Feat & Ward)',
      label: 'Anelith Resonance Mastery',
      subtitle: 'Gain +1 primary ability score and resistance to runic trap feedback.',
      badge: 'Recommended',
      badgeTone: 'gold',
    },
    {
      id: 'Cinth Artificer Overclock (+1 AC & Reaction)',
      label: 'Cinth Artificer Overclock',
      subtitle: 'Integrate guild clockwork plating for +1 AC and reaction parry.',
      badge: 'Defense',
      badgeTone: 'emerald',
    },
    {
      id: 'Shadow of the Mountain Vigilance (+Init & Tremor)',
      label: 'Shadow of the Mountain Vigilance',
      subtitle: 'Cannot be surprised inside underground caverns or vampire courts.',
      badge: 'Tactical',
      badgeTone: 'neutral',
    },
  ];

  readonly equipmentPickerItems = computed<readonly PickableAssetItem[]>(() =>
    this.studio.activeSheet().equipment.map((eq) => ({
      id: eq.id,
      name: eq.name,
      category: eq.slot,
      summary: eq.summary,
      bonusLabel: eq.bonusLabel,
      entitlement: eq.entitlement,
      equippedOrActive: eq.equipped,
    })),
  );

  onSystemSelected(sysId: string): void {
    if (sysId === 'dnd5e' || sysId === 'pf2e' || sysId === 'vampire_v5') {
      this.studio.activeSystem.set(sysId);
    }
  }

  createNewHero(): void {
    this.studio.createCharacter(
      this.newCharName(),
      this.newCharAncestry(),
      this.newCharArchetype(),
    );
    this.newCharName.set('');
  }
}
