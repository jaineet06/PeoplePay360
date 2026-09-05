import axios from 'axios';
import { useAuthStore, getStoredRefreshToken } from '@/features/auth/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let refreshPromise = null;

function isAccessTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() + 30_000;
  } catch {
    return false;
  }
}

/**
 * Single shared refresh — boot, auth API, and axios interceptor all use this
 * so concurrent callers (e.g. React Strict Mode double-mount) share one rotation.
 */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function performRefresh() {
  try {
    const storedRefreshToken = getStoredRefreshToken();
    const response = await axios.post(
      `${BASE_URL}/auth/refresh`,
      storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
      { withCredentials: true }
    );

    const { accessToken, refreshToken, user } = response.data.data;
    useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    return { accessToken, refreshToken, user };
  } catch (error) {
    const message = error?.response?.data?.message;
    const isAlreadyRotated = message === 'Refresh token has already been rotated.';
    const { accessToken, refreshToken, user } = useAuthStore.getState();

    if (isAlreadyRotated && accessToken && user) {
      return { accessToken, refreshToken, user };
    }

    throw error;
  }
}

/** Skip network refresh when the stored access token is still valid. */
export function hasValidStoredSession() {
  const { accessToken, user, refreshToken } = useAuthStore.getState();
  return Boolean(user && refreshToken && isAccessTokenValid(accessToken));
}
