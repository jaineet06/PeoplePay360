import bcrypt from 'bcrypt';
import { prisma } from '../configs/db.js';
import ApiError from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../utils/token.js';

const BCRYPT_ROUNDS = 12;
const userSelect = {
  id: true, email: true, role: true, isActive: true,
  employeeId: true, lastLoginAt: true, createdAt: true, updatedAt: true,
};

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function buildAuthTokens(user) {
  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

async function persistRefreshToken(userId, refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 86400000);
  await prisma.refreshToken.create({ data: { userId, tokenHash: hashToken(refreshToken), expiresAt } });
}

export async function registerUser(payload) {
  if (await prisma.user.findUnique({ where: { email: payload.email } })) {
    throw ApiError.conflict('A user with this email already exists.');
  }
  if (payload.employeeId) {
    const linked = await prisma.user.findFirst({ where: { employeeId: payload.employeeId } });
    if (linked) throw ApiError.conflict('This employee already has a login account.');
  }
  return prisma.user.create({
    data: {
      email: payload.email,
      passwordHash: await hashPassword(payload.password),
      role: payload.role,
      isActive: payload.isActive,
      employeeId: payload.employeeId ?? null,
    },
    select: userSelect,
  });
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  const { accessToken, refreshToken } = buildAuthTokens(user);
  await persistRefreshToken(user.id, refreshToken);
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { accessToken, refreshToken, user: sanitizeUser(user) };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token is required.');
  let decoded;
  try { decoded = verifyRefreshToken(refreshToken); } catch { throw ApiError.unauthorized('Invalid refresh token.'); }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: { select: userSelect } },
  });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || !stored.user.isActive) {
    throw ApiError.unauthorized('Refresh token has been revoked or expired.');
  }
  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
  const tokens = buildAuthTokens(stored.user);
  await persistRefreshToken(stored.user.id, tokens.refreshToken);
  return { ...tokens, user: sanitizeUser(stored.user) };
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userSelect,
      employee: { select: { id: true, employeeCode: true, fullName: true, workEmail: true, status: true, departmentId: true } },
    },
  });
  if (!user) throw ApiError.notFound('User not found.');
  return user;
}

export { hashPassword, sanitizeUser };
