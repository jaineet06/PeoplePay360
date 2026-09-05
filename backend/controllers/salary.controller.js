import ApiResponse from '../utils/ApiResponse.js';
import * as salaryService from '../services/salary.service.js';

export async function listStructures(req, res) {
  const { page, limit, sortBy, order, search, isActive } = req.query;
  const result = await salaryService.listStructures({
    page, limit, sortBy, order, search, isActive, skip: (page - 1) * limit,
  });
  return ApiResponse.paginated(res, result.salaryStructures, result.meta);
}

export async function listStructureOptions(req, res) {
  const options = await salaryService.listStructureOptions();
  return ApiResponse.success(res, options);
}

export async function getStructure(req, res) {
  const structure = await salaryService.getStructureById(req.params.id);
  return ApiResponse.success(res, { salaryStructure: structure });
}

export async function createStructure(req, res) {
  const salaryStructure = await salaryService.createStructure(req.body);
  return ApiResponse.created(res, { salaryStructure });
}

export async function updateStructure(req, res) {
  const salaryStructure = await salaryService.updateStructure(req.params.id, req.body);
  return ApiResponse.success(res, { salaryStructure });
}

export async function removeStructure(req, res) {
  const salaryStructure = await salaryService.removeStructure(req.params.id);
  return ApiResponse.success(res, { salaryStructure });
}

export async function listRules(req, res) {
  const rules = await salaryService.listRules(req.params.id);
  return ApiResponse.success(res, { rules });
}

export async function getRule(req, res) {
  const rule = await salaryService.getRule(req.params.id, req.params.ruleId);
  return ApiResponse.success(res, { rule });
}

export async function createRule(req, res) {
  const rule = await salaryService.createRule(req.params.id, req.body);
  return ApiResponse.created(res, { rule });
}

export async function updateRule(req, res) {
  const rule = await salaryService.updateRule(req.params.id, req.params.ruleId, req.body);
  return ApiResponse.success(res, { rule });
}

export async function removeRule(req, res) {
  const rule = await salaryService.removeRule(req.params.id, req.params.ruleId);
  return ApiResponse.success(res, { rule });
}

export async function reorderRules(req, res) {
  const rules = await salaryService.reorderRules(req.params.id, req.body.rules);
  return ApiResponse.success(res, { rules });
}

export async function simulate(req, res) {
  const result = await salaryService.simulate(req.params.id, req.body);
  return ApiResponse.success(res, result);
}
