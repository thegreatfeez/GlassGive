/**
 * authService.ts
 *
 * Centralized service for handling frontend authentication,
 * JWT storage, and interactions with the backend auth endpoints.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  hederaAccountId?: string;
  email?: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private tokenKey = 'gg_token';
  private userKey = 'gg_user';

  private async login(path: string, payload: Record<string, string>, fallbackMessage: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || fallbackMessage);
    }

    this.setSession(data.token, data.user);
    return data;
  }

  setSession(token: string, user: User) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.tokenKey, token);
      window.localStorage.setItem(this.userKey, JSON.stringify(user));
      // Notify other parts of the app about auth state change
      window.dispatchEvent(new Event('gg-auth-changed'));
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(this.tokenKey);
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = window.localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  logout() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.tokenKey);
      window.localStorage.removeItem(this.userKey);
      window.dispatchEvent(new Event('gg-auth-changed'));
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async loginWithMagic(didToken: string): Promise<AuthResponse> {
    return this.login('/auth/magic', { didToken }, 'Magic login failed');
  }

  async loginWithWallet(accountId: string, signature: string): Promise<AuthResponse> {
    return this.login('/auth/wallet', { accountId, signature }, 'Wallet login failed');
  }

  async loginAdminWithMagic(didToken: string): Promise<AuthResponse> {
    return this.login('/auth/admin/magic', { didToken }, 'Admin Magic login failed');
  }

  async loginAdminWithWallet(accountId: string, signature: string): Promise<AuthResponse> {
    return this.login('/auth/admin/wallet', { accountId, signature }, 'Admin wallet login failed');
  }

  /**
   * Helper to perform authenticated fetch calls.
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    const headers = {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    };

    return fetch(url, { ...options, headers });
  }
}

export const authService = new AuthService();
