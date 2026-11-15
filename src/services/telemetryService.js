const express = require('express');
const { getStore } = require('../db/store');
const smsProvider = require('./smsProvider');

const router = express.Router();

const CRITICAL_EVENTS = [
  'ENGINE_FAULT',
  'LOW_BATTERY',
  'EMERGENCY_STOP',
  'OVERSPEED',
  'COLLISION_WARNING',
  'BRAKE_FAILURE'
];

/**
 * POST /api/telemetry
 * Submit vehicle telemetry & GPS coordinates; trigger SMS notification on critical events
 */
router.post('/', (req, res) => {
  const {
    vehicleId,
    latitude,
    longitude,
    speedKmh = 0,
    batteryLevel = 100,
    engineTempC = 80,
    event = 'NORMAL_HEARTBEAT',
    address,
    simulateSmsFailure = false
  } = req.body;

  if (!vehicleId || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Fields "vehicleId", "latitude", and "longitude" are required for telemetry submission.'
    });
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Invalid GPS coordinates: latitude must be [-90, 90] and longitude must be [-180, 180].'
    });
  }

  const store = getStore();
  const vehicle = store.vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: 'NotFoundError',
      message: `Vehicle with ID '${vehicleId}' not found.`
    });
  }

  let resolvedEvent = event.toUpperCase();
  if (resolvedEvent === 'NORMAL_HEARTBEAT') {
    if (Number(batteryLevel) <= 15) {
      resolvedEvent = 'LOW_BATTERY';
    } else if (Number(engineTempC) >= 105) {
      resolvedEvent = 'ENGINE_FAULT';
    }
  }

  const isCritical = CRITICAL_EVENTS.includes(resolvedEvent);
  const timestamp = new Date().toISOString();

  // Update vehicle GPS coordinates and telemetry snapshot in database
  vehicle.location = {
    latitude: lat,
    longitude: lng,
    updatedAt: timestamp
  };
  if (address) {
    vehicle.address = address;
  }
  vehicle.speedKmh = Number(speedKmh);
  vehicle.batteryLevel = Number(batteryLevel);
  vehicle.engineStatus = isCritical ? resolvedEvent : 'NORMAL';

  if (resolvedEvent === 'EMERGENCY_STOP' || resolvedEvent === 'ENGINE_FAULT') {
    vehicle.status = 'EMERGENCY';
    vehicle.speedKmh = 0;
  }

  const telemetryRecord = {
    id: `tel-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    vehicleId: vehicle.id,
    licensePlate: vehicle.licensePlate,
    latitude: lat,
    longitude: lng,
    speedKmh: Number(speedKmh),
    batteryLevel: Number(batteryLevel),
    engineTempC: Number(engineTempC),
    event: resolvedEvent,
    critical: isCritical,
    timestamp
  };

  store.telemetry.unshift(telemetryRecord);

  // Trigger SMS Notification to Fleet Administrator if critical event
  let smsNotification = null;
  if (isCritical) {
    const details = `Battery: ${batteryLevel}%, EngineTemp: ${engineTempC}C, Speed: ${speedKmh}km/h`;
    smsNotification = smsProvider.notifyCriticalVehicleEvent({
      vehicle,
      event: resolvedEvent,
      details,
      simulateFailure: Boolean(simulateSmsFailure)
    });
  }

  return res.status(201).json({
    success: true,
    message: isCritical
      ? `Telemetry stored and critical SMS alert triggered for event: ${resolvedEvent}`
      : 'Vehicle telemetry and GPS coordinates stored successfully',
    data: {
      telemetry: telemetryRecord,
      vehicleLocation: vehicle.location,
      smsNotification
    }
  });
});

/**
 * GET /api/telemetry
 * Retrieve telemetry records (filterable by vehicleId and critical flag)
 */
router.get('/', (req, res) => {
  const { vehicleId, critical } = req.query;
  const store = getStore();

  let records = [...store.telemetry];
  if (vehicleId) {
    records = records.filter((t) => t.vehicleId === vehicleId);
  }
  if (critical !== undefined) {
    const isCrit = critical === 'true' || critical === '1';
    records = records.filter((t) => t.critical === isCrit);
  }

  return res.status(200).json({
    success: true,
    count: records.length,
    data: records
  });
});

/**
 * GET /api/telemetry/:vehicleId
 * Retrieve telemetry history for a specific vehicle
 */
router.get('/:vehicleId', (req, res) => {
  const store = getStore();
  const records = store.telemetry.filter((t) => t.vehicleId === req.params.vehicleId);

  return res.status(200).json({
    success: true,
    vehicleId: req.params.vehicleId,
    count: records.length,
    data: records
  });
});

module.exports = router;

