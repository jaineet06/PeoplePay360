'use strict';

const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const { prisma } = require('../configs/db');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  const token = header.slice(7);

  try {
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        employeeId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      return next(ApiError.unauthorized('Account is inactive or does not exist.'));
    }

    req.user = user;
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token.'));
  }
}

module.exports = authenticate;
