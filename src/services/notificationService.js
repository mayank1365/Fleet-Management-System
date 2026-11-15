const express = require('express');
const { getStore } = require('../db/store');
const smsProvider = require('./smsProvider');

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieve SMS notification logs (supports filtering by status, vehicleId, eventType)
 */
router.get('/', (req, res) => {
  const { status, vehicleId, eventType } = req.query;
  const store = getStore();

  let notifications = [...store.notifications];
  if (status) {
    notifications = notifications.filter((n) => n.status.toLowerCase() === status.toLowerCase());
  }
  if (vehicleId) {
    notifications = notifications.filter((n) => n.vehicleId === vehicleId);
  }
  if (eventType) {
    notifications = notifications.filter(
      (n) => n.eventType && n.eventType.toUpperCase() === eventType.toUpperCase()
    );
  }

  return res.status(200).json({
    success: true,
    count: notifications.length,
    summary: {
      total: store.notifications.length,
      sent: store.notifications.filter((n) => n.status === 'sent').length,
      failed: store.notifications.filter((n) => n.status === 'failed').length
    },
    data: notifications
  });
});

/**
 * POST /api/notifications/send
 * Send an SMS notification via the Mock Twilio/SMS Stub service and record status (sent/failed)
 */
router.post('/send', (req, res) => {
  const {
    vehicleId,
    licensePlate,
    recipientPhone,
    recipientRole,
    eventType = 'MANUAL_ALERT',
    message,
    simulateFailure = false
  } = req.body;

  if (!recipientPhone || !message) {
    return res.status(400).json({
      success: false,
      error: 'ValidationError',
      message: 'Both "recipientPhone" and "message" are required to send an SMS notification.'
    });
  }

  const record = smsProvider.sendSms({
    vehicleId: vehicleId || null,
    licensePlate: licensePlate || 'N/A',
    recipientPhone,
    recipientRole: recipientRole || 'Fleet Administrator',
    eventType,
    message,
    simulateFailure: Boolean(simulateFailure)
  });

  const statusCode = record.status === 'sent' ? 201 : 200;
  return res.status(statusCode).json({
    success: record.status === 'sent',
    message:
      record.status === 'sent'
        ? 'SMS notification dispatched and recorded as sent'
        : `SMS notification recorded as failed: ${record.errorReason}`,
    data: record
  });
});

module.exports = router;
