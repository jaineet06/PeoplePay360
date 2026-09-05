import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export async function list(req, res) {
  const { page, limit, sortBy, order, search, role, isActive } = req.query;
  const { users, meta } = await userService.listUsers({
    page, limit, sortBy, order, search, role, isActive, skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, users, meta);
}

export async function getById(req, res) {
  const user = await userService.getUserById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  return ApiResponse.success(res, { user });
}
