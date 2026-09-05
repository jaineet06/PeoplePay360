'use strict';

class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {object} [options]
   * @param {boolean} [options.isOperational=true]
   * @param {Array<{field?: string, message: string}>} [options.errors]
   */
  constructor(statusCode, message, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.errors = options.errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, { errors });
  }

  static unauthorized(message = 'Authentication required.') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, message);
  }

  static conflict(message, errors) {
    return new ApiError(409, message, { errors });
  }

  static tooMany(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, message);
  }
}

module.exports = ApiError;
