// Query Builder Utility - Eliminates repeated URLSearchParams patterns

type QueryValue = string | number | boolean | undefined | null;

export function buildQueryString(params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function parseQueryParams(
  searchParams: URLSearchParams,
  defaults: { limit?: number; skip?: number } = {}
): { limit: number; skip: number; [key: string]: string | number } {
  const limit = parseInt(searchParams.get("limit") || String(defaults.limit || 50));
  const skip = parseInt(searchParams.get("skip") || String(defaults.skip || 0));

  const result: { limit: number; skip: number; [key: string]: string | number } = { limit, skip };

  searchParams.forEach((value, key) => {
    if (key !== "limit" && key !== "skip") {
      result[key] = value;
    }
  });

  return result;
}

export function buildMongoFilter(
  params: Record<string, string | number | undefined>,
  excludeKeys: string[] = ["page", "limit", "skip", "search"]
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "all" && !excludeKeys.includes(key)) {
      filter[key] = value;
    }
  }

  return filter;
}

export function getPaginationMeta(total: number, limit: number, skip: number) {
  return {
    total,
    page: Math.floor(skip / limit) + 1,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}
