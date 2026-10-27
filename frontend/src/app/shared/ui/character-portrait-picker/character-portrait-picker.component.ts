import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import {
  CHARACTER_3D_PORTRAIT_PRESETS,
  CharacterPortraitPresetVm,
  FIVE_E_TOOLS_PORTRAIT_PRESETS,
} from '../../../features/characters/models/character-portrait-catalog.data';
import { LwIconComponent } from '../icon/icon.component';

export type LwPortraitSourceTab = '5e-tools' | '3d-character';

@Component({
  selector: 'lw-character-portrait-picker',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './character-portrait-picker.component.html',
  styleUrl: './character-portrait-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwCharacterPortraitPickerComponent {
  readonly portraitUrl = input.required<string>();
  readonly characterName = input<string>('Character Portrait');
  readonly minHeight = input<string>('460px');

  readonly portraitSelected = output<string>();

  readonly pickerOpen = signal<boolean>(false);
  readonly activeTab = signal<LwPortraitSourceTab>('5e-tools');
  readonly searchQuery = signal<string>('');

  readonly filteredPresets = computed<readonly CharacterPortraitPresetVm[]>(() => {
    const source =
      this.activeTab() === '5e-tools'
        ? FIVE_E_TOOLS_PORTRAIT_PRESETS
        : CHARACTER_3D_PORTRAIT_PRESETS;
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q),
    );
  });

  togglePicker(): void {
    this.pickerOpen.update((v) => !v);
  }

  selectPreset(preset: CharacterPortraitPresetVm): void {
    this.portraitSelected.emit(preset.imageUrl);
    this.pickerOpen.set(false);
  }

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement | null;
    const file = inputEl?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.length > 0) {
        this.portraitSelected.emit(reader.result);
        this.pickerOpen.set(false);
      }
    };
    reader.readAsDataURL(file);
    inputEl.value = '';
  }
}
