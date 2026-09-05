import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';

export default function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.body) req.body = schemas.body.parse(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(ApiError.badRequest('Validation failed.', err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }))));
      }
      return next(err);
    }
  };
}
