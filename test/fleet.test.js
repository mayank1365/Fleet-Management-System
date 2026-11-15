process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const request = require('supertest');
const app = require('../src/gateway/app');
const config = require('../src/config');
const { resetStore, getStore } = require('../src/db/store');
const { resetRateLimiter } = require('../src/middleware/rateLimiter');

const VALID_API_KEY = 'fleet-gateway-api-key-2026';

describe('Fleet Management System — SGA-2 Automated Test Suite (Mayank Gupta 23ebcs737)', function () {
  let adminToken;
  let driverToken;

  beforeEach(function () {
    // Reset in-memory datastore, rate limiter, and service health before every test block
    resetStore();
    resetRateLimiter(50, 60000);
    Object.keys(config.SERVICES).forEach((key) => {
      config.SERVICES[key].healthy = true;
    });
  });

  // ==========================================================================
  // FLOW 1: User Login and JWT Token Verification
  // ==========================================================================
  describe('Flow 1: User Login and JWT Token Verification (/api/users/*)', function () {
    it('should authenticate fleet admin and return a signed JWT token', async function () {
      const res = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({
          email: 'mayank.admin@fleetops.io',
          password: 'Admin@123'
        });

      expect(res.status).to.equal(200);
      expect(res.headers['x-gateway-routed-to']).to.equal('User Service');
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('token').that.is.a('string');
      expect(res.body.data.user).to.include({
        email: 'mayank.admin@fleetops.io',
        role: 'admin'
      });

      adminToken = res.body.data.token;
    });

    it('should verify a valid JWT Bearer token and return decoded claims', async function () {
      const loginRes = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'mayank.admin@fleetops.io', password: 'Admin@123' });

      const token = loginRes.body.data.token;

      const verifyRes = await request(app)
        .get('/api/users/verify')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', `Bearer ${token}`);

      expect(verifyRes.status).to.equal(200);
      expect(verifyRes.body.success).to.be.true;
      expect(verifyRes.body.data.authenticated).to.be.true;
      expect(verifyRes.body.data.user.email).to.equal('mayank.admin@fleetops.io');
      expect(verifyRes.body.data.user.role).to.equal('admin');
    });

    it('should reject login with invalid password (401) and reject tampered JWT token (401)', async function () {
      const badLogin = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'mayank.admin@fleetops.io', password: 'WrongPassword' });

      expect(badLogin.status).to.equal(401);
      expect(badLogin.body.error).to.equal('InvalidCredentialsError');

      const badJwt = await request(app)
        .get('/api/users/verify')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', 'Bearer invalid.jwt.token.value');

      expect(badJwt.status).to.equal(401);
      expect(badJwt.body.error).to.equal('InvalidTokenError');
    });
  });

  // ==========================================================================
  // FLOW 2: Vehicle Registration and Retrieval
  // ==========================================================================
  describe('Flow 2: Vehicle Registration and Retrieval (/api/vehicles/*)', function () {
    beforeEach(async function () {
      const loginRes = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'mayank.admin@fleetops.io', password: 'Admin@123' });
      adminToken = loginRes.body.data.token;
    });

    it('should register a new vehicle, geocode its address via OpenStreetMap, and store GPS coordinates', async function () {
      const res = await request(app)
        .post('/api/vehicles')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          licensePlate: 'DL-10-EV-4040',
          model: 'Switch Mobility IeV4 Electric Truck',
          type: 'Medium EV Truck',
          driverName: 'Rohan Kapoor',
          driverPhone: '+919810010010',
          address: 'Red Fort, New Delhi, India',
          batteryLevel: 96
        });

      expect(res.status).to.equal(201);
      expect(res.headers['x-gateway-routed-to']).to.equal('Vehicle/Fleet Service');
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.include({
        licensePlate: 'DL-10-EV-4040',
        model: 'Switch Mobility IeV4 Electric Truck',
        status: 'ACTIVE'
      });
      expect(res.body.data.location).to.include({
        latitude: 28.6562,
        longitude: 77.2410
      });
    });

    it('should retrieve all vehicles and fetch a specific vehicle by ID with telemetry history', async function () {
      const listRes = await request(app)
        .get('/api/vehicles')
        .set('x-api-key', VALID_API_KEY);

      expect(listRes.status).to.equal(200);
      expect(listRes.body.count).to.equal(5);

      const singleRes = await request(app)
        .get('/api/vehicles/veh-101')
        .set('x-api-key', VALID_API_KEY);

      expect(singleRes.status).to.equal(200);
      expect(singleRes.body.data.id).to.equal('veh-101');
      expect(singleRes.body.data.licensePlate).to.equal('DL-01-AB-1001');
      expect(singleRes.body.data.telemetryHistory).to.be.an('array');
    });
  });

  // ==========================================================================
  // FLOW 3: Vehicle Telemetry Submission, GPS Storage & Critical Event SMS
  // ==========================================================================
  describe('Flow 3: Vehicle Telemetry Submission and Storage (/api/telemetry/*)', function () {
    it('should store normal telemetry and update vehicle GPS coordinates in the database', async function () {
      const res = await request(app)
        .post('/api/telemetry')
        .set('x-api-key', VALID_API_KEY)
        .send({
          vehicleId: 'veh-101',
          latitude: 28.6350,
          longitude: 77.2200,
          speedKmh: 54,
          batteryLevel: 81,
          engineTempC: 79,
          event: 'NORMAL_HEARTBEAT'
        });

      expect(res.status).to.equal(201);
      expect(res.headers['x-gateway-routed-to']).to.equal('Telemetry Service');
      expect(res.body.success).to.be.true;
      expect(res.body.data.telemetry.critical).to.be.false;
      expect(res.body.data.vehicleLocation).to.include({
        latitude: 28.6350,
        longitude: 77.2200
      });
      expect(res.body.data.smsNotification).to.be.null;
    });

    it('should trigger an SMS alert to the fleet administrator when a critical telemetry event occurs', async function () {
      const res = await request(app)
        .post('/api/telemetry')
        .set('x-api-key', VALID_API_KEY)
        .send({
          vehicleId: 'veh-102',
          latitude: 28.6135,
          longitude: 77.2300,
          speedKmh: 0,
          batteryLevel: 10,
          engineTempC: 115,
          event: 'ENGINE_FAULT'
        });

      expect(res.status).to.equal(201);
      expect(res.body.data.telemetry.critical).to.be.true;
      expect(res.body.data.telemetry.event).to.equal('ENGINE_FAULT');
      expect(res.body.data.smsNotification).to.not.be.null;
      expect(res.body.data.smsNotification.status).to.equal('sent');
      expect(res.body.data.smsNotification.sid).to.match(/^SM[0-9a-f]{32}$/);
      expect(res.body.data.smsNotification.message).to.include('ENGINE_FAULT');
    });
  });

  // ==========================================================================
  // FLOW 4: Vehicle Operational Status Update and Notification Triggering
  // ==========================================================================
  describe('Flow 4: Vehicle Operational Status Update and SMS Notification Triggering', function () {
    beforeEach(async function () {
      const loginRes = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'mayank.admin@fleetops.io', password: 'Admin@123' });
      adminToken = loginRes.body.data.token;
    });

    it('should update vehicle operational status and record sent SMS notification', async function () {
      const res = await request(app)
        .patch('/api/vehicles/veh-101/status')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'MAINTENANCE'
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.previousStatus).to.equal('ACTIVE');
      expect(res.body.data.newStatus).to.equal('MAINTENANCE');
      expect(res.body.data.notification).to.include({
        vehicleId: 'veh-101',
        eventType: 'STATUS_CHANGE',
        status: 'sent'
      });
      expect(res.body.data.adminNotification).to.not.be.null;
      expect(res.body.data.adminNotification.status).to.equal('sent');
    });

    it('should record notification status as failed when SMS delivery fails or phone is invalid', async function () {
      const res = await request(app)
        .post('/api/notifications/send')
        .set('x-api-key', VALID_API_KEY)
        .send({
          vehicleId: 'veh-101',
          licensePlate: 'DL-01-AB-1001',
          recipientPhone: 'INVALID_PHONE_NUMBER',
          eventType: 'EMERGENCY_STOP',
          message: 'Emergency stop test with invalid phone'
        });

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.false;
      expect(res.body.data.status).to.equal('failed');
      expect(res.body.data.sid).to.be.null;

      const logsRes = await request(app)
        .get('/api/notifications?status=failed')
        .set('x-api-key', VALID_API_KEY);

      expect(logsRes.status).to.equal(200);
      expect(logsRes.body.count).to.be.at.least(1);
    });
  });

  // ==========================================================================
  // FLOW 5: Role-Based Access Control (RBAC)
  // ==========================================================================
  describe('Flow 5: Role-Based Access Control (RBAC — Unauthorized vs Admin Vehicle Deletion)', function () {
    beforeEach(async function () {
      const adminLogin = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'mayank.admin@fleetops.io', password: 'Admin@123' });
      adminToken = adminLogin.body.data.token;

      const driverLogin = await request(app)
        .post('/api/users/login')
        .set('x-api-key', VALID_API_KEY)
        .send({ email: 'rajesh.driver@fleetops.io', password: 'Driver@123' });
      driverToken = driverLogin.body.data.token;
    });

    it('should forbid a non-admin user (driver role) from deleting a vehicle (403 Forbidden)', async function () {
      const res = await request(app)
        .delete('/api/vehicles/veh-104')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', `Bearer ${driverToken}`);

      expect(res.status).to.equal(403);
      expect(res.body.success).to.be.false;
      expect(res.body.error).to.equal('ForbiddenError');
      expect(getStore().vehicles.some((v) => v.id === 'veh-104')).to.be.true;
    });

    it('should allow an authorized admin user to delete a vehicle (200 OK)', async function () {
      const res = await request(app)
        .delete('/api/vehicles/veh-104')
        .set('x-api-key', VALID_API_KEY)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data.id).to.equal('veh-104');
      expect(getStore().vehicles.some((v) => v.id === 'veh-104')).to.be.false;
    });
  });

  // ==========================================================================
  // FLOW 6: Nearby Vehicle Search Using Mocked Geolocation Services
  // ==========================================================================
  describe('Flow 6: Geolocation Integration & Nearby Vehicle Search (/api/maps/*)', function () {
    it('should obtain geographical coordinates from an address via OpenStreetMap geocoding', async function () {
      const res = await request(app)
        .post('/api/maps/geocode')
        .set('x-api-key', VALID_API_KEY)
        .send({ address: 'India Gate, New Delhi, India' });

      expect(res.status).to.equal(200);
      expect(res.headers['x-gateway-routed-to']).to.equal('Geolocation Service');
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.include({
        latitude: 28.6129,
        longitude: 77.2295
      });
    });

    it('should retrieve vehicles located within X km radius sorted by Haversine distance', async function () {
      // Search within 5 km of Connaught Place (28.6315, 77.2167)
      // veh-101 (0 km), veh-102 (India Gate ~2.41 km), veh-103 (Karol Bagh ~3.37 km) are inside 5 km
      // veh-104 (Gurugram ~19.7 km) and veh-105 (Noida ~12.6 km) are outside 5 km
      const res = await request(app)
        .get('/api/maps/nearby?lat=28.6315&lng=77.2167&radius=5')
        .set('x-api-key', VALID_API_KEY);

      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.count).to.equal(3);

      const ids = res.body.data.map((v) => v.id);
      expect(ids).to.deep.equal(['veh-101', 'veh-102', 'veh-103']);
      expect(res.body.data[0].distanceKm).to.equal(0);
      expect(res.body.data[1].distanceKm).to.be.below(5);
      expect(res.body.data[2].distanceKm).to.be.below(5);
    });
  });

  // ==========================================================================
  // FLOW 7: API Gateway API Key Verification, Rate Limiting & Error Handling
  // ==========================================================================
  describe('Flow 7: API Gateway API Key Verification, Rate Limiting & Error Handling', function () {
    it('should reject requests missing the x-api-key header with 401 Unauthorized', async function () {
      const res = await request(app).get('/api/vehicles');

      expect(res.status).to.equal(401);
      expect(res.body.error).to.equal('MissingApiKeyError');
    });

    it('should reject requests with an invalid x-api-key header with 403 Forbidden', async function () {
      const res = await request(app)
        .get('/api/vehicles')
        .set('x-api-key', 'invalid-api-key-999');

      expect(res.status).to.equal(403);
      expect(res.body.error).to.equal('InvalidApiKeyError');
    });

    it('should enforce API Gateway rate limiting and return 429 Too Many Requests when exceeded', async function () {
      // Configure gateway rate limiter to max 3 requests per window for deterministic testing
      resetRateLimiter(3, 60000);

      for (let i = 1; i <= 3; i++) {
        const okRes = await request(app)
          .get('/api/vehicles')
          .set('x-api-key', VALID_API_KEY)
          .set('x-client-id', 'rate-limit-test-client');
        expect(okRes.status).to.equal(200);
        expect(okRes.headers).to.have.property('x-ratelimit-remaining', String(3 - i));
      }

      const throttledRes = await request(app)
        .get('/api/vehicles')
        .set('x-api-key', VALID_API_KEY)
        .set('x-client-id', 'rate-limit-test-client');

      expect(throttledRes.status).to.equal(429);
      expect(throttledRes.body.error).to.equal('TooManyRequestsError');
    });

    it('should handle downstream service-unavailable (503) and invalid gateway routes (404) gracefully', async function () {
      // Mark telemetry service as unhealthy
      await request(app)
        .post('/api/gateway/service-health')
        .set('x-api-key', VALID_API_KEY)
        .send({ serviceKey: 'telemetry', healthy: false });

      const downRes = await request(app)
        .get('/api/telemetry')
        .set('x-api-key', VALID_API_KEY);

      expect(downRes.status).to.equal(503);
      expect(downRes.body.error).to.equal('ServiceUnavailableError');

      const unknownRouteRes = await request(app)
        .get('/api/unknown-service/resource')
        .set('x-api-key', VALID_API_KEY);

      expect(unknownRouteRes.status).to.equal(404);
      expect(unknownRouteRes.body.error).to.equal('InvalidGatewayRouteError');
    });

    it('should serve OpenAPI 3.0 specification and Swagger UI documentation', async function () {
      const specRes = await request(app).get('/api-docs.json');
      expect(specRes.status).to.equal(200);
      expect(specRes.body.openapi).to.equal('3.0.3');
      expect(specRes.body.paths).to.include.all.keys(
        '/api/users/login',
        '/api/vehicles',
        '/api/telemetry',
        '/api/maps/nearby',
        '/api/notifications'
      );

      const uiRes = await request(app).get('/api-docs/');
      expect(uiRes.status).to.equal(200);
      expect(uiRes.text).to.include('swagger-ui');
    });
  });
});

