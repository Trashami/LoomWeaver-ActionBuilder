import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpToolbar } from 'ng-primitives/toolbar';
import {
  CampaignCharacterOptionVm,
  CampaignEffectAssignmentVm,
  CampaignSummaryVm,
} from '../../../features/effect-studio/models/effect-studio.models';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-effect-top-navbar',
  standalone: true,
  imports: [FormsModule, NgpButton, NgpAvatar, NgpAvatarFallback, NgpToolbar, LwIconComponent],
  templateUrl: './effect-top-navbar.component.html',
  styleUrl: './effect-top-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwEffectTopNavbarComponent {
  readonly campaigns = input<readonly CampaignSummaryVm[]>([]);
  readonly activeCampaignId = input<number>(1);
  readonly viewerRole = input<'gm' | 'players'>('gm');
  readonly characters = input<readonly CampaignCharacterOptionVm[]>([]);
  readonly selectedCharacterKey = input<string>('pc-kildrid');
  readonly selectedSpellName = input<string>('Rune Vortex');
  readonly activeEffectName = input<string>('Rune Vortex');
  readonly assignments = input<readonly CampaignEffectAssignmentVm[]>([]);
  readonly isPushing = input<boolean>(false);
  readonly navCollapsed = input<boolean>(false);
  readonly userDisplayName = input<string>('Jason (GeoJason)');
  readonly userInitials = input<string>('JA');

  readonly navToggleRequested = output<void>();
  readonly campaignChanged = output<number>();
  readonly viewerRoleToggled = output<'gm' | 'players'>();
  readonly characterChanged = output<string>();
  readonly spellChanged = output<string>();
  readonly pushToCampaignPressed = output<void>();

  readonly activeCampaign = computed(
    () =>
      this.campaigns().find((c) => c.id === this.activeCampaignId()) ?? {
        id: 1,
        slug: 'shadow-of-the-mountain',
        name: 'Shadow of the Mountain',
        subtitle: '',
        systemCode: 'dnd5e',
        worldName: 'Icrandor',
        currentAct: 'Act II',
        currentSessionNumber: 14,
        currentLocationName: 'Cinth',
        weaveEnabled: true,
      },
  );

  readonly selectedCharacter = computed(
    () =>
      this.characters().find((c) => c.characterKey === this.selectedCharacterKey()) ??
      this.characters()[0] ??
      null,
  );

  readonly availableSpells = computed(() => {
    const ch = this.selectedCharacter();
    const baseSpells = ch?.knownSpells ?? ['Rune Vortex', 'Fireball', 'Magic Missile'];
    const current = this.selectedSpellName().trim();
    if (current && !baseSpells.includes(current)) {
      return [current, ...baseSpells];
    }
    return baseSpells;
  });

  readonly currentSpellAssignment = computed(() => {
    const charKey = this.selectedCharacterKey();
    const spell = this.selectedSpellName().trim().toLowerCase();
    return (
      this.assignments().find(
        (a) => a.characterKey === charKey && a.spellName.toLowerCase() === spell,
      ) ?? null
    );
  });

  toggleRole(): void {
    this.viewerRoleToggled.emit(this.viewerRole() === 'gm' ? 'players' : 'gm');
  }
}
