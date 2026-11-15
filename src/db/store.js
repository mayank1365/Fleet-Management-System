const bcrypt = require('bcryptjs');

const passwordHashAdmin = bcrypt.hashSync('Admin@123', 8);
const passwordHashDriver = bcrypt.hashSync('Driver@123', 8);

const getInitialData = () => ({
  users: [
    {
      id: 'usr-admin-001',
      name: 'Mayank Gupta',
      studentId: '23ebcs737',
      email: 'mayank.admin@fleetops.io',
      passwordHash: passwordHashAdmin,
      role: 'admin',
      phone: '+919876543210',
      createdAt: '2026-11-15T08:00:00.000Z'
    },
    {
      id: 'usr-driver-002',
      name: 'Rajesh Sharma',
      email: 'rajesh.driver@fleetops.io',
      passwordHash: passwordHashDriver,
      role: 'driver',
      phone: '+919811122233',
      createdAt: '2026-11-15T08:05:00.000Z'
    },
    {
      id: 'usr-viewer-003',
      name: 'Anita Desai',
      email: 'anita.viewer@fleetops.io',
      passwordHash: passwordHashDriver,
      role: 'viewer',
      phone: '+919844455566',
      createdAt: '2026-11-15T08:10:00.000Z'
    }
  ],
  vehicles: [
    {
      id: 'veh-101',
      vin: 'MA1TA2MKX20261001',
      licensePlate: 'DL-01-AB-1001',
      model: 'Tata Prima E.28K Electric Truck',
      type: 'Heavy Truck',
      driverName: 'Rajesh Sharma',
      driverPhone: '+919811122233',
      status: 'ACTIVE',
      address: 'Connaught Place, New Delhi, India',
      location: {
        latitude: 28.6315,
        longitude: 77.2167,
        updatedAt: '2026-11-15T09:00:00.000Z'
      },
      batteryLevel: 84,
      speedKmh: 48,
      engineStatus: 'NORMAL',
      createdAt: '2026-11-15T08:15:00.000Z'
    },
    {
      id: 'veh-102',
      vin: 'MA1TA2MKX20261002',
      licensePlate: 'DL-02-CD-2045',
      model: 'Ashok Leyland Boss 14T EV',
      type: 'Medium Cargo Van',
      driverName: 'Vikram Singh',
      driverPhone: '+919822233344',
      status: 'ACTIVE',
      address: 'India Gate, New Delhi, India',
      location: {
        latitude: 28.6129,
        longitude: 77.2295,
        updatedAt: '2026-11-15T09:05:00.000Z'
      },
      batteryLevel: 76,
      speedKmh: 42,
      engineStatus: 'NORMAL',
      createdAt: '2026-11-15T08:16:00.000Z'
    },
    {
      id: 'veh-103',
      vin: 'MA1TA2MKX20261003',
      licensePlate: 'DL-03-EF-3099',
      model: 'Mahindra Treo Zor Cargo',
      type: 'Last-Mile EV',
      driverName: 'Suresh Verma',
      driverPhone: '+919833344455',
      status: 'MAINTENANCE',
      address: 'Karol Bagh, New Delhi, India',
      location: {
        latitude: 28.6514,
        longitude: 77.1907,
        updatedAt: '2026-11-15T09:10:00.000Z'
      },
      batteryLevel: 14,
      speedKmh: 0,
      engineStatus: 'LOW_BATTERY',
      createdAt: '2026-11-15T08:18:00.000Z'
    },
    {
      id: 'veh-104',
      vin: 'MA1TA2MKX20261004',
      licensePlate: 'HR-26-GH-7788',
      model: 'Eicher Pro 2055 EV',
      type: 'Logistics Carrier',
      driverName: 'Amit Patel',
      driverPhone: '+919855566677',
      status: 'ACTIVE',
      address: 'Cyber Hub, Gurugram, Haryana, India',
      location: {
        latitude: 28.4950,
        longitude: 77.0895,
        updatedAt: '2026-11-15T09:12:00.000Z'
      },
      batteryLevel: 91,
      speedKmh: 62,
      engineStatus: 'NORMAL',
      createdAt: '2026-11-15T08:20:00.000Z'
    },
    {
      id: 'veh-105',
      vin: 'MA1TA2MKX20261005',
      licensePlate: 'UP-16-JK-5521',
      model: 'Tata Ace EV Logistics',
      type: 'Light Commercial Vehicle',
      driverName: 'Deepak Yadav',
      driverPhone: '+919877788899',
      status: 'EMERGENCY',
      address: 'Sector 18, Noida, Uttar Pradesh, India',
      location: {
        latitude: 28.5708,
        longitude: 77.3260,
        updatedAt: '2026-11-15T09:15:00.000Z'
      },
      batteryLevel: 35,
      speedKmh: 0,
      engineStatus: 'ENGINE_FAULT',
      createdAt: '2026-11-15T08:25:00.000Z'
    }
  ],
  telemetry: [
    {
      id: 'tel-501',
      vehicleId: 'veh-101',
      latitude: 28.6315,
      longitude: 77.2167,
      speedKmh: 48,
      batteryLevel: 84,
      engineTempC: 78,
      event: 'NORMAL_HEARTBEAT',
      critical: false,
      timestamp: '2026-11-15T09:00:00.000Z'
    },
    {
      id: 'tel-502',
      vehicleId: 'veh-103',
      latitude: 28.6514,
      longitude: 77.1907,
      speedKmh: 0,
      batteryLevel: 14,
      engineTempC: 82,
      event: 'LOW_BATTERY',
      critical: true,
      timestamp: '2026-11-15T09:10:00.000Z'
    },
    {
      id: 'tel-503',
      vehicleId: 'veh-105',
      latitude: 28.5708,
      longitude: 77.3260,
      speedKmh: 0,
      batteryLevel: 35,
      engineTempC: 118,
      event: 'ENGINE_FAULT',
      critical: true,
      timestamp: '2026-11-15T09:15:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'notif-901',
      sid: 'SM8a91b2c3d4e5f60001a2b3c4d5e6f701',
      provider: 'Twilio-Mock-Sandbox',
      vehicleId: 'veh-103',
      licensePlate: 'DL-03-EF-3099',
      recipientPhone: '+919876543210',
      recipientRole: 'Fleet Administrator',
      eventType: 'LOW_BATTERY',
      message: '[FLEET CRITICAL ALERT] Vehicle DL-03-EF-3099 (veh-103) reported LOW_BATTERY (14%) at (28.6514, 77.1907) - Karol Bagh, New Delhi.',
      status: 'sent',
      timestamp: '2026-11-15T09:10:01.000Z'
    },
    {
      id: 'notif-902',
      sid: 'SM8a91b2c3d4e5f60001a2b3c4d5e6f702',
      provider: 'Twilio-Mock-Sandbox',
      vehicleId: 'veh-105',
      licensePlate: 'UP-16-JK-5521',
      recipientPhone: '+919876543210',
      recipientRole: 'Fleet Administrator',
      eventType: 'ENGINE_FAULT',
      message: '[FLEET CRITICAL ALERT] Vehicle UP-16-JK-5521 (veh-105) reported ENGINE_FAULT (Temp: 118C) at (28.5708, 77.3260) - Sector 18, Noida.',
      status: 'sent',
      timestamp: '2026-11-15T09:15:01.000Z'
    },
    {
      id: 'notif-903',
      sid: 'SM8a91b2c3d4e5f60001a2b3c4d5e6f703',
      provider: 'Twilio-Mock-Sandbox',
      vehicleId: 'veh-103',
      licensePlate: 'DL-03-EF-3099',
      recipientPhone: '+919833344455',
      recipientRole: 'Assigned Driver / Operations',
      eventType: 'STATUS_CHANGE',
      message: '[FLEET STATUS UPDATE] Vehicle DL-03-EF-3099 operational status changed from ACTIVE to MAINTENANCE.',
      status: 'sent',
      timestamp: '2026-11-15T09:11:00.000Z'
    }
  ]
});

let store = getInitialData();

function resetStore() {
  store = getInitialData();
  return store;
}

function getStore() {
  return store;
}

module.exports = {
  getStore,
  resetStore
};
