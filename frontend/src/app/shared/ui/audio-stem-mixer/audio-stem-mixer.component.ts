import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export interface LwAudioStemItem {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly waveform: string;
  readonly baseFrequencyHz: number;
  readonly gain: number;
}

export interface LwAudioScenePresetItem {
  readonly id: string;
  readonly name: string;
  readonly mood: string;
  readonly bpm: number;
  readonly keySignature: string;
  readonly description: string;
  readonly crossfadeSeconds: number;
  readonly stemGains: Readonly<Record<string, number>>;
}

export interface LwStemGainChangeEvent {
  readonly stemId: string;
  readonly gain: number;
}

@Component({
  selector: 'lw-audio-stem-mixer',
  standalone: true,
  imports: [LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './audio-stem-mixer.component.html',
  styleUrl: './audio-stem-mixer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAudioStemMixerComponent {
  readonly isPlaying = input<boolean>(false);
  readonly activePresetId = input<string>('preset-cinth-ballroom');
  readonly masterVolume = input<number>(0.8);
  readonly stems = input<readonly LwAudioStemItem[]>([]);
  readonly presets = input<readonly LwAudioScenePresetItem[]>([]);

  readonly togglePlaybackRequested = output<void>();
  readonly presetTransitionRequested = output<string>();
  readonly stemGainChanged = output<LwStemGainChangeEvent>();
  readonly masterVolumeChanged = output<number>();

  onStemSliderInput(stemId: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const gain = Number(target.value);
    this.stemGainChanged.emit({ stemId, gain });
  }

  onMasterSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.masterVolumeChanged.emit(Number(target.value));
  }
}
