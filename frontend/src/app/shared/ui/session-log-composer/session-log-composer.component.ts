import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { NgpInput } from 'ng-primitives/input';
import { NgpTabButton, NgpTabList, NgpTabset } from 'ng-primitives/tabs';
import { NgpToolbar } from 'ng-primitives/toolbar';

export type SessionLogTab = 'session-log' | 'quick-notes' | 'consequences' | 'loom-remembers';

export interface SessionLogEntry {
  id: string;
  tab: SessionLogTab;
  text: string;
  timestamp: string;
  scope: 'party' | 'gm' | 'private';
  tags?: string[];
}

@Component({
  selector: 'lw-session-log-composer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgpButton,
    NgpInput,
    NgpTabset,
    NgpTabList,
    NgpTabButton,
    NgpToolbar,
  ],
  templateUrl: './session-log-composer.component.html',
  styleUrl: './session-log-composer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwSessionLogComposerComponent {
  readonly activeTab = signal<SessionLogTab>('session-log');
  readonly dateFilterLabel = input<string>('Today');
  readonly entries = input<SessionLogEntry[]>([]);

  readonly noteSaved = output<{ tab: SessionLogTab; text: string; scope: 'party' | 'gm' | 'private' }>();
  readonly loomFormatRequested = output<string>();

  readonly draftText = signal('');
  readonly noteScope = signal<'party' | 'gm' | 'private'>('party');

  readonly tabs: { id: SessionLogTab; label: string }[] = [
    { id: 'session-log', label: 'Session Log' },
    { id: 'quick-notes', label: 'Quick Notes' },
    { id: 'consequences', label: 'Consequences' },
    { id: 'loom-remembers', label: 'The Loom Remembers' },
  ];

  selectTab(tab: SessionLogTab): void {
    this.activeTab.set(tab);
  }

  cycleScope(): void {
    const order: ('party' | 'gm' | 'private')[] = ['party', 'gm', 'private'];
    const next = order[(order.indexOf(this.noteScope()) + 1) % order.length];
    this.noteScope.set(next);
  }

  insertToken(prefix: string, suffix = ''): void {
    const current = this.draftText();
    this.draftText.set(`${current}${current ? ' ' : ''}${prefix}${suffix}`);
  }

  onKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.submitNote();
    }
  }

  submitNote(): void {
    const text = this.draftText().trim();
    if (!text) {
      return;
    }
    this.noteSaved.emit({
      tab: this.activeTab(),
      text,
      scope: this.noteScope(),
    });
    this.draftText.set('');
  }
}
