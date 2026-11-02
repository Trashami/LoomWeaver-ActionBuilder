import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { LwBadgeComponent, LwBadgeTone } from '../badge/badge.component';
import { LwButtonComponent, LwButtonVariant } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwScrollAreaComponent } from '../scroll-area/scroll-area.component';

export interface LwContextSwitcherOption {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly badgeLabel: string;
  readonly badgeTone?: LwBadgeTone;
  readonly active: boolean;
}

export interface LwContextSwitcherAction {
  readonly id: string;
  readonly label: string;
  readonly variant?: LwButtonVariant;
}

@Component({
  selector: 'lw-context-switcher',
  standalone: true,
  imports: [
    NgpButton,
    LwIconComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwScrollAreaComponent,
  ],
  templateUrl: './context-switcher.component.html',
  styleUrl: './context-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwContextSwitcherComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variant = input<'header' | 'pill'>('header');
  readonly kicker = input<string>('');
  readonly title = input<string>('');
  readonly tone = input<'gold' | 'emerald'>('gold');
  readonly panelTitle = input<string>('');
  readonly countLabel = input<string>('');
  readonly ariaLabel = input<string>('Select context');
  readonly options = input<readonly LwContextSwitcherOption[]>([]);
  readonly footerActions = input<readonly LwContextSwitcherAction[]>([]);

  readonly open = model<boolean>(false);

  readonly optionSelected = output<string>();
  readonly actionSelected = output<string>();

  toggleOpen(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.open.set(!this.open());
  }

  selectOption(optionId: string, event: Event): void {
    event.stopPropagation();
    this.open.set(false);
    this.optionSelected.emit(optionId);
  }

  triggerAction(actionId: string): void {
    this.open.set(false);
    this.actionSelected.emit(actionId);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }
}
