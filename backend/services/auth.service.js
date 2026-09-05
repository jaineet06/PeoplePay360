'use strict';

const bcrypt = require('bcrypt');
const { prisma } = require('../configs/db');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require('../utils/token');

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  email: true,
  role: true,
  isActive: true,
  employeeId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function buildAuthTokens(user) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  return { accessToken, refreshToken };
}

async function persistRefreshToken(userId, refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 86400000);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
    },
  });
}

async function registerUser(payload) {
  const existing = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists.');
  }

  if (payload.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: payload.employeeId } });
    if (!employee) {
      throw ApiError.badRequest('Linked employee does not exist.');
    }

    const linked = await prisma.user.findFirst({ where: { employeeId: payload.employeeId } });
    if (linked) {
      throw ApiError.conflict('This employee already has a login account.');
    }
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await prisma.user.create({
    data: {
      email: payload.email,
      passwordHash,
      role: payload.role,
      isActive: payload.isActive,
      employeeId: payload.employeeId ?? null,
    },
    select: userSelect,
  });

  return user;
}

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  const { accessToken, refreshToken } = buildAuthTokens(user);

  await persistRefreshToken(user.id, refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: sanitizeUser({ ...user, passwordHash: undefined }),
  };
}

async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw ApiError.unauthorized('Refresh token is required.');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token.');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: {
      user: { select: userSelect },
    },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Refresh token has been revoked or expired.');
  }

  if (!stored.user.isActive) {
    throw ApiError.unauthorized('Account is inactive.');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const { accessToken, refreshToken: newRefreshToken } = buildAuthTokens(stored.user);
  await persistRefreshToken(stored.user.id, newRefreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: sanitizeUser(stored.user),
  };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelect,
      employee: {
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          workEmail: true,
          status: true,
          departmentId: true,
        },
      },
    },
  });

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return user;
}

module.exports = {
  registerUser,
  loginUser,
  refreshSession,
  logoutUser,
  getCurrentUser,
  sanitizeUser,
};
