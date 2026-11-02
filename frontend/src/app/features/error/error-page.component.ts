import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { LwButtonComponent } from '../../shared/ui/button/button.component';

export type ErrorType = '404' | '403' | '500' | 'generic';

@Component({
  selector: 'lw-error-page',
  standalone: true,
  imports: [LwButtonComponent],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthSessionService);

  @Input() errorType: ErrorType = '404';
  readonly denialQuip = signal('');
  readonly showTitle = signal(false);
  readonly showSubtitle = signal(false);
  readonly showBottomCopy = signal(false);
  readonly diceLanded = signal(false);

  private topRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private subtitleRevealTimer: ReturnType<typeof setTimeout> | null = null;
  private bottomRevealTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly denialQuips = [
    'The ward checked your papers, rolled its eyes, and called for the city guard.',
    'A goblin clerk has denied your request in triplicate. He seems very proud of himself.',
    'The door says you lack clearance. The mimic says you look delicious.',
    'Your name is not on the guest scroll, and the barbarian at the door cannot read anyway.',
    'A tiny wizard appears, whispers "absolutely not," and vanishes in a puff of paperwork.',
    'The rune recognizes your face. Unfortunately, it remembers what you did at the tavern.',
    'You may pass after presenting one royal seal, two references, and a live owlbear.',
    'The dungeon master has reviewed your credentials and hidden them behind the screen.',
    'A spectral guard blocks the way. Persuasion failed. Bribery somehow made it worse.',
    'This chamber requires a higher rank or a rogue who is considerably better at lying.',
  ] as const;

  ngOnInit(): void {
    const routeType = this.route.snapshot.data['type'] as ErrorType | undefined;
    if (routeType) this.errorType = routeType;
    this.denialQuip.set(this.denialQuips[Math.floor(Math.random() * this.denialQuips.length)]);
    this.topRevealTimer = setTimeout(() => {
      this.diceLanded.set(true);
      this.showTitle.set(true);
    }, 3000);
    this.subtitleRevealTimer = setTimeout(() => this.showSubtitle.set(true), 3300);
    this.bottomRevealTimer = setTimeout(() => this.showBottomCopy.set(true), 3700);
  }

  ngOnDestroy(): void {
    if (this.topRevealTimer) clearTimeout(this.topRevealTimer);
    if (this.subtitleRevealTimer) clearTimeout(this.subtitleRevealTimer);
    if (this.bottomRevealTimer) clearTimeout(this.bottomRevealTimer);
  }

  get statusLabel(): string {
    if (this.errorType === '403') return 'Access denied · 403';
    if (this.errorType === '500') return 'Arcane failure · 500';
    return 'Page not found · 404';
  }

  get message(): string {
    if (this.errorType === '403') return "You don't have permission to enter this chamber.";
    if (this.errorType === '500') return 'The weave came apart in our hands.';
    return 'The page you were looking for wandered into the Shadowfell.';
  }

  get secondaryMessage(): string {
    if (this.errorType === '403') return this.denialQuip();
    if (this.errorType === '500')
      return 'Try again in a moment while the artificers sweep up the residue.';
    return 'Check the address or return to the main road.';
  }

  openSignIn(): void {
    this.auth.authModalTab.set('login');
    this.auth.authModalOpen.set(true);
  }

  goHome(): void {
    void this.router.navigateByUrl(this.auth.isAuthenticated() ? '/home' : '/');
  }
}
