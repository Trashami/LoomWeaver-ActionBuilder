import {
 ChangeDetectionStrategy,
 Component,
 ElementRef,
 EventEmitter,
 HostListener,
 Input,
 Output,
 ViewChild,
 booleanAttribute,
 signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { ButtonComponent, ButtonAppearance } from '../button/button.component';

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';

@Component({
 selector: 'mw-modal',
 standalone: true,
 imports: [CommonModule, IconComponent, ButtonComponent],
 templateUrl: './modal.component.html',
 styleUrl: './modal.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
 @Input({ transform: booleanAttribute }) open = false;
 @Input() title = '';
 @Input() subtitle = '';
 @Input() iconName?: IconName | string;
 @Input() maxWidth: ModalMaxWidth = 'md';
 @Input() ariaLabel = '';
 @Input() testId = '';

 // Behavior Controls
 @Input({ transform: booleanAttribute }) closeOnBackdrop = true;
 @Input({ transform: booleanAttribute }) closeOnEscape = true;
 @Input({ transform: booleanAttribute }) showCloseButton = true;
 @Input({ transform: booleanAttribute }) minimizable = false;
 @Input({ transform: booleanAttribute }) maximizable = false;
 @Input({ transform: booleanAttribute }) isMinimized = false;
 @Input({ transform: booleanAttribute }) isMaximized = false;

 // Integrated Footer Action Button Properties
 @Input() primaryLabel = '';
 @Input() primaryIcon?: IconName | string;
 @Input() primaryAppearance: ButtonAppearance = 'primary';
 @Input({ transform: booleanAttribute }) primaryLoading = false;
 @Input({ transform: booleanAttribute }) primaryDisabled = false;
 @Input() cancelLabel = '';
 @Input() cancelIcon?: IconName | string;
 @Input() cancelAppearance: ButtonAppearance = 'ghost';
 @Input({ transform: booleanAttribute }) hideCancel = false;

 // Drag & Resize Options
 @Input({ transform: booleanAttribute }) movable = false;
 @Input({ transform: booleanAttribute }) resizable = false;
 @Input({ transform: booleanAttribute }) noBackdropBlur = false;
 @Input() initialWidth?: number;
 @Input() initialHeight?: number;
 @Input() initialX?: number;
 @Input() initialY?: number;

 @Output() readonly openChange = new EventEmitter<boolean>();
 @Output() readonly closed = new EventEmitter<void>();
 @Output() readonly primaryAction = new EventEmitter<void>();
 @Output() readonly cancelAction = new EventEmitter<void>();
 @Output() readonly isMinimizedChange = new EventEmitter<boolean>();
 @Output() readonly isMaximizedChange = new EventEmitter<boolean>();
 @Output() readonly minimizedChange = new EventEmitter<boolean>();
 @Output() readonly maximizedChange = new EventEmitter<boolean>();

 @ViewChild('containerRef') containerRef?: ElementRef<HTMLDivElement>;

 protected readonly pos = signal<{ x: number; y: number } | null>(null);
 protected readonly size = signal<{ width: number; height: number } | null>(null);
 protected readonly isDragging = signal(false);
 protected readonly isResizing = signal(false);

 private dragStart = { x: 0, y: 0, modalX: 0, modalY: 0 };
 private resizeStart = { x: 0, y: 0, width: 0, height: 0 };

 @HostListener('document:keydown.escape', ['$event'])
 onKeydownEscape(event: Event): void {
 if (this.open && this.closeOnEscape) {
 event.preventDefault();
 this.close();
 }
 }

 close(): void {
 this.open = false;
 this.openChange.emit(false);
 this.closed.emit();
 }

 onBackdropClick(): void {
 if (this.closeOnBackdrop) {
 this.close();
 }
 }

 onPrimaryClick(): void {
 if (!this.primaryDisabled && !this.primaryLoading) {
 this.primaryAction.emit();
 }
 }

  onCancelClick(): void {
    this.cancelAction.emit();
    this.close();
  }

  toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    this.isMinimizedChange.emit(this.isMinimized);
    this.minimizedChange.emit(this.isMinimized);
  }

  toggleMaximize(): void {
    this.isMaximized = !this.isMaximized;
    this.isMaximizedChange.emit(this.isMaximized);
    this.maximizedChange.emit(this.isMaximized);
  }

 startDrag(e: MouseEvent): void {
 if (!this.movable) return;
 const target = e.target as HTMLElement;
 if (target.closest('button, input, select, textarea, a, .modal-header__close')) return;
 e.preventDefault();

 const rect = this.containerRef?.nativeElement.getBoundingClientRect();
 const currentX = this.pos()?.x ?? (rect ? rect.left : 100);
 const currentY = this.pos()?.y ?? (rect ? rect.top : 80);

 this.dragStart = {
 x: e.clientX,
 y: e.clientY,
 modalX: currentX,
 modalY: currentY
 };
 this.isDragging.set(true);

 const onMove = (moveEvt: MouseEvent) => {
 const dx = moveEvt.clientX - this.dragStart.x;
 const dy = moveEvt.clientY - this.dragStart.y;
 const newX = Math.max(10, Math.min(window.innerWidth - 80, this.dragStart.modalX + dx));
 const newY = Math.max(10, Math.min(window.innerHeight - 60, this.dragStart.modalY + dy));
 this.pos.set({ x: newX, y: newY });
 };

 const onUp = () => {
 this.isDragging.set(false);
 window.removeEventListener('mousemove', onMove);
 window.removeEventListener('mouseup', onUp);
 };

 window.addEventListener('mousemove', onMove);
 window.addEventListener('mouseup', onUp);
 }

 startResize(e: MouseEvent): void {
 if (!this.resizable) return;
 e.preventDefault();
 e.stopPropagation();

 const rect = this.containerRef?.nativeElement.getBoundingClientRect();
 const currentW = this.size()?.width ?? (rect ? rect.width : 500);
 const currentH = this.size()?.height ?? (rect ? rect.height : 400);

 this.resizeStart = {
 x: e.clientX,
 y: e.clientY,
 width: currentW,
 height: currentH
 };
 this.isResizing.set(true);

 const onMove = (moveEvt: MouseEvent) => {
 const dx = moveEvt.clientX - this.resizeStart.x;
 const dy = moveEvt.clientY - this.resizeStart.y;
 const newW = Math.max(280, Math.min(window.innerWidth - 40, this.resizeStart.width + dx));
 const newH = Math.max(200, Math.min(window.innerHeight - 40, this.resizeStart.height + dy));
 this.size.set({ width: newW, height: newH });
 };

 const onUp = () => {
 this.isResizing.set(false);
 window.removeEventListener('mousemove', onMove);
 window.removeEventListener('mouseup', onUp);
 };

 window.addEventListener('mousemove', onMove);
 window.addEventListener('mouseup', onUp);
 }
}
