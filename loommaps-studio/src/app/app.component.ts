import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthSessionService } from '../../../frontend/src/app/core/services/auth-session.service';
import { LoomWeaverStoreService } from '../../../frontend/src/app/core/services/loomweaver-store.service';
import { MapsPageComponent } from '../../../frontend/src/app/features/maps/maps.page';
import { LwAppHeaderBarComponent } from '../../../frontend/src/app/shared/ui/app-header-bar/app-header-bar.component';
import { LwLoomLauncherComponent } from '../../../frontend/src/app/shared/ui/loom-launcher/loom-launcher.component';

@Component({
  selector: 'lw-maps-studio-root',
  standalone: true,
  imports: [
    LwAppHeaderBarComponent,
    LwLoomLauncherComponent,
    MapsPageComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoomMapsStudioAppComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly auth = inject(AuthSessionService);
  readonly loomDrawerOpen = signal<boolean>(false);

  onCampaignSelected(campaignId: number): void {
    this.store.setCampaign(campaignId);
  }

  onToggleViewerRole(): void {
    this.store.setViewerRole(this.store.viewerRole() === 'gm' ? 'players' : 'gm');
  }
}
