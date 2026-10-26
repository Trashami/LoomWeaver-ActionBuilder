import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.models';
import {
  TOKEN_KEY,
  USER_KEY,
  writeSharedCookie,
  clearSharedCookie,
  readSharedCookie,
} from './cookie-session.helper';
import { renderGoogleButtonOrBridge, openGoogleBridgePopup } from './google-sso.helper';

export type { User, AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/auth';

  private readonly currentUserSignal = signal<User | null>(this.loadStoredUser());
  private readonly tokenSignal = signal<string | null>(this.loadStoredToken());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.currentUserSignal());
  readonly isAdmin = computed(() => {
    const u = this.currentUserSignal();
    return u?.role === 'admin' || u?.isAdmin === true;
  });
  readonly userTier = computed(() => this.currentUserSignal()?.tier ?? 'player');
  readonly totalCredits = computed(() => this.currentUserSignal()?.totalAiCredits ?? 0);
  readonly storageLimitBytes = computed(() => this.currentUserSignal()?.storageLimitBytes ?? 262144000);
  readonly hideAiContent = computed(() => !!this.currentUserSignal()?.hideAiContent);
  readonly enableWeave = computed(() => !!this.currentUserSignal()?.enableWeave);

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const patreonToken = params.get('patreon_token');
      const patreonUser = params.get('patreon_user');
      if (patreonToken && patreonUser) {
        try {
          const user: User = JSON.parse(patreonUser);
          this.handleAuthSuccess({ token: patreonToken, user });
          params.delete('patreon_token');
          params.delete('patreon_user');
          params.delete('patreon_linked');
          const clean = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, '', clean);
        } catch {
          // ignore malformed patreon query params
        }
      }
    }
  }

  private normalizeUser(res: AuthResponse | any): User {
    if (res?.user) return res.user as User;
    if (res?.id && res?.email) return res as User;
    const p = res?.profile;
    return {
      id: Number(p?.id ?? 1),
      accountId: p?.accountId ?? 'acc-1',
      email: p?.email ?? '',
      username: p?.username ?? 'Adventurer',
      displayName: p?.displayName ?? p?.username ?? 'Adventurer',
      role: p?.role === 'gm' ? 'dm' : 'player',
      tier: p?.tierCode ?? 'adventurer',
      billingCycle: 'annual',
      subscriptionStatus: 'active',
      subscriptionAiCredits: 1000,
      purchasedAiCredits: 500,
      totalAiCredits: 1500,
      storageUsedBytes: 0,
      storageLimitBytes: 10737418240,
      activeCampaignsLimit: 25,
      boundCharacter: p?.boundCharacter,
    };
  }

  private loadStoredToken(): string | null {
    const cookieToken = readSharedCookie(TOKEN_KEY);
    if (cookieToken) {
      localStorage.setItem(TOKEN_KEY, cookieToken);
      return cookieToken;
    }
    const local = localStorage.getItem(TOKEN_KEY);
    if (local) writeSharedCookie(TOKEN_KEY, local);
    return local;
  }

  private loadStoredUser(): User | null {
    const cookieRaw = readSharedCookie(USER_KEY);
    if (cookieRaw) {
      try {
        const parsed = JSON.parse(cookieRaw) as User;
        localStorage.setItem(USER_KEY, cookieRaw);
        return parsed;
      } catch {
        clearSharedCookie(USER_KEY);
      }
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as User;
      writeSharedCookie(USER_KEY, raw);
      return parsed;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data, { withCredentials: true })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  requestAccount(data: {
    email: string;
    username: string;
    displayName?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/request-account`, data);
  }

  login(identifierOrReq: string | LoginRequest, password?: string): Observable<AuthResponse> {
    const payload: LoginRequest =
      typeof identifierOrReq === 'string'
        ? { identifier: identifierOrReq, password: password ?? '' }
        : identifierOrReq;
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, payload, { withCredentials: true })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google`, { idToken }, { withCredentials: true })
      .pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  initGoogleSignIn(
    containerId: string,
    onCredential: (idToken: string) => void,
    _onBridgeDone?: () => void
  ): void {
    if (typeof document === 'undefined') return;
    const container = document.getElementById(containerId);
    if (!container) return;
    renderGoogleButtonOrBridge(container, onCredential, () => {}, 340);
  }

  renderGoogleButton(
    container: HTMLElement,
    onSuccess?: () => void,
    onError?: (message: string) => void,
    width = 320
  ): void {
    renderGoogleButtonOrBridge(
      container,
      (credential) => {
        this.loginWithGoogle(credential).subscribe({
          next: () => onSuccess?.(),
          error: (err) => onError?.(err?.error?.message || 'Google sign-in failed.'),
        });
      },
      (msg) => onError?.(msg),
      width
    );
  }

  promptGoogleSignIn(onSuccess?: () => void, onError?: (message: string) => void): void {
    openGoogleBridgePopup(
      (credential) => {
        this.loginWithGoogle(credential).subscribe({
          next: () => onSuccess?.(),
          error: (err) => onError?.(err?.error?.message || 'Google sign-in failed.'),
        });
      },
      (msg) => onError?.(msg)
    );
  }

  refreshProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap((user) => {
        const token = user.token || this.tokenSignal();
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
          writeSharedCookie(TOKEN_KEY, token);
          this.tokenSignal.set(token);
        }
        this.currentUserSignal.set(user);
        const serialized = JSON.stringify(user);
        localStorage.setItem(USER_KEY, serialized);
        writeSharedCookie(USER_KEY, serialized);
      })
    );
  }

  updateAiPreference(prefs: { hideAiContent?: boolean; enableWeave?: boolean }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/ai-preference`, prefs, { withCredentials: true }).pipe(
      tap((user) => {
        this.currentUserSignal.set(user);
        const serialized = JSON.stringify(user);
        localStorage.setItem(USER_KEY, serialized);
        writeSharedCookie(USER_KEY, serialized);
      })
    );
  }

  loginWithPatreon(_returnPath?: string): void {
    const token = this.tokenSignal();
    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname);
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    window.location.href = `${this.apiUrl}/patreon/redirect?returnUrl=${returnUrl}${tokenParam}`;
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({ error: () => {} });
    this.clearInvalidSession();
  }

  clearInvalidSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearSharedCookie(TOKEN_KEY);
    clearSharedCookie(USER_KEY);
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
  }

  private handleAuthSuccess(response: AuthResponse): void {
    const user = this.normalizeUser(response);
    const serialized = JSON.stringify(user);
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, serialized);
    writeSharedCookie(TOKEN_KEY, response.token);
    writeSharedCookie(USER_KEY, serialized);
    this.tokenSignal.set(response.token);
    this.currentUserSignal.set(user);
  }
}
