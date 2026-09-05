'use strict';

const ApiResponse = require('../utils/ApiResponse');
const {
  REFRESH_COOKIE_NAME,
  getRefreshCookieOptions,
} = require('../utils/token');
const authService = require('../services/auth.service');

function setRefreshCookie(res, refreshToken) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

async function register(req, res) {
  const user = await authService.registerUser(req.body);
  return ApiResponse.created(res, { user });
}

async function login(req, res) {
  const { accessToken, refreshToken, user } = await authService.loginUser(
    req.body.email,
    req.body.password,
  );

  setRefreshCookie(res, refreshToken);

  return ApiResponse.success(res, {
    accessToken,
    expiresIn: 900,
    user,
  });
}

async function refresh(req, res) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;
  const session = await authService.refreshSession(refreshToken);

  setRefreshCookie(res, session.refreshToken);

  return ApiResponse.success(res, {
    accessToken: session.accessToken,
    expiresIn: 900,
    user: session.user,
  });
}

async function logout(req, res) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body.refreshToken;
  await authService.logoutUser(refreshToken);
  clearRefreshCookie(res);

  return ApiResponse.success(res, { message: 'Logged out successfully.' });
}

async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  return ApiResponse.success(res, { user });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
