// Escapes regex metacharacters in user-supplied search/lookup text before it's interpolated into
// a MongoDB regex filter — e.g. DepartmentRepository.getByName()'s case-insensitive exact match
// and EmployeeRepository.list()'s free-text search. Without this, a name/search term containing
// `.`, `*`, `(`, etc. would be interpreted as regex syntax instead of a literal string.
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
