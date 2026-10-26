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
import { EffectStudioMode } from './models/effect-studio.models';
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

  onModeChanged(mode: EffectStudioMode): void {
    this.studio.activeMode.set(mode);
    if (mode === 'ingame') {
      this.studio.runInGameTest();
    } else if (mode === 'preview') {
      this.studio.isPlaying.set(true);
    }
  }

  onNavigateBack(): void {
    if (typeof window !== 'undefined') {
      window.location.href = 'https://loom-weaver.com/effects';
    }
  }
}
