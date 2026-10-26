/**
 * Client-side API helper — unwraps the standard { data } / { error } envelope
 * and turns failures into thrown `ApiClientError`s the hooks can toast.
 */

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, code: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** Field-level issues from Zod, when the server sent them. */
  get fieldIssues(): Array<{ path: string; message: string }> | null {
    if (
      this.details &&
      typeof this.details === "object" &&
      "issues" in this.details &&
      Array.isArray((this.details as { issues: unknown }).issues)
    ) {
      return (this.details as { issues: Array<{ path: string; message: string }> }).issues;
    }
    return null;
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
  });

  let payload: { data?: T; error?: { code: string; message: string; details?: unknown } } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    // non-JSON response (e.g. 502 from the gateway)
  }

  if (!response.ok || payload.error) {
    throw new ApiClientError(
      payload.error?.message ?? `Request failed (${response.status})`,
      payload.error?.code ?? "REQUEST_FAILED",
      response.status,
      payload.error?.details,
    );
  }

  return payload.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  put: <T>(url: string, body?: unknown) => request<T>("PUT", url, body),
  patch: <T>(url: string, body?: unknown) => request<T>("PATCH", url, body),
  delete: <T>(url: string) => request<T>("DELETE", url),
};

/** Multipart upload (files validated client-side, re-validated server-side). */
export async function apiUpload(
  url: string,
  formData: FormData,
): Promise<{ id: string; key: string; url: string; width: number | null; height: number | null }> {
  const response = await fetch(url, { method: "POST", body: formData, credentials: "same-origin" });
  const payload = (await response.json().catch(() => ({}))) as {
    data?: { id: string; key: string; url: string; width: number | null; height: number | null };
    error?: { code: string; message: string; details?: unknown };
  };
  if (!response.ok || !payload.data || payload.error) {
    throw new ApiClientError(
      payload.error?.message ?? "Upload failed",
      payload.error?.code ?? "UPLOAD_FAILED",
      response.status,
      payload.error?.details,
    );
  }
  return payload.data;
}
