declare const google: any;

export const GOOGLE_CLIENT_ID =
  '280529007750-q5jrb7qbln2hpcaf8a62j4125oied8qs.apps.googleusercontent.com';

const GSI_SCRIPT_ID = 'mw-google-gsi-sdk';
const MAIN_ORIGIN = 'https://www.loom-weaver.com';

export function isSubdomainHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h.endsWith('.loom-weaver.com') && h !== 'loom-weaver.com' && h !== 'www.loom-weaver.com';
}

export function loadGoogleScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.accounts?.id) return Promise.resolve();

  const existing = document.getElementById(GSI_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In SDK.')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In SDK.'));
    document.head.appendChild(script);
  });
}

export function openGoogleBridgePopup(
  onCredential: (idToken: string) => void,
  onError: (msg: string) => void
): void {
  const origin = encodeURIComponent(window.location.origin);
  const url = `${MAIN_ORIGIN}/google-sso.html?origin=${origin}`;
  const w = 480;
  const h = 580;
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
  const popup = window.open(url, 'mw_google_sso', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);

  if (!popup) {
    onError('Popup blocked. Please allow popups for this site and try again.');
    return;
  }

  const handler = (ev: MessageEvent) => {
    if (ev.origin !== MAIN_ORIGIN && ev.origin !== 'https://loom-weaver.com') return;
    const data = ev.data;
    if (!data || data.type !== 'mw-google-credential' || !data.credential) return;
    window.removeEventListener('message', handler);
    clearInterval(pollClosed);
    onCredential(data.credential);
  };
  window.addEventListener('message', handler);

  const pollClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(pollClosed);
      window.removeEventListener('message', handler);
    }
  }, 600);
}

export function renderGoogleButtonOrBridge(
  container: HTMLElement,
  onCredential: (idToken: string) => void,
  onError: (msg: string) => void,
  width = 320
): void {
  if (isSubdomainHost()) {
    container.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = `width:${width}px;height:40px;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:#fff;color:#1f1f1f;border:1px solid #dadce0;border-radius:4px;font:500 14px/1 'Roboto',system-ui,sans-serif;cursor:pointer;padding:0 14px;`;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span>`;
    btn.onclick = () => openGoogleBridgePopup(onCredential, onError);
    container.appendChild(btn);
    return;
  }

  loadGoogleScript()
    .then(() => {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res: { credential?: string }) => {
          if (res?.credential) onCredential(res.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      container.innerHTML = '';
      google.accounts.id.renderButton(container, {
        theme: 'filled_black',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
        width,
      });
    })
    .catch((err) => onError(err?.message || 'Unable to initialize Google Sign-In.'));
}
