import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AUTH_TOKEN_KEY, getSharedCookie } from '../services/cookie-sso.helper';
import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthSessionService);
  const token =
    auth.jwtToken() ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null) ||
    getSharedCookie(AUTH_TOKEN_KEY);

  let modifiedReq = req.clone({ withCredentials: true });
  if (token && !req.headers.has('Authorization')) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/google') ||
        req.url.includes('/auth/request-account');

      if (error.status === 401 && !isAuthEndpoint) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
