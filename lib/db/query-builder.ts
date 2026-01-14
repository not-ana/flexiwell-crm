/**
 * Database query builder utilities
 * Eliminates duplicate filter/search/pagination patterns across 40+ API routes
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface SearchableFields {
  [key: string]: string | number | boolean;
}

/**
 * Build a MongoDB filter query with search capabilities
 *
 * @example
 * const filter = buildSearchFilter(
 *   { status: 'active', role: 'admin' },
 *   'john',
 *   ['name', 'email', 'phone']
 * );
 * // Result: { status: 'active', role: 'admin', $or: [...] }
 */
export function buildSearchFilter<T extends Record<string, unknown>>(
  baseFilters: Partial<T>,
  searchTerm?: string,
  searchFields?: (keyof T)[]
): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...baseFilters };

  // Add search logic if provided
  if (searchTerm && searchFields && searchFields.length > 0) {
    filter.$or = searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: "i" },
    }));
  }

  return filter;
}

/**
 * Calculate pagination parameters
 *
 * @example
 * const { skip, limit } = getPaginationParams({ page: 2, limit: 20 });
 * // Result: { skip: 20, limit: 20 }
 */
export function getPaginationParams(params: PaginationParams = {}): {
  skip: number;
  limit: number;
  page: number;
} {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  return { skip, limit, page };
}

/**
 * Build a complete pagination result with metadata
 *
 * @example
 * const result = buildPaginationResult(clients, total, { page: 2, limit: 20 });
 */
export function buildPaginationResult<T>(
  data: T[],
  total: number,
  params: PaginationParams = {}
): PaginationResult<T> {
  const { page, limit } = getPaginationParams(params);
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
    },
  };
}

/**
 * Build sort options from query parameters
 *
 * @example
 * const sort = buildSortOptions('createdAt', 'desc');
 * // Result: { createdAt: -1 }
 */
export function buildSortOptions(
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc"
): Record<string, 1 | -1> {
  if (!sortBy) {
    return { createdAt: -1 }; // Default sort
  }

  return {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };
}

/**
 * Parse query string parameters for filtering
 *
 * @example
 * const filters = parseQueryFilters(request.nextUrl.searchParams, ['status', 'role']);
 * // Extracts only specified fields from URL params
 */
export function parseQueryFilters(
  searchParams: URLSearchParams,
  allowedFields: string[]
): Record<string, string> {
  const filters: Record<string, string> = {};

  allowedFields.forEach(field => {
    const value = searchParams.get(field);
    if (value && value !== "all") {
      filters[field] = value;
    }
  });

  return filters;
}

/**
 * Complete query builder that combines all utilities
 *
 * @example
 * const query = buildQuery(request, {
 *   allowedFilters: ['status', 'role'],
 *   searchFields: ['name', 'email'],
 *   defaultSort: 'createdAt'
 * });
 */
export interface QueryBuilderOptions {
  allowedFilters: string[];
  searchFields?: string[];
  defaultSort?: string;
  defaultSortOrder?: "asc" | "desc";
}

export interface QueryResult {
  filter: Record<string, unknown>;
  sort: Record<string, 1 | -1>;
  skip: number;
  limit: number;
  page: number;
}

export function buildQuery(
  searchParams: URLSearchParams,
  options: QueryBuilderOptions
): QueryResult {
  // Parse filters
  const filters = parseQueryFilters(searchParams, options.allowedFilters);

  // Parse search term
  const search = searchParams.get("search") || undefined;

  // Build filter with search
  const filter = buildSearchFilter(filters, search, options.searchFields);

  // Parse pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const { skip, limit: validatedLimit, page: validatedPage } = getPaginationParams({ page, limit });

  // Parse sorting
  const sortBy = searchParams.get("sortBy") || options.defaultSort;
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || options.defaultSortOrder || "desc";
  const sort = buildSortOptions(sortBy, sortOrder);

  return {
    filter,
    sort,
    skip,
    limit: validatedLimit,
    page: validatedPage,
  };
}
