'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../configs/env');
const { Prisma } = require('@prisma/client');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal server error';
  let errors;
  let isOperational = false;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
    isOperational = err.isOperational;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    statusCode = mapped.statusCode;
    message = mapped.message;
    isOperational = true;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid or expired token.';
    isOperational = true;
  } else if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed.';
    errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    isOperational = true;
  }

  if (!isOperational || statusCode >= 500) {
    logger.error('Unhandled error', {
      path: req.originalUrl,
      method: req.method,
      message: err.message,
      stack: err.stack,
    });
  }

  const payload = {
    success: false,
    message,
  };

  if (errors?.length) {
    payload.errors = errors;
  }

  if (env.isDev && statusCode >= 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

function mapPrismaError(err) {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, message: 'A record with this value already exists.' };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found.' };
    case 'P2003':
      return { statusCode: 409, message: 'Operation violates a related record constraint.' };
    default:
      return { statusCode: 500, message: 'Database error.' };
  }
}

module.exports = errorHandler;
