import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';

@Component({
  selector: 'lw-loom-launcher',
  standalone: true,
  imports: [FormsModule, RouterLink, NgpButton, NgpInput, LwBadgeComponent, LwButtonComponent],
  templateUrl: './loom-launcher.component.html',
  styleUrl: './loom-launcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwLoomLauncherComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly generativeAiEnabled = input<boolean>(false);

  setPrompt(prompt: string): void {
    this.store.loomQuery.set(prompt);
  }
}
