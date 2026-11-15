const config = require('../config');

const clientBuckets = new Map();
let currentMaxRequests = config.RATE_LIMIT.MAX_REQUESTS;
let currentWindowMs = config.RATE_LIMIT.WINDOW_MS;

function resetRateLimiter(customMax = config.RATE_LIMIT.MAX_REQUESTS, customWindowMs = config.RATE_LIMIT.WINDOW_MS) {
  clientBuckets.clear();
  currentMaxRequests = customMax;
  currentWindowMs = customWindowMs;
}

function gatewayRateLimiter(req, res, next) {
  const clientIdentifier =
    req.headers['x-forwarded-for'] ||
    req.headers['x-client-id'] ||
    req.headers['x-api-key'] ||
    req.ip ||
    'anonymous';

  const now = Date.now();
  let bucket = clientBuckets.get(clientIdentifier);

  if (!bucket || now >= bucket.resetAt) {
    bucket = {
      count: 0,
      resetAt: now + currentWindowMs
    };
  }

  bucket.count += 1;
  clientBuckets.set(clientIdentifier, bucket);

  const remaining = Math.max(0, currentMaxRequests - bucket.count);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', String(currentMaxRequests));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetSeconds));

  if (bucket.count > currentMaxRequests) {
    return res.status(429).json({
      success: false,
      gateway: 'Fleet-API-Gateway',
      error: 'TooManyRequestsError',
      message: `Rate limit exceeded. Maximum of ${currentMaxRequests} requests allowed per ${
        currentWindowMs / 1000
      }s window. Please retry after ${resetSeconds} seconds.`,
      retryAfterSeconds: resetSeconds
    });
  }

  return next();
}

module.exports = {
  gatewayRateLimiter,
  resetRateLimiter
};

