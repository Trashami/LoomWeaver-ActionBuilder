import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { EffectTimelineTrackVm } from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-effect-timeline-dock',
  standalone: true,
  imports: [NgpButton, LwIconComponent],
  templateUrl: './effect-timeline-dock.component.html',
  styleUrl: './effect-timeline-dock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectTimelineDockComponent {
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly selectedTrackId = input<string>('trk-light-beam');
  readonly isPlaying = input<boolean>(true);
  readonly playheadSeconds = input<number>(0.0);
  readonly totalDurationSeconds = input<number>(5.0);

  readonly timeMarkers = computed<readonly number[]>(() => {
    const max = Math.max(1, Math.floor(this.totalDurationSeconds()));
    const arr: number[] = [];
    for (let s = 0; s <= max; s++) {
      arr.push(s);
    }
    return arr;
  });

  readonly playheadPercent = computed<number>(() => {
    const d = Math.max(0.1, this.totalDurationSeconds());
    return Math.min(100, Math.max(0, (this.playheadSeconds() / d) * 100));
  });

  readonly playToggled = output<void>();
  readonly playheadScrubbed = output<number>();
  readonly trackSelected = output<string>();
  readonly trackVisibilityToggled = output<string>();
  readonly trackExpandedToggled = output<string>();

  formatTime(sec: number): string {
    return sec.toFixed(2);
  }

  trackLeftPct(track: EffectTimelineTrackVm): number {
    const d = Math.max(0.1, this.totalDurationSeconds());
    return Math.max(0, Math.min(98, (track.startTimeSeconds / d) * 100));
  }

  trackWidthPct(track: EffectTimelineTrackVm): number {
    const d = Math.max(0.1, this.totalDurationSeconds());
    const span = Math.max(0.15, track.endTimeSeconds - track.startTimeSeconds);
    return Math.max(3, Math.min(100 - this.trackLeftPct(track), (span / d) * 100));
  }

  onRulerClick(evt: MouseEvent, el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (evt.clientX - rect.left) / Math.max(1, rect.width)));
    this.playheadScrubbed.emit(ratio * this.totalDurationSeconds());
  }
}
