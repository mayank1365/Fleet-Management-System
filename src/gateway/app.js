const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const config = require('../config');
const swaggerSpec = require('../docs/swagger');
const { verifyApiKey } = require('../middleware/apiKeyAuth');
const { gatewayRateLimiter } = require('../middleware/rateLimiter');

const userServiceRouter = require('../services/userService');
const vehicleServiceRouter = require('../services/vehicleService');
const telemetryServiceRouter = require('../services/telemetryService');
const { router: geolocationServiceRouter } = require('../services/geolocationService');
const notificationServiceRouter = require('../services/notificationService');

const app = express();

app.use(cors());

// Capture malformed JSON body errors with clean 400 Invalid Request response
app.use(
  express.json({
    limit: '1mb'
  })
);
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      gateway: 'Fleet-API-Gateway',
      error: 'InvalidRequestError',
      message: 'Malformed JSON payload in request body.'
    });
  }
  return next(err);
});

// Serve static web dashboard (Map UI + SMS Console + Gateway Tester)
app.use(express.static(path.join(__dirname, '../public')));

// Serve OpenAPI 3.0 JSON spec & Swagger UI Documentation
app.get('/api-docs.json', (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Fleet Management System — Swagger UI (23ebcs737)',
    customCss: '.swagger-ui .topbar { background-color: #0f172a; }'
  })
);

// Public health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    gateway: 'Fleet-API-Gateway',
    author: 'Mayank Gupta (23ebcs737)',
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// API GATEWAY PIPELINE (/api/*)
// 1. Verify API Key (x-api-key header)
// 2. Enforce Rate Limiting (X-RateLimit-* headers, 429 Too Many Requests)
// 3. Check Downstream Target Service Health (503 Service Unavailable)
// 4. Forward Request & Response to Target Backend Service
// ============================================================================
app.use('/api', verifyApiKey, gatewayRateLimiter);

// API Gateway inspection & service health toggle endpoints
app.get('/api/gateway/status', (req, res) => {
  return res.status(200).json({
    success: true,
    gateway: 'Fleet-API-Gateway',
    author: 'Mayank Gupta (23ebcs737)',
    routingTable: [
      { route: '/api/users/*', targetService: 'User Service', status: config.SERVICES.users.healthy ? 'UP' : 'DOWN' },
      {
        route: '/api/vehicles/*',
        targetService: 'Vehicle/Fleet Service',
        status: config.SERVICES.vehicles.healthy ? 'UP' : 'DOWN'
      },
      {
        route: '/api/telemetry/*',
        targetService: 'Telemetry Service',
        status: config.SERVICES.telemetry.healthy ? 'UP' : 'DOWN'
      },
      {
        route: '/api/maps/*',
        targetService: 'Geolocation Service',
        status: config.SERVICES.maps.healthy ? 'UP' : 'DOWN'
      },
      {
        route: '/api/notifications/*',
        targetService: 'Notification Service',
        status: config.SERVICES.notifications.healthy ? 'UP' : 'DOWN'
      }
    ],
    rateLimitPolicy: {
      windowMs: config.RATE_LIMIT.WINDOW_MS,
      maxRequestsPerWindow: config.RATE_LIMIT.MAX_REQUESTS
    }
  });
});

app.post('/api/gateway/service-health', (req, res) => {
  const { serviceKey, healthy } = req.body;
  if (!serviceKey || !config.SERVICES[serviceKey] || typeof healthy !== 'boolean') {
    return res.status(400).json({
      success: false,
      gateway: 'Fleet-API-Gateway',
      error: 'InvalidRequestError',
      message: 'Valid "serviceKey" (users|vehicles|telemetry|maps|notifications) and boolean "healthy" are required.'
    });
  }
  config.SERVICES[serviceKey].healthy = healthy;
  return res.status(200).json({
    success: true,
    gateway: 'Fleet-API-Gateway',
    message: `${config.SERVICES[serviceKey].name} health set to ${healthy ? 'UP' : 'DOWN'}`,
    service: config.SERVICES[serviceKey]
  });
});

/**
 * Gateway Service Forwarding Middleware Factory
 * Attaches routing metadata headers and checks downstream service availability
 */
function forwardToService(serviceKey, serviceRouter) {
  return (req, res, next) => {
    const serviceMeta = config.SERVICES[serviceKey];
    const simulatedDown =
      req.headers['x-simulate-service-down'] === serviceKey ||
      req.headers['x-simulate-service-down'] === 'true';

    res.setHeader('X-Gateway-Routed-To', serviceMeta.name);
    res.setHeader('X-Gateway-Service-Port', String(serviceMeta.port));

    if (!serviceMeta.healthy || simulatedDown) {
      return res.status(503).json({
        success: false,
        gateway: 'Fleet-API-Gateway',
        targetService: serviceMeta.name,
        error: 'ServiceUnavailableError',
        message: `Target backend service '${serviceMeta.name}' (${serviceMeta.prefix}) is currently unavailable. Please try again later.`
      });
    }

    return serviceRouter(req, res, next);
  };
}

// Mount the 5 required API Gateway routes
app.use('/api/users', forwardToService('users', userServiceRouter));
app.use('/api/vehicles', forwardToService('vehicles', vehicleServiceRouter));
app.use('/api/telemetry', forwardToService('telemetry', telemetryServiceRouter));
app.use('/api/maps', forwardToService('maps', geolocationServiceRouter));
app.use('/api/notifications', forwardToService('notifications', notificationServiceRouter));

// Handle unknown /api/* routes with 400/404 Invalid Gateway Route error
app.use('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    gateway: 'Fleet-API-Gateway',
    error: 'InvalidGatewayRouteError',
    message: `No backend service registered for gateway route '${req.originalUrl}'. Valid prefixes: /api/users/*, /api/vehicles/*, /api/telemetry/*, /api/maps/*, /api/notifications/*.`
  });
});

module.exports = app;
