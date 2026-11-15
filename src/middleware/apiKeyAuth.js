const config = require('../config');

/**
 * API Gateway Middleware: Verify incoming API Key in 'x-api-key' header (or query param 'apiKey')
 */
function verifyApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      gateway: 'Fleet-API-Gateway',
      error: 'MissingApiKeyError',
      message: 'API Gateway denied request: Missing "x-api-key" header.'
    });
  }

  if (!config.VALID_API_KEYS.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      gateway: 'Fleet-API-Gateway',
      error: 'InvalidApiKeyError',
      message: 'API Gateway denied request: Invalid or revoked API key.'
    });
  }

  req.apiKey = apiKey;
  return next();
}

module.exports = {
  verifyApiKey
};
