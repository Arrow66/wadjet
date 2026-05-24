import type { Request, Response, NextFunction } from 'express';

/**
 * Optional partner API key. When PARTNER_API_KEY is set in env, portal routes require
 * `X-API-Key: <key>` or `?api_key=<key>`. When unset, routes remain open (local dev).
 */
export function requirePartnerApiKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.PARTNER_API_KEY;
  if (!expected) {
    return next();
  }

  const provided =
    (typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'] : null)
    || (typeof req.query.api_key === 'string' ? req.query.api_key : null);

  if (provided !== expected) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Provide a valid partner API key via X-API-Key header or api_key query param.',
    });
  }

  return next();
}
