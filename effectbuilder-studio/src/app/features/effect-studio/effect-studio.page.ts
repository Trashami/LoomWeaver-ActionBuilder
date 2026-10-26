import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  LwAuthModalComponent,
  LwEffectPropertiesInspectorComponent,
  LwEffectSubHeaderComponent,
  LwEffectTimelineDockComponent,
  LwEffectToolRailComponent,
  LwEffectTopNavbarComponent,
  LwEffectViewportStageComponent,
  LwEmitterLibraryPanelComponent,
} from '../../shared/ui/public-api';
import { BabylonEffectStudioStageService } from './engine/babylon-effect-studio-stage.service';
import {
  EffectAppearancePresetVm,
  EffectCompositePresetVm,
  EffectEmitterCardVm,
  EffectStudioMode,
} from './models/effect-studio.models';
import { EffectStudioStoreService } from './services/effect-studio-store.service';

@Component({
  selector: 'lw-effect-studio-page',
  standalone: true,
  imports: [
    LwEffectTopNavbarComponent,
    LwEffectSubHeaderComponent,
    LwEffectToolRailComponent,
    LwEmitterLibraryPanelComponent,
    LwEffectViewportStageComponent,
    LwEffectTimelineDockComponent,
    LwEffectPropertiesInspectorComponent,
    LwAuthModalComponent,
  ],
  templateUrl: './effect-studio.page.html',
  styleUrl: './effect-studio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectStudioPageComponent {
  readonly studio = inject(EffectStudioStoreService);
  readonly auth = inject(AuthSessionService);
  private readonly stageEngine = inject(BabylonEffectStudioStageService);

  onModeChanged(mode: EffectStudioMode): void {
    this.studio.activeMode.set(mode);
    if (mode === 'ingame') {
      this.studio.runInGameTest();
      this.stageEngine.triggerTimelineComposition(
        this.studio.tracks(),
        this.studio.activeProperties(),
        this.studio.motionAndForces().soundVolumePercent,
      );
    } else if (mode === 'preview') {
      this.studio.isPlaying.set(true);
      this.stageEngine.triggerTimelineComposition(
        this.studio.tracks(),
        this.studio.activeProperties(),
        this.studio.motionAndForces().soundVolumePercent,
      );
    }
  }

  onEmitterSelected(emitter: EffectEmitterCardVm): void {
    this.studio.selectEmitter(emitter);
    this.stageEngine.triggerStructuralSpellCast(emitter);
  }

  onAppearanceSelected(appearance: EffectAppearancePresetVm): void {
    this.studio.selectAppearance(appearance);
    this.stageEngine.triggerStructuralSpellCast(this.studio.activeProperties());
  }

  onPresetSelected(preset: EffectCompositePresetVm): void {
    this.studio.selectPreset(preset);
    this.stageEngine.triggerTimelineComposition(
      this.studio.tracks(),
      this.studio.activeProperties(),
      this.studio.motionAndForces().soundVolumePercent,
    );
  }

  onNavigateBack(): void {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://loom-weaver.com/dashboard';
    }
  }
}
