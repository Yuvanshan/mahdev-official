/**
 * Pure query helpers for answering simple reads from the public snapshot.
 * Mirrors the server's SQL (backend/db/tursoDatabase.ts listTursoDocuments):
 * ORDER BY json_extract(data, field) <dir>, id <dir>  (or id ASC), then LIMIT.
 * Kept free of browser APIs so the test suite can compare it with SQLite.
 */

export interface SnapshotDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface SnapshotOrder {
  field: string;
  direction: 'asc' | 'desc';
}

function readField(data: Record<string, unknown>, field: string): unknown {
  return field.split('.').reduce<unknown>(
    (value, part) => (value && typeof value === 'object' ? (value as Record<string, unknown>)[part] : undefined),
    data
  );
}

// SQLite ordering of json_extract values: NULL < numbers (booleans are 0/1) < text.
// Objects and arrays come back from json_extract as JSON text.
export function compareSqlValues(a: unknown, b: unknown): number {
  const normalise = (value: unknown) =>
    typeof value === 'boolean' ? Number(value) : typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
  const left = normalise(a);
  const right = normalise(b);
  const rank = (value: unknown) => (value === null || value === undefined ? 0 : typeof value === 'number' ? 1 : 2);
  const rankDiff = rank(left) - rank(right);
  if (rankDiff !== 0) return rankDiff;
  if (left === right || left === null || left === undefined) return 0;
  return (left as string | number) < (right as string | number) ? -1 : 1;
}

export interface SnapshotFilter {
  field: string;
  operator: string;
  value: unknown;
}

// Operators the snapshot can evaluate exactly like SQLite. Anything else is
// sent to the server instead.
const SUPPORTED_OPERATORS = new Set(['==', 'in']);

export function canEvaluateFilters(filters: SnapshotFilter[], filterGroups: SnapshotFilter[][]): boolean {
  return [...filters, ...filterGroups.flat()].every((filter) =>
    SUPPORTED_OPERATORS.has(filter.operator) &&
    (filter.operator !== 'in' || (Array.isArray(filter.value) && filter.value.length > 0)) &&
    (filter.operator !== '==' || filter.value === null || ['string', 'number', 'boolean'].includes(typeof filter.value))
  );
}

// SQLite compares json_extract results without type conversion (TEXT '1' is
// not INTEGER 1); booleans are stored as 0/1. `IS` matches NULL, `IN` never does.
function sqlEquals(actual: unknown, expected: unknown, nullMatches: boolean): boolean {
  const normalise = (value: unknown) => (typeof value === 'boolean' ? Number(value) : value);
  const left = normalise(actual);
  const right = normalise(expected);
  if (left === undefined || left === null) return nullMatches && (right === null || right === undefined);
  if (typeof left === 'object') return typeof right === 'string' && JSON.stringify(left) === right;
  return left === right;
}

function matchesFilter(document: SnapshotDocument, filter: SnapshotFilter): boolean {
  const actual = readField(document.data, filter.field);
  if (filter.operator === 'in') {
    return (filter.value as unknown[]).some((candidate) => sqlEquals(actual, candidate, false));
  }
  return sqlEquals(actual, filter.value, true);
}

export function filterSnapshotDocuments<T extends SnapshotDocument>(
  documents: T[],
  filters: SnapshotFilter[] = [],
  filterGroups: SnapshotFilter[][] = []
): T[] {
  return documents.filter((document) =>
    filters.every((filter) => matchesFilter(document, filter)) &&
    (filterGroups.length === 0 || filterGroups.some((group) => group.every((filter) => matchesFilter(document, filter))))
  );
}

export function querySnapshotDocuments<T extends SnapshotDocument>(
  documents: T[],
  order?: SnapshotOrder,
  limit?: number
): T[] {
  const direction = order?.direction === 'desc' ? -1 : 1;
  const sorted = documents.slice().sort((a, b) => {
    if (order) {
      const byField = compareSqlValues(readField(a.data, order.field), readField(b.data, order.field));
      if (byField !== 0) return byField * direction;
    }
    return (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) * direction;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}
