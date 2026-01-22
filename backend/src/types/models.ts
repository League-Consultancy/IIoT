import { Types } from 'mongoose';

// Role types
export type UserRole = 'user' | 'programmer' | 'admin';

// Tenant theme configuration
export interface TenantTheme {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
    companyName: string;
}

// Base document interface
export interface BaseDocument {
    _id: Types.ObjectId;
    created_at: Date;
    updated_at: Date;
}

// Tenant
export interface ITenant extends BaseDocument {
    name: string;
    slug: string;
    theme: TenantTheme;
    is_active: boolean;
}

// Factory
export interface IFactory extends Omit<BaseDocument, 'updated_at'> {
    tenant_id: Types.ObjectId;
    name: string;
    location: string;
}

// Device
export interface IDevice extends BaseDocument {
    tenant_id: Types.ObjectId;
    factory_id: Types.ObjectId;
    device_id: string;
    name: string;
    firmware_version?: string;
    registered_at: Date;
    metadata?: Record<string, unknown>;
    is_active: boolean;
}

// Device Session (immutable)
export interface IDeviceSession {
    _id: Types.ObjectId;
    tenant_id: Types.ObjectId;
    factory_id: Types.ObjectId;
    device_id: string;
    start_time: Date;
    stop_time: Date;
    duration_ms: number;
    ingested_at: Date;
    // Time-series metadata
    metadata?: {
        tenant_id: Types.ObjectId;
        factory_id: Types.ObjectId;
        device_id: string;
    };
}

// User
export interface IUser extends BaseDocument {
    tenant_id: Types.ObjectId;
    email: string;
    password_hash: string;
    name: string;
    role: UserRole;
    device_permissions: Types.ObjectId[];
    last_login?: Date;
    is_active: boolean;
}

// Audit Log (immutable)
export interface IAuditLog {
    _id: Types.ObjectId;
    tenant_id: Types.ObjectId;
    actor_id: Types.ObjectId;
    actor_type: 'user' | 'device' | 'system';
    action: string;
    resource_type: string;
    resource_id: string;
    details?: Record<string, unknown>;
    ip_address?: string;
    user_agent?: string;
    timestamp: Date;
}

// Export Job
export interface IExportJob {
    _id: Types.ObjectId;
    tenant_id: Types.ObjectId;
    user_id: Types.ObjectId;
    device_id: string;
    format: 'csv' | 'xlsx' | 'json';
    date_from: Date;
    date_to: Date;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    file_path?: string;
    file_size?: number;
    record_count?: number;
    error_message?: string;
    created_at: Date;
    completed_at?: Date;
    expires_at?: Date;
}
