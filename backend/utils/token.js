'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../configs/env');

const REFRESH_COOKIE_NAME = 'refreshToken';

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshCookieOptions() {
  const maxAgeMs = parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);

  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: maxAgeMs,
    path: '/api/v1/auth',
  };
}

function parseDurationToMs(value) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
}

module.exports = {
  REFRESH_COOKIE_NAME,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
};
