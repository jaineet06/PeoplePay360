'use strict';

const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.badRequest('Validation failed.', err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))),
        );
      }
      return next(err);
    }
  };
}

module.exports = validate;
