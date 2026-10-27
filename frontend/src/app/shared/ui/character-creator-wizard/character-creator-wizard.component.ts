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
import {
  CREATOR_ANCESTRIES,
  CREATOR_BACKGROUNDS,
  CREATOR_CLASSES,
} from '../../../features/characters/models/character-creator-catalog.data';
import {
  AbilityScoreVm,
  CharacterCreatorDraftVm,
  CreatorAncestryOptionVm,
  CreatorBackgroundOptionVm,
  CreatorClassOptionVm,
  CreatorSubraceOptionVm,
} from '../../../features/characters/models/character-studio.models';
import { LwButtonComponent } from '../button/button.component';
import { LwCharacterPortraitPickerComponent } from '../character-portrait-picker/character-portrait-picker.component';
import { LwIconComponent } from '../icon/icon.component';

export interface LwCreatorWizardStepVm {
  readonly stepNumber: number;
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'lw-character-creator-wizard',
  standalone: true,
  imports: [
    FormsModule,
    NgpButton,
    LwIconComponent,
    LwButtonComponent,
    LwCharacterPortraitPickerComponent,
  ],
  templateUrl: './character-creator-wizard.component.html',
  styleUrl: './character-creator-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCharacterCreatorWizardComponent {
  readonly campaignName = input<string>('The Ashen Vale');
  readonly draft = input.required<CharacterCreatorDraftVm>();
  readonly activeStep = model<number>(1);
  readonly sourceFilter = model<'All' | 'PHB' | 'SRD 5.1' | 'Homebrew'>('All');
  readonly searchQuery = model<string>('');

  readonly draftPatched = output<Partial<CharacterCreatorDraftVm>>();
  readonly abilityAdjusted = output<{ code: AbilityScoreVm['code']; delta: number }>();
  readonly skillToggled = output<string>();
  readonly completed = output<void>();
  readonly closed = output<void>();

  readonly editingIdentity = signal<boolean>(false);

  readonly steps: readonly LwCreatorWizardStepVm[] = [
    { stepNumber: 1, id: 'ancestry', label: 'Ancestry' },
    { stepNumber: 2, id: 'class', label: 'Class' },
    { stepNumber: 3, id: 'background', label: 'Background' },
    { stepNumber: 4, id: 'abilities', label: 'Abilities' },
    { stepNumber: 5, id: 'skills', label: 'Skills' },
    { stepNumber: 6, id: 'feats', label: 'Feats & Options' },
    { stepNumber: 7, id: 'equipment', label: 'Equipment' },
    { stepNumber: 8, id: 'details', label: 'Details' },
  ];

  readonly sourceFilters: readonly ('All' | 'PHB' | 'SRD 5.1' | 'Homebrew')[] = [
    'All',
    'PHB',
    'SRD 5.1',
    'Homebrew',
  ];

  readonly allSkills: readonly string[] = [
    'Acrobatics',
    'Arcana',
    'Athletics',
    'Deception',
    'History',
    'Insight',
    'Investigation',
    'Medicine',
    'Nature',
    'Perception',
    'Persuasion',
    'Sleight of Hand',
    'Stealth',
    'Survival',
  ];

  readonly featChoices: readonly { id: string; title: string; summary: string }[] = [
    {
      id: 'Warcaster',
      title: 'Warcaster',
      summary: 'Advantage on Concentration saves and somatic casting with hands full.',
    },
    {
      id: 'Anelith Resonance Mastery',
      title: 'Anelith Resonance Mastery',
      summary: '+1 Intelligence or Wisdom and resistance to ancient runic ward feedback.',
    },
    {
      id: 'Cinth Artificer Overclock',
      title: 'Cinth Artificer Overclock',
      summary: 'Integrate clockwork plating for +1 AC and a protective reaction.',
    },
    {
      id: 'Alert',
      title: 'Alert',
      summary: '+5 bonus to Initiative and cannot be surprised while conscious.',
    },
  ];

