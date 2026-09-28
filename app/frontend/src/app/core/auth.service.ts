import { Injectable, computed, signal } from '@angular/core';

const KEY = 'emsa_officer';

interface Session { token: string; name: string; email: string; expires: number }

// Officer session. Kept in sessionStorage so it ends when the tab closes;
// the token itself expires after 2 hours on the server.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = signal<Session | null>(this.restore());

  readonly token = computed(() => this.session()?.token ?? null);
  readonly name = computed(() => this.session()?.name ?? '');
  readonly email = computed(() => this.session()?.email ?? '');
  /** True when the server rejected the token (shown on the sign-in form). */
  readonly expired = signal(false);

  signIn(token: string, name: string, email: string): void {
    const s = { token, name, email, expires: Date.now() + 2 * 60 * 60 * 1000 };
    sessionStorage.setItem(KEY, JSON.stringify(s));
    this.session.set(s);
    this.expired.set(false);
  }

  signOut(): void {
    sessionStorage.removeItem(KEY);
    this.session.set(null);
  }

  expire(): void {
    if (!this.session()) return;
    this.signOut();
    this.expired.set(true);
  }

  private restore(): Session | null {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Session | null;
      return s && s.expires > Date.now() ? s : null;
    } catch {
      return null;
    }
  }
}
