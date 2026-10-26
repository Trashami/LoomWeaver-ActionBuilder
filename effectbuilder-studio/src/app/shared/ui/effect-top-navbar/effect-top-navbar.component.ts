import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { LwIconComponent } from '../icon/icon.component';

export interface LwEffectNavLinkItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly icon: string;
  readonly active?: boolean;
}

@Component({
  selector: 'lw-effect-top-navbar',
  standalone: true,
  imports: [FormsModule, NgpButton, LwIconComponent],
  templateUrl: './effect-top-navbar.component.html',
  styleUrl: './effect-top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectTopNavbarComponent {
  readonly brandTitle = input<string>('LoomWeaver');
  readonly searchPlaceholder = input<string>('Search assets, spells, or effects...');
  readonly searchQuery = input<string>('');
  readonly userInitials = input<string>('JD');
  readonly navItems = input<readonly LwEffectNavLinkItem[]>([
    { id: 'campaign', label: 'Campaign', href: 'https://loom-weaver.com/campaigns', icon: 'cube' },
    { id: 'weave', label: 'The Weave', href: 'https://loom-weaver.com/weave', icon: 'network' },
    { id: 'maps', label: 'Maps', href: 'https://maps.loom-weaver.com', icon: 'map' },
    { id: 'encounters', label: 'Encounters', href: 'https://loom-weaver.com/encounters', icon: 'globe' },
    { id: 'npcs', label: 'NPCs', href: 'https://loom-weaver.com/characters', icon: 'users' },
    { id: 'library', label: 'Library', href: 'https://loom-weaver.com/assets', icon: 'book' },
    { id: 'effect-builder', label: 'Effect Builder', href: '/', icon: 'target', active: true },
  ]);

  readonly searchChanged = output<string>();
  readonly accountPressed = output<void>();
  readonly settingsPressed = output<void>();
}
