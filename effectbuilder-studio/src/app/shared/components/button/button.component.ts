import {
 ChangeDetectionStrategy,
 Component,
 EventEmitter,
 Input,
 Output,
 booleanAttribute
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

export type ButtonAppearance =
 | 'primary'
 | 'secondary'
 | 'glass'
 | 'ghost'
 | 'gold'
 | 'accent'
 | 'danger'
 | 'soft'
 | 'outline';

export type ButtonPlacement =
 | 'default'
 | 'hero'
 | 'header'
 | 'sidebar'
 | 'nav'
 | 'toolbar'
 | 'tray'
 | 'card-action';

export type ButtonEdges = 'none' | 'sm' | 'md' | 'full';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonHoverEffect = 'glow' | 'lift' | 'fill' | 'subtle' | 'none';

@Component({
 selector: 'mw-button',
 standalone: true,
 imports: [CommonModule, RouterLink, IconComponent],
 templateUrl: './button.component.html',
 styleUrl: './button.component.scss',
 changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
 /** Text label of the button (optional if projecting content) */
 @Input() label = '';

  /** Optional button tooltip / hover title */
  @Input() title = '';

  /** Explicitly mark as icon-only button (auto-detected if no label) */
  @Input({ transform: booleanAttribute }) iconOnly = false;

  /** Left icon text/symbol or glyph */
  @Input() icon = '';
  @Input() iconName: IconName | string = '';

  /** Right icon text/symbol or glyph */
  @Input() iconRight = '';
  @Input() iconRightName: IconName | string = '';

  /** Custom icon size in px */
  @Input() iconSize: number = 15;

  protected get iconSizePx(): number {
    if (this.size === 'xs') return 12;
    if (this.size === 'sm') return 14;
    if (this.size === 'lg') return 18;
    if (this.size === 'xl') return 20;
    return this.iconSize || 15;
  }

  protected get displayLabel(): string {
    if (this.label) return this.label;
    return '';
  }

  protected get resolvedIcon(): string {
    const raw = (this.iconName || this.icon || '').trim();
    if (!raw) {
      if (this.appearance === 'danger' && this.iconOnly) return 'trash-2';
      return '';
    }
    if (raw === '+' || raw === 'add') return 'plus';
    if (raw === 'refresh' || raw === 'sync') return 'refresh-cw';
    if (raw === 'delete' || raw === 'remove' || raw === 'trash' || raw === 'trash-2') return 'trash-2';
    if (raw === 'edit') return 'edit-3';
    if (raw === 'save') return 'save';
    if (raw === 'roll' || raw === 'dice') return 'd20';
    if (raw === 'x' || raw === 'close') return 'x';
    return raw;
  }

  protected get resolvedIconRight(): string {
    const raw = (this.iconRightName || this.iconRight || '').trim();
    if (!raw) return '';
    if (raw === '→' || raw === '->' || raw === 'arrow-right') return 'chevron-right';
    if (raw === '↓' || raw === 'v' || raw === 'down') return 'chevron-down';
    return raw;
  }

 /** Visual variant / appearance theme */
 @Input() appearance: ButtonAppearance = 'secondary';

 /** Visual variant alias for web-component standards */
 @Input() set variant(val: ButtonAppearance) {
 if (val) this.appearance = val;
 }

 /** Placement context (adapts styles for hero, header, sidebar, etc.) */
 @Input() placement: ButtonPlacement = 'default';

 /** Corner rounding style (none/square, sm, md, full) */
 @Input() edges: ButtonEdges = 'sm';

 /** Button size scaling */
 @Input() size: ButtonSize = 'md';

 /** Hover animation and glow behavior */
 @Input() hoverEffect: ButtonHoverEffect = 'lift';

 /** Optional custom hover background color override */
 @Input() hoverBg = '';

 /** Optional custom hover text color override */
 @Input() hoverColor = '';

 /** Optional custom hover border color override */
 @Input() hoverBorder = '';

 /** Optional custom hover box-shadow override */
 @Input() hoverShadow = '';

 /** Optional badge text or count inside button */
 @Input() badge = '';

 /** Optional direct router link */
 @Input() href = '';

 /** Optional external link target */
 @Input() target = '';

 /** Accessibility label */
 @Input() ariaLabel = '';

 /** Test identifier */
 @Input() testId = '';

 /** Arbitrary custom CSS classes */
 @Input() customClass = '';

 /** Active / selected state */
 @Input({ transform: booleanAttribute }) active = false;

 /** Disabled state */
 @Input({ transform: booleanAttribute }) disabled = false;

 /** Loading spinner state */
 @Input({ transform: booleanAttribute }) loading = false;

 /** Stretches button to fill container width */
 @Input({ transform: booleanAttribute }) fullWidth = false;

 /** Direct action callback function (optional alternative to (pressed)) */
 @Input() action?: (() => void) | null;

 /** Click / press event emitter */
 @Output() readonly pressed = new EventEmitter<Event>();

 protected handleClick(event: Event): void {
 if (this.disabled || this.loading) {
 event.preventDefault();
 event.stopPropagation();
 return;
 }

 if (this.action) {
 this.action();
 }

 this.pressed.emit(event);
 }

 protected get computedClasses(): string {
 const classes = [
 'mw-btn',
 `mw-btn--${this.appearance}`,
 `mw-btn--${this.size}`,
 `mw-btn--edges-${this.edges}`,
 `mw-btn--placement-${this.placement}`,
 `mw-btn--hover-${this.hoverEffect}`
 ];

    if (this.iconOnly || (!this.displayLabel && !!this.resolvedIcon)) classes.push('mw-btn--icon-only');
 if (this.fullWidth) classes.push('mw-btn--full');
 if (this.active) classes.push('mw-btn--active');
 if (this.loading) classes.push('mw-btn--loading');
 if (this.disabled) classes.push('mw-btn--disabled');
 if (this.customClass) classes.push(this.customClass);

 return classes.join(' ');
 }

 protected get customStyles(): Record<string, string> {
 const styles: Record<string, string> = {};
 if (this.hoverBg) styles['--mw-btn-hover-bg'] = this.hoverBg;
 if (this.hoverColor) styles['--mw-btn-hover-color'] = this.hoverColor;
 if (this.hoverBorder) styles['--mw-btn-hover-border'] = this.hoverBorder;
 if (this.hoverShadow) styles['--mw-btn-hover-shadow'] = this.hoverShadow;
 return styles;
 }
}
