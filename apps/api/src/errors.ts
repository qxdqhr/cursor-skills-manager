import type { Context } from 'hono';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'GIT_ERROR'
  | 'SCRIPT_ERROR'
  | 'INDEX_ERROR'
  | 'INTERNAL_ERROR';

const statusByCode: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  GIT_ERROR: 502,
  SCRIPT_ERROR: 502,
  INDEX_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function jsonOk<T>(c: Context, data: T) {
  return c.json({ ok: true, data });
}

export function jsonError(c: Context, err: ApiError | Error) {
  const payload =
    err instanceof ApiError
      ? {
          ok: false as const,
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
        }
      : {
          ok: false as const,
          error: {
            code: 'INTERNAL_ERROR' as const,
            message: err.message,
          },
        };

  const status = err instanceof ApiError ? statusByCode[err.code] : 500;
  void c;
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
