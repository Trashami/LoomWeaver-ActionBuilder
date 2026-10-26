import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type LwInspectorTab = 'guide' | 'notes' | 'npcs' | 'places' | 'lore';

export interface LwSceneCheckItem {
  id: string;
  label: string;
  done: boolean;
}

export interface LwKeyNpcQuickRef {
  compositeKey: string;
  name: string;
  role: string;
  initials: string;
  ringColor: string;
}

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

  readonly activeTab = signal<LwInspectorTab>('guide');
  readonly summaryExpanded = signal<boolean>(true);
  readonly beatsExpanded = signal<boolean>(true);
  readonly keyNpcsExpanded = signal<boolean>(true);
  readonly secretsExpanded = signal<boolean>(true);
  readonly goalsExpanded = signal<boolean>(true);

  readonly tabs: { id: LwInspectorTab; label: string }[] = [
    { id: 'guide', label: 'Guide' },
    { id: 'notes', label: 'Notes' },
    { id: 'npcs', label: 'NPCs' },
    { id: 'places', label: 'Places' },
    { id: 'lore', label: 'Lore' },
  ];

  readonly sceneBeats = signal<LwSceneCheckItem[]>([
    { id: 'beat-1', label: 'Arrival at the ruined chapel', done: true },
    { id: 'beat-2', label: 'Speaking with Brother Malric', done: true },
    { id: 'beat-3', label: 'Tracks leading to the crypt', done: false },
    { id: 'beat-4', label: 'Ambush in the courtyard', done: false },
  ]);

  readonly sceneGoals = signal<LwSceneCheckItem[]>([
    { id: 'goal-1', label: 'Uncover the source of the whispers', done: false },
    { id: 'goal-2', label: 'Gain the trust of the chapel keepers', done: false },
    { id: 'goal-3', label: 'Decide whether to open the crypt', done: false },
  ]);

  readonly keyNpcs: readonly LwKeyNpcQuickRef[] = [
    {
      compositeKey: 'campaign_vaelgard:npc:malric',
      name: 'Brother Malric',
      role: 'Chapel Keeper · Cautious',
      initials: 'BM',
      ringColor: '#d9b77a',
    },
    {
      compositeKey: 'campaign_vaelgard:npc:elowen',
      name: 'Sister Elowen',
      role: 'Healer · Guarded',
      initials: 'SE',
      ringColor: '#49e892',
    },
  ];

  toggleBeat(id: string): void {
    this.sceneBeats.update((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  toggleGoal(id: string): void {
    this.sceneGoals.update((items) =>
      items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  }

  inspectNpc(compositeKey: string): void {
    this.store.inspectEntity(compositeKey);
  }
}
