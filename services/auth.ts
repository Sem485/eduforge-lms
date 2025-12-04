
import { User } from '../types';
import { server } from './server';

const TOKEN_KEY = 'eduforge_token';

// Event dispatch helper to notify App.tsx immediately
// We pass the User object (or null) to allow synchronous state updates
export const notifyAuthChange = (user: User | null) => {
  const event = new CustomEvent('auth-change', { detail: user });
  window.dispatchEvent(event);
};

export const authService = {
  async login(username: string, password: string): Promise<User | null> {
    const response = await server.auth.login(username, password);
    if (response.data) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      // Pass the user object directly to avoid async fetch delay in App.tsx
      notifyAuthChange(response.data.user); 
      return response.data.user;
    }
    return null;
  },

  async logout() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await server.auth.logout(token);
    }
    localStorage.removeItem(TOKEN_KEY);
    notifyAuthChange(null); // Notify that user is logged out
  },

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const response = await server.auth.me(token);
    return response.data || null;
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }
};
