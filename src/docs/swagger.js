const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Fleet Management System — API Gateway & Microservices (SGA-2)',
    version: '1.0.0',
    description:
      'Comprehensive OpenAPI 3.0 Documentation for the Fleet Management System (Staff Graded Assignment 2) by **Mayank Gupta (23ebcs737)**.\n\n' +
      '### Architecture Overview\n' +
      '- **API Gateway (`/api/*`)**: Enforces API Key verification (`x-api-key`), rate limiting (`X-RateLimit-*`), service health checks (`503 Service Unavailable`), and routes traffic to 5 downstream backend services.\n' +
      '- **Geolocation Service (`/api/maps/*`)**: Integrates OpenStreetMap Nominatim for forward geocoding and Haversine spatial queries for nearby vehicle discovery.\n' +
      '- **SMS Notification Service (`/api/notifications/*`)**: Integrates a Mock Twilio SMS Gateway to alert fleet administrators on critical telemetry events (`ENGINE_FAULT`, `LOW_BATTERY`, `EMERGENCY_STOP`) and operational status transitions.\n' +
      '- **Authentication & RBAC**: Uses JWT Bearer tokens (`Authorization: Bearer <token>`) and role-based access control (`admin`, `driver`, `viewer`).',
    contact: {
      name: 'Mayank Gupta (23ebcs737)',
      url: 'https://github.com/mayank1365/Fleet-Management-System',
      email: 'mayank.admin@fleetops.io'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Express API Gateway (Primary Entry Point)'
    }
  ],
  tags: [
    {
      name: 'API Gateway',
      description: 'Gateway routing table, service health controls, API key verification, and rate limit telemetry'
    },
    {
      name: 'User Service',
      description: 'Routed via /api/users/* — User registration, login, JWT verification, and admin user management'
    },
    {
      name: 'Vehicle/Fleet Service',
      description: 'Routed via /api/vehicles/* — Vehicle CRUD, operational status transitions, and RBAC-protected deletion'
    },
    {
      name: 'Telemetry Service',
      description: 'Routed via /api/telemetry/* — Real-time GPS & vehicle sensor ingestion with automated critical SMS alerts'
    },
    {
      name: 'Geolocation Service',
      description: 'Routed via /api/maps/* — OpenStreetMap address geocoding, GPS coordinate persistence, and Haversine radius search'
    },
    {
      name: 'Notification Service',
      description: 'Routed via /api/notifications/* — Mock Twilio SMS dispatch and delivery audit logs (sent/failed)'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API Gateway Key required for all `/api/*` routes. Default valid key: `fleet-gateway-api-key-2026`'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token obtained from `POST /api/users/login`'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          gateway: { type: 'string', example: 'Fleet-API-Gateway' },
          error: { type: 'string', example: 'ValidationError' },
          message: { type: 'string', example: 'Detailed description of the error.' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'mayank.admin@fleetops.io' },
          password: { type: 'string', format: 'password', example: 'Admin@123' }
        }
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'usr-admin-001' },
                  name: { type: 'string', example: 'Mayank Gupta' },
                  email: { type: 'string', example: 'mayank.admin@fleetops.io' },
                  role: { type: 'string', enum: ['admin', 'driver', 'viewer'], example: 'admin' },
                  phone: { type: 'string', example: '+919876543210' }
                }
              }
            }
          }
        }
      },
      Vehicle: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'veh-101' },
          vin: { type: 'string', example: 'MA1TA2MKX20261001' },
          licensePlate: { type: 'string', example: 'DL-01-AB-1001' },
          model: { type: 'string', example: 'Tata Prima E.28K Electric Truck' },
          type: { type: 'string', example: 'Heavy Truck' },
          driverName: { type: 'string', example: 'Rajesh Sharma' },
          driverPhone: { type: 'string', example: '+919811122233' },
          status: {
            type: 'string',
            enum: ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'EMERGENCY', 'IDLE'],
            example: 'ACTIVE'
          },
          address: { type: 'string', example: 'Connaught Place, New Delhi, India' },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: 28.6315 },
              longitude: { type: 'number', example: 77.2167 },
              updatedAt: { type: 'string', format: 'date-time', example: '2026-11-15T09:00:00.000Z' }
            }
          },
          batteryLevel: { type: 'number', example: 84 },
          speedKmh: { type: 'number', example: 48 },
          engineStatus: { type: 'string', example: 'NORMAL' }
        }
      },
      VehicleRegistrationRequest: {
        type: 'object',
        required: ['licensePlate', 'model'],
        properties: {
          licensePlate: { type: 'string', example: 'DL-04-EV-9090' },
          model: { type: 'string', example: 'Switch Mobility IeV4' },
          type: { type: 'string', example: 'Electric Delivery Truck' },
          driverName: { type: 'string', example: 'Karan Malhotra' },
          driverPhone: { type: 'string', example: '+919899988877' },
          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'IDLE'], example: 'ACTIVE' },
          address: {
            type: 'string',
            description: 'Physical address geocoded via OpenStreetMap if latitude/longitude are omitted',
            example: 'Red Fort, New Delhi, India'
          },
          latitude: { type: 'number', example: 28.6562 },
          longitude: { type: 'number', example: 77.2410 },
          batteryLevel: { type: 'number', example: 95 }
        }
      },
      StatusUpdateRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'EMERGENCY', 'IDLE'],
            example: 'MAINTENANCE'
          },
          recipientPhone: {
            type: 'string',
            description: 'Optional phone number override for SMS alert',
            example: '+919876543210'
          },
          simulateSmsFailure: {
            type: 'boolean',
            default: false,
            description: 'Set true in tests to simulate a failed SMS delivery record'
          }
        }
      },
      TelemetrySubmissionRequest: {
        type: 'object',
        required: ['vehicleId', 'latitude', 'longitude'],
        properties: {
          vehicleId: { type: 'string', example: 'veh-101' },
          latitude: { type: 'number', example: 28.6289 },
          longitude: { type: 'number', example: 77.2195 },
          speedKmh: { type: 'number', example: 0 },
          batteryLevel: { type: 'number', example: 12 },
          engineTempC: { type: 'number', example: 112 },
          event: {
            type: 'string',
            enum: ['NORMAL_HEARTBEAT', 'ENGINE_FAULT', 'LOW_BATTERY', 'EMERGENCY_STOP', 'OVERSPEED'],
            example: 'ENGINE_FAULT'
          },
          address: { type: 'string', example: 'Barakhamba Road, New Delhi, India' }
        }
      },
      GeocodeRequest: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', example: 'India Gate, New Delhi, India' }
        }
      },
      SmsNotification: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'notif-901' },
          sid: { type: 'string', nullable: true, example: 'SM8a91b2c3d4e5f60001a2b3c4d5e6f701' },
          provider: { type: 'string', example: 'Twilio-Mock-Sandbox' },
          vehicleId: { type: 'string', example: 'veh-103' },
          licensePlate: { type: 'string', example: 'DL-03-EF-3099' },
          recipientPhone: { type: 'string', example: '+919876543210' },
          recipientRole: { type: 'string', example: 'Fleet Administrator' },
          eventType: { type: 'string', example: 'LOW_BATTERY' },
          message: {
            type: 'string',
            example: '[FLEET CRITICAL ALERT] Vehicle DL-03-EF-3099 (veh-103) reported LOW_BATTERY (14%) at (28.6514, 77.1907).'
          },
          status: { type: 'string', enum: ['sent', 'failed'], example: 'sent' },
          timestamp: { type: 'string', format: 'date-time', example: '2026-11-15T09:10:01.000Z' }
        }
      }
    }
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/api/gateway/status': {
      get: {
        tags: ['API Gateway'],
        summary: 'Inspect API Gateway routing table and downstream service health',
        security: [{ ApiKeyAuth: [] }],
        responses: {
          200: {
            description: 'API Gateway routing table and service statuses returned successfully'
          },
          401: {
            description: 'Missing API Key (`x-api-key` header)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          403: {
            description: 'Invalid API Key',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          429: {
            description: 'Rate limit exceeded',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/users/login': {
      post: {
        tags: ['User Service'],
        summary: 'Authenticate fleet user and issue JWT token',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Authenticated successfully; returns signed JWT token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' }
              }
            }
          },
          400: {
            description: 'Missing email or password',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Invalid credentials or missing API key',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/users/verify': {
      get: {
        tags: ['User Service'],
        summary: 'Verify JWT Bearer token and inspect claims',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        responses: {
          200: {
            description: 'JWT token is valid and active'
          },
          401: {
            description: 'Missing or expired JWT token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/vehicles': {
      get: {
        tags: ['Vehicle/Fleet Service'],
        summary: 'Retrieve all registered fleet vehicles',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'EMERGENCY'] },
            description: 'Filter vehicles by operational status'
          }
        ],
        responses: {
          200: {
            description: 'List of fleet vehicles retrieved successfully'
          }
        }
      },
      post: {
        tags: ['Vehicle/Fleet Service'],
        summary: 'Register a new vehicle (auto-geocodes address via OpenStreetMap)',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VehicleRegistrationRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Vehicle registered and GPS coordinates stored in database',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Vehicle' } } }
          },
          400: {
            description: 'Validation error (missing licensePlate or model)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Missing or invalid JWT token',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          409: {
            description: 'Duplicate license plate conflict',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/api/vehicles/{id}': {
      get: {
        tags: ['Vehicle/Fleet Service'],
        summary: 'Retrieve a specific vehicle and its telemetry history by ID',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'veh-101' }
        ],
        responses: {
          200: { description: 'Vehicle details returned' },
          404: { description: 'Vehicle not found' }
        }
      },
      delete: {
        tags: ['Vehicle/Fleet Service'],
        summary: 'Delete a vehicle from the fleet (RBAC: Admin Role Required)',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'veh-104' }
        ],
        responses: {
          200: { description: 'Vehicle deleted by administrator' },
          401: { description: 'Missing JWT token' },
          403: {
            description: 'Forbidden: User role is not authorized (Admin required)',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          404: { description: 'Vehicle not found' }
        }
      }
    },
    '/api/vehicles/{id}/status': {
      patch: {
        tags: ['Vehicle/Fleet Service'],
        summary: 'Update operational status of a vehicle and trigger SMS notification',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'veh-101' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StatusUpdateRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Operational status updated and SMS notification sent/recorded'
          },
          400: { description: 'Invalid status value' },
          404: { description: 'Vehicle not found' }
        }
      }
    },
    '/api/telemetry': {
      post: {
        tags: ['Telemetry Service'],
        summary: 'Submit vehicle GPS telemetry; triggers SMS alert on critical events',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TelemetrySubmissionRequest' }
            }
          }
        },
        responses: {
          201: {
            description: 'Telemetry stored in database; SMS alert dispatched if event is critical'
          },
          400: { description: 'Invalid coordinates or missing vehicleId' },
          404: { description: 'Vehicle not found' }
        }
      },
      get: {
        tags: ['Telemetry Service'],
        summary: 'Retrieve stored vehicle telemetry records',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'vehicleId', in: 'query', schema: { type: 'string' }, example: 'veh-101' },
          { name: 'critical', in: 'query', schema: { type: 'boolean' }, example: true }
        ],
        responses: {
          200: { description: 'List of telemetry records' }
        }
      }
    },
    '/api/maps/geocode': {
      post: {
        tags: ['Geolocation Service'],
        summary: 'Obtain geographical coordinates (lat/lng) from a vehicle address via OpenStreetMap',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GeocodeRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Coordinates resolved from address'
          },
          400: { description: 'Missing or invalid address' }
        }
      }
    },
    '/api/maps/nearby': {
      get: {
        tags: ['Geolocation Service'],
        summary: 'Retrieve vehicles located within a specified radius (X km) of a location',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'lat', in: 'query', schema: { type: 'number' }, example: 28.6315, description: 'Center latitude' },
          { name: 'lng', in: 'query', schema: { type: 'number' }, example: 77.2167, description: 'Center longitude' },
          {
            name: 'address',
            in: 'query',
            schema: { type: 'string' },
            example: 'Connaught Place, New Delhi',
            description: 'Optional address instead of lat/lng'
          },
          {
            name: 'radius',
            in: 'query',
            required: true,
            schema: { type: 'number', default: 10 },
            example: 5,
            description: 'Search radius in kilometers (X km)'
          }
        ],
        responses: {
          200: {
            description: 'Nearby vehicles within X km sorted by Haversine distance'
          },
          400: { description: 'Invalid radius or missing location parameters' }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notification Service'],
        summary: 'Retrieve SMS notification audit logs (status: sent / failed)',
        security: [{ ApiKeyAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['sent', 'failed'] } },
          { name: 'vehicleId', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'List of SMS notifications with summary statistics'
          }
        }
      }
    },
    '/api/notifications/send': {
      post: {
        tags: ['Notification Service'],
        summary: 'Dispatch a custom or test SMS notification via Mock Twilio Gateway',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['recipientPhone', 'message'],
                properties: {
                  vehicleId: { type: 'string', example: 'veh-101' },
                  licensePlate: { type: 'string', example: 'DL-01-AB-1001' },
                  recipientPhone: { type: 'string', example: '+919876543210' },
                  eventType: { type: 'string', example: 'EMERGENCY_STOP' },
                  message: { type: 'string', example: '[FLEET CRITICAL ALERT] Emergency stop triggered.' },
                  simulateFailure: { type: 'boolean', example: false }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'SMS notification sent and logged',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SmsNotification' } } }
          },
          200: {
            description: 'SMS notification attempt logged as failed'
          }
        }
      }
    }
  }
};

module.exports = swaggerSpec;
