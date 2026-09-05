import ApiResponse from '../utils/ApiResponse.js';
import { REFRESH_COOKIE_NAME, getRefreshCookieOptions } from '../utils/token.js';
import * as authService from '../services/auth.service.js';

function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

export async function register(req, res) {
  const user = await authService.registerUser(req.body);
  return ApiResponse.created(res, { user });
}

export async function login(req, res) {
  const { accessToken, refreshToken, user } = await authService.loginUser(req.body.email, req.body.password);
  setRefreshCookie(res, refreshToken);
  return ApiResponse.success(res, { accessToken, refreshToken, expiresIn: 900, user });
}

export async function refresh(req, res) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;
  const session = await authService.refreshSession(token);
  setRefreshCookie(res, session.refreshToken);
  return ApiResponse.success(res, {
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresIn: 900,
    user: session.user,
  });
}

export async function logout(req, res) {
  await authService.logoutUser(req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken);
  clearRefreshCookie(res);
  return ApiResponse.success(res, { message: 'Logged out successfully.' });
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  return ApiResponse.success(res, { user });
}
