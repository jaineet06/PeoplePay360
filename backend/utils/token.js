import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../configs/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getRefreshCookieOptions() {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const maxAge = match ? Number(match[1]) * mult[match[2]] : 7 * 86_400_000;
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge,
    path: '/api/v1/auth',
  };
}
