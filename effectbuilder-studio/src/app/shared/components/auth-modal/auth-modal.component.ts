import { Component, EventEmitter, Output, inject, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { UiLayoutService } from '../../../core/services/ui-layout.service';

@Component({
  selector: 'mw-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
})
export class AuthModalComponent implements OnInit, AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly uiLayout = inject(UiLayoutService, { optional: true });

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly success = new EventEmitter<void>();

  activeTab = signal<'signin' | 'register' | 'request'>('signin');
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  requestSubmitted = signal<boolean>(false);
  requestSuccessMessage = signal<string | null>(null);

  // Login form
  loginIdentifier = '';
  loginPassword = '';

  // Register form
  regEmail = '';
  regUsername = '';
  regDisplayName = '';
  regPassword = '';
  regRole: 'gm' | 'players' = 'gm';

  // Request form
  reqEmail = '';
  reqUsername = '';
  reqDisplayName = '';
  reqNotes = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initGoogleBtn();
  }

  setTab(tab: 'signin' | 'register' | 'request'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
    if (tab === 'signin') {
      setTimeout(() => this.initGoogleBtn(), 50);
    }
  }

  signInWithPatreon(): void {
    this.auth.loginWithPatreon('/');
  }

  private initGoogleBtn(): void {
    this.auth.initGoogleSignIn(
      'mw-google-btn-container',
      (idToken: string) => {
        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.auth.loginWithGoogle(idToken).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.uiLayout?.closeAuthModal();
            this.success.emit();
            this.close.emit();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.errorMessage.set(err?.error?.message || 'Google sign-in failed. Please try again.');
          },
        });
      },
      () => {
        this.isLoading.set(false);
        this.uiLayout?.closeAuthModal();
        this.success.emit();
        this.close.emit();
      }
    );
  }

  submitLogin(): void {
    if (!this.loginIdentifier || !this.loginPassword) {
      this.errorMessage.set('Please enter your email/username and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth.login(this.loginIdentifier, this.loginPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.uiLayout?.closeAuthModal();
        this.success.emit();
        this.close.emit();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err?.status === 401
            ? 'Invalid email/username or password.'
            : err?.error?.message || 'Login failed. Please try again.'
        );
      },
    });
  }

  submitRegister(): void {
    if (!this.regEmail || !this.regPassword || this.regPassword.length < 6) {
      this.errorMessage.set('Please provide a valid email and a password of at least 6 characters.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth
      .register({
        email: this.regEmail,
        username: this.regUsername || this.regEmail.split('@')[0],
        displayName: this.regDisplayName || this.regUsername || this.regEmail.split('@')[0],
        password: this.regPassword,
        role: this.regRole,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.uiLayout?.closeAuthModal();
          this.success.emit();
          this.close.emit();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Could not create account. Please try again.');
        },
      });
  }

  submitRequest(): void {
    if (!this.reqEmail || !this.reqUsername) {
      this.errorMessage.set('Please fill out your email and desired username.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auth
      .requestAccount({
        email: this.reqEmail,
        username: this.reqUsername,
        displayName: this.reqDisplayName || this.reqUsername,
        notes: this.reqNotes,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.requestSubmitted.set(true);
          this.requestSuccessMessage.set(res.message);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            err?.error?.message || 'Failed to submit account request. That email or username may already be in use.'
          );
        },
      });
  }

  dismiss(): void {
    this.uiLayout?.closeAuthModal();
    this.close.emit();
  }
}
