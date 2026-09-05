export default class ApiResponse {
  static success(res, data, options = {}) {
    const payload = { success: true, data };
    if (options.meta !== undefined) payload.meta = options.meta;
    return res.status(options.statusCode || 200).json(payload);
  }

  static created(res, data, meta) {
    return ApiResponse.success(res, data, { statusCode: 201, meta });
  }

  static paginated(res, data, meta) {
    return ApiResponse.success(res, data, { meta });
  }
}
