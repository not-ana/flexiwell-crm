import { TOKEN_KEY } from "@/lib/utils/constants";

/**
 * Wrapper around fetch that adds the Authorization header from localStorage.
 * Use this in client components instead of bare fetch() for authenticated API calls.
 */
export function authFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
