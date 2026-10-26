import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { BabylonEffectStudioStageService } from '../../../features/effect-studio/engine/babylon-effect-studio-stage.service';
import {
  EffectCameraPreset,
  EffectEmitterCardVm,
  EffectGizmoToolId,
  EffectInGameTestResultVm,
  EffectMotionForceConfigVm,
  EffectTimelineTrackVm,
} from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-effect-viewport-stage',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './effect-viewport-stage.component.html',
  styleUrl: './effect-viewport-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectViewportStageComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('stageCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly stageEngine = inject(BabylonEffectStudioStageService);

  readonly activeProperties = input.required<EffectEmitterCardVm>();
  readonly motionAndForces = input.required<EffectMotionForceConfigVm>();
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly cameraPreset = input<EffectCameraPreset>('Isometric');
  readonly activeGizmo = input<EffectGizmoToolId>('move');
  readonly isPlaying = input<boolean>(true);
  readonly playheadSeconds = input<number>(0);
  readonly totalDurationSeconds = input<number>(5.0);
  readonly reducedMotion = input<boolean>(false);
  readonly testResult = input<EffectInGameTestResultVm | null>(null);

  readonly cameraPresets: readonly EffectCameraPreset[] = [
    'Isometric',
    'Top-Down',
    'Tactical Orbit',
    'Caster POV',
  ];

  readonly gizmoTools: readonly { id: EffectGizmoToolId; label: string; icon: string }[] = [
    { id: 'move', label: 'Translate Emitter', icon: 'cursor' },
    { id: 'rotate', label: 'Rotate Vortex', icon: 'compass' },
    { id: 'scale', label: 'Scale Radius', icon: 'maximize' },
    { id: 'grid', label: 'Toggle Grid', icon: 'grid' },
    { id: 'bounds', label: 'Show Volume Bounds', icon: 'cube' },
    { id: 'particles', label: 'Particle Burst', icon: 'zap' },
  ];

  readonly cameraPresetChanged = output<EffectCameraPreset>();
  readonly gizmoSelected = output<EffectGizmoToolId>();
  readonly playheadUpdated = output<number>();
  readonly addLayerRequested = output<void>();
  readonly duplicateLayerRequested = output<void>();

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    this.stageEngine.mountDungeonStage(
      canvas,
      this.activeProperties(),
      this.motionAndForces(),
      () => ({
        isPlaying: this.isPlaying(),
        playhead: this.playheadSeconds(),
        duration: this.totalDurationSeconds(),
        reducedMotion: this.reducedMotion(),
        props: this.activeProperties(),
        forces: this.motionAndForces(),
        tracks: this.tracks(),
      }),
      (nextSec) => this.playheadUpdated.emit(nextSec),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeProperties'] || changes['motionAndForces']) {
      this.stageEngine.rebuildActiveEffect(this.activeProperties(), this.motionAndForces());
    }
    if (changes['cameraPreset']) {
      this.stageEngine.applyCameraPreset(this.cameraPreset());
    }
  }

  ngOnDestroy(): void {
    this.stageEngine.dispose();
  }
}
