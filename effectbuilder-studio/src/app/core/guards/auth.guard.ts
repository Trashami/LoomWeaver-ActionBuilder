import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthSessionService } from '../services/auth-session.service';

/**
 * Strict Authentication Guard protecting all LoomWeaver & subdomain app routes.
 * No studio or tool workspace is available without signing in first.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  auth.openAuthModal('login', state.url);
  return router.createUrlTree(['/welcome'], {
    queryParams: {
      auth: 'login',
      returnUrl: state.url,
    },
  });
};
