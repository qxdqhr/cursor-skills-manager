import type { Context, Next } from 'hono';
import { getApiToken } from '@csm/core';
import type { AppContext } from '../context.js';
import { ApiError } from '../errors.js';

export function bearerAuth() {
  return async (c: Context, next: Next) => {
    const ctx = c.get('ctx') as AppContext;
    const expected = getApiToken(ctx.config);
    if (!expected) {
      await next();
      return;
    }
    const header = c.req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token || token !== expected) {
      throw new ApiError('UNAUTHORIZED', 'Invalid or missing Bearer token');
    }
    await next();
  };
}
