export function parseListQuery(query, sortableFields, defaults = {}) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const order = query.order === 'asc' ? 'asc' : 'desc';
  const sortBy = sortableFields.includes(query.sortBy) ? query.sortBy : (defaults.sortBy || sortableFields[0]);
  const search = typeof query.search === 'string' && query.search.trim() ? query.search.trim() : undefined;
  return { page, limit, order, sortBy, search, skip: (page - 1) * limit };
}

export function buildPaginationMeta(page, limit, total) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export function buildOrderBy(sortBy, order) {
  return { [sortBy]: order };
}
