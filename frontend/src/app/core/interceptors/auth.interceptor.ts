import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import {
  AUTH_TOKEN_KEY,
  getSharedCookie,
  isJwtValidAndUnexpired,
} from '../services/cookie-sso.helper';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const rawToken =
    (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null) ||
    getSharedCookie(AUTH_TOKEN_KEY);

  const token = isJwtValidAndUnexpired(rawToken) ? rawToken : null;

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
      const isPublicEndpoint =
        req.url.includes('/health') ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/google') ||
        req.url.includes('/auth/request-account');

      if (error.status === 401 && !isPublicEndpoint && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('lw:unauthorized'));
      }
      return throwError(() => error);
    }),
  );
};
