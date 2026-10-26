import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgpAvatar, NgpAvatarFallback } from 'ng-primitives/avatar';
import { NgpButton } from 'ng-primitives/button';
import { NgpCheckbox } from 'ng-primitives/checkbox';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type LwInspectorTab = 'guide' | 'notes' | 'npcs' | 'places' | 'lore';

@Component({
  selector: 'lw-inspector-drawer',
  standalone: true,
  imports: [
    RouterLink,
    NgpButton,
    NgpCheckbox,
    NgpAvatar,
    NgpAvatarFallback,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
  ],
  templateUrl: './inspector-drawer.component.html',
  styleUrl: './inspector-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwInspectorDrawerComponent {
  readonly store = inject(LoomWeaverStoreService);

  readonly activeTab = signal<LwInspectorTab>('guide');
  readonly summaryExpanded = signal<boolean>(true);
  readonly beatsExpanded = signal<boolean>(true);
  readonly keyNpcsExpanded = signal<boolean>(true);
  readonly secretsExpanded = signal<boolean>(true);

  readonly tabs: { id: LwInspectorTab; label: string }[] = [
    { id: 'guide', label: 'Guide' },
    { id: 'notes', label: 'Notes' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'places', label: 'Places' },
    { id: 'lore', label: 'Lore' },
  ];

  readonly guide = computed(() => this.store.campaignDashboard().sessionGuide);

  readonly tabEntities = computed(() => {
    const tab = this.activeTab();
    const all = this.store.authorizedEntities();
    if (tab === 'npcs') {
      return all.filter((e) => e.entityType === 'NPC' || e.entityType === 'PlayerCharacter');
    }
    if (tab === 'places') {
      return all.filter((e) => e.entityType === 'Location' || e.entityType === 'Encounter');
    }
    if (tab === 'notes') {
      return all.filter((e) => e.entityType === 'Clue' || e.entityType === 'Quest');
    }
    return all;
  });

  toggleBeat(id: string): void {
    this.store.toggleSessionBeat(id);
  }

  inspectNpc(compositeKey: string): void {
    this.store.inspectEntity(compositeKey);
  }
}
