import { create } from 'zustand';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isBooting: true,

  setAuth: (user, accessToken) =>
    set({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBooting: false,
    }),

  clearAuth: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isBooting: false,
    }),

  setBooting: (isBooting) => set({ isBooting }),

  getAccessToken: () => get().accessToken,
  getUser: () => get().user,
}));

// Direct helper for axios interceptors outside React components
export function getAccessToken() {
  return useAuthStore.getState().accessToken;
}
