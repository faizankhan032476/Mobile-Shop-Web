export class ApiClientError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string>) { super(message); }
}

/** Thin fetch wrapper for our own /api routes. Throws ApiClientError with a user-presentable message. */
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers }, body: json !== undefined ? JSON.stringify(json) : rest.body, cache: "no-store" });
  } catch { throw new ApiClientError(0, "NETWORK", "Can’t reach the server. Check your connection and try again."); }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiClientError(res.status, body?.error?.code ?? "ERROR", body?.error?.message ?? "Something went wrong.", body?.error?.fields);
  return body as T;
}
