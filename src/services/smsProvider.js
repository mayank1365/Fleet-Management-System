const crypto = require('crypto');
const config = require('../config');
const { getStore } = require('../db/store');

/**
 * Mock SMS Service (Twilio Sandbox / Custom SMS Stub)
 * - Simulates sending SMS via Twilio REST API
 * - Validates E.164 phone numbers
 * - Logs every notification attempt with status ('sent' or 'failed') in the store
 */
class MockSmsProvider {
  constructor() {
    this.providerName = 'Twilio-Mock-Sandbox';
  }

  generateSid() {
    return 'SM' + crypto.randomBytes(16).toString('hex');
  }

  isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;
    // Standard E.164 or 10-15 digit phone format; reject explicit invalid markers
    if (phone.includes('INVALID') || phone === '0000') return false;
    return /^\+?[1-9]\d{7,14}$/.test(phone.replace(/[\s-]/g, ''));
  }

  /**
   * Send an SMS notification and record status ('sent' | 'failed') in datastore
   */
  sendSms({
    vehicleId = null,
    licensePlate = 'N/A',
    recipientPhone,
    recipientRole = 'Fleet Administrator',
    eventType = 'SYSTEM_ALERT',
    message,
    simulateFailure = false
  }) {
    const store = getStore();
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    const phoneValid = this.isValidPhone(recipientPhone);
    const shouldFail = simulateFailure || !phoneValid || !message;

    const record = {
      id,
      sid: shouldFail ? null : this.generateSid(),
      provider: this.providerName,
      vehicleId,
      licensePlate,
      recipientPhone: recipientPhone || 'UNKNOWN',
      recipientRole,
      eventType,
      message: message || '',
      status: shouldFail ? 'failed' : 'sent',
      errorReason: shouldFail
        ? !phoneValid
          ? 'Invalid recipient phone number format (E.164 required)'
          : !message
          ? 'Empty SMS message body'
          : 'Simulated upstream SMS gateway delivery failure'
        : null,
      timestamp
    };

    store.notifications.unshift(record);
    return record;
  }

  /**
   * Trigger critical vehicle event SMS to Fleet Administrator
   */
  notifyCriticalVehicleEvent({ vehicle, event, details = '', simulateFailure = false }) {
    const coords = vehicle.location
      ? `(${vehicle.location.latitude}, ${vehicle.location.longitude})`
      : 'Unknown coordinates';
    const message = `[FLEET CRITICAL ALERT] Vehicle ${vehicle.licensePlate} (${vehicle.id}) reported ${event}${
      details ? ` (${details})` : ''
    } at ${coords} - ${vehicle.address || 'In Transit'}. Immediate attention required.`;

    return this.sendSms({
      vehicleId: vehicle.id,
      licensePlate: vehicle.licensePlate,
      recipientPhone: config.ADMIN_PHONE,
      recipientRole: 'Fleet Administrator',
      eventType: event,
      message,
      simulateFailure
    });
  }

  /**
   * Trigger operational status change SMS to Fleet Administrator & Relevant User/Driver
   */
  notifyStatusChange({ vehicle, previousStatus, newStatus, recipientPhone, simulateFailure = false }) {
    const targetPhone = recipientPhone || vehicle.driverPhone || config.ADMIN_PHONE;
    const message = `[FLEET STATUS UPDATE] Vehicle ${vehicle.licensePlate} (${vehicle.id}) operational status changed from ${previousStatus} to ${newStatus}.`;

    const driverOrUserNotif = this.sendSms({
      vehicleId: vehicle.id,
      licensePlate: vehicle.licensePlate,
      recipientPhone: targetPhone,
      recipientRole: 'Assigned Driver / Operations',
      eventType: 'STATUS_CHANGE',
      message,
      simulateFailure
    });

    // If new status is EMERGENCY or OUT_OF_SERVICE, also alert the Fleet Administrator directly
    let adminNotif = null;
    if (
      (newStatus === 'EMERGENCY' || newStatus === 'OUT_OF_SERVICE' || newStatus === 'MAINTENANCE') &&
      targetPhone !== config.ADMIN_PHONE
    ) {
      adminNotif = this.sendSms({
        vehicleId: vehicle.id,
        licensePlate: vehicle.licensePlate,
        recipientPhone: config.ADMIN_PHONE,
        recipientRole: 'Fleet Administrator',
        eventType: 'STATUS_CHANGE_ADMIN_ALERT',
        message: `[ADMIN DISPATCH ALERT] Vehicle ${vehicle.licensePlate} (${vehicle.id}) transitioned from ${previousStatus} -> ${newStatus}. Driver: ${vehicle.driverName || 'Unassigned'}.`,
        simulateFailure
      });
    }

    return {
      primaryNotification: driverOrUserNotif,
      adminNotification: adminNotif
    };
  }
}

module.exports = new MockSmsProvider();

