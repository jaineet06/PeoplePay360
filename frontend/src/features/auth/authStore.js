import { create } from 'zustand';

const AUTH_STORAGE_KEY = 'pp360_auth_session';

function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSession(user, accessToken, refreshToken) {
  try {
    if (user && (accessToken || refreshToken)) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ user, accessToken, refreshToken })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to persist session', e);
  }
}

const initialSession = getStoredSession();

export const useAuthStore = create((set, get) => ({
  user: initialSession?.user || null,
  accessToken: initialSession?.accessToken || null,
  refreshToken: initialSession?.refreshToken || null,
  isAuthenticated: Boolean(initialSession?.user && (initialSession?.accessToken || initialSession?.refreshToken)),
  // Always boot as true: even with a stored session the access token may be expired
  // and firing protected-route API calls before the boot refresh completes causes a
  // race condition — two concurrent refresh calls fight over the same DB token, the
  // second gets "already rotated" (401), and clearAuth() bounces the user to login.
  isBooting: true,

  setAuth: (user, accessToken, refreshToken = null) => {
    const finalRefreshToken = refreshToken || get().refreshToken;
    persistSession(user, accessToken, finalRefreshToken);
    set({
      user,
      accessToken,
      refreshToken: finalRefreshToken,
      isAuthenticated: Boolean(user && accessToken),
      isBooting: false,
    });
  },

  clearAuth: () => {
    persistSession(null, null, null);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isBooting: false,
    });
  },

  setBooting: (isBooting) => set({ isBooting }),

  getAccessToken: () => get().accessToken,
  getRefreshToken: () => get().refreshToken,
  getUser: () => get().user,
}));

// Direct helpers for axios interceptors outside React components
export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export function getStoredRefreshToken() {
  return useAuthStore.getState().refreshToken;
}
