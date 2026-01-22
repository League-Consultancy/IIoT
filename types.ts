
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER',
  PROGRAMMER = 'PROGRAMMER',
  USER = 'USER',
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
  DISABLED = 'DISABLED', // Security lockout
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'ENTERPRISE' | 'STANDARD';
  branding: {
    primaryColor: string;
    logoUrl?: string;
  };
}

export interface Factory {
  id: string;
  tenantId: string;
  name: string;
  timezone: string;
  location: string;
  image?: string;
}

export interface Device {
  id: string;
  serialNumber: string;
  factoryId: string;
  name: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string; // ISO Date
  totalRunningHours: number;
  metadata: Record<string, any>;
}

export interface TelemetryPoint {
  timestamp: string;
  value: number; // 0 or 1 for Binary State, or Amps for raw
  type: 'STATE' | 'CURRENT' | 'RUNTIME_DELTA';
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  tenantId: string;
  factoryIds: string[]; // Access scope
  lastLogin?: string;
}

export interface Firmware {
  id: string;
  version: string;
  releaseDate: string;
  size: string;
  checksum: string;
  status: 'STABLE' | 'BETA' | 'DEPRECATED';
  description: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  read: boolean;
}

// In-app dashboard state types
export interface DashboardFilter {
  timeRange: '1h' | '24h' | '7d' | '30d';
  factoryId?: string;
}

export type Page = 'dashboard' | 'factories' | 'devices' | 'ota' | 'admin' | 'factory-details' | 'device-details' | 'notifications';
