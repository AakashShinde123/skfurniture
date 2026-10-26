import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, isAppError } from "./errors";

/**
 * Standardised JSON envelope for every API response.
 *
 * Success: { data: T }
 * Failure: { error: { code, message, details? } }
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export function apiOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function apiFail(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse {
  const body: { error: ApiErrorBody } = {
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
  return NextResponse.json(body, { status });
}

/**
 * Central error mapper. Every route handler funnels thrown errors through
 * here so clients always receive the same shape and no stack traces leak.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return apiFail(400, "VALIDATION_ERROR", "The submitted data is invalid.", {
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (isAppError(error)) {
    return apiFail(error.status, error.code, error.message, error.details);
  }

  // Prisma unique-constraint violations surface as P2002.
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return apiFail(409, "CONFLICT", "A record with the same unique value already exists.");
  }

  console.error("[api] unhandled error:", error);
  return apiFail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
}
