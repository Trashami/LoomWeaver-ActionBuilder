import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-inspector-drawer',
  standalone: true,
  imports: [RouterLink, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './inspector-drawer.component.html',
  styleUrl: './inspector-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInspectorDrawerComponent {
  readonly store = inject(LoomWeaverStoreService);
}
