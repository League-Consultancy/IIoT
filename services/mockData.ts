
import { Device, DeviceStatus, TelemetryPoint, Factory, Firmware, User, UserRole, Notification } from "../types";

export const MOCK_FACTORIES: Factory[] = [
  {
    id: "fac_alpha",
    tenantId: "t_tesla",
    name: "Austin Giga (Alpha)",
    timezone: "America/Chicago",
    location: "Austin, TX, USA",
    image: "https://images.unsplash.com/photo-1565514020176-88863c1a32a6?auto=format&fit=crop&q=80&w=1000"
  },
  {
    id: "fac_beta",
    tenantId: "t_tesla",
    name: "Berlin Giga (Beta)",
    timezone: "Europe/Berlin",
    location: "Grünheide, Germany",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000"
  }
];

export const MOCK_DEVICES: Device[] = [
  {
    id: "dev_001",
    serialNumber: "SN-ESP32-9901",
    factoryId: "fac_alpha",
    name: "CNC Milling Unit A",
    status: DeviceStatus.ONLINE,
    firmwareVersion: "1.2.4",
    lastSeen: new Date().toISOString(),
    totalRunningHours: 1402.5,
    metadata: { model: "Haas VF-2" }
  },
  {
    id: "dev_002",
    serialNumber: "SN-ESP32-9902",
    factoryId: "fac_alpha",
    name: "Injection Molder 4",
    status: DeviceStatus.MAINTENANCE,
    firmwareVersion: "1.2.4",
    lastSeen: new Date(Date.now() - 3600000 * 4).toISOString(),
    totalRunningHours: 8900.2,
    metadata: { model: "Sumitomo" }
  },
  {
    id: "dev_003",
    serialNumber: "SN-ESP32-9905",
    factoryId: "fac_beta",
    name: "Conveyor Belt Main",
    status: DeviceStatus.OFFLINE,
    firmwareVersion: "1.1.0",
    lastSeen: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    totalRunningHours: 500.1,
    metadata: { model: "Bosch" }
  },
  {
    id: "dev_004",
    serialNumber: "SN-ESP32-9908",
    factoryId: "fac_beta",
    name: "Robotic Arm Z",
    status: DeviceStatus.ONLINE,
    firmwareVersion: "1.2.5-beta",
    lastSeen: new Date().toISOString(),
    totalRunningHours: 230.5,
    metadata: { model: "Kuka" }
  }
];

export const MOCK_FIRMWARE: Firmware[] = [
  {
    id: "fw_003",
    version: "1.2.5-beta",
    releaseDate: "2023-11-15",
    size: "1.2 MB",
    checksum: "sha256:9f86d081884c7d659a2feaa0c55ad015",
    status: "BETA",
    description: "Improved telemetry buffer handling for unstable networks."
  },
  {
    id: "fw_002",
    version: "1.2.4",
    releaseDate: "2023-10-01",
    size: "1.1 MB",
    checksum: "sha256:e3b0c44298fc1c149afbf4c8996fb924",
    status: "STABLE",
    description: "Critical security patch for MQTT authentication."
  },
  {
    id: "fw_001",
    version: "1.1.0",
    releaseDate: "2023-08-20",
    size: "1.0 MB",
    checksum: "sha256:5994471abb01112afcc18159f6cc74b4",
    status: "DEPRECATED",
    description: "Initial stable release."
  }
];

export const MOCK_USERS: User[] = [
  {
    id: "u_123",
    email: "admin@tesla-gigafactory.com",
    role: UserRole.ADMIN,
    tenantId: "t_tesla",
    factoryIds: ["fac_alpha", "fac_beta"],
    lastLogin: new Date().toISOString()
  },
  {
    id: "u_456",
    email: "eng.lead@tesla-gigafactory.com",
    role: UserRole.PROGRAMMER,
    tenantId: "t_tesla",
    factoryIds: ["fac_alpha"],
    lastLogin: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "u_789",
    email: "operator.01@tesla-gigafactory.com",
    role: UserRole.USER,
    tenantId: "t_tesla",
    factoryIds: ["fac_beta"],
    lastLogin: new Date(Date.now() - 172800000).toISOString()
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Device Offline",
    message: "Conveyor Belt Main in Berlin Giga (Beta) has gone offline.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: "ERROR",
    read: false
  },
  {
    id: "n2",
    title: "Firmware Update Successful",
    message: "CNC Milling Unit A updated to v1.2.4 successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: "SUCCESS",
    read: true
  },
  {
    id: "n3",
    title: "Maintenance Reminder",
    message: "Injection Molder 4 is due for scheduled maintenance.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: "WARNING",
    read: true
  },
  {
    id: "n4",
    title: "System Performance",
    message: "Weekly analytics report is ready for download.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    type: "INFO",
    read: true
  }
];

export const generateMockTelemetry = (count: number): TelemetryPoint[] => {
  const data: TelemetryPoint[] = [];
  const now = Date.now();
  let currentState = 0;
  
  for (let i = count; i > 0; i--) {
    // Switch state every ~10 points randomly
    if (Math.random() > 0.9) currentState = currentState === 0 ? 1 : 0;
    
    data.push({
      timestamp: new Date(now - i * 60000).toISOString(),
      value: currentState,
      type: 'STATE'
    });
  }
  return data;
};

export const generateMockRuntime = () => {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: Math.floor(Math.random() * 12) + 4
    });
  }
  return data;
};
