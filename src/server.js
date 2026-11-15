const app = require('./gateway/app');
const config = require('./config');

const server = app.listen(config.PORT, () => {
  console.log('==================================================================');
  console.log('  FLEET MANAGEMENT SYSTEM — API GATEWAY & MICROSERVICES (SGA-2)');
  console.log('  Author : Mayank Gupta (23ebcs737)');
  console.log(`  Gateway: http://localhost:${config.PORT}`);
  console.log(`  Map UI : http://localhost:${config.PORT}/`);
  console.log(`  Swagger: http://localhost:${config.PORT}/api-docs`);
  console.log('==================================================================');
  console.log('  Gateway Route Table:');
  console.log('    /api/users/*         -> User Service');
  console.log('    /api/vehicles/*      -> Vehicle/Fleet Service');
  console.log('    /api/telemetry/*     -> Telemetry Service');
  console.log('    /api/maps/*          -> Geolocation Service (OpenStreetMap)');
  console.log('    /api/notifications/* -> Notification Service (Mock Twilio SMS)');
  console.log('==================================================================');
});

module.exports = server;

