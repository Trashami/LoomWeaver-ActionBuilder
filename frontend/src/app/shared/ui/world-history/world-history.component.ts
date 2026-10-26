import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-world-history',
  standalone: true,
  imports: [CommonModule, FormsModule, LwIconComponent],
  templateUrl: './world-history.component.html',
  styleUrl: './world-history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LwWorldHistoryComponent {
  readonly worldLore = inject(WorldLoreFacadeService);
  readonly inspectLocationRequested = output<string>();

  readonly categories: readonly string[] = [
    'All',
    'Major Historical Events',
    'Wars',
    'Founding of Settlements',
    'Catastrophes',
    'Religious & Cultural Events',
    'Historical Discoveries'
  ];

  readonly createModalOpen = signal<boolean>(false);
  readonly newTitle = signal<string>('');
  readonly newCategory = signal<string>('Major Historical Events');
  readonly newWorldDate = signal<string>('');
  readonly newEra = signal<string>('Third Age of Ashes');
  readonly newSessionNumber = signal<number | null>(null);
  readonly newSummary = signal<string>('');
  readonly newLocationKey = signal<string>('');
  readonly newVisibility = signal<'players' | 'gm'>('players');

  openCreateEvent(): void {
    this.newTitle.set('');
    this.newCategory.set('Major Historical Events');
    this.newWorldDate.set('Year 842, Third Age');
    this.newEra.set('Third Age of Ashes');
    this.newSessionNumber.set(null);
    this.newSummary.set('');
    this.newLocationKey.set(this.worldLore.selectedLocationKey() ?? '');
    this.newVisibility.set('players');
    this.createModalOpen.set(true);
  }

  saveEvent(): void {
    const title = this.newTitle().trim();
    if (!title) {
      return;
    }
    this.worldLore.createHistoryEvent({
      title,
      category: this.newCategory(),
      worldDateLabel: this.newWorldDate().trim() || 'Recorded Chronicle',
      eraName: this.newEra().trim() || 'Third Age of Ashes',
      sessionNumber: this.newSessionNumber(),
      summary: this.newSummary().trim() || title,
      locationKey: this.newLocationKey() || null,
      visibility: this.newVisibility()
    });
    this.createModalOpen.set(false);
  }
}
