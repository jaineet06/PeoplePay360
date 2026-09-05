'use strict';

const ApiError = require('../utils/ApiError');

/**
 * @param {...import('@prisma/client').Role} allowedRoles
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }

    return next();
  };
}

module.exports = authorize;