  readonly filteredAncestries = computed<readonly CreatorAncestryOptionVm[]>(() => {
    const src = this.sourceFilter();
    const q = this.searchQuery().trim().toLowerCase();
    return CREATOR_ANCESTRIES.filter((a) => {
      if (src !== 'All' && a.source !== src && !a.subraces.some((sr) => sr.source === src)) {
        return false;
      }
      if (q && !a.name.toLowerCase().includes(q) && !a.tagline.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  });

  readonly selectedAncestry = computed<CreatorAncestryOptionVm>(
    () =>
      CREATOR_ANCESTRIES.find((a) => a.id === this.draft().ancestryId) ?? CREATOR_ANCESTRIES[1],
  );

  readonly selectedSubrace = computed<CreatorSubraceOptionVm>(
    () =>
      this.selectedAncestry().subraces.find((sr) => sr.id === this.draft().subraceId) ??
      this.selectedAncestry().subraces[0],
  );

  readonly classes = CREATOR_CLASSES;

  readonly selectedClass = computed<CreatorClassOptionVm>(
    () => CREATOR_CLASSES.find((c) => c.id === this.draft().classId) ?? CREATOR_CLASSES[0],
  );

  readonly backgrounds = CREATOR_BACKGROUNDS;

  readonly selectedBackground = computed<CreatorBackgroundOptionVm>(
    () =>
      CREATOR_BACKGROUNDS.find((b) => b.id === this.draft().backgroundId) ??
      CREATOR_BACKGROUNDS[0],
  );

  readonly summaryAbilities = computed<readonly AbilityScoreVm[]>(() => {
    const ab = this.draft().abilities;
    const codes: readonly { code: AbilityScoreVm['code']; label: string }[] = [
      { code: 'STR', label: 'Strength' },
      { code: 'DEX', label: 'Dexterity' },
      { code: 'CON', label: 'Constitution' },
      { code: 'INT', label: 'Intelligence' },
      { code: 'WIS', label: 'Wisdom' },
      { code: 'CHA', label: 'Charisma' },
    ];
    return codes.map((c) => {
      const score = ab[c.code] ?? 10;
      const modifier = Math.floor((score - 10) / 2);
      return { code: c.code, label: c.label, score, modifier };
    });
  });

  readonly computedAc = computed<number>(() => {
    const dexMod = this.summaryAbilities().find((a) => a.code === 'DEX')?.modifier ?? 0;
    return 10 + dexMod;
  });

  readonly computedHp = computed<number>(() => {
    const conMod = this.summaryAbilities().find((a) => a.code === 'CON')?.modifier ?? 0;
    return Math.max(6, this.selectedClass().hitDie + conMod);
  });

  readonly nextButtonLabel = computed<string>(() => {
    const step = this.activeStep();
    const nextStep = this.steps.find((s) => s.stepNumber === step + 1);
    return nextStep ? `Next: ${nextStep.label}` : 'Complete & View Character';
  });

  selectAncestry(ancestry: CreatorAncestryOptionVm): void {
    const defaultSub = ancestry.subraces[0];
    this.draftPatched.emit({
      ancestryId: ancestry.id,
      subraceId: defaultSub?.id ?? '',
      portraitUrl: defaultSub?.portraitUrl || ancestry.portraitUrl,
    });
  }

  selectSubrace(subrace: CreatorSubraceOptionVm): void {
    this.draftPatched.emit({
      subraceId: subrace.id,
      portraitUrl: subrace.portraitUrl,
    });
  }

  selectClass(cls: CreatorClassOptionVm): void {
    this.draftPatched.emit({
      classId: cls.id,
      subclass: cls.subclassDefault,
    });
  }

  selectBackground(bg: CreatorBackgroundOptionVm): void {
    this.draftPatched.emit({
      backgroundId: bg.id,
      quote: bg.defaultQuote,
    });
  }

  selectPortrait(url: string): void {
    this.draftPatched.emit({ portraitUrl: url });
  }

  cyclePortrait(delta: number): void {
    const gallery = this.selectedAncestry().galleryPortraits;
    if (!gallery.length) return;
    const current = this.draft().portraitUrl;
    const idx = Math.max(0, gallery.indexOf(current));
    const nextIdx = (idx + delta + gallery.length) % gallery.length;
    this.selectPortrait(gallery[nextIdx]);
  }

  advanceOrComplete(): void {
    const current = this.activeStep();
    if (current < 8) {
      this.activeStep.set(current + 1);
    } else {
      this.completed.emit();
    }
  }

  formatMod(mod: number): string {
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }
}
