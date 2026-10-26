export const TOKEN_KEY = 'mw_auth_token';
export const USER_KEY = 'mw_auth_user';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function cookieDomainAttr(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'loom-weaver.com' || host.endsWith('.loom-weaver.com')) {
    return '; domain=.loom-weaver.com';
  }
  return '';
}

export function writeSharedCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${cookieDomainAttr()}${secure}`;
}

export function clearSharedCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${cookieDomainAttr()}`;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function readSharedCookie(name: string): string | null {
  if (typeof document === 'undefined' || !document.cookie) return null;
  const prefix = `${name}=`;
  for (const raw of document.cookie.split(';')) {
    const part = raw.trim();
    if (part.startsWith(prefix)) {
      try {
        return decodeURIComponent(part.slice(prefix.length));
      } catch {
        return part.slice(prefix.length);
      }
    }
  }
  return null;
}
