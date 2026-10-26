import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import { EntityCardVm } from '../../../core/models/loomweaver.models';
import {
  LocationInspectorDetailVm,
  LocationRelatedEntityVm,
} from '../../../core/models/world-lore.models';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

export type LocationInspectorTab = 'overview' | 'lore' | 'connections' | 'history' | 'secrets';

@Component({
  selector: 'lw-location-inspector',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    NgpButton,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
  ],
  templateUrl: './location-inspector.component.html',
  styleUrl: './location-inspector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwLocationInspectorComponent {
  readonly location = input.required<LocationInspectorDetailVm>();
  readonly isGm = input<boolean>(false);
  readonly linkableEntities = input<readonly EntityCardVm[]>([]);

  readonly closeRequested = output<void>();
  readonly relatedEntitySelected = output<LocationRelatedEntityVm>();
  readonly childMapRequested = output<string>();
  readonly secretRevealRequested = output<{ locationKey: string; secretId: string }>();
  readonly locationSaved = output<{
    locationKey?: string;
    name: string;
    locationType: string;
    hierarchyLevel: string;
    parentLocationKey?: string | null;
    discoveryStatus: string;
    visibility: 'players' | 'gm' | 'public';
    artworkUrl?: string;
    description: string;
    xPercent: number;
    yPercent: number;
  }>();
  readonly entityLinked = output<{
    locationKey: string;
    targetCompositeKey: string;
    targetName: string;
    targetSubtitle: string;
    entityType: string;
    relationshipLabel: string;
    visibility: 'players' | 'gm';
  }>();

  readonly activeTab = signal<LocationInspectorTab>('overview');
  readonly editingMode = signal<'none' | 'edit' | 'sublocation' | 'link'>('none');

  readonly editName = signal<string>('');
  readonly editType = signal<string>('Settlement');
  readonly editHierarchy = signal<string>('Settlement');
  readonly editStatus = signal<string>('visited');
  readonly editVisibility = signal<'players' | 'gm'>('players');
  readonly editDescription = signal<string>('');

  readonly selectedLinkKey = signal<string>('');
  readonly linkRoleLabel = signal<string>('Notable NPC');

  readonly visibleTabs = computed(() => {
    const base: { id: LocationInspectorTab; label: string }[] = [
      { id: 'overview', label: 'Overview' },
      { id: 'lore', label: 'Lore' },
      { id: 'connections', label: 'NPCs & Links' },
      { id: 'history', label: 'History' },
    ];
    if (this.isGm()) {
      base.push({ id: 'secrets', label: 'Secrets' });
    }
    return base;
  });

  openEditLocation(): void {
    const loc = this.location();
    this.editName.set(loc.name);
    this.editType.set(loc.locationType);
    this.editHierarchy.set(loc.hierarchyLevel);
    this.editStatus.set(loc.discoveryStatus);
    this.editVisibility.set(loc.visibility === 'gm' ? 'gm' : 'players');
    this.editDescription.set(loc.description);
    this.editingMode.set('edit');
  }

  openAddSublocation(): void {
    this.editName.set('');
    this.editType.set('District');
    this.editHierarchy.set('District');
    this.editStatus.set('known');
    this.editVisibility.set('players');
    this.editDescription.set(`Sublocation within ${this.location().name}.`);
    this.editingMode.set('sublocation');
  }

  openLinkEntity(): void {
    const first = this.linkableEntities()[0];
    this.selectedLinkKey.set(first?.compositeKey ?? '');
    this.editingMode.set('link');
  }

  submitLocationForm(): void {
    const loc = this.location();
    const isSub = this.editingMode() === 'sublocation';
    this.locationSaved.emit({
      locationKey: isSub ? undefined : loc.locationKey,
      name: this.editName().trim() || loc.name,
      locationType: this.editType().trim() || 'Settlement',
      hierarchyLevel: this.editHierarchy(),
      parentLocationKey: isSub ? loc.locationKey : loc.parentLocationKey,
      discoveryStatus: this.editStatus(),
      visibility: this.editVisibility(),
      artworkUrl: loc.artworkUrl,
      description: this.editDescription().trim() || loc.description,
      xPercent: 52,
      yPercent: 46,
    });
    this.editingMode.set('none');
  }

  submitEntityLink(): void {
    const key = this.selectedLinkKey();
    const found = this.linkableEntities().find((e) => e.compositeKey === key);
    if (!found) return;
    this.entityLinked.emit({
      locationKey: this.location().locationKey,
      targetCompositeKey: found.compositeKey,
      targetName: found.name,
      targetSubtitle: found.subtitle,
      entityType: found.entityType,
      relationshipLabel: this.linkRoleLabel().trim() || found.entityType,
      visibility: found.visibility === 'gm' ? 'gm' : 'players',
    });
    this.editingMode.set('none');
  }
}
