# Mayank Gupta 23ebcs737 Backend API and Development SGA-2

**Fleet Management System — Third-Party Integrations, Express API Gateway, OpenAPI/Swagger Documentation & Mocha/Chai Automated Test Suite**

- **Student Name:** Mayank Gupta
- **Roll / Enrollment ID:** `23ebcs737`
- **Course:** Backend API and Development (Staff Graded Assignment 2 — SGA-2)
- **GitHub Repository:** [https://github.com/mayank1365/Fleet-Management-System](https://github.com/mayank1365/Fleet-Management-System)

---

## 1. Architecture & System Overview

The **Fleet Management System** enables fleet administrators to monitor real-time vehicle GPS locations, discover nearby vehicles within a configurable radius (`X km`), receive instant SMS notifications for critical vehicle events (`ENGINE_FAULT`, `LOW_BATTERY`, `EMERGENCY_STOP`) and operational status transitions (`ACTIVE`, `MAINTENANCE`, `OUT_OF_SERVICE`, `EMERGENCY`), and explore interactive OpenAPI 3.0 documentation via Swagger UI.

```
                           +-----------------------------------------------+
                           |         Client / Fleet Admin Dashboard        |
                           |      (Leaflet Map UI / REST Client / CLI)     |
                           +-----------------------+-----------------------+
                                                   |
                                   x-api-key + Bearer JWT Token
                                                   v
+--------------------------------------------------------------------------------------------------+
|                            EXPRESS API GATEWAY (src/gateway/app.js)                              |
|  • API Key Verification (x-api-key header -> 401 Missing / 403 Invalid)                          |
|  • Rate Limiting (X-RateLimit-Limit / Remaining / Reset -> 429 Too Many Requests)                |
|  • Downstream Health Check & Error Handling (400 Bad Request / 404 Route / 503 Unavailable)      |
|  • Swagger UI Documentation Server (/api-docs & /api-docs.json)                                  |
+---------+--------------------+--------------------+--------------------+--------------------+----+
          |                    |                    |                    |                    |
  /api/users/*         /api/vehicles/*      /api/telemetry/*      /api/maps/*       /api/notifications/*
          v                    v                    v                    v                    v
+------------------+ +------------------+ +------------------+ +------------------+ +------------------+
|   User Service   | |  Vehicle/Fleet   | | Telemetry Service| |   Geolocation    | |   Notification   |
| (JWT Auth & RBAC)| |     Service      | | (GPS + Sensors)  | |     Service      | |     Service      |
+------------------+ +--------+---------+ +--------+---------+ +--------+---------+ +--------+---------+
                              |                    |                    |                    |
                              +--------------------+--------------------+--------------------+
                                                   |
                         +-------------------------+-------------------------+
                         v                                                   v
        +----------------------------------+               +----------------------------------+
        |  OpenStreetMap Nominatim +       |               |  Mock Twilio SMS Notification    |
        |  Haversine Radius Engine         |               |  Gateway (SID + sent/failed log) |
        +----------------------------------+               +----------------------------------+
```

---

## 2. Gateway Routing Table

| Gateway Route | Target Service | Core Responsibilities |
| :--- | :--- | :--- |
| `/api/users/*` | **User Service** | User registration, login, JWT token issuance & verification, RBAC user listing |
| `/api/vehicles/*` | **Vehicle/Fleet Service** | Vehicle registration (auto-geocoding addresses), retrieval, status updates, RBAC deletion |
| `/api/telemetry/*` | **Telemetry Service** | Real-time GPS & sensor ingestion (`batteryLevel`, `engineTempC`, `speedKmh`), critical alert triggers |
| `/api/maps/*` | **Geolocation Service** | OpenStreetMap address geocoding, GPS coordinate storage, Haversine nearby radius search (`X km`) |
| `/api/notifications/*` | **Notification Service** | Mock Twilio SMS dispatch and audit trail tracking (`sent` / `failed` status) |

---

## 3. Installation & Running Instructions

### Prerequisites
- **Node.js** `>= 18.x` and **npm** `>= 9.x`

### Step 1: Clone the Repository & Install Dependencies
```bash
git clone https://github.com/mayank1365/Fleet-Management-System.git
cd Fleet-Management-System
npm install
```

### Step 2: Start the API Gateway & Fleet Management Server
```bash
npm start
```
- **Interactive Map & Operations Dashboard:** `http://localhost:3000/`
- **Swagger UI OpenAPI 3.0 Documentation:** `http://localhost:3000/api-docs`
- **Raw OpenAPI 3.0 Specification JSON:** `http://localhost:3000/api-docs.json`

### Step 3: Run the Mocha & Chai Automated Test Suite
```bash
npm test
```

---

## 4. Default Credentials & API Keys for Testing

- **Valid API Gateway Key (`x-api-key` header):** `fleet-gateway-api-key-2026` (or `mayank-23ebcs737-api-key`)
- **Fleet Administrator Account (`admin` role):**
  - **Email:** `mayank.admin@fleetops.io`
  - **Password:** `Admin@123`
- **Fleet Driver Account (`driver` role — for RBAC testing):**
  - **Email:** `rajesh.driver@fleetops.io`
  - **Password:** `Driver@123`

---

## 5. Deliverables Included
- **Deliverables Document:** [deliverables.md](./deliverables.md) and [deliverables.pdf](./deliverables.pdf)
- **Screenshots:** Located in [`./screenshots/`](./screenshots/)
  1. `1-geolocation-nearby-vehicles.png` — Vehicle geolocation & nearby vehicle retrieval (`6 km` radius on OpenStreetMap/Leaflet)
  2. `2-sms-notification-alerts.png` — SMS notification generation for critical telemetry (`ENGINE_FAULT`) & status changes
  3. `3-api-gateway-routing-auth.png` — API Gateway routing table and API key verification (`401 MissingApiKeyError`)
  4. `4-swagger-openapi-docs.png` — Interactive Swagger UI OpenAPI 3.0 documentation (`/api-docs`)
  5. `5-mocha-chai-test-suite.png` — Mocha/Chai automated test suite execution (`18 passing`)
