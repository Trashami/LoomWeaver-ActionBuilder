import { Component, Input, Output, EventEmitter, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { UiLayoutService } from '../../../core/services/ui-layout.service';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'mw-user-menu',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent {
  readonly auth = inject(AuthService);
  private readonly elementRef = inject(ElementRef);
  protected readonly uiLayout = inject(UiLayoutService);

  @Input() standalonePortal = false;
  @Input() panelWidth = '20rem';
  @Output() readonly logoutRequested = new EventEmitter<void>();

  readonly isOpen = this.uiLayout.userMenuOpen;

  toggleDropdown(event?: Event): void {
    if (event) event.stopPropagation();
    this.uiLayout.toggleUserMenu();
  }

  closeDropdown(): void {
    this.uiLayout.closeUserMenu();
  }

  openAuthModal(): void {
    this.closeDropdown();
    this.uiLayout.openAuthModal();
  }

  signOut(): void {
    this.closeDropdown();
    this.logoutRequested.emit();
    this.auth.logout();
  }

  refreshProfile(): void {
    this.auth.refreshProfile().subscribe({ error: () => {} });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  getInitials(name?: string | null): string {
    if (!name) return 'LW';
    const segments = name.trim().split(' ').filter(Boolean);
    if (segments.length >= 2) {
      return (segments[0][0] + segments[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getTierBadgeLabel(tier?: string, isAdmin?: boolean): string {
    if (isAdmin) return 'SUPER ADMIN';
    switch (tier?.toLowerCase()) {
      case 'legendary':
        return 'LEGENDARY';
      case 'worldsmith':
        return 'WORLDSMITH';
      case 'adventurer':
        return 'ADVENTURER';
      default:
        return 'PLAYER';
    }
  }

  getTierBadgeClass(tier?: string, isAdmin?: boolean): string {
    if (isAdmin) return 'badge-super-admin';
    switch (tier?.toLowerCase()) {
      case 'legendary':
        return 'badge-legendary';
      case 'worldsmith':
        return 'badge-worldsmith';
      case 'adventurer':
        return 'badge-adventurer';
      default:
        return 'badge-player';
    }
  }
}
