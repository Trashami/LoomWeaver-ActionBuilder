import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpProgress, NgpProgressIndicator, NgpProgressTrack } from 'ng-primitives/progress';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import {
  AbilityScoreVm,
  CharacterConnectionChipVm,
  CharacterSheetTab,
  CharacterSheetVm,
  EquipmentLoadoutItemVm,
} from '../../../features/characters/models/character-studio.models';
import { LwButtonComponent } from '../button/button.component';
import { LwCharacterPortraitPickerComponent } from '../character-portrait-picker/character-portrait-picker.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-character-sheet-view',
  standalone: true,
  imports: [
    FormsModule,
    NgpButton,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpProgress,
    NgpProgressTrack,
    NgpProgressIndicator,
    LwIconComponent,
    LwButtonComponent,
    LwCharacterPortraitPickerComponent,
  ],
  templateUrl: './character-sheet-view.component.html',
  styleUrl: './character-sheet-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCharacterSheetViewComponent {
  readonly sheet = input.required<CharacterSheetVm>();
  readonly partyRoster = input<readonly CharacterSheetVm[]>([]);
  readonly activeTab = model<CharacterSheetTab>('overview');

  readonly characterSelected = output<string>();
  readonly createCharacterRequested = output<void>();
  readonly editCharacterRequested = output<CharacterSheetVm>();
  readonly studioRosterRequested = output<void>();
  readonly levelUpRequested = output<{ featureName: string; abilityCode: AbilityScoreVm['code'] }>();
  readonly portraitChangeRequested = output<void>();
  readonly portraitSelected = output<string>();
  readonly abilityAdjusted = output<{ code: AbilityScoreVm['code']; delta: number }>();
  readonly equipmentToggled = output<string>();
  readonly connectionSelected = output<CharacterConnectionChipVm>();
  readonly noteAdded = output<string>();

  readonly editingAbilities = signal<boolean>(false);
  readonly newNoteText = signal<string>('');
  readonly levelUpAbilityCode = signal<AbilityScoreVm['code']>('INT');
  readonly levelUpPerkName = signal<string>('Anelith Resonance Mastery');

  readonly levelUpPerkChoices: readonly string[] = [
    'Anelith Resonance Mastery',
    'Cinth Artificer Overclock',
    'Shadow of the Mountain Ward',
    'Warcaster Concentration Mastery',
  ];

  readonly tabs: readonly { id: CharacterSheetTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'abilities', label: 'Abilities' },
    { id: 'skills', label: 'Skills' },
    { id: 'feats', label: 'Feats & Features' },
    { id: 'spells', label: 'Spells' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'background', label: 'Background' },
    { id: 'notes', label: 'Notes' },
    { id: 'connections', label: 'Connections' },
    { id: 'history', label: 'History' },
  ];

  readonly xpProgressPercent = computed<number>(() => {
    const s = this.sheet();
    if (!s.nextLevelXp || s.nextLevelXp <= 0) return 75;
    return Math.max(8, Math.min(100, Math.round((s.currentXp / s.nextLevelXp) * 100)));
  });

  readonly primaryAbilityCode = computed<AbilityScoreVm['code']>(() => {
    const sorted = [...this.sheet().abilities].sort((a, b) => b.score - a.score);
    return sorted[0]?.code ?? 'INT';
  });

  readonly primaryAbilityMod = computed<number>(() => {
    const code = this.primaryAbilityCode();
    return this.sheet().abilities.find((a) => a.code === code)?.modifier ?? 3;
  });

  readonly spellSaveDc = computed<number>(
    () => 8 + this.sheet().proficiencyBonus + this.primaryAbilityMod(),
  );

  readonly proficientSkillsCount = computed<number>(
    () => this.sheet().skills.filter((sk) => sk.proficient).length,
  );

  readonly carryingCapacityLbs = computed<number>(() => {
    const str = this.sheet().abilities.find((a) => a.code === 'STR')?.score ?? 10;
    return str * 15;
  });

  readonly classFeatures = computed(() =>
    this.sheet().featureCards.filter((f) => f.category === 'class'),
  );

  readonly featFeatures = computed(() =>
    this.sheet().featureCards.filter((f) => f.category !== 'class'),
  );

  formatMod(mod: number, bracketed = false): string {
    const signed = mod >= 0 ? `+${mod}` : `${mod}`;
    return bracketed ? `[${signed}]` : signed;
  }

  saveForAbility(code: AbilityScoreVm['code']) {
    return this.sheet().savingThrows.find((sv) => sv.code === code);
  }

  toggleEquipmentItem(item: EquipmentLoadoutItemVm): void {
    this.equipmentToggled.emit(item.id);
  }

  triggerLevelUp(): void {
    this.levelUpRequested.emit({
      featureName: this.levelUpPerkName(),
      abilityCode: this.levelUpAbilityCode(),
    });
  }

  submitNote(): void {
    const text = this.newNoteText().trim();
    if (!text) return;
    this.noteAdded.emit(text);
    this.newNoteText.set('');
  }
}
