import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoreEntryVm } from '../../../core/models/world-lore.models';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-lore-library',
  standalone: true,
  imports: [CommonModule, FormsModule, LwIconComponent],
  templateUrl: './lore-library.component.html',
  styleUrl: './lore-library.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LwLoreLibraryComponent {
  readonly worldLore = inject(WorldLoreFacadeService);

  readonly mode = input<'preview' | 'full'>('full');
  readonly viewAllClicked = output<void>();
  readonly inspectLocationRequested = output<string>();

  readonly categories = computed(() => this.worldLore.loreCategories());

  readonly previewCategories = [
    'All',
    'Kingdoms & Settlements',
    'Factions',
    'Regions',
    'History',
    'Deities & Myths',
    'Rumors'
  ];

  readonly createModalOpen = signal<boolean>(false);
  readonly editingEntryId = signal<string | null>(null);
  readonly newTitle = signal<string>('');
  readonly newCategory = signal<string>('Kingdoms & Settlements');
  readonly customCategoryInput = signal<string>('');
  readonly newSummary = signal<string>('');
  readonly newContent = signal<string>('');
  readonly newTagsText = signal<string>('');
  readonly newVisibility = signal<'players' | 'gm' | 'public'>('players');
  readonly newLinkedLocationKey = signal<string>('');
  readonly newSessionId = signal<string>('');
  readonly newQuestKind = signal<'none' | 'main' | 'side'>('none');
  readonly newQuestId = signal<string>('');
  readonly newQuestTitle = signal<string>('');
  readonly mentionQuery = signal<string>('');

  readonly availableSessions = computed(() => this.worldLore.store.sessions());
  readonly availableQuests = computed(() =>
    this.worldLore.store.authorizedEntities().filter((e) => e.entityType === 'Quest'),
  );

  readonly mentionSuggestions = computed(() => {
    const q = this.mentionQuery().trim();
    if (!q) {
      return [];
    }
    return this.worldLore.searchMentionCandidates(q);
  });

  readonly previewEntries = computed(() => {
    return this.worldLore.filteredLoreEntries().slice(0, 6);
  });

  openQuickCreate(): void {
    const activeSess = this.worldLore.store.activeSession();
    this.editingEntryId.set(null);
    this.newTitle.set('');
    this.newCategory.set('Kingdoms & Settlements');
    this.customCategoryInput.set('');
    this.newSummary.set('');
    this.newContent.set('');
    this.newTagsText.set('');
    this.newVisibility.set('players');
    this.newLinkedLocationKey.set(this.worldLore.selectedLocationKey() ?? '');
    this.newSessionId.set(activeSess?.sessionId ?? '');
    this.newQuestKind.set('none');
    this.newQuestId.set('');
    this.newQuestTitle.set('');
    this.createModalOpen.set(true);
  }

  openEditEntry(entry: LoreEntryVm): void {
    this.editingEntryId.set(entry.id);
    this.newTitle.set(entry.title);
    this.newCategory.set(entry.category);
    this.customCategoryInput.set('');
    this.newSummary.set(entry.excerpt);
    this.newContent.set(entry.content);
    this.newTagsText.set(entry.tags.join(', '));
    this.newVisibility.set(entry.visibility);
    this.newLinkedLocationKey.set(entry.linkedEntityKeys[0] ?? '');
    this.newSessionId.set(entry.sessionId ?? '');
    this.newQuestKind.set(
      entry.questKind === 'main' || entry.questKind === 'side' ? entry.questKind : entry.questTitle ? 'main' : 'none',
    );
    this.newQuestId.set(entry.questId ?? '');
    this.newQuestTitle.set(entry.questTitle ?? '');
    this.createModalOpen.set(true);
  }

  onQuestPickerChange(questKey: string): void {
    this.newQuestId.set(questKey);
    const match = this.availableQuests().find((q) => q.compositeKey === questKey);
    if (match) {
      this.newQuestTitle.set(match.name);
      if (this.newQuestKind() === 'none') {
        this.newQuestKind.set('main');
      }
    }
  }

  assignEntryToCurrentSession(entry: LoreEntryVm): void {
    const sess = this.worldLore.store.activeSession();
    if (!sess) return;
    this.worldLore.saveLoreEntry({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      subtitle: entry.subtitle,
      excerpt: entry.excerpt,
      content: entry.content,
      tags: entry.tags,
      linkedEntityKeys: entry.linkedEntityKeys,
      visibility: entry.visibility,
      sessionId: sess.sessionId,
      sessionLabel: `Session ${sess.sessionNumber} · ${sess.title}`,
      questId: entry.questId ?? null,
      questTitle: entry.questTitle ?? null,
      questKind: entry.questKind ?? null,
    });
  }

  onContentChange(value: string): void {
    this.newContent.set(value);
    const match = value.match(/@([a-zA-Z0-9_-]{1,24})$/);
    this.mentionQuery.set(match ? match[1] : '');
  }

  insertMention(label: string): void {
    const updated = this.newContent().replace(/@([a-zA-Z0-9_-]{1,24})$/, `@[${label}] `);
    this.newContent.set(updated);
    this.mentionQuery.set('');
  }

  saveLoreEntry(): void {
    const title = this.newTitle().trim();
    if (!title) {
      return;
    }
    const category = this.customCategoryInput().trim() || this.newCategory();
    const tags = this.newTagsText()
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const linkedEntityKeys = this.newLinkedLocationKey() ? [this.newLinkedLocationKey()] : [];
    const sess = this.availableSessions().find((s) => s.sessionId === this.newSessionId());
    const questKind = this.newQuestKind() === 'none' ? null : this.newQuestKind();
    const questTitle = questKind ? this.newQuestTitle().trim() || null : null;

    this.worldLore.saveLoreEntry({
      id: this.editingEntryId() ?? undefined,
      title,
      category,
      excerpt: this.newSummary().trim() || title,
      content: this.newContent().trim() || this.newSummary().trim() || title,
      tags: tags.length > 0 ? tags : [category],
      linkedEntityKeys,
      visibility: this.newVisibility(),
      sessionId: sess?.sessionId ?? (this.newSessionId() || null),
      sessionLabel: sess ? `Session ${sess.sessionNumber} · ${sess.title}` : null,
      questId: questKind ? (this.newQuestId() || `quest-${(questTitle ?? title).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`) : null,
      questTitle,
      questKind,
    });
    this.createModalOpen.set(false);
  }

  archiveEntry(entry: LoreEntryVm): void {
    this.worldLore.saveLoreEntry({
      id: entry.id,
      title: entry.title,
      category: entry.category,
      excerpt: entry.excerpt,
      content: entry.content,
      tags: entry.tags,
      linkedEntityKeys: entry.linkedEntityKeys,
      visibility: entry.visibility,
      archived: true
    });
  }

  selectEntry(entry: LoreEntryVm): void {
    this.worldLore.selectLoreEntry(entry.id);
    if (entry.linkedEntityKeys.length > 0 && this.mode() === 'preview') {
      this.worldLore.selectLocation(entry.linkedEntityKeys[0]);
    }
  }
}
