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
  signal,
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
  EffectViewDimensionMode,
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
  @ViewChild('viewportFrame') private frameRef?: ElementRef<HTMLElement>;

  private readonly stageEngine = inject(BabylonEffectStudioStageService);

  readonly activeProperties = input.required<EffectEmitterCardVm>();
  readonly motionAndForces = input.required<EffectMotionForceConfigVm>();
  readonly tracks = input<readonly EffectTimelineTrackVm[]>([]);
  readonly cameraPreset = input<EffectCameraPreset>('Isometric');
  readonly viewDimensionMode = input<EffectViewDimensionMode>('3d');
  readonly activeGizmo = input<EffectGizmoToolId>('move');
  readonly isPlaying = input<boolean>(true);
  readonly playheadSeconds = input<number>(0);
  readonly totalDurationSeconds = input<number>(5.0);
  readonly reducedMotion = input<boolean>(false);
  readonly testResult = input<EffectInGameTestResultVm | null>(null);

  readonly stoneSample = signal<boolean>(true);
  readonly gridVisible = signal<boolean>(true);
  readonly ambientIntensity = signal<number>(0.44);
  readonly bumpStrength = signal<number>(1.25);
  readonly movingTarget = signal<boolean>(false);

  readonly cameraPresets: readonly EffectCameraPreset[] = [
    'Isometric',
    'Top-Down',
    'Tactical Orbit',
    'Caster POV',
  ];

  readonly cameraPresetChanged = output<EffectCameraPreset>();
  readonly viewDimensionModeChanged = output<EffectViewDimensionMode>();
  readonly gizmoSelected = output<EffectGizmoToolId>();
  readonly playheadUpdated = output<number>();
  readonly addLayerRequested = output<void>();
  readonly duplicateLayerRequested = output<void>();

  private readonly onGlobalWheelCapture = (event: WheelEvent): void => {
    const frameEl = this.frameRef?.nativeElement;
    const isInsideViewport = !!frameEl && frameEl.contains(event.target as Node);

    // Always block trackpad pinch-zoom (ctrlKey/metaKey wheel) anywhere in the studio app,
    // and block wheel page-scroll/zoom when the cursor is over the 2D/3D viewport.
    if (event.ctrlKey || event.metaKey || isInsideViewport) {
      event.preventDefault();
      if (isInsideViewport) {
        this.stageEngine.zoomByDelta(event.deltaY);
      }
    }
  };

  private readonly onGesturePrevent = (event: Event): void => {
    event.preventDefault();
  };

  private readonly onTouchMoveCapture = (event: TouchEvent): void => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  };

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('wheel', this.onGlobalWheelCapture, {
        passive: false,
        capture: true,
      });
      window.addEventListener('gesturestart', this.onGesturePrevent, {
        passive: false,
        capture: true,
      });
      window.addEventListener('gesturechange', this.onGesturePrevent, {
        passive: false,
        capture: true,
      });
      window.addEventListener('touchmove', this.onTouchMoveCapture, {
        passive: false,
        capture: true,
      });
    }

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
    this.stageEngine.setViewDimensionMode(this.viewDimensionMode());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['viewDimensionMode']) {
      this.stageEngine.setViewDimensionMode(this.viewDimensionMode());
    }
    if (changes['cameraPreset']) {
      this.stageEngine.applyCameraPreset(this.cameraPreset());
    }
    if (changes['activeGizmo'] && this.activeGizmo() === 'particles') {
      this.stageEngine.triggerStructuralSpellCast(this.activeProperties());
    }
  }

  setDimension(mode: EffectViewDimensionMode): void {
    this.stageEngine.setViewDimensionMode(mode);
    this.viewDimensionModeChanged.emit(mode);
  }

  toggleStoneSample(checked: boolean): void {
    this.stoneSample.set(checked);
    this.stageEngine.setSurfaceSettings({ stoneSample: checked });
  }

  toggleGrid(checked: boolean): void {
    this.gridVisible.set(checked);
    this.stageEngine.setSurfaceSettings({ gridVisible: checked });
  }

  updateAmbient(val: number): void {
    this.ambientIntensity.set(val);
    this.stageEngine.setSurfaceSettings({ ambientIntensity: val });
  }

  updateBump(val: number): void {
    this.bumpStrength.set(val);
    this.stageEngine.setSurfaceSettings({ bumpStrength: val });
  }

  toggleMovingTarget(checked: boolean): void {
    this.movingTarget.set(checked);
    this.stageEngine.setSurfaceSettings({ movingTarget: checked });
  }

  zoomStep(direction: 'in' | 'out'): void {
    this.stageEngine.zoomByDelta(direction === 'in' ? -100 : 100);
  }

  resetCamera(): void {
    this.stageEngine.resetView();
  }

  replayCurrentComposition(): void {
    this.stageEngine.triggerTimelineComposition(this.tracks(), this.activeProperties());
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('wheel', this.onGlobalWheelCapture, true);
      window.removeEventListener('gesturestart', this.onGesturePrevent, true);
      window.removeEventListener('gesturechange', this.onGesturePrevent, true);
      window.removeEventListener('touchmove', this.onTouchMoveCapture, true);
    }
    this.stageEngine.dispose();
  }
}
