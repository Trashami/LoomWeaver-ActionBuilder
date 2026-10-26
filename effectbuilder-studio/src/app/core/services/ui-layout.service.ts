import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UiLayoutService {
  readonly userMenuOpen = signal(false);
  readonly isAuthModalOpen = signal(false);

  toggleUserMenu(): void {
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  openAuthModal(): void {
    this.isAuthModalOpen.set(true);
    this.userMenuOpen.set(false);
  }

  closeAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }
}
