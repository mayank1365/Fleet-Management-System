const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware: Verify Bearer JWT Token
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UnauthorizedError',
      message: 'Authentication required. Please provide a valid Bearer JWT token in the Authorization header.'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'InvalidTokenError',
      message: 'Invalid or expired JWT token.'
    });
  }
}

/**
 * Middleware: Role-Based Access Control (RBAC)
 * Example: authorizeRoles('admin')
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UnauthorizedError',
        message: 'User authentication required before role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'ForbiddenError',
        message: `Access denied. Role '${req.user.role}' is not authorized to perform this action. Required role(s): ${allowedRoles.join(', ')}.`
      });
    }

    return next();
  };
}

module.exports = {
  authenticateJWT,
  authorizeRoles
};

