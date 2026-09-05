'use strict';

const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/user.service');

async function list(req, res) {
  const { page, limit, sortBy, order, search, role, isActive } = req.query;

  const { users, meta } = await userService.listUsers({
    page,
    limit,
    sortBy,
    order,
    search,
    role,
    isActive,
    skip: (page - 1) * limit,
  });

  return ApiResponse.paginated(res, users, meta);
}

async function getById(req, res) {
  const user = await userService.getUserById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found.');
  }

  return ApiResponse.success(res, { user });
}

module.exports = {
  list,
  getById,
};
