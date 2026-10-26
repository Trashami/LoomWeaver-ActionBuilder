import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetPickerComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwCompendiumEntryItem,
  LwCompendiumImporterComponent,
  LwPanelComponent,
  LwRulesOptionSelectorComponent,
  LwStatRadarComponent,
  PickableAssetItem,
  RulesOptionItem,
} from '../../shared/ui/public-api';
import { CharacterStudioService } from './services/character-studio.service';

const DEFAULT_COMPENDIUM: readonly LwCompendiumEntryItem[] = [
  {
    id: 'srd-spell-sunbeam-luminary',
    name: 'Luminary Sunbeam of the Anelith',
    category: 'Spell',
    systemCode: 'dnd5e',
    levelOrTier: '6th-Level Evocation',
    actionEconomy: '1 Action · Concentration (1 min)',
    summary:
      'Channels remnant Sidhe Ard creation weave into a 60-ft radiant beam; creatures make a CON save or take 6d8 Radiant damage and are blinded.',
    mechanicalPayload: '6d8 Radiant · CON Save DC 17 · 60 ft Line',
  },
  {
    id: 'srd-item-quiet-maw-pouch',
    name: 'The Quiet Maw (Extradimensional Stasis Stitch)',
    category: 'Equipment',
    systemCode: 'dnd5e',
    levelOrTier: 'Wondrous Item (Very Rare)',
    actionEconomy: 'Passive / Reaction',
    summary:
      "Sewn by Kycius inside Dolly's mouth along the Cinth road; creatures swallowed enter a harmless pocket plane rather than suffering lethal bite damage.",
    mechanicalPayload: 'WIS Save DC 16 · Non-Lethal Extradimensional Containment',
  },
  {
    id: 'srd-item-artificer-condenser',
    name: 'Cinth Phosphor-Bronze Arc Condenser',
    category: 'Equipment',
    systemCode: 'dnd5e',
    levelOrTier: 'Artificer Guild Relic (Rare)',
    actionEconomy: '1 Bonus Action',
    summary:
      'Post-Moonlight Wars non-magical defensive capacitor built by the Cinth Artificers Guild to counter unregistered wizardry and vampire thralls.',
    mechanicalPayload: '+2 AC vs. Spell Attacks · 3d8 Lightning Counter-Arc',
  },
  {
    id: 'srd-feat-stone-sense-scholar',
    name: "Kildrid's Deep-Mountain Stone Sense",
    category: 'Feat',
    systemCode: 'dnd5e',
    levelOrTier: 'Dwarven Heritage Feat',
    actionEconomy: '1 Bonus Action (60 ft Tremorsense)',
    summary:
      'Allows the bearer to sense subterranean rune wards, hollow caverns, and ancient bound dragons clawing at bedrock up to half a league away.',
    mechanicalPayload: 'Advantage on History/Masonry · 60 ft Runic Tremorsense',
  },
  {
    id: 'srd-spell-laksis-ignition',
    name: 'Laksis Tandem Fire-Drake Volley',
    category: 'Spell',
    systemCode: 'dnd5e',
    levelOrTier: '3rd-Level Conjuration / Evocation',
    actionEconomy: '1 Bonus Action (Familiar Command)',
    summary:
      "Kycius's fire drake familiar Laksis exhales a concentrated cinder arc that ignites targets and illuminates fog-of-war tiles.",
    mechanicalPayload: '4d6 Fire · DEX Save DC 16 · 15 ft Cone',
  },
  {
    id: 'srd-feat-slingshot-tooth-crit',
    name: "Fivi's Improvised Fey Slingshot Mastery",
    category: 'Feat',
    systemCode: 'dnd5e',
    levelOrTier: 'Feywild Outcast Trick',
    actionEconomy: '1 Action (60/120 ft)',
    summary:
      'Loads a tooth, pebble, or brass gear into a slingshot; critical hits bypass magical resistance and deal bonus force trauma to targets at 1 HP.',
    mechanicalPayload: '1d8+4 Force/Bludgeoning · Crit Range 19-20',
  },
];

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
    LwCompendiumImporterComponent,
  ],
  templateUrl: './characters.page.html',
  styleUrl: './characters.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharactersPageComponent {
  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);
  readonly studio = inject(CharacterStudioService);
  readonly compendiumEntries = signal<readonly LwCompendiumEntryItem[]>(DEFAULT_COMPENDIUM);
  readonly compendiumStatus = signal<string>('5e SRD + Icrandor Canon Compendium ready for one-click sheet import.');

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
      icon: 'book',
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

  constructor() {
    this.http.get<readonly LwCompendiumEntryItem[]>('/api/v2/compendium/search').subscribe({
      next: (res) => {
        if (res?.length) this.compendiumEntries.set(res);
      },
      error: () => {},
    });
  }

  importCompendiumEntry(entry: LwCompendiumEntryItem): void {
    this.studio.executeLevelUp(`${entry.name} (${entry.mechanicalPayload})`, 'INT');
    this.compendiumStatus.set(
      `Imported '${entry.name}' (${entry.category}) onto ${this.studio.activeSheet().name}'s sheet.`,
    );
  }
}
