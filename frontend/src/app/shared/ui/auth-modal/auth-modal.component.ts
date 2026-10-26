import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';

@Component({
  selector: 'lw-auth-modal',
  standalone: true,
  imports: [FormsModule, LwBadgeComponent, LwButtonComponent, LwIconComponent],
  templateUrl: './auth-modal.component.html',
  styleUrl: './auth-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAuthModalComponent {
  readonly auth = inject(AuthSessionService);

  readonly loginIdentifier = signal<string>('gm@loom-weaver.com');
  readonly loginPassword = signal<string>('••••••••••••');

  readonly registerEmail = signal<string>('');
  readonly registerDisplayName = signal<string>('');
  readonly registerPassword = signal<string>('');
  readonly registerRole = signal<'gm' | 'players'>('gm');

  submitLogin(): void {
    this.auth.loginWithCredentials(this.loginIdentifier(), this.loginPassword(), true);
  }

  submitRegister(): void {
    this.auth.registerAccount(
      this.registerEmail(),
      this.registerDisplayName(),
      this.registerPassword(),
      this.registerRole(),
      true,
    );
  }

  quickSignIn(accountId: string): void {
    this.auth.loginAsAccount(accountId, true);
  }
}
