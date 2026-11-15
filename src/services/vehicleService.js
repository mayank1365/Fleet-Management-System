const express = require('express');
const { getStore } = require('../db/store');
const { authenticateJWT, authorizeRoles } = require('../middleware/jwtAuth');
const { geocodeAddress } = require('./geolocationService');
const smsProvider = require('./smsProvider');

const router = express.Router();

const VALID_STATUSES = ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'EMERGENCY', 'IDLE'];

/**
 * GET /api/vehicles
 * Retrieve all registered fleet vehicles
 */
router.get('/', (req, res) => {
  const { status, type } = req.query;
  const store = getStore();

  let vehicles = [...store.vehicles];
  if (status) {
    vehicles = vehicles.filter((v) => v.status.toUpperCase() === status.toUpperCase());
  }
  if (type) {
    vehicles = vehicles.filter((v) => v.type.toLowerCase().includes(type.toLowerCase()));
  }

  return res.status(200).json({
    success: true,
    count: vehicles.length,
    data: vehicles
  });
});

/**
 * GET /api/vehicles/:id
 * Retrieve a specific vehicle by its ID
 */
router.get('/:id', (req, res) => {
  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.id === req.params.id);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: 'NotFoundError',
      message: `Vehicle with ID '${req.params.id}' not found.`
    });
  }

  const telemetryHistory = store.telemetry.filter((t) => t.vehicleId === vehicle.id);

  return res.status(200).json({
    success: true,
    data: {
      ...vehicle,
      telemetryHistory
    }
  });
});

/**
 * POST /api/vehicles
 * Register a new vehicle (integrates OpenStreetMap geocoding when address is provided)
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const {
      id,
      vin,
      licensePlate,
      model,
      type = 'Commercial EV',
      driverName = 'Unassigned',
      driverPhone = '+919811122233',
      status = 'ACTIVE',
      address,
      latitude,
      longitude,
      batteryLevel = 100,
      speedKmh = 0
    } = req.body;

    if (!licensePlate || !model) {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: 'Fields "licensePlate" and "model" are required to register a vehicle.'
      });
    }

    const store = getStore();
    const existingPlate = store.vehicles.find(
      (v) => v.licensePlate.toUpperCase() === licensePlate.toUpperCase()
    );
    if (existingPlate) {
      return res.status(409).json({
        success: false,
        error: 'ConflictError',
        message: `Vehicle with license plate '${licensePlate}' is already registered.`
      });
    }

    let resolvedLat = latitude !== undefined ? Number(latitude) : null;
    let resolvedLng = longitude !== undefined ? Number(longitude) : null;
    let resolvedAddress = address || 'Connaught Place, New Delhi, India';

    if (resolvedLat === null || Number.isNaN(resolvedLat) || resolvedLng === null || Number.isNaN(resolvedLng)) {
      const geocoded = await geocodeAddress(resolvedAddress);
      resolvedLat = geocoded.latitude;
      resolvedLng = geocoded.longitude;
      resolvedAddress = geocoded.displayName || resolvedAddress;
    }

    const newVehicle = {
      id: id || `veh-${100 + store.vehicles.length + 1}`,
      vin: vin || `MA1TA2MKX${Date.now().toString().slice(-8)}`,
      licensePlate: licensePlate.toUpperCase(),
      model,
      type,
      driverName,
      driverPhone,
      status: status.toUpperCase(),
      address: resolvedAddress,
      location: {
        latitude: resolvedLat,
        longitude: resolvedLng,
        updatedAt: new Date().toISOString()
      },
      batteryLevel: Number(batteryLevel),
      speedKmh: Number(speedKmh),
      engineStatus: 'NORMAL',
      createdAt: new Date().toISOString()
    };

    store.vehicles.push(newVehicle);

    return res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully with GPS coordinates',
      data: newVehicle
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'VehicleRegistrationError',
      message: err.message
    });
  }
});

/**
 * PATCH /api/vehicles/:id/status
 * Update operational status of a vehicle and trigger SMS notification to relevant users
 */
const updateStatusHandler = (req, res) => {
  const { status, recipientPhone, simulateSmsFailure = false } = req.body;
  if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: `Valid "status" is required. Allowed values: ${VALID_STATUSES.join(', ')}.`
    });
  }

  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.id === req.params.id);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: 'NotFoundError',
      message: `Vehicle with ID '${req.params.id}' not found.`
    });
  }

  const previousStatus = vehicle.status;
  const newStatus = status.toUpperCase();
  vehicle.status = newStatus;
  if (newStatus === 'MAINTENANCE' || newStatus === 'OUT_OF_SERVICE' || newStatus === 'EMERGENCY') {
    vehicle.speedKmh = 0;
  }

  const notifications = smsProvider.notifyStatusChange({
    vehicle,
    previousStatus,
    newStatus,
    recipientPhone,
    simulateFailure: Boolean(simulateSmsFailure)
  });

  return res.status(200).json({
    success: true,
    message: `Vehicle operational status updated from ${previousStatus} to ${newStatus} and SMS notification triggered`,
    data: {
      vehicle,
      previousStatus,
      newStatus,
      notification: notifications.primaryNotification,
      adminNotification: notifications.adminNotification
    }
  });
};

router.patch('/:id/status', authenticateJWT, updateStatusHandler);
router.put('/:id/status', authenticateJWT, updateStatusHandler);

/**
 * DELETE /api/vehicles/:id
 * Delete a vehicle from the fleet (Admin only - Role-Based Access Control)
 */
router.delete('/:id', authenticateJWT, authorizeRoles('admin'), (req, res) => {
  const store = getStore();
  const idx = store.vehicles.findIndex((v) => v.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({
      success: false,
      error: 'NotFoundError',
      message: `Vehicle with ID '${req.params.id}' not found.`
    });
  }

  const [deletedVehicle] = store.vehicles.splice(idx, 1);

  return res.status(200).json({
    success: true,
    message: `Vehicle '${deletedVehicle.licensePlate}' (${deletedVehicle.id}) deleted by admin ${req.user.email}`,
    data: deletedVehicle
  });
});

module.exports = router;

