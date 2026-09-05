import ApiError from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/token.js';
import { prisma } from '../configs/db.js';

export default async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized());
  }

  try {
    const decoded = verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true, email: true, role: true, isActive: true,
        employeeId: true, lastLoginAt: true, createdAt: true, updatedAt: true,
      },
    });

    if (!user?.isActive) return next(ApiError.unauthorized('Account is inactive or does not exist.'));
    req.user = user;
    return next();
  } catch {
    return next(ApiError.unauthorized('Invalid or expired access token.'));
  }
}
