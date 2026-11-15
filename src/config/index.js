require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'sga2-fleet-management-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: '24h',
  VALID_API_KEYS: [
    'fleet-gateway-api-key-2026',
    'mayank-23ebcs737-api-key',
    'test-gateway-key-123'
  ],
  ADMIN_PHONE: process.env.ADMIN_PHONE || '+919876543210',
  DISPATCH_PHONE: process.env.DISPATCH_PHONE || '+919123456789',
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000, // 1 minute window
    MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX || '30', 10) // default 30 req/min
  },
  SERVICES: {
    users: { name: 'User Service', prefix: '/api/users', healthy: true, port: 4001 },
    vehicles: { name: 'Vehicle/Fleet Service', prefix: '/api/vehicles', healthy: true, port: 4002 },
    telemetry: { name: 'Telemetry Service', prefix: '/api/telemetry', healthy: true, port: 4003 },
    maps: { name: 'Geolocation Service', prefix: '/api/maps', healthy: true, port: 4004 },
    notifications: { name: 'Notification Service', prefix: '/api/notifications', healthy: true, port: 4005 }
  }
};
